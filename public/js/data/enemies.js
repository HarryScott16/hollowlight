// Enemy stats. All balance numbers live here.
//   hp, speed (px/s), gold (on kill), lives (lost if it reaches the Heartfire), r (radius)
//   mult:    damage multipliers by damage type (missing = 1)
//   split:   { type, count } spawned on death
//   slowRes: fraction of slows ignored; boss: immune to freeze, stun and executes
export const ENEMIES = {
  shambler: {
    name: 'Shambler', hp: 30, speed: 55, gold: 6, lives: 1, r: 11,
    tags: [], desc: 'Basic Gloom walker. No strengths, no weaknesses.',
  },
  skitter: {
    name: 'Skitter', hp: 15, speed: 118, gold: 4, lives: 1, r: 8,
    tags: ['Fast'], desc: 'Fast and fragile. Arrives in swarms; slows and chain attacks handle them.',
  },
  husk: {
    name: 'Husk', hp: 120, speed: 38, gold: 14, lives: 2, r: 14,
    mult: { kinetic: 0.4, blast: 1.25 },
    tags: ['Plated'], desc: 'Heavy plating shrugs off most Kinetic damage. Weak to Blast.',
  },
  brood: {
    name: 'Brood', hp: 95, speed: 45, gold: 8, lives: 3, r: 15,
    split: { type: 'broodling', count: 3 },
    tags: ['Splits'], desc: 'Bursts into 3 Broodlings, which each burst into 2 Mites.',
  },
  broodling: {
    name: 'Broodling', hp: 30, speed: 72, gold: 3, lives: 1, r: 9,
    split: { type: 'mite', count: 2 },
    tags: ['Splits'], desc: 'Bursts into 2 Mites.',
  },
  mite: {
    name: 'Mite', hp: 9, speed: 108, gold: 1, lives: 1, r: 5,
    tags: ['Fast'], desc: 'Tiny and quick.',
  },
  gravemaw: {
    name: 'Gravemaw', hp: 2900, speed: 24, gold: 300, lives: 60, r: 30,
    boss: true, slowRes: 0.5,
    tags: ['Boss'], desc: 'A mountain of health. Immune to freeze and stun, and slows are half as effective.',
  },
};
