// Probe: will Veo make a clip from this still? Costs one short clip if it passes.
// usage: node productions/tools/veo-probe.mjs <image> <outfile.mp4> "<name>" "<line, or empty for a silent clip>"
import fs from 'fs';
import { startVeo, pollVeo } from '../../backend/src/film/models.js';
const [image, out, name, line] = process.argv.slice(2);
const model = 'veo-3.1-lite-generate-001';
const prompt = line
  ? `Close-up. ${name} looks at the camera and says in Indian English: "${line}" Natural, subtle acting. No music.`
  : `Close-up. ${name} looks at the camera, blinks and gives a small smile. Nobody speaks. No music.`;
try {
  const operation = await startVeo({ model, location: 'us-central1', imagePath: image, durationSec: 4, aspectRatio: '9:16', resolution: '720p', generateAudio: true, prompt });
  fs.writeFileSync(out, await pollVeo({ model, location: 'us-central1', operation }));
  console.log(`PASS  ${line ? 'speaking' : 'silent  '} ${image}`);
} catch (err) {
  console.log(`BLOCK ${line ? 'speaking' : 'silent  '} ${image}: ${err.message.replace(/\s+/g, ' ').slice(0, 110)}`);
}
