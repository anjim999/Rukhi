import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { filmDir, ensureDir, loadFilm, saveFilm, loadScene, saveScene, loadLedger, rel, abs } from './store.js';
import { DEFAULT_PRICING, assertBudget, record, veoCost, imageCost, textCost, speechCost } from './ledger.js';
import { generateJson, generateImage, startVeo, pollVeo, locateSpeech } from './models.js';
import { listVoices, speak } from './voice.js';
import { renderGraphic } from './graphics.js';
import { frameSize, fitImageToFrame, normalizeClip, mixMusic, mixCues, ffmpeg, probe, detectSoundWindow, joinSpeech, dubClip } from './ffmpeg.js';
import * as prompts from './prompts.js';

const VEO_DURATIONS = [4, 6, 8];
const MUSIC_EXTENSIONS = ['.mp3', '.wav', '.m4a'];

const log = (msg) => console.log(`[film] ${msg}`);
const pad = (n, width) => String(n).padStart(width, '0');
const sceneIdOf = (shotId) => shotId.split('-')[0];

/** Run fn over items with n workers. One failed item is logged and skipped; a budget stop ends the run. */
async function pool(items, n, fn) {
  let next = 0;
  let stop = null;
  const failures = [];
  const worker = async () => {
    while (next < items.length && !stop) {
      const item = items[next++];
      try {
        await fn(item);
      } catch (err) {
        if (err.code === 'BUDGET_CAP') stop = err;
        else failures.push({ item, err });
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(n, items.length)) }, worker));
  if (stop) throw stop;
  return failures;
}

// ─────────────────────────────────────────────
// 1. Create
// ─────────────────────────────────────────────

/**
 * biblePath: the producers' series bible (style, fixed character IDs, voices, sets), obeyed by the breakdown.
 * from: an earlier production of the same series. Its approved characters, locations, reference
 * images, settings and series bible are carried over, so every episode uses the same designs.
 */
export function createFilm({ slug, scriptPath, biblePath, from, title, style, language, aspectRatio, resolution, capUsd = 250 }) {
  const dir = filmDir(slug);
  if (fs.existsSync(path.join(dir, 'film.json'))) throw new Error(`Production "${slug}" already exists at ${dir}`);
  if (!scriptPath || !fs.existsSync(scriptPath)) throw new Error(`Script file not found: ${scriptPath}`);
  if (biblePath && !fs.existsSync(biblePath)) throw new Error(`Series bible file not found: ${biblePath}`);
  const source = from ? loadFilm(from) : null;

  ensureDir(dir);
  fs.copyFileSync(scriptPath, path.join(dir, 'script.txt'));
  ensureDir(path.join(dir, 'music'));
  if (source) {
    for (const name of ['refs', 'bible.md']) {
      const src = abs(from, name);
      if (fs.existsSync(src)) fs.cpSync(src, path.join(dir, name), { recursive: true });
    }
  }
  if (biblePath) fs.copyFileSync(biblePath, path.join(dir, 'bible.md'));

  const film = {
    slug,
    title: title || slug,
    createdAt: new Date().toISOString(),
    settings: {
      language: language || source?.settings.language || 'English',
      style: style || source?.settings.style || '',
      aspectRatio: aspectRatio || source?.settings.aspectRatio || '16:9',
      resolution: resolution || source?.settings.resolution || '720p',
      location: 'us-central1',
      // Projects created from late 2026 only get the Gemini 3.x text models, served from the global endpoint.
      textModel: 'gemini-3.5-flash',
      textLocation: 'global',
      imageModel: 'gemini-2.5-flash-image',
      // Lite only, on purpose: the full Veo model costs several times more per second.
      videoModel: 'veo-3.1-lite-generate-001',
      generateAudio: true,
      seed: source?.settings.seed ?? Math.floor(Math.random() * 2 ** 31),
    },
    budget: { capUsd },
    pricing: source?.pricing || DEFAULT_PRICING,
    bible: source?.bible ? JSON.parse(JSON.stringify(source.bible)) : null,
    sceneIds: [],
  };
  saveFilm(film);
  return film;
}

// ─────────────────────────────────────────────
// 2. Breakdown: script -> bible + scenes
// ─────────────────────────────────────────────

