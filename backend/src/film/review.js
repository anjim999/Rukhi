import fs from 'fs';
import path from 'path';
import { filmDir, loadFilm, loadScene, loadLedger } from './store.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function candidates(slug, kind, id) {
  const dir = path.join(filmDir(slug), 'refs', kind, id);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort().map((f) => `refs/${kind}/${id}/${f}`);
}

function refCard(slug, kind, item) {
  const images = candidates(slug, kind, item.id).map((src) => {
    const locked = src === item.ref;
    const label = path.basename(src).replace(/\.\w+$/, '').replace('cand_', 'candidate ');
    return `<figure class="${locked ? 'locked' : ''}"><img loading="lazy" src="${esc(src)}"><figcaption>${esc(label)}${locked ? ' — locked' : ''}</figcaption></figure>`;
  }).join('');
  const detail = kind === 'characters' ? `${item.appearance} Wardrobe: ${item.wardrobe}` : item.description;
  return `<section class="ref"><h3>${esc(item.id)} · ${esc(item.name)} ${item.ref ? '' : '<span class="warn">not locked</span>'}</h3><p>${esc(detail)}</p><div class="strip">${images || '<em>no candidates yet</em>'}</div>${kind === 'characters' ? voiceRow(slug, item) : ''}</section>`;
}

function voiceRow(slug, character) {
  const dir = path.join(filmDir(slug), 'voices', character.id);
  const samples = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.wav')).sort() : [];
  const lockedShort = character.voiceId?.split('-').pop();
  const players = samples.map((f) => {
    const short = f.replace('.wav', '');
    return `<label class="${short === lockedShort ? 'locked' : ''}">${esc(short)}${short === lockedShort ? ' — locked' : ''}<audio controls preload="none" src="voices/${esc(character.id)}/${esc(f)}"></audio></label>`;
  }).join('');
  return `<p><b>Voice:</b> ${esc(character.voice || '')} ${character.voiceId ? '' : '<span class="warn">no voice locked</span>'}</p><div class="voices">${players || '<em>no voice samples yet</em>'}</div>`;
}

function shotRow(film, shot) {
  const names = (id) => film.bible.characters.find((c) => c.id === id)?.name || id;
  const keyframe = shot.keyframes.find((k) => k.take === shot.selectedKeyframe);
  const clip = shot.clips.find((c) => c.take === shot.selectedClip && c.file);
  const pending = shot.clips.some((c) => c.status === 'pending');
  const failed = shot.clips.filter((c) => c.status === 'failed').map((c) => `take ${c.take}: ${c.error}`).join(' | ');
  const dialogue = shot.dialogue.map((d) => `<b>${esc(names(d.characterId))}:</b> ${esc(d.line)}`).join('<br>');

  return `<tr>
    <td><b>${esc(shot.id)}</b><br>${shot.durationSec}s<br><small>${esc(shot.shotType)}<br>${esc(shot.camera)}</small></td>
    <td>${esc(shot.action)}${dialogue ? `<p class="dialogue">${dialogue}</p>` : ''}</td>
    <td>${keyframe ? `<img loading="lazy" src="${esc(keyframe.file)}"><small>keyframe take ${keyframe.take} of ${shot.keyframes.length}</small>` : '<em>no keyframe</em>'}</td>
    <td>${clip ? `<video controls preload="none" poster="${esc(keyframe?.file || '')}" src="${esc(clip.dubFile || clip.file)}"></video><small>clip take ${clip.take} of ${shot.clips.length}${clip.dubFile ? ` · dubbed, speed ×${clip.dub?.tempo ?? 1}` : shot.dialogue.length ? ' · original voice' : ''}</small>${clip.dub?.cutOff ? '<small class="warn">line is longer than the clip</small>' : ''}` : pending ? '<em>rendering…</em>' : '<em>no clip</em>'}${failed ? `<small class="warn">${esc(failed)}</small>` : ''}</td>
  </tr>`;
}

