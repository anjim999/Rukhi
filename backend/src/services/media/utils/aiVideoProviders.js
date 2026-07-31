import dotenv from 'dotenv';
import path from 'path';

export async function generateViaFalAI({ prompt, referenceImageUrl, characterAnchor = '', characterSeed = null, model, aspectRatio, generateAIReferenceImage }) {
  try {
    const falEndpoint = model === 'ltx'
      ? 'fal-ai/ltx-video'
      : model === 'wan'
      ? 'fal-ai/wan-2.1'
      : model === 'kling'
      ? 'fal-ai/kling-video/v1.5/pro'
      : model === 'luma'
      ? 'fal-ai/luma-dream-machine'
      : model === 'runway'
      ? 'fal-ai/runway-gen3'
      : model === 'minimax' || model === 'hailuo'
      ? 'fal-ai/minimax-video'
      : model === 'cogvideo'
      ? 'fal-ai/cogvideox-5b'
      : 'fal-ai/hunyuan-video';

    console.log(`[AI VIDEO SERVICE] 🚀 Requesting Fal.ai API for model '${falEndpoint}'...`);
    const response = await fetch(`https://fal.run/${falEndpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `${characterAnchor ? `${characterAnchor}, ` : ''}${prompt}`,
        image_url: referenceImageUrl,
        aspect_ratio: aspectRatio,
        seed: characterSeed || undefined,
        num_frames: 81,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const videoUrl = data?.video?.url || data?.video_url;
      if (videoUrl) {
        console.log(`[AI VIDEO SERVICE] ✅ Generated 4K AI video via Fal.ai: ${videoUrl}`);
        return {
          success: true,
          videoUrl,
          isRealAIVideo: true,
        };
      }
    }
  } catch (err) {
    console.warn(`[AI VIDEO SERVICE] Fal.ai API error: ${err.message}`);
  }

  return await generateAIReferenceImage({ prompt, referenceImageUrl, characterAnchor, characterSeed, aspectRatio });
}

export async function generateViaColabGPU({ prompt, referenceImageUrl, characterAnchor = '', characterSeed = null, model, aspectRatio }) {
  try {
    dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
    const endpoint = process.env.AI_VIDEO_GPU_ENDPOINT;
    if (!endpoint) return null;

    console.log(`[AI VIDEO SERVICE] 🚀 Requesting Colab GPU endpoint '${endpoint}'...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Remainder': 'true',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'Vyapar360-AI-Engine/1.0',
      },
      body: JSON.stringify({
        prompt,
        referenceImageUrl,
        characterAnchor,
        characterSeed,
        model,
        aspectRatio,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawVideoUrl = data?.video_url || data?.videoUrl || data?.url;
      if (rawVideoUrl) {
        return {
          success: true,
          videoUrl: rawVideoUrl,
          isRealAIVideo: true,
        };
      }
    }
  } catch (err) {
    console.warn(`[AI VIDEO SERVICE] Colab GPU API error: ${err.message}`);
  }

  return null;
}