export async function breakdown(slug, { force = false } = {}) {
  const film = loadFilm(slug);
  if (film.sceneIds.length && !force) throw new Error(`"${slug}" is already broken down. Use --force to redo it (approved characters and locations are kept).`);

  const lines = fs.readFileSync(abs(slug, 'script.txt'), 'utf8').replace(/\r\n/g, '\n').split('\n');
  const numberedScript = lines.map((line, i) => `${i + 1}| ${line}`).join('\n');
  const biblePath = abs(slug, 'bible.md');
  const seriesBible = fs.existsSync(biblePath) ? fs.readFileSync(biblePath, 'utf8') : '';

  // Anything with a locked reference image is approved: its design must not be rewritten.
  const approved = (list = []) => list.filter((item) => item.ref);
  const locked = { characters: approved(film.bible?.characters), locations: approved(film.bible?.locations) };
  const lockedForPrompt = {
    characters: locked.characters.map(({ id, name, appearance, wardrobe, voice }) => ({ id, name, appearance, wardrobe, voice })),
    locations: locked.locations.map(({ id, name, description }) => ({ id, name, description })),
  };

  log(`Reading ${lines.length} script lines with ${film.settings.textModel}...`);
  const { data, usage } = await generateJson({
    model: film.settings.textModel,
    location: film.settings.textLocation || film.settings.location,
    prompt: prompts.biblePrompt({ numberedScript, style: film.settings.style, language: film.settings.language, seriesBible, locked: lockedForPrompt }),
    maxOutputTokens: 32768,
  });
  record(film, { kind: 'text', model: film.settings.textModel, units: usage.totalTokenCount || 0, costUsd: textCost(film, usage), ref: 'breakdown' });

  const scenes = [...(data.scenes || [])].sort((a, b) => a.startLine - b.startLine);
  if (!scenes.length) throw new Error('The breakdown returned no scenes; check that script.txt contains the screenplay.');

  // Approved entries win over whatever the model returned for the same id; new ones are added unlocked.
  const merge = (kept, incoming = []) => [
    ...kept,
    ...incoming.filter((item) => item?.id && !kept.some((k) => k.id === item.id)).map((item) => ({ ...item, ref: null })),
  ];
  const characters = merge(locked.characters, data.characters);
  const locations = merge(locked.locations, data.locations);

  film.title = film.title === slug && data.title ? data.title : film.title;
  film.bible = {
    title: data.title || film.title,
    logline: data.logline || '',
    // The look is fixed by the first breakdown of a series and inherited after that.
    visualStyle: film.bible?.visualStyle || data.visualStyle || film.settings.style,
    characters,
    locations,
  };

  // Make the scene line ranges contiguous so no script line can fall between scenes.
  const characterIds = new Set(characters.map((c) => c.id));
  film.sceneIds = [];
  scenes.forEach((s, i) => {
    const id = `S${pad(i + 1, 2)}`;
    const startLine = i === 0 ? 1 : Math.max(1, Math.round(s.startLine));
    const endLine = i === scenes.length - 1 ? lines.length : Math.max(startLine, Math.round(scenes[i + 1].startLine) - 1);
    saveScene(slug, {
      id,
      heading: s.heading || id,
      locationId: locations.some((l) => l.id === s.locationId) ? s.locationId : null,
      timeOfDay: s.timeOfDay || 'day',
      characterIds: (s.characterIds || []).filter((cid) => characterIds.has(cid)),
      wardrobe: Object.fromEntries(Object.entries(s.wardrobe || {}).filter(([cid, outfit]) => characterIds.has(cid) && outfit)),
      summary: s.summary || '',
      startLine,
      endLine,
      text: lines.slice(startLine - 1, endLine).join('\n').trim(),
      shots: [],
    });
    film.sceneIds.push(id);
  });
  saveFilm(film);
  log(`Bible ready: ${characters.length} characters, ${locations.length} locations, ${scenes.length} scenes.`);
  return film;
}

// ─────────────────────────────────────────────
// 3. Shot planning
// ─────────────────────────────────────────────

export async function planShots(slug, { sceneIds, force = false } = {}) {
  const film = loadFilm(slug);
  if (!film.bible) throw new Error('Run breakdown first.');
  const targets = sceneIds?.length ? sceneIds : film.sceneIds;

  for (const sceneId of targets) {
    const scene = loadScene(slug, sceneId);
    if (scene.shots.length && !force) {
      log(`${sceneId}: already has ${scene.shots.length} shots, skipping (use --force to re-plan and discard its takes).`);
      continue;
    }
    const index = film.sceneIds.indexOf(sceneId);
    const previousSummary = index > 0 ? loadScene(slug, film.sceneIds[index - 1]).summary : '';

    const { data, usage } = await generateJson({
      model: film.settings.textModel,
      location: film.settings.textLocation || film.settings.location,
      prompt: prompts.shotsPrompt({ film, scene, previousSummary }),
      maxOutputTokens: 32768,
    });
    record(film, { kind: 'text', model: film.settings.textModel, units: usage.totalTokenCount || 0, costUsd: textCost(film, usage), ref: `shots:${sceneId}` });

    scene.shots = (data.shots || []).map((shot, i) => ({
      id: `${sceneId}-${pad(i + 1, 3)}`,
      durationSec: VEO_DURATIONS.includes(shot.durationSec) ? shot.durationSec : 6,
      shotType: shot.shotType || 'medium shot',
      camera: shot.camera || 'locked-off',
      characterIds: (shot.characterIds || []).filter((cid) => scene.characterIds.includes(cid)).slice(0, 3),
      action: shot.action || '',
      dialogue: (shot.dialogue || []).filter((d) => d?.line),
      keyframePrompt: shot.keyframePrompt || shot.action || '',
      videoPrompt: shot.videoPrompt || shot.action || '',
      sound: shot.sound || '',
      keyframes: [],
      selectedKeyframe: null,
      clips: [],
      selectedClip: null,
    }));
    saveScene(slug, scene);

    const seconds = scene.shots.reduce((sum, s) => sum + s.durationSec, 0);
    log(`${sceneId}: ${scene.shots.length} shots, ${seconds}s.`);
    for (const shot of scene.shots) {
      const words = shot.dialogue.reduce((n, d) => n + d.line.trim().split(/\s+/).length, 0);
      if (words > shot.durationSec * 3) log(`  warning: ${shot.id} has ${words} words of dialogue for ${shot.durationSec}s; it may be cut off.`);
    }
  }
}

// ─────────────────────────────────────────────
// 4. Reference images
// ─────────────────────────────────────────────

function refTargets(film, { only, id }) {
  const targets = [];
  if (only !== 'locations') film.bible.characters.forEach((item) => targets.push({ kind: 'characters', item }));
  if (only !== 'characters') film.bible.locations.forEach((item) => targets.push({ kind: 'locations', item }));
  return id ? targets.filter((t) => t.item.id === id) : targets;
}

