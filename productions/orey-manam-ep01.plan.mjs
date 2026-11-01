// OREY… MANAM! — Episode 01 "Birthday Emergency": the production plan, authored from the
// producers' numbered shot list (kept one-to-one; a shot that asks for a cut inside it is
// split into a/b parts because the video model renders one continuous shot at a time).
//
// Run from the repo root:  node productions/orey-manam-ep01.plan.mjs
// It creates (or, with --reset-shots, re-plans) productions/orey-manam-ep01/.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as stages from '../backend/src/film/stages.js';
import * as store from '../backend/src/film/store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const slug = 'orey-manam-ep01';

// Worded to avoid the family-animation look: "3D animated" alone produced big heads and big eyes.
const VISUAL_STYLE =
  'Realistic high-end CGI, like a cinematic cutscene from a modern AAA video game or a mature animated streaming drama for adults. ' +
  'True adult human anatomy: the body is about seven and a half heads tall, with a normally sized head, normally sized eyes, and ' +
  'realistic facial bone structure, shoulders, arms, hands and legs. Natural Indian facial features, detailed individual hair strands, ' +
  'realistic skin with pores and subtle subsurface scattering (never plastic or glossy), physically believable cloth folds and materials, ' +
  'natural daylight with soft shadows and global illumination, cinematic depth of field, a restrained natural colour palette, lived-in ' +
  'environments. A computer-generated render, clearly not a photograph of a real person, and absolutely not a family-cartoon style.';

