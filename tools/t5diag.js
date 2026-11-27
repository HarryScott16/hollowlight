// One solo run with a given power, printing why it ended: lives per wave, causes, leaks by type.
//   node tools/t5diag.js <type> <path> <power> [cond=alone] [start=1]
import { readFileSync } from 'node:fs';
import { TOWERS } from '../public/js/data/towers.js';
import { runSolo } from './solo.js';

const [type, p, pw] = process.argv.slice(2);
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(k + '=')); return a ? a.slice(k.length + 1) : d; };
const SPOTS = JSON.parse(readFileSync(new URL('./t5spots.json', import.meta.url), 'utf8'));
const path = Number(p), cond = arg('cond', 'alone');
TOWERS[type].paths[path].tiers[4].power = Number(pw);
const [spot = 0, minor] = (SPOTS[`${type}:${path}`] || {})[cond] || (SPOTS[`${type}:${path}`] || {}).alone || [];
const r = runSolo({ type, path, tier: 5, cond, start: Number(arg('start', 1)), seed: 1, spot, minor, cap: 150 });
console.log(`${r.name} p${pw} ${cond}: wave ${r.cleared}${r.stalled ? ` STALLED ${r.stalled}` : ''}  dpsLate ${r.dpsLate}`);
console.log('  lives', r.livesAt.split(',').slice(-8).join(' '));
console.log('  causes', JSON.stringify(r.causes), ' last', JSON.stringify(r.lastCauses));
console.log('  leaks', JSON.stringify(r.leaks));
