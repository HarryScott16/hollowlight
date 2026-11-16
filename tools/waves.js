// Prints each wave's total enemy health (splits included), spawn duration and kill gold.
// Usage: node tools/waves.js
import { WAVES, WAVE_HP } from '../public/js/data/waves.js';
import { ENEMIES } from '../public/js/data/enemies.js';
import { RULES } from '../public/js/data/rules.js';

const total = (type) => {
  const d = ENEMIES[type];
  let hp = d.hp, gold = d.gold;
  if (d.split) { const c = total(d.split.type); hp += c.hp * d.split.count; gold += c.gold * d.split.count; }
  return { hp, gold };
};
let cum = RULES.startGold;
WAVES.forEach((w, i) => {
  let hp = 0, gold = 0, dur = 0;
  for (const g of w.groups) {
    const t = total(g.type);
    const mul = (g.hp || 1) * (ENEMIES[g.type].boss ? 1 : WAVE_HP(i + 1));
    hp += t.hp * mul * g.count;
    gold += t.gold * g.count;
    dur = Math.max(dur, (g.delay || 0) + g.gap * (g.count - 1));
  }
  cum += gold + RULES.waveReward(i + 1);
  console.log(`wave ${String(i + 1).padStart(2)}  hp ${String(Math.round(hp)).padStart(6)}  spawn ${dur.toFixed(0).padStart(2)}s  kill gold ${String(gold).padStart(4)} + reward ${RULES.waveReward(i + 1)}  cumulative gold ${cum}  hp/cum ${(hp / cum).toFixed(1)}`);
});