const characters = [
  {
    id: 'KARTHIK_01', name: 'Karthik', role: 'The dreamer of the group; announces his birthday like an emergency.',
    appearance: '22-year-old Indian man, average build, youthful oval face, medium warm-brown skin, thick naturally wavy black hair with a messy voluminous fringe, expressive dark-brown eyes, thick natural eyebrows, straight nose, softly defined jawline, clean-shaven.',
    wardrobe: 'Dark navy-blue checked button-down overshirt worn open over a plain white crew-neck T-shirt, blue jeans, clean off-white sneakers, a simple dark wristwatch.',
    episodeWardrobe: 'A faded navy-blue crew-neck T-shirt and charcoal-grey joggers, barefoot. No overshirt, no wristwatch, no backpack, no shoes.',
    voice: 'young Indian male, about 23, medium pitch, expressive and friendly, conversational Indian English with a subtle Telugu-influenced rhythm',
    expressions: { happy: 'Naturally smiling.', annoyed: 'Slightly furrowed eyebrows.', surprised: 'Widened eyes and a naturally open mouth.' },
  },
  {
    id: 'ARJUN_01', name: 'Arjun', role: 'The practical, tired young professional.',
    appearance: '23-year-old Indian man, lean build, medium-brown skin, slightly rectangular oval face with a defined jawline, neatly combed short black hair with a subtle side part, dark-brown eyes, well-defined eyebrows, straight nose, clean-shaven, composed and intelligent expression.',
    wardrobe: 'Neatly fitted light-blue casual office shirt with sleeves folded to the forearms, charcoal-grey chinos, simple black belt, dark everyday sneakers, a simple wristwatch.',
    episodeWardrobe: 'A light-blue formal shirt with full sleeves, dark formal trousers, black belt, black formal shoes, a black wristwatch.',
    voice: 'young Indian male, about 24, medium-low pitch, steady rhythm, clear diction, restrained emotion, understated sarcasm',
  },
  {
    id: 'MEERA_01', name: 'Meera', role: 'The sharp, deadpan one.',
    appearance: '23-year-old Indian woman, medium warm-brown skin, oval face with softly defined cheekbones, large expressive dark-brown eyes, naturally shaped eyebrows, straight nose, long thick black hair reaching below her shoulders with a subtle natural wave and a fixed centre part, confident and observant expression. No beauty-filter look.',
    wardrobe: 'Muted teal straight-cut kurti with understated geometric detailing, dark slim-fit jeans, simple neutral flats, small silver stud earrings, a slim everyday wristwatch.',
    episodeWardrobe: 'A muted sage-green top, dark trousers, simple neutral flats, small simple silver stud earrings.',
    voice: 'young Indian female, about 23, medium pitch, confident, crisp articulation, dry humour, deadpan delivery',
    expressions: { happy: 'A natural, warm smile.', annoyed: 'A subtle raised eyebrow and controlled frustration.', surprised: 'Widened eyes and slightly parted lips, not exaggerated.' },
  },
  {
    id: 'SANTHOSH_01', name: 'Santhosh', role: 'The warm, unbothered food lover.',
    appearance: '23-year-old Indian man who is clearly heavyset and overweight: a broad soft torso with a round belly, thick arms and thighs, wide shoulders, a short thick neck, about 95 kg at average height. A very round, chubby, friendly face with full cheeks and a soft double chin. Medium-brown skin, short black hair cropped close with a natural slightly uneven texture, warm dark-brown eyes, thick eyebrows, broad nose, clean-shaven. He must never be drawn slim or athletic.',
    wardrobe: 'Mustard-yellow and muted teal checked casual shirt worn open over a plain cream T-shirt, sleeves rolled to the elbows, medium-blue jeans, simple dark sneakers.',
    episodeWardrobe: 'A plain mustard-yellow crew-neck T-shirt and comfortable dark shorts, simple house slippers.',
    voice: 'young Indian male, about 23, warm medium pitch, relaxed unhurried rhythm, casual sincere delivery',
    expressions: { happy: 'Full cheeks and a genuine warm smile.', annoyed: 'Mildly offended and impatient.', surprised: 'Raised brows and a slightly open mouth, natural and humorous.' },
  },
  {
    id: 'ROHIT_01', name: 'Rohit', role: 'The stylish romantic.',
    appearance: '21-year-old Indian man, slim build, medium warm-brown skin, slightly long oval face, stylish swept-up black hair with a defined but natural shape, expressive dark-brown eyes, well-shaped eyebrows, straight nose, clean-shaven jawline.',
    wardrobe: 'Dark indigo denim jacket worn open over a plain white crew-neck T-shirt, slim dark-blue jeans, clean white sneakers, a simple dark wristwatch.',
    episodeWardrobe: 'A maroon casual button-down shirt, dark jeans, clean white sneakers, one simple bracelet on the wrist. No jacket.',
    voice: 'young Indian male, about 23, medium-high pitch, lively conversational rhythm, curious and playful, not childish',
    expressions: { happy: 'A slightly shy, hopeful smile.', annoyed: 'Restrained frustration.', surprised: 'Caught off guard while trying to look composed.' },
  },
  {
    id: 'VICKY_01', name: 'Vicky', role: 'The defensive one with a story for everything.',
    appearance: '22-year-old Indian man, average athletic build, medium warm-brown skin, slightly angular face, short textured black hair, lively dark-brown eyes, expressive eyebrows, slightly broad nose, clean-shaven. His face cannot be confused with Karthik or Arjun.',
    wardrobe: 'Muted olive-green casual hoodie with a plain black T-shirt visible at the neckline, dark charcoal jeans, clean black-and-white sneakers, one understated fabric wristband.',
    episodeWardrobe: 'A charcoal-grey polo shirt, dark trousers, and a slim black wireless headset with a boom microphone worn over his head.',
    voice: 'young Indian male, about 24, medium pitch, quick delivery, natural hesitations, mild nervousness',
    expressions: { happy: 'A charming, slightly cheeky grin.', annoyed: 'Impatient narrowed eyes.', surprised: 'Raised eyebrows and widened eyes, not cartoonish.' },
  },
];

