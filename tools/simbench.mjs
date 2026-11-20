// Simulation benchmark: the game's step() alone (no drawing), with a big defence against a big
// late endless crowd. Prints ms per step and how many enemies were alive.
//   node tools/simbench.mjs [wave=250] [wards=35] [tier=5] [dmg=1] [crowd=600] [steps=600] [warm=20]
// Waves overlap (as if called early) while fewer than `crowd` enemies are alive.
//   node --cpu-prof --cpu-prof-dir=<dir> tools/simbench.mjs ...   (then: node tools/cpuprof.mjs <file>)
// dmg < 1 scales every hit down while the crowd builds and during the timing, to hold a crowd of
// ~600 the way a defence that is just holding would (it does not change the game).
import { Game } from '../public/js/sim/game.js';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(k + '=')); return a ? Number(a.slice(k.length + 1)) : d; };
const WAVE = arg('wave', 250), WARDS = arg('wards', 35), TIER = arg('tier', 5), DMG = arg('dmg', 1), STEPS = arg('steps', 600), WARM = arg('warm', 20);
const g = new Game({ fx: true, seed: 1 });
g.gold = 1e9;
const types = ['bolt', 'mortar', 'rime', 'coil', 'longeye', 'censer', 'prism', 'beacon', 'snare', 'moth', 'wander', 'vault'];
const spots = [];
for (let y = 50; y < 700; y += 26) for (let x = 40; x < 1100; x += 26) if (g.map.buildable(x, y)) spots.push([x, y]);
for (let i = 0, k = 0; i < spots.length && k < WARDS; i += 5) {
  const type = types[k % types.length];
  let t;
  if (type === 'snare') { const p = g.map.path, j = Math.round((250 + k * 40) / p.step); t = g.place(type, p.xs[j], p.ys[j]); }
  else t = g.place(type, spots[i][0], spots[i][1]);
  if (!t) continue;
  const main = (k + Math.floor(k / 12)) % 3;   // each copy of a type takes another path (one of each tier 5)
  for (let u = 0; u < TIER; u++) g.upgrade(t, main);
  for (let u = 0; u < 2; u++) g.upgrade(t, (main + 1) % 3);
  k++;
}
if (DMG !== 1) { const d0 = g.damage.bind(g); g.damage = (e, a, ...r) => d0(e, a * DMG, ...r); }
g.endless = true; g.over = null;
g.wave = g.rewarded = WAVE - 1;
g.startWave();
const CROWD = arg("crowd", 600);
// Overlapping waves (as when a player calls them early) until `crowd` enemies are alive.
const keep = () => {
  g.lives = Math.max(g.lives, 1e6); if (g.over) g.over = null;
  if (g.enemies.length < CROWD && g.spawners.length < 30) { const sp = g.spawners.slice(); g.spawners.length = 0; g.startWave(); g.spawners.push(...sp); }
};
for (let i = 0; i < WARM * 60; i++) { g.step(1 / 60); g.fx.length = 0; keep(); }
let n = 0;
const t0 = performance.now();
for (let i = 0; i < STEPS; i++) { g.step(1 / 60); n += g.enemies.length; g.fx.length = 0; keep(); }
const ms = (performance.now() - t0) / STEPS;
const t5 = g.towers.filter((t) => t.tiers.includes(5)).length;
console.log(`wave ${g.wave}: ${ms.toFixed(2)} ms/step, ${Math.round(n / STEPS)} enemies, ${g.towers.length} wards (${t5} tier 5), ${g.projectiles.length} shots, ${g.zones.length} zones, ${g.orbs.length} orbs`);
