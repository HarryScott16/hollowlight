// Prints each campaign wave's pops (layers to break = lives if it all leaked), spawns, spawn
// duration, gold (pops x gold per pop + clear reward) and cumulative gold. Usage: node tools/waves.js
import { WAVES, TOUGH } from '../public/js/data/waves.js';
import { ENEMIES, pops } from '../public/js/data/enemies.js';
import { RULES } from '../public/js/data/rules.js';

let cum = RULES.startGold;
WAVES.forEach((w, i) => {
  const n = i + 1;
  let p = 0, spawns = 0, dur = 0;
  for (const g of w.groups) {
    p += pops(g.type) * g.count;
    spawns += g.count;
    dur = Math.max(dur, (g.delay || 0) + g.gap * (g.count - 1));
  }
  const gold = Math.round(p * RULES.popGold(n));
  cum += gold + RULES.waveReward(n);
  console.log(`wave ${String(n).padStart(2)}  pops ${String(p).padStart(6)}  spawns ${String(spawns).padStart(4)}  spawn time ${dur.toFixed(0).padStart(2)}s  toughness x${TOUGH(n).toFixed(2)}  gold/pop ${RULES.popGold(n).toFixed(2)}  gold ${String(gold).padStart(5)} + ${RULES.waveReward(n)}  cumulative ${cum}`);
});
console.log(Object.keys(ENEMIES).map((t) => `${t} ${pops(t)}`).join('  '));
