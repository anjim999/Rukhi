import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { ffmpeg } from './ffmpeg.js';

/**
 * Phone screens and title cards, drawn as real graphics instead of generated: a video model
 * cannot be trusted to spell a message or a bank balance, and these must be exact.
 * Each screen is HTML rendered to PNG by a headless browser, then timed into a clip with
 * synthesized interface sounds.
 */

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

function findBrowser() {
  const found = BROWSERS.find((p) => fs.existsSync(p));
  if (!found) throw new Error('No Chrome or Edge found for rendering graphics. Set CHROME_PATH to a Chromium-based browser.');
  return found;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderHtml(html, pngPath, { w, h }) {
  const htmlPath = `${pngPath}.html`;
  fs.writeFileSync(htmlPath, html);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'film-gfx-'));
  return new Promise((resolve, reject) => {
    const proc = spawn(findBrowser(), [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
      '--force-device-scale-factor=1', `--user-data-dir=${profile}`, `--window-size=${w},${h}`,
      `--screenshot=${pngPath}`, `file:///${htmlPath.split(path.sep).join('/')}`,
    ]);
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', reject);
    proc.on('close', () => {
      fs.rmSync(htmlPath, { force: true });
      fs.rmSync(profile, { recursive: true, force: true });
      if (fs.existsSync(pngPath) && fs.statSync(pngPath).size > 0) resolve(pngPath);
      else reject(new Error(`Browser did not produce ${path.basename(pngPath)}: ${stderr.slice(-300)}`));
    });
  });
}

// ── Screen templates ──────────────────────────────────────────────────────────────────────
// Sizes are in "u" (1/1080 of the screen width) so one layout serves any resolution.

