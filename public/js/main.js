// Entry point: wires the simulation, renderer and UI together and runs the frame loop.
import { Game } from './sim/game.js';
import { Renderer } from './render/renderer.js';
import { UI } from './ui/ui.js';
import { Sound } from './audio/sound.js';

const STEP = 1 / 60;        // fixed simulation step
const MAX_STEPS = 20;       // per frame (5x speed needs ~5 at 60 fps), so a slow frame can't spiral
// The simulation also gets a time budget per frame: if stepping takes longer than this (a huge
// crowd at 5x on a slow machine), the backlog is dropped and the game runs a little slower than
// the chosen speed for a moment, rather than the frame rate collapsing. Results are unchanged:
// every step is still a full fixed step.
const SIM_BUDGET_MS = 8;

const canvas = document.getElementById('game');
// ?map= and ?difficulty= skip the menus (for testing); otherwise the last choice is used.
const query = new URLSearchParams((typeof location !== 'undefined' && location.search) || '');
const game = new Game({ map: query.get('map') || undefined, difficulty: query.get('difficulty') || undefined });
const renderer = new Renderer(canvas, game);
const sound = new Sound();
renderer.sound = sound;
const ui = new UI(game, renderer, canvas, sound);

let last = performance.now();
let acc = 0;

// An error in one frame must never stop the loop (the map would freeze while the side panel keeps
// working). Each part of the frame is guarded on its own, so a drawing bug can't stop the
// simulation; errors are logged clearly (the first time each one happens, then every 300th) and
// counted in window.hollowlight.frameErrors (tools/smoke.js fails on any).
const seen = new Map();
let frameErrors = 0;
function guard(part, fn) {
  try { fn(); } catch (err) {
    frameErrors++;
    if (window.hollowlight) window.hollowlight.frameErrors = frameErrors;
    const key = `${part}: ${err && err.message}`, n = (seen.get(key) || 0) + 1;
    seen.set(key, n);
    if (n === 1 || n % 300 === 0) console.error(`[Hollowlight] error in the ${part} (frame kept running${n > 1 ? `, seen ${n} times` : ''}):`, err);
    if (part === 'drawing') renderer.recover();
  }
}

function frame(now) {
  requestAnimationFrame(frame);   // first, so nothing below can stop the loop
  guard('frame', () => step(now));
}

function step(now) {
  const real = Math.min(0.1, (now - last) / 1000);
  last = now;
  const running = !ui.paused && !game.over;
  sound.update(real);
  // Hit-stop: the simulation holds for a beat on big moments while effects keep playing.
  if (renderer.hitStop > 0) {
    renderer.hitStop -= real;
  } else if (running) guard('simulation', () => {
    acc += real * ui.speed;
    let n = 0;
    const t0 = performance.now();
    while (acc >= STEP && n < MAX_STEPS) {
      game.step(STEP); acc -= STEP; n++;
      if (performance.now() - t0 > SIM_BUDGET_MS) { acc = Math.min(acc, STEP); break; }
    }
    renderer.mark('sim', t0);
    renderer.perf.steps += n; renderer.addPerf('steps', n);
    if (n === MAX_STEPS) acc = 0;
  });
  const tu = performance.now();
  guard('interface', () => ui.update());
  renderer.mark('ui', tu);
  guard('drawing', () => renderer.draw(ui.paused ? 0 : real * (game.over ? 1 : ui.speed), ui));
}

renderer.resize();
requestAnimationFrame(frame);

// Handy for debugging and balance checks from the browser console.
window.hollowlight = { game, ui, frameErrors: 0 };
