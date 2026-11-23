// Smoke test for the browser code (renderer, UI, sound) without a browser. Usage: node tools/smoke.js
//
// Loads the real public/js/main.js against a stub DOM in which every element, canvas context and
// audio node is a do-nothing "anything" object. Then it plays the game through the real UI code
// (placing, upgrading to tier 4, abilities, the boss, endless mode) for a few thousand frames.
// It catches runtime errors (typos, missing fields, bad event payloads) in code the headless bot
// never touches. It can't judge how anything looks.

// An object that accepts any property access, call or construction and returns itself.
function anything(name = 'stub') {
  const fn = function () {};
  return new Proxy(fn, {
    get(t, k) {
      if (k === Symbol.iterator) return function* () {};
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then') return undefined;
      // elements remember their event listeners, so the test can click and drag through the real UI
      if (k === 'addEventListener') return (type, cb) => { ((t.on ||= {})[type] ||= []).push(cb); };
      if (k === 'fire') return (type, ev) => { for (const cb of (t.on && t.on[type]) || []) cb(ev); };
      if (k in overrides) return overrides[k];
      if (!t.cache) t.cache = {};
      if (!(k in t.cache)) t.cache[k] = anything(`${name}.${String(k)}`);
      return t.cache[k];
    },
    set(t, k, v) { (t.cache || (t.cache = {}))[k] = v; return true; },
    apply() { return anything(`${name}()`); },
    construct() { return anything(`new ${name}`); },
  });
}
const overrides = {
  clientWidth: 1200, clientHeight: 800, width: 1120, height: 720, left: 0, top: 0,
  offsetWidth: 100, measureText: () => ({ width: 50 }), getChannelData: () => new Float32Array(16),
  getContext: () => trackingCtx(),
};
// A 2D context that keeps the state the renderer's leak check reads (save/restore stack, alpha,
// blend mode, line dash); everything else is a do-nothing stub.
function trackingCtx() {
  const st = { globalAlpha: 1, globalCompositeOperation: 'source-over', dash: [] }, stack = [], own = {};
  const methods = {
    save() { stack.push({ ...st, dash: st.dash.slice() }); },
    restore() { const s = stack.pop(); if (s) Object.assign(st, s); },
    setLineDash(d) { st.dash = [...d]; },
    getLineDash() { return st.dash.slice(); },
  };
  return new Proxy(own, {
    get(t, k) {
      if (k in t) return t[k];
      if (k in methods) return methods[k];
      if (k === 'globalAlpha' || k === 'globalCompositeOperation') return st[k];
      if (k in overrides) return overrides[k];
      return (t[k] = anything(`ctx.${String(k)}`));
    },
    set(t, k, v) { if (k === 'globalAlpha' || k === 'globalCompositeOperation') st[k] = v; else t[k] = v; return true; },
  });
}

const elements = new Map();
const document = {
  getElementById(id) { if (!elements.has(id)) elements.set(id, anything(`#${id}`)); return elements.get(id); },
  createElement: (tag) => anything(`<${tag}>`),
  querySelector: (q) => anything(q),
  querySelectorAll: () => [],
};
const listeners = {};
let now = 0;
let frameCb = null;
Object.assign(globalThis, {
  document,
  window: {
    addEventListener: (type, cb) => { (listeners[type] ||= []).push(cb); },
    devicePixelRatio: 1,
    AudioContext: function () { return anything('audio'); },
  },
  localStorage: (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; })(),
  requestAnimationFrame: (cb) => { frameCb = cb; },
});
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });

let errors = 0;
function frames(n, dtMs = 16.7) {
  for (let i = 0; i < n; i++) {
    now += dtMs;
    const cb = frameCb;
    frameCb = null;
    try { cb(now); } catch (err) { errors++; console.error('frame error:', err); if (errors > 3) process.exit(1); }
  }
}

