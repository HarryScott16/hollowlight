// The Moth Lantern's support tier 5s (False Moon, Amber Trap) beside a partner that can't hit flyers
// (a Mortar, Rapid Loader tier 4 with Big Shells 2): a lure only helps wards that need flyers brought
// low, so beside the Bolt Ward partner (which hits flyers anyway) it measures nothing. The defence
// spends what it earns, as in the other support test. Appends `kind: 'support-m'` runs.
//   node tools/t5moth.js out=<file.jsonl> [map=hollowmere] [seeds=1]
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { runSolo } from './solo.js';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(k + '=')); return a ? a.slice(k.length + 1) : d; };
const OUT = arg('out'), MAP = arg('map', 'hollowmere'), SEEDS = Number(arg('seeds', 1));
const done = new Set(existsSync(OUT) ? readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).key) : []);
const partner = { type: 'mortar', path: 1, tier: 4, minor: 0 };
for (const cond of ['alone', 'reveal']) for (const [type, path] of [['none', -1], ['moth', 0], ['moth', 1]]) {
  for (const minor of path < 0 ? [0] : [0, 1, 2].filter((q) => q !== path)) for (const start of [1, 41]) for (let seed = 1; seed <= SEEDS; seed++) {
    const key = ['support-m', MAP, type, path, 5, cond, start, seed, minor, 0].join('|');
    if (done.has(key)) continue;
    const r = runSolo({ kind: 'support', map: MAP, type, path, tier: 5, cond, start, seed, minor, spot: 0, partner, spend: true });
    r.key = key; r.kind = 'support-m'; r.role = 'support';
    appendFileSync(OUT, JSON.stringify(r) + '\n');
    console.log(key, r.cleared);
  }
}
