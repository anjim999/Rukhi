// Correct one thing in a shot's selected still and leave the rest alone (a stray strap, a missing
// cup). Saves the result as a new take and selects it; the take it came from is kept.
// usage: node productions/tools/edit-still.mjs <slug> <shot> "<what to change>"
import fs from 'fs';
import * as store from '../../backend/src/film/store.js';
import { generateImage } from '../../backend/src/film/models.js';
import { fitImageToFrame, frameSize } from '../../backend/src/film/ffmpeg.js';
import { assertBudget, imageCost, record } from '../../backend/src/film/ledger.js';

const [slug, shotId, change] = process.argv.slice(2);
if (!change) throw new Error('usage: edit-still.mjs <slug> <shot> "<what to change>"');

const film = store.loadFilm(slug);
const scene = store.loadScene(slug, shotId.split('-')[0]);
const shot = scene.shots.find((s) => s.id === shotId);
const current = shot?.keyframes.find((k) => k.take === shot.selectedKeyframe);
if (!current) throw new Error(`${shotId} has no selected still.`);

const prompt = `Edit this film frame and return the edited picture.
THE ONLY CHANGE: ${change}
Everything else stays EXACTLY as it is: every face, hairstyle, body, pose, expression, the rest of the clothing, every object, the background, the lighting, the colour grade, the framing and the camera position. Do not redraw or restyle anyone. Nobody gains or loses facial hair. No text, captions, borders or watermarks.`;

assertBudget(film, imageCost(film), `corrected still for ${shotId}`);
const { buffer } = await generateImage({ model: film.settings.imageModel, location: film.settings.location, prompt, refImages: [store.abs(slug, current.file)], aspectRatio: film.settings.aspectRatio });

const take = shot.keyframes.length + 1;
const file = `shots/${scene.id}/${shotId}/kf_t${take}.jpg`;
const raw = store.abs(slug, file).replace(/\.jpg$/, '_raw.png');
fs.writeFileSync(raw, buffer);
await fitImageToFrame(raw, store.abs(slug, file), frameSize(film.settings.aspectRatio, film.settings.resolution));
fs.rmSync(raw, { force: true });
shot.keyframes.push({ take, file, at: new Date().toISOString(), editedFrom: current.take, change });
shot.selectedKeyframe = take;
store.saveScene(slug, scene);
record(film, { kind: 'image', model: film.settings.imageModel, units: 1, costUsd: imageCost(film), ref: `keyframe:${shotId}` });
console.log(`${shotId}: still take ${take} = take ${current.take}, edited.`);
