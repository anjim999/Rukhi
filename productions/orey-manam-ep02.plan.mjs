// OREY… MANAM! — Episode 02 "Seven People, One Car, Zero Brain Cells".
//
// Ten reels are planned; this file holds the reels whose shot lists the producers have sent.
// So far: REEL 1, "The Great Departure, Part 1" (7 shots, about 65 seconds).
//
// The cast, their looks, Karthik's bedroom and the music come from orey-manam-ep01-v2. A shot
// that asks for a cut inside it is split into parts, because the video model renders one
// continuous shot at a time.
//
// Every still describes where each person physically is (standing on what, holding what, in
// front of or behind what). Episode 1 shipped a still with a man seated inside a table and one
// with a beard he does not have; both came from leaving that to the model.
//
// Run from the repo root:  node productions/orey-manam-ep02.plan.mjs [--reset-shots]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as stages from '../backend/src/film/stages.js';
import * as store from '../backend/src/film/store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const slug = 'orey-manam-ep02';
const PREVIOUS = 'orey-manam-ep01-v2';
const K = 'KARTHIK_01';
const A = 'ARJUN_01';
const M = 'MEERA_01';

const newLocations = [
  {
    id: 'PARKING_01', name: "Arjun's apartment parking lot",
    description: "The open ground-level parking forecourt of a modest four-storey Indian apartment building in soft, clear early-morning light. The main subject, close to the camera and filling about half the frame width, is one small white five-door hatchback car, parked and stationary, seen from a front three-quarter angle with its whole body visible. Seven travel bags (backpacks and duffel bags in different muted colours) stand in a tidy group on the concrete right beside the car's rear wheel, touching distance from the car. There is open empty concrete in front of the car. Behind the car: the cream-and-grey apartment wall with small balconies on the right side, a low compound wall with an open entrance gate at the far end, two parked scooters and a few potted plants by the wall, trees beyond. Quiet, nobody about.",
  },
];

const video = (label, durationSec, fields) => ({ label, kind: 'video', durationSec, dialogue: [], sound: '', ...fields });
const graphic = (label, seconds, graphicSpec) => ({
  label, kind: 'graphic', durationSec: seconds, trimSec: seconds, graphic: graphicSpec,
  shotType: 'graphic insert', camera: 'full frame', characterIds: [], action: graphicSpec.type, dialogue: [], keyframePrompt: '', videoPrompt: '', sound: '',
});

const PARKING_TIME = 'early morning, 8:07 AM, soft low sunlight';
const BEDROOM_TIME = 'early morning, 8:07 AM, soft sunlight from the window on the left';
const NO_BEARD = 'His face is as in the reference: smooth, with at most a faint moustache shadow, and absolutely no beard.';

