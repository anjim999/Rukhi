/**
 * Prompt builders for the film pipeline. Kept together so the wording that drives
 * consistency (what is locked by reference image vs. described in text) is in one place.
 */

export function biblePrompt({ numberedScript, style, language, seriesBible, locked }) {
  const lockedBlock = locked && (locked.characters.length || locked.locations.length)
    ? `\nALREADY APPROVED — these exist with locked reference images. Return each one with the same "id" and "name"; do not create a second entry for the same person or place:\n${JSON.stringify(locked, null, 2)}\n`
    : '';
  const seriesBlock = seriesBible
    ? `\nSERIES BIBLE — written by the producers and authoritative. Use its character IDs exactly as written (for example KARTHIK_01) as the "id" values, take every appearance, wardrobe, voice, set and style detail it states, and only fill in what it leaves unspecified:\n<<<\n${seriesBible}\n>>>\n`
    : '';

  return `You are the script supervisor and production designer for a film. Read the screenplay below and produce the production bible as JSON.

Each screenplay line is prefixed with its line number and a "|".
${style ? `The director's requested visual style: ${style}\n` : ''}Dialogue language: ${language}. Write every description in English, whatever language the screenplay is in.
${seriesBlock}${lockedBlock}
Return a JSON object with exactly these fields:
{
  "title": string,
  "logline": string,
  "visualStyle": string,   // one paragraph: overall look, colour palette, lighting, lens and film-stock feel. Must stay fixed for the whole film.
  "characters": [{
    "id": "C01",           // the series bible's ID if it gives one, otherwise C01, C02, ... in order of first appearance
    "name": string,
    "role": string,
    "appearance": string,  // age, ethnicity, face shape, skin tone, hair, facial hair, build, height. Concrete and unchanging.
    "wardrobe": string,    // one default outfit with exact garments and colours
    "voice": string,       // gender, apparent age, tone, pace, accent
    "expressions": { "happy": string, "annoyed": string, "surprised": string }  // how each looks on THIS face, if the series bible says; otherwise omit
  }],
  "locations": [{
    "id": "L01",
    "name": string,
    "description": string  // architecture, key props, materials, colour palette, light sources. Concrete and unchanging.
  }],
  "scenes": [{
    "id": "S01",           // S01, S02, ... in screenplay order
    "heading": string,
    "locationId": string,
    "timeOfDay": string,
    "characterIds": [string],
    "wardrobe": { "<characterId>": string },  // only for characters whose outfit in this scene differs from their default; otherwise {}
    "summary": string,
    "startLine": number,   // first screenplay line of the scene
    "endLine": number      // last screenplay line of the scene
  }]
}

Rules:
- Include only characters who appear on screen. Give unnamed speaking parts a short descriptive name.
- Reuse one location id every time the story returns to the same place.
- A new scene starts whenever the location or the time changes.
- Scenes must cover every line of the screenplay, in order, with no gaps and no overlaps.
- Where the screenplay does not specify a detail of appearance or wardrobe, choose one that fits and state it definitely.

SCREENPLAY:
${numberedScript}`;
}

export function shotsPrompt({ film, scene, previousSummary }) {
  const { bible, settings } = film;
  const characters = bible.characters
    .filter((c) => scene.characterIds.includes(c.id))
    .map((c) => `- ${c.id} ${c.name}: ${c.role}`)
    .join('\n');
  const location = bible.locations.find((l) => l.id === scene.locationId);

  return `You are the director and cinematographer breaking one scene of a film into shots for an AI video model that renders one continuous shot of 4, 6 or 8 seconds at a time.

FILM: ${bible.title}
VISUAL STYLE: ${bible.visualStyle}
DIALOGUE LANGUAGE: ${settings.language}

SCENE ${scene.id}: ${scene.heading} (${scene.timeOfDay})
LOCATION: ${location ? `${location.name} — ${location.description}` : scene.heading}
CHARACTERS IN THIS SCENE:
${characters || '- none'}
${previousSummary ? `PREVIOUS SCENE: ${previousSummary}\n` : ''}
SCENE TEXT:
${scene.text}

Return a JSON object: { "shots": [ ... ] } where each shot is
{
  "durationSec": 4 | 6 | 8,
  "shotType": string,          // e.g. "wide establishing", "medium two-shot", "close-up", "over-the-shoulder", "insert"
  "camera": string,            // lens feel and movement, e.g. "35mm, slow push-in", "locked-off", "handheld follow"
  "characterIds": [string],    // characters visible in frame, at most 3
  "action": string,            // one sentence, what happens
  "dialogue": [{ "characterId": string, "line": string, "delivery": string }],  // delivery: how the line is said, e.g. "sleepy mumble", "deadpan", "panicked whisper"
  "keyframePrompt": string,    // the FIRST FRAME as a still: framing, who is where, pose, expression, lighting, time of day
  "videoPrompt": string,       // what moves during the shot: performance, action, camera move
  "sound": string              // diegetic sound and ambience only, no music
}

Rules:
- Cover the whole scene in order. Every line of dialogue must appear, verbatim and in its original language, in exactly one shot.
- Speech runs at about 2.3 words per second. If a line does not fit a shot, split it at a natural pause across consecutive shots; do not shorten it.
- Prefer one speaker per shot. Cut on speaker changes, reactions and actions, as an editor would.
- Open the scene with a shot that establishes the location. Vary shot sizes; do not repeat the same framing in consecutive shots.
- Keep screen direction consistent: characters stay on the same side of frame across a conversation.
- In keyframePrompt and videoPrompt refer to characters by name only. Do not describe their face, hair or clothes; reference images supply those.
- No on-screen text, titles or subtitles in any shot.
- Use only character ids listed above.`;
}

/**
 * styleAnchors: how many already-approved characters of the same production are attached,
 * so the whole cast is rendered at one level of realism instead of drifting between styles.
 */
export function characterRefPrompt(film, character, { styleAnchors = 0 } = {}) {
  const anchor = styleAnchors
    ? `The ${styleAnchors} attached image${styleAnchors > 1 ? 's show' : ' shows'} OTHER, already approved cast members of the same production. Use them ONLY for the rendering style: level of realism, skin and hair detail, lighting, backdrop and full-body framing. This is a NEW cast member who must not look like any of them: do not reuse any of their faces, hairstyles, hair lengths, body shapes or clothes. The new person's face shape, hair and body build follow the description below exactly, even where that differs strongly from the attached people.\n`
    : '';
  return `Character reference image for film production.
${anchor}STYLE: ${film.bible.visualStyle}
CHARACTER (face shape, hair and body build are the most important things to get right): ${character.name}. ${character.appearance}
WARDROBE: ${character.wardrobe}
Framing: one person only, full body from head to shoes, standing upright, facing the camera, arms relaxed, neutral expression.
Background: plain light-grey studio backdrop, soft even lighting, no dramatic shadows, no props.
Natural human proportions and anatomically correct hands. ${STYLE_EXCLUSIONS}
No text, labels, borders, watermarks or multiple panels.`;
}

