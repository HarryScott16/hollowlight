// Handcrafted 40-wave campaign. Each group: { type, count, gap (s between spawns), delay (s from
// wave start), veiled }. Enemy health never scales here: waves get harder through more enemies and
// new kinds of enemy, and each new kind appears on its own first (with a banner), then mixes in.
// Endless waves (41+) come from sim/endless.js.
//
//   1-5    the basics, one new layer per wave
//   6-15   Veiled, Herald, Dreadhulk, Gloomwing, Gravemaw (boss), Aegis, Nullback, Wisp, Mender
//          (up to wave 20 Veiled and flyers come in small groups and cost 1 life each if they get
//          through, RULES.earlyLeak; the big flocks and Veiled hosts start at 21)
//   16-30  themed waves that punish a defence with no answer to armour, flyers or stealth;
//          Veilmother (20), Gloomcolossus (23), Bastion (30)
//   31-40  everything at once, bigger every wave; The Hollow King (40)
import { ENEMIES, pops } from './enemies.js';

const g = (type, count, gap, delay = 0, opts = {}) => ({ type, count, gap, delay, ...opts });
const V = { veiled: true };

// ---- themed waves (21-29 and 31-39) ---------------------------------------------------------
// A steady climb (tuned as the Medium difficulty): each wave's pop budget grows 8.5% a wave from
// ~4.7k at wave 21 to ~9.7k at 30, then 4.5% a wave to ~14k at 39, and TOUGH/PACE below rise smoothly
// on top. A defence that keeps investing stays ahead; one that stops (tier 3s only, or three tier 4s
// and nothing more) runs out of headroom in the late 30s. Waves 33 and 37 add a flock spike. Each
// stretch has a recipe that mixes several threats, so a handful of strong wards in one spot can't cover it:
//   21-24 veiledArmour  Veiled shells and hulks behind shields, with Menders patching them
//                       (an Ember Censer shuts the healing and shield recharge down)
//   25-29 airAndHide    Gloomwing flocks (half Veiled) over Arcane-proof Nullbacks and Heralds
//                       (a Longeye or a Lighthouse Beacon covers sky and stealth at once)
//   31-34 shieldWall    Aegis lines and Menders around colossi, with Heralds pushing them on
//                       (a Prism's beam is made for colossi)
//   35-39 longNight     everything at once (Beacons multiply a crowded defence)
// None of them needs one particular ward: each threat has two or more answers.
// Recipe rows: [type, share of the budget in pops, share of that group that is Veiled].
export const BUDGET = (wave) => Math.round(4300 * 1.085 ** Math.min(10, wave - 20) * 1.045 ** Math.max(0, wave - 30));
const STRETCHES = {
  veiledArmour: {
    banner: 'Veiled armour: hidden shells behind shields and healers. Sight and fire help',
    mix: [['dreadhulk', 0.18, 0.5], ['husk', 0.14, 0.5], ['nullback', 0.14, 0.5], ['aegis', 0.13], ['mender', 0.11],
      ['brood', 0.07, 1], ['wisp', 0.06], ['gloomwing', 0.12], ['herald', 0.05]],
  },
  airAndHide: {
    banner: 'Air and hide: flocks overhead, half of them unseen, and Arcane-proof hides below',
    mix: [['gloomwing', 0.3, 0.5], ['nullback', 0.18], ['herald', 0.08], ['husk', 0.04], ['aegis', 0.08],
      ['dreadhulk', 0.12], ['colossus', 0.1], ['wisp', 0.05], ['mender', 0.04], ['skitter', 0.01]],
  },
  shieldWall: {
    banner: 'Shield wall: Aegis lines and Menders guard the colossi',
    mix: [['aegis', 0.2], ['mender', 0.1], ['herald', 0.08], ['colossus', 0.22], ['dreadhulk', 0.08], ['nullback', 0.1],
      ['gloomwing', 0.22, 0.3], ['wisp', 0.07], ['husk', 0.07]],
  },
  longNight: {
    banner: 'Everything at once',
    mix: [['colossus', 0.22], ['dreadhulk', 0.12], ['nullback', 0.12], ['husk', 0.07], ['aegis', 0.12], ['mender', 0.07],
      ['herald', 0.07], ['gloomwing', 0.25, 0.33], ['wisp', 0.08]],
  },
  // Hard only (waves 41-60, see HARD_WAVES below).
  ironTide: {
    banner: 'The iron tide: plated hosts behind shields, half of them unseen',
    mix: [['colossus', 0.24], ['dreadhulk', 0.14, 0.3], ['husk', 0.12, 0.5], ['nullback', 0.14, 0.5], ['aegis', 0.14], ['mender', 0.08],
      ['gloomwing', 0.1], ['herald', 0.04]],
  },
  darkSky: {
    banner: 'A dark sky: great flocks, most of them Veiled, over Arcane-proof hides',
    mix: [['gloomwing', 0.36, 0.6], ['wisp', 0.06], ['nullback', 0.14], ['herald', 0.08], ['aegis', 0.06],
      ['colossus', 0.18, 0.5], ['dreadhulk', 0.08], ['mender', 0.04]],
  },
  siege: {
    banner: 'The siege: colossi behind shield walls, healers and heralds driving them on',
    mix: [['colossus', 0.3], ['dreadhulk', 0.1], ['aegis', 0.18], ['mender', 0.1], ['herald', 0.1], ['nullback', 0.08],
      ['gloomwing', 0.14, 0.4]],
  },
  lastHours: {
    banner: 'The last hours: everything the night has left',
    mix: [['colossus', 0.24, 0.3], ['dreadhulk', 0.12, 0.3], ['nullback', 0.1], ['husk', 0.06], ['aegis', 0.12], ['mender', 0.07],
      ['herald', 0.07], ['gloomwing', 0.26, 0.5], ['wisp', 0.06]],
  },
};
const HULKS = new Set(['dreadhulk', 'colossus']);
const FIRST = { veiledArmour: 21, airAndHide: 25, shieldWall: 31, longNight: 35, ironTide: 41, darkSky: 45, siege: 51, lastHours: 55 };

