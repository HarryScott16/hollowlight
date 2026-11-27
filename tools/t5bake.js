// Writes the fitted tier 5 powers (tools/t5fit.js) and the prices that follow them into the data:
// each tier 5 entry gets `power: N` and a desc that starts "Capstone power xN (all its damage).", and its cost is
// set so the whole ward (base, tiers 1-4, minor 2 tiers) costs about 1.0x its old total for a tier 5
// that reaches wave 60 alone, rising to 1.6x for one that reaches 100 (decided 2026-11-27: prices
// follow strength, average ~25-30k, the strongest ~40-45k).
//
//   node tools/t5bake.js <powers.json>      powers.json: { "bolt:2": { "power": 47, "wave": 94 }, ... }
import { readFileSync, writeFileSync } from 'node:fs';
import { TOWERS } from '../public/js/data/towers.js';

const P = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const files = ['public/js/data/towers.js', 'public/js/data/towers-new.js'].map((f) => new URL('../' + f, import.meta.url));
const text = files.map((f) => readFileSync(f, 'utf8'));
const round = (n) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10);
for (const [key, v] of Object.entries(P)) {
  const [type, pi] = key.split(':'), def = TOWERS[type], t5 = def.paths[Number(pi)].tiers[4];
  const below = def.cost + def.paths[Number(pi)].tiers.slice(0, 4).reduce((a, t) => a + t.cost, 0) + 300;   // (+ a minor path at tier 2, roughly)
  const oldTotal = below + t5.cost;
  const f = 1 + 0.6 * Math.max(0, Math.min(1, (v.wave - 60) / 40));
  const cost = Math.round((oldTotal * f - below) / 500) * 500;
  const pw = round(v.power);
  // find this tier 5's line: `{ name: '<name>', ... cost: N, desc: '...'`
  const nameLit = `name: ${JSON.stringify(t5.name).replace(/^"|"$/g, "'")}`;
  const nameAlt = `name: "${t5.name}"`;
  let done = false;
  for (let i = 0; i < text.length && !done; i++) {
    const lines = text[i].split('\n');
    for (let j = 0; j < lines.length; j++) {
      const L = lines[j];
      if (!(L.includes(`{ ${nameLit},`) || L.includes(`{ ${nameAlt},`)) || !/cost: \d+, desc: /.test(L)) continue;
      let M = L.replace(/cost: \d+, desc: (['"])(Capstone power x[0-9.]+ \(all its damage\)\. )?/, (m, q) => `cost: ${cost}, desc: ${q}Capstone power x${pw} (all its damage). `);
      M = M.replace(/, power: [0-9.]+ \}/, ' }');
      M = M.replace(/ \},\s*$/, `, power: ${pw} },`);
      lines[j] = M;
      text[i] = lines.join('\n');
      done = true;
      console.log(`${key.padEnd(11)} ${t5.name.padEnd(17)} power x${String(pw).padEnd(6)} wave ${v.wave}  cost ${t5.cost} -> ${cost}  (ward total ${oldTotal} -> ${below + cost})`);
      break;
    }
  }
  if (!done) console.log(`!! ${key}: line not found`);
}
files.forEach((f, i) => writeFileSync(f, text[i]));
