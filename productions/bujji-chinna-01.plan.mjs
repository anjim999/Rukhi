// BUJJI & CHINNA — test reel 01, "500 Followers" (Telugu, about 60 seconds, 9:16).
//
// A test of the trending chunky-cartoon reel format (two big-headed 3D cartoon friends in a
// village lane, talking to each other and to the viewer). The duo is original: the format is
// borrowed from the trend, the characters are not copied from any existing show.
//
// Run from the repo root:  node productions/bujji-chinna-01.plan.mjs [--reset-shots]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as stages from '../backend/src/film/stages.js';
import * as store from '../backend/src/film/store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const slug = 'bujji-chinna-01';
const B = 'BUJJI_01';
const C = 'CHINNA_01';

const VISUAL_STYLE =
  'Polished, bright 3D cartoon animation in the style of a family animated feature: chunky stylised characters with oversized heads, ' +
  'big expressive eyes, exaggerated rounded features and smooth clean materials; saturated warm colours, soft sunny daylight, a clear ' +
  'blue sky with puffy white clouds, lush rounded trees. Clean and cheerful, high-quality rendering. Both characters are clearly ' +
  'grown men in their thirties, with adult facial hair, even though the style is cartoonish.';

const characters = [
  {
    id: B, name: 'Bujji', role: 'The over-excited, proud, chubby one who wants to be famous online.',
    appearance: 'A 35-year-old cartoon man: short and very chubby with a big round belly, a big round head, very full rosy cheeks, thick wavy jet-black hair piled high on top, a thick black moustache and short black stubble along his jaw, big round dark eyes, thick black eyebrows, a wide happy grin, warm light-brown skin.',
    wardrobe: 'A bright orange hoodie with the sleeves pushed up, a plain white T-shirt under it, olive-green cargo shorts that reach below the knee, red-and-white sneakers.',
    voice: 'adult Telugu man in his thirties, cheerful and loud, a slightly husky rounded voice, fast excited delivery, funny and expressive',
    ageNote: 'a grown man of 35 with a thick moustache and stubble, drawn in a cartoon style',
  },
  {
    id: C, name: 'Chinna', role: 'The tall, thin, calm and sharp friend who sees through everything.',
    appearance: 'A 36-year-old cartoon man: very tall and thin with long arms and legs, a long oval head, neat short black hair with a side parting, thin rectangular black-framed glasses, a neat thin black moustache, narrow intelligent eyes, a long nose, light-brown skin.',
    wardrobe: 'A sky-blue short-sleeved collared shirt neatly tucked in, beige chino trousers, a brown belt, brown loafers, a silver wristwatch.',
    voice: 'adult Telugu man in his thirties, calm, dry and measured, medium-low pitch, deadpan delivery with small pauses',
    ageNote: 'a grown man of 36 with a moustache and glasses, drawn in a cartoon style',
  },
];

const locations = [
  {
    id: 'LANE_01', name: 'Village lane',
    description: 'A sunny South Indian village lane: a wide packed-earth path running away from the camera, small cream and peach cottages with red clay-tile roofs and wooden doors on both sides, a low wooden fence, two big rounded green trees, white daisies and small yellow flowers in the grass at the edges of the path, a few smooth stones, green hills in the far distance, a clear blue sky with puffy white clouds. Late-morning light.',
  },
];

const video = (label, durationSec, fields) => ({ label, kind: 'video', durationSec, dialogue: [], sound: '', ...fields });
const BOTH_STAND = 'Both stand upright on the earth path with both feet on the ground, side by side, with a clear gap between them; neither touches the other.';

