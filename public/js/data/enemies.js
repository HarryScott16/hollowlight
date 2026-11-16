// Enemy stats. All balance numbers live here.
//   hp, speed (px/s), gold (on kill), lives (lost if it reaches the Heartfire), r (radius)
//   Leaks cost lives in proportion to the health the enemy has left (minimum 1).
//   mult:    damage multipliers by damage type (missing = 1)
//   split:   { type, count } spawned on death
//   slowRes: fraction of slows ignored; boss: immune to freeze, stun, knockback and executes
export const ENEMIES = {
  shambler: {
    name: 'Shambler', hp: 34, speed: 78, gold: 9, lives: 1, r: 11,
    tags: [], desc: 'Basic Gloom walker. No strengths, no weaknesses.',
  },
  skitter: {
    name: 'Skitter', hp: 16, speed: 150, gold: 6, lives: 1, r: 8,
    tags: ['Fast'], desc: 'Fast and fragile. Arrives in swarms; slows and chain attacks handle them.',
  },
  husk: {
    name: 'Husk', hp: 150, speed: 54, gold: 22, lives: 2, r: 14,
    mult: { kinetic: 0.4, blast: 1.3 },
    tags: ['Plated'], desc: 'Heavy plating shrugs off most Kinetic damage. Weak to Blast.',
  },
  brood: {
    name: 'Brood', hp: 105, speed: 62, gold: 12, lives: 3, r: 15,
    split: { type: 'broodling', count: 3 },
    tags: ['Splits'], desc: 'Bursts into 3 Broodlings, which each burst into 2 Mites.',
  },
  broodling: {
    name: 'Broodling', hp: 34, speed: 95, gold: 4, lives: 1, r: 9,
    split: { type: 'mite', count: 2 },
    tags: ['Splits'], desc: 'Bursts into 2 Mites.',
  },
  mite: {
    name: 'Mite', hp: 10, speed: 135, gold: 2, lives: 1, r: 5,
    tags: ['Fast'], desc: 'Tiny and quick.',
  },
  gravemaw: {
    name: 'Gravemaw', hp: 15000, speed: 34, gold: 450, lives: 25, r: 30,
    boss: true, slowRes: 0.5,
    tags: ['Boss'], desc: 'A mountain of health. Immune to freeze, stun and knockback; slows are half as effective. If it gets through it costs up to 25 lives, fewer the more you have hurt it.',
  },
};
