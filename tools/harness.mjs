// Runs the real game (public/js/main.js) without a browser, against a stub DOM in which the game
// canvas and every offscreen canvas are real @napi-rs/canvas canvases. Used by tools/frame.mjs
// (renders frames to PNG) and tools/perf.mjs (profiles the frame). @napi-rs/canvas is NOT a game
// dependency: point CANVAS_MODULES at a node_modules folder that has it (see tools/wards.mjs).
//   realClock: keep the real performance.now() (for profiling); frames still advance by dtMs.
import { createRequire } from 'node:module';
import { join } from 'node:path';

export async function startGame({ realClock = false, dpr = Number(process.env.DPR) || 1.6, query = '' } = {}) {
  const req = createRequire(process.env.CANVAS_MODULES ? join(process.env.CANVAS_MODULES, 'x.js') : import.meta.url);
  const { createCanvas, GlobalFonts } = req('@napi-rs/canvas');
  if (process.env.FONT_DIR) for (const f of ['system-ui', 'sans-serif']) GlobalFonts.registerFromPath(join(process.env.FONT_DIR, 'DejaVuSans-Bold.ttf'), f);
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

  const game = createCanvas(10, 10);
  const canvasListeners = {};
  Object.assign(game, {
    style: {}, classList: { toggle() {}, add() {}, remove() {} }, addEventListener: (type, cb) => { (canvasListeners[type] ||= []).push(cb); },
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
  let now = realClock ? performance.now() : 0, frameCb = null;
  Object.assign(globalThis, {
    window: { addEventListener: (type, cb) => { (listeners[type] ||= []).push(cb); }, devicePixelRatio: dpr, AudioContext: function () { return anything('audio'); } },
    localStorage: { getItem: () => null, setItem: () => {} },
    requestAnimationFrame: (cb) => { frameCb = cb; },
  });
  if (!realClock) Object.defineProperty(globalThis, 'performance', { value: { now: () => now }, configurable: true });
  if (query) globalThis.location = { search: query };
  const frames = (n, dtMs = 16.7) => { for (let i = 0; i < n; i++) { now += dtMs; const cb = frameCb; frameCb = null; cb(now); } };
  const key = (k) => { for (const cb of listeners.keydown || []) cb({ key: k, shiftKey: false, preventDefault() {} }); };
  // Pointer events on the game canvas, in map coordinates (the stub canvas is 1120 x 720 on screen).
  const pointer = (type, x, y, { button = 0, shiftKey = false } = {}) => {
    const ev = { clientX: x, clientY: y, button, shiftKey, preventDefault() {} };
    for (const cb of canvasListeners[type] || []) cb(ev);
    if (type === 'pointerup') for (const cb of listeners.pointerup || []) cb(ev);
  };

  await import('../public/js/main.js');
  const { game: g, ui } = globalThis.window.hollowlight;
  return { createCanvas, canvas: game, g, ui, frames, key, listeners, pointer };
}
