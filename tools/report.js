// Prints upgrade cost vs power for every tower path. Usage: node tools/report.js
// Power = estimated layers popped per second into a dense crowd (see estimateDps in sim/towers.js),
// with the minor path at 0. "eff" = crowd power per gold relative to the base ward (1.0); the
// redesign target is for it to rise with tier (T3 ~1.2-1.5, T4 ~1.6-2.2); a tier 5 is ~3-5x its tier 4
// for ~4.5x the gold, so its eff is about level with tier 4 (T5 column: x vs T4).
import { TOWERS, TOWER_ORDER } from '../public/js/data/towers.js';
import { computeStats, estimateDps } from '../public/js/sim/towers.js';

for (const type of TOWER_ORDER) {
  const def = TOWERS[type];
  const b0 = computeStats(def, [0, 0, 0]);
  const base = estimateDps(def.kind, b0), single = estimateDps(def.kind, b0, false);
  const baseEff = base / def.cost;
  console.log(`\n${def.name} (cost ${def.cost}, base ${(base / 10).toFixed(1)} layers/s crowd, ${single.toFixed(0)} dmg/s single)  -- cost | power vs base (single/crowd) | layers/s | eff`);
  def.paths.forEach((path, pi) => {
    const cells = [];
    let spent = def.cost, prev = 1;
    for (let t = 1; t <= path.tiers.length; t++) {
      const tiers = [0, 0, 0];
      tiers[pi] = t;
      const st = computeStats(def, tiers);
      const p = estimateDps(def.kind, st), p1 = estimateDps(def.kind, st, false);
      spent += path.tiers[t - 1].cost;
      if (t === 5) { cells.push(`T5 ${String(path.tiers[4].cost).padStart(5)} x${(p / prev).toFixed(1)} vs T4 ${(p / 10).toFixed(0).padStart(5)}/s ${(p / spent / baseEff).toFixed(2)}`); continue; }
      cells.push(`T${t} ${String(path.tiers[t - 1].cost).padStart(4)} x${(p1 / single).toFixed(1)}/x${(p / base).toFixed(1).padEnd(4)} ${(p / 10).toFixed(0).padStart(4)}/s ${(p / spent / baseEff).toFixed(2)}`);
      prev = p;
    }
    console.log(`  ${path.name.padEnd(14)} ${cells.join(' | ')}`);
  });
}
