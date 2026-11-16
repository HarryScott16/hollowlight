// Prints upgrade cost vs power for every tower path. Usage: node tools/report.js
// Power = estimated DPS into a crowd (see estimateDps in sim/towers.js), with the minor path at 0.
import { TOWERS, TOWER_ORDER } from '../public/js/data/towers.js';
import { computeStats, estimateDps } from '../public/js/sim/towers.js';

for (const type of TOWER_ORDER) {
  const def = TOWERS[type];
  const b0 = computeStats(def, [0, 0, 0]);
  const base = estimateDps(def.kind, b0), single = estimateDps(def.kind, b0, false);
  console.log(`\n${def.name} (cost ${def.cost}, base DPS ${single.toFixed(0)} single / ${base.toFixed(0)} crowd)  -- each cell: cost, power vs base (single/crowd), crowd DPS per 100g invested`);
  def.paths.forEach((path, pi) => {
    const cells = [];
    let spent = def.cost;
    for (let t = 1; t <= 4; t++) {
      const tiers = [0, 0, 0];
      tiers[pi] = t;
      const st = computeStats(def, tiers);
      const p = estimateDps(def.kind, st), p1 = estimateDps(def.kind, st, false);
      spent += path.tiers[t - 1].cost;
      cells.push(`T${t} ${String(path.tiers[t - 1].cost).padStart(4)}g x${(p1 / single).toFixed(1)}/x${(p / base).toFixed(1).padEnd(4)} ${(p / spent * 100).toFixed(0).padStart(3)}`);
    }
    console.log(`  ${path.name.padEnd(14)} ${cells.join(' | ')}`);
  });
}