const locations = [
  { id: 'BEDROOM_01', name: "Karthik's bedroom", description: 'A modest Indian bachelor bedroom in late-morning daylight. A single bed with an unmade pale-blue bedsheet and two pillows against a cream-painted wall, a small wooden bedside table, one window on the left wall with half-drawn light-beige curtains letting sunlight in from the left, a round analog wall clock, a plastic chair piled with casual clothes, a white ceiling fan turning slowly, a few lived-in details. Warm, slightly cluttered, realistic.' },
  { id: 'OFFICE_01', name: "Arjun's office meeting room", description: 'A contemporary Indian corporate conference room with neutral cool office lighting. A long light-wood conference table with laptops and notebooks, grey office chairs, a wall-mounted presentation screen showing an abstract chart with no readable text, a glass wall with frosted bands, three or four colleagues seated in the background, softly out of focus.' },
  { id: 'MEERA_DESK_01', name: "Meera's workspace", description: 'A modern open-plan office workstation in soft daylight-balanced lighting. A clean white desk with a large monitor, an open laptop, a keyboard and mouse, a notebook, a pen holder, a small potted plant and a steel water bottle; a grey fabric partition behind and blurred desks beyond.' },
  { id: 'DINING_01', name: "Santhosh's eating area", description: 'A modest Indian apartment eating area in warm daylight. A small four-seat wooden dining table against a pale-yellow wall, a steel plate of snacks (samosas and chutney), a steel glass of water, a water jug, a wall shelf with steel containers, a doorway to a small kitchen in the background.' },
  { id: 'ROHIT_ROOM_01', name: "Rohit's room", description: 'A comfortable contemporary young man\'s bedroom workspace in soft daylight. A tidy wooden desk with a closed laptop, a desk lamp, headphones and a small plant, a muted blue-grey wall with two framed prints (abstract shapes, no text), a neatly made bed with a grey blanket in the background, a warm string of fairy lights.' },
  { id: 'VICKY_DESK_01', name: "Vicky's workspace", description: 'A professional remote-work station at home in neutral daylight. A dark wooden desk with an open laptop on a stand, a second small monitor, a notepad, a coffee mug, a plain off-white wall with a simple floating shelf holding a few books and a small plant, a smartphone lying on the desk beside the laptop.' },
];

// ── Shots ─────────────────────────────────────────────────────────────────────────────────
const K = 'KARTHIK_01';
const video = (label, durationSec, fields) => ({ label, kind: 'video', durationSec, dialogue: [], sound: '', ...fields });
const graphic = (label, seconds, graphicSpec) => ({
  label, kind: 'graphic', durationSec: seconds, trimSec: seconds, graphic: graphicSpec,
  shotType: 'graphic insert', camera: 'full-frame phone screen', characterIds: [], action: graphicSpec.type, dialogue: [], keyframePrompt: '', videoPrompt: '', sound: '',
});

const CHAT_SO_FAR = [
  { from: 'Karthik', out: true, text: 'GUYS. EMERGENCY.', time: '10:47 AM' },
  { from: 'Arjun', text: 'What happened?', time: '10:47 AM' },
  { from: 'Meera', text: 'Who got arrested?', time: '10:48 AM' },
  { from: 'Vicky', text: "Karthik, whatever it is, I wasn't involved.", time: '10:48 AM' },
  { from: 'Santhosh', text: 'Is there food?', time: '10:48 AM' },
  { from: 'Rohit', text: 'Bro, is this about Priya?', time: '10:48 AM' },
];