/** noAnchor: draw from the description alone, for a character whose build differs sharply from the approved cast. */
export async function generateRefs(slug, { only, id, count = 3, redo = false, noAnchor = false } = {}) {
  const film = loadFilm(slug);
  if (!film.bible) throw new Error('Run breakdown first.');

  for (const { kind, item } of refTargets(film, { only, id })) {
    const dir = ensureDir(path.join(filmDir(slug), 'refs', kind, item.id));
    const existing = fs.readdirSync(dir).filter((f) => f.startsWith('cand_'));
    if (existing.length && !redo) {
      log(`${item.id} ${item.name}: ${existing.length} candidates already exist, skipping (use --redo for more).`);
      continue;
    }
    const isCharacter = kind === 'characters';
    // Already-approved characters anchor the rendering style of every later one. Several are
    // sent, not one: with a single anchor the model tends to redraw that same person.
    const anchors = isCharacter && !noAnchor ? film.bible.characters.filter((c) => c.ref && c.id !== item.id).slice(-3) : [];
    const prompt = isCharacter ? prompts.characterRefPrompt(film, item, { styleAnchors: anchors.length }) : prompts.locationRefPrompt(film, item);

    for (let i = 0; i < count; i++) {
      assertBudget(film, imageCost(film), `reference image for ${item.id}`);
      const n = existing.length + i + 1;
      try {
        const { buffer, mimeType } = await generateImage({
          model: film.settings.imageModel,
          location: film.settings.location,
          prompt,
          refImages: anchors.map((c) => abs(slug, c.ref)),
          aspectRatio: isCharacter ? '3:4' : film.settings.aspectRatio,
        });
        const file = path.join(dir, `cand_${n}.${mimeType.includes('jpeg') ? 'jpg' : 'png'}`);
        fs.writeFileSync(file, buffer);
        record(film, { kind: 'image', model: film.settings.imageModel, units: 1, costUsd: imageCost(film), ref: `ref:${item.id}` });
        log(`${item.id} ${item.name}: candidate ${n} saved.`);
      } catch (err) {
        log(`${item.id} ${item.name}: candidate ${n} failed — ${err.message}`);
      }
    }
  }
}

/** Lock the reference for a character or location: a generated candidate number, or your own image file. */
export function pickRef(slug, kind, id, { candidate, file } = {}) {
  const film = loadFilm(slug);
  const listName = kind.startsWith('char') ? 'characters' : 'locations';
  const item = film.bible?.[listName].find((x) => x.id === id);
  if (!item) throw new Error(`No ${listName.slice(0, -1)} with id ${id}.`);

  const dir = ensureDir(path.join(filmDir(slug), 'refs', listName, id));
  let chosen;
  if (file) {
    if (!fs.existsSync(file)) throw new Error(`File not found: ${file}`);
    chosen = path.join(dir, `own${path.extname(file).toLowerCase() || '.jpg'}`);
    fs.copyFileSync(file, chosen);
  } else {
    const match = fs.readdirSync(dir).find((f) => f.startsWith(`cand_${candidate}.`));
    if (!match) throw new Error(`${id} has no candidate ${candidate}. Run: film refs ${slug} --id ${id}`);
    chosen = path.join(dir, match);
  }
  item.ref = rel(slug, chosen);
  // Views were drawn from the previous reference; they no longer match.
  if (item.views) item.views = {};
  saveFilm(film);
  return item;
}

/**
 * Draw each approved character in this production's outfit (character.episodeWardrobe), from
 * the locked series master. Every shot then starts from the same clothes as well as the same face.
 */
export async function generateLooks(slug, { id, redo = false } = {}) {
  const film = loadFilm(slug);
  for (const character of (film.bible?.characters || []).filter((c) => !id || c.id === id)) {
    if (!character.ref || !character.episodeWardrobe) continue;
    if (character.look && !redo) continue;
    assertBudget(film, imageCost(film), `episode look of ${character.id}`);
    try {
      const { buffer, mimeType } = await generateImage({
        model: film.settings.imageModel,
        location: film.settings.location,
        prompt: prompts.characterLookPrompt(film, character, { withFace: Boolean(character.views?.closeup) }),
        refImages: [abs(slug, character.ref), ...(character.views?.closeup ? [abs(slug, character.views.closeup)] : [])],
        aspectRatio: '3:4',
      });
      const file = path.join(filmDir(slug), 'refs', 'characters', character.id, `look.${mimeType.includes('jpeg') ? 'jpg' : 'png'}`);
      fs.writeFileSync(file, buffer);
      character.look = rel(slug, file);
      // Views drawn by the pipeline came from the old outfit; views supplied by the producers stay.
      if (!character.suppliedViews) character.views = {};
      saveFilm(film);
      record(film, { kind: 'image', model: film.settings.imageModel, units: 1, costUsd: imageCost(film), ref: `look:${character.id}` });
      log(`${character.id} ${character.name}: episode look saved.`);
    } catch (err) {
      if (err.code === 'BUDGET_CAP') throw err;
      log(`${character.id} ${character.name}: episode look failed — ${err.message}`);
    }
  }
}

/**
 * Draw the extra angles of each approved character (face close-up, three-quarter, profile)
 * from its locked reference. The close-up is sent with every keyframe the character is in.
 */
