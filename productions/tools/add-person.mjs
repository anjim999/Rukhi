// Build a two-person still by adding one character to an approved one-person still.
// Asking for two people at once redraws both faces and one of them drifts (Arjun grew a beard
// twice in Episode 2); editing a finished picture leaves the person already in it alone.
//
// usage: node productions/tools/add-person.mjs <slug> <baseShot> <toShot> <CHARACTER_ID> "<where and how the new person stands>"
import fs from 'fs';
import path from 'path';
import * as store from '../../backend/src/film/store.js';
import { generateImage } from '../../backend/src/film/models.js';
import { fitImageToFrame, frameSize } from '../../backend/src/film/ffmpeg.js';
import { assertBudget, imageCost, record } from '../../backend/src/film/ledger.js';

const [slug, baseId, toId, characterId, placement] = process.argv.slice(2);
if (!placement) throw new Error('usage: add-person.mjs <slug> <baseShot> <toShot> <CHARACTER_ID> "<placement>"');

const film = store.loadFilm(slug);
const sceneOf = (id) => store.loadScene(slug, id.split('-')[0]);
const baseShot = sceneOf(baseId).shots.find((s) => s.id === baseId);
const base = baseShot?.keyframes.find((k) => k.take === baseShot.selectedKeyframe);
if (!base) throw new Error(`${baseId} has no selected still.`);
const character = film.bible.characters.find((c) => c.id === characterId);
if (!character) throw new Error(`No character ${characterId}.`);

const refs = [store.abs(slug, base.file), store.abs(slug, character.look || character.ref)];
if (character.views?.closeup) refs.push(store.abs(slug, character.views.closeup));

const prompt = `Edit IMAGE 1 by adding one more person to it. Return the edited picture.
IMAGE 1 is a finished film frame. Keep everything already in it EXACTLY as it is: the man's face, hair, skin, expression, pose and clothes, the background, the lighting, the colour grade and the framing. Do not redraw, restyle, age or otherwise change the man in any way; he has no beard and must not gain one.
IMAGE 2${refs.length > 2 ? ' and IMAGE 3 show' : ' shows'} the person to add: ${character.name} (${character.appearance}). Match her face, hair, skin tone, body and clothing exactly${refs.length > 2 ? '; IMAGE 3 is a close-up of the same face' : ''}. Ignore the backgrounds of those images.
WHERE SHE IS: ${placement}
SCALE — the most important thing: she is an adult woman standing right beside him, exactly as close to the camera as he is, not behind him and not further away. Her face is the same size in the picture as his face. The top of her head is level with his chin or mouth, and she is cut off by the bottom of the frame at the same place on her body as he is. She must not look small, distant or childlike.
She is lit by the same light as the man, with natural contact shadows. The result contains exactly two people. No text, captions, borders or watermarks.`;

assertBudget(film, imageCost(film), `two-person still for ${toId}`);
const { buffer } = await generateImage({ model: film.settings.imageModel, location: film.settings.location, prompt, refImages: refs, aspectRatio: film.settings.aspectRatio });

const scene = sceneOf(toId);
const shot = scene.shots.find((s) => s.id === toId);
if (!shot) throw new Error(`Shot ${toId} not found.`);
const take = shot.keyframes.length + 1;
const file = `shots/${scene.id}/${toId}/kf_t${take}.jpg`;
const raw = store.abs(slug, file).replace(/\.jpg$/, '_raw.png');
fs.mkdirSync(path.dirname(raw), { recursive: true });
fs.writeFileSync(raw, buffer);
await fitImageToFrame(raw, store.abs(slug, file), frameSize(film.settings.aspectRatio, film.settings.resolution));
fs.rmSync(raw, { force: true });
shot.keyframes.push({ take, file, at: new Date().toISOString(), composedFrom: baseId, added: characterId });
shot.selectedKeyframe = take;
store.saveScene(slug, scene);
record(film, { kind: 'image', model: film.settings.imageModel, units: 1, costUsd: imageCost(film), ref: `keyframe:${toId}` });
console.log(`${toId}: still take ${take} = ${baseId} + ${character.name}.`);
