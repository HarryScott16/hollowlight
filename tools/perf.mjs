// Frame-cost profiler: plays a stress scene in the real game (no browser) and prints the same
// per-frame breakdown as the FPS overlay (` key).
//
//   CANVAS_MODULES=<dir>/node_modules node tools/perf.mjs [wave=80] [speed=1] [mode=normal|test] [defence=few|full|t5] [wards=22] [crowd=0] [map=hollowmere] [frames=120]
//
// The crowd is built up by running the simulation alone for `warm` seconds, then `frames` frames
// are rendered at 60 fps steps and timed with the real clock. Absolute times come from a software
// canvas (@napi-rs/canvas, no GPU), so they are slower than a browser: compare sections and runs,
// not milliseconds against a browser.
import { startGame } from './harness.mjs';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(k + '=')); return a ? a.slice(k.length + 1) : d; };
const WAVE = Number(arg('wave', 80)), SPEED = Number(arg('speed', 1)), MODE = arg('mode', 'normal'), DEF = arg('defence', 'few');
const N = Number(arg('frames', 120)), WARM = Number(arg('warm', 25));

// map=<id> (default Hollowmere); the query also skips the menus
const MAPID = arg('map', 'hollowmere');
const { g, ui, frames } = await startGame({ realClock: true, dpr: Number(process.env.DPR) || 1, query: `?map=${MAPID}${MODE === 'test' ? '&test=1' : ''}` });
const r = ui.renderer;
// Count canvas calls per section too (on every canvas, including the wards' own live canvases):
// in a browser, the number of 2D calls is usually what costs.
let calls = 0; const byName = Object.create(null), cur = Object.create(null), bySec = Object.create(null);
const ctx = r.ctx, proto = Object.getPrototypeOf(ctx);
for (const k of Object.getOwnPropertyNames(proto)) {
  const d = Object.getOwnPropertyDescriptor(proto, k);
  if (!d || typeof d.value !== 'function' || k === 'constructor') continue;
  const fn = d.value; proto[k] = function (...args) { calls++; byName[k] = (byName[k] || 0) + 1; cur[k] = (cur[k] || 0) + 1; return fn.apply(this, args); };
}
for (const k of ['fillStyle', 'strokeStyle', 'globalAlpha', 'lineWidth', 'globalCompositeOperation', 'font']) {
  const d = Object.getOwnPropertyDescriptor(proto, k); if (!d || !d.set) continue;
  Object.defineProperty(proto, k, { configurable: true, get() { return d.get.call(this); }, set(v) { calls++; byName[k] = (byName[k] || 0) + 1; cur[k] = (cur[k] || 0) + 1; d.set.call(this, v); } });
}
const callSum = Object.create(null);
const mark0 = r.mark.bind(r), add0 = r.addPerf.bind(r);
let lastCalls = 0;
r.mark = (name, t0) => {
  callSum[name] = (callSum[name] || 0) + (calls - lastCalls); lastCalls = calls;
  const b = bySec[name] || (bySec[name] = Object.create(null));
  for (const k in cur) { b[k] = (b[k] || 0) + cur[k]; delete cur[k]; }
  return mark0(name, t0);
};
r.drawWardAt = ((orig) => function (c, t, dt) { const c0 = calls; orig.call(r, c, t, dt); callSum.wardsCalls = (callSum.wardsCalls || 0) + (calls - c0); })(r.drawWardAt);
r.drawGhosts = ((orig) => function (c, l) { const c0 = calls; orig.call(r, c, l); callSum.ghostCalls = (callSum.ghostCalls || 0) + (calls - c0); })(r.drawGhosts);
g.gold = 1e9;
// The defence: a few mid-tier wards (far too few for the wave), or a full tier 4 defence.
const types = process.env.WARDS === '8' ? ['bolt', 'mortar', 'rime', 'coil', 'longeye', 'censer', 'prism', 'beacon']
  : ['bolt', 'mortar', 'rime', 'coil', 'longeye', 'censer', 'prism', 'beacon', 'snare', 'moth', 'wander', 'vault'];
