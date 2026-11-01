// OREY… MANAM! — Episode 01 "Birthday Emergency", second production.
//
// Same shot list, dialogue, phone screens, locations and music as the first production
// (orey-manam-ep01), remade with the producers' own character sheets (characters/*.jpeg, cut
// into single views by orey-manam-cast.mjs) and with the acting directed beat by beat: the
// first production was consistent but emotionally flat.
//
// Run from the repo root:  node productions/orey-manam-ep01-v2.plan.mjs [--reset-shots]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as stages from '../backend/src/film/stages.js';
import * as store from '../backend/src/film/store.js';
import { CAST_DIR, SHEETS } from './orey-manam-cast.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const slug = 'orey-manam-ep01-v2';
const FIRST = 'orey-manam-ep01';

const VISUAL_STYLE =
  'Realistic, premium cinematic CGI with the look of the attached character references: true adult human anatomy and proportions, ' +
  'natural Indian facial features, realistic skin texture with subtle subsurface scattering (never plastic or glossy), detailed ' +
  'individual hair strands, physically believable cloth folds and materials, natural daylight with soft shadows, cinematic depth of ' +
  'field, a restrained natural colour palette and lived-in environments. Faces are alive and expressive in a natural, human way. ' +
  'Not a cartoon, not anime, not a stylised family-animation look.';