/** Write review.html into the production folder: every reference, keyframe and clip on one page. */
export function writeReview(slug) {
  const film = loadFilm(slug);
  const ledger = loadLedger(slug);
  const bible = film.bible;
  const scenes = film.sceneIds.map((id) => loadScene(slug, id));

  const body = bible ? `
    <h2>Characters</h2>${bible.characters.map((c) => refCard(slug, 'characters', c)).join('')}
    <h2>Locations</h2>${bible.locations.map((l) => refCard(slug, 'locations', l)).join('')}
    ${scenes.map((scene) => `
      <h2 id="${scene.id}">${esc(scene.id)} · ${esc(scene.heading)}</h2>
      <p>${esc(scene.summary)}</p>
      ${scene.shots.length ? `<table><thead><tr><th>Shot</th><th>Action and dialogue</th><th>Keyframe</th><th>Clip</th></tr></thead><tbody>${scene.shots.map((s) => shotRow(film, s)).join('')}</tbody></table>` : '<em>shots not planned yet</em>'}
    `).join('')}` : '<p>No breakdown yet.</p>';

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(film.title)} — review</title>
<style>
  :root { --bg:#f8fafc; --card:#fff; --text:#0f172a; --muted:#64748b; --line:#e2e8f0; --accent:#ca8a04; --warn:#dc2626; }
  @media (prefers-color-scheme: dark) { :root { --bg:#09090b; --card:#18181b; --text:#f4f4f5; --muted:#a1a1aa; --line:#27272a; --accent:#facc15; --warn:#f87171; } }
  body { margin:0; padding:24px 16px 64px; background:var(--bg); color:var(--text); font:15px/1.5 system-ui, sans-serif; }
  main { max-width:1200px; margin:0 auto; }
  h1 { margin:0 0 4px; } h2 { margin:40px 0 8px; padding-top:16px; border-top:1px solid var(--line); } h3 { margin:0 0 4px; }
  p, small { color:var(--muted); } small { display:block; margin-top:4px; }
  nav a { color:var(--accent); margin-right:12px; }
  .ref { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; margin:12px 0; }
  .strip { display:flex; gap:12px; overflow-x:auto; }
  figure { margin:0; flex:0 0 auto; border:2px solid transparent; border-radius:8px; padding:4px; }
  figure.locked { border-color:var(--accent); } figure img { height:260px; border-radius:6px; display:block; }
  figcaption { font-size:13px; color:var(--muted); text-align:center; }
  .voices { display:flex; flex-wrap:wrap; gap:12px; } .voices label { display:flex; flex-direction:column; gap:4px; font-size:13px; color:var(--muted); border:2px solid transparent; border-radius:8px; padding:4px; }
  .voices label.locked { border-color:var(--accent); } .voices audio { width:240px; max-width:100%; }
  .tablewrap { overflow-x:auto; } table { width:100%; border-collapse:collapse; background:var(--card); }
  th, td { border:1px solid var(--line); padding:10px; vertical-align:top; text-align:left; }
  td img, td video { width:320px; max-width:100%; border-radius:6px; display:block; }
  .dialogue { color:var(--text); margin:8px 0 0; } .warn { color:var(--warn); font-size:13px; }
</style></head>
<body><main>
  <h1>${esc(film.title)}</h1>
  <p>${esc(bible?.logline || '')}</p>
  <p>Estimated spend $${ledger.spentUsd.toFixed(2)} of $${film.budget.capUsd.toFixed(2)} cap · ${esc(film.settings.resolution)} ${esc(film.settings.aspectRatio)} · ${esc(film.settings.videoModel)}</p>
  <nav>${scenes.map((s) => `<a href="#${s.id}">${s.id}</a>`).join('')}</nav>
  ${body.replace(/<table>/g, '<div class="tablewrap"><table>').replace(/<\/table>/g, '</table></div>')}
</main></body></html>`;

  const file = path.join(filmDir(slug), 'review.html');
  fs.writeFileSync(file, html);
  return file;
}