function themed(wave, name, opts = {}) {
  const st = STRETCHES[name];
  const budget = BUDGET(wave);
  const dur = Math.min(60, 40 + (wave - 20) * 0.6);
  const start = opts.colossusIntro ? 8 : 0;
  // Small and mid-sized Gloom grow slowly (60% of wave 21's budget, +4% a wave) so the enemy
  // count stays where the browser holds its frame rate; hulks and colossi carry the rest.
  // (Past wave 40, on Hard, they stop growing: the extra budget all goes to the hulks, like endless.)
  const small = BUDGET(21) * 0.6 * (1 + 0.04 * (Math.min(wave, 40) - 21));
  let smallPops = 0, bigShare = 0;
  for (const [type, share] of st.mix) {
    if (HULKS.has(type)) bigShare += share;
    else smallPops += Math.max(1, Math.round((small * share) / pops(type))) * pops(type);
  }
  const bigBudget = Math.max(0, budget - smallPops);
  const rows = [];
  // Waves 21-24 ease the Veiled and the flyers in: the Veiled share of each group goes x0, 0.2,
  // 0.45, then 1, and the Gloomwing and Wisp counts x0.05, 0.2, 0.5, then 1. A defence with no sight
  // or anti-air starts to bleed here instead of falling all at once on wave 21.
  const k = name === 'veiledArmour' ? Math.min(3, wave - 21) : 3;
  const veilEase = [0, 0.2, 0.45, 1][k], countEase = [0.05, 0.2, 0.5, 1][k];
  for (const [type, share, veil = 0] of st.mix) {
    const v = (opts.veiledGiants && HULKS.has(type) ? 0.5 : veil) * veilEase;
    let n = HULKS.has(type) ? Math.max(1, Math.round((bigBudget * share) / bigShare / pops(type)))
      : Math.max(1, Math.round((small * share) / pops(type)));
    if (type === 'gloomwing' || type === 'wisp') n = Math.max(1, Math.round(n * countEase));
    const nv = Math.round(n * v);
    if (n - nv > 0) rows.push({ type, n: n - nv, veiled: false });
    if (nv > 0) rows.push({ type, n: nv, veiled: true });
  }
  // Biggest first; the rest start in a staggered spread so several streams overlap.
  rows.sort((a, b) => pops(b.type) - pops(a.type));
  const groups = rows.map((r, i) => {
    const delay = start + Math.round(((i * 2.7) % (dur * 0.4)) * 10) / 10;
    const gap = Math.max(0.05, Math.round(((dur - delay) / r.n) * 100) / 100);
    return g(r.type, r.n, gap, delay, r.veiled ? V : {});
  });
  if (opts.colossusIntro) groups.unshift(g('colossus', 1, 1));
  // A flock spike: a dense burst of Gloomwings (a third of them Veiled) over the usual mix. A defence
  // that's a little short lets a few through and loses some lives rather than the game.
  if (opts.flock) {
    const nv = Math.round(opts.flock / 3);
    groups.push(g('gloomwing', opts.flock - nv, Math.round((18 / (opts.flock - nv)) * 1000) / 1000, 10), g('gloomwing', nv, Math.round((18 / nv) * 1000) / 1000, 14, V));
  }
  const banner = opts.banner || (opts.flock && 'Black sky: a great flock') || (opts.veiledGiants && 'Veiled giants') || (opts.colossusIntro && 'A Gloomcolossus walks')
    || (FIRST[name] === wave ? st.banner : null);
  return banner ? { groups, banner } : { groups };
}