/**
 * The reference sheet drawn from each approved full-body front design: the remaining
 * head views, body views and expressions. Each is its own image rather than one multi-panel
 * sheet, so a face stays large enough to condition later shots.
 */
export const CHARACTER_VIEWS = {
  closeup: 'Front-facing head-and-shoulders portrait, looking at the camera, neutral expression.',
  threeQuarter: 'Three-quarter facial view, head and shoulders, face turned about 45 degrees, neutral expression.',
  profileLeft: 'Full left profile, head and shoulders, the left side of the face toward the camera, neutral expression.',
  profileRight: 'Full right profile, head and shoulders, the right side of the face toward the camera, neutral expression.',
  bodySide: 'Full-body side view from head to shoes, standing upright, neutral expression.',
  bodyThreeQuarter: 'Three-quarter full-body view from head to shoes, standing upright, neutral expression.',
  happy: 'Front-facing head-and-shoulders portrait with a happy, naturally smiling expression.',
  annoyed: 'Front-facing head-and-shoulders portrait with an annoyed expression, eyebrows slightly furrowed.',
  surprised: 'Front-facing head-and-shoulders portrait with a surprised expression, eyes widened and mouth naturally open.',
};

// Look-and-feel exclusions from the series rules, for the image model (which has no negative-prompt field).
export const STYLE_EXCLUSIONS = 'Avoid: family-animation or toy-like character stylisation, childish cartoon style, big eyes, oversized heads, thin stick-like limbs, simplified smooth faces, flat 2D animation, anime, mobile-game graphics, plastic or glossy skin, caricature, oversaturated colours, beauty-filter smoothing, deformed or extra fingers.';

