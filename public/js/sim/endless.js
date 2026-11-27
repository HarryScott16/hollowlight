// Endless mode: generated waves after the campaign's last wave (40). No DOM access.
//
// Endless picks up where the campaign leaves off and grows gradually (`node tools/endless.js`
// prints the curve). Each wave has a health budget: the total health on the field grows 5.5% a
// wave over waves 41-60, the stretch where a strong defence buys its tier 5s, then 7% to wave 80,
// 8% to wave 100 and 18% after that (tier 5s are strong enough to carry a defence far past 100
// otherwise), whatever the mix. It grows through more enemies more than through tougher
// ones: toughness rises only 2% a wave, and basic layers stay at 10 HP forever (they always die in
// one hit). Speed rises slowly and
// is capped, so no modifier turns a wave into a wall.
//
// Late waves get harder through variety and numbers:
// - **Stretches.** Every 5 waves the mix changes (a horde, a sky, iron, a swarm, a siege), each
//   announced with a banner, so the defence has to cover everything.
// - **Modifiers.** One switches on every 5 waves from 45 and stays on. They alternate between ones
//   that change the waves (Veiled hulks, shadows, escorts, a Veiled sky, swarms) and ones that make
//   them harder (mending, swift, armoured shells, twin bosses, frenzy).
// - **Bosses.** The four bosses take turns every 10th wave (two at once from wave 80).
// - **Numbers.** The spawn cap rises from 450 to 600. Above it, every group is thinned evenly and
//   its tough members get the health it lost, so the mix stays varied (no wave turns into nothing
//   but colossi).
// Gold per pop keeps tapering (RULES.popGold) so tier 5 prices stay meaningful.
import { pops, ENEMIES } from '../data/enemies.js';
import { mulberry32 } from './path.js';
import { TOUGH, PACE, HARD_TOUGH } from '../data/waves.js';

// Growth per wave of the total health on the field, in each band of endless waves.
const BANDS = [[60, 1.055], [80, 1.07], [100, 1.08], [Infinity, 1.18]];   // (2026-11-27: steeper after 100, as tier 5s got stronger)
function growth(n) {
  let m = 1, w = 40;
  for (const [end, r] of BANDS) { const k = Math.min(n, end) - w; if (k <= 0) break; m *= r ** k; w = end; }
  return m;
}
export const ENDLESS = {
  first: 41,
  health: (n) => Math.round(330000 * growth(n)),                 // waves 39-40 have ~0.29M
  toughMul: (n) => TOUGH(40) * 1.02 ** Math.max(0, n - 40),     // carries on from wave 40
  speedMul: (n) => PACE(40) + Math.min(0.35, Math.max(0, n - 40) * 0.008),   // x1.15 at 40 to x1.5 at ~84
  maxSpeed: 1.7,                                                 // with Swift and Frenzy on top
  bosses: ['gravemaw', 'veilmother', 'bastion', 'hollowking'],
  bossHp: (n) => 40000 * 1.05 ** (n - 40),                       // every endless boss, whichever it is
  maxSpawns: (n) => Math.min(600, 450 + Math.max(0, n - 40) * 3),
};

// Endless after a longer campaign (Hard's 60 waves) carries on from that campaign's toughness, not
// wave 40's: every endless wave's Gloom are this much tougher (1 after a 40-wave campaign).
export function endlessToughAfter(campaignLength) {
  return campaignLength > 40 ? HARD_TOUGH(campaignLength) / ENDLESS.toughMul(campaignLength) : 1;
}

// Modifiers switch on at these waves and stay on. Each is announced once with a banner.
export const MODIFIERS = [
  { at: 45, id: 'veiledHulks', name: 'Veiled hulks', desc: 'Dreadhulks and colossi arrive Veiled.' },
  { at: 50, id: 'mending', name: 'Mending', desc: 'Layers left alone for 3s grow back (up to a Shambler).' },
  { at: 55, id: 'swift', name: 'Swift', desc: 'Every enemy moves 10% faster.' },
  { at: 60, id: 'armoured', name: 'Armoured shells', desc: 'Husk and Nullback shells have 50% more health.' },
  { at: 65, id: 'shadows', name: 'Shadows', desc: 'A third of the small Gloom arrive Veiled.' },
  { at: 70, id: 'escorts', name: 'Escorts', desc: 'Heralds, Menders and Aegis march with every wave.' },
  { at: 75, id: 'veiledSky', name: 'Veiled sky', desc: 'Half of every flock arrives Veiled.' },
  { at: 80, id: 'twinBosses', name: 'Twin bosses', desc: 'Bosses come two at a time.' },
  { at: 85, id: 'frenzy', name: 'Frenzy', desc: 'Every enemy moves another 10% faster.' },
  { at: 90, id: 'swarms', name: 'Swarms', desc: 'A swarm of Broods and Skitters follows every wave.' },
];