await import('../public/js/main.js');
const { TOWERS } = await import('../public/js/data/towers.js');
const { game, ui } = globalThis.window.hollowlight;
ui.renderer.enableStateCheck();   // every frame section must leave the canvas state clean
// The title screen opens first (no ?map= in this run): start Hollowmere on Medium through it.
if (!ui.menu || !ui.menu.open) { console.error('the title screen did not open'); process.exitCode = 1; }
// A first visit has nothing to continue; after a game starts, the title offers to continue it.
{
  const { lastChoice } = await import('../public/js/ui/records.js');
  if (lastChoice().saved) { console.error('a first visit already has a Continue choice'); process.exitCode = 1; }
  ui.menu.showMaps(); ui.menu.showDifficulty('hollowmere');
  ui.menu.start('hollowmere', 'medium');
  const c = lastChoice();
  if (!c.saved || c.map !== 'hollowmere' || c.difficulty !== 'medium') { console.error('the last choice was not remembered for Continue'); process.exitCode = 1; }
}
for (const cb of listeners.pointerdown || []) cb({}); // starts the (stub) audio context

ui.setSpeed(3);
game.gold = 1e7;
import { TOWER_ORDER as order, WARD_KEYS } from '../public/js/data/towers.js';
import { ABILITIES } from '../public/js/data/abilities.js';
import { upgradeInfo } from '../public/js/sim/towers.js';
// Every ward type, near the path, three times (so each path's tier 3/4 art and effects get drawn).
const cands = [];
for (let y = 40; y < 700; y += 24) for (let x = 40; x < 1100; x += 24) if (game.map.buildable(x, y)) cands.push([x, y]);
const N = order.length;
let placed = 0;
for (let i = 0; placed < N * 3 && i < cands.length; i += 5) {
  const type = order[placed % N];
  if (TOWERS[type].onPath) continue;
  const t = game.place(type, cands[i][0], cands[i][1]);
  if (t) { placed++; ui.select(t); }
  // Snares go on the road: three along the path, placed through the UI's pointer handler.
  while (TOWERS[order[placed % N]] && TOWERS[order[placed % N]].onPath && placed < N * 3) {
    const p = game.map.path, d = 300 + (placed / N) * 700;
    const x = p.xs[Math.round(d / p.step)], y = p.ys[Math.round(d / p.step)];
    ui.setPlacing('snare'); ui.mouse.x = x; ui.mouse.y = y; ui.mouse.inside = true; frames(1);
    const s = game.place('snare', x + 5, y + 3);
    if (!s) { console.error('could not place a snare at', x, y); errors++; }
    ui.setPlacing(null);
    placed++;
  }
}
for (const t of game.towers) {
  ui.select(t);
  const idx = game.towers.indexOf(t), main = (idx % N + Math.floor(idx / N)) % 3;
  for (let k = 0; k < 4; k++) ui.buyUpgrade(main);
  for (let k = 0; k < 2; k++) ui.buyUpgrade((main + 1) % 3);
}
ui.select(game.towers[0]);
console.log('towers', game.towers.map((t) => `${t.type}:${t.tiers.join('')}`).join(' '));

