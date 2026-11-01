// Judge every finished take of every video shot and select the best one.
//
// A take is disqualified if the spoken words differ from the script, music is present, or there
// is a visible defect (extra person, changing face, vanishing prop, on-screen text). Among the
// takes that pass, the one whose acting best follows the shot's performance direction wins.
// The judge is a model watching the clip, so its verdict is a first pass, not the last word:
// frame sheets are written next to the report for a human (or me) to look at.
//
// usage: node productions/tools/judge-takes.mjs <slug> [--no-select] [--shot S01-001]
import fs from 'fs';
import path from 'path';
import * as store from '../../backend/src/film/store.js';
import { ffmpeg, probe } from '../../backend/src/film/ffmpeg.js';
import { modelUrl, postJson } from '../../backend/src/film/gcp.js';

const [slug, ...flags] = process.argv.slice(2);
const select = !flags.includes('--no-select');
const only = flags.includes('--shot') ? flags[flags.indexOf('--shot') + 1] : null;
const outDir = store.abs(slug, 'out/judge');
fs.mkdirSync(outDir, { recursive: true });

async function judge(shot, clip, file) {
  const expected = shot.dialogue.map((d) => d.line).join(' ');
  const data = await postJson(modelUrl('gemini-3.5-flash', 'generateContent', 'global'), {
    contents: [{ role: 'user', parts: [
      { inlineData: { mimeType: 'video/mp4', data: fs.readFileSync(file).toString('base64') } },
      { text: `You are a strict film director reviewing one take of a shot from a realistic animated series.

THE SHOT: ${shot.action}
SCRIPT LINE: ${expected ? `"${expected}"` : '(no dialogue; nobody should speak)'}
ACTING DIRECTION, in order: ${shot.performance || shot.videoPrompt}

Watch and listen, then return JSON only:
{
  "spoken": string,            // the exact words spoken, or "" if none
  "wordsCorrect": boolean,     // spoken words equal the script line (ignore punctuation and case); true if no dialogue was expected and none was spoken
  "lipSync": number,           // 0-10: do the lips move in time with the words? 10 if no dialogue
  "music": boolean,            // is there any music at all?
  "defects": string,           // clear visible problems only: extra or duplicated person, a face that changes identity, a vanishing or teleporting object, distorted hands, readable on-screen text; "" if none
  "acting": number,            // 0-10: how well does the performance follow the direction? Low if the face is frozen, generic, or the beats are missing; high only if the emotional beats are clearly visible, in order, and feel human
  "exaggerated": boolean,      // is the acting cartoonish or over the top?
  "actingNotes": string        // one sentence: which beats landed and which were missing
}` },
    ] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0 },
  }, { timeoutMs: 180000 });
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
}

const film = store.loadFilm(slug);
const report = [];
for (const sceneId of film.sceneIds) {
  const scene = store.loadScene(slug, sceneId);
  let changed = false;
  for (const shot of scene.shots) {
    if (shot.kind === 'graphic' || (only && shot.id !== only)) continue;
    // Only takes made from the still currently selected are candidates.
    const takes = shot.clips.filter((c) => c.status === 'done' && c.file && (c.keyframeTake || shot.selectedKeyframe) === shot.selectedKeyframe);
    if (!takes.length) { report.push(`${shot.id} (${shot.label}): NO TAKES`); continue; }

    const results = [];
    for (const clip of takes) {
      const file = store.abs(slug, clip.file);
      const { duration } = await probe(file);
      const frames = Math.round(duration * 24);
      const picks = [3, Math.round(frames * 0.3), Math.round(frames * 0.6), frames - 5].map((n) => `eq(n\\,${n})`).join('+');
      await ffmpeg(['-i', file, '-filter_complex', `[0:v]select='${picks}',scale=-2:560,tile=4x1[v]`, '-map', '[v]', '-frames:v', '1', '-q:v', '4', path.join(outDir, `${shot.id}_t${clip.take}.jpg`)]);
      let verdict;
      try { verdict = await judge(shot, clip, file); } catch (err) { verdict = { error: err.message.slice(0, 120) }; }
      const passes = !verdict.error && verdict.wordsCorrect && !verdict.music && !verdict.defects && !verdict.exaggerated;
      const score = verdict.error ? -1 : (passes ? 100 : 0) + verdict.acting * 5 + verdict.lipSync;
      clip.judge = verdict;
      results.push({ clip, verdict, passes, score });
    }
    results.sort((a, b) => b.score - a.score);
    const best = results[0];
    if (select && best.clip.take !== shot.selectedClip) { shot.selectedClip = best.clip.take; }
    changed = true;

    report.push(`${shot.id} (${shot.label}) — ${shot.dialogue.map((d) => d.line).join(' ') || 'no dialogue'}\n` + results.map(({ clip, verdict, passes }) =>
      verdict.error ? `   take ${clip.take}: JUDGE ERROR ${verdict.error}` :
      `   take ${clip.take}${clip.take === shot.selectedClip ? ' [SELECTED]' : ''}: ${passes ? 'PASS' : 'FAIL'} acting ${verdict.acting}/10, lips ${verdict.lipSync}/10` +
      `${verdict.wordsCorrect ? '' : `, WORDS "${verdict.spoken}"`}${verdict.music ? ', MUSIC' : ''}${verdict.exaggerated ? ', EXAGGERATED' : ''}${verdict.defects ? `, DEFECT: ${verdict.defects}` : ''}\n      ${verdict.actingNotes}`).join('\n'));
  }
  if (changed) store.saveScene(slug, scene);
}
fs.writeFileSync(path.join(outDir, 'report.txt'), report.join('\n\n'));
console.log(report.join('\n\n'));