const scenes = [
  {
    heading: 'VILLAGE LANE — 500 FOLLOWERS', locationId: 'LANE_01', timeOfDay: 'late morning, bright sun', characterIds: [B, C],
    summary: 'Bujji announces 500 followers; Chinna finds out where they came from.',
    shots: [
      video('01 Chinna waits', 6, {
        shotType: 'wide establishing shot', camera: '28mm, eye level, static, locked off', characterIds: [C],
        action: 'Chinna stands under a tree in the lane, scrolling his phone.',
        keyframePrompt: 'The whole village lane seen from eye level down the middle of the path. Chinna stands upright on the path in the middle distance under one of the big trees, his whole body visible from head to shoes, holding a smartphone in both hands at chest height and looking down at it, calm and bored. He is the only person in the picture.',
        videoPrompt: 'Chinna scrolls his phone with one thumb, blinks, pushes his glasses up his nose with one finger, and keeps scrolling. He stays standing in the same spot. A light breeze moves the leaves.',
        performance: 'calm, mildly bored scrolling; a small sigh; pushes his glasses up; unbothered.',
        sound: 'birdsong, a light breeze in the leaves, distant village ambience',
      }),
      video('02 Bujji bursts in', 8, {
        shotType: 'medium-wide two-shot', camera: '35mm, eye level, static, locked off', characterIds: [B, C],
        action: 'Bujji hurries up to Chinna waving his phone and announces the news.',
        keyframePrompt: `Bujji and Chinna on the village path, both seen from head to knees. On the LEFT of the frame is Bujji, short and very chubby, holding his smartphone up high in one hand, beaming with excitement, mouth closed in a huge grin. On the RIGHT of the frame is Chinna, very tall and thin, holding his phone at his chest, turning his head toward Bujji with mild surprise. ${BOTH_STAND} SCALE: both stand at exactly the same distance from the camera, side by side on the same line across the path, neither in front of the other. Bujji is short and fat but a full-grown adult man: his head reaches the middle of Chinna's chest, his face is as large in the picture as Chinna's face, and his thick black moustache is clearly visible. Both wear shoes. Exactly two people are in the picture.`,
        videoPrompt: 'Bujji, on the left, bounces on his toes and waves his phone in the air while shouting his news at Chinna. Chinna, on the right, lowers his own phone and looks at him. Both stay where they are.',
        performance: 'Bujji explodes with joy, eyes huge, bouncing, voice loud and breathless. Chinna blinks, startled, then raises one eyebrow. Only Bujji speaks.',
        dialogue: [{ characterId: B, line: 'చిన్నా! చిన్నా! మనకి ఐదు వందల ఫాలోవర్స్ వచ్చేశారు రా!', delivery: 'shouting with excitement, breathless, very happy' }],
        sound: 'birdsong, light village ambience',
      }),
      video('03 Really?', 6, {
        shotType: 'medium close-up', camera: '50mm, eye level, static, locked off', characterIds: [C],
        action: 'Chinna asks if it was from just one video.',
        keyframePrompt: 'A medium close-up of Chinna from the chest up on the village path, turned three-quarters toward someone shorter just to the left of the camera, looking slightly down at him through his glasses with polite surprise, mouth closed. His phone is held at chest height. The cottages and a tree are softly out of focus behind him. He is the only person in the picture.',
        videoPrompt: 'Chinna looks down at the shorter person beside the camera and asks his question, surprised but doubtful. He keeps the phone in his hand. He does not look into the camera.',
        performance: 'eyebrows rise in surprise; a small doubtful tilt of the head; he asks, half impressed, half suspicious.',
        dialogue: [{ characterId: C, line: 'నిజమా? ఒక్క వీడియోకేనా?', delivery: 'calm, surprised but doubtful' }],
        sound: 'birdsong',
      }),
      video('04 My talent', 6, {
        shotType: 'medium close-up, slightly low angle', camera: '40mm, slightly below eye level, static, locked off', characterIds: [B],
        action: 'Bujji puffs out his chest and takes the credit.',
        keyframePrompt: 'A medium close-up of Bujji from the waist up on the village path, seen from slightly below, looking up and to the right at someone much taller beside the camera, his chest puffed out proudly, chin up, mouth closed in a smug grin, his phone in one hand. A tree and the blue sky are behind him. He is the only person in the picture.',
        videoPrompt: 'Bujji puffs out his chest, brushes his shoulder with his free hand like a star, and boasts to the tall person beside the camera. He keeps the phone in his other hand.',
        performance: 'swelling pride; brushes imaginary dust off his shoulder; smug wiggle of the eyebrows on "talent".',
        dialogue: [{ characterId: B, line: 'అవును! నా టాలెంట్ అలాంటిది మరి.', delivery: 'proud and smug, playful' }],
        sound: 'birdsong',
      }),
      video('05 Wait a minute', 8, {
        shotType: 'medium two-shot', camera: '35mm, eye level, static, locked off', characterIds: [B, C],
        action: 'Chinna checks the follower list on his phone and finds something.',
        keyframePrompt: `Bujji and Chinna on the village path, both seen from head to knees. On the LEFT is Bujji, chubby, smiling proudly with his hands on his hips. On the RIGHT is Chinna, tall and thin, holding his smartphone in front of his face with both hands and peering at its screen through his glasses, frowning slightly. ${BOTH_STAND} SCALE: both stand at exactly the same distance from the camera, side by side on the same line across the path, neither in front of the other. Bujji is short and fat but a full-grown adult man: his head reaches the middle of Chinna's chest, his face is as large in the picture as Chinna's face, and his thick black moustache is clearly visible. Both wear shoes. Exactly two people are in the picture.`,
        videoPrompt: 'Chinna, on the right, scrolls his phone, stops, peers closer at the screen, then slowly lowers the phone and turns his eyes to Bujji and speaks. Bujji, on the left, keeps smiling proudly, then his smile freezes. Both stay where they are and keep what they hold.',
        performance: 'Chinna narrows his eyes, peers, then a slow knowing look over the top of his glasses as he speaks. Bujji\'s proud smile slowly stiffens. Only Chinna speaks.',
        dialogue: [{ characterId: C, line: 'ఒక్క నిమిషం... ఇందులో నాలుగు వందల మంది మీ అమ్మ పేరు మీదే ఉన్నారు.', delivery: 'slow, dry, deadpan, with a pause after the first words' }],
        sound: 'birdsong',
      }),
      video('06 Amma supports', 6, {
        shotType: 'medium close-up', camera: '50mm, eye level, static, locked off', characterIds: [B],
        action: 'Caught, Bujji makes an excuse for his mother.',
        keyframePrompt: 'A medium close-up of Bujji from the chest up on the village path, looking up and to the right at someone taller beside the camera, caught out: a sheepish, embarrassed half-smile, eyes darting sideways, one hand scratching the back of his head. Cottages are softly out of focus behind him. He is the only person in the picture.',
        videoPrompt: 'Bujji scratches the back of his head, looks away sheepishly, then back up at the tall person beside the camera and gives his excuse with an awkward grin.',
        performance: 'caught; eyes dart away; sheepish scratch of the head; an awkward, guilty grin as he speaks softly.',
        dialogue: [{ characterId: B, line: 'అమ్మకి సపోర్ట్ చేయడం ఇష్టం రా...', delivery: 'sheepish, softer, embarrassed, trailing off' }],
        sound: 'birdsong',
      }),
      video('07 The other hundred?', 4, {
        shotType: 'close-up', camera: '65mm, eye level, static, locked off', characterIds: [C],
        action: 'Chinna asks about the other hundred.',
        keyframePrompt: 'A close-up of Chinna\'s face and shoulders on the village path, looking down through his glasses at someone shorter just to the left of the camera with a completely flat, unimpressed expression, mouth closed. Soft green trees behind him. He is the only person in the picture.',
        videoPrompt: 'Chinna looks down flatly and asks his two-word question, then holds the deadpan stare. He does not look into the camera.',
        performance: 'perfectly deadpan; one slow blink; the question is flat and short.',
        dialogue: [{ characterId: C, line: 'మిగతా వంద?', delivery: 'flat, deadpan, short' }],
        sound: 'birdsong',
      }),
      video('08 Thank you all', 8, {
        shotType: 'medium two-shot, both facing the camera', camera: '35mm, eye level, static, locked off', characterIds: [B, C],
        action: 'Bujji points at the viewers and thanks them; both greet the camera.',
        keyframePrompt: `Bujji and Chinna on the village path, both seen from head to knees, both facing the camera. On the LEFT is Bujji, chubby, grinning hugely and pointing straight at the camera with one finger. On the RIGHT is Chinna, tall and thin, smiling a small polite smile with his palms pressed together in a namaste. ${BOTH_STAND} SCALE: both stand at exactly the same distance from the camera, side by side on the same line across the path, neither in front of the other. Bujji is short and fat but a full-grown adult man: his head reaches the middle of Chinna's chest, his face is as large in the picture as Chinna's face, and his thick black moustache is clearly visible. Both wear shoes. Exactly two people are in the picture.`,
        videoPrompt: 'Bujji, on the left, points straight at the camera and happily says his line to the viewer. Chinna, on the right, keeps his palms together in a namaste and gives a small polite bow and smile. Both stay where they are.',
        performance: 'Bujji beams at the audience, totally recovered and proud again. Chinna gives a small resigned smile and a polite bow. Only Bujji speaks.',
        dialogue: [{ characterId: B, line: 'అవి... మీరే! థాంక్యూ ఆల్!', delivery: 'a short dramatic pause, then bursting with happiness, loud' }],
        sound: 'birdsong',
      }),
      video('09 Facepalm', 4, {
        shotType: 'medium close-up', camera: '50mm, eye level, static, locked off', characterIds: [C],
        action: 'Chinna turns to the camera and shakes his head.',
        keyframePrompt: 'A medium close-up of Chinna from the chest up on the village path, facing the camera, his eyes closed and one hand raised to his forehead in a gentle facepalm, a small amused smile under his moustache. Trees and cottages behind him. He is the only person in the picture.',
        videoPrompt: 'Chinna keeps his hand on his forehead, slowly shakes his head, then lowers the hand and looks into the camera with a tired, amused smile. He does not speak.',
        performance: 'amused exasperation; a slow head shake; a tired little smile to the viewer. Mouth closed.',
        sound: 'birdsong',
      }),
      {
        label: '10 Thank-you card', kind: 'graphic', durationSec: 3, trimSec: 3,
        graphic: { type: 'title', text: '500 FOLLOWERS! THANK YOU!' },
        shotType: 'graphic insert', camera: 'full frame', characterIds: [], action: 'title', dialogue: [], keyframePrompt: '', videoPrompt: '', sound: '',
      },
    ],
  },
];

