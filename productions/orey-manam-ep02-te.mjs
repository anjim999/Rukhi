// OREY… MANAM! — Episode 02, Reel 1, Telugu voice version.
//
// Derived from the finished English production: same stills, same silent shots, same graphics
// and music. Only the dialogue shots are rendered again, from the same approved stills, with
// the characters speaking Telugu so the lips match the Telugu words.
//
// Run from the repo root:  node productions/orey-manam-ep02-te.mjs
import fs from 'fs';
import * as store from '../backend/src/film/store.js';

const SOURCE = 'orey-manam-ep02';
const slug = 'orey-manam-ep02-te';

// Spoken Telugu as friends in Hyderabad would say it, with the English loan words they use.
const LINES = {
  'Where are you?': 'ఎక్కడున్నావ్ రా?',
  'Almost there, ra.': 'వచ్చేస్తున్నా రా.',
  'I can hear your fan.': 'నీ ఫ్యాన్ సౌండ్ వినిపిస్తోంది.',
  'Speaker problem.': 'స్పీకర్ ప్రాబ్లం.',
  "Where's the birthday boy?": 'బర్త్‌డే బాయ్ ఎక్కడ?',
  'In post-production.': 'పోస్ట్-ప్రొడక్షన్‌లో ఉన్నాడు.',
};

if (fs.existsSync(store.filmDir(slug))) {
  console.log(`"${slug}" already exists; delete it to derive it again.`);
  process.exit(0);
}
fs.cpSync(store.filmDir(SOURCE), store.filmDir(slug), {
  recursive: true,
  // Rejected and superseded files stay with the English production.
  filter: (src) => !/[\\/](out|backup|ots)([\\/]|$)/.test(src) && !/\.(orig|music)\.mp4$/.test(src),
});

const film = store.loadFilm(slug);
film.slug = slug;
film.title = `${film.title} (Telugu)`;
film.settings.language = 'Telugu';
film.settings.voiceLanguageCode = 'te-IN';
for (const c of film.bible.characters) {
  // The same Chirp 3 HD voice per character as the English dub, in its Telugu form.
  if (c.voiceId) c.voiceId = c.voiceId.replace(/^en-IN/, 'te-IN');
  if (c.voice) c.voice = c.voice.replace(/conversational Indian English/, 'conversational Telugu as spoken in Hyderabad');
}
film.budget = { ...film.budget, capUsd: 60 };
store.saveFilm(film);
store.saveLedger(slug, { spentUsd: 0, entries: [] });

for (const id of film.sceneIds) {
  const scene = store.loadScene(slug, id);
  for (const shot of scene.shots) {
    if (!shot.dialogue?.length) continue;
    for (const d of shot.dialogue) {
      if (!LINES[d.line]) throw new Error(`No Telugu for: ${d.line}`);
      d.english = d.line;
      d.line = LINES[d.line];
      d.delivery = `${d.delivery}; natural everyday spoken Telugu`;
    }
    // The English takes belong to the English version; the still is kept.
    shot.clips = [];
    shot.selectedClip = null;
  }
  store.saveScene(slug, scene);
}
console.log(`Derived ${slug}: dialogue shots cleared for Telugu takes.`);