export const WAVES = [
  /* 1 */ { groups: [g('mote', 30, 0.5)] },
  /* 2 */ { groups: [g('mote', 20, 0.45), g('skitter', 25, 0.4, 6)] },
  /* 3 */ { groups: [g('shambler', 40, 0.35), g('skitter', 20, 0.3, 8)] },
  /* 4 */ { groups: [g('brood', 6, 1.0), g('shambler', 50, 0.25, 7), g('brood', 10, 0.7, 12)] },
  /* 5 */ { groups: [g('husk', 3, 1.5), g('brood', 25, 0.45, 6), g('skitter', 60, 0.12, 10), g('husk', 5, 1.2, 16)] },
  /* 6 */ { groups: [g('shambler', 3, 1.5, 0, V), g('shambler', 9, 0.6, 1), g('husk', 6, 1.2, 6), g('brood', 25, 0.45, 8), g('shambler', 40, 0.25, 12), g('skitter', 17, 0.3, 18), g('skitter', 3, 1.2, 19, V)],
    banner: 'Veiled Gloom: only some wards can see them' },
  /* 7 */ { groups: [g('herald', 3, 1.5), g('shambler', 40, 0.3, 6), g('herald', 3, 3, 8), g('brood', 32, 0.4, 10), g('skitter', 50, 0.18, 16), g('husk', 2, 2, 20)],
    banner: 'Heralds: Gloom near them run faster' },
  /* 8 */ { groups: [g('dreadhulk', 1, 1), g('husk', 5, 1.4, 10), g('brood', 28, 0.4, 12), g('shambler', 40, 0.25, 16), g('herald', 4, 2.5, 12), g('skitter', 17, 0.22, 22), g('skitter', 3, 1.2, 23, V)],
    banner: 'A Dreadhulk approaches' },
  /* 9 */ { groups: [g('gloomwing', 3, 1.5), g('husk', 8, 1.0, 7), g('brood', 32, 0.35, 9), g('shambler', 60, 0.18, 13), g('gloomwing', 3, 1.5, 16), g('brood', 2, 1, 17), g('shambler', 12, 0.45, 20), g('shambler', 3, 1.5, 21, V), g('herald', 3, 3, 14)],
    banner: 'Gloomwings: flyers that Mortars and Rime can\'t hit' },
  /* 10 */ { groups: [g('gravemaw', 1, 1), g('husk', 8, 1.2, 4), g('brood', 30, 0.4, 8), g('herald', 4, 3, 10), g('skitter', 80, 0.1, 16), g('gloomwing', 5, 1.4, 20), g('brood', 2, 1, 21)],
    banner: 'The Gravemaw rises' },
  /* 11 */ { groups: [g('aegis', 6, 1.2), g('husk', 12, 0.8, 8), g('brood', 43, 0.3, 10), g('aegis', 20, 0.6, 14), g('shambler', 100, 0.12, 16), g('gloomwing', 5, 1.5, 20), g('herald', 4, 3, 18), g('skitter', 26, 0.22, 24), g('skitter', 4, 1.2, 25, V)],
    banner: 'Aegis: shields that recharge. Storm Coils break them; fire stops the recharge' },
  /* 12 */ { groups: [g('dreadhulk', 2, 6), g('husk', 16, 0.7, 3), g('brood', 55, 0.25, 7), g('aegis', 20, 0.6, 10), g('gloomwing', 6, 1.4, 14), g('herald', 6, 2.5, 12), g('shambler', 35, 0.25, 18), g('shambler', 5, 1.2, 19, V), g('skitter', 60, 0.12, 22)] },
  /* 13 */ { groups: [g('nullback', 4, 1.5), g('nullback', 14, 0.9, 8), g('husk', 16, 0.8, 10), g('brood', 50, 0.25, 12), g('aegis', 20, 0.6, 16), g('herald', 6, 2.5, 14), g('shambler', 100, 0.12, 20)],
    banner: 'Nullbacks: Arcane barely scratches them' },
  /* 14 */ { groups: [g('wisp', 3, 1.5), g('dreadhulk', 2, 5, 8), g('husk', 20, 0.7, 10), g('brood', 65, 0.22, 12), g('wisp', 3, 1.5, 16), g('shambler', 50, 0.22, 17), g('gloomwing', 6, 1.4, 18), g('brood', 4, 1, 19), g('aegis', 20, 0.6, 20), g('herald', 8, 2, 16), g('skitter', 80, 0.12, 24)],
    banner: 'Wisps: always Veiled' },
  /* 15 */ { groups: [g('mender', 4, 1.5), g('shambler', 30, 0.2, 2), g('husk', 20, 0.8, 9), g('mender', 6, 2.5, 11), g('brood', 75, 0.22, 12), g('nullback', 12, 1, 15), g('aegis', 25, 0.5, 18), g('herald', 8, 2, 16), g('gloomwing', 6, 1.4, 20), g('brood', 4, 1, 21), g('wisp', 5, 1.2, 24), g('shambler', 35, 0.3, 25), g('dreadhulk', 2, 6, 14)],
    banner: 'Menders: they regrow and patch the Gloom around them. Fire stops them' },

  // ---- 16-30: themed waves ------------------------------------------------------------------
  /* 16 armour */ { groups: [g('dreadhulk', 3, 4), g('husk', 40, 0.4, 3), g('nullback', 20, 0.8, 8), g('brood', 60, 0.25, 10), g('mender', 6, 2.5, 12), g('herald', 8, 2, 14), g('aegis', 30, 0.5, 18)],
    banner: 'Iron and hide' },
  /* 17 flyers */ { groups: [g('gloomwing', 4, 1.5), g('husk', 44, 0.42, 4), g('brood', 80, 0.2, 8), g('gloomwing', 8, 1, 14), g('aegis', 20, 0.6, 12), g('herald', 10, 2, 10), g('skitter', 150, 0.08, 20), g('dreadhulk', 2, 6, 16)],
    banner: 'The sky darkens' },
  /* 18 stealth */ { groups: [g('wisp', 4, 1.2), g('brood', 38, 0.32, 4), g('brood', 2, 2, 5, V), g('husk', 25, 0.7, 8), g('dreadhulk', 3, 5, 10), g('shambler', 58, 0.2, 12), g('shambler', 2, 2, 13, V), g('wisp', 4, 1.2, 20), g('shambler', 110, 0.13, 21), g('aegis', 25, 0.5, 16), g('mender', 8, 2, 14), g('herald', 10, 2, 18), g('nullback', 20, 0.8, 22), g('brood', 50, 0.25, 26)],
    banner: 'Things you cannot see' },
  /* 19 */ { groups: [g('dreadhulk', 4, 4), g('husk', 38, 0.5, 3), g('nullback', 25, 0.7, 7), g('aegis', 30, 0.5, 10), g('gloomwing', 10, 1.2, 12), g('brood', 6, 1, 13), g('wisp', 5, 1.2, 16), g('shambler', 55, 0.28, 17), g('mender', 10, 2, 14), g('herald', 12, 1.8, 12), g('brood', 80, 0.2, 20), g('skitter', 100, 0.1, 26)] },
  /* 20 */ { groups: [g('veilmother', 1, 1, 0, { summonEvery: 20, summonCount: 2 }), g('dreadhulk', 4, 5, 6), g('husk', 40, 0.6, 8), g('brood', 34, 0.38, 12), g('brood', 4, 1.5, 13, V), g('aegis', 30, 0.5, 14), g('gloomwing', 8, 1.2, 18), g('brood', 5, 1, 19), g('herald', 10, 2.5, 16), g('mender', 8, 3, 20), g('shambler', 100, 0.15, 24), g('nullback', 20, 0.9, 28)],
    banner: 'The Veilmother: only wards that see Veiled can target her' },
  /* 21-24 */ themed(21, 'veiledArmour'), themed(22, 'veiledArmour'), themed(23, 'veiledArmour', { colossusIntro: true }), themed(24, 'veiledArmour'),
  /* 25-29 */ themed(25, 'airAndHide'), themed(26, 'airAndHide'), themed(27, 'airAndHide'), themed(28, 'airAndHide'), themed(29, 'airAndHide'),
  /* 30 */ { groups: [g('bastion', 1, 1), g('colossus', 2, 10, 6), g('dreadhulk', 10, 3, 8), g('husk', 60, 0.45, 10), g('nullback', 60, 0.5, 14), g('aegis', 60, 0.4, 16), g('herald', 25, 1.4, 12), g('mender', 20, 1.8, 18), g('gloomwing', 120, 0.2, 20)],
    banner: 'The Bastion: shielded and plated' },

  // ---- 31-40: the long night ----------------------------------------------------------------
  /* 31-34 */ themed(31, 'shieldWall'), themed(32, 'shieldWall'), themed(33, 'shieldWall', { flock: 240 }), themed(34, 'shieldWall'),
  /* 35-39 */ themed(35, 'longNight'), themed(36, 'longNight'), themed(37, 'longNight', { flock: 300 }),
  themed(38, 'longNight', { veiledGiants: true }), themed(39, 'longNight', { banner: 'The long night' }),
  /* 40 */ { groups: [g('hollowking', 1, 1), g('colossus', 8, 5.2, 6), g('dreadhulk', 18, 2, 8), g('husk', 90, 0.33, 10), g('nullback', 72, 0.4, 14), g('aegis', 72, 0.37, 16), g('herald', 30, 1.2, 14), g('mender', 24, 1.5, 18), g('gloomwing', 120, 0.2, 20), g('wisp', 90, 0.25, 26),
    g('herald', 12, 1, 44), g('gloomwing', 60, 0.25, 45), g('skitter', 150, 0.08, 46)],
    banner: 'The Hollow King comes for the Heartfire' },
];