export async function generateViews(slug, { id, redo = false, only } = {}) {
  const film = loadFilm(slug);
  const targets = (film.bible?.characters || []).filter((c) => (!id || c.id === id));

  for (const character of targets) {
    if (!character.ref) {
      log(`${character.id} ${character.name}: no locked reference yet, skipping.`);
      continue;
    }
    character.views = character.views || {};
    // Views are drawn from the episode look when there is one, so their clothes match the shots.
    const base = abs(slug, character.look || character.ref);
    for (const view of Object.keys(prompts.CHARACTER_VIEWS)) {
      if (only && !only.includes(view)) continue;
      if (character.views[view] && !redo) continue;
      assertBudget(film, imageCost(film), `${view} view of ${character.id}`);
      try {
        const { buffer, mimeType } = await generateImage({
          model: film.settings.imageModel,
          location: film.settings.location,
          prompt: prompts.characterViewPrompt(film, character, view),
          refImages: [base],
          aspectRatio: '3:4',
        });
        const file = path.join(filmDir(slug), 'refs', 'characters', character.id, `view_${view}.${mimeType.includes('jpeg') ? 'jpg' : 'png'}`);
        fs.writeFileSync(file, buffer);
        character.views[view] = rel(slug, file);
        saveFilm(film);
        record(film, { kind: 'image', model: film.settings.imageModel, units: 1, costUsd: imageCost(film), ref: `view:${character.id}:${view}` });
        log(`${character.id} ${character.name}: ${view} view saved.`);
      } catch (err) {
        if (err.code === 'BUDGET_CAP') throw err;
        log(`${character.id} ${character.name}: ${view} view failed — ${err.message}`);
      }
    }
  }
}

// ─────────────────────────────────────────────
// 5. Keyframes
// ─────────────────────────────────────────────

function shotsFor(slug, film, { sceneId, shotId }) {
  if (shotId) {
    const scene = loadScene(slug, sceneIdOf(shotId));
    const shot = scene.shots.find((s) => s.id === shotId);
    if (!shot) throw new Error(`Shot ${shotId} not found.`);
    return [{ scene, shots: [shot] }];
  }
  const ids = sceneId ? [sceneId] : film.sceneIds;
  return ids.map((id) => {
    const scene = loadScene(slug, id);
    return { scene, shots: scene.shots };
  });
}

function takeFile(slug, shot, name) {
  return path.join(ensureDir(path.join(filmDir(slug), 'shots', sceneIdOf(shot.id), shot.id)), name);
}

function selectedFile(slug, takes, selected) {
  const take = takes.find((t) => t.take === selected && t.file);
  return take ? abs(slug, take.file) : null;
}

const isGraphic = (shot) => shot.kind === 'graphic';

/**
 * The approved keyframe of the most recent earlier shot in the same location, even when the
 * edit has cut away to other places in between. This is what keeps a set looking the same
 * each time the story returns to it.
 */
function previousKeyframeInLocation(slug, film, scene, shot) {
  const pick = (shots) => {
    for (let i = shots.length - 1; i >= 0; i--) {
      const file = !isGraphic(shots[i]) && selectedFile(slug, shots[i].keyframes, shots[i].selectedKeyframe);
      if (file) return file;
    }
    return null;
  };
  const here = pick(scene.shots.slice(0, scene.shots.indexOf(shot)));
  if (here) return here;
  for (let i = film.sceneIds.indexOf(scene.id) - 1; i >= 0; i--) {
    const earlier = loadScene(slug, film.sceneIds[i]);
    if (earlier.locationId !== scene.locationId) continue;
    const file = pick(earlier.shots);
    if (file) return file;
  }
  return null;
}

export async function generateKeyframes(slug, { sceneId, shotId, retake = false } = {}) {
  const film = loadFilm(slug);
  const size = frameSize(film.settings.aspectRatio, film.settings.resolution);

  for (const { scene, shots } of shotsFor(slug, film, { sceneId, shotId })) {
    const location = film.bible.locations.find((l) => l.id === scene.locationId);
    const missing = [
      ...film.bible.characters.filter((c) => scene.characterIds.includes(c.id) && !c.ref).map((c) => `${c.id} ${c.name}`),
      ...(location && !location.ref ? [`${location.id} ${location.name}`] : []),
    ];
    if (missing.length) throw new Error(`${scene.id} needs locked references first: ${missing.join(', ')}. Use: film pick ${slug} <character|location> <id> <n>`);

    for (const shot of shots) {
      if (isGraphic(shot)) continue;
      if (shot.selectedKeyframe && !retake) continue;

      const characters = shot.characterIds.map((cid) => film.bible.characters.find((c) => c.id === cid)).filter(Boolean);
      // The earlier shot keeps a set consistent, but the model also copies its framing. A close-up
      // shows little of the set, so there it costs more than it gives; a shot can also opt out.
      const tight = /close-up|over-the-shoulder|over the shoulder/i.test(shot.shotType);
      const previous = tight || shot.continuity === false ? null : previousKeyframeInLocation(slug, film, scene, shot);
      // One ordered list drives both the attached images and the numbered legend in the prompt.
      // Side-on framings also get the profile view, where a front-facing reference helps least.
      const sideOn = /profile|side|over-the-shoulder|over the shoulder/i.test(`${shot.shotType} ${shot.camera}`);
      const refs = [
        ...characters.flatMap((c) => [
          // The episode look (this production's outfit) stands in for the series master when there is one.
          { kind: 'character', name: c.name, file: abs(slug, c.look || c.ref) },
          ...(c.views?.closeup ? [{ kind: 'face', name: c.name, file: abs(slug, c.views.closeup) }] : []),
          // The character's own face showing the feeling this shot opens on, when the plan names one.
          ...(shot.expression?.[c.id] && c.views?.[shot.expression[c.id]]
            ? [{ kind: 'expression', name: c.name, note: shot.expression[c.id], file: abs(slug, c.views[shot.expression[c.id]]) }]
            : []),
          ...(sideOn && c.views?.profileLeft ? [{ kind: 'profile', name: c.name, file: abs(slug, c.views.profileLeft) }] : []),
        ]),
        ...(location ? [{ kind: 'location', name: location.name, file: abs(slug, location.ref) }] : []),
        ...(previous ? [{ kind: 'previous', file: previous }] : []),
      ];
      // A scene's outfit note only matters where no episode look already shows the outfit.
      const wardrobe = Object.fromEntries(
        characters.filter((c) => scene.wardrobe?.[c.id] && !c.look).map((c) => [c.name, scene.wardrobe[c.id]])
      );

      assertBudget(film, imageCost(film), `keyframe for ${shot.id}`);
      const take = shot.keyframes.length + 1;
      try {
        const { buffer } = await generateImage({
          model: film.settings.imageModel,
          location: film.settings.location,
          prompt: prompts.keyframePrompt({ film, shot, refs, wardrobe, timeOfDay: scene.timeOfDay }),
          refImages: refs.map((r) => r.file),
          aspectRatio: film.settings.aspectRatio,
        });
        const raw = takeFile(slug, shot, `kf_t${take}_raw.png`);
        const out = takeFile(slug, shot, `kf_t${take}.jpg`);
        fs.writeFileSync(raw, buffer);
        await fitImageToFrame(raw, out, size);
        fs.rmSync(raw, { force: true });

        shot.keyframes.push({ take, file: rel(slug, out), at: new Date().toISOString() });
        shot.selectedKeyframe = take;
        saveScene(slug, scene);
        record(film, { kind: 'image', model: film.settings.imageModel, units: 1, costUsd: imageCost(film), ref: `keyframe:${shot.id}` });
        log(`${shot.id}: keyframe take ${take} saved.`);
      } catch (err) {
        if (err.code === 'BUDGET_CAP') throw err;
        log(`${shot.id}: keyframe failed — ${err.message}`);
      }
    }
  }
}

