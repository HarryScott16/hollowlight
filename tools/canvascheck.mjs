// Canvas-state check: runs the real game on a real canvas (no browser) with every ward at every
// tier 5 (or a chosen few), for many frames, and reports
//   - any error the frame loop caught (one error per frame can leave everything after it undrawn),
//   - any call a browser would throw on (a negative radius in arc/arcTo/ellipse, a radial gradient
//     with a negative radius, drawImage of a zero-sized canvas),
//   - any canvas state left behind by a frame section on the game canvas: unbalanced save/restore,
//     a clip still active, alpha, blend mode or line dash not back to normal.
//
//   CANVAS_MODULES=<dir>/node_modules node tools/canvascheck.mjs [wave=60] [frames=1500] [only=mortar:1,...] [map=hollowmere]
// only=type:path,... limits the wards (path 0-2 = Q W E). Exits non-zero on any problem.
import { startGame } from './harness.mjs';
import { TOWERS, TOWER_ORDER } from '../public/js/data/towers.js';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(k + '=')); return a ? a.slice(k.length + 1) : d; };
const WAVE = Number(arg('wave', 60)), FRAMES = Number(arg('frames', 1500));
const ONLY = arg('only', '');

const problems = new Map();   // message -> { n, first frame }
let frameNo = 0;
const report = (msg) => { const p = problems.get(msg); if (p) p.n++; else problems.set(msg, { n: 1, frame: frameNo }); };
const errs = [];
const ce = console.error;
console.error = (...a) => { errs.push(a.map((x) => (x && x.stack) || String(x)).join(' ')); };

const { g, ui, frames, key, createCanvas } = await startGame({ dpr: 1, query: `?map=${arg('map', 'hollowmere')}` });