const scenes = [
  {
    reel: 1, heading: 'PARKING LOT — 8:07 AM', locationId: 'PARKING_01', timeOfDay: PARKING_TIME, characterIds: [A],
    summary: 'Arjun has been waiting alone by the car for over an hour. He calls Karthik.',
    shots: [
      video('R1 Shot 01', 8, {
        trimSec: 5,
        shotType: 'wide establishing shot', camera: '26mm, eye level, completely static, locked off on a tripod', characterIds: [A],
        action: 'Arjun waits alone beside the car and checks his watch.',
        keyframePrompt: 'The whole parking forecourt, seen from just inside the entrance gate at eye level. The small white hatchback is parked in its bay in the middle distance with the seven travel bags standing on the concrete beside it. Arjun stands upright on the concrete next to the car\'s front door, entirely outside the car, his whole body visible from head to shoes with both feet flat on the ground. His left forearm is raised in front of his chest and he is looking down at the wristwatch on his left wrist. He is dressed exactly as in his full-body reference: just the plain light-blue shirt with nothing worn over it or across it, and dark charcoal-grey trousers. His hands are empty. All the luggage is on the ground. He is the only person in the picture.',
        videoPrompt: 'Arjun stands beside the parked car and checks his wristwatch, looks up off to one side into the distance, then looks at his watch again. He stays standing in the same spot. The car does not move. His feet stay planted in exactly the same spot for the whole shot: he does not walk, step or approach the camera, and he stays the same small size in the frame. The camera is locked off on a tripod and does not move, zoom or drift at all; the background stays exactly as in the first frame and nothing new comes into view.',
        performance: 'patient and neutral as he reads his watch; he lifts his eyes off to one side and they narrow slightly as he sees nobody coming; a small, quiet exhale through his nose; he looks back at the watch. Mild, familiar impatience, never anger.',
        sound: 'quiet morning ambience, distant traffic, faint birdsong',
      }),
      graphic('R1 Shot 01 (watch)', 1.5, { type: 'watch', time: '8:07', meridiem: 'AM' }),
      graphic('R1 Shot 02 (call screen)', 1.5, { type: 'call', name: 'Karthik', status: 'Calling…', clock: '8:07' }),
      video('R1 Shot 02', 6, {
        shotType: 'medium close-up, three-quarter front from his left', camera: '50mm, static', characterIds: [A],
        action: 'Arjun waits for Karthik to answer, then asks where he is.',
        keyframePrompt: 'Arjun stands on the concrete beside the parked white hatchback, framed from the chest up, seen from a three-quarter front angle on his left side. He holds his smartphone against his ear with one hand; the phone and the hand holding it are on the LEFT side of the picture, the plain dark back of the phone facing outward. His other arm hangs at his side. His lips are pressed firmly together: he is NOT speaking and NOT smiling. His brow is slightly furrowed and his eyes look off to the side, flat and tired, the face of a man who has been kept waiting for an hour. He carries nothing: no backpack, no bag and no straps on his shoulders. The white car\'s roof and side window are softly out of focus directly behind him; the apartment wall is beyond.',
        videoPrompt: 'Arjun stands still with the phone at his ear, waiting for the call to connect, then speaks into the phone. He stays standing in the same spot. The camera is locked off on a tripod and does not move, zoom or drift at all; the background stays exactly as in the first frame and nothing new comes into view.',
        performance: 'he waits, blinks, and his eyes drop briefly to the watch on his left wrist; a slight tightening around his eyes; the call connects and he asks his question directly and evenly, a little impatient but completely controlled; he listens for the answer.',
        dialogue: [{ characterId: A, line: 'Where are you?', delivery: 'direct, controlled, slightly impatient, medium-low and even, not raised' }],
        sound: 'quiet morning ambience, a soft phone ringback tone that stops as the call connects',
      }),
    ],
  },
  {
    reel: 1, heading: "KARTHIK'S BEDROOM — ALMOST THERE", locationId: 'BEDROOM_01', timeOfDay: BEDROOM_TIME, characterIds: [K],
    summary: 'Karthik answers from bed and claims he is almost there.',
    shots: [
      video('R1 Shot 03', 8, {
        shotType: 'close-up from above, beside the bed', camera: '50mm, looking down at him, static, locked off', characterIds: [K],
        expression: { [K]: 'neutral' },
        action: 'Karthik answers the call without getting up and says he is almost there.',
        keyframePrompt: `A CLOSE-UP: Karthik's head and shoulders fill the frame; the rest of the room is not visible. The camera is beside the bed, slightly above him, looking down. He lies flat on his back with the back of his head sunk into a white pillow, a pale blanket pulled up to his chest over his navy-blue T-shirt. His eyes are closed and his face is slack with sleep, mouth closed. One hand holds his smartphone flat against his ear. His hair is messy on the pillow. ${NO_BEARD} Only pillow, bedsheet and a strip of wooden headboard are visible around him. Soft morning light from the left.`,
        videoPrompt: 'Karthik stays lying in bed with the phone held at his ear and answers the call without sitting up. He barely moves. After speaking, his eyes drift up toward the ceiling. The phone stays in his hand, pressed against his ear, for the entire shot; his hand never leaves his ear and the phone never disappears. The camera is locked off on a tripod and does not move, zoom or drift at all; the background stays exactly as in the first frame and nothing new comes into view.',
        performance: 'barely awake, eyes still shut; he mumbles the line in a soft, sleepy, reassuring voice without any effort, his lips hardly moving; his eyelids open halfway, heavy; his gaze drifts lazily up toward the ceiling fan.',
        dialogue: [{ characterId: K, line: 'Almost there, ra.', delivery: 'soft, sleepy and slightly muffled, a casual lazy reassurance' }],
        sound: 'a steady ceiling fan hum, soft room ambience',
      }),
    ],
  },
  {
    reel: 1, heading: 'PARKING LOT — THE FAN', locationId: 'PARKING_01', timeOfDay: PARKING_TIME, characterIds: [A],
    summary: 'Arjun can hear the ceiling fan through the phone.',
    shots: [
      video('R1 Shot 04', 6, {
        shotType: 'close-up, straight-on three-quarter', camera: '65mm, static', characterIds: [A],
        expression: { [A]: 'neutral' },
        action: 'Arjun hears the fan through the call and says so.',
        keyframePrompt: 'A close-up of Arjun: his face and shoulders fill the frame. He stands beside the parked white hatchback, holding his smartphone against his ear with one hand; the phone and the hand holding it are on the LEFT side of the picture, the plain dark back of the phone facing outward. He is listening, his mouth closed, his eyes lowered, his face still and unimpressed. He is clean-shaven. The white car and the apartment wall are a soft blur behind him.',
        videoPrompt: 'Arjun listens to the phone at his ear, then speaks into it. He stays still. He does not look at the camera. The camera is locked off on a tripod and does not move, zoom or drift at all; the background stays exactly as in the first frame and nothing new comes into view.',
        performance: 'listening, completely still; his eyes drop as he recognises the sound; a beat; his eyes come back up and one eyebrow lifts by a millimetre; he says the line dry and calm, with a slight stress on "fan"; his eyes narrow for a moment, then relax; he holds a flat, patient look in the silence after.',
        dialogue: [{ characterId: A, line: 'I can hear your fan.', delivery: 'calm, dry and mildly skeptical, a slight stress on "fan", not raised' }],
        sound: 'quiet morning ambience',
      }),
    ],
  },
  {
    reel: 1, heading: "KARTHIK'S BEDROOM — THE EXCUSE", locationId: 'BEDROOM_01', timeOfDay: BEDROOM_TIME, characterIds: [K],
    summary: 'Karthik blames the speaker.',
    shots: [
      video('R1 Shot 05', 8, {
        shotType: 'close-up from a low three-quarter angle beside the pillow', camera: '50mm, static, locked off', characterIds: [K],
        expression: { [K]: 'neutral' },
        action: 'Caught out, Karthik glances at the ceiling fan and improvises an excuse.',
        keyframePrompt: `A close-up from low beside the pillow, looking slightly up at Karthik's face. He lies on his back in bed with his head on the white pillow, the phone held at his ear in one hand, his eyes now open and heavy-lidded, his expression caught and a little wary. In the soft-focus background above him, part of the white ceiling fan is visible against the ceiling. He wears his navy-blue T-shirt. ${NO_BEARD} Soft morning light from the left.`,
        videoPrompt: 'Karthik stays lying in bed with the phone at his ear. His eyes go up to the ceiling fan, then back; he speaks into the phone. He does not sit up. The phone stays in his hand, pressed against his ear, for the entire shot; his hand never leaves his ear and the phone never disappears. The camera is locked off on a tripod and does not move, zoom or drift at all; the background stays exactly as in the first frame and nothing new comes into view.',
        performance: 'caught: his eyes flick up to the ceiling fan and stay there a beat as he thinks; a tiny guilty pause; his eyes come back down; he says the two words with casual, unconvincing confidence, as if it were obvious; then a small, tentative, hopeful look, waiting to see whether it worked.',
        dialogue: [{ characterId: K, line: 'Speaker problem.', delivery: 'a tiny hesitation, then casual and falsely confident, conversational' }],
        sound: 'a steady ceiling fan hum, soft room ambience',
      }),
    ],
  },
  {
    reel: 1, heading: 'PARKING LOT — MEERA ARRIVES', locationId: 'PARKING_01', timeOfDay: PARKING_TIME, characterIds: [A, M],
    summary: 'Meera arrives with two coffees and asks where the birthday boy is.',
    shots: [
      video('R1 Shot 06 (coffees)', 4, {
        continuity: false,
        shotType: 'close-up insert at waist height', camera: '50mm, low, moving backward ahead of her hands', characterIds: [M],
        action: 'Two takeaway coffees are carried across the parking lot.',
        keyframePrompt: 'A close-up insert at waist height: two hands of an adult woman carry TWO brown paper takeaway coffee cups with white lids, one cup in each hand, side by side in the centre of the frame. Behind the cups is the front of the kurti Meera wears, exactly the kurti in her reference: the same deep dark teal colour, the same small pale printed motifs and the same pale embroidered neckline and sleeve borders, with three-quarter sleeves, a slim wristwatch on one wrist. The frame shows only her torso from chest to hips, her forearms and hands and the cups: her head, face and neck are above the top of the frame and not visible. Behind her, softly out of focus, are the concrete parking forecourt, the compound wall and the open entrance gate in early-morning light.',
        videoPrompt: 'The woman walks steadily toward the camera across the parking forecourt, carrying a takeaway coffee cup in each hand; the cups bob gently with her steps and a little steam rises from the lids. The camera moves backward ahead of her at the same height. Her face never enters the frame.',
        performance: 'an easy, unhurried walk; steady hands.',
        sound: 'footsteps on concrete, quiet morning ambience, faint birdsong',
      }),
      video('R1 Shot 06 (asks, to camera side)', 6, {
        continuity: false,
        shotType: 'medium close-up', camera: '55mm, eye level, static, locked off', characterIds: [M],
        action: 'Meera stops in front of Arjun, looks around for Karthik and asks where he is.',
        keyframePrompt: 'A medium close-up of ONE woman, framed from the waist up, standing still on the concrete of the parking forecourt and facing the camera at a slight angle, looking at someone standing just to the left of the camera at her own eye level. Meera wears her knee-length teal kurti exactly as in her reference. She holds TWO brown paper takeaway coffee cups with white lids, one in each hand at chest height. Her mouth is closed and she looks relaxed and curious. The white hatchback and the compound wall are softly out of focus behind her. She is the only person in the picture: nobody else, and no part of anybody else, appears anywhere in the frame.',
        videoPrompt: 'Meera glances around the empty parking lot, then looks back at the person just left of the camera and asks her question with a small smile. She stays standing where she is and keeps both cups at chest height; she does not drink. The camera is locked off on a tripod and does not move, zoom or drift at all; the background stays exactly as in the first frame and nothing new comes into view.',
        performance: 'her eyes look around for someone who is not there; they come back and a tiny knowing smile appears; she asks lightly, teasing, one eyebrow lifting on the question; she waits for the answer, amused.',
        dialogue: [{ characterId: M, line: "Where's the birthday boy?", delivery: 'casual and conversational, lightly teasing, a slight lift on the question' }],
        sound: 'quiet morning ambience',
      }),
      video('R1 Shot 07 (punchline)', 6, {
        shotType: 'close-up', camera: '65mm, eye level, static', characterIds: [A],
        expression: { [A]: 'neutral' },
        action: 'Arjun delivers his verdict on where Karthik is.',
        keyframePrompt: 'A close-up of Arjun: his face and shoulders fill the frame. He stands in the parking lot looking off to the right of the camera at someone beside him, his face tired, composed and completely straight, mouth closed. He is clean-shaven. His hands are below the frame and out of sight. He is the only person in the picture: nobody else, and no part of anybody else, appears anywhere in the frame, and there is nothing in the foreground. The white hatchback and the apartment wall are a soft blur behind him.',
        videoPrompt: 'Arjun looks at the person beside him and says his line, then holds a straight face. He does not look at the camera and does not laugh. The camera is locked off on a tripod and does not move, zoom or drift at all; the background stays exactly as in the first frame and nothing new comes into view.',
        performance: 'tired and composed; a small pause as he considers how to put it; he says the line flat and dry, with a slight downward drop at the end; no smile at all; he holds the deadpan, blinks once, and looks away off to one side.',
        dialogue: [{ characterId: A, line: 'In post-production.', delivery: 'understated dry sarcasm, flat and straight-faced, a small downward inflection at the end' }],
        sound: 'quiet morning ambience',
      }),
      video('R1 Shot 07 (reaction)', 4, {
        shotType: 'close-up', camera: '65mm, eye level, static', characterIds: [M],
        action: 'Meera takes in the joke.',
        keyframePrompt: 'A close-up of Meera: her face and shoulders fill the frame. She stands in the parking lot looking off to the left of the camera at someone beside her, her face neutral and attentive. The tops of the two brown paper takeaway coffee cups with white lids that she holds are just visible at the bottom edge of the frame. The parking forecourt and compound wall are a soft blur behind her.',
        videoPrompt: 'Meera holds still for a moment, then reacts with a small smile and glances off to one side into the distance. She does not speak. She keeps both cups down at chest height the whole time and does not drink. Her mouth stays closed: a small closed-lip smile only, no laugh. The camera is locked off on a tripod and does not move, zoom or drift at all; the background stays exactly as in the first frame and nothing new comes into view.',
        performance: 'a beat of stillness as the line lands; the corners of her mouth lift slightly as she gets it; a soft breath of amusement through her nose; her eyes slide off to one side and back. Her mouth stays closed.',
        sound: 'quiet morning ambience',
      }),
      video('R1 Shot 07 (hold)', 4, {
        trimSec: 2.6,
        continuity: false,
        shotType: 'medium shot, waist up', camera: '50mm, eye level, static', characterIds: [A],
        action: 'Arjun checks his watch again. Still nobody.',
        keyframePrompt: 'A waist-up shot of ONE man. Arjun stands in the LEFT third of the frame, facing the camera at a slight angle, looking down at the black wristwatch on his raised left wrist, his forearm held in front of his chest. He is clean-shaven, mouth closed, his face tired. The RIGHT half of the frame is empty: only the softly out-of-focus white hatchback and apartment wall. He is the only person in the picture.',
        videoPrompt: 'Arjun reads his wristwatch, slowly lowers his arm, and looks off off to one side into the distance. He stays standing in the same spot. He does not speak. He never looks into the camera. The camera is locked off on a tripod and does not move, zoom or drift at all; the background stays exactly as in the first frame and nothing new comes into view.',
        performance: 'he reads the watch; a slow, resigned exhale through his nose as his arm drops; his eyes go off to one side and stay there, flat and patient. His mouth stays closed.',
        sound: 'quiet morning ambience, faint birdsong',
      }),
    ],
  },
];