// Three ramps on top of the counts above (`node tools/waves.js` prints the result):
// - CROWD: the hand-written waves 16-20 thicken a little (x1.015 to x1.075); gaps shrink to match.
//   The themed waves size themselves from BUDGET.
// - TOUGH: from wave 21, shells, hulks and the multi-layer Gloom gain 5% health per wave (x1.63 at wave 30,
//   x2.65 at 40); endless mode carries on from wave 40's value. Basic 10 HP layers never change and
//   bosses keep their own health, so towers still pop crowds in one hit; what late waves demand is
//   heavy damage on top of crowd control.
// - PACE: from wave 26 everything moves 1% faster per wave (+15% at wave 40).
export const CROWD = (wave) => (wave >= 16 && wave <= 20 ? 1 + 0.015 * (wave - 15) : 1);
export const TOUGH = (wave) => (wave <= 20 ? 1 : 1.05 ** (wave - 20));
export const PACE = (wave) => (wave <= 25 ? 1 : 1 + 0.01 * (wave - 25));
WAVES.forEach((w, i) => {
  const tough = TOUGH(i + 1), pace = PACE(i + 1);
  for (const grp of w.groups) {
    const m = CROWD(i + 1);
    if (tough > 1 && !ENEMIES[grp.type].boss) grp.hpMul = Math.round(tough * 1000) / 1000;
    if (pace > 1) grp.speedMul = pace;
    if (m === 1 || grp.count <= 1) continue;
    const n = Math.round(grp.count * m);
    grp.gap = Math.round((grp.gap * (grp.count - 1) / Math.max(1, n - 1)) * 1000) / 1000;
    grp.count = n;
  }
});

