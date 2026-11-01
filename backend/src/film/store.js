import fs from 'fs';
import path from 'path';
import { PRODUCTIONS_DIR } from './paths.js';

export function filmDir(slug) {
  return path.join(PRODUCTIONS_DIR, slug);
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Write-then-rename so an interrupted run never leaves a half-written state file.
function writeJson(file, data) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

export function loadFilm(slug) {
  const film = readJson(path.join(filmDir(slug), 'film.json'));
  if (!film) throw new Error(`No production named "${slug}" in ${PRODUCTIONS_DIR}. Create it with: film new ${slug} --script <file>`);
  return film;
}

export function saveFilm(film) {
  writeJson(path.join(filmDir(film.slug), 'film.json'), film);
}

export function loadScene(slug, sceneId) {
  const scene = readJson(path.join(filmDir(slug), 'scenes', `${sceneId}.json`));
  if (!scene) throw new Error(`Scene ${sceneId} not found in "${slug}". Run breakdown first.`);
  return scene;
}

export function saveScene(slug, scene) {
  writeJson(path.join(filmDir(slug), 'scenes', `${scene.id}.json`), scene);
}

export function loadLedger(slug) {
  return readJson(path.join(filmDir(slug), 'ledger.json'), { spentUsd: 0, entries: [] });
}

export function saveLedger(slug, ledger) {
  writeJson(path.join(filmDir(slug), 'ledger.json'), ledger);
}

/** Path relative to the film directory, with forward slashes (stored in state and used in review.html). */
export function rel(slug, absPath) {
  return path.relative(filmDir(slug), absPath).split(path.sep).join('/');
}

export function abs(slug, relPath) {
  return path.join(filmDir(slug), relPath);
}