// ─────────────────────────────────────────────
// 6. Clips
// ─────────────────────────────────────────────

/**
 * minTakes: how many finished takes each dialogue shot should have. Performance varies from take
 * to take, so dialogue shots are rendered more than once and the best one is selected afterwards.
 * Shots from every scene share one worker pool, so single-shot scenes still render in parallel.
 */
export async function generateClips(slug, { sceneId, shotId, retake = false, concurrency = 3, minTakes = 1 } = {}) {
  const film = loadFilm(slug);
  const { settings } = film;
  let reservedUsd = 0;

  // One entry per take to render: { scene, shot }.
  const jobs = [];
  for (const { scene, shots } of shotsFor(slug, film, { sceneId, shotId })) {
    for (const shot of shots) {
      if (isGraphic(shot)) continue;
      if (!shot.selectedKeyframe) {
        log(`${shot.id}: no keyframe yet, skipping.`);
        continue;
      }
      // Only takes made from the still currently selected count; a retaken still needs new clips.
      const current = (c) => (c.keyframeTake || shot.selectedKeyframe) === shot.selectedKeyframe;
      const pending = shot.clips.filter((c) => c.status === 'pending').length;
      const done = shot.clips.filter((c) => c.status === 'done' && current(c)).length;
      const wanted = shot.dialogue.length ? minTakes : 1;
      const fresh = retake ? 1 : Math.max(0, wanted - done - pending);
      for (let i = 0; i < pending + fresh; i++) jobs.push({ scene, shot });
    }
  }

  const failures = await pool(jobs, concurrency, async ({ scene, shot }) => {
    const cost = veoCost(film, shot.durationSec);
    // Claim a take synchronously, before any await, so parallel takes of one shot never collide.
    let clip = shot.clips.find((c) => c.status === 'pending' && !c.claimed);
    if (clip) {
      clip.claimed = true;
      log(`${shot.id}: resuming clip take ${clip.take}.`);
    } else {
      assertBudget(film, cost, `clip for ${shot.id}`, reservedUsd);
      clip = { take: shot.clips.length + 1, keyframeTake: shot.selectedKeyframe, status: 'starting', claimed: true, startedAt: new Date().toISOString() };
      shot.clips.push(clip);
    }

    reservedUsd += cost;
    try {
      if (!clip.operation) {
        const characters = shot.characterIds.map((cid) => film.bible.characters.find((c) => c.id === cid)).filter(Boolean);
        clip.operation = await startVeo({
          // Each take gets its own seed, or a retake would return the same clip.
          seed: settings.seed + clip.take - 1,
          model: settings.videoModel,
          location: settings.location,
          prompt: prompts.veoPrompt({ film, shot, characters }),
          imagePath: selectedFile(slug, shot.keyframes, clip.keyframeTake || shot.selectedKeyframe),
          durationSec: shot.durationSec,
          aspectRatio: settings.aspectRatio,
          resolution: settings.resolution,
          generateAudio: settings.generateAudio,
          negativePrompt: prompts.VEO_NEGATIVE_PROMPT,
        });
        // Saved before polling: if the run dies here, the next run resumes this job instead of buying another.
        clip.status = 'pending';
        saveScene(slug, scene);
        log(`${shot.id}: clip take ${clip.take} started (${shot.durationSec}s).`);
      }
      const buffer = await pollVeo({ model: settings.videoModel, location: settings.location, operation: clip.operation });
      const out = takeFile(slug, shot, `clip_t${clip.take}.mp4`);
      fs.writeFileSync(out, buffer);
      clip.status = 'done';
      clip.file = rel(slug, out);
      // The first finished take is selected; later takes wait for a deliberate choice.
      const selected = shot.clips.find((c) => c.take === shot.selectedClip);
      const stale = selected && (selected.keyframeTake || shot.selectedKeyframe) !== shot.selectedKeyframe;
      if (!shot.selectedClip || retake || stale) shot.selectedClip = clip.take;
      record(film, { kind: 'video', model: settings.videoModel, units: shot.durationSec, costUsd: cost, ref: `clip:${shot.id}:t${clip.take}` });
      log(`${shot.id}: clip take ${clip.take} saved.`);
    } catch (err) {
      if (err.code !== 'VEO_TIMEOUT') {
        clip.status = 'failed';
        clip.error = err.message;
      }
      throw err;
    } finally {
      reservedUsd -= cost;
      delete clip.claimed;
      saveScene(slug, scene);
    }
  });

  failures.forEach(({ item, err }) => log(`${item.shot.id}: clip failed — ${err.message}`));
}