const scenes = [
  {
    heading: "KARTHIK'S BEDROOM — 10:47 AM", locationId: 'BEDROOM_01', timeOfDay: 'late morning, 10:47 AM, sunlight from the left', characterIds: [K],
    summary: 'Karthik is woken by his phone and sends "GUYS. EMERGENCY." to the group.',
    shots: [
      video('Shot 01', 4, {
        shotType: 'wide establishing shot from the doorway', camera: '24mm, stationary with a very gentle push-in', characterIds: [K],
        action: 'Karthik sleeps on his unmade bed with his phone lying across his face.',
        keyframePrompt: 'Seen from the bedroom doorway, the whole room in frame. Karthik lies asleep on his back on the unmade bed, one arm hanging off the side, his smartphone resting flat across his face. The wall clock hands show about 10:47. Late-morning sunlight enters through the window on the left, casting soft shadows. The ceiling fan is above.',
        videoPrompt: 'Karthik stays fast asleep; only his chest rises and falls with slow breathing. The ceiling fan rotates steadily and the curtain moves slightly. The camera pushes in very gently.',
        sound: 'ceiling fan hum, faint morning street sounds through the window',
      }),
      video('Shot 02', 6, {
        trimSec: 5,
        shotType: 'tight close-up', camera: '85mm, static, shallow depth of field, rack focus from his eyes to the phone', characterIds: [K],
        action: 'The phone vibrates against his face; he twitches, opens his eyes and lifts the phone away.',
        keyframePrompt: 'Tight close-up of Karthik asleep on his pillow, eyes closed, face relaxed, his smartphone resting against his cheek and forehead with the back of the phone toward the camera. Soft late-morning light from the left.',
        videoPrompt: 'The phone vibrates and its screen glow lights his face softly. Karthik twitches, slowly opens his sleepy eyes, blinks, and lifts the phone away from his face to look at it. The back of the phone stays toward the camera; the screen is never shown. Focus shifts from his eyes to the phone.',
        sound: 'a phone vibrating on skin, one soft notification chime, ceiling fan hum',
      }),
      graphic('Shot 02 (screen insert)', 1.5, { type: 'lock', time: '10:47' }),
      graphic('Shot 03', 4, { type: 'chat', history: [], typed: 'GUYS. EMERGENCY.', time: '10:47 AM' }),
    ],
  },
  {
    heading: "ARJUN'S OFFICE", locationId: 'OFFICE_01', timeOfDay: 'late morning, neutral office lighting', characterIds: ['ARJUN_01'],
    summary: 'Arjun checks his phone under the table in a meeting.',
    shots: [
      video('Shot 04', 4, {
        shotType: 'medium close-up', camera: '50mm, static, colleagues softly out of focus behind', characterIds: ['ARJUN_01'],
        action: 'Arjun discreetly checks his phone during a meeting and reacts with concern.',
        keyframePrompt: 'Arjun sits at the conference table, body facing the meeting, his eyes lowered to the smartphone he holds discreetly below the table edge; the phone is seen from behind so its screen is not visible. A slight crease of concern between his eyebrows. Colleagues and the presentation screen are blurred in the background.',
        videoPrompt: 'Arjun reads his phone, his brow tightens with concern, and he says his line quietly while typing with his thumb, glancing up once to check nobody noticed. Minimal, controlled movement.',
        dialogue: [{ characterId: 'ARJUN_01', line: 'What happened?', delivery: 'quiet, measured, mildly concerned, under his breath in a meeting' }],
        sound: 'muted office meeting ambience, an indistinct presenter murmuring far away',
      }),
    ],
  },
  {
    heading: "MEERA'S WORKSPACE", locationId: 'MEERA_DESK_01', timeOfDay: 'late morning, soft office daylight', characterIds: ['MEERA_01'],
    summary: 'Meera replies without changing expression.',
    shots: [
      video('Shot 05', 4, {
        shotType: 'three-quarter side medium close-up across her monitor', camera: '50mm, static', characterIds: ['MEERA_01'],
        action: 'Meera keeps typing, notices the message on her phone, and replies deadpan.',
        keyframePrompt: 'Meera sits at her workstation seen from a three-quarter side angle, the edge of her monitor in the soft foreground. Her hands are on the keyboard; her smartphone lies face-up beside it, seen edge-on so the screen is not readable. Her expression is calm and neutral.',
        videoPrompt: 'Meera types, glances down at her phone without moving her head much, and says her line with a completely straight face, then returns her eyes to the monitor. Almost no change in expression.',
        dialogue: [{ characterId: 'MEERA_01', line: 'Who got arrested?', delivery: 'deadpan, dry, crisp, completely unbothered' }],
        sound: 'quiet open-office ambience, soft keyboard typing',
      }),
    ],
  },
  {
    heading: "VICKY'S WORKSPACE", locationId: 'VICKY_DESK_01', timeOfDay: 'late morning, neutral daylight', characterIds: ['VICKY_01'],
    summary: 'Vicky, on a client call, denies involvement in advance.',
    shots: [
      video('Shot 06', 6, {
        shotType: 'front three-quarter medium close-up', camera: '50mm, static, the open laptop framing the foreground', characterIds: ['VICKY_01'],
        action: 'On a client call, Vicky glances at his buzzing phone, freezes, and replies defensively.',
        keyframePrompt: 'Vicky sits at his desk wearing his wireless headset, facing his laptop, which frames the lower foreground from behind (its screen is not visible). He has a polite professional call expression. His smartphone lies on the desk beside the laptop.',
        videoPrompt: 'Vicky nods politely at his laptop as if listening to a client. His phone buzzes; he glances down at it, freezes for a beat, then leans toward the phone and says his line quickly and nervously in a lowered voice, eyes flicking back to the laptop.',
        dialogue: [{ characterId: 'VICKY_01', line: "Karthik, whatever it is, I wasn't involved.", delivery: 'brisk, hushed, mildly nervous and defensive' }],
        sound: 'quiet room, a phone buzzing on a wooden desk, a faint unintelligible voice from a headset',
      }),
    ],
  },
  {
    heading: "SANTHOSH'S EATING AREA", locationId: 'DINING_01', timeOfDay: 'late morning, warm daylight', characterIds: ['SANTHOSH_01'],
    summary: 'Santhosh asks the only question that matters to him.',
    shots: [
      video('Shot 07', 4, {
        shotType: 'slightly low three-quarter medium shot', camera: '35mm, static, the snack plate in the soft foreground', characterIds: ['SANTHOSH_01'],
        action: 'Santhosh eats, looks at his phone, and asks his question without stopping his meal.',
        keyframePrompt: 'A close medium shot framed from the chest up: Santhosh\'s head and shoulders fill the upper two-thirds of the frame, his face large and clearly readable. He sits at his dining table, seen from a slightly low three-quarter angle, with the edge of the steel snack plate blurred in the bottom foreground. He holds a samosa near his mouth in one hand and his smartphone in the other, the phone seen from behind. Relaxed, content expression. The pale-yellow wall and steel-container shelf are softly out of focus behind him.',
        videoPrompt: 'Santhosh chews calmly, looks at his phone with mild interest, and says his line sincerely between bites, then takes another bite. Subtle, natural eating; nothing exaggerated.',
        dialogue: [{ characterId: 'SANTHOSH_01', line: 'Is there food?', delivery: 'warm, relaxed, completely sincere' }],
        sound: 'quiet apartment ambience, a steel plate clinking softly',
      }),
    ],
  },
  {
    heading: "ROHIT'S ROOM", locationId: 'ROHIT_ROOM_01', timeOfDay: 'late morning, soft daylight', characterIds: ['ROHIT_01'],
    summary: 'Rohit assumes it is about Priya.',
    shots: [
      video('Shot 08', 6, {
        shotType: 'medium close-up', camera: '50mm, static, rack focus from the phone in the foreground to his face', characterIds: ['ROHIT_01'],
        action: 'Rohit stops composing a message, reads the group chat, and gets curious.',
        keyframePrompt: 'A close medium shot framed from the chest up: Rohit\'s head and shoulders fill the upper two-thirds of the frame, his face large and clearly readable, lit by soft daylight, with a small dreamy smile. He sits at his desk holding his smartphone in both hands at chest height in the lower foreground, seen from behind so the screen is not visible, slightly out of focus. The blue-grey wall, framed prints and fairy lights are softly blurred behind him.',
        videoPrompt: 'Rohit types with a dreamy smile, then a notification makes him pause. His eyebrows lift with curiosity, he leans in toward the phone and says his line with playful interest.',
        dialogue: [{ characterId: 'ROHIT_01', line: 'Bro, is this about Priya?', delivery: 'playful, genuinely curious, a little hopeful' }],
        sound: 'quiet room ambience, one soft notification chime',
      }),
    ],
  },
  {
    heading: "KARTHIK'S BEDROOM — THE ANNOUNCEMENT", locationId: 'BEDROOM_01', timeOfDay: 'late morning, 10:49 AM, sunlight from the left', characterIds: [K],
    summary: 'Karthik reveals the emergency: his birthday is tomorrow.',
    shots: [
      graphic('Shot 09 (screen)', 5, { type: 'chat', history: CHAT_SO_FAR, typed: 'My birthday is tomorrow.', time: '10:49 AM' }),
      video('Shot 09 (face)', 4, {
        shotType: 'close-up', camera: '65mm, static', characterIds: [K],
        action: 'Karthik waits hopefully for the group to respond.',
        keyframePrompt: 'Close-up of Karthik now sitting up in bed against the pillows, hair messy from sleep, holding his phone in front of his chest with the back of the phone toward the camera. He watches the screen with a hopeful, expectant slight smile. Same bedroom wall behind him, sunlight from the left.',
        videoPrompt: 'Karthik holds perfectly still, watching his phone with a hopeful little smile, eyebrows slightly raised. He blinks, glances up and back down, still waiting. Nothing else happens. He does not speak.',
        sound: 'near silence, only a faint ceiling fan hum',
      }),
    ],
  },
  {
    heading: "ARJUN'S OFFICE — THE REACTION", locationId: 'OFFICE_01', timeOfDay: 'late morning, neutral office lighting', characterIds: ['ARJUN_01'],
    summary: 'Arjun is done.',
    shots: [
      video('Shot 10', 6, {
        shotType: 'straight-on close-up', camera: '85mm, slow subtle push-in', characterIds: ['ARJUN_01'],
        action: 'Arjun reads the birthday message, closes his eyes, exhales and delivers his verdict.',
        keyframePrompt: 'Straight-on close-up of Arjun at the conference table, eyes lowered to the phone he holds low, the phone seen from behind. His face is blank, processing. Blurred colleagues and office behind him.',
        videoPrompt: 'Arjun reads, slowly closes his eyes, exhales through his nose, lowers the phone slightly, opens his eyes with weary resignation, and says his line flatly. Then he holds still in silence. Underplayed.',
        dialogue: [{ characterId: 'ARJUN_01', line: "I'm leaving this group.", delivery: 'flat, exhausted, quiet, deadpan resignation' }],
        sound: 'muted office meeting ambience',
      }),
    ],
  },
  {
    heading: "KARTHIK'S BEDROOM — THE VOICE NOTE", locationId: 'BEDROOM_01', timeOfDay: 'late morning, sunlight from the left', characterIds: [K],
    summary: 'Karthik records a voice note defending the importance of his birthday.',
    shots: [
      video('Shot 11 (medium)', 4, {
        // Cut before the last second, where the generated clip loses the phone from his hand.
        trimSec: 3,
        shotType: 'medium shot', camera: '35mm, static', characterIds: [K],
        action: 'Karthik sits upright, offended, then determined, and starts a voice note.',
        keyframePrompt: 'A medium shot framed from the knees up: Karthik fills most of the frame height, his face large and clearly readable. He sits upright cross-legged on the unmade bed, shoulders squared, looking offended, raising his phone toward his mouth with one hand, the back of the phone toward the camera. Behind him, softly out of focus, the cream wall, the headboard and pillows, and the edge of the sunlit window on the left.',
        videoPrompt: 'Karthik straightens his back, his offended look turning into dramatic determination. He raises the phone he is holding in his right hand up close to his mouth, keeps his thumb pressed on its screen, and speaks into it earnestly. The phone stays in his right hand, held near his mouth, for the entire shot; it never leaves his hand or goes out of view.',
        dialogue: [{ characterId: K, line: 'Guys, listen.', delivery: 'conversational but offended, starting a serious announcement' }],
        sound: 'a soft voice-note recording beep, faint ceiling fan hum',
      }),
      video('Shot 11 (close-up)', 8, {
        shotType: 'close-up', camera: '75mm, static', characterIds: [K],
        action: 'Karthik sincerely explains why this birthday matters.',
        keyframePrompt: 'A tight close-up: Karthik\'s face and shoulders fill the whole frame. He sits on his bed speaking into the phone he holds just below his chin at the bottom edge of the frame, the back of the phone toward the camera, eyes wide and sincere, eyebrows raised with dramatic seriousness. Only a blurred strip of cream bedroom wall and headboard is visible behind him, with warm sunlight from the left on his face.',
        videoPrompt: 'Karthik speaks into the phone with growing dramatic emphasis, completely sincere, using small emphatic head movements. He believes every word. After the last word he holds a proud, serious look.',
        dialogue: [{ characterId: K, line: 'This birthday is different. This is my last birthday as a 22-year-old.', delivery: 'sincere, building dramatic emphasis, as if announcing a major life event' }],
        sound: 'faint ceiling fan hum',
      }),
    ],
  },
  {
    heading: "MEERA'S WORKSPACE — THE REPLY", locationId: 'MEERA_DESK_01', timeOfDay: 'late morning, soft office daylight', characterIds: ['MEERA_01'],
    summary: 'Meera, one word.',
    shots: [
      video('Shot 12', 4, {
        shotType: 'static three-quarter close-up', camera: '75mm, static', characterIds: ['MEERA_01'],
        action: 'Meera listens to the voice note, barely reacts, and replies in one word.',
        keyframePrompt: 'Three-quarter close-up of Meera at her workstation, eyes on her monitor, one hand on the keyboard, the phone beside it seen edge-on. Her face is perfectly neutral. Blurred office behind.',
        videoPrompt: 'Meera keeps working, her eyes flick down to the phone and back, and she says her single word with a straight face and precise diction. No smile, no other reaction.',
        dialogue: [{ characterId: 'MEERA_01', line: 'Thankfully.', delivery: 'deadpan, dry, precise, a tiny pause before the word' }],
        sound: 'quiet open-office ambience, soft keyboard typing',
      }),
    ],
  },
  {
    heading: "KARTHIK'S BEDROOM — THE BALANCE", locationId: 'BEDROOM_01', timeOfDay: 'late morning, sunlight from the left', characterIds: [K],
    summary: 'Karthik checks his bank balance and chooses optimism.',
    shots: [
      video('Shot 13 (over the shoulder)', 4, {
        trimSec: 3,
        shotType: 'over-the-shoulder medium close-up', camera: '50mm, static, from behind his right shoulder', characterIds: [K],
        action: 'Karthik opens his banking app; his thumb stops.',
        keyframePrompt: 'There is only ONE person in this image: Karthik, seen from behind. The camera is directly behind his right shoulder as he sits on the edge of his bed: the back of his messy-haired head and his right shoulder fill the upper foreground, and his two hands hold the smartphone in the lower centre. The phone screen is a bright, soft, out-of-focus glow with no readable content. Beyond the phone is only the blurred wooden floor and the cream wall of the bedroom; the rest of the room is empty of people.',
        videoPrompt: 'Karthik scrolls with his thumb, taps once, and then his thumb stops and hovers motionless above the glowing screen. His shoulders sink slightly. The screen stays an unreadable soft glow.',
        sound: 'faint ceiling fan hum, one soft screen tap',
      }),
      graphic('Shot 13 (screen)', 3, { type: 'bank', balance: 'Available balance: ₹83.50' }),
      video('Shot 13 (face)', 4, {
        trimSec: 3.5,
        shotType: 'close-up', camera: '75mm, static', characterIds: [K],
        action: 'His confidence fades.',
        keyframePrompt: 'A tight close-up: Karthik\'s face and shoulders fill the whole frame. He is sitting on his bed (not standing), head tilted down, staring at the phone he holds at the bottom edge of the frame with its back toward the camera, the proud determination still on his face. Behind him, blurred, are the wooden headboard, a pillow and the cream wall, with warm sunlight from the left.',
        videoPrompt: 'Karthik\'s confident expression slowly drains away as he stares at the phone: his eyebrows drop, his mouth closes, he swallows. He does not speak.',
        sound: 'near silence, faint ceiling fan hum',
      }),
      video('Shot 14', 6, {
        shotType: 'medium close-up', camera: '50mm, smooth gradual push-in', characterIds: [K],
        action: 'Karthik lowers the phone, looks at the camera and decides to make the most of it.',
        keyframePrompt: 'Medium close-up of Karthik sitting on the bed, lowering his phone to his lap, his face thoughtful, eyes just lifting toward the camera. Same bedroom, sunlight from the left.',
        videoPrompt: 'Karthik lowers the phone, looks straight into the camera, and a small confident smile grows. He says his line sincerely, with a small nod on the last words, then holds the smile, still looking at the camera. The camera pushes in gradually.',
        dialogue: [{ characterId: K, line: 'Okay. Small budget. Big memories.', delivery: 'sincere, quietly confident, slightly inspirational, a short pause after each sentence' }],
        sound: 'faint ceiling fan hum',
      }),
    ],
  },
  {
    heading: 'TITLE CARD', locationId: null, timeOfDay: '', characterIds: [],
    summary: 'OREY… MANAM!',
    shots: [graphic('Shot 15', 4, { type: 'title', text: 'OREY… MANAM!' })],
  },
];

