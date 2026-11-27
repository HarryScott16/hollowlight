// Quick tier 5 tuning runs: each tier 5 at its chosen spot and secondary path (tools/t5spots.json,
// picked by tools/t5study.js), seed 1, from wave 1 alone and with blind spots removed ("full"),
// plus its late DPS against its tier 4 (full condition, from wave 41). One line per tier 5.
//
//   node tools/t5tune.js [bolt:0,prism:1 | bolt,prism | all] [conds=alone,full] [ratio=1] [map=hollowmere] [seed=1]
import { readFileSync } from 'node:fs';
import { TOWERS, TOWER_ORDER } from '../public/js/data/towers.js';
import { runSolo } from './solo.js';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(k + '=')); return a ? a.slice(k.length + 1) : d; };
const SPOTS = JSON.parse(readFileSync(new URL('./t5spots.json', import.meta.url), 'utf8'));
const pos = process.argv.slice(2).find((a) => !a.includes('=')) || 'all';
const list = pos === 'all' ? TOWER_ORDER.flatMap((t) => [0, 1, 2].map((p) => [t, p]))
  : pos.split(',').flatMap((s) => (s.includes(':') ? [[s.split(':')[0], Number(s.split(':')[1])]] : [0, 1, 2].map((p) => [s, p])));
const conds = arg('conds', 'alone,full').split(','), ratio = arg('ratio', '1') === '1';
const map = arg('map', 'hollowmere'), seed = Number(arg('seed', 1));
const noAttack = (type) => TOWERS[type].kind === 'aura' || TOWERS[type].kind === 'vault';
// power=bolt:2=4,prism:0=3: try a tier 5's power without editing the data
for (const kv of (arg('power', '') || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='); const [t, p] = k.split(':'); TOWERS[t].paths[Number(p)].tiers[4].power = Number(v); }

for (const [type, path] of list) {
  if (!TOWERS[type] || noAttack(type)) continue;
  const def = TOWERS[type], sp = SPOTS[`${type}:${path}`] || {};
  const out = [`${type}:${path}`.padEnd(13), def.paths[path].tiers[4].name.padEnd(17), `$${def.paths[path].tiers[4].cost}`.padEnd(7), `p${def.paths[path].tiers[4].power || 1}`.padEnd(5)];
  const w0 = Date.now();
  for (const cond of conds) {
    const [spot = 0, minor] = sp[cond] || sp.alone || [];
    const r = runSolo({ type, path, tier: 5, cond, start: 1, seed, map, spot, minor, cap: 150 });
    out.push(`${cond} ${String(r.cleared).padStart(3)}${r.timedOut ? 'S' : ' '}`);
  }
  if (ratio) {
    const [spot = 0, minor] = sp.full || sp.alone || [];
    const a = runSolo({ type, path, tier: 5, cond: 'full', start: 41, seed, map, spot, minor, cap: 150 });
    const b = runSolo({ type, path, tier: 4, cond: 'full', start: 41, seed, map, spot, minor, cap: 150 });
    out.push(`E41 ${String(a.cleared - 40).padStart(3)}  late ${String(a.dpsLate).padStart(7)} vs T4 ${String(b.dpsLate).padStart(6)} = ${(a.dpsLate / Math.max(1, b.dpsLate)).toFixed(1)}x`);
  }
  out.push(`(${((Date.now() - w0) / 1000).toFixed(0)}s)`);
  console.log(out.join('  '));
}