// ---- Hard: waves 41-60 -------------------------------------------------------------------------
// Hard's campaign is 60 waves (Easy and Medium end at 40). The climb carries on with the same
// themed-stretch recipe: the pop budget keeps its 4.5% a wave, the small Gloom stop growing (as in
// endless, for the frame rate), toughness grows 6.8% a wave (HARD_TOUGH: tuned with the bots, so a
// strong defence with its tier 5s is pushed to the edge by 56-60 and about one in four falls; at 7%
// none is touched, at 8% most fall) and pace only +0.5% a wave. Hard's difficulty multipliers
// still apply on top, and a map's own ramp holds at its wave-40 value (Game.startWave).
//   41-44 ironTide   plated hosts, half Veiled, behind Aegis lines and Menders
//   45-49 darkSky    great flocks (mostly Veiled) over Nullbacks; a black sky at 47
//   50    the Bastion and the Veilmother together
//   51-54 siege      colossi behind shield walls; Veiled giants at 53
//   55-59 lastHours  everything; a black sky at 57, Veiled giants at 58
//   60    The Last Dark
export const HARD_TOUGH = (wave) => TOUGH(40) * 1.068 ** Math.max(0, wave - 40);
// A boss wave: its stretch's full themed wave with the bosses at its head (and a last rush), so it
// is the peak of its stretch rather than a lull.
function bossWave(wave, stretch, bosses, banner, rush = []) {
  return { groups: [...bosses, ...themed(wave, stretch).groups, ...rush], banner };
}
export const HARD_PACE = (wave) => PACE(40) + 0.005 * Math.max(0, wave - 40);
export const HARD_WAVES = [
  /* 41-44 */ themed(41, 'ironTide'), themed(42, 'ironTide'), themed(43, 'ironTide'), themed(44, 'ironTide', { flock: 160 }),
  /* 45-49 */ themed(45, 'darkSky'), themed(46, 'darkSky'), themed(47, 'darkSky', { flock: 280 }), themed(48, 'darkSky'), themed(49, 'darkSky'),
  /* 50 */ bossWave(50, 'darkSky', [g('bastion', 1, 1, 0, { hpMul: 1.6 }), g('veilmother', 1, 1, 14, { hpMul: 2.2 })], 'The Bastion and the Veilmother march together'),
  /* 51-54 */ themed(51, 'siege'), themed(52, 'siege'), themed(53, 'siege', { veiledGiants: true }), themed(54, 'siege'),
  /* 55-59 */ themed(55, 'lastHours'), themed(56, 'lastHours'), themed(57, 'lastHours', { flock: 320 }),
  themed(58, 'lastHours', { veiledGiants: true }), themed(59, 'lastHours', { banner: 'The last hours before the dawn' }),
  /* 60 */ bossWave(60, 'lastHours', [g('lastdark', 1, 1)], 'The Last Dark comes to put out the Heartfire',
    [g('herald', 14, 1, 46), g('gloomwing', 80, 0.22, 47), g('skitter', 180, 0.07, 48)]),
];
HARD_WAVES.forEach((w, i) => {
  const tough = HARD_TOUGH(41 + i), pace = HARD_PACE(41 + i);
  for (const grp of w.groups) {
    if (!ENEMIES[grp.type].boss) grp.hpMul = Math.round(tough * 1000) / 1000;
    grp.speedMul = pace;
  }
});
// The campaign for a difficulty: 40 waves, or 60 on Hard (data/difficulty.js `campaign`).
export function campaignWaves(n) { return n > WAVES.length ? WAVES.concat(HARD_WAVES.slice(0, n - WAVES.length)) : WAVES; }
