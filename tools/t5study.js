// Tier 5 study: every tier 5 tested alone (tools/solo.js) in three conditions, from wave 1 and from
// wave 41 in endless, over several seeds, next to its tier 4 on the same test. Results go to a
// JSON-lines file, one run per line; a rerun skips the runs already in it (so it can be stopped
// and resumed). tools/t5report.js turns the file into the tables in docs/tier5-report.md.
//
//   node tools/t5study.js out=<file.jsonl> [map=hollowmere] [seeds=3] [types=bolt,coil] [paths=bolt:1,coil:2]
//                         [conds=alone,reveal,full] [tiers=5,4] [support=1]
//
// For each tier 5 and condition, the placement and the secondary path (tier 2) are picked first:
// every candidate spot (solo.candidateSpots) with both other paths, seed 1, from both starts; the
// best (waves cleared from wave 1 plus waves cleared past 40 from wave 41, then damage) is kept and
// used for the other seeds and for its tier 4. Wards with no attack (Beacon, Ember Vault) can only
// be measured alone as "no defence"; support=1 also tests each of them beside a fixed partner
// (alone and with Veiled revealed, both secondary paths).
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { Game } from '../public/js/sim/game.js';
import { TOWERS, TOWER_ORDER } from '../public/js/data/towers.js';
import { computeStats } from '../public/js/sim/towers.js';
import { runSolo, candidateSpots, wardCost } from './solo.js';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(k + '=')); return a ? a.slice(k.length + 1) : d; };
const OUT = arg('out');
if (!OUT) { console.log('usage: node tools/t5study.js out=<file.jsonl> [map=] [seeds=3] [types=] [paths=type:pi,...] [conds=] [tiers=5,4] [support=1]'); process.exit(1); }
const MAP = arg('map', 'hollowmere'), SEEDS = Number(arg('seeds', 3));
const CONDS = arg('conds', 'alone,reveal,full').split(',');
const TIERS = arg('tiers', '5,4').split(',').map(Number);
const STARTS = [1, 41];
const types = arg('types') ? arg('types').split(',') : TOWER_ORDER;
const pathList = arg('paths') ? arg('paths').split(',').map((s) => { const [t, p] = s.split(':'); return [t, Number(p)]; })
  : types.flatMap((t) => [0, 1, 2].map((p) => [t, p]));

const done = new Map();
if (existsSync(OUT)) for (const line of readFileSync(OUT, 'utf8').split('\n')) if (line.trim()) { const r = JSON.parse(line); done.set(r.key, r); }
const keyOf = (o) => [o.kind || 'solo', o.map, o.type, o.path, o.tier, o.cond, o.start, o.seed, o.minor, o.spot].join('|');
let ran = 0;
const wall0 = Date.now();
function run(o) {
  const key = keyOf(o);
  if (done.has(key)) return done.get(key);
  const r = runSolo(o);
  r.key = key; r.kind = o.kind || 'solo'; r.role = o.role || '';
  appendFileSync(OUT, JSON.stringify(r) + '\n');
  done.set(key, r);
  ran++;
  if (ran % 10 === 0) console.log(`  ${ran} runs, ${((Date.now() - wall0) / 60000).toFixed(1)} min`);
  return r;
}
const score = (a, b) => a.cleared + Math.max(0, b.cleared - 40);
const noAttack = (type) => TOWERS[type].kind === 'aura' || TOWERS[type].kind === 'vault';

for (const [type, path] of pathList) {
  const def = TOWERS[type];
  for (const cond of CONDS) {
    // Pick placement and secondary path.
    const minors = noAttack(type) ? [(path + 1) % 3] : [0, 1, 2].filter((p) => p !== path);
    let best = null;
    for (const minor of minors) {
      const tiers = [0, 0, 0]; tiers[path] = 5; tiers[minor] = 2;
      const g = new Game({ fx: false, map: MAP });
      const air = cond === 'full' || computeStats(def, tiers).hitsAir;
      const spots = candidateSpots(g, type, tiers, air);
      for (let spot = 0; spot < spots.length; spot++) {
        const base = { map: MAP, type, path, tier: 5, cond, seed: 1, minor, spot, spots, role: 'select' };
        const a = run({ ...base, start: 1 }), b = run({ ...base, start: 41 });
        const s = score(a, b) * 1e12 + a.dmg + b.dmg;
        if (!best || s > best.s) best = { s, minor, spot, spots };
      }
    }
    console.log(`${type} ${def.paths[path].tiers[4].name} [${cond}]: minor ${best.minor}, spot ${best.spot} at ${best.spots[best.spot].join(',')}`);
    for (const tier of TIERS) for (const start of STARTS) for (let seed = 1; seed <= SEEDS; seed++) {
      run({ map: MAP, type, path, tier, cond, start, seed, minor: best.minor, spot: best.spot, spots: best.spots, role: 'final' });
    }
  }
}

// Support: the Beacon and Ember Vault have no attack, so beside a fixed partner (a Bolt Ward,
// Twin-shot tier 4 with Ballista 2, which can hit flyers but can't see Veiled), with and without them.
if (arg('support') === '1') {
  console.log('support runs');
  const partner = { type: 'bolt', path: 1, tier: 4, minor: 0 };
  for (const cond of ['alone', 'reveal']) {
    for (const [type, path] of [['none', -1], ['beacon', 0], ['beacon', 1], ['beacon', 2], ['vault', 0], ['vault', 1], ['vault', 2], ['moth', 0], ['moth', 1]]) {
      for (const minor of path < 0 ? [0] : [0, 1, 2].filter((p) => p !== path)) {
        for (const start of STARTS) for (let seed = 1; seed <= SEEDS; seed++) {
          run({ kind: 'support', map: MAP, type, path, tier: 5, cond, start, seed, minor, spot: 0, partner, spend: true, role: 'support' });
        }
      }
    }
  }
}
console.log(`done: ${ran} new runs in ${((Date.now() - wall0) / 60000).toFixed(1)} min`);
void wardCost;
