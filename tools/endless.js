// Endless curve: for the last campaign waves and the endless waves, the total health on the field
// (every layer, toughness and shields included; bosses at their own health), the spawn count, the
// speed and the growth from one wave to the next, plus the modifiers and stretch.
//   node tools/endless.js [from=36] [to=120] [seed=1]
import { WAVES } from '../public/js/data/waves.js';
import { ENEMIES } from '../public/js/data/enemies.js';
import { endlessWave, hpOf } from '../public/js/sim/endless.js';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`${k}=`)); return a ? Number(a.slice(k.length + 1)) : d; };
const FROM = arg('from', 36), TO = arg('to', 120), SEED = arg('seed', 1);
function waveHp(w) {
  let hp = 0, n = 0, speed = 1;
  for (const g of w.groups) {
    const boss = ENEMIES[g.type].boss;
    hp += g.count * (boss ? ENEMIES[g.type].hp * (g.hpMul || 1) + 0 : hpOf(g.type, g.hpMul || 1));
    if (boss) for (const p of ENEMIES[g.type].phases || []) hp += hpOf(p.type, g.kidHpMul || 1) * p.count;
    n += g.count;
    speed = Math.max(speed, g.speedMul || 1);
  }
  return { hp, n, speed };
}
let prev = null;
for (let n = FROM; n <= TO; n++) {
  const w = n <= WAVES.length ? WAVES[n - 1] : endlessWave(n, SEED);
  const { hp, n: count, speed } = waveHp(w);
  const g = prev ? `${((hp / prev - 1) * 100).toFixed(0).padStart(4)}%` : '     ';
  const mods = w.mods ? w.mods.join(',') : '';
  console.log(`wave ${String(n).padStart(3)}  health ${(hp / 1e6).toFixed(2).padStart(7)}M ${g}  spawns ${String(count).padStart(4)}  speed x${speed.toFixed(2)}  ${w.stretch || ''}${mods ? `  [${mods}]` : ''}${w.banner ? `  "${w.banner}"` : ''}`);
  prev = hp;
}