// Appearance and wardrobe are written from the supplied sheets, so the words never contradict the images.
// episodeWardrobe: only where this episode's scene needs something other than the sheet outfit.
const characters = [
  {
    id: 'KARTHIK_01', name: 'Karthik', role: 'The dreamer of the group; announces his birthday like an emergency.',
    appearance: '22-year-old Indian man, lean average build, youthful oval face, light-medium warm-brown skin, thick wavy voluminous messy black hair falling over his forehead, expressive dark-brown eyes, thick natural eyebrows, straight nose, a faint moustache shadow and light stubble.',
    wardrobe: 'Dark navy-blue checked shirt worn open over a plain white crew-neck T-shirt, light-blue jeans, grey-and-white sneakers, a dark wristwatch, a black backpack.',
    episodeWardrobe: 'A faded navy-blue crew-neck T-shirt and charcoal-grey joggers, barefoot. No checked shirt, no backpack, no wristwatch, no shoes.',
    voice: 'young Indian male, about 23, medium pitch, expressive and friendly, conversational Indian English with a subtle Telugu-influenced rhythm',
  },
  {
    id: 'ARJUN_01', name: 'Arjun', role: 'The practical, tired young professional.',
    appearance: '23-year-old Indian man, lean build, medium-brown skin, slightly rectangular oval face with a defined jawline, neat short black hair swept to the side, dark-brown eyes, well-defined eyebrows, straight nose, clean-shaven, composed intelligent expression.',
    wardrobe: 'Light-blue office shirt with sleeves rolled to the forearms, charcoal-grey trousers, a dark belt, a black wristwatch, dark sneakers, a black backpack.',
    episodeWardrobe: 'Exactly the same light-blue office shirt with rolled sleeves, charcoal-grey trousers, dark belt, black wristwatch and dark sneakers, but with NO backpack and no straps on his shoulders.',
    voice: 'young Indian male, about 24, medium-low pitch, steady rhythm, clear diction, restrained emotion, understated sarcasm',
  },
  {
    id: 'MEERA_01', name: 'Meera', role: 'The sharp, deadpan one.',
    appearance: '23-year-old Indian woman, petite build, medium-deep warm-brown skin, soft oval face, large expressive dark-brown eyes, natural eyebrows, a small black bindi, a chin-length wavy black bob with a side part, silver jhumka earrings.',
    wardrobe: 'Teal printed kurti with pale embroidery at the neckline and three-quarter sleeves, light-blue jeans, white flats, a slim wristwatch, a cream cloth tote bag on her shoulder.',
    episodeWardrobe: 'Exactly the same teal printed kurti with pale embroidery, light-blue jeans, white flats, silver jhumka earrings and slim wristwatch, but with NO tote bag and no strap on her shoulder.',
    voice: 'young Indian female, about 23, medium pitch, confident, crisp articulation, dry humour, deadpan delivery',
  },
  {
    id: 'SANTHOSH_01', name: 'Santhosh', role: 'The warm, unbothered food lover.',
    appearance: '23-year-old Indian man, heavyset stocky soft-bodied build with a round belly, medium-brown skin, a round friendly face with full cheeks and a soft double chin, thick wavy voluminous black hair, warm dark-brown eyes, thick eyebrows, broad nose, a faint moustache shadow.',
    wardrobe: 'Yellow-and-blue checked short-sleeved shirt worn open over a plain beige T-shirt, blue jeans, dark sneakers, a dark wristwatch.',
    voice: 'young Indian male, about 23, warm medium pitch, relaxed unhurried rhythm, casual sincere delivery',
  },
  {
    id: 'ROHIT_01', name: 'Rohit', role: 'The stylish romantic.',
    appearance: '21-year-old Indian man, slim build, deep warm-brown skin, a lean face with a sharp jawline, short textured black hair with faded sides, expressive dark-brown eyes, strong straight eyebrows, straight nose, clean-shaven.',
    wardrobe: 'Black denim jacket worn open over a plain black T-shirt, black cargo trousers, black-and-white sneakers, a dark wristwatch, a thin chain at the neck, a black backpack.',
    episodeWardrobe: 'Exactly the same black denim jacket over a black T-shirt, black cargo trousers, black-and-white sneakers, dark wristwatch and thin chain, but with NO backpack and no straps on his shoulders.',
    voice: 'young Indian male, about 23, medium-high pitch, lively conversational rhythm, curious and playful, not childish',
  },
  {
    id: 'VICKY_01', name: 'Vicky', role: 'The defensive one with a story for everything.',
    appearance: '22-year-old Indian man, average build, medium warm-brown skin, a softly rounded face, thick curly voluminous black hair, lively dark-brown eyes, expressive eyebrows, a slightly broad nose, light stubble along the jaw.',
    wardrobe: 'Olive-green zip hoodie worn open over a plain black T-shirt, dark charcoal jeans, black-and-white sneakers, a dark wristband.',
    episodeWardrobe: 'Exactly the same olive-green zip hoodie open over a black T-shirt, dark charcoal jeans and black-and-white sneakers, plus a slim black wireless headset with a boom microphone worn over his curly hair. No backpack.',
    voice: 'young Indian male, about 24, medium pitch, quick delivery, natural hesitations, mild nervousness',
  },
  {
    // Not on screen in this episode (only named in Rohit's message); kept so later episodes inherit her.
    id: 'PRIYA_01', name: 'Priya', role: 'The observant newcomer Rohit likes.',
    appearance: '22-year-old Indian woman, medium-brown skin, a softly angular oval face, expressive dark-brown eyes, naturally full eyebrows, straight nose, wavy dark-brown hair falling past her shoulders with a slightly off-centre part, small gold hoop earrings.',
    wardrobe: 'Burgundy casual jacket worn open over a plain black T-shirt, dark jeans, white sneakers, a black crossbody bag.',
    voice: '',
  },
];

