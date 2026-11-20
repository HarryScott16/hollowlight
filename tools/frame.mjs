// Renders real game frames to PNG without a browser, for checking art in place (depth sorting,
// muzzles, effects) in both skins. Like tools/smoke.js, but the game canvas and every offscreen
// canvas are real @napi-rs/canvas canvases.
//
//   CANVAS_MODULES=<dir>/node_modules [FONT_DIR=<dir with DejaVuSans.ttf>] node tools/frame.mjs <outdir>
//
// Needs @napi-rs/canvas, which is NOT a game dependency (see tools/wards.mjs).
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

const req = createRequire(process.env.CANVAS_MODULES ? join(process.env.CANVAS_MODULES, 'x.js') : import.meta.url);
const { createCanvas, GlobalFonts } = req('@napi-rs/canvas');
if (process.env.FONT_DIR) for (const f of ['system-ui', 'sans-serif']) GlobalFonts.registerFromPath(join(process.env.FONT_DIR, 'DejaVuSans-Bold.ttf'), f);
const outDir = process.argv[2] || 'frames';
mkdirSync(outDir, { recursive: true });

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
const overrides = { clientWidth: 1200, clientHeight: 800, width: 1120, height: 720, left: 0, top: 0, offsetWidth: 100, measureText: () => ({ width: 50 }), getChannelData: () => new Float32Array(16) };

const DPR = Number(process.env.DPR) || 1.6;
const game = createCanvas(10, 10);
Object.assign(game, {
  style: {}, classList: { toggle() {}, add() {}, remove() {} }, addEventListener() {},
  parentElement: { clientWidth: 1136, clientHeight: 736 },
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1120, height: 720 }),
});
const elements = new Map([['game', game]]);
globalThis.document = {
  getElementById(id) { if (!elements.has(id)) elements.set(id, anything(`#${id}`)); return elements.get(id); },
  // Real canvases (for sprites and icons) with the few DOM bits the UI touches stubbed on.
  createElement: (tag) => (tag === 'canvas' ? Object.assign(createCanvas(1, 1), { style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, addEventListener() {}, append() {}, remove() {} }) : anything(`<${tag}>`)),
  querySelector: (q) => anything(q),
  querySelectorAll: () => [],
  body: anything('body'),
};
const listeners = {};
let now = 0, frameCb = null;
Object.assign(globalThis, {
  window: { addEventListener: (type, cb) => { (listeners[type] ||= []).push(cb); }, devicePixelRatio: DPR, AudioContext: function () { return anything('audio'); } },
  localStorage: { getItem: () => null, setItem: () => {} },
  requestAnimationFrame: (cb) => { frameCb = cb; },
});
Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
const frames = (n, dtMs = 16.7) => { for (let i = 0; i < n; i++) { now += dtMs; const cb = frameCb; frameCb = null; cb(now); } };
const key = (k) => { for (const cb of listeners.keydown || []) cb({ key: k, shiftKey: false, preventDefault() {} }); };

await import('../public/js/main.js');
const { game: g, ui } = globalThis.window.hollowlight;
g.gold = 1e7;

// Wards along the bottom straight of the path (y = 580): a row behind it and a row in front,
// in mixed tiers, plus base wards by the vertical stretch at x = 480 for comparison.
const builds = [
  [150, 538, 'bolt', [4, 2, 0]], [205, 538, 'censer', [4, 0, 2]], [262, 538, 'rime', [0, 2, 4]], [330, 538, 'longeye', [4, 2, 0]], [385, 538, 'censer', [0, 4, 0]], [440, 538, 'bolt', [0, 4, 2]],
  [160, 624, 'rime', [4, 2, 0]], [215, 624, 'longeye', [0, 2, 4]], [270, 624, 'bolt', [2, 0, 4]], [325, 624, 'censer', [0, 2, 4]], [380, 624, 'rime', [0, 4, 0]], [435, 624, 'longeye', [0, 4, 2]],
  [436, 330, 'bolt', [0, 0, 0]], [526, 330, 'censer', [0, 0, 0]], [436, 400, 'rime', [0, 0, 0]], [526, 400, 'longeye', [0, 0, 0]],
];
for (const [x, y, type, tiers] of builds) {
  let t = null;
  for (let d = 0; d < 30 && !t; d += 3) t = g.place(type, x + (d % 2 ? d : -d), y) || g.place(type, x, y + (y < 580 ? -d : d));
  if (!t) { console.log(`could not place ${type} at ${x},${y}`); continue; }
  ui.select(t);
  const order = tiers.map((n, i) => [n, i]).sort((a, b) => b[0] - a[0]);
  for (const [n, i] of order) for (let k = 0; k < n; k++) ui.buyUpgrade(i);
}
ui.select(null);
console.log('placed', g.towers.map((t) => `${t.type}:${t.tiers.join('')}`).join(' '));

const save = (name) => { writeFileSync(join(outDir, `${name}.png`), game.toBuffer('image/png')); };
// A zoomed crop of the bottom straight, where the two rows of wards face the crowd.
const crop = (name, x = 110, y = 470, w = 380, h = 190, z = 2) => {
  const s = game.width / 1120, c = createCanvas(w * z, h * z);
  c.getContext('2d').drawImage(game, x * s, y * s, w * s, h * s, 0, 0, w * z, h * z);
  writeFileSync(join(outDir, `${name}.png`), c.toBuffer('image/png'));
};

// Wait for a crowd on the bottom straight, then snapshot both skins at the same moment.
const WAVE = Number(process.env.WAVE) || 24;
g.wave = g.rewarded = WAVE - 1;
// For the snapshot only: wards deal a sliver of their damage, so a crowd builds up in front of them.
const realDamage = g.damage.bind(g);
g.damage = (e, amt, ...rest) => realDamage(e, amt * 0.002, ...rest);
g.startWave();
const onStraight = () => g.enemies.filter((e) => e.y > 540 && e.y < 620 && e.x > 110 && e.x < 480).length;
let t0 = Date.now(), n = 0, best = 0;
ui.setSpeed(3);
for (let i = 0; i < 160 && onStraight() < 25; i++) { frames(15); n += 15; g.lives = 150; }
ui.setSpeed(1);
const ms = (Date.now() - t0) / n;
console.log(`wave ${g.wave}: ${g.enemies.length} enemies, ${onStraight()} on the straight, ~${ms.toFixed(1)} ms per frame (software canvas, sim included)`);
ui.paused = true; frames(1);
save('kindlings-full'); crop('kindlings-crop');
key('l'); frames(1);
save('lanterns-full'); crop('lanterns-crop');
key('l'); ui.paused = false; frames(25);
crop('kindlings-crop2');
// The shop icons and a ward-panel icon, in both skins.
const icons = (name) => {
  const list = Object.values(ui.shopIcons), c = createCanvas(list.length * 52, 52), x = c.getContext('2d');
  x.fillStyle = '#26324a'; x.fillRect(0, 0, c.width, 52);
  list.forEach((ic, i) => x.drawImage(ic, i * 52 + 2, 2, 48, 48));
  writeFileSync(join(outDir, `${name}.png`), c.toBuffer('image/png'));
};
icons('icons-kindlings'); key('l'); icons('icons-lanterns'); key('l');
console.log('frames written to', outDir);