const page = ({ w, h }, body, css = '') => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${w}px; height: ${h}px; overflow: hidden; background: #000; }
  body { --u: ${Math.min(w, (h * 9) / 16) / 1080}px; display: flex; justify-content: center; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  .screen { position: relative; width: calc(1080 * var(--u)); height: ${h}px; overflow: hidden; color: #e9edef; }
  .status { position: absolute; top: 0; left: 0; right: 0; height: calc(86 * var(--u)); display: flex; align-items: center; justify-content: space-between; padding: 0 calc(52 * var(--u)); font-size: calc(36 * var(--u)); font-weight: 600; z-index: 5; }
  .status .icons { display: flex; align-items: center; gap: calc(16 * var(--u)); }
  .bars { display: flex; align-items: flex-end; gap: calc(5 * var(--u)); height: calc(30 * var(--u)); }
  .bars i { width: calc(7 * var(--u)); background: currentColor; border-radius: calc(2 * var(--u)); }
  .battery { width: calc(58 * var(--u)); height: calc(28 * var(--u)); border: calc(3 * var(--u)) solid currentColor; border-radius: calc(8 * var(--u)); padding: calc(3 * var(--u)); }
  .battery i { display: block; width: 72%; height: 100%; background: currentColor; border-radius: calc(3 * var(--u)); }
  ${css}
</style></head><body><div class="screen">${body}</div></body></html>`;

const statusBar = (time) => `<div class="status"><span>${esc(time)}</span><span class="icons"><span class="bars"><i style="height:35%"></i><i style="height:55%"></i><i style="height:78%"></i><i style="height:100%"></i></span><span class="battery"><i></i></span></span></div>`;

const SENDER_COLOURS = ['#53bdeb', '#f7a23b', '#e26ab6', '#7fd47a', '#b18cfe', '#ff8a7a'];

function chatHtml(size, { group, members, messages, input, clock }) {
  const senders = [...new Set(messages.filter((m) => !m.out).map((m) => m.from))];
  const bubbles = messages.map((m) => `
    <div class="row ${m.out ? 'out' : 'in'}"><div class="bubble">
      ${m.out ? '' : `<div class="from" style="color:${SENDER_COLOURS[senders.indexOf(m.from) % SENDER_COLOURS.length]}">${esc(m.from)}</div>`}
      <span class="text">${esc(m.text)}</span><span class="time">${esc(m.time)}${m.out ? '<span class="ticks">✓✓</span>' : ''}</span>
    </div></div>`).join('');
  const body = `
    ${statusBar(clock)}
    <div class="header"><span class="back">‹</span><span class="avatar">${esc(group.replace(/[^A-Za-z ]/g, '').split(' ').map((p) => p[0]).join('').slice(0, 2))}</span>
      <span class="titles"><b>${esc(group)}</b><small>${esc(members)}</small></span></div>
    <div class="thread">${bubbles}</div>
    <div class="composer"><div class="field ${input ? '' : 'empty'}">${input ? `${esc(input)}<i class="caret"></i>` : '<i class="caret"></i>'}</div><div class="send ${input ? 'on' : ''}">➤</div></div>`;
  return page(size, body, `
    .screen { background: #0b141a; }
    .status { background: #1f2c34; }
    .header { position: absolute; top: calc(86 * var(--u)); left: 0; right: 0; height: calc(150 * var(--u)); background: #1f2c34; display: flex; align-items: center; gap: calc(26 * var(--u)); padding: 0 calc(34 * var(--u)); }
    .back { font-size: calc(84 * var(--u)); line-height: 1; margin-top: calc(-12 * var(--u)); color: #aebac1; }
    .avatar { width: calc(100 * var(--u)); height: calc(100 * var(--u)); border-radius: 50%; background: linear-gradient(135deg, #f7a23b, #e2543a); display: flex; align-items: center; justify-content: center; font-size: calc(40 * var(--u)); font-weight: 700; color: #fff; }
    .titles { display: flex; flex-direction: column; min-width: 0; } .titles b { font-size: calc(46 * var(--u)); font-weight: 600; } .titles small { font-size: calc(31 * var(--u)); color: #8696a0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .thread { position: absolute; top: calc(236 * var(--u)); bottom: calc(170 * var(--u)); left: 0; right: 0; padding: calc(34 * var(--u)) calc(30 * var(--u)); display: flex; flex-direction: column; justify-content: flex-end; gap: calc(20 * var(--u));
      background-image: radial-gradient(rgba(255,255,255,0.035) calc(2 * var(--u)), transparent calc(3 * var(--u))); background-size: calc(46 * var(--u)) calc(46 * var(--u)); }
    .row { display: flex; } .row.out { justify-content: flex-end; }
    .bubble { max-width: 80%; padding: calc(18 * var(--u)) calc(26 * var(--u)) calc(16 * var(--u)); border-radius: calc(26 * var(--u)); font-size: calc(46 * var(--u)); line-height: 1.3; box-shadow: 0 calc(2 * var(--u)) calc(3 * var(--u)) rgba(0,0,0,0.3); }
    .in .bubble { background: #1f2c34; border-top-left-radius: calc(6 * var(--u)); } .out .bubble { background: #005c4b; border-top-right-radius: calc(6 * var(--u)); }
    .from { font-size: calc(36 * var(--u)); font-weight: 600; margin-bottom: calc(4 * var(--u)); }
    .time { float: right; margin: calc(18 * var(--u)) 0 0 calc(26 * var(--u)); font-size: calc(28 * var(--u)); color: rgba(233,237,239,0.6); white-space: nowrap; }
    .ticks { margin-left: calc(8 * var(--u)); color: #53bdeb; letter-spacing: calc(-8 * var(--u)); }
    .composer { position: absolute; bottom: 0; left: 0; right: 0; height: calc(170 * var(--u)); display: flex; align-items: center; gap: calc(20 * var(--u)); padding: 0 calc(24 * var(--u)) calc(14 * var(--u)); }
    .field { flex: 1; height: calc(116 * var(--u)); border-radius: calc(58 * var(--u)); background: #1f2c34; display: flex; align-items: center; padding: 0 calc(44 * var(--u)); font-size: calc(46 * var(--u)); white-space: nowrap; overflow: hidden; }
    .caret { display: inline-block; width: calc(4 * var(--u)); height: calc(56 * var(--u)); background: #00a884; margin-left: calc(4 * var(--u)); }
    .send { width: calc(116 * var(--u)); height: calc(116 * var(--u)); border-radius: 50%; background: #00a884; display: flex; align-items: center; justify-content: center; font-size: calc(50 * var(--u)); color: #0b141a; opacity: 0.55; } .send.on { opacity: 1; }
  `);
}

function lockHtml(size, { time, lit }) {
  const body = `
    <div class="glow"></div>
    <div class="lock"><span></span></div>
    <div class="clock">${esc(time)}</div>
    <div class="note ${lit ? 'on' : ''}"><i></i><span class="l1"></span><span class="l2"></span></div>`;
  return page(size, body, `
    .screen { background: radial-gradient(120% 80% at 30% 15%, #2a3b63 0%, #131a2e 55%, #070a14 100%); filter: brightness(${lit ? 1 : 0.55}); }
    .glow { position: absolute; inset: 0; background: radial-gradient(60% 40% at 70% 80%, rgba(240,140,90,0.28), transparent 70%); }
    .lock { position: absolute; top: calc(250 * var(--u)); left: 50%; width: calc(54 * var(--u)); height: calc(44 * var(--u)); margin-left: calc(-27 * var(--u)); background: rgba(255,255,255,0.85); border-radius: calc(10 * var(--u)); }
    .lock span { position: absolute; left: 50%; top: calc(-30 * var(--u)); width: calc(34 * var(--u)); height: calc(36 * var(--u)); margin-left: calc(-17 * var(--u)); border: calc(7 * var(--u)) solid rgba(255,255,255,0.85); border-bottom: 0; border-radius: calc(18 * var(--u)) calc(18 * var(--u)) 0 0; }
    .clock { position: absolute; top: calc(340 * var(--u)); left: 0; right: 0; text-align: center; font-size: calc(250 * var(--u)); font-weight: 300; letter-spacing: calc(-6 * var(--u)); color: #fff; }
    .note { position: absolute; left: calc(48 * var(--u)); right: calc(48 * var(--u)); top: calc(760 * var(--u)); height: calc(170 * var(--u)); border-radius: calc(40 * var(--u)); background: rgba(255,255,255,0.16); opacity: 0; }
    .note.on { opacity: 1; }
    .note i { position: absolute; left: calc(36 * var(--u)); top: calc(40 * var(--u)); width: calc(90 * var(--u)); height: calc(90 * var(--u)); border-radius: calc(24 * var(--u)); background: #00a884; }
    .note span { position: absolute; left: calc(160 * var(--u)); height: calc(26 * var(--u)); border-radius: calc(13 * var(--u)); background: rgba(255,255,255,0.75); }
    .note .l1 { top: calc(48 * var(--u)); width: calc(300 * var(--u)); } .note .l2 { top: calc(98 * var(--u)); width: calc(560 * var(--u)); background: rgba(255,255,255,0.4); }
  `);
}

function bankHtml(size, { balance, loaded, clock }) {
  const body = `
    ${statusBar(clock)}
    <div class="top"><span class="back">‹</span><span class="logo"><i></i><i></i><i></i></span><span class="dots"><i></i><i></i><i></i></span></div>
    <div class="card">
      <div class="chip"></div>
      ${loaded ? `<div class="balance">${esc(balance)}</div>` : '<div class="skeleton"></div>'}
      <div class="bar"><i></i></div>
    </div>
    <div class="tiles"><span></span><span></span><span></span><span></span></div>
    <div class="rows"><i></i><i></i><i></i></div>`;
  return page(size, body, `
    .screen { background: #f3f5f9; color: #0f1b33; }
    .status { color: #0f1b33; }
    .top { position: absolute; top: calc(110 * var(--u)); left: 0; right: 0; height: calc(120 * var(--u)); display: flex; align-items: center; justify-content: space-between; padding: 0 calc(44 * var(--u)); }
    .back { font-size: calc(84 * var(--u)); line-height: 1; color: #0f1b33; }
    .logo { display: flex; align-items: flex-end; gap: calc(9 * var(--u)); height: calc(54 * var(--u)); } .logo i { width: calc(14 * var(--u)); background: #1b4dd8; border-radius: calc(4 * var(--u)); }
    .logo i:nth-child(1) { height: 55%; } .logo i:nth-child(2) { height: 100%; } .logo i:nth-child(3) { height: 75%; }
    .dots { display: flex; gap: calc(9 * var(--u)); } .dots i { width: calc(12 * var(--u)); height: calc(12 * var(--u)); border-radius: 50%; background: #0f1b33; }
    .card { position: absolute; top: calc(300 * var(--u)); left: calc(48 * var(--u)); right: calc(48 * var(--u)); height: calc(560 * var(--u)); border-radius: calc(52 * var(--u)); background: linear-gradient(135deg, #1b4dd8 0%, #0c2a86 100%); box-shadow: 0 calc(26 * var(--u)) calc(60 * var(--u)) rgba(27,77,216,0.35); color: #fff; padding: calc(60 * var(--u)); }
    .chip { width: calc(110 * var(--u)); height: calc(80 * var(--u)); border-radius: calc(16 * var(--u)); background: linear-gradient(135deg, #f6d27a, #c99632); }
    .balance { margin-top: calc(110 * var(--u)); font-size: calc(74 * var(--u)); font-weight: 700; letter-spacing: calc(-1 * var(--u)); white-space: nowrap; }
    .skeleton { margin-top: calc(124 * var(--u)); width: 78%; height: calc(66 * var(--u)); border-radius: calc(33 * var(--u)); background: rgba(255,255,255,0.28); }
    .bar { position: absolute; left: calc(60 * var(--u)); right: calc(60 * var(--u)); bottom: calc(64 * var(--u)); height: calc(14 * var(--u)); border-radius: calc(7 * var(--u)); background: rgba(255,255,255,0.22); } .bar i { display: block; width: 4%; height: 100%; border-radius: inherit; background: #f6d27a; }
    .tiles { position: absolute; top: calc(940 * var(--u)); left: calc(48 * var(--u)); right: calc(48 * var(--u)); display: flex; justify-content: space-between; }
    .tiles span { width: calc(216 * var(--u)); height: calc(216 * var(--u)); border-radius: calc(44 * var(--u)); background: #fff; box-shadow: 0 calc(8 * var(--u)) calc(24 * var(--u)) rgba(15,27,51,0.08); }
    .rows { position: absolute; top: calc(1240 * var(--u)); left: calc(48 * var(--u)); right: calc(48 * var(--u)); display: flex; flex-direction: column; gap: calc(30 * var(--u)); }
    .rows i { height: calc(150 * var(--u)); border-radius: calc(36 * var(--u)); background: #fff; box-shadow: 0 calc(8 * var(--u)) calc(24 * var(--u)) rgba(15,27,51,0.06); }
  `);
}

/** A wristwatch face filling the frame: the time, large, on a dark dial. */
function watchHtml(size, { time, meridiem }) {
  const body = `
    <div class="strap top"></div><div class="strap bottom"></div>
    <div class="case"><div class="dial">
      <div class="ring"></div>
      <div class="time">${esc(time)}</div>
      ${meridiem ? `<div class="ampm">${esc(meridiem)}</div>` : ''}
    </div></div>`;
  return page(size, body, `
    .screen { background: radial-gradient(90% 60% at 50% 45%, #2b2f36 0%, #14161a 60%, #0a0b0d 100%); }
    .strap { position: absolute; left: calc(250 * var(--u)); right: calc(250 * var(--u)); background: linear-gradient(90deg, #0d0e10, #23262b 30%, #23262b 70%, #0d0e10); }
    .strap.top { top: 0; height: 30%; border-radius: 0 0 calc(40 * var(--u)) calc(40 * var(--u)); }
    .strap.bottom { bottom: 0; height: 30%; border-radius: calc(40 * var(--u)) calc(40 * var(--u)) 0 0; }
    .case { position: absolute; left: 50%; top: 50%; width: calc(760 * var(--u)); height: calc(760 * var(--u)); margin: calc(-380 * var(--u)) 0 0 calc(-380 * var(--u)); border-radius: 50%; background: linear-gradient(145deg, #5b6068, #1a1c20 55%, #3a3e45); box-shadow: 0 calc(30 * var(--u)) calc(80 * var(--u)) rgba(0,0,0,0.7); padding: calc(34 * var(--u)); }
    .dial { position: relative; width: 100%; height: 100%; border-radius: 50%; background: radial-gradient(circle at 50% 35%, #15181d, #050607 75%); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #f4f6f8; }
    .ring { position: absolute; inset: calc(26 * var(--u)); border-radius: 50%; border: calc(5 * var(--u)) solid rgba(120,200,255,0.35); border-top-color: #6fd0ff; border-right-color: #6fd0ff; }
    .time { font-size: calc(230 * var(--u)); font-weight: 300; letter-spacing: calc(-6 * var(--u)); line-height: 1; }
    .ampm { margin-top: calc(18 * var(--u)); font-size: calc(64 * var(--u)); font-weight: 600; letter-spacing: calc(10 * var(--u)); color: #6fd0ff; }
  `);
}

/** An outgoing phone call: who is being called, and that it is still ringing. */
function callHtml(size, { name, status, clock }) {
  const body = `
    ${statusBar(clock)}
    <div class="avatar">${esc(name[0])}</div>
    <div class="name">${esc(name)}</div>
    <div class="state">${esc(status)}</div>
    <div class="row"><span></span><span></span><span></span></div>
    <div class="end"><i></i></div>`;
  return page(size, body, `
    .screen { background: linear-gradient(180deg, #1c2a3a 0%, #0f1722 55%, #06090e 100%); }
    .avatar { position: absolute; top: calc(330 * var(--u)); left: 50%; width: calc(320 * var(--u)); height: calc(320 * var(--u)); margin-left: calc(-160 * var(--u)); border-radius: 50%; background: linear-gradient(135deg, #f7a23b, #e2543a); display: flex; align-items: center; justify-content: center; font-size: calc(150 * var(--u)); font-weight: 700; color: #fff; }
    .name { position: absolute; top: calc(730 * var(--u)); left: 0; right: 0; text-align: center; font-size: calc(104 * var(--u)); font-weight: 600; color: #fff; }
    .state { position: absolute; top: calc(880 * var(--u)); left: 0; right: 0; text-align: center; font-size: calc(52 * var(--u)); color: #9db0c4; }
    .row { position: absolute; top: calc(1180 * var(--u)); left: calc(150 * var(--u)); right: calc(150 * var(--u)); display: flex; justify-content: space-between; }
    .row span { width: calc(170 * var(--u)); height: calc(170 * var(--u)); border-radius: 50%; background: rgba(255,255,255,0.12); }
    .end { position: absolute; bottom: calc(230 * var(--u)); left: 50%; width: calc(210 * var(--u)); height: calc(210 * var(--u)); margin-left: calc(-105 * var(--u)); border-radius: 50%; background: #e5484d; display: flex; align-items: center; justify-content: center; }
    .end i { width: calc(96 * var(--u)); height: calc(30 * var(--u)); border-radius: calc(15 * var(--u)); background: #fff; transform: rotate(135deg); }
  `);
}

function titleHtml(size, { text }) {
  // Punctuation carries the gold highlight; the words stay white.
  const marked = esc(text).replace(/(…|\.\.\.|!)/g, '<em>$1</em>');
  const lines = marked.split(/\s+(?=[A-Z])/).map((line) => `<div>${line}</div>`).join('');
  return page(size, `<div class="vignette"></div><div class="title">${lines}<span class="rule"></span></div>`, `
    .screen { width: ${size.w}px; background: radial-gradient(90% 60% at 50% 45%, #1c2c66 0%, #0b1437 55%, #050a1f 100%); }
    .vignette { position: absolute; inset: 0; background: radial-gradient(70% 55% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%); }
    .title { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-family: 'Segoe UI Black', 'Arial Black', Impact, sans-serif; font-weight: 900; font-size: ${Math.round(Math.min(size.w * 0.19, size.h * 0.16))}px; line-height: 1.02; letter-spacing: -0.01em; color: #fff;
      text-shadow: 0 0 ${Math.round(size.w * 0.03)}px rgba(255,214,130,0.45), 0 0 ${Math.round(size.w * 0.08)}px rgba(120,150,255,0.35), 0 ${Math.round(size.w * 0.008)}px 0 rgba(0,0,0,0.35); }
    .title em { font-style: normal; color: #f6c453; text-shadow: 0 0 ${Math.round(size.w * 0.035)}px rgba(246,196,83,0.75); }
    .rule { margin-top: ${Math.round(size.h * 0.03)}px; width: ${Math.round(size.w * 0.28)}px; height: ${Math.max(4, Math.round(size.w * 0.007))}px; border-radius: 999px; background: linear-gradient(90deg, transparent, #f6c453, transparent); }
  `);
}

// ── Interface sounds (synthesized, so nothing is borrowed) ──────────────────────────────
const SOUNDS = {
  // A soft, low tick: at full typing speed a bright click reads as a rattle.
  key: ['anoisesrc=d=0.02:c=pink:a=0.14', 'highpass=f=900,lowpass=f=3200,afade=t=out:st=0.004:d=0.016'],
  send: ["aevalsrc='0.3*sin(2*PI*(650+2600*t)*t)*exp(-16*t)':d=0.28:s=48000", 'afade=t=in:d=0.005'],
  buzz: ["aevalsrc='0.4*sin(2*PI*155*t)*(0.55+0.45*sin(2*PI*31*t))':d=0.42:s=48000", 'afade=t=in:d=0.02,afade=t=out:st=0.36:d=0.06'],
  reveal: ["aevalsrc='0.22*sin(2*PI*520*t)*exp(-9*t)':d=0.35:s=48000", 'afade=t=in:d=0.005'],
  // The caller's ringback: a soft two-tone burr.
  ring: ["aevalsrc='0.13*(sin(2*PI*400*t)+sin(2*PI*450*t))':d=0.9:s=48000", 'afade=t=in:d=0.03,afade=t=out:st=0.84:d=0.06'],
  tick: ["aevalsrc='0.2*sin(2*PI*1900*t)*exp(-60*t)':d=0.08:s=48000", 'afade=t=in:d=0.002'],
};

/** Time a list of still frames into a clip, with interface sounds at the given moments. */
async function buildClip({ frames, events = [], seconds, fadeIn = 0, output, size }) {
  const list = `${output}.txt`;
  // The concat demuxer needs the last frame listed twice to honour its duration.
  const lines = frames.flatMap((f) => [`file '${f.png.split(path.sep).join('/')}'`, `duration ${f.dur.toFixed(3)}`]);
  lines.push(`file '${frames[frames.length - 1].png.split(path.sep).join('/')}'`);
  fs.writeFileSync(list, lines.join('\n'));

  const inputs = ['-f', 'concat', '-safe', '0', '-i', list, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo'];
  const chains = [];
  events.forEach((event, i) => {
    const [source, shape] = SOUNDS[event.sound];
    inputs.push('-f', 'lavfi', '-i', source);
    chains.push(`[${i + 2}:a]${shape},aresample=48000,adelay=${Math.round(event.at * 1000)}:all=1[e${i}]`);
  });
  const mix = events.length
    ? `${chains.join(';')};[1:a]${events.map((_, i) => `[e${i}]`).join('')}amix=inputs=${events.length + 1}:duration=first:normalize=0[a]`
    : '[1:a]anull[a]';
  const fade = fadeIn ? `,fade=t=in:st=0:d=${fadeIn}` : '';

  await ffmpeg([
    ...inputs,
    '-filter_complex', `[0:v]fps=24,scale=${size.w}:${size.h},format=yuv420p${fade}[v];${mix}`,
    '-map', '[v]', '-map', '[a]', '-t', seconds.toFixed(3),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', output,
  ]);
  fs.rmSync(list, { force: true });
}

const TYPE_INTERVAL = 0.11;

/**
 * Render one graphic shot to `output`. `spec` is the shot's `graphic` field:
 *   { type: 'chat', history: [{from, text, time, out}], typed, time, group?, members? }
 *   { type: 'lock', time }     { type: 'bank', balance }     { type: 'title', text }
 *   { type: 'watch', time, meridiem }     { type: 'call', name, status, clock }
 */
export async function renderGraphic(spec, output, { size, seconds, workDir }) {
  fs.mkdirSync(workDir, { recursive: true });
  let n = 0;
  const still = async (html) => renderHtml(html, path.join(workDir, `f${String(n++).padStart(3, '0')}.png`), size);
  const frames = [];
  const events = [];
  let fadeIn = 0;

  if (spec.type === 'chat') {
    const clock = spec.time.replace(/\s*[AP]M$/i, '');
    const base = { group: spec.group || 'OREY… MANAM!', members: spec.members || 'Arjun, Meera, Santhosh, Rohit, Vicky, You', clock };
    const lead = 0.5;
    frames.push({ png: await still(chatHtml(size, { ...base, messages: spec.history, input: '' })), dur: lead });
    const chars = [...spec.typed];
    for (let i = 1; i <= chars.length; i++) {
      frames.push({ png: await still(chatHtml(size, { ...base, messages: spec.history, input: chars.slice(0, i).join('') })), dur: i === chars.length ? 0.35 : TYPE_INTERVAL });
      if (chars[i - 1] !== ' ') events.push({ sound: 'key', at: lead + (i - 1) * TYPE_INTERVAL });
    }
    const sentAt = lead + (chars.length - 1) * TYPE_INTERVAL + 0.35;
    const sent = [...spec.history, { from: 'You', out: true, text: spec.typed, time: spec.time }];
    frames.push({ png: await still(chatHtml(size, { ...base, messages: sent, input: '' })), dur: Math.max(0.5, seconds - sentAt) });
    events.push({ sound: 'send', at: sentAt });
  } else if (spec.type === 'lock') {
    frames.push({ png: await still(lockHtml(size, { time: spec.time, lit: false })), dur: 0.25 });
    frames.push({ png: await still(lockHtml(size, { time: spec.time, lit: true })), dur: Math.max(0.5, seconds - 0.25) });
    events.push({ sound: 'buzz', at: 0.2 }, { sound: 'buzz', at: 0.75 });
  } else if (spec.type === 'bank') {
    const clock = spec.clock || '10:51';
    frames.push({ png: await still(bankHtml(size, { balance: spec.balance, loaded: false, clock })), dur: 0.7 });
    frames.push({ png: await still(bankHtml(size, { balance: spec.balance, loaded: true, clock })), dur: Math.max(0.5, seconds - 0.7) });
    events.push({ sound: 'reveal', at: 0.7 });
  } else if (spec.type === 'watch') {
    frames.push({ png: await still(watchHtml(size, { time: spec.time, meridiem: spec.meridiem })), dur: seconds });
    events.push({ sound: 'tick', at: 0.15 }, { sound: 'tick', at: 1.15 });
  } else if (spec.type === 'call') {
    frames.push({ png: await still(callHtml(size, { name: spec.name, status: spec.status || 'Calling…', clock: spec.clock || '' })), dur: seconds });
    events.push({ sound: 'ring', at: 0.2 });
  } else if (spec.type === 'title') {
    frames.push({ png: await still(titleHtml(size, { text: spec.text })), dur: seconds });
    fadeIn = 0.6;
  } else {
    throw new Error(`Unknown graphic type "${spec.type}".`);
  }

  await buildClip({ frames, events, seconds, fadeIn, output, size });
  fs.rmSync(workDir, { recursive: true, force: true });
  return output;
}
