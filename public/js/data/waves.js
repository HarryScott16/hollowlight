// Handcrafted campaign waves. Each group: { type, count, gap (s between spawns), delay (s from wave
// start), veiled }. Enemy health never scales here: waves get harder through more enemies and new
// kinds of enemy, and each new kind appears on its own first. Endless waves (11+) come from
// sim/endless.js.
const g = (type, count, gap, delay = 0, opts = {}) => ({ type, count, gap, delay, ...opts });
const V = { veiled: true };

export const WAVES = [
  /* 1 */ { groups: [g('mote', 30, 0.5)] },
  /* 2 */ { groups: [g('mote', 20, 0.45), g('skitter', 25, 0.4, 6)] },
  /* 3 */ { groups: [g('shambler', 40, 0.35), g('skitter', 20, 0.3, 8)] },
  /* 4 */ { groups: [g('brood', 6, 1.0), g('shambler', 50, 0.25, 7), g('brood', 10, 0.7, 12)] },
  /* 5 */ { groups: [g('husk', 3, 1.5), g('brood', 25, 0.45, 6), g('skitter', 60, 0.12, 10), g('husk', 5, 1.2, 16)] },
  /* 6 */ { groups: [g('shambler', 12, 0.4, 0, V), g('husk', 10, 1.0, 6), g('brood', 40, 0.3, 8), g('shambler', 60, 0.2, 12), g('skitter', 30, 0.2, 18, V)] },
  /* 7 */ { groups: [g('husk', 20, 0.7), g('brood', 50, 0.25, 4), g('skitter', 120, 0.08, 10), g('brood', 10, 0.6, 18, V)] },
  /* 8 */ { groups: [g('dreadhulk', 1, 1), g('husk', 30, 0.55, 8), g('brood', 60, 0.22, 10), g('shambler', 100, 0.12, 16)],
    banner: 'A Dreadhulk approaches' },
  /* 9 */ { groups: [g('dreadhulk', 4, 3.5), g('husk', 50, 0.38, 3), g('brood', 90, 0.16, 6), g('shambler', 90, 0.14, 12, V), g('skitter', 120, 0.07, 20)] },
  /* 10 */ { groups: [g('gravemaw', 1, 1), g('husk', 40, 0.5, 4), g('dreadhulk', 4, 4, 8), g('brood', 80, 0.2, 12), g('skitter', 160, 0.07, 22), g('skitter', 50, 0.15, 26, V)],
    banner: 'The Gravemaw rises' },
];
