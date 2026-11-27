// Fit each tier 5's `power` (towers.js TIER5, multiplies everything it deals) to a target wave in the
// solo test (tools/solo.js at its tools/t5spots.json spot, seed 1, from wave 1). The reach grows
// roughly with the log of power (about +12 waves per x2.7), so each step is a secant on ln(power).
//
//   node tools/t5fit.js [bolt:2,prism:0] [out=fit.json] [tol=2] [max=5] [cap=150]
// Targets: TARGETS below ({cond, wave}); blind tier 5s are fitted with their blind spot removed.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { TOWERS } from '../public/js/data/towers.js';
import { runSolo } from './solo.js';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(k + '=')); return a ? a.slice(k.length + 1) : d; };
const SPOTS = JSON.parse(readFileSync(new URL('./t5spots.json', import.meta.url), 'utf8'));
export const TARGETS = {
  'longeye:1': ['alone', 98], 'bolt:2': ['alone', 95], 'bolt:1': ['alone', 92],
  'rime:1': ['full', 78], 'coil:2': ['alone', 76], 'wander:1': ['full', 80], 'prism:0': ['full', 78],
  'prism:1': ['full', 76], 'mortar:1': ['full', 76], 'wander:0': ['full', 74], 'coil:0': ['full', 72],
  'prism:2': ['full', 70], 'mortar:0': ['full', 70], 'bolt:0': ['full', 68], 'rime:2': ['full', 68],
  'mortar:2': ['full', 66], 'coil:1': ['full', 66], 'censer:0': ['alone', 66], 'rime:0': ['full', 64],
  'censer:1': ['full', 64], 'longeye:2': ['alone', 62], 'longeye:0': ['alone', 60], 'censer:2': ['alone', 60],
  'moth:2': ['alone', 60], 'snare:0': ['full', 62], 'snare:1': ['full', 60], 'snare:2': ['full', 58], 'wander:2': ['alone', 58],
  // round 2 (data/towers-new.js)
  'avatar:0': ['full', 75], 'avatar:1': ['full', 78], 'avatar:2': ['full', 62],
  'choir:0': ['alone', 75], 'choir:1': ['alone', 80], 'choir:2': ['alone', 70],
  'ferry:0': ['full', 66], 'ferry:1': ['full', 68], 'ferry:2': ['full', 62],
  'undertow:0': ['full', 70], 'undertow:1': ['full', 64], 'undertow:2': ['full', 64],
  'lamp:0': ['full', 66], 'lamp:1': ['full', 66], 'lamp:2': ['full', 60],
};
const OUT = arg('out', 'fit.json'), TOL = Number(arg('tol', 2)), MAX = Number(arg('max', 5)), PCAP = Number(arg('pcap', 150));
const keys = (process.argv.slice(2).find((a) => !a.includes('=')) || Object.keys(TARGETS).join(',')).split(',');
const res = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const SLOPE = 12;

for (const key of keys) {
  if (res[key] && res[key].done) continue;
  const [type, p] = key.split(':'), path = Number(p), [cond, T] = TARGETS[key];
  const t5 = TOWERS[type].paths[path].tiers[4];
  // No spot chosen yet (a new tier 5): try each candidate spot with both secondary paths, seed 1.
  if (!SPOTS[key] || !(SPOTS[key][cond] || SPOTS[key].alone)) {
    let best = null;
    for (const minor of [0, 1, 2].filter((q) => q !== path)) for (let spot = 0; spot < 4; spot++) {
      try {
        const r = runSolo({ type, path, tier: 5, cond, start: 1, seed: 1, spot, minor, cap: 150 });
        if (!best || r.cleared * 1e12 + r.dmg > best[0]) best = [r.cleared * 1e12 + r.dmg, spot, minor, r.cleared];
      } catch (err) { /* fewer spots than 4 */ }
    }
    SPOTS[key] = { name: t5.name, [cond]: [best[1], best[2], best[3], 0] };
    writeFileSync(new URL('./t5spots.json', import.meta.url), JSON.stringify(SPOTS));
  }
  const sp = SPOTS[key];
  const [spot = 0, minor] = sp[cond] || sp.alone || [];
  const run = (pw) => { t5.power = pw; const r = runSolo({ type, path, tier: 5, cond, start: 1, seed: 1, spot, minor, cap: 150 }); return r.cleared; };
  const hist = [];
  let pw = (res[key] && res[key].power) || 1, w = run(pw);
  hist.push([pw, w]);
  for (let i = 0; i < MAX && Math.abs(w - T) > TOL; i++) {
    let next;
    const prev = hist.length > 1 ? hist[hist.length - 2] : null;
    if (prev && prev[1] !== w && Math.abs(Math.log(prev[0] / pw)) > 0.01) {
      const slope = (w - prev[1]) / Math.log(pw / prev[0]);   // waves per ln(power)
      next = pw * Math.exp((T - w) / Math.max(4, Math.min(30, slope)));
    } else next = pw * Math.exp((T - w) / SLOPE);
    next = Math.min(PCAP, Math.max(0.5, next));
    if (Math.abs(next - pw) / pw < 0.02) break;
    pw = Math.round(next * 100) / 100; w = run(pw);
    hist.push([pw, w]);
    if (pw >= PCAP && w < T) break;
  }
  res[key] = { name: t5.name, cond, target: T, power: pw, wave: w, hist, done: true };
  writeFileSync(OUT, JSON.stringify(res, null, 1));
  console.log(`${key.padEnd(10)} ${t5.name.padEnd(17)} ${cond} target ${T}: power ${pw} -> wave ${w}   ${hist.map(([a, b]) => `${a}:${b}`).join(' ')}`);
}