// Meera is always seen in three-quarter view, never square-on: the video model refuses her face
// front-on (it reads as too young) and accepts it turned, as in the Episode 1 desk shot.
const MEERA_ANGLE = ' Meera is a grown adult woman of 24. Her head is turned so that her face is seen in THREE-QUARTER view, about 40 degrees away from the camera, exactly the angle of her face reference; she does not face the camera square-on and her eyes do not look into the lens. Her eyes are relaxed and of normal adult size, not wide.';
for (const scene of scenes) for (const shot of scene.shots) if (shot.kind === 'video' && shot.characterIds.includes(M) && !/insert/.test(shot.shotType)) shot.keyframePrompt += MEERA_ANGLE;

// ── Write the production ──────────────────────────────────────────────────────────────────
const exists = fs.existsSync(path.join(store.filmDir(slug), 'film.json'));
if (exists && !process.argv.includes('--reset-shots')) {
  console.log(`"${slug}" already exists. Re-run with --reset-shots to re-plan its shots (takes already made are kept where shot ids and labels match).`);
  process.exit(0);
}
if (!exists) {
  // Cast, looks, locations, settings and series bible are inherited from the previous episode.
  stages.createFilm({ slug, from: PREVIOUS, scriptPath: path.join(here, 'orey-manam-ep02-reel01.md'), title: 'OREY… MANAM! — Episode 02: Seven People, One Car, Zero Brain Cells', capUsd: 150 });
  fs.cpSync(store.abs(PREVIOUS, 'music'), store.abs(slug, 'music'), { recursive: true });
}

const film = store.loadFilm(slug);
const previous = store.loadFilm(PREVIOUS);
film.bible.logline = "The friends set off on Karthik's birthday road trip.";
film.bible.locations = [
  ...film.bible.locations,
  ...newLocations.filter((l) => !film.bible.locations.some((x) => x.id === l.id)).map((l) => ({ ...l, ref: null })),
];
film.settings.voiceLanguageCode = 'en-IN';
film.settings.speechModel = null;
// The series theme (the same track as Episode 1) runs under the whole reel, low enough to sit
// beneath dialogue. The producers want music throughout; a reel with silent stretches reads as
// unfinished to them.
film.music = {
  cues: [
    { file: 'music/quirky.wav', fromShot: 'S01-001', startOffsetSec: 0.2, toShot: 'S05-005', volume: 0.21, fadeInSec: 0.8, fadeOutSec: 1.4 },
  ],
};
void previous;
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
const seconds = s.scenes.reduce((sum, sc) => sum + sc.seconds, 0);
console.log(`Planned ${s.scenes.reduce((n, sc) => n + sc.shots, 0)} shots in ${s.scenes.length} scenes (${seconds}s before trims); references locked: ${s.refs.filter((r) => r.locked).length}/${s.refs.length}.`);
