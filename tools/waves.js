// Prints each campaign wave's pops (layers to break = kill gold = lives if it all leaked),
// spawn duration, and cumulative gold. Usage: node tools/waves.js
import { WAVES } from '../public/js/data/waves.js';
import { ENEMIES, pops } from '../public/js/data/enemies.js';
import { RULES } from '../public/js/data/rules.js';

let cum = RULES.startGold;
WAVES.forEach((w, i) => {
  let n = 0, hp = 0, spawns = 0, dur = 0;
  for (const g of w.groups) {
    n += pops(g.type) * g.count;
    hp += pops(g.type) * 10 * g.count;
    spawns += g.count;
    dur = Math.max(dur, (g.delay || 0) + g.gap * (g.count - 1));
  }
  cum += n + RULES.waveReward(i + 1);
  console.log(`wave ${String(i + 1).padStart(2)}  pops ${String(n).padStart(5)}  spawns ${String(spawns).padStart(4)}  spawn time ${dur.toFixed(0).padStart(2)}s  gold ${n} + ${RULES.waveReward(i + 1)}  cumulative ${cum}`);
});
console.log(Object.keys(ENEMIES).map((t) => `${t} ${pops(t)}`).join('  '));