// ── Write the production ──────────────────────────────────────────────────────────────────
const exists = fs.existsSync(path.join(store.filmDir(slug), 'film.json'));
const resetShots = process.argv.includes('--reset-shots');
if (exists && !resetShots) {
  console.log(`"${slug}" already exists. Re-run with --reset-shots to re-plan its shots (takes already made are kept where shot ids match).`);
  process.exit(0);
}

if (!exists) {
  stages.createFilm({
    slug,
    scriptPath: path.join(here, 'orey-manam-ep01-brief.md'),
    biblePath: path.join(here, 'orey-manam-series-bible.md'),
    title: 'OREY… MANAM! — Episode 01: Birthday Emergency',
    language: 'natural Indian English with a subtle Telugu-influenced rhythm',
    aspectRatio: '9:16',
    resolution: '1080p',
    capUsd: 120,
  });
}

const film = store.loadFilm(slug);
const keep = (list = [], id) => list.find((x) => x.id === id) || {};
film.bible = {
  title: 'OREY… MANAM!',
  logline: 'A group-chat emergency turns out to be Karthik announcing his birthday.',
  visualStyle: VISUAL_STYLE,
  // Anything already approved (reference, look, views, voice) survives a re-plan.
  characters: characters.map((c) => ({ ref: null, ...keep(film.bible?.characters, c.id), ...c })),
  locations: locations.map((l) => ({ ref: null, ...keep(film.bible?.locations, l.id), ...l })),
};
film.settings.voiceLanguageCode = 'en-IN';
// The directable speech model added words that are not in the script when tested, so dubbing
// uses the plain fixed voices, which read the exact line.
film.settings.speechModel = null;