// Plays a stretch of waves starting at `from` (1-based), skipping ahead between stretches so
// every new enemy, every boss and the switch into endless mode get drawn.
function play(from, count) {
  if (game.wave < from - 1) { game.wave = game.rewarded = from - 1; }
  let run = 0;
  for (let guard = 0; guard < 600 && run < count; guard++) {
    if (game.over === 'win') { ui.continueEndless(); }
    if (game.over) break;
    if (game.canStartWave && game.clear) { game.startWave(); run++; }
    frames(60);
    game.useFlare();
    for (const type of order) game.useAbility(type);
    for (const t of game.towers) if (t.type === 'vault' && t.bank > 50) { ui.select(t); ui.wardAction(); }
  }
  // let the last wave in the stretch finish
  for (let guard = 0; guard < 400 && !game.clear && !game.over; guard++) frames(60);
}
play(1, 15);
for (const w of [20, 30, 40]) { game.lives = 1e6; play(w, 1); }
if (game.over === 'win') ui.continueEndless();
play(41, 1);
play(50, 1);
// keyboard: pick a ward, fire abilities by key, toggle FPS
for (const key of ['5', 'Escape', '0', '-', '=', 'Escape', 'a', 'g', 'h', 'j', 'k', 'z', 'c', 'v', 'b', '`', '`']) for (const cb of listeners.keydown || []) cb({ key, shiftKey: false, preventDefault() {} });
frames(30);
// a Wandering Light's post moves with R and a click; a Vault cashes out with R
const wl = game.towers.find((t) => t.type === 'wander');
ui.select(wl);
for (const cb of listeners.keydown || []) cb({ key: 'r', shiftKey: false, preventDefault() {} });
if (ui.moving !== wl) { console.error('R did not start moving the Wandering Light'); errors++; }
frames(2);
const hx = wl.hx;
game.movePost(wl, 600, 380);
if (wl.hx === hx) { console.error('post did not move'); errors++; }
ui.moving = null;
frames(60);
const vt = game.towers.find((t) => t.type === 'vault');
vt.bank = 100; ui.select(vt); const g0 = game.gold;
for (const cb of listeners.keydown || []) cb({ key: 'r', shiftKey: false, preventDefault() {} });
if (game.gold < g0 + 100) { console.error('R did not cash out the Vault'); errors++; }
frames(10);
// the skins: draw a few frames in the other one too
for (const cb of listeners.keydown || []) cb({ key: 'l', shiftKey: false, preventDefault() {} });
frames(30);
// sell one, exercise restart
ui.select(game.towers[1]);
ui.sellSelected();
frames(30);
// Every ward, through the real UI: placed by click and by drag from the shop, every path upgraded
// (all three as main path, across three wards of the type), its R action and its ability by key.
// A frame error is caught by the game loop (which keeps running) and counted: any one fails here.
{
  game.lives = 1e6; game.gold = 1e8;
  const canvas = document.getElementById('game');
  const ev = (x, y, extra) => ({ clientX: x, clientY: y, button: 0, shiftKey: false, detail: 1, preventDefault() {}, ...extra });
  const keyDown = (key) => { for (const cb of listeners.keydown || []) cb({ key, shiftKey: false, preventDefault() {} }); };
  const p = game.map.path;
  const spotFor = (type, n) => {
    if (TOWERS[type].onPath) { const i = Math.round((200 + n * 90) / p.step); return [p.xs[i] + 3, p.ys[i] - 2]; }
    for (let k = 0; k < cands.length; k++) { const [x, y] = cands[(k * 37 + n * 11) % cands.length]; if (game.canPlace(type, x, y)) return [x, y]; }
    return null;
  };
  const check = (what) => {
    frames(4);
    const fe = window.hollowlight.frameErrors || 0;
    if (fe) { console.error(`frame error after: ${what}`); errors += fe; window.hollowlight.frameErrors = 0; }
  };
  // clear the board so there's room
  for (const t of game.towers.slice()) game.sell(t);
  for (const type of order) {
    const n0 = game.towers.length;
    const btn = ui.shopButtons[type];
    // 1. click the shop button, hover the map (the placement preview draws), click to place
    let at = spotFor(type, 0);
    btn.fire('pointerdown', ev(0, 0)); btn.fire('click', ev(0, 0)); for (const cb of listeners.pointerup || []) cb(ev(0, 0));
    canvas.fire('pointermove', ev(at[0], at[1])); check(`${type}: placement preview`);
    canvas.fire('pointerdown', ev(at[0], at[1])); canvas.fire('pointerup', ev(at[0], at[1])); for (const cb of listeners.pointerup || []) cb(ev(at[0], at[1]));
    check(`${type}: placed by click`);
    // 2. drag from the shop button and drop on the map
    at = spotFor(type, 1);
    btn.fire('pointerdown', ev(0, 0)); canvas.fire('pointermove', ev(at[0], at[1])); check(`${type}: dragging`);
    canvas.fire('pointerup', ev(at[0], at[1])); for (const cb of listeners.pointerup || []) cb(ev(at[0], at[1]));
    check(`${type}: placed by drag`);
    // 3. a third, so each path gets to be the main one
    at = spotFor(type, 2); keyDown(WARD_KEYS[order.indexOf(type)]); canvas.fire('pointermove', ev(at[0], at[1])); canvas.fire('pointerdown', ev(at[0], at[1]));
    check(`${type}: placed by key`);
    const mine = game.towers.slice(n0);
    if (mine.length !== 3) { console.error(`${type}: expected 3 placed (click, drag, key), got ${mine.length}`); errors++; }
    mine.forEach((t, i) => {
      ui.select(t); check(`${type}: selected`);
      for (let k = 0; k < 5; k++) keyDown('qwe'[i]);
      for (let k = 0; k < 2; k++) keyDown('qwe'[(i + 1) % 3]);
      check(`${type} ${t.tiers.join('')}: upgraded`);
      if (t.tiers[i] !== 5) { console.error(`${type}: path ${i} didn't reach tier 5 (${t.tiers.join('')})`); errors++; }
      keyDown('r');   // the ward's own action
      if (t.def.kind === 'wander') { canvas.fire('pointermove', ev(560, 380)); check(`${type}: choosing a post`); canvas.fire('pointerdown', ev(560, 380)); }
      check(`${type}: R action`);
    });
    // only one of each tier 5: a fourth ward can't take path 0 to tier 5 while the first holds it
    {
      const x = game.place(type, ...spotFor(type, 3));
      if (x) {
        for (let k = 0; k < 4; k++) game.upgrade(x, 0);
        if (upgradeInfo(x, 0).reason !== 'unique' || game.upgrade(x, 0)) { console.error(`${type}: a second tier 5 on path 0 was allowed`); errors++; }
        game.sell(x);
      }
    }
    if (!game.canStartWave) for (let k = 0; k < 600 && !game.clear; k++) frames(30);
    game.startWave(); frames(600);
    for (const t of mine) t.abilityCd = 0;
    keyDown(ABILITIES[type].key.toLowerCase());
    check(`${type}: ability ${ABILITIES[type].name}`);
    keyDown('l'); check(`${type}: other skin`); keyDown('l');
    for (const t of mine) { ui.select(t); ui.sellSelected(); }
    check(`${type}: sold`);
  }
  console.log(`all ${order.length} wards: click, drag, key, every path to tier 5 (one of each), R and ability`);
}

