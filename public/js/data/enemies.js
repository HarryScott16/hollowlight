// Enemy stats. All balance numbers live here.
//
// Most Gloom are stacks of thin 10 HP layers. Breaking a layer sheds the enemy into its inner
// form (`shed`), pays `gold`, and any overkill damage carries into the inner form. So one hit
// from a basic ward strips one layer, and bigger hits strip several.
//
//   hp       health of this layer/shell (layers are 10; shells, hulks and bosses more)
//   speed    px/s;  r: radius;  gold: paid when this layer/shell breaks (1 per 10 HP of base health)
//   shed     [{ type, count }] spawned when it breaks
//   phases   bosses only: [{ at (hp fraction), type, count }] burst out as health crosses `at`
//   mult     damage multipliers by damage type (missing = 1)
//   tough    health scales in endless mode (layers never do: basic Gloom always die in one hit)
//   heavy    immune to stun, freeze, knockback and execute; slows are `slowRes` less effective
//   boss     gets the big health bar
// "Pops" (total layers to clear it, = gold it pays, = lives it costs if it leaks untouched) is
// derived from these by `pops()` below.
export const ENEMIES = {
  mote: {
    name: 'Mote', hp: 10, speed: 80, gold: 1, r: 7,
    tags: [], desc: 'The last flicker of a Gloom. One hit and it is gone.',
  },
  skitter: {
    name: 'Skitter', hp: 10, speed: 135, gold: 1, r: 8,
    shed: [{ type: 'mote', count: 1 }],
    tags: ['Fast'], desc: 'Quick and thin. Sheds into a Mote.',
  },
  shambler: {
    name: 'Shambler', hp: 10, speed: 70, gold: 1, r: 11,
    shed: [{ type: 'skitter', count: 1 }],
    tags: [], desc: 'Slow on the outside, quick on the inside: sheds into a Skitter.',
  },
  brood: {
    name: 'Brood', hp: 10, speed: 90, gold: 1, r: 14,
    shed: [{ type: 'shambler', count: 2 }],
    tags: ['Splits'], desc: 'A sack of Gloom. Bursts into 2 Shamblers.',
  },
  husk: {
    name: 'Husk', hp: 60, speed: 55, gold: 6, r: 15, tough: true,
    mult: { kinetic: 0.5, blast: 1.5 },
    shed: [{ type: 'brood', count: 2 }],
    tags: ['Plated'], desc: 'A plated shell: Kinetic does half damage, Blast does 50% more. Cracks open into 2 Broods.',
  },
  dreadhulk: {
    name: 'Dreadhulk', hp: 400, speed: 42, gold: 40, r: 24, tough: true, heavy: true, slowRes: 0.5,
    shed: [{ type: 'husk', count: 4 }],
    tags: ['Heavy'], desc: 'A lumbering hulk. Cannot be stunned, frozen or knocked back. Breaks into 4 Husks.',
  },
  colossus: {
    name: 'Gloomcolossus', hp: 2000, speed: 36, gold: 200, r: 28, tough: true, heavy: true, slowRes: 0.5,
    shed: [{ type: 'dreadhulk', count: 2 }, { type: 'husk', count: 4 }],
    tags: ['Heavy'], desc: 'A walking fortress. Breaks into 2 Dreadhulks and 4 Husks.',
  },
  gravemaw: {
    name: 'Gravemaw', hp: 4000, speed: 32, gold: 400, r: 30, tough: true, heavy: true, boss: true, slowRes: 0.5,
    shed: [{ type: 'dreadhulk', count: 2 }],
    phases: [{ at: 0.75, type: 'husk', count: 2 }, { at: 0.5, type: 'husk', count: 2 }, { at: 0.25, type: 'husk', count: 2 }],
    tags: ['Boss'], desc: 'The boss. Bursts out Husks as it is hurt and splits into 2 Dreadhulks when it falls. If it reaches the Heartfire, everything left in it gets through.',
  },
};

// Total layers inside an enemy type (including everything it sheds and its boss phases).
const popCache = {};
export function pops(type) {
  if (popCache[type] !== undefined) return popCache[type];
  const d = ENEMIES[type];
  let n = d.gold;
  for (const s of d.shed || []) n += pops(s.type) * s.count;
  for (const p of d.phases || []) n += pops(p.type) * p.count;
  popCache[type] = n;
  return n;
}

// Which type a layer grows back into (used by the endless "Mending" modifier). Only single-layer
// sheds mend (Mote -> Skitter -> Shambler); a split never re-forms, so mending can't multiply.
export const PARENT = {};
for (const [type, d] of Object.entries(ENEMIES)) {
  if (d.heavy || !d.shed || d.shed.length !== 1 || d.shed[0].count !== 1) continue;
  PARENT[d.shed[0].type] = type;
}