// Music: restrained, and silent where the shot list asks for silence (after the birthday
// message, on Arjun's and Meera's replies). Shot ids are the plan's own, in edit order.
film.music = {
  cues: [
    // A quiet curious bed from the moment "GUYS. EMERGENCY." is sent, through the five replies.
    { file: 'music/quirky.wav', fromShot: 'S01-004', startOffsetSec: 2.2, toShot: 'S06-001', volume: 0.13, fadeInSec: 0.6, fadeOutSec: 0.7 },
    // A very light comedic build under the voice-note speech.
    { file: 'music/quirky.wav', fromSec: 12, fromShot: 'S09-001', startOffsetSec: 1.0, toShot: 'S09-002', endOffsetSec: -0.3, volume: 0.16, fadeInSec: 1.2, fadeOutSec: 0.25 },
    // A brief restrained sting as the balance appears.
    { file: 'music/quirky.wav', fromSec: 4, fromShot: 'S11-002', startOffsetSec: 0.7, toShot: 'S11-002', endOffsetSec: -0.4, volume: 0.18, fadeInSec: 0.05, fadeOutSec: 0.9 },
    // The warm cue starts under "Small budget. Big memories." and carries into the title.
    { file: 'music/warm.wav', fromShot: 'S11-004', startOffsetSec: 1.2, toShot: 'S12-001', volume: 0.24, fadeInSec: 1.6, fadeOutSec: 1.2 },
  ],
};
film.sceneIds = scenes.map((_, i) => `S${String(i + 1).padStart(2, '0')}`);
store.saveFilm(film);

scenes.forEach((scene, i) => {
  const id = film.sceneIds[i];
  let previous = null;
  try { previous = store.loadScene(slug, id); } catch { /* first plan */ }
  store.saveScene(slug, {
    id, ...scene, wardrobe: {}, text: '',
    shots: scene.shots.map((shot, n) => {
      const shotId = `${id}-${String(n + 1).padStart(3, '0')}`;
      const old = previous?.shots.find((s) => s.id === shotId && s.label === shot.label) || {};
      return { id: shotId, ...shot, keyframes: old.keyframes || [], selectedKeyframe: old.selectedKeyframe || null, clips: old.clips || [], selectedClip: old.selectedClip || null };
    }),
  });
});

const s = stages.status(slug);
const seconds = s.scenes.reduce((sum, sc) => sum + sc.seconds, 0);
console.log(`Planned ${s.scenes.reduce((n, sc) => n + sc.shots, 0)} shots in ${s.scenes.length} scenes, ${seconds}s before trims.`);
