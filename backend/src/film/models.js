import fs from 'fs';
import path from 'path';
import { modelUrl, postJson, downloadGcs } from './gcp.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Extra regions to spread image requests over when the production's own region is rate-limited.
const IMAGE_REGIONS = ['global', 'us-east4', 'us-west1', 'europe-west4', 'europe-west1'];

function mimeOf(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function inlineImage(file) {
  return { inlineData: { mimeType: mimeOf(file), data: fs.readFileSync(file).toString('base64') } };
}

function parseJsonText(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

/**
 * Ask a Gemini text model for a JSON object. Throws on truncation rather than returning
 * a partial plan, because a silently shortened shot list would drop script lines.
 */
export async function generateJson({ model, location, prompt, temperature = 0.3, maxOutputTokens = 32768 }) {
  const data = await postJson(modelUrl(model, 'generateContent', location), {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature, maxOutputTokens },
  }, { timeoutMs: 300000 });

  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts || []).map((p) => p.text || '').join('');
  if (candidate?.finishReason === 'MAX_TOKENS') {
    throw new Error(`${model} response was cut off at the output limit; split the input into smaller pieces.`);
  }
  if (!text) {
    throw new Error(`${model} returned no text (finishReason: ${candidate?.finishReason || 'unknown'}).`);
  }
  try {
    return { data: parseJsonText(text), usage: data.usageMetadata || {} };
  } catch (err) {
    throw new Error(`${model} returned invalid JSON: ${err.message}. Start of response: ${text.slice(0, 200)}`);
  }
}

/**
 * Find when the on-screen character speaks in a clip, in seconds from its start. Used to place
 * a dubbed line over the stretch where the mouth is moving. Returns null if no speech is found.
 */
export async function locateSpeech({ model, location, file, line }) {
  const data = await postJson(modelUrl(model, 'generateContent', location), {
    contents: [{ role: 'user', parts: [
      { inlineData: { mimeType: 'video/mp4', data: fs.readFileSync(file).toString('base64') } },
      { text: `In this clip a character says: "${line}". Return JSON {"start": number, "end": number}: the time in seconds, to one decimal place, at which the character's mouth starts moving for the first spoken word, and the time at which the last spoken word ends. If nobody speaks, return {"start": null, "end": null}.` },
    ] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0 },
  }, { timeoutMs: 120000 });
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  // Read the two numbers directly: the model sometimes returns near-JSON such as 05.5 or 5.5s.
  const number = (key) => {
    const match = text.match(new RegExp(`"${key}"\\s*:\\s*"?(\\d+(?:\\.\\d+)?)`));
    return match ? parseFloat(match[1]) : NaN;
  };
  const start = number('start');
  const end = number('end');
  return Number.isFinite(start) && Number.isFinite(end) && end - start > 0.2 ? { start, end, usage: data.usageMetadata || {} } : null;
}

/**
 * Generate one image, optionally conditioned on reference images (given first, in order).
 * Returns the raw bytes; callers normalise size and format.
 */
export async function generateImage({ model, location, prompt, refImages = [], aspectRatio }) {
  const parts = [...refImages.map(inlineImage), { text: prompt }];
  const body = (withAspect) => ({
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      ...(withAspect && aspectRatio ? { imageConfig: { aspectRatio } } : {}),
    },
  });

  // Image quotas are per region and small. On a rate limit, move to the next region at once
  // instead of waiting out the minute; only when every region is limited, pause and go round again.
  const regions = [...new Set([location, ...IMAGE_REGIONS])];
  const usable = new Set(regions);
  let data;
  let lastErr;
  for (let round = 0; round < 6 && !data; round++) {
    if (round > 0) await sleep(20000);
    for (const region of regions.filter((r) => usable.has(r))) {
      try {
        try {
          data = await postJson(modelUrl(model, 'generateContent', region), body(true), { retries: 0 });
        } catch (err) {
          // Older image models reject imageConfig; the caller crops to the frame size anyway.
          if (err.status !== 400 || !/imageConfig|aspect/i.test(err.body || '')) throw err;
          data = await postJson(modelUrl(model, 'generateContent', region), body(false), { retries: 0 });
        }
        break;
      } catch (err) {
        lastErr = err;
        // The model is not offered in this region: stop trying it.
        if ([403, 404].includes(err.status) || (err.status === 400 && /not found|not supported|unsupported/i.test(err.body || ''))) usable.delete(region);
        else if (err.status === 400) throw err;
      }
    }
    if (!usable.size) break;
  }
  if (!data) throw lastErr;

  const candidate = data.candidates?.[0];
  const image = (candidate?.content?.parts || []).find((p) => p.inlineData?.data);
  if (!image) {
    const said = (candidate?.content?.parts || []).map((p) => p.text || '').join(' ').slice(0, 200);
    throw new Error(`${model} returned no image (finishReason: ${candidate?.finishReason || 'unknown'}). ${said}`);
  }
  return { buffer: Buffer.from(image.inlineData.data, 'base64'), mimeType: image.inlineData.mimeType || 'image/png' };
}

/**
 * Start a Veo image-to-video (or text-to-video) job and return its operation name.
 * Split from polling so the name can be saved first: a crashed run resumes the same
 * job instead of paying for a new one.
 */
export async function startVeo({ model, location, prompt, imagePath, durationSec, aspectRatio, resolution, generateAudio, negativePrompt, seed }) {
  const instance = { prompt };
  if (imagePath) {
    instance.image = { bytesBase64Encoded: fs.readFileSync(imagePath).toString('base64'), mimeType: mimeOf(imagePath) };
  }
  const data = await postJson(modelUrl(model, 'predictLongRunning', location), {
    instances: [instance],
    parameters: {
      sampleCount: 1,
      aspectRatio,
      durationSeconds: durationSec,
      resolution,
      generateAudio,
      ...(negativePrompt ? { negativePrompt } : {}),
      ...(Number.isInteger(seed) ? { seed } : {}),
    },
  }, { retries: 2 });
  if (!data.name) throw new Error(`Veo did not return an operation name: ${JSON.stringify(data).slice(0, 300)}`);
  return data.name;
}

/** Poll a Veo operation until it finishes; returns the video bytes. */
export async function pollVeo({ model, location, operation, timeoutMs = 12 * 60 * 1000, intervalMs = 8000 }) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(intervalMs);
    const data = await postJson(modelUrl(model, 'fetchPredictOperation', location), { operationName: operation });
    if (!data.done) continue;

    if (data.error) {
      const err = new Error(`Veo job failed: ${data.error.message || JSON.stringify(data.error)}`);
      err.code = 'VEO_FAILED';
      throw err;
    }
    const response = data.response || {};
    const video = response.videos?.[0] || response.generatedVideos?.[0]?.video || response.predictions?.[0];
    if (video?.bytesBase64Encoded) return Buffer.from(video.bytesBase64Encoded, 'base64');
    if (video?.gcsUri || video?.uri) return downloadGcs(video.gcsUri || video.uri);

    const reasons = (response.raiMediaFilteredReasons || []).join('; ');
    const err = new Error(`Veo finished without a video${reasons ? ` (filtered: ${reasons})` : ''}.`);
    err.code = 'VEO_FILTERED';
    throw err;
  }
  const err = new Error(`Veo job still running after ${Math.round(timeoutMs / 60000)} minutes; re-run to resume polling.`);
  err.code = 'VEO_TIMEOUT';
  throw err;
}