// The menus, and every map on every difficulty: through the title, map and difficulty screens,
// a few wards (a Snare on the road, a Longeye, a Wandering Light with a moved post, a Beacon),
// a few hundred frames of a wave, the pause menu, settings and back to the title.
{
  const { MAP_ORDER } = await import('../public/js/data/maps.js');
  const { DIFFICULTY_ORDER } = await import('../public/js/data/difficulty.js');
  const m = ui.menu;
  m.showSettings(() => m.showTitle());
  for (const mapId of MAP_ORDER) {
    for (const diff of DIFFICULTY_ORDER) {
      m.showTitle(); m.showMaps(); m.showDifficulty(mapId);
      m.start(mapId, diff);
      if (game.map.data.id !== mapId || game.diff.id !== diff || ui.inMenu) { console.error(`menu start ${mapId}/${diff} failed`); errors++; }
      game.gold = 1e6;
      const r0 = game.map.routes[game.map.routes.length - 1].path, i0 = Math.round(r0.count * 0.5);
      game.place('snare', r0.xs[i0], r0.ys[i0]);
      let k = 0;
      for (let y = 40; y < 700 && k < 4; y += 30) for (let x = 40; x < 1100 && k < 4; x += 30) {
        const type = ['longeye', 'wander', 'beacon', 'mortar'][k];
        if (game.canPlace(type, x, y)) { const t = game.place(type, x, y); if (t) { for (let u = 0; u < 4; u++) game.upgrade(t, k % 3); k++; } }
      }
      const w = game.towers.find((t) => t.type === 'wander');
      if (w) game.movePost(w, 560, 380);
      game.wave = 24; game.rewarded = 24; game.startWave();
      frames(300);
      m.openPause(); frames(5); m.closePause(); frames(20);
      if (game.map.routes.length > 1 && !game.enemies.some((e) => e.route === 1)) { console.error(`${mapId}: nothing walked the second road`); errors++; }
    }
  }
  m.showTitle();
  console.log(`menus: ${MAP_ORDER.length} maps x ${DIFFICULTY_ORDER.length} difficulties started through the menus and played`);
}