// 1. calls a browser would throw on, on every canvas
const proto = Object.getPrototypeOf(createCanvas(1, 1).getContext('2d'));
// (reported by call site, so each bad caller shows once with a count)
const site = () => { const l = (new Error().stack || '').split('\n').slice(3).find((x) => x.includes('/public/js/')) || ''; return l.replace(/^.*\/public\/js\//, '').replace(/\)$/, ''); };
const wrap = (name, check) => { const fn = proto[name]; proto[name] = function (...a) { const m = check(a); if (m) report(`${name} with ${m.replace(/-?[0-9.]+/g, (v) => (Number(v) < 0 ? '<0' : v))} at ${site()} (a browser throws here: the rest of the frame isn't drawn)`); return fn.apply(this, a); }; };
wrap('arc', (a) => (a[2] < 0 ? `negative radius ${a[2]}` : null));
wrap('arcTo', (a) => (a[4] < 0 ? `negative radius ${a[4]}` : null));
wrap('ellipse', (a) => (a[2] < 0 || a[3] < 0 ? `negative radii ${a[2]}, ${a[3]}` : null));
wrap('createRadialGradient', (a) => (a[2] < 0 || a[5] < 0 ? `negative radius ${a[2]}/${a[5]}` : null));
wrap('drawImage', (a) => (a[0] && (a[0].width === 0 || a[0].height === 0) ? `a ${a[0].width}x${a[0].height} image` : null));

// 2. state left behind on the game canvas, checked after every frame section
const r = ui.renderer, ctx = r.ctx;
let depth = 0;
const clips = [];
const save0 = ctx.save.bind(ctx), restore0 = ctx.restore.bind(ctx), clip0 = ctx.clip.bind(ctx);
ctx.save = () => { depth++; save0(); };
ctx.restore = () => { if (depth > 0) { depth--; while (clips.length && clips[clips.length - 1] > depth) clips.pop(); } restore0(); };
ctx.clip = (...a) => { clips.push(depth); clip0(...a); };
const check = (where) => {
  if (depth !== 0) report(`${where}: ${depth} save() without restore()`);
  if (clips.length) report(`${where}: a clip is still active`);
  if (Math.abs(ctx.globalAlpha - 1) > 1e-6) report(`${where}: globalAlpha left at ${ctx.globalAlpha}`);
  if (ctx.globalCompositeOperation !== 'source-over') report(`${where}: blend mode left at ${ctx.globalCompositeOperation}`);
  if (ctx.getLineDash().length) report(`${where}: line dash left on`);
};
const mark0 = r.mark.bind(r);
r.mark = (name, t0) => { check(`after "${name}"`); return mark0(name, t0); };
const draw0 = r.draw.bind(r);
r.draw = (dt, u) => { draw0(dt, u); check('end of frame'); const m = ctx.getTransform(); if (Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6) report('end of frame: transform left rotated/skewed'); };

// 3. the defence: every ward, each path at tier 5 (one of each), the next path at 2
g.gold = 1e9; g.lives = 1e6;
const want = ONLY ? ONLY.split(',').map((s) => s.split(':')).map(([t, p]) => [t, Number(p)]) : TOWER_ORDER.flatMap((t) => [0, 1, 2].map((p) => [t, p]));
const spots = [];
for (let y = 40; y < 700; y += 22) for (let x = 40; x < 1100; x += 22) if (g.map.buildable(x, y)) spots.push([x, y]);
let si = 0, placed = [];
for (const [type, pi] of want) {
  let t = null;
  if (TOWERS[type].onPath) { const p = g.map.path; for (let k = 0; k < 60 && !t; k++) { const i = Math.round((200 + (placed.length * 37 + k * 23) % (p.length - 400)) / p.step); t = g.place(type, p.xs[i], p.ys[i]); } }
  else for (; si < spots.length && !t; si += 7) t = g.place(type, spots[si][0], spots[si][1]);
  if (!t) { console.log(`no room for ${type}:${pi}`); continue; }
  for (let k = 0; k < 5; k++) g.upgrade(t, pi);
  for (let k = 0; k < 2; k++) g.upgrade(t, (pi + 1) % 3);
  placed.push(t);
}
console.log(`placed ${placed.length}: ${placed.map((t) => `${t.type}:${t.tiers.join('')}`).join(' ')}`);

// 4. play: late waves called early, every ward selected in turn (selection draws range overlays),
// abilities used, the skin switched halfway, upgrade pops replayed
g.endless = true; g.over = null; g.wave = g.rewarded = WAVE - 1;
ui.setSpeed(3);
for (frameNo = 0; frameNo < FRAMES; frameNo++) {
  g.lives = 1e6; if (g.over) g.over = null;
  // hold a crowd (waves overlap, as if called early), so the crowd-quality drawing runs too
  if (g.enemies.length < 400 && g.spawners.length < 30) { const sp = g.spawners.slice(); g.spawners.length = 0; g.startWave(); g.spawners.push(...sp); }
  if (frameNo % 40 === 0) ui.select(placed[(frameNo / 40) % placed.length]);
  if (frameNo % 120 === 60) { for (const t of g.towers) if (t.abilityCd !== null) t.abilityCd = 0; for (const k of 'asdfghjkzcvbx') key(k); }
  if (frameNo === Math.floor(FRAMES / 2)) key('l');
  if (frameNo % 200 === 100) { const t = placed[(frameNo / 100) % placed.length]; g.emit('upgrade', { id: t.id, x: t.x, y: t.y, path: 0, tier: 5, name: 'Check' }); }
  frames(1);
}
console.error = ce;
const fe = globalThis.window.hollowlight.frameErrors || 0;
console.log(`${FRAMES} frames at wave ${g.wave}: ${g.enemies.length} enemies, frame errors ${fe}`);
for (const e of [...new Set(errs)].slice(0, 8)) console.log('  console.error:', e.split('\n').slice(0, 4).join(' | '));
for (const [m, p] of problems) console.log(`  PROBLEM (x${p.n}, first at frame ${p.frame}): ${m}`);
if (!problems.size && !fe) console.log('canvas state clean');
process.exit(problems.size || fe ? 1 : 0);