/** The approved character re-dressed for this production, generated from the series master. */
export function characterLookPrompt(film, character, { withFace = false } = {}) {
  return `Costume fitting for film production. The ${withFace ? 'first attached image is the approved full-body design of ' + character.name + ', and the second is a close-up of the same person\'s face' : 'attached image is the approved design of ' + character.name}.
Draw the SAME person again: identical face shape, eye shape and spacing, eyebrows, nose, lips, ears, jawline, hairline, hairstyle, skin tone, apparent age, height and build. Change only the clothing and accessories.
OUTFIT FOR THIS EPISODE (replaces everything worn in the reference): ${character.episodeWardrobe}
Framing: one person only, full body from head to feet, standing upright, facing the camera, arms relaxed, neutral expression.
STYLE: ${film.bible.visualStyle}
Background: the same plain light-grey studio backdrop, soft even lighting, no dramatic shadows, no props.
${STYLE_EXCLUSIONS}
No text, labels, borders, watermarks or multiple panels.`;
}

/** A further view of an approved character, generated from the locked reference image. */
export function characterViewPrompt(film, character, view) {
  const ownExpression = character.expressions?.[view];
  return `Character turnaround for film production. The attached image is the approved design of ${character.name}.
Draw the SAME person again: identical face shape, eye shape and spacing, eyebrows, nose, lips, ears, jawline, hairline, hairstyle, skin tone, apparent age, build, clothing and accessories. Change only what the view asks for.
VIEW: ${CHARACTER_VIEWS[view]}${ownExpression ? ` For this character: ${ownExpression}` : ''}
STYLE: ${film.bible.visualStyle}
Background: the same plain light-grey studio backdrop, soft even lighting, no dramatic shadows.
Natural, unexaggerated expression. ${STYLE_EXCLUSIONS}
One person only. No text, labels, borders, watermarks or multiple panels.`;
}

export function locationRefPrompt(film, location) {
  return `Location reference image for film production: a wide establishing view of the set.
STYLE: ${film.bible.visualStyle}
LOCATION: ${location.name}. ${location.description}
Framing: wide angle showing the whole space, eye level, deep focus.
The location is empty: no people, no animals.
No text, labels, borders or watermarks.`;
}

/**
 * refs is the ordered list of attached images, each { kind, name, note? }, so the numbered
 * legend in the prompt always matches the order the images are sent in.
 */
export function keyframePrompt({ film, shot, refs, wardrobe = {}, timeOfDay }) {
  const legend = {
    character: (r) => `CHARACTER ${r.name}, full body — keep the face, hair, body and clothing exactly as in this reference.`,
    face: (r) => `CHARACTER ${r.name}, face close-up — this is the same person; match every facial feature, the hair and the skin tone exactly. Ignore the clothing and background in this image.`,
    expression: (r) => `CHARACTER ${r.name}, expression reference (${r.note}) — the same person. Use it for how THIS face looks with that feeling, at the strength the shot description asks for. Ignore its clothing, framing and background.`,
    profile: (r) => `CHARACTER ${r.name}, side profile — the same person seen from the side; match it for any side-on view.`,
    location: (r) => `LOCATION ${r.name} — keep the room layout, furniture, props and colours exactly as in this reference.`,
    previous: () => 'EARLIER SHOT in this same location — use it ONLY to keep the room, furniture, props, lighting direction, colour grade and outfits consistent. The new shot has a DIFFERENT camera position and framing, given below: do not reproduce the earlier shot\'s composition or camera distance, and do not carry its figure over as an additional person.',
  };
  const outfitChanges = Object.entries(wardrobe)
    .map(([name, outfit]) => `${name} wears this instead of the reference outfit: ${outfit}.`)
    .join(' ');

  return `Create one cinematic film still: the first frame of a shot.
STYLE: ${film.bible.visualStyle}

Reference images are attached in this order:
${refs.map((r, i) => `${i + 1}. ${legend[r.kind](r)}`).join('\n') || 'none'}

SHOT: ${shot.shotType}. Camera: ${shot.camera}. Time of day: ${timeOfDay}.
${shot.keyframePrompt}
${outfitChanges}

One single ${film.settings.aspectRatio} frame filling the whole image. Photographic framing with natural depth of field.
Each listed character appears exactly once in the frame. Do not add people, props or accessories that are not listed. Nobody may resemble another character. ${STYLE_EXCLUSIONS}
No text, captions, subtitles, logos, watermarks, borders or split panels.`;
}