// The upgrade tree, the Wandering Light's anchor, Strong targeting, Vault interest, Hard's 60 waves.
{
  ui.menu.start('hollowmere', 'medium');
  game.gold = 1e6;
  const tr = ui.tree, fail = (msg) => { console.error(msg); errors++; };
  // From the shop: nothing owned, tier 1 of every path is next, the rest later.
  for (const type of order) {
    tr.show(type);
    if (!tr.open) fail(`upgrade tree for ${type} did not open`);
    for (let pi = 0; pi < 3; pi++) {
      if (tr.stateOf(pi, 0).state !== 'next' || tr.stateOf(pi, 3).state !== 'later') fail(`tree ${type}: unplaced states wrong`);
    }
    tr.close();
  }
  if (ui.paused) fail('closing the upgrade tree left the game paused');
  // A placed ward: owned, next, and the two path rules.
  let b = null;
  for (let y = 60; y < 700 && !b; y += 20) for (let x = 60; x < 1080 && !b; x += 20) if (game.canPlace('bolt', x, y)) b = game.place('bolt', x, y);
  ui.select(b); ui.buyUpgrade(0); ui.buyUpgrade(0); ui.buyUpgrade(0); ui.buyUpgrade(1);
  tr.show(b.type, b);
  const st = (pi, k) => tr.stateOf(pi, k);
  if (st(0, 2).state !== 'owned' || st(0, 3).state !== 'next' || st(1, 0).state !== 'owned' || st(1, 1).state !== 'next') fail(`tree: owned/next wrong ${b.tiers}`);
  if (st(1, 2).state !== 'locked' || st(1, 2).reason !== 'cap') fail('tree: the past-tier-2 rule is not shown');
  if (st(2, 0).state !== 'locked' || st(2, 0).reason !== 'paths') fail('tree: the two-paths rule is not shown');
  tr.close();
  // A Wandering Light is picked by its anchor, wherever its light has gone.
  let w = null;
  for (let y = 80; y < 700 && !w; y += 20) for (let x = 80; x < 1060 && !w; x += 20) if (game.canPlace('wander', x, y)) w = game.place('wander', x, y);
  w.x += 120; w.y += 60;   // as if it had roamed off
  if (ui.wardAt(w.hx, w.hy - 6) !== w) fail('the Wandering Light anchor does not select it');
  // Strong: the toughest kind first, and of one kind the one furthest along.
  const ENEMIES = (await import('../public/js/data/enemies.js')).ENEMIES;
  if (!(ENEMIES.colossus.rank > ENEMIES.dreadhulk.rank && ENEMIES.dreadhulk.rank > ENEMIES.husk.rank && ENEMIES.gravemaw.rank > ENEMIES.colossus.rank)) fail('Strong ranks are out of order');
  const { strongScore } = await import('../public/js/sim/enemies.js');
  const fake = (type, dist) => ({ def: ENEMIES[type], dist, prog: 1 });
  if (!(strongScore(fake('colossus', 10)) > strongScore(fake('husk', 3000)) && strongScore(fake('husk', 900)) > strongScore(fake('husk', 100)))) fail('Strong scores are wrong');
  // Vault interest grows past the cap, up to the ceiling, and cashing out resets the bonus.
  let v = null;
  for (let y = 80; y < 700 && !v; y += 20) for (let x = 80; x < 1060 && !v; x += 20) if (game.canPlace('vault', x, y)) v = game.place('vault', x, y);
  v.bank = v.stats.cap;
  game.enemies.length = 0; game.spawners.length = 0;
  for (let k = 0; k < 3; k++) { game.wave++; game.step(1 / 60); }
  if (!(v.bank > v.stats.cap && v.held === 3)) fail(`vault interest did not grow past the cap (${v.bank}, held ${v.held})`);
  ui.select(v); ui.updatePanel(); ui.wardAction();
  if (v.held !== 0) fail('cashing out did not reset the interest bonus');
  ui.select(null);
  // Hard is 60 waves; the others 40.
  ui.menu.start('hollowmere', 'hard');
  if (game.totalWaves !== 60) fail(`Hard has ${game.totalWaves} waves`);
  game.gold = 1e6; game.lives = 1e6;
  game.wave = 59; game.rewarded = 59; game.startWave(); frames(240);
  if (!game.enemies.some((e) => e.type === 'lastdark')) fail('Hard wave 60 has no Last Dark');
  ui.menu.start('hollowmere', 'medium');
  if (game.totalWaves !== 40) fail(`Medium has ${game.totalWaves} waves`);
  console.log('upgrade tree, anchor, Strong, Vault interest and Hard 60 checked');
}

errors += window.hollowlight.frameErrors || 0;
const r = ui.renderer;
if (r.stateLeaks) { console.error(`canvas state leaks: ${r.stateLeaks}`); errors += r.stateLeaks; }
if (r.artErrors) { console.error(`ward drawing errors: ${r.artErrors}`); errors += r.artErrors; }
console.log(`wave ${game.wave}  endless ${game.endless}  over ${game.over}  lives ${game.lives}  pops ${game.pops}  errors ${errors}`);
ui.restart();
frames(30);
if (errors) process.exit(1);
console.log('smoke ok');