const spots = [];
for (let y = 50; y < 700; y += 26) for (let x = 40; x < 1100; x += 26) if (g.map.buildable(x, y) && g.map.distTo(x, y) < 70) spots.push([x, y]);
if (!spots.length) for (let y = 50; y < 700; y += 26) for (let x = 40; x < 1100; x += 26) if (g.map.buildable(x, y)) spots.push([x, y]);
// t5: the full defence with every ward pushed to tier 5 where the one-of-each limit allows.
const FULL = DEF === 'full' || DEF === 't5';
const want = FULL ? Number(arg('wards', 22)) : 5;
for (let i = 0, k = 0; i < spots.length && k < want; i += 5) {
  const type = types[k % types.length];
  let t;
  if (type === 'snare') { const p = g.map.path, j = Math.round((250 + k * 40) / p.step); t = g.place(type, p.xs[j], p.ys[j]); }
  else t = g.place(type, spots[i][0], spots[i][1]);
  if (!t) continue;
  ui.select(t);
  const main = (k + Math.floor(k / 12)) % 3;   // each copy of a type takes another path (one of each tier 5)
  for (let u = 0; u < (DEF === 't5' ? 5 : FULL ? 4 : 2); u++) ui.buyUpgrade(main);
  if (FULL) for (let u = 0; u < 2; u++) ui.buyUpgrade((main + 1) % 3);
  k++;
}
ui.select(null);
g.endless = true; g.over = null;
g.wave = g.rewarded = WAVE - 1;
g.startWave();
ui.setSpeed(SPEED);
// crowd=N: waves overlap (as if called early) while fewer than N enemies are alive, to hold a big
// late crowd against a strong defence (as in test mode with wave jumping).
const CROWD = Number(arg('crowd', 0));
const keep = () => {
  g.lives = Math.max(g.lives, 150); if (g.over) g.over = null;
  if (CROWD && g.enemies.length < CROWD && g.spawners.length < 30) { const sp = g.spawners.slice(); g.spawners.length = 0; g.startWave(); g.spawners.push(...sp); }
};
// Build the crowd: the simulation alone, WARM seconds of game time.
for (let i = 0; i < WARM * 60; i++) { g.step(1 / 60); keep(); g.fx.length = 0; }
// count the simulation's events the renderer handles each frame
let events = 0;
r.consume = ((orig) => function () { events += g.fx.length; return orig.call(r); })(r.consume);
frames(5);
r.pops.clear();   // the upgrade pops from setting up the defence would otherwise still be playing
r.perf.sum = Object.create(null); for (const k in callSum) delete callSum[k]; for (const k in byName) delete byName[k]; for (const k in bySec) delete bySec[k]; for (const k in cur) delete cur[k]; lastCalls = calls; events = 0;
let enemies = 0, parts = 0, shots = 0;
const t0 = performance.now();
for (let i = 0; i < N; i++) { frames(1); keep(); enemies += g.enemies.length; parts += r.parts.list.length; shots += g.projectiles.length; }
const wall = (performance.now() - t0) / N;
const a = r.perf.sum, f = (k) => ((a[k] || 0) / N).toFixed(1).padStart(5);
console.log(`   ${Math.round(events / N)} simulation events per frame`);
console.log(`wave ${WAVE} ${MODE.padEnd(6)} ${SPEED}x ${DEF.padEnd(4)}| ${String(Math.round(enemies / N)).padStart(4)} enemies ${String(Math.round(parts / N)).padStart(4)} particles ${String(Math.round(shots / N)).padStart(3)} shots | ms/frame: sim${f('sim')} (${((a.steps || 0) / N).toFixed(1)} steps) enemies${f('enemies')} wards${f('wards')} ghosts${f('ghosts')} effects${f('events') && ''}${((['events', 'flamesim', 'beams', 'shots', 'flames', 'rings', 't5fx', 'snow'].reduce((t, k) => t + (a[k] || 0), 0)) / N).toFixed(1).padStart(5)} particles${f('particles')} ground${f('ground')} overlay${f('overlay')} ui${f('ui')} | wall ${wall.toFixed(1)} | quality ${r.quality}`);
console.log('   every section, ms/frame:', Object.keys(a).filter((k) => k !== 'steps').sort((x, y) => a[y] - a[x]).map((k) => `${k} ${(a[k] / N).toFixed(2)}`).join(', '));
const c = (k) => String(Math.round((callSum[k] || 0) / N)).padStart(6);
// (calls between two marks land in the later bucket: 'ghosts' and 'enemies' hold the walker pass with
// the wards and ghosts inside it, then the flyers and the health bars)
const S = (k) => callSum[k] || 0;
const enemyCalls = S('ghosts') + S('enemies') - S('wardsCalls') - S('ghostCalls');
console.log(`   canvas calls/frame: enemies${String(Math.round(enemyCalls / N)).padStart(6)} wards${String(Math.round(S('wardsCalls') / N)).padStart(6)} ghosts${String(Math.round(S('ghostCalls') / N)).padStart(5)} events${c('events')} shots${c('shots')} flames${c('flames')} rings${c('rings')} particles${c('particles')} ground${c('ground')} overlay${c('overlay')}  total ${Math.round((Object.values(callSum).reduce((a, b) => a + b, 0) - S('wardsCalls') - S('ghostCalls')) / N)}`);
if (process.env.STATES) {
  const st = Object.create(null), inc = (k) => { st[k] = (st[k] || 0) + 1; };
  for (const e of g.enemies) {
    inc(e.type); if (e.def.flying) inc('~flying'); if (e.shield > 0) inc('~shield'); if (e.flash > 0) inc('~flash'); if (e.hitT > 0) inc('~hitT');
    if (e.veiled) inc('~veiled'); if (e.freezeT > 0) inc('~freeze'); if (e.stunT > 0) inc('~stun'); if (e.slowT > 0) inc('~slow');
    if (e.def.hp > 10 && e.hp < e.maxHp) inc('~damaged'); if (e.def.haste) inc('~hasteAura');
  }
  console.log('   enemy states (last frame):', Object.entries(st).map(([k, v]) => `${k} ${v}`).join(', '));
}
if (process.env.CALLS) console.log('   by method:', Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k} ${Math.round(v / N)}`).join(', '));
if (process.env.SECTION) for (const sec of process.env.SECTION.split(',')) console.log(`   ${sec} by method:`, Object.entries(bySec[sec] || {}).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k} ${Math.round(v / N)}`).join(', '));
process.exit(0);