// ── Shots ─────────────────────────────────────────────────────────────────────────────────
// performance: the acting, as beats in order. expression: the face each character opens on,
// naming one of that character's own expression views (neutral, happy, annoyed, surprised).
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
        shotType: 'wide establishing shot', camera: '24mm, stationary with a very gentle push-in', characterIds: [K],
        action: 'Karthik sleeps on his unmade bed with his phone lying across his face.',
        keyframePrompt: 'The whole bedroom in frame, seen from just inside the room. Karthik lies asleep on his back on the unmade bed, one arm hanging off the side, mouth slightly open, his smartphone resting flat across his face. The wall clock hands show about 10:47. Late-morning sunlight enters through the window on the left, casting soft shadows. The ceiling fan is above. No door or door frame in the shot.',
        videoPrompt: 'Karthik stays fast asleep, completely limp; his chest rises and falls slowly. The ceiling fan rotates steadily and the curtain moves slightly. The camera pushes in very gently.',
        performance: 'deep, heavy, unbothered sleep; one small sleepy twitch of his dangling hand; nothing else.',
        sound: 'ceiling fan hum, faint morning street sounds through the window',
      }),
      video('Shot 02', 6, {
        trimSec: 5,
        shotType: 'tight close-up', camera: '85mm, static, shallow depth of field', characterIds: [K],
        expression: { [K]: 'neutral' },
        action: 'The phone vibrates against his face; he twitches, opens his eyes and lifts the phone away.',
        keyframePrompt: 'Tight close-up of Karthik asleep on his pillow, eyes closed, face slack and relaxed, lips slightly parted, his smartphone resting against his cheek and forehead with the back of the phone toward the camera. Soft late-morning light from the left.',
        videoPrompt: 'The phone vibrates and its screen glow lights his face softly. He wakes and lifts the phone away from his face to look at it. The back of the phone stays toward the camera; the screen is never shown.',
        performance: 'he flinches at the vibration with his eyes still shut; his brow creases in sleepy annoyance; one eye opens, then the other, heavy-lidded and unfocused; he squints at the phone, blinks twice, and his eyes slowly sharpen as he registers what he is reading.',
        sound: 'a phone vibrating against skin, one soft notification chime, ceiling fan hum',
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
        expression: { ARJUN_01: 'neutral' },
        action: 'Arjun discreetly checks his phone during a meeting and reacts with concern.',
        keyframePrompt: 'Framed from the chest up, his face large and clearly readable. Arjun sits at the conference table, body facing the meeting, his eyes lowered to the smartphone he holds discreetly below the table edge; the phone is seen from behind so its screen is not visible. A slight crease of concern is forming between his eyebrows. Colleagues and the presentation screen are blurred in the background.',
        videoPrompt: 'Arjun reads his phone below the table and says his line quietly while typing with his thumb. Minimal, controlled movement.',
        performance: 'his eyes scan the message; his brow tightens with real concern; a quick guilty glance up toward the meeting to check nobody noticed; back down to the phone; he says the line under his breath, lips barely moving, worried rather than annoyed.',
        dialogue: [{ characterId: 'ARJUN_01', line: 'What happened?', delivery: 'quietly, under his breath in a meeting, measured and genuinely concerned' }],
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
        expression: { MEERA_01: 'neutral' },
        action: 'Meera keeps typing, notices the message on her phone, and replies deadpan.',
        keyframePrompt: 'Framed from the chest up, her face large and clearly readable. Meera sits at her workstation seen from a three-quarter side angle, the edge of her monitor in the soft foreground. Her hands are on the keyboard; her smartphone lies face-up beside it, seen edge-on so the screen is not readable. Her expression is calm, focused and neutral.',
        videoPrompt: 'Meera types, glances down at her phone without moving her head much, and says her line, then returns her eyes to the monitor.',
        performance: 'focused on her work; her eyes flick down to the phone and one eyebrow lifts a millimetre; she says the line completely flat and unbothered, as if asking the time; the faintest amused twitch at one corner of her mouth after the last word; eyes back to the monitor.',
        dialogue: [{ characterId: 'MEERA_01', line: 'Who got arrested?', delivery: 'deadpan, dry and crisp, completely unbothered, a tiny lift on the last word' }],
        sound: 'quiet open-office ambience, soft keyboard typing',
      }),
    ],
  },
  {
    heading: "VICKY'S WORKSPACE", locationId: 'VICKY_DESK_01', timeOfDay: 'late morning, neutral daylight', characterIds: ['VICKY_01'],
    summary: 'Vicky, on a client call, denies involvement in advance.',
    shots: [
      video('Shot 06', 6, {
        shotType: 'front three-quarter medium close-up', camera: '50mm, static, the open laptop framing the lower foreground', characterIds: ['VICKY_01'],
        expression: { VICKY_01: 'happy' },
        action: 'On a client call, Vicky glances at his buzzing phone, freezes, and replies defensively.',
        keyframePrompt: 'Framed from the chest up, his face large and clearly readable. Vicky sits at his desk wearing his wireless headset, facing his laptop, which frames the bottom foreground from behind (its screen is not visible). He wears a polite, slightly forced professional smile for a client call. His smartphone lies on the desk beside the laptop.',
        videoPrompt: 'Vicky nods at his laptop as if listening to a client through his headset. His smartphone buzzes on the desk; he looks down at it without picking it up, then says his line quickly in a lowered voice. His hands stay on the desk and laptop the whole time: he never picks up or holds any phone or handset, and there is no landline telephone in the scene.',
        performance: 'a polite professional nod and smile for the client; the phone buzzes and his eyes drop to it; the smile freezes, then falls; his eyes widen slightly with dread; a nervous swallow; he leans in and blurts the line fast and hushed, eyebrows raised in innocence, eyes flicking back to the laptop to check the client did not notice.',
        dialogue: [{ characterId: 'VICKY_01', line: "Karthik, whatever it is, I wasn't involved.", delivery: 'fast and hushed, nervous and defensive, stressing "wasn\'t"' }],
        sound: 'quiet room, a phone buzzing on a wooden desk, a faint unintelligible voice from a headset',
      }),
    ],
  },
  {
    heading: "SANTHOSH'S EATING AREA", locationId: 'DINING_01', timeOfDay: 'late morning, warm daylight', characterIds: ['SANTHOSH_01'],
    summary: 'Santhosh asks the only question that matters to him.',
    shots: [
      video('Shot 07', 4, {
        shotType: 'slightly low three-quarter medium close-up', camera: '35mm, static, the snack plate blurred in the bottom foreground', characterIds: ['SANTHOSH_01'],
        expression: { SANTHOSH_01: 'happy' },
        action: 'Santhosh eats, looks at his phone, and asks his question without stopping his meal.',
        keyframePrompt: 'A close medium shot framed from the chest up: Santhosh\'s head and shoulders fill the upper two-thirds of the frame, his face large and clearly readable. He sits at his dining table, seen from a slightly low three-quarter angle, with the edge of the steel snack plate blurred in the bottom foreground. He holds a samosa near his mouth in one hand and his smartphone in the other, the phone seen from behind. A relaxed, content expression. The pale-yellow wall and steel-container shelf are softly out of focus behind him.',
        videoPrompt: 'Santhosh chews calmly, looks at his phone, and says his line between bites, then takes another bite. Subtle, natural eating.',
        performance: 'content, unhurried chewing; he reads the phone with mild curiosity; his eyebrows lift with sudden, sincere hope; he asks the question earnestly, as though it is the only reasonable thing to ask; a small satisfied nod; another bite.',
        dialogue: [{ characterId: 'SANTHOSH_01', line: 'Is there food?', delivery: 'warm, relaxed and completely sincere, genuinely hopeful' }],
        sound: 'quiet apartment ambience, a steel plate clinking softly',
      }),
    ],
  },
  {
    heading: "ROHIT'S ROOM", locationId: 'ROHIT_ROOM_01', timeOfDay: 'late morning, soft daylight', characterIds: ['ROHIT_01'],
    summary: 'Rohit assumes it is about Priya.',
    shots: [
      video('Shot 08', 6, {
        shotType: 'medium close-up', camera: '50mm, static', characterIds: ['ROHIT_01'],
        expression: { ROHIT_01: 'happy' },
        action: 'Rohit stops composing a message, reads the group chat, and gets curious.',
        keyframePrompt: 'A close medium shot framed from the chest up: Rohit\'s head and shoulders fill the upper two-thirds of the frame, his face large and clearly readable, lit by soft daylight, with a small dreamy smile. He sits at his desk holding his smartphone in both hands at chest height in the lower foreground, seen from behind so the screen is not visible, slightly out of focus. The blue-grey wall, framed prints and fairy lights are softly blurred behind him.',
        videoPrompt: 'Rohit types on his phone, then a notification makes him stop. He leans in toward the phone and says his line.',
        performance: 'a soft, private, dreamy smile while typing; the notification makes him pause and the smile fades to puzzlement; then his eyes light up as an idea lands, eyebrows lifting; he leans in and asks the question with eager, hopeful curiosity and a half-smile he cannot hide.',
        dialogue: [{ characterId: 'ROHIT_01', line: 'Bro, is this about Priya?', delivery: 'playful and eager, genuinely curious, a hopeful lift on "Priya"' }],
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
        expression: { [K]: 'happy' },
        action: 'Karthik waits hopefully for the group to respond.',
        keyframePrompt: 'A close-up: Karthik\'s face and shoulders fill the frame. He sits up in bed against the pillows, hair messy from sleep, holding his phone in front of his chest with the back of the phone toward the camera. He watches the screen with a hopeful, expectant little smile, eyebrows slightly raised. The headboard and cream wall are blurred behind him, sunlight from the left.',
        videoPrompt: 'Karthik holds still, watching his phone and waiting. He does not speak.',
        // Kept to what fits in four seconds; a longer list came back as a generic smile.
        performance: 'he holds a bright, hopeful, closed-mouth smile while his eyes scan the phone for replies; then the smile slowly weakens into uncertainty and his eyebrows lift a little, still waiting. His mouth stays closed for the whole shot.',
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
        expression: { ARJUN_01: 'annoyed' },
        action: 'Arjun reads the birthday message, closes his eyes, exhales and delivers his verdict.',
        keyframePrompt: 'A straight-on close-up: Arjun\'s face and shoulders fill the frame. He sits at the conference table with his eyes lowered to the phone he holds low, the phone seen from behind. His face is blank and still, just beginning to tighten with mild disbelief; restrained, not angry. Blurred colleagues and office behind him.',
        videoPrompt: 'Arjun reads the message on his phone, closes his eyes, exhales, lowers the phone slightly and says his line. Then he holds still in silence. The camera pushes in slowly.',
        performance: 'he reads; his face goes completely still; a slow blink of disbelief; his eyes close and stay closed for a full second; a long, weary exhale through the nose and his shoulders drop; his eyes open, flat and exhausted; he says the line with total deadpan resignation, barely moving his face; then a tired stare into the middle distance.',
        dialogue: [{ characterId: 'ARJUN_01', line: "I'm leaving this group.", delivery: 'flat, quiet, utterly exhausted deadpan, a small downward drop at the end' }],
        sound: 'muted office meeting ambience',
      }),
    ],
  },
  {
    heading: "KARTHIK'S BEDROOM — THE VOICE NOTE", locationId: 'BEDROOM_01', timeOfDay: 'late morning, sunlight from the left', characterIds: [K],
    summary: 'Karthik records a voice note defending the importance of his birthday.',
    shots: [
      video('Shot 11 (medium)', 4, {
        shotType: 'medium shot', camera: '35mm, static', characterIds: [K],
        expression: { [K]: 'annoyed' },
        action: 'Karthik sits upright, offended, then determined, and starts a voice note.',
        keyframePrompt: 'A medium shot framed from the knees up: Karthik fills most of the frame height, his face large and clearly readable. He sits upright cross-legged on the unmade bed, shoulders squared, looking wounded and offended, holding his phone up near his mouth in his right hand with the back of the phone toward the camera. Behind him, softly out of focus, the cream wall, the headboard and pillows, and the edge of the sunlit window on the left.',
        videoPrompt: 'Karthik holds the phone near his mouth in his right hand, thumb pressed on its screen, and speaks into it. The phone stays in his right hand near his mouth for the entire shot; it never leaves his hand or goes out of view.',
        performance: 'wounded disbelief at being ignored, mouth slightly open; he draws himself up, chin lifting; the hurt hardens into theatrical determination; he presses the phone and begins, earnest and a little indignant.',
        dialogue: [{ characterId: K, line: 'Guys, listen.', delivery: 'offended but earnest, firmly calling the room to order' }],
        sound: 'a soft voice-note recording beep, faint ceiling fan hum',
      }),
      video('Shot 11 (close-up)', 8, {
        shotType: 'close-up', camera: '75mm, static', characterIds: [K],
        expression: { [K]: 'neutral' },
        action: 'Karthik sincerely explains why this birthday matters.',
        keyframePrompt: 'A tight close-up: Karthik\'s face and shoulders fill the whole frame. He sits on his bed speaking into the phone he holds just below his chin at the bottom edge of the frame, the back of the phone toward the camera, his eyes wide and utterly sincere, eyebrows drawn up with dramatic seriousness. Only a blurred strip of cream bedroom wall and headboard is visible behind him, with warm sunlight from the left on his face.',
        videoPrompt: 'Karthik records a voice note: he holds the phone in front of his mouth, just below his chin, like a microphone, and speaks toward it with small emphatic head movements. The phone is never raised to his ear. After the last word he holds a proud, solemn look.',
        performance: 'he starts quiet and grave, as if sharing serious news; on "last birthday" his eyebrows rise and his voice lifts with real feeling; on "22-year-old" he gives one slow, heavy nod; he ends holding a proud, solemn stare, completely convinced.',
        dialogue: [{ characterId: K, line: 'This birthday is different. This is my last birthday as a 22-year-old.', delivery: 'sincere and grave, building to dramatic emphasis, as if announcing a major life event' }],
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
        expression: { MEERA_01: 'neutral' },
        action: 'Meera listens to the voice note, barely reacts, and replies in one word.',
        keyframePrompt: 'A three-quarter close-up: Meera\'s face and shoulders fill the frame. She is at her workstation, eyes on her monitor, one hand on the keyboard, the phone beside it seen edge-on. Her face is perfectly composed and neutral. Blurred office behind.',
        videoPrompt: 'Meera keeps working, glances down at the phone and back, and says her single word.',
        performance: 'she is completely still and unsmiling, eyes on her monitor; her eyes slide down to the phone and back; she says the one word flat and dry, with no smile at all; only after the word, one corner of her mouth lifts very slightly.',
        dialogue: [{ characterId: 'MEERA_01', line: 'Thankfully.', delivery: 'deadpan and precise after a tiny pause, quietly pleased with herself' }],
        sound: 'quiet open-office ambience, soft keyboard typing',
      }),
    ],
  },
  {
    heading: "KARTHIK'S BEDROOM — THE BALANCE", locationId: 'BEDROOM_01', timeOfDay: 'late morning, sunlight from the left', characterIds: [K],
    summary: 'Karthik checks his bank balance and chooses optimism.',
    shots: [
      video('Shot 13 (over the shoulder)', 4, {
        // Cut early: the selected take ends with a stray hand gesture.
        trimSec: 2,
        shotType: 'over-the-shoulder medium close-up', camera: '50mm, static, from behind his right shoulder', characterIds: [K],
        action: 'Karthik opens his banking app; his thumb stops.',
        keyframePrompt: 'There is only ONE person in this image: Karthik, seen from behind. The camera is directly behind his right shoulder as he sits on the edge of his bed: the back of his messy-haired head and his right shoulder fill the upper foreground, and his two hands hold the smartphone in the lower centre. The phone screen is a bright, soft, out-of-focus glow with no readable content. Beyond the phone is only the blurred wooden floor and the cream wall of the bedroom; the rest of the room is empty of people.',
        videoPrompt: 'Karthik scrolls with his thumb, taps once, and then his thumb stops and hovers motionless above the glowing screen. The screen stays an unreadable soft glow.',
        performance: 'a confident, quick scroll and tap; then his thumb freezes mid-air; his shoulders slowly sink and his head dips a little.',
        sound: 'faint ceiling fan hum, one soft screen tap',
      }),
      graphic('Shot 13 (screen)', 3, { type: 'bank', balance: 'Available balance: ₹83.50' }),
      video('Shot 13 (face)', 4, {
        trimSec: 3.5,
        shotType: 'close-up', camera: '75mm, static', characterIds: [K],
        expression: { [K]: 'happy' },
        action: 'His confidence fades.',
        keyframePrompt: 'A very tight close-up from straight in front: Karthik\'s face fills the frame from forehead to collarbone; no hands, legs, knees or room are in the shot. His head is tilted slightly down and his eyes look down toward a phone that is below the bottom of the frame. He still wears the small, confident, closed-mouth half-smile from his speech (not a grin, no teeth). Behind him, blurred, are the wooden headboard, a pillow and the cream wall, with warm sunlight from the left.',
        videoPrompt: 'Karthik stares at his phone. He does not speak.',
        performance: 'the small proud smile freezes, then slowly fades into a blank, worried stare; he blinks hard twice, as if the number might change; his lips press together. Quiet and deflated, never a grimace. His mouth stays closed for the whole shot.',
        sound: 'near silence, faint ceiling fan hum',
      }),
      video('Shot 14', 6, {
        shotType: 'medium close-up', camera: '50mm, smooth gradual push-in', characterIds: [K],
        expression: { [K]: 'neutral' },
        action: 'Karthik lowers the phone, looks at the camera and decides to make the most of it.',
        keyframePrompt: 'A medium close-up framed from the chest up: Karthik sits on his bed, lowering his phone to his lap, his face thoughtful and a little deflated, eyes just lifting toward the camera. The cream wall, headboard and sunlit window edge are softly blurred behind him.',
        videoPrompt: 'Karthik lowers the phone, looks straight into the camera and says his line, then holds the smile, still looking at the camera. The camera pushes in gradually.',
        performance: 'deflated, he exhales and looks down; a thought arrives and his eyes come up to the camera; a small, brave smile grows from one corner of his mouth; he says "Okay." with a little shrug of acceptance, "Small budget." matter-of-factly, then "Big memories." warmly, with a small confident nod; the smile widens into real, hopeful optimism and he holds it.',
        dialogue: [{ characterId: K, line: 'Okay. Small budget. Big memories.', delivery: 'sincere and quietly confident, warming into hopeful optimism, a short pause after each sentence' }],
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
if (exists && !process.argv.includes('--reset-shots')) {
  console.log(`"${slug}" already exists. Re-run with --reset-shots to re-plan its shots (takes already made are kept where shot ids and labels match).`);
  process.exit(0);
}

const castRef = (id, view) => `refs/characters/${id}/${view}.png`;
if (!exists) {
  // Locations, settings and the series bible come from the first production; the cast does not.
  stages.createFilm({
    slug, from: FIRST,
    scriptPath: path.join(here, 'orey-manam-ep01-brief.md'),
    title: 'OREY… MANAM! — Episode 01: Birthday Emergency',
    capUsd: 120,
  });
  fs.rmSync(store.abs(slug, 'refs/characters'), { recursive: true, force: true });
  for (const id of Object.keys(SHEETS)) fs.cpSync(path.join(CAST_DIR, id), store.abs(slug, `refs/characters/${id}`), { recursive: true });
  fs.cpSync(store.abs(FIRST, 'music'), store.abs(slug, 'music'), { recursive: true });
}

const film = store.loadFilm(slug);
const first = store.loadFilm(FIRST);
const previous = (id) => film.bible?.characters.find((c) => c.id === id && c.suppliedViews) || {};
film.bible = {
  title: 'OREY… MANAM!',
  logline: 'A group-chat emergency turns out to be Karthik announcing his birthday.',
  visualStyle: VISUAL_STYLE,
  characters: characters.map((c) => ({
    ...c,
    ref: castRef(c.id, 'body'),
    views: Object.fromEntries(['closeup', 'threeQuarter', 'profileLeft', 'neutral', 'happy', 'annoyed', 'surprised'].map((v) => [v, castRef(c.id, v)])),
    suppliedViews: true,
    // An episode outfit already drawn in this production survives a re-plan.
    look: previous(c.id).look || null,
    // Each character keeps the fixed voice chosen in the first production.
    voiceId: first.bible.characters.find((x) => x.id === c.id)?.voiceId,
  })),
  locations: first.bible.locations,
};
film.settings.voiceLanguageCode = 'en-IN';
film.settings.speechModel = null;
film.music = first.music;
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
console.log(`Planned ${s.scenes.reduce((n, sc) => n + sc.shots, 0)} shots in ${s.scenes.length} scenes; references locked: ${s.refs.filter((r) => r.locked).length}/${s.refs.length}.`);
