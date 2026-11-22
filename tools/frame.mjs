// Renders real game frames to PNG without a browser, for checking art in place (depth sorting,
// muzzles, effects) in both skins. Like tools/smoke.js, but the game canvas and every offscreen
// canvas are real @napi-rs/canvas canvases.
//
//   CANVAS_MODULES=<dir>/node_modules [FONT_DIR=<dir with DejaVuSans.ttf>] [WAVE=24] [T5=1] [QUERY=?map=ashfork] node tools/frame.mjs <outdir>
//
// Needs @napi-rs/canvas, which is NOT a game dependency (see tools/wards.mjs).
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { startGame } from './harness.mjs';

const outDir = process.argv[2] || 'frames';
mkdirSync(outDir, { recursive: true });
const { createCanvas, canvas: game, g, ui, frames, key } = await startGame({ query: process.env.QUERY || '' });
g.gold = 1e7;

// Wards along the bottom straight of the path (y = 580): a row behind it and a row in front,
// in mixed tiers, plus base wards by the vertical stretch at x = 480 for comparison.
const builds = [
  [150, 538, 'bolt', [0, 4, 2]], [205, 538, 'mortar', [4, 0, 2]], [262, 538, 'coil', [0, 4, 0]], [330, 538, 'longeye', [4, 2, 0]], [385, 538, 'prism', [0, 0, 4]], [440, 538, 'beacon', [0, 4, 0]],
  [160, 624, 'rime', [0, 0, 4]], [215, 624, 'censer', [0, 4, 2]], [270, 624, 'mortar', [0, 4, 0]], [325, 624, 'coil', [4, 2, 0]], [380, 624, 'prism', [4, 0, 2]], [435, 624, 'bolt', [4, 2, 0]],
  [436, 330, 'mortar', [0, 0, 0]], [526, 330, 'coil', [0, 0, 0]], [436, 400, 'prism', [0, 0, 0]], [526, 400, 'beacon', [0, 0, 0]],
];
// T5=1: the same defence with every tier 4 taken to tier 5 (all different, so the limit allows it).
if (process.env.T5) for (const b of builds) b[3] = b[3].map((n) => (n === 4 ? 5 : n));
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
if (WAVE > 40) { g.endless = true; g.over = null; }   // the late endless waves (crowd quality)
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
