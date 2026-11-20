// Summarises a V8 .cpuprofile: the functions with the most self time (and total time).
//   node tools/cpuprof.mjs <file.cpuprofile> [top=25]
import { readFileSync } from 'node:fs';
const p = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const top = Number(process.argv[3]) || 25;
const byId = new Map(p.nodes.map((n) => [n.id, n]));
const self = new Map();
const dt = p.timeDeltas;
for (let i = 0; i < p.samples.length; i++) { const id = p.samples[i]; self.set(id, (self.get(id) || 0) + (dt[i] || 0)); }
const key = (n) => `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').slice(-2).join('/')}:${n.callFrame.lineNumber + 1}`;
const agg = new Map();
let total = 0;
for (const [id, t] of self) { const n = byId.get(id); const k = key(n); agg.set(k, (agg.get(k) || 0) + t); total += t; }
// total time per function: self time of every node under it (counted once per function per path)
const parent = new Map(); for (const n of p.nodes) for (const c of n.children || []) parent.set(c, n.id);
const tot = new Map();
for (const [id, t] of self) { const seen = new Set(); let cur = id; while (cur !== undefined) { const k = key(byId.get(cur)); if (!seen.has(k)) { seen.add(k); tot.set(k, (tot.get(k) || 0) + t); } cur = parent.get(cur); } }
console.log('self time:');
for (const [k, t] of [...agg].sort((a, b) => b[1] - a[1]).slice(0, top)) console.log(`  ${(100 * t / total).toFixed(1).padStart(5)}%  ${k}`);
console.log('total time:');
for (const [k, t] of [...tot].sort((a, b) => b[1] - a[1]).slice(0, top)) console.log(`  ${(100 * t / total).toFixed(1).padStart(5)}%  ${k}`);
