// Redraw photo-realistic cast members in the series' CG rendering style, keeping their identity.
//
// Why: Veo refuses to generate a *speaking* clip from a face that reads as a photograph of a real
// person (its output is filtered, or the input image is rejected). Cast sheets rendered as CG pass.
// This draws a CG full-body look and a CG face close-up for each named character, using an
// already-CG cast member as the style reference, and points the character at them.
//
// usage: node productions/tools/restyle-cast.mjs <slug> <styleCharacterId> <id> [<id> ...]
import fs from 'fs';
import * as store from '../../backend/src/film/store.js';
import * as ledger from '../../backend/src/film/ledger.js';
import { generateImage } from '../../backend/src/film/models.js';

// The style reference is a cast member of this production, or two image files given as body|face.
const [slug, styleId, ...ids] = process.argv.slice(2);
const film = store.loadFilm(slug);
const styleCharacter = film.bible.characters.find((c) => c.id === styleId);
const [styleBody, styleFace] = styleCharacter
  ? [store.abs(slug, styleCharacter.ref), store.abs(slug, styleCharacter.views.closeup)]
  : styleId.split('|');
// Deliberately worded as animation, with no "realistic" or "photo" language: with identity
// photos attached, anything softer comes back as the same photograph.
const STYLE = 'a stylised 3D animated film character, drawn exactly in the animation style of the STYLE image: smooth sculpted skin ' +
  'with no pores and no photographic texture, simplified shading, hair modelled as soft sculpted clumps, clean simplified facial ' +
  'detail, and soft even studio lighting. Adult body proportions. It is obviously an animated character and could never be ' +
  'mistaken for a photograph of a real person.';

async function draw(character, { prompt, refs, name }) {
  ledger.assertBudget(film, ledger.imageCost(film), `CG restyle of ${character.id}`);
  const { buffer, mimeType } = await generateImage({ model: film.settings.imageModel, location: film.settings.location, prompt, refImages: refs, aspectRatio: '3:4' });
  const rel = `refs/characters/${character.id}/${name}.${mimeType.includes('jpeg') ? 'jpg' : 'png'}`;
  fs.writeFileSync(store.abs(slug, rel), buffer);
  ledger.record(film, { kind: 'image', model: film.settings.imageModel, units: 1, costUsd: ledger.imageCost(film), ref: `restyle:${character.id}:${name}` });
  return rel;
}

for (const id of ids) {
  const character = film.bible.characters.find((c) => c.id === id);
  const body = store.abs(slug, character.sheetLook || character.look || character.ref);
  const face = store.abs(slug, (character.sheetViews || character.views).closeup);
  // Remember the producers' originals the first time, so a re-run always starts from them.
  character.sheetLook = character.sheetLook || character.look || character.ref;
  character.sheetViews = character.sheetViews || character.views;

  const identity = `Keep this exact person: the same face shape, eye shape and spacing, eyebrows, nose, lips, jawline, hairline, hairstyle and hair volume, skin tone, build, and the same clothing and accessories. The character is an ADULT in their mid-twenties with a mature adult face (defined cheekbones and jaw, adult facial proportions); never a teenager or a child.${process.env.RESTYLE_NOTE ? ' ' + process.env.RESTYLE_NOTE : ''}`;
  const look = await draw(character, {
    name: 'look_cg',
    refs: [body, face, styleBody],
    prompt: `Character design for an animated series. Three images are attached.
1. IDENTITY, full body: the character ${character.name}.
2. IDENTITY, face: a close-up of the same person.
3. STYLE ONLY: a different character from the same series. Do not copy this person's face, hair, body or clothes.
Redraw the person from images 1 and 2 in the rendering style of image 3: ${STYLE}
${identity}
CHARACTER: ${character.appearance}
OUTFIT (exactly as in image 1): ${character.episodeWardrobe || character.wardrobe}
Framing: one person only, full body from head to feet, standing upright, facing the camera, arms relaxed, neutral expression. Plain light-grey studio backdrop.
No text, labels, borders, watermarks or multiple panels.`,
  });
  const closeup = await draw(character, {
    name: 'closeup_cg',
    refs: [face, store.abs(slug, look), styleFace],
    prompt: `Character design for an animated series. Three images are attached.
1. IDENTITY: a close-up of the character ${character.name}'s face.
2. The same character's approved full-body CG design; match its rendering style and outfit.
3. STYLE ONLY: the face of a different character from the same series. Do not copy this person's features.
Draw a front-facing head-and-shoulders portrait of the person from image 1 in this style: ${STYLE}
${identity}
CHARACTER: ${character.appearance}
Neutral expression, looking at the camera. Plain light-grey studio backdrop.
No text, labels, borders, watermarks or multiple panels.`,
  });

  character.look = look;
  // Only CG views are attached to shots from here on; the photographic expression views would pull stills back toward a photo.
  character.views = { closeup };
  store.saveFilm(film);
  console.log(`${id} ${character.name}: CG look and close-up drawn.`);
}
