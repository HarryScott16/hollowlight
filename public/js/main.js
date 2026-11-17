// Entry point: wires the simulation, renderer and UI together and runs the frame loop.
import { Game } from './sim/game.js';
import { Renderer } from './render/renderer.js';
import { UI } from './ui/ui.js';
import { Sound } from './audio/sound.js';

const STEP = 1 / 60;        // fixed simulation step
const MAX_STEPS = 12;       // per frame, so a slow frame can't spiral

const canvas = document.getElementById('game');
const game = new Game();
const renderer = new Renderer(canvas, game);
const sound = new Sound();
renderer.sound = sound;
const ui = new UI(game, renderer, canvas, sound);

let last = performance.now();
let acc = 0;

function frame(now) {
  const real = Math.min(0.1, (now - last) / 1000);
  last = now;
  const running = !ui.paused && !game.over;
  sound.update(real);
  // Hit-stop: the simulation holds for a beat on big moments while effects keep playing.
  if (renderer.hitStop > 0) {
    renderer.hitStop -= real;
  } else if (running) {
    acc += real * ui.speed;
    let n = 0;
    while (acc >= STEP && n < MAX_STEPS) { game.step(STEP); acc -= STEP; n++; }
    if (n === MAX_STEPS) acc = 0;
  }
  ui.update();
  renderer.draw(ui.paused ? 0 : real * (game.over ? 1 : ui.speed), ui);
  requestAnimationFrame(frame);
}

renderer.resize();
requestAnimationFrame(frame);

// Handy for debugging and balance checks from the browser console.
window.hollowlight = { game, ui };