// Health of one enemy and everything inside it (shields included) at a toughness multiplier.
const hpMemo = new Map();
export function hpOf(type, mul) {
  const k = `${type}|${mul}`;
  let h = hpMemo.get(k);
  if (h !== undefined) return h;
  const d = ENEMIES[type], t = d.tough ? mul : 1;
  h = (d.hp + (d.shield || 0)) * t;
  for (const sh of d.shed || []) h += hpOf(sh.type, mul) * sh.count;
  for (const p of d.phases || []) h += hpOf(p.type, mul) * p.count;
  if (hpMemo.size > 5000) hpMemo.clear();
  hpMemo.set(k, h);
  return h;
}

// The mix changes every 5 waves. Shares of the health budget.
const STRETCHES = [
  { id: 'horde', name: 'The horde', shares: { skitter: 0.03, wisp: 0.04, gloomwing: 0.06, brood: 0.07, herald: 0.03, aegis: 0.06, mender: 0.03, husk: 0.13, nullback: 0.1, dreadhulk: 0.15, colossus: 0.3 } },
  { id: 'sky', name: 'A black sky', shares: { gloomwing: 0.32, wisp: 0.08, herald: 0.05, aegis: 0.05, nullback: 0.1, husk: 0.06, dreadhulk: 0.12, colossus: 0.22 } },
  { id: 'iron', name: 'Iron and hide', shares: { husk: 0.2, nullback: 0.2, aegis: 0.08, mender: 0.05, dreadhulk: 0.2, colossus: 0.25, gloomwing: 0.02 } },
  { id: 'swarm', name: 'The swarm', shares: { skitter: 0.12, brood: 0.2, wisp: 0.12, herald: 0.08, gloomwing: 0.12, aegis: 0.06, mender: 0.05, husk: 0.08, dreadhulk: 0.07, colossus: 0.1 } },
  { id: 'siege', name: 'The siege', shares: { aegis: 0.14, mender: 0.08, herald: 0.06, nullback: 0.08, dreadhulk: 0.16, colossus: 0.38, gloomwing: 0.1 } },
];
export function stretchAt(n) { return STRETCHES[Math.floor((n - 41) / 5) % STRETCHES.length]; }

const TYPES = ['skitter', 'wisp', 'gloomwing', 'brood', 'herald', 'aegis', 'mender', 'husk', 'nullback', 'dreadhulk', 'colossus'];
const BIG = new Set(['dreadhulk', 'colossus']);
const SHELLS = new Set(['husk', 'nullback']);
const SMALL = new Set(['skitter', 'brood', 'wisp', 'herald', 'aegis', 'mender', 'husk', 'nullback']);

