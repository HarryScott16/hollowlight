// Handcrafted waves. Each group: { type, count, gap (s between spawns), delay (s from wave start), hp (multiplier) }.
const g = (type, count, gap, delay = 0, hp = 1) => ({ type, count, gap, delay, hp });

// Global health curve on top of each group's own multiplier (wave is 1-based). Main difficulty knob.
export const WAVE_HP = (wave) => 1 + 0.19 * (wave - 1) ** 1.5;

export const WAVES = [
  /* 1 */ { groups: [g('shambler', 16, 0.6)] },
  /* 2 */ { groups: [g('shambler', 22, 0.45), g('skitter', 10, 0.35, 6)] },
  /* 3 */ { groups: [g('shambler', 20, 0.4, 0, 1.2), g('skitter', 24, 0.22, 4)] },
  /* 4 */ { groups: [g('husk', 8, 1.2), g('shambler', 26, 0.35, 2, 1.4)] },
  /* 5 */ { groups: [g('skitter', 50, 0.15, 0, 1.4), g('husk', 10, 0.9, 3, 1.1)] },
  /* 6 */ { groups: [g('brood', 9, 1.1), g('shambler', 34, 0.28, 1, 1.5)] },
  /* 7 */ { groups: [g('husk', 18, 0.65, 0, 1.4), g('skitter', 50, 0.13, 4, 1.8)] },
  /* 8 */ { groups: [g('brood', 12, 0.9, 0, 1.3), g('husk', 16, 0.7, 5, 1.4)] },
  /* 9 */ { groups: [g('shambler', 60, 0.17, 0, 1.8), g('skitter', 60, 0.12, 3, 1.8), g('husk', 18, 0.7, 2, 1.7)] },
  /* 10 */ { groups: [g('gravemaw', 1, 1), g('husk', 16, 0.9, 3, 1.6), g('skitter', 50, 0.18, 7, 1.8), g('brood', 9, 1.2, 12, 1.5)] },
];