/** Choose which keyframe or clip take a shot uses. */
export function selectTake(slug, shotId, kind, take) {
  const scene = loadScene(slug, sceneIdOf(shotId));
  const shot = scene.shots.find((s) => s.id === shotId);
  if (!shot) throw new Error(`Shot ${shotId} not found.`);
  const isClip = kind.startsWith('clip');
  const takes = isClip ? shot.clips : shot.keyframes;
  if (!takes.some((t) => t.take === take && t.file)) throw new Error(`${shotId} has no finished ${isClip ? 'clip' : 'keyframe'} take ${take}.`);
  if (isClip) shot.selectedClip = take;
  else shot.selectedKeyframe = take;
  saveScene(slug, scene);
}

// ─────────────────────────────────────────────
// 6b. Graphic shots (phone screens, title cards)
// ─────────────────────────────────────────────

/** Render every graphic shot locally. Free, exact, and safe to re-run. */
export async function generateGraphics(slug, { sceneId, shotId, redo = false } = {}) {
  const film = loadFilm(slug);
  const size = frameSize(film.settings.aspectRatio, film.settings.resolution);

  for (const { scene, shots } of shotsFor(slug, film, { sceneId, shotId })) {
    for (const shot of shots.filter(isGraphic)) {
      if (shot.selectedClip && !redo) continue;
      const out = takeFile(slug, shot, 'clip_t1.mp4');
      await renderGraphic(shot.graphic, out, { size, seconds: shot.trimSec || shot.durationSec, workDir: takeFile(slug, shot, 'frames') });
      shot.clips = [{ take: 1, status: 'done', file: rel(slug, out) }];
      shot.selectedClip = 1;
      saveScene(slug, scene);
      log(`${shot.id}: ${shot.graphic.type} graphic rendered.`);
    }
  }
}

// ─────────────────────────────────────────────
// 7. Fixed voices and dubbing
// ─────────────────────────────────────────────

const DEFAULT_SAMPLE_LINE = 'Okay, listen. I have a plan, and this time it will actually work. Trust me.';

function voiceSettings(film) {
  return {
    languageCode: film.settings.voiceLanguageCode || 'en-IN',
    directableModel: film.settings.speechModel === undefined ? 'gemini-2.5-flash-tts' : film.settings.speechModel,
  };
}

function firstLineOf(slug, film, characterId) {
  for (const sceneId of film.sceneIds) {
    for (const shot of loadScene(slug, sceneId).shots) {
      const line = shot.dialogue.find((d) => d.characterId === characterId);
      if (line) return line;
    }
  }
  return { line: DEFAULT_SAMPLE_LINE };
}

/** Generate the same line in several candidate voices per character, to choose each one's permanent voice. */
export async function generateVoiceSamples(slug, { id, count = 4, redo = false } = {}) {
  const film = loadFilm(slug);
  if (!film.bible) throw new Error('Run breakdown first.');
  const { languageCode, directableModel } = voiceSettings(film);
  const voices = await listVoices(languageCode);
  if (!voices.length) throw new Error(`No Chirp 3 HD voices are available for ${languageCode}.`);

  const pools = { male: voices.filter((v) => v.gender === 'male'), female: voices.filter((v) => v.gender === 'female') };
  const seen = { male: 0, female: 0 };

  for (const character of film.bible.characters) {
    const gender = /\b(female|woman|girl)\b/i.test(`${character.voice} ${character.appearance}`) ? 'female' : 'male';
    // Each character draws the next slice of the pool, so no two characters audition the same voices.
    const offset = seen[gender];
    seen[gender] += count;
    if (id && character.id !== id) continue;

    const dir = ensureDir(path.join(filmDir(slug), 'voices', character.id));
    const sample = firstLineOf(slug, film, character.id);
    for (let i = 0; i < Math.min(count, pools[gender].length); i++) {
      const voice = pools[gender][(offset + i) % pools[gender].length];
      const file = path.join(dir, `${voice.short}.wav`);
      if (fs.existsSync(file) && !redo) continue;
      assertBudget(film, speechCost(film, sample.line.length), `voice sample for ${character.id}`);
      try {
        const { buffer, model } = await speak({
          text: sample.line,
          voiceName: voice.name,
          languageCode,
          direction: prompts.speechDirection(film, character, sample),
          directableModel,
        });
        fs.writeFileSync(file, buffer);
        record(film, { kind: 'speech', model, units: sample.line.length, costUsd: speechCost(film, sample.line.length), ref: `sample:${character.id}:${voice.short}` });
        log(`${character.id} ${character.name}: sample in voice ${voice.short} saved.`);
      } catch (err) {
        if (err.code === 'BUDGET_CAP') throw err;
        log(`${character.id} ${character.name}: sample in voice ${voice.short} failed — ${err.message}`);
      }
    }
  }
}

/** Lock a character's permanent voice (a Chirp 3 HD voice name, short or full). */
export function setVoice(slug, characterId, voice) {
  const film = loadFilm(slug);
  const character = film.bible?.characters.find((c) => c.id === characterId);
  if (!character) throw new Error(`No character with id ${characterId}.`);
  const { languageCode } = voiceSettings(film);
  character.voiceId = voice.includes('Chirp3-HD') ? voice : `${languageCode}-Chirp3-HD-${voice}`;
  saveFilm(film);
  return character;
}

/**
 * Where to put a dubbed line in a clip, and how much to speed it up or slow it down, so it
 * covers the stretch where the mouth is moving. `window` is where the original clip had sound.
 */
