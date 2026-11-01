// Use one shot's approved still as another shot's still (same framing, same starting state).
// The source can be a shot in another production of the same series.
// usage: node productions/tools/reuse-keyframe.mjs <slug> <fromShot> <toShot> [<fromSlug>]
import fs from 'fs';
import path from 'path';
import * as store from '../../backend/src/film/store.js';

const [slug, fromId, toId, fromSlug = slug] = process.argv.slice(2);
const sceneOf = (production, id) => store.loadScene(production, id.split('-')[0]);

const fromShot = sceneOf(fromSlug, fromId).shots.find((s) => s.id === fromId);
const source = fromShot?.keyframes.find((k) => k.take === fromShot.selectedKeyframe);
if (!source) throw new Error(`${fromSlug} ${fromId} has no selected still.`);

const scene = sceneOf(slug, toId);
const shot = scene.shots.find((s) => s.id === toId);
if (!shot) throw new Error(`Shot ${toId} not found.`);
const take = shot.keyframes.length + 1;
const file = `shots/${scene.id}/${toId}/kf_t${take}.jpg`;
fs.mkdirSync(path.dirname(store.abs(slug, file)), { recursive: true });
fs.copyFileSync(store.abs(fromSlug, source.file), store.abs(slug, file));
shot.keyframes.push({ take, file, at: new Date().toISOString(), reusedFrom: fromSlug === slug ? fromId : `${fromSlug}:${fromId}` });
shot.selectedKeyframe = take;
store.saveScene(slug, scene);
console.log(`${toId} now uses the still from ${fromSlug === slug ? '' : `${fromSlug} `}${fromId} (take ${take}).`);
