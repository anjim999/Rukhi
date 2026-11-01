// OREY… MANAM! — the producers' approved character sheets, cut into single-view reference images.
//
// Each sheet in characters/ is a labelled grid (head views, body views, expressions). The image
// model is given one view per image, never the grid: a labelled multi-panel sheet tends to come
// back as a multi-panel image. Boxes are [x0, y0, x1, y1] measured on the sheet at `size`.
//
// Run from the repo root:  node productions/orey-manam-cast.mjs
// Writes productions/orey-manam-cast/<ID>/{body,closeup,threeQuarter,profileLeft,neutral,happy,annoyed,surprised}.png
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ffmpeg, pixelSize } from '../backend/src/film/ffmpeg.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sheets = path.join(here, '..', 'characters');
export const CAST_DIR = path.join(here, 'orey-manam-cast');

// Three sheet layouts. Rows: head views, body views, expressions.
const wide = (headY, bodyY, exprY, head, body, expr) => ({ headY, bodyY, exprY, head, body, expr });

export const SHEETS = {
  KARTHIK_01: { file: 'karthik.jpeg', size: [1536, 1024], ...wide([0, 418], [460, 962], [460, 962],
    { closeup: [0, 407], threeQuarter: [409, 800], profileLeft: [802, 1154] },
    { body: [0, 232] },
    { neutral: [694, 897], happy: [899, 1111], annoyed: [1113, 1323], surprised: [1325, 1536] }) },
  ARJUN_01: { file: 'arjun.jpeg', size: [821, 1100], ...wide([72, 338], [376, 788], [826, 1058],
    { closeup: [0, 207], threeQuarter: [209, 407], profileLeft: [409, 604] },
    { body: [0, 289] },
    { neutral: [0, 199], happy: [201, 399], annoyed: [401, 599], surprised: [601, 821] }) },
  MEERA_01: { file: 'meera.jpeg', size: [1536, 1024], ...wide([0, 254], [283, 714], [743, 984],
    { closeup: [172, 465], threeQuarter: [469, 832], profileLeft: [837, 1177] },
    { body: [0, 421] },
    { neutral: [0, 377], happy: [383, 763], annoyed: [769, 1147], surprised: [1153, 1536] }) },
  SANTHOSH_01: { file: 'santhosh.jpeg', size: [840, 1100], ...wide([70, 334], [376, 784], [826, 1054],
    { closeup: [0, 217], threeQuarter: [219, 419], profileLeft: [421, 624] },
    { body: [0, 299] },
    { neutral: [0, 211], happy: [213, 417], annoyed: [419, 621], surprised: [623, 840] }) },
  ROHIT_01: { file: 'rohit.png', size: [1536, 1024], ...wide([0, 277], [309, 729], [756, 991],
    { closeup: [186, 466], threeQuarter: [471, 832], profileLeft: [838, 1179] },
    { body: [0, 396] },
    { neutral: [0, 379], happy: [385, 763], annoyed: [769, 1147], surprised: [1153, 1536] }) },
  VICKY_01: { file: 'vicky.jpeg', size: [825, 1100], ...wide([72, 338], [376, 788], [826, 1056],
    { closeup: [0, 214], threeQuarter: [216, 414], profileLeft: [416, 611] },
    { body: [0, 294] },
    { neutral: [0, 202], happy: [204, 404], annoyed: [406, 607], surprised: [609, 825] }) },
  PRIYA_01: { file: 'priya.jpeg', size: [1074, 1100], ...wide([66, 361], [401, 868], [909, 1068],
    { closeup: [0, 267], threeQuarter: [269, 526], profileLeft: [528, 782] },
    { body: [0, 389] },
    { neutral: [0, 264], happy: [266, 526], annoyed: [528, 782], surprised: [784, 1074] }) },
};

async function cut() {
  for (const [id, sheet] of Object.entries(SHEETS)) {
    const src = path.join(sheets, sheet.file);
    const out = path.join(CAST_DIR, id);
    fs.mkdirSync(out, { recursive: true });
    // Boxes were measured at `size`; scale them to the file's real pixel size.
    const { width, height } = await pixelSize(src);
    const sx = width / sheet.size[0];
    const sy = height / sheet.size[1];
    const rows = [['head', sheet.headY], ['body', sheet.bodyY], ['expr', sheet.exprY]];
    for (const [row, [y0, y1]] of rows) {
      for (const [name, [x0, x1]] of Object.entries(sheet[row])) {
        const w = Math.round((x1 - x0) * sx);
        const h = Math.round((y1 - y0) * sy);
        // Small panels are enlarged so a face is never handed to the model at thumbnail size.
        const scale = Math.max(1, Math.ceil(640 / Math.min(w, h)));
        await ffmpeg(['-i', src, '-vf', `crop=${w}:${h}:${Math.round(x0 * sx)}:${Math.round(y0 * sy)},scale=iw*${scale}:ih*${scale}:flags=lanczos`, '-frames:v', '1', path.join(out, `${name}.png`)]);
      }
    }
    console.log(`${id}: cut ${Object.keys({ ...sheet.head, ...sheet.body, ...sheet.expr }).length} views from ${sheet.file} (${width}x${height})`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await cut();