export function fitSpeech({ speechDur, clipDur, window, trusted = false }) {
  // A window measured from loudness alone that covers nearly the whole clip is ambience, not
  // speech, and says nothing about timing. A window located from the speech itself is trusted.
  const usable = window && (trusted || window.end - window.start < clipDur * 0.9) ? window : null;
  let startSec = usable ? usable.start : Math.min(0.3, clipDur * 0.1);
  const available = (usable ? usable.end : clipDur - 0.2) - startSec;
  const tempo = Math.min(1.25, Math.max(0.85, speechDur / Math.max(0.2, available)));
  const fitted = speechDur / tempo;
  if (startSec + fitted > clipDur - 0.05) startSec = Math.max(0, clipDur - 0.05 - fitted);
  return { startSec, tempo, cutOff: fitted > clipDur };
}

/** Replace the generated voice in each dialogue clip with the characters' locked voices. */
export async function dubClips(slug, { sceneId, shotId, redo = false } = {}) {
  const film = loadFilm(slug);
  const { languageCode, directableModel } = voiceSettings(film);

  for (const { scene, shots } of shotsFor(slug, film, { sceneId, shotId })) {
    const ambience = MUSIC_EXTENSIONS.map((ext) => abs(slug, `ambience/${scene.locationId}${ext}`)).find((f) => fs.existsSync(f)) || null;

    for (const shot of shots) {
      const clip = shot.clips.find((c) => c.take === shot.selectedClip && c.file);
      if (!clip || !shot.dialogue.length || isGraphic(shot)) continue;
      if (clip.dubFile && !redo) continue;

      const speakers = shot.dialogue.map((d) => film.bible.characters.find((c) => c.id === d.characterId));
      const unvoiced = [...new Set(speakers.filter((c) => !c?.voiceId).map((c) => c?.id || 'unknown'))];
      if (unvoiced.length) throw new Error(`${shot.id} needs locked voices first: ${unvoiced.join(', ')}. Use: film voice ${slug} <id> <voice>`);

      try {
        // Lines are cached by voice, words and delivery, so a clip retake reuses the same performance.
        const lineFiles = [];
        for (const [i, line] of shot.dialogue.entries()) {
          const character = speakers[i];
          const hash = crypto.createHash('sha1').update(`${character.voiceId}|${line.line}|${line.delivery || ''}`).digest('hex').slice(0, 10);
          const file = takeFile(slug, shot, `say_${hash}.wav`);
          if (!fs.existsSync(file)) {
            assertBudget(film, speechCost(film, line.line.length), `speech for ${shot.id}`);
            const { buffer, model } = await speak({
              text: line.line,
              voiceName: character.voiceId,
              languageCode,
              direction: prompts.speechDirection(film, character, line),
              directableModel,
            });
            fs.writeFileSync(file, buffer);
            record(film, { kind: 'speech', model, units: line.line.length, costUsd: speechCost(film, line.line.length), ref: `speech:${shot.id}:${i + 1}` });
          }
          lineFiles.push(file);
        }

        const source = abs(slug, clip.file);
        const speech = takeFile(slug, shot, `speech_t${clip.take}.wav`);
        await joinSpeech(lineFiles, speech);
        const clipDur = (await probe(source)).duration;
        const speechDur = (await probe(speech)).duration;
        // Where the mouth moves: asked of the clip itself, with loudness as the fallback.
        let located = null;
        try {
          // settings.locateSpeech = false keeps dubbing fully offline (loudness timing only).
          if (film.settings.locateSpeech !== false) located = await locateSpeech({ model: film.settings.textModel, location: film.settings.textLocation || film.settings.location, file: source, line: shot.dialogue.map((d) => d.line).join(' ') });
          if (located) record(film, { kind: 'text', model: film.settings.textModel, units: located.usage.totalTokenCount || 0, costUsd: textCost(film, located.usage), ref: `locate:${shot.id}` });
        } catch (err) {
          log(`${shot.id}: could not locate speech (${err.message.slice(0, 80)}); using loudness instead.`);
        }
        const fit = fitSpeech({ speechDur, clipDur, window: located || await detectSoundWindow(source, clipDur), trusted: Boolean(located) });

        const out = takeFile(slug, shot, `clip_t${clip.take}_dub.mp4`);
        await dubClip(source, speech, out, { duration: clipDur, startSec: fit.startSec, tempo: fit.tempo, ambience });
        clip.dubFile = rel(slug, out);
        clip.dub = { startSec: Number(fit.startSec.toFixed(2)), tempo: Number(fit.tempo.toFixed(3)), cutOff: fit.cutOff };
        saveScene(slug, scene);
        log(`${shot.id}: dubbed (speed ×${fit.tempo.toFixed(2)}, starts at ${fit.startSec.toFixed(2)}s)${fit.cutOff ? ' — WARNING: the line is longer than the clip and is cut off' : ''}.`);
      } catch (err) {
        if (err.code === 'BUDGET_CAP') throw err;
        log(`${shot.id}: dubbing failed — ${err.message}`);
      }
    }
  }
}

// ─────────────────────────────────────────────
// 8. Assembly
// ─────────────────────────────────────────────

function findMusic(slug, name) {
  return MUSIC_EXTENSIONS.map((ext) => abs(slug, `music/${name}${ext}`)).find((file) => fs.existsSync(file)) || null;
}

