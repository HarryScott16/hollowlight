// Endless mode: generated waves after the campaign's last wave (40). No DOM access.
//
// Each wave gets a pop budget that grows 9% per wave and is filled from the whole roster, favouring
// bigger enemies. Basic layers stay at 10 HP forever (they always die in one hit); only shells,
// hulks and bosses get tougher. Modifiers stack every 5 waves, the four bosses take turns every
// 10th wave, and gold per pop keeps tapering (RULES.popGold) so tier 4 prices stay meaningful.
import { pops, ENEMIES } from '../data/enemies.js';
import { mulberry32 } from './path.js';
import { TOUGH, PACE } from '../data/waves.js';

export const ENDLESS = {
  first: 41,
  budget: (n) => Math.round(26000 * 1.09 ** (n - 40)),
  toughMul: (n) => TOUGH(40) * 1.06 ** Math.max(0, n - 40),   // carries on from wave 40
  speedMul: (n) => PACE(40) + Math.min(0.6, Math.max(0, n - 40) * 0.015),   // carries on from wave 40
  bosses: ['gravemaw', 'veilmother', 'bastion', 'hollowking'],
  bossHp: (n) => 70000 * 1.6 ** ((n - 40) / 10),   // every endless boss, whichever it is
  maxSpawns: 450,
};

// Modifiers switch on at these waves and stay on. Each is announced once with a banner.
export const MODIFIERS = [
  { at: 45, id: 'veiledHulks', name: 'Veiled hulks', desc: 'Dreadhulks and colossi arrive Veiled.' },
  { at: 50, id: 'mending', name: 'Mending', desc: 'Layers left alone for 3s grow back (up to a Shambler).' },
  { at: 55, id: 'swift', name: 'Swift', desc: 'Every enemy moves 25% faster.' },
  { at: 60, id: 'armoured', name: 'Armoured shells', desc: 'Husk and Nullback shells have double health.' },
  { at: 65, id: 'shadows', name: 'Shadows', desc: 'A third of the small Gloom arrive Veiled.' },
  { at: 70, id: 'frenzy', name: 'Frenzy', desc: 'Every enemy moves 50% faster.' },
];

// Smallest to biggest: spawn-cap promotion moves a share of one type into the next.
const TIERS = ['skitter', 'wisp', 'gloomwing', 'brood', 'herald', 'aegis', 'mender', 'husk', 'nullback', 'dreadhulk', 'colossus'];
const SHARES = {
  skitter: 0.03, wisp: 0.04, gloomwing: 0.06, brood: 0.07, herald: 0.03, aegis: 0.06, mender: 0.03,
  husk: 0.13, nullback: 0.1, dreadhulk: 0.15, colossus: 0.3,
};
const BIG = new Set(['dreadhulk', 'colossus']);
const SHELLS = new Set(['husk', 'nullback']);

export function endlessWave(n, seed) {
  const rand = mulberry32((seed * 7919 + n * 104729) >>> 0);
  const on = new Set(MODIFIERS.filter((m) => n >= m.at).map((m) => m.id));
  const fresh = MODIFIERS.find((m) => m.at === n);
  let budget = ENDLESS.budget(n);
  const groups = [];
  const tough = ENDLESS.toughMul(n);
  let speed = ENDLESS.speedMul(n) * (on.has('frenzy') ? 1.5 : on.has('swift') ? 1.25 : 1);
  speed = Math.round(speed * 1000) / 1000;

  const boss = n % 10 === 0 ? ENDLESS.bosses[(n / 10) % ENDLESS.bosses.length] : null;
  if (boss) budget = Math.max(0, budget - pops(boss));

  // Counts per type from jittered shares, then promote small enemies into bigger ones until the
  // spawn count fits under the cap (keeps the frame rate up in very late waves).
  const count = {};
  for (const t of TIERS) count[t] = Math.floor((budget * SHARES[t] * (0.8 + rand() * 0.4)) / pops(t));
  const total = () => TIERS.reduce((a, t) => a + count[t], 0);
  for (let guard = 0; total() > ENDLESS.maxSpawns && guard < 300; guard++) {
    const i = TIERS.findIndex((t, k) => count[t] > 0 && k < TIERS.length - 1);
    if (i < 0) break;
    const t = TIERS[i], up = TIERS[i + 1];
    const move = Math.ceil(count[t] / 2);
    count[t] -= move;
    count[up] += Math.max(1, Math.floor((move * pops(t)) / pops(up)));
  }

  const dur = Math.min(55, 40 + (n - 40) * 0.5);
  if (boss) groups.push({ type: boss, count: 1, gap: 1, delay: 0, hpMul: ENDLESS.bossHp(n) / ENEMIES[boss].hp, kidHpMul: tough, speedMul: speed });
  for (const t of TIERS) {
    const c = count[t];
    if (c <= 0) continue;
    const delay = Math.round(rand() * dur * 0.35 * 10) / 10;
    const gap = Math.max(0.05, Math.round(((dur - delay) / c) * 100) / 100);
    let hpMul = tough;
    if (SHELLS.has(t) && on.has('armoured')) hpMul *= 2;
    const g = { type: t, count: c, gap, delay, hpMul, speedMul: speed };
    if (BIG.has(t) && on.has('veiledHulks')) g.veiled = true;
    if (!BIG.has(t) && on.has('mending')) g.mending = true;
    if (!BIG.has(t) && !SHELLS.has(t) && on.has('shadows') && rand() < 0.34) g.veiled = true;
    groups.push(g);
  }
  // Big enemies first so the screen fills behind them.
  groups.sort((a, b) => pops(b.type) - pops(a.type));
  const banner = [fresh && `${fresh.name}: ${fresh.desc}`, boss && `${ENEMIES[boss].name} returns`].filter(Boolean).join('  ·  ') || null;
  return { groups, banner, endless: true, mods: [...on] };
}