// ── Write the production ──────────────────────────────────────────────────────────────────
const exists = fs.existsSync(path.join(store.filmDir(slug), 'film.json'));
if (exists && !process.argv.includes('--reset-shots')) {
  console.log(`"${slug}" already exists. Re-run with --reset-shots to re-plan its shots.`);
  process.exit(0);
}
if (!exists) {
  const brief = path.join(here, 'bujji-chinna-01.md');
  fs.writeFileSync(brief, '# BUJJI & CHINNA — 500 Followers\n\nTest reel in the trending 3D cartoon format, Telugu, about 60 seconds.\n');
  stages.createFilm({ slug, scriptPath: brief, title: 'BUJJI & CHINNA — 500 Followers', language: 'Telugu', aspectRatio: '9:16', resolution: '1080p', capUsd: 40 });
  fs.mkdirSync(store.abs(slug, 'music'), { recursive: true });
  fs.copyFileSync(store.abs('orey-manam-ep01-v2', 'music/quirky.wav'), store.abs(slug, 'music/quirky.wav'));
}

const film = store.loadFilm(slug);
const keep = (list, id) => (film.bible?.[list] || []).find((x) => x.id === id) || {};
film.bible = {
  title: 'BUJJI & CHINNA',
  logline: 'Two village friends chase internet fame.',
  visualStyle: VISUAL_STYLE,
  characters: characters.map((c) => ({ ...c, ref: keep('characters', c.id).ref || null, views: keep('characters', c.id).views || {} })),
  locations: locations.map((l) => ({ ...l, ref: keep('locations', l.id).ref || null })),
};
film.settings.voiceLanguageCode = 'te-IN';
film.settings.speechModel = null;
film.music = { cues: [{ file: 'music/quirky.wav', fromShot: 'S01-001', startOffsetSec: 0.2, toShot: 'S01-010', volume: 0.21, fadeInSec: 0.8, fadeOutSec: 1.2 }] };
film.sceneIds = scenes.map((_, i) => `S${String(i + 1).padStart(2, '0')}`);
store.saveFilm(film);

scenes.forEach((scene, i) => {
  const id = film.sceneIds[i];
  let old = null;
  try { old = store.loadScene(slug, id); } catch { /* first plan */ }
  store.saveScene(slug, {
    id, ...scene, wardrobe: {}, text: '',
    shots: scene.shots.map((shot, n) => {
      const shotId = `${id}-${String(n + 1).padStart(3, '0')}`;
      const kept = old?.shots.find((s) => s.id === shotId && s.label === shot.label) || {};
      return { id: shotId, ...shot, keyframes: kept.keyframes || [], selectedKeyframe: kept.selectedKeyframe || null, clips: kept.clips || [], selectedClip: kept.selectedClip || null };
    }),
  });
});
const s = stages.status(slug);
console.log(`Planned ${s.scenes.reduce((n, sc) => n + sc.shots, 0)} shots (${s.scenes.reduce((n, sc) => n + sc.seconds, 0)}s); references locked: ${s.refs.filter((r) => r.locked).length}/${s.refs.length}.`);
