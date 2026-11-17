// Endless mode: generated waves after the campaign's last wave. No DOM access.
//
// Each wave gets a pop budget that grows 13% per wave and is filled from the roster, favouring
// bigger enemies as it grows. Basic layers stay at 10 HP forever (they always die in one hit);
// only shells, hulks and bosses get tougher. Modifiers stack every 5 waves, a Gravemaw returns
// every 10th wave, and gold per pop drops so tier 4 prices stay meaningful.
import { pops } from '../data/enemies.js';
import { mulberry32 } from './path.js';

export const ENDLESS = {
  budget: (n) => Math.round(2400 * 1.13 ** (n - 10)),
  toughMul: (n) => (n <= 15 ? 1 : 1.08 ** (n - 15)),
  speedMul: (n) => 1 + Math.min(0.6, Math.max(0, n - 20) * 0.015),
  goldMul: (n) => (n <= 20 ? 1 : n <= 30 ? 0.5 : n <= 40 ? 0.25 : 0.1),
  bossMul: (n) => 1.6 ** (n / 10 - 1),   // Gravemaw health on waves 20, 30, ...
  maxSpawns: 200,
};

// Modifiers switch on at these waves and stay on. Each is announced once with a banner.
export const MODIFIERS = [
  { at: 15, id: 'veiledHulks', name: 'Veiled hulks', desc: 'Dreadhulks and colossi arrive Veiled.' },
  { at: 20, id: 'mending', name: 'Mending', desc: 'Layers left alone for 3s grow back (up to a Shambler).' },
  { at: 25, id: 'swift', name: 'Swift', desc: 'Every enemy moves 25% faster.' },
  { at: 30, id: 'armoured', name: 'Armoured shells', desc: 'Husk shells have double health.' },
  { at: 35, id: 'shadows', name: 'Shadows', desc: 'A third of the small Gloom arrive Veiled.' },
  { at: 40, id: 'frenzy', name: 'Frenzy', desc: 'Every enemy moves 50% faster.' },
];

const TIERS = ['skitter', 'shambler', 'brood', 'husk', 'dreadhulk', 'colossus'];

// Share of the budget for each type, before jitter.
function shares(n) {
  if (n < 15) return { skitter: 0.07, shambler: 0.08, brood: 0.2, husk: 0.3, dreadhulk: 0.35, colossus: 0 };
  return { skitter: 0.06, shambler: 0.08, brood: 0.15, husk: 0.24, dreadhulk: 0.2, colossus: 0.27 };
}

export function endlessWave(n, seed) {
  const rand = mulberry32((seed * 7919 + n * 104729) >>> 0);
  const on = new Set(MODIFIERS.filter((m) => n >= m.at).map((m) => m.id));
  const fresh = MODIFIERS.find((m) => m.at === n);
  let budget = ENDLESS.budget(n);
  const groups = [];
  const tough = ENDLESS.toughMul(n);
  let speed = ENDLESS.speedMul(n) * (on.has('frenzy') ? 1.5 : on.has('swift') ? 1.25 : 1);
  speed = Math.round(speed * 1000) / 1000;

  const boss = n % 10 === 0;
  if (boss) budget = Math.max(0, budget - pops('gravemaw'));

  // Counts per type from jittered shares, then promote small enemies into bigger ones until the
  // spawn count fits under the cap (keeps the frame rate up in very late waves).
  const share = shares(n);
  const count = {};
  for (const t of TIERS) count[t] = Math.floor((budget * share[t] * (0.8 + rand() * 0.4)) / pops(t));
  const total = () => TIERS.reduce((a, t) => a + count[t], 0);
  for (let guard = 0; total() > ENDLESS.maxSpawns && guard < 200; guard++) {
    const i = TIERS.findIndex((t, k) => count[t] > 0 && k < TIERS.length - 1);
    if (i < 0) break;
    const t = TIERS[i], up = TIERS[i + 1];
    const move = Math.ceil(count[t] / 2);
    count[t] -= move;
    count[up] += Math.max(1, Math.floor((move * pops(t)) / pops(up)));
  }

  const dur = Math.min(40, 18 + n * 0.6);
  if (boss) groups.push({ type: 'gravemaw', count: 1, gap: 1, delay: 0, hpMul: ENDLESS.bossMul(n), speedMul: speed });
  for (const t of TIERS) {
    const c = count[t];
    if (c <= 0) continue;
    const big = t === 'dreadhulk' || t === 'colossus';
    const delay = Math.round(rand() * dur * 0.35 * 10) / 10;
    const gap = Math.max(0.05, Math.round(((dur - delay) / c) * 100) / 100);
    let hpMul = tough;
    if (t === 'husk' && on.has('armoured')) hpMul *= 2;
    const g = { type: t, count: c, gap, delay, hpMul, speedMul: speed };
    if (big && on.has('veiledHulks')) g.veiled = true;
    if (!big && on.has('mending')) g.mending = true;
    if (!big && t !== 'husk' && on.has('shadows') && rand() < 0.34) g.veiled = true;
    groups.push(g);
  }
  // Big enemies first so the screen fills behind them.
  groups.sort((a, b) => pops(b.type) - pops(a.type));
  const banner = [fresh && `${fresh.name}: ${fresh.desc}`, boss && 'The Gravemaw returns'].filter(Boolean).join('  ·  ') || null;
  return { groups, banner, endless: true, mods: [...on] };
}
