// Draw a cast member from their written description alone, in the style of already-accepted CG
// cast images. For a character whose supplied photo-style sheet Veo will not animate: the image
// model, given that photo, returns the same photo however it is asked to restyle it.
//
// usage: node productions/tools/redesign-from-description.mjs <slug> <id> <styleBody.png> <styleFace.png>
import fs from 'fs';
import * as store from '../../backend/src/film/store.js';
import * as ledger from '../../backend/src/film/ledger.js';
import { generateImage } from '../../backend/src/film/models.js';

const [slug, id, styleBody, styleFace] = process.argv.slice(2);
const film = store.loadFilm(slug);
const character = film.bible.characters.find((c) => c.id === id);
const STYLE = 'A 3D computer-generated animated character with realistic adult anatomy, rendered exactly in the style of the attached ' +
  'image: smooth sculpted skin, clean modelled hair, soft even studio lighting, plain light-grey studio backdrop. Clearly an animated ' +
  'character, not a photograph.';

async function draw(name, prompt, refs) {
  ledger.assertBudget(film, ledger.imageCost(film), `redesign of ${id}`);
  const { buffer, mimeType } = await generateImage({ model: film.settings.imageModel, location: film.settings.location, prompt, refImages: refs, aspectRatio: '3:4' });
  const rel = `refs/characters/${id}/${name}.${mimeType.includes('jpeg') ? 'jpg' : 'png'}`;
  fs.writeFileSync(store.abs(slug, rel), buffer);
  ledger.record(film, { kind: 'image', model: film.settings.imageModel, units: 1, costUsd: ledger.imageCost(film), ref: `redesign:${id}:${name}` });
  return rel;
}

character.sheetLook = character.sheetLook || character.look || character.ref;
character.sheetViews = character.sheetViews || character.views;

const person = `${character.name}: ${character.appearance} He or she is unmistakably an adult of about 25, with a mature adult face and adult build.`;
const look = await draw('look_cg', `Character design for an animated series.
The attached image shows a DIFFERENT cast member; use it only for the rendering style, lighting, backdrop and framing. Do not copy that person's face, hair, body or clothes.
${STYLE}
NEW CHARACTER: ${person}
OUTFIT: ${character.episodeWardrobe || character.wardrobe}
Framing: one person only, full body from head to feet, standing upright, facing the camera, arms relaxed, neutral expression.
No text, labels, borders, watermarks or multiple panels.`, [styleBody]);

const closeup = await draw('closeup_cg', `Character design for an animated series. Two images are attached.
1. The approved full-body design of ${character.name}. Draw this same person.
2. A different cast member's portrait: use it only for framing and rendering style.
A front-facing head-and-shoulders portrait of the person in image 1: identical face, hair, skin tone and outfit. Neutral expression, looking at the camera.
${STYLE}
No text, labels, borders, watermarks or multiple panels.`, [store.abs(slug, look), styleFace]);

character.look = look;
character.views = { closeup };
store.saveFilm(film);
console.log(`${id} ${character.name}: redesigned from description.`);
