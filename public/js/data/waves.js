// Handcrafted 40-wave campaign. Each group: { type, count, gap (s between spawns), delay (s from
// wave start), veiled }. Enemy health never scales here: waves get harder through more enemies and
// new kinds of enemy, and each new kind appears on its own first (with a banner), then mixes in.
// Endless waves (41+) come from sim/endless.js.
//
//   1-5    the basics, one new layer per wave
//   6-15   Veiled, Herald, Dreadhulk, Gloomwing, Gravemaw (boss), Aegis, Nullback, Wisp, Mender
//   16-30  themed waves that punish a defence with no answer to armour, flyers or stealth;
//          Veilmother (20), Gloomcolossus (23), Bastion (30)
//   31-40  everything at once, bigger every wave; The Hollow King (40)
import { ENEMIES } from './enemies.js';

const g = (type, count, gap, delay = 0, opts = {}) => ({ type, count, gap, delay, ...opts });
const V = { veiled: true };

export const WAVES = [
  /* 1 */ { groups: [g('mote', 30, 0.5)] },
  /* 2 */ { groups: [g('mote', 20, 0.45), g('skitter', 25, 0.4, 6)] },
  /* 3 */ { groups: [g('shambler', 40, 0.35), g('skitter', 20, 0.3, 8)] },
  /* 4 */ { groups: [g('brood', 6, 1.0), g('shambler', 50, 0.25, 7), g('brood', 10, 0.7, 12)] },
  /* 5 */ { groups: [g('husk', 3, 1.5), g('brood', 25, 0.45, 6), g('skitter', 60, 0.12, 10), g('husk', 5, 1.2, 16)] },
  /* 6 */ { groups: [g('shambler', 12, 0.4, 0, V), g('husk', 6, 1.2, 6), g('brood', 25, 0.45, 8), g('shambler', 40, 0.25, 12), g('skitter', 20, 0.25, 18, V)],
    banner: 'Veiled Gloom: only some wards can see them' },
  /* 7 */ { groups: [g('herald', 3, 1.5), g('shambler', 40, 0.3, 6), g('herald', 3, 3, 8), g('brood', 32, 0.4, 10), g('skitter', 50, 0.18, 16), g('husk', 2, 2, 20)],
    banner: 'Heralds: Gloom near them run faster' },
  /* 8 */ { groups: [g('dreadhulk', 1, 1), g('husk', 5, 1.4, 10), g('brood', 28, 0.4, 12), g('shambler', 40, 0.25, 16), g('herald', 4, 2.5, 12), g('skitter', 20, 0.2, 22, V)],
    banner: 'A Dreadhulk approaches' },
  /* 9 */ { groups: [g('gloomwing', 4, 1.5), g('husk', 8, 1.0, 7), g('brood', 32, 0.35, 9), g('shambler', 60, 0.18, 13), g('gloomwing', 6, 1.2, 16), g('shambler', 15, 0.4, 20, V), g('herald', 3, 3, 14)],
    banner: 'Gloomwings: flyers that Mortars and Rime can\'t hit' },
  /* 10 */ { groups: [g('gravemaw', 1, 1), g('husk', 8, 1.2, 4), g('brood', 30, 0.4, 8), g('herald', 4, 3, 10), g('skitter', 80, 0.1, 16), g('gloomwing', 8, 1, 20)],
    banner: 'The Gravemaw rises' },
  /* 11 */ { groups: [g('aegis', 6, 1.2), g('husk', 12, 0.8, 8), g('brood', 40, 0.3, 10), g('aegis', 20, 0.6, 14), g('shambler', 100, 0.12, 16), g('gloomwing', 12, 0.8, 20), g('herald', 4, 3, 18), g('skitter', 30, 0.2, 24, V)],
    banner: 'Aegis: shields that recharge. Storm Coils break them' },
  /* 12 */ { groups: [g('dreadhulk', 2, 6), g('husk', 16, 0.7, 3), g('brood', 50, 0.25, 7), g('aegis', 20, 0.6, 10), g('gloomwing', 15, 0.7, 14), g('herald', 6, 2.5, 12), g('shambler', 40, 0.25, 18, V), g('skitter', 60, 0.12, 22)] },
  /* 13 */ { groups: [g('nullback', 4, 1.5), g('nullback', 14, 0.9, 8), g('husk', 16, 0.8, 10), g('brood', 50, 0.25, 12), g('aegis', 20, 0.6, 16), g('herald', 6, 2.5, 14), g('shambler', 100, 0.12, 20)],
    banner: 'Nullbacks: Arcane barely scratches them' },
  /* 14 */ { groups: [g('wisp', 15, 0.5), g('dreadhulk', 2, 5, 8), g('husk', 20, 0.7, 10), g('brood', 60, 0.22, 12), g('wisp', 40, 0.3, 16), g('gloomwing', 20, 0.6, 18), g('aegis', 20, 0.6, 20), g('herald', 8, 2, 16), g('skitter', 80, 0.12, 24)],
    banner: 'Wisps: always Veiled' },
  /* 15 */ { groups: [g('mender', 4, 1.5), g('shambler', 30, 0.2, 2), g('husk', 20, 0.8, 9), g('mender', 6, 2.5, 11), g('brood', 70, 0.22, 12), g('nullback', 12, 1, 15), g('aegis', 25, 0.5, 18), g('herald', 8, 2, 16), g('gloomwing', 20, 0.6, 20), g('wisp', 40, 0.3, 24), g('dreadhulk', 2, 6, 14)],
    banner: 'Menders: they regrow and patch the Gloom around them' },

  // ---- 16-30: themed waves ------------------------------------------------------------------
  /* 16 armour */ { groups: [g('dreadhulk', 3, 4), g('husk', 40, 0.4, 3), g('nullback', 20, 0.8, 8), g('brood', 60, 0.25, 10), g('mender', 6, 2.5, 12), g('herald', 8, 2, 14), g('aegis', 30, 0.5, 18)],
    banner: 'Iron and hide' },
  /* 17 flyers */ { groups: [g('gloomwing', 40, 0.25), g('husk', 30, 0.6, 4), g('brood', 80, 0.2, 8), g('gloomwing', 80, 0.2, 14), g('aegis', 20, 0.6, 12), g('herald', 10, 2, 10), g('skitter', 150, 0.08, 20), g('dreadhulk', 2, 6, 16)],
    banner: 'The sky darkens' },
  /* 18 stealth */ { groups: [g('wisp', 60, 0.2), g('brood', 40, 0.3, 4, V), g('husk', 25, 0.7, 8), g('dreadhulk', 3, 5, 10), g('shambler', 60, 0.2, 12, V), g('wisp', 60, 0.2, 20), g('aegis', 25, 0.5, 16), g('mender', 8, 2, 14), g('herald', 10, 2, 18), g('nullback', 20, 0.8, 22), g('brood', 50, 0.25, 26)],
    banner: 'Things you cannot see' },
  /* 19 */ { groups: [g('dreadhulk', 4, 4), g('husk', 30, 0.6, 3), g('nullback', 25, 0.7, 7), g('aegis', 30, 0.5, 10), g('gloomwing', 60, 0.3, 12), g('wisp', 60, 0.25, 16), g('mender', 10, 2, 14), g('herald', 12, 1.8, 12), g('brood', 80, 0.2, 20), g('skitter', 100, 0.1, 26)] },
  /* 20 */ { groups: [g('veilmother', 1, 1), g('dreadhulk', 4, 5, 6), g('husk', 40, 0.6, 8), g('brood', 30, 0.4, 12, V), g('aegis', 30, 0.5, 14), g('gloomwing', 40, 0.4, 18), g('herald', 10, 2.5, 16), g('mender', 8, 3, 20), g('shambler', 100, 0.15, 24), g('nullback', 20, 0.9, 28)],
    banner: 'The Veilmother: only wards that see Veiled can target her' },
  /* 21 */ { groups: [g('dreadhulk', 6, 4), g('husk', 50, 0.5, 3), g('nullback', 30, 0.7, 8), g('aegis', 40, 0.4, 12), g('gloomwing', 60, 0.3, 14), g('brood', 80, 0.2, 18), g('herald', 12, 2, 14), g('mender', 10, 2.5, 18), g('wisp', 60, 0.25, 24)] },
  /* 22 flyers */ { groups: [g('gloomwing', 80, 0.15), g('husk', 40, 0.6, 4), g('aegis', 30, 0.5, 8), g('dreadhulk', 6, 4, 10), g('gloomwing', 120, 0.15, 16), g('herald', 12, 2, 12), g('brood', 100, 0.18, 20), g('wisp', 60, 0.25, 24), g('mender', 12, 2, 22), g('nullback', 20, 0.8, 28), g('gloomwing', 50, 0.2, 32)],
    banner: 'A storm of wings' },
  /* 23 */ { groups: [g('colossus', 1, 1), g('dreadhulk', 6, 4, 8), g('husk', 50, 0.5, 10), g('nullback', 40, 0.6, 14), g('aegis', 40, 0.4, 16), g('gloomwing', 80, 0.25, 18), g('herald', 15, 1.8, 14), g('mender', 12, 2.2, 20), g('brood', 80, 0.2, 24, V)],
    banner: 'A Gloomcolossus walks' },
  /* 24 stealth */ { groups: [g('wisp', 120, 0.15), g('dreadhulk', 4, 4, 3, V), g('brood', 60, 0.25, 6, V), g('husk', 80, 0.35, 8), g('nullback', 40, 0.6, 12), g('aegis', 40, 0.4, 16), g('colossus', 1, 1, 18), g('gloomwing', 100, 0.25, 20), g('herald', 15, 1.8, 14), g('mender', 15, 2, 22)],
    banner: 'Veiled hulks' },
  /* 25 haste */ { groups: [g('herald', 25, 0.8), g('colossus', 2, 8, 2), g('dreadhulk', 8, 3, 4), g('husk', 60, 0.4, 6), g('nullback', 40, 0.6, 10), g('aegis', 50, 0.35, 12), g('mender', 15, 2, 16), g('gloomwing', 120, 0.2, 18), g('wisp', 100, 0.2, 22), g('skitter', 100, 0.1, 28)],
    banner: 'The Heralds sound the charge' },
  /* 26 armour */ { groups: [g('colossus', 3, 6), g('dreadhulk', 10, 2.5, 3), g('husk', 80, 0.35, 5), g('nullback', 60, 0.45, 9), g('mender', 15, 2, 12), g('herald', 20, 1.5, 12), g('aegis', 60, 0.35, 16), g('gloomwing', 60, 0.3, 20)],
    banner: 'The iron host' },
  /* 27 air + stealth */ { groups: [g('gloomwing', 100, 0.12), g('wisp', 100, 0.15, 4), g('colossus', 2, 8, 6), g('dreadhulk', 10, 2.5, 8, V), g('husk', 60, 0.4, 10), g('aegis', 60, 0.35, 14), g('herald', 20, 1.5, 12), g('mender', 20, 1.6, 16), g('nullback', 40, 0.6, 18), g('gloomwing', 100, 0.15, 24), g('wisp', 60, 0.2, 28)],
    banner: 'Wings and shadows' },
  /* 28 */ { groups: [g('colossus', 4, 6), g('dreadhulk', 12, 2.2, 3), g('husk', 80, 0.35, 5), g('nullback', 60, 0.45, 9), g('aegis', 80, 0.3, 12), g('herald', 30, 1.1, 10), g('mender', 20, 1.6, 14), g('gloomwing', 150, 0.15, 16), g('wisp', 100, 0.2, 22)] },
  /* 29 */ { groups: [g('colossus', 5, 5), g('dreadhulk', 14, 2, 3, V), g('husk', 80, 0.35, 5), g('nullback', 70, 0.4, 9), g('aegis', 80, 0.3, 12), g('herald', 30, 1.1, 10), g('mender', 25, 1.3, 14), g('gloomwing', 150, 0.15, 16), g('wisp', 120, 0.18, 22)] },
  /* 30 */ { groups: [g('bastion', 1, 1), g('colossus', 2, 10, 6), g('dreadhulk', 10, 3, 8), g('husk', 60, 0.45, 10), g('nullback', 60, 0.5, 14), g('aegis', 60, 0.4, 16), g('herald', 25, 1.4, 12), g('mender', 20, 1.8, 18), g('gloomwing', 120, 0.2, 20)],
    banner: 'The Bastion: shielded and plated' },

  // ---- 31-40: the long night ----------------------------------------------------------------
  /* 31 */ { groups: [g('colossus', 6, 5), g('dreadhulk', 16, 1.8, 3), g('husk', 100, 0.28, 5), g('nullback', 80, 0.35, 9), g('aegis', 100, 0.25, 12), g('herald', 30, 1.2, 10), g('mender', 25, 1.4, 14), g('gloomwing', 120, 0.18, 18), g('wisp', 100, 0.2, 22)] },
  /* 32 */ { groups: [g('gloomwing', 140, 0.1), g('colossus', 6, 5, 3), g('dreadhulk', 18, 1.6, 5), g('husk', 100, 0.28, 7), g('nullback', 80, 0.35, 11), g('aegis', 80, 0.3, 14), g('herald', 30, 1.2, 12), g('mender', 25, 1.4, 16), g('gloomwing', 120, 0.12, 22), g('wisp', 60, 0.25, 26)],
    banner: 'Black sky' },
  /* 33 */ { groups: [g('wisp', 200, 0.1), g('dreadhulk', 12, 2, 3, V), g('colossus', 4, 6, 5, V), g('brood', 120, 0.15, 7, V), g('husk', 140, 0.2, 9), g('nullback', 80, 0.35, 12), g('aegis', 100, 0.25, 15), g('mender', 30, 1.2, 16), g('herald', 40, 0.9, 13), g('gloomwing', 120, 0.18, 20), g('colossus', 2, 8, 22)],
    banner: 'Shadows' },
  /* 34 */ { groups: [g('herald', 60, 0.5), g('colossus', 8, 4, 2), g('dreadhulk', 20, 1.5, 4), g('husk', 120, 0.24, 6), g('nullback', 90, 0.3, 10), g('aegis', 100, 0.25, 13), g('mender', 30, 1.2, 16), g('gloomwing', 150, 0.15, 18), g('wisp', 120, 0.18, 22), g('skitter', 150, 0.08, 28)],
    banner: 'Heralds, everywhere' },
  /* 35 */ { groups: [g('aegis', 140, 0.15), g('mender', 50, 0.6, 2), g('colossus', 8, 4, 4), g('dreadhulk', 24, 1.3, 6), g('husk', 120, 0.24, 8), g('nullback', 100, 0.28, 12), g('herald', 40, 0.9, 10), g('gloomwing', 150, 0.15, 18), g('wisp', 120, 0.18, 22)],
    banner: 'The fortress' },
  /* 36 */ { groups: [g('colossus', 14, 2.8), g('dreadhulk', 24, 1.3, 4), g('husk', 100, 0.3, 6), g('nullback', 100, 0.28, 10), g('aegis', 100, 0.25, 13), g('herald', 40, 0.9, 10), g('mender', 40, 0.9, 15), g('gloomwing', 160, 0.14, 18)],
    banner: 'The colossi march' },
  /* 37 */ { groups: [g('colossus', 12, 3), g('dreadhulk', 30, 1.1, 3), g('husk', 140, 0.2, 5), g('nullback', 110, 0.26, 9), g('aegis', 120, 0.22, 12), g('herald', 50, 0.7, 10), g('mender', 40, 0.9, 14), g('gloomwing', 200, 0.12, 16), g('wisp', 150, 0.15, 22)] },
  /* 38 */ { groups: [g('colossus', 14, 2.8, 0, V), g('dreadhulk', 30, 1.1, 3, V), g('husk', 150, 0.2, 5), g('nullback', 120, 0.24, 9), g('aegis', 120, 0.22, 12), g('herald', 50, 0.7, 10), g('mender', 40, 0.9, 14), g('gloomwing', 240, 0.1, 16), g('wisp', 150, 0.15, 22)],
    banner: 'Veiled giants' },
  /* 39 */ { groups: [g('colossus', 18, 2.2), g('dreadhulk', 32, 1, 3), g('husk', 160, 0.18, 5), g('nullback', 130, 0.22, 9), g('aegis', 140, 0.2, 12), g('herald', 60, 0.6, 10), g('mender', 50, 0.7, 14), g('gloomwing', 240, 0.1, 16), g('wisp', 180, 0.13, 22)],
    banner: 'The long night' },
  /* 40 */ { groups: [g('hollowking', 1, 1), g('colossus', 8, 4.5, 6), g('dreadhulk', 24, 1.4, 8), g('husk', 150, 0.2, 10), g('nullback', 120, 0.24, 14), g('aegis', 120, 0.22, 16), g('herald', 50, 0.7, 14), g('mender', 40, 0.9, 18), g('gloomwing', 200, 0.12, 20), g('wisp', 150, 0.15, 26),
    g('herald', 12, 1, 44), g('gloomwing', 60, 0.25, 45), g('skitter', 150, 0.08, 46)],
    banner: 'The Hollow King comes for the Heartfire' },
];

