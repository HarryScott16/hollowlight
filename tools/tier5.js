// Tier 5 check: for every ward and path, a lone ward at tier 4 and then at tier 5 faces the same
// late wave; prints the damage each dealt (and the ratio), and which tier 5 effects fired.
//   node tools/tier5.js [wave=35] [type ...]
import { Game } from '../public/js/sim/game.js';
import { TOWERS, TOWER_ORDER } from '../public/js/data/towers.js';

const waveArg = process.argv.find((a) => a.startsWith('wave='));
const WAVE = waveArg ? Number(waveArg.slice(5)) : 35;
const only = process.argv.slice(2).filter((a) => !a.includes('='));
const types = only.length ? only : TOWER_ORDER;

function spot(game, type) {
  const def = TOWERS[type], p = game.map.path;
  if (def.onPath) { const i = Math.round(p.count * 0.45); const s = game.snapToPath(p.xs[i], p.ys[i]); return [s.x, s.y]; }
  const r = def.base.range || 150;
  let best = null, bs = -1;
  for (let y = 30; y < game.map.height; y += 20) for (let x = 30; x < game.map.width; x += 20) {
    if (!game.canPlace(type, x, y)) continue;
    let n = 0;
    for (let i = 0; i < p.count; i += 3) if (Math.hypot(p.xs[i] - x, p.ys[i] - y) <= r) n++;
    if (n > bs) { bs = n; best = [x, y]; }
  }
  return best;
}

function run(type, pi, tier) {
  const game = new Game({ fx: true, seed: 1 });
  game.lives = 1e9; game.gold = 1e9;
  if (WAVE > 40) { game.wave = 40; game.rewarded = 40; game.over = 'win'; game.continueEndless(); }
  const [x, y] = spot(game, type);
  const t = game.place(type, x, y);
  for (let k = 0; k < tier; k++) game.upgrade(t, pi);
  for (let k = 0; k < 2; k++) game.upgrade(t, (pi + 1) % 3);
  game.wave = WAVE - 1; game.rewarded = WAVE - 1;
  game.startWave();
  const fx = {};
  let steps = 0;
  while (!game.clear && steps < 60 * 400) {
    for (const e of game.enemies) e.revealT = 1;   // measure power, not detection
    game.step(1 / 60); steps++;
    for (const f of game.fx) fx[f.type] = (fx[f.type] || 0) + 1;
    game.fx.length = 0;
  }
  return { dmg: t.dmg, kills: t.kills, fx, tiers: t.tiers.join(''), leaked: 1e9 - game.lives, gold: game.earned };
}

for (const type of types) {
  for (let pi = 0; pi < 3; pi++) {
    const a = run(type, pi, 4), b = run(type, pi, 5);
    const name = TOWERS[type].paths[pi].tiers[4].name;
    const fresh = Object.keys(b.fx).filter((k) => !a.fx[k]).map((k) => `${k} ${b.fx[k]}`).join(', ');
    console.log(`${type.padEnd(8)} ${name.padEnd(18)} T4 ${Math.round(a.dmg).toString().padStart(8)}  T5 ${Math.round(b.dmg).toString().padStart(8)}  x${(b.dmg / Math.max(1, a.dmg)).toFixed(2).padEnd(6)} leaked ${String(a.leaked).padStart(6)} -> ${String(b.leaked).padStart(6)}  new fx: ${fresh || '-'}`);
  }
}