export function endlessWave(n, seed) {
  const rand = mulberry32((seed * 7919 + n * 104729) >>> 0);
  const on = new Set(MODIFIERS.filter((m) => n >= m.at).map((m) => m.id));
  const fresh = MODIFIERS.find((m) => m.at === n);
  const st = stretchAt(n), newStretch = (n - 41) % 5 === 0;
  let budget = ENDLESS.health(n);
  const groups = [];
  const tough = ENDLESS.toughMul(n);
  let speed = ENDLESS.speedMul(n) * (on.has('swift') ? 1.1 : 1) * (on.has('frenzy') ? 1.1 : 1);
  speed = Math.round(Math.min(ENDLESS.maxSpeed, speed) * 1000) / 1000;

  const boss = n % 10 === 0 ? ENDLESS.bosses[(n / 10) % ENDLESS.bosses.length] : null;
  const boss2 = boss && on.has('twinBosses') ? ENDLESS.bosses[(n / 10 + 1) % ENDLESS.bosses.length] : null;
  if (boss) budget = Math.max(0, budget - ENDLESS.bossHp(n) * (boss2 ? 2 : 1));

  // Counts per type from the stretch's jittered shares of the health budget (escorts add their own
  // share on top).
  const shares = { ...st.shares };
  if (on.has('escorts')) { shares.herald = (shares.herald || 0) + 0.04; shares.mender = (shares.mender || 0) + 0.04; shares.aegis = (shares.aegis || 0) + 0.05; }
  const count = {}, hpBoost = {};
  for (const t of TYPES) { count[t] = Math.floor((budget * (shares[t] || 0) * (0.8 + rand() * 0.4)) / hpOf(t, tough)); hpBoost[t] = 1; }
  // Over the spawn cap: the small one-hit Gloom take at most half the field, the tough ones the
  // rest; every group is thinned evenly within its half and the tough ones carry the health that
  // was thinned away (so the total stays on budget and the mix stays varied).
  const cap = ENDLESS.maxSpawns(n);
  let nt = 0, tt = 0, ntHp = 0, ttHp = 0;
  for (const t of TYPES) { if (ENEMIES[t].tough) { tt += count[t]; ttHp += count[t] * hpOf(t, tough); } else { nt += count[t]; ntHp += count[t] * hpOf(t, tough); } }
  if (nt + tt > cap && tt > 0) {
    const ntCap = Math.min(nt, Math.round(cap * 0.5)), fN = nt ? ntCap / nt : 1;
    const fT = Math.min(1, (cap - ntCap) / tt);
    const carry = (ttHp + ntHp * (1 - fN)) / ttHp;   // tough health after taking the small ones' share
    for (const t of TYPES) {
      if (!count[t]) continue;
      const c = Math.max(1, Math.round(count[t] * (ENEMIES[t].tough ? fT : fN)));
      if (ENEMIES[t].tough) hpBoost[t] = (count[t] / c) * carry;
      count[t] = c;
    }
  }

  const dur = Math.min(55, 40 + (n - 40) * 0.5);
  for (const b of [boss, boss2]) {
    if (b) groups.push({ type: b, count: 1, gap: 1, delay: b === boss2 ? 12 : 0, hpMul: ENDLESS.bossHp(n) / ENEMIES[b].hp, kidHpMul: tough, speedMul: speed });
  }
  for (const t of TYPES) {
    const c = count[t];
    if (c <= 0) continue;
    const delay = Math.round(rand() * dur * 0.35 * 10) / 10;
    const gap = Math.max(0.05, Math.round(((dur - delay) / c) * 100) / 100);
    let hpMul = tough * hpBoost[t];
    if (SHELLS.has(t) && on.has('armoured')) hpMul *= 1.5;
    const g = { type: t, count: c, gap, delay, hpMul: Math.round(hpMul * 1000) / 1000, speedMul: speed };
    if (BIG.has(t) && on.has('veiledHulks')) g.veiled = true;
    if (!BIG.has(t) && t !== 'gloomwing' && on.has('mending')) g.mending = true;
    if (SMALL.has(t) && !SHELLS.has(t) && on.has('shadows') && rand() < 0.34) g.veiled = true;
    if (t === 'gloomwing' && on.has('veiledSky')) {
      const v = Math.floor(c / 2);
      if (v > 0) { groups.push({ ...g, count: v, veiled: true, delay: g.delay + 3 }); g.count = c - v; }
    }
    groups.push(g);
  }
  // Swarms: a dense burst of small Gloom at the end of the wave.
  if (on.has('swarms')) {
    const sw = Math.min(160, 60 + (n - 90) * 4);
    groups.push({ type: 'brood', count: Math.round(sw * 0.4), gap: 0.08, delay: dur * 0.7, hpMul: 1, speedMul: speed });
    groups.push({ type: 'skitter', count: Math.round(sw * 0.6), gap: 0.06, delay: dur * 0.75, hpMul: 1, speedMul: speed });
  }
  // Big enemies first so the screen fills behind them.
  groups.sort((a, b) => pops(b.type) - pops(a.type));
  const banner = [newStretch && st.name, fresh && `${fresh.name}: ${fresh.desc}`, boss && `${ENEMIES[boss].name}${boss2 ? ` and ${ENEMIES[boss2].name} return` : ' returns'}`].filter(Boolean).join('  ·  ') || null;
  return { groups, banner, endless: true, mods: [...on], stretch: st.id };
}