// Condensed from the series' strict exclusions. Story and phone-screen rules are enforced
// elsewhere (verbatim dialogue in the shot list; phone screens composited, not generated).
/** Direction for the speech model: the character's fixed voice identity plus how this line is delivered. */
export function speechDirection(film, character, line) {
  return [
    `Voice: ${character.voice || 'natural young adult'}.`,
    `Speak in ${film.settings.language}, as natural conversation in a realistic youth comedy, not as narration.`,
    line.delivery ? `Delivery for this line: ${line.delivery}.` : '',
    'Believable and understated; no cartoonish exaggeration.',
  ].filter(Boolean).join(' ');
}

export const VEO_NEGATIVE_PROMPT = [
  'face morphing, changing face, changing hairstyle, changing skin tone, identity swap, duplicated character, random accessories, wardrobe change',
  'deformed hands, extra fingers, missing fingers, extra limbs, distorted face, unnatural teeth, floating objects, foot sliding, rubbery body, jerky motion, frozen expression, cartoon physics',
  'childish cartoon, flat 2D animation, mobile-game graphics, plastic skin, glossy face, uncanny photorealism, anime eyes, oversized head, caricature, oversaturated colours, beauty filter',
  'random camera movement, unmotivated zoom, shaky camera, jump cut, changing room geometry, changing lighting',
  'robotic voice, narration, voice-over, garbled speech, language switching, background music, soundtrack, laugh track, audience laughter',
  'subtitles, captions, on-screen text, gibberish text, logo, watermark, title card, split screen',
].join(', ');

export function veoPrompt({ film, shot, characters }) {
  // The voice description is repeated on every spoken line: it is the only handle on
  // keeping a character's generated voice similar from one clip to the next.
  const speaker = (id) => {
    const c = characters.find((x) => x.id === id);
    return c ? `${c.name}${c.voice ? ` (voice: ${c.voice})` : ''}` : 'A character';
  };
  const speech = (shot.dialogue || [])
    .map((d) => `${speaker(d.characterId)} says${d.delivery ? `, ${d.delivery},` : ''} in ${film.settings.language}: "${d.line}"`)
    .join(' ');

  // A cast member the video model's filter misreads as a minor gets their age stated outright;
  // for Meera this moved speaking shots from always blocked to passing about half the time.
  const ages = characters.filter((c) => c.ageNote).map((c) => `${c.name} is ${c.ageNote}.`).join(' ');

  return [
    `${shot.shotType}, ${shot.camera}.`,
    ages,
    shot.videoPrompt,
    // The acting is stated as beats in order and placed early: this is what makes a shot feel alive.
    shot.performance ? `PERFORMANCE, in order: ${shot.performance}` : '',
    'The acting is subtle, human and specific: the expression develops gradually through the shot, with natural blinking, small shifts of the eyes, and small changes around the eyebrows and mouth that show the thought behind the moment. The face is never frozen and never exaggerated or cartoonish.',
    // Left unsaid, the model sometimes invents speech for a silent shot.
    speech || 'Nobody speaks in this shot: there is no dialogue and no voice of any kind, and every mouth stays closed.',
    // Music is added once in the final mix; any the video model adds here would clash with it.
    `Audio: only ${shot.dialogue?.length ? "the character's voice and " : ''}${shot.sound || 'natural room ambience'}. There is absolutely no music in this shot: no score, no soundtrack, no instruments, no melody.`,
    `Style: ${film.bible.visualStyle}`,
    'Each person keeps the identity of the first frame (face structure, hair, skin tone, outfit) and the set stays the same, while their expression is free to change.',
    // Left free, the model lets held objects vanish, walks people out of position and brings new
    // things into view; anything the direction names (a gate, a door) tends to appear on screen.
    'Stay grounded in the first frame: everything a person holds stays in that hand for the whole shot; nobody leaves their position unless the direction above says so; no person, object or structure appears or disappears; nobody looks into the camera; no text or captions appear on screen.',
  ].filter(Boolean).join(' ');
}