// Three ramps on top of the counts above (`node tools/waves.js` prints the result):
// - CROWD: waves 16-30 thicken, from x1.015 at wave 16 to x1.225 at 30 and after. Gaps shrink to
//   match, so each wave keeps its length and gets denser. Single spawns (bosses, introductions)
//   stay single. It stops at 30 to keep the enemy count where the browser holds its frame rate.
// - TOUGH: from wave 21, shells, hulks and the multi-layer Gloom gain 7.5% health per wave (x2.06
//   at wave 30, x4.25 at 40), the same rule endless mode uses. Basic 10 HP layers never change and
//   bosses keep their own health, so towers still pop crowds in one hit; what late waves demand is
//   heavy damage (tier 4s) on top of crowd control.
// - PACE: from wave 26 everything moves 1% faster per wave (+15% at wave 40).
//   From wave 31 the small and mid-sized groups are cut to 90% instead (hulks and colossi stay):
//   by then toughness carries the difficulty, and a Husk alone becomes ~15 bodies as it sheds.
export const CROWD = (wave, type) => {
  if (wave < 16 || wave > 39) return 1;
  if (wave > 30 && type !== 'dreadhulk' && type !== 'colossus') return 0.9;
  return 1 + 0.015 * (Math.min(30, wave) - 15);
};
export const TOUGH = (wave) => (wave <= 20 ? 1 : 1.075 ** (wave - 20) * 1.04 ** Math.max(0, wave - 30));
export const PACE = (wave) => (wave <= 25 ? 1 : 1 + 0.01 * (wave - 25));
WAVES.forEach((w, i) => {
  const tough = TOUGH(i + 1), pace = PACE(i + 1);
  for (const grp of w.groups) {
    const m = CROWD(i + 1, grp.type);
    if (tough > 1 && !ENEMIES[grp.type].boss) grp.hpMul = Math.round(tough * 1000) / 1000;
    if (pace > 1) grp.speedMul = pace;
    if (m === 1 || grp.count <= 1) continue;
    const n = Math.round(grp.count * m);
    grp.gap = Math.round((grp.gap * (grp.count - 1) / Math.max(1, n - 1)) * 1000) / 1000;
    grp.count = n;
  }
});
