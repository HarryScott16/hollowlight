// Handcrafted waves. Each group: { type, count, gap (s between spawns), delay (s from wave start), hp (multiplier) }.
const g = (type, count, gap, delay = 0, hp = 1) => ({ type, count, gap, delay, hp });

export const WAVES = [
  /* 1 */ { groups: [g('shambler', 12, 0.9)] },
  /* 2 */ { groups: [g('shambler', 18, 0.6), g('skitter', 5, 0.5, 9)] },
  /* 3 */ { groups: [g('shambler', 14, 0.7), g('skitter', 14, 0.35, 5)] },
  /* 4 */ { groups: [g('husk', 6, 1.8), g('shambler', 18, 0.5, 3, 1.2)] },
  /* 5 */ { groups: [g('skitter', 34, 0.24, 0, 1.2), g('husk', 8, 1.4, 4)] },
  /* 6 */ { groups: [g('brood', 8, 1.8), g('shambler', 22, 0.42, 2, 1.5)] },
  /* 7 */ { groups: [g('husk', 14, 1.0, 0, 1.2), g('skitter', 34, 0.2, 6, 1.4)] },
  /* 8 */ { groups: [g('brood', 14, 1.1, 0, 1.2), g('husk', 12, 1.1, 7, 1.4)] },
  /* 9 */ { groups: [g('shambler', 40, 0.28, 0, 2.2), g('skitter', 40, 0.18, 5, 1.7), g('husk', 12, 1.2, 3, 1.7)] },
  /* 10 */ { groups: [g('gravemaw', 1, 1), g('husk', 12, 1.5, 4, 1.6), g('skitter', 36, 0.28, 10, 1.7), g('brood', 8, 1.8, 16, 1.5)] },
];
