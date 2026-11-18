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
};

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
  localStorage: { getItem: () => null, setItem: () => {} },
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
const { game, ui } = globalThis.window.hollowlight;
for (const cb of listeners.pointerdown || []) cb({}); // starts the (stub) audio context

ui.setSpeed(3);
game.gold = 1e7;
const order = ['bolt', 'mortar', 'rime', 'coil', 'longeye', 'censer', 'prism', 'beacon'];
// Every ward type, near the path, three times (so each path's tier 3/4 art and effects get drawn).
const cands = [];
for (let y = 40; y < 700; y += 24) for (let x = 40; x < 1100; x += 24) if (game.map.buildable(x, y)) cands.push([x, y]);
let placed = 0;
for (let i = 0; placed < 24 && i < cands.length; i += 7) {
  const t = game.place(order[placed % 8], cands[i][0], cands[i][1]);
  if (t) { placed++; ui.select(t); }
}
for (const t of game.towers) {
  ui.select(t);
  const idx = game.towers.indexOf(t), main = (idx % 8 + Math.floor(idx / 8)) % 3;
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
for (const key of ['5', 'Escape', 'a', 'g', 'h', 'j', 'k', '`', '`']) for (const cb of listeners.keydown || []) cb({ key, shiftKey: false, preventDefault() {} });
frames(30);
// sell one, exercise restart
ui.select(game.towers[1]);
ui.sellSelected();
frames(30);
console.log(`wave ${game.wave}  endless ${game.endless}  over ${game.over}  lives ${game.lives}  pops ${game.pops}  errors ${errors}`);
ui.restart();
frames(30);
if (errors) process.exit(1);
console.log('smoke ok');