async function concat(files, output, listFile) {
  fs.writeFileSync(listFile, files.map((f) => `file '${f.split(path.sep).join('/').replace(/'/g, "'\\''")}'`).join('\n'));
  await ffmpeg(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', output]);
  fs.rmSync(listFile, { force: true });
}

/** originalVoices: build with each clip's own generated voice instead of the dubbed one, for comparison. */
export async function assemble(slug, { sceneId, originalVoices = false } = {}) {
  const film = loadFilm(slug);
  const size = frameSize(film.settings.aspectRatio, film.settings.resolution);
  const outDir = ensureDir(path.join(filmDir(slug), 'out'));
  const normDir = ensureDir(path.join(outDir, 'norm'));
  const sceneFiles = [];
  // Where each shot lands in the finished film, for placing music cues.
  const timeline = {};
  let clock = 0;
  const tag = originalVoices ? '_original' : '';

  for (const id of sceneId ? [sceneId] : film.sceneIds) {
    const scene = loadScene(slug, id);
    const parts = [];
    for (const shot of scene.shots) {
      const clip = shot.clips.find((c) => c.take === shot.selectedClip && c.file);
      if (!clip) {
        log(`${shot.id}: no clip selected, left out of ${id}.`);
        continue;
      }
      // The dubbed version, where there is one, carries the character's locked voice.
      const dubbed = clip.dubFile && !originalVoices;
      const source = abs(slug, dubbed ? clip.dubFile : clip.file);
      const normalized = path.join(normDir, `${shot.id}_t${clip.take}${dubbed ? '_dub' : ''}${shot.trimSec ? `_${shot.trimSec}s` : ''}.mp4`);
      if (!fs.existsSync(normalized) || fs.statSync(normalized).mtimeMs < fs.statSync(source).mtimeMs) {
        // Only dialogue is loudness-normalised. Graphic shots keep their designed sound effects as
        // made, and shots with only room sound are turned down so ambience sits under the voices.
        const spoken = !isGraphic(shot) && shot.dialogue.length > 0;
        await normalizeClip(source, normalized, size, { trimSec: shot.trimSec, loudnorm: spoken, gain: isGraphic(shot) ? 1 : 0.5 });
      }
      const { duration } = await probe(normalized);
      timeline[shot.id] = { start: clock, end: clock + duration };
      clock += duration;
      parts.push(normalized);
    }
    if (!parts.length) continue;

    let sceneFile = path.join(outDir, `${id}${tag}.mp4`);
    await concat(parts, sceneFile, path.join(outDir, `${id}${tag}.txt`));
    const music = findMusic(slug, id);
    if (music) {
      const withMusic = path.join(outDir, `${id}${tag}_music.mp4`);
      await mixMusic(sceneFile, music, withMusic);
      sceneFile = withMusic;
    }
    sceneFiles.push(sceneFile);
    log(`${id}: assembled ${parts.length} of ${scene.shots.length} shots.`);
  }

  if (sceneId || !sceneFiles.length) return sceneFiles[0] || null;

  let filmFile = path.join(outDir, `film${tag}.mp4`);
  await concat(sceneFiles, filmFile, path.join(outDir, `film${tag}.txt`));
  const music = findMusic(slug, 'film');
  if (music) {
    const withMusic = path.join(outDir, `film${tag}_music.mp4`);
    await mixMusic(filmFile, music, withMusic);
    filmFile = withMusic;
  }

  // Timed cues (film.json -> music.cues): each names the shot it starts on and the shot it ends on.
  const cues = (film.music?.cues || []).flatMap((cue) => {
    const from = timeline[cue.fromShot];
    const to = timeline[cue.toShot || cue.fromShot];
    const file = abs(slug, cue.file);
    if (!from || !to || !fs.existsSync(file)) {
      log(`music cue skipped (${cue.file}, ${cue.fromShot}): shot or file missing.`);
      return [];
    }
    return [{ ...cue, file, startSec: from.start + (cue.startOffsetSec || 0), endSec: to.end + (cue.endOffsetSec || 0) }];
  });
  if (cues.length) {
    const scored = path.join(outDir, `film${tag}_scored.mp4`);
    await mixCues(filmFile, cues, scored);
    filmFile = scored;
  }
  log(`Film assembled: ${filmFile}`);
  return filmFile;
}

// ─────────────────────────────────────────────
// Reporting
// ─────────────────────────────────────────────

export function status(slug) {
  const film = loadFilm(slug);
  const ledger = loadLedger(slug);
  const scenes = film.sceneIds.map((id) => {
    const scene = loadScene(slug, id);
    return {
      id,
      heading: scene.heading,
      shots: scene.shots.length,
      seconds: scene.shots.reduce((sum, s) => sum + s.durationSec, 0),
      keyframes: scene.shots.filter((s) => s.selectedKeyframe).length,
      clips: scene.shots.filter((s) => s.selectedClip).length,
      pending: scene.shots.filter((s) => s.clips.some((c) => c.status === 'pending')).length,
    };
  });
  const refs = film.bible
    ? [...film.bible.characters, ...film.bible.locations].map((x) => ({ id: x.id, name: x.name, locked: Boolean(x.ref) }))
    : [];
  return { film, scenes, refs, spentUsd: ledger.spentUsd, capUsd: film.budget.capUsd };
}

/** Projected cost of rendering every planned shot, at an assumed number of takes per shot. */
export function estimate(slug, { takes = 3 } = {}) {
  const { film, scenes, spentUsd, capUsd } = status(slug);
  const shots = scenes.reduce((sum, s) => sum + s.shots, 0);
  const seconds = scenes.reduce((sum, s) => sum + s.seconds, 0);
  const videoUsd = veoCost(film, seconds) * takes;
  const imageUsd = imageCost(film, shots) * takes;
  return { shots, seconds, takes, videoUsd, imageUsd, totalUsd: videoUsd + imageUsd, spentUsd, capUsd };
}

export function setCap(slug, capUsd) {
  const film = loadFilm(slug);
  film.budget.capUsd = capUsd;
  saveFilm(film);
  return film;
}
