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
//            (slowRes 1 = can't be slowed at all)
//   boss     gets the big health bar
//   veiled   always Veiled (Wisps, the Veilmother), not just when a wave says so
//   flying   follows the map's flight route over the path's loops; Mortar, Rime pulses and fire
//            can't touch it
//   shield   soaks damage before health (Arcane x2); recharges `shieldRegen`/s once it has gone
//            `shieldDelay` s without a hit. Breaking it pays nothing.
//   haste    { radius, pct }: nearby Gloom move pct faster (Heralds)
//   heal     { radius, every, max, pct, regen }: every `every` s, up to `max` nearby Gloom regrow
//            an outer layer or get pct of a shell's health back; regen = own health/s (Menders)
//   summon   { every, type, count }: drops these behind itself while it walks (bosses)
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
    tags: ['Boss'], desc: 'The first boss. Bursts out Husks as it is hurt and splits into 2 Dreadhulks when it falls. If it reaches the Heartfire, everything left in it gets through.',
  },

  // ---- the rest of the Gloom (campaign waves 7-15) -------------------------------------------
  herald: {
    name: 'Herald', hp: 40, speed: 72, gold: 4, r: 13, tough: true,
    haste: { radius: 95, pct: 0.3 },
    shed: [{ type: 'skitter', count: 2 }],
    tags: ['Haste'], desc: 'Gloom near a Herald move 30% faster. Kill it first. Sheds into 2 Skitters.',
  },
  gloomwing: {
    name: 'Gloomwing', hp: 40, speed: 92, gold: 4, r: 12, tough: true, flying: true,
    tags: ['Flying'], desc: 'Flies straight over the path\'s loops. Mortars, Rime pulses and fire can\'t touch it: Bolt Wards and Storm Coils can.',
  },
  aegis: {
    name: 'Aegis', hp: 20, speed: 70, gold: 2, r: 13, tough: true,
    shield: 70, shieldRegen: 35, shieldDelay: 2,
    shed: [{ type: 'shambler', count: 2 }],
    tags: ['Shielded'], desc: 'Carries a shield that recharges if it goes 2s without a hit. Arcane (Storm Coil) breaks shields twice as fast. Sheds into 2 Shamblers.',
  },
  nullback: {
    name: 'Nullback', hp: 80, speed: 58, gold: 8, r: 16, tough: true,
    mult: { arcane: 0.2 },
    shed: [{ type: 'brood', count: 2 }],
    tags: ['Null-hide'], desc: 'Its hide shrugs off Arcane: Storm Coils do a fifth of their damage. Cracks open into 2 Broods.',
  },
  wisp: {
    name: 'Wisp', hp: 30, speed: 112, gold: 3, r: 10, tough: true, veiled: true,
    tags: ['Veiled', 'Fast'], desc: 'Always Veiled. Only wards that see Veiled (or a Frost Sight spire nearby) can target it, though area attacks still hit it.',
  },
  mender: {
    name: 'Mender', hp: 50, speed: 62, gold: 5, r: 14, tough: true,
    heal: { radius: 90, every: 2.5, max: 12, pct: 0.25, regen: 12 },
    shed: [{ type: 'shambler', count: 2 }],
    tags: ['Heals'], desc: 'Every 2.5s it regrows the outer layer of nearby Gloom and patches shells, and it heals itself quickly. Kill it fast. Sheds into 2 Shamblers.',
  },

  // ---- bosses of waves 20, 30 and 40 ---------------------------------------------------------
  veilmother: {
    name: 'Veilmother', hp: 7500, speed: 28, gold: 750, r: 30, tough: true, heavy: true, boss: true, slowRes: 0.5, veiled: true,
    summon: { every: 2.5, type: 'wisp', count: 3 },
    shed: [{ type: 'wisp', count: 20 }],
    phases: [{ at: 0.5, type: 'mender', count: 4 }],
    tags: ['Boss', 'Veiled'], desc: 'Always Veiled, and trails a stream of Wisps. Wards that can\'t see Veiled can\'t target her: bring Hunter\'s Mark or a Frost Sight spire. Bursts into 20 Wisps.',
  },
  bastion: {
    name: 'Bastion', hp: 16000, speed: 26, gold: 1600, r: 32, tough: true, heavy: true, boss: true, slowRes: 0.5,
    mult: { kinetic: 0.5, blast: 1.25 },
    shield: 3000, shieldRegen: 500, shieldDelay: 3,
    phases: [
      { at: 0.66, type: 'aegis', count: 8 }, { at: 0.66, type: 'nullback', count: 4 },
      { at: 0.33, type: 'aegis', count: 8 }, { at: 0.33, type: 'nullback', count: 4 },
    ],
    shed: [{ type: 'colossus', count: 1 }, { type: 'nullback', count: 6 }],
    tags: ['Boss', 'Plated', 'Shielded'], desc: 'Plated (Kinetic half damage) behind a huge shield that recharges fast if it stops being hit. Storm Coils break the shield, Mortars crack the plate.',
  },
  hollowking: {
    name: 'The Hollow King', hp: 28000, speed: 24, gold: 7000, r: 34, tough: true, heavy: true, boss: true, slowRes: 1,
    mult: { frost: 0 },
    phases: [
      { at: 0.8, type: 'gloomwing', count: 24 }, { at: 0.8, type: 'herald', count: 4 },
      { at: 0.6, type: 'dreadhulk', count: 3 }, { at: 0.6, type: 'mender', count: 4 },
      { at: 0.4, type: 'aegis', count: 12 }, { at: 0.4, type: 'wisp', count: 24 },
      { at: 0.2, type: 'gloomwing', count: 40 }, { at: 0.2, type: 'herald', count: 6 },
    ],
    shed: [{ type: 'wisp', count: 18 }, { type: 'gloomwing', count: 18 }],
    tags: ['Boss', 'Frost-immune'], desc: 'The last boss. Frost can\'t hurt or slow it. At every fifth of its health it calls a new host (flyers, hulks, shields, Wisps), and when it falls it bursts into a swarm of Wisps and Gloomwings. Kill it early.',
  },

  // ---- Hard's last stretch (waves 41-60) ---------------------------------------------------------
  lastdark: {
    name: 'The Last Dark', hp: 60000, speed: 22, gold: 9000, r: 38, tough: true, heavy: true, boss: true, slowRes: 0.75,
    mult: { frost: 0.5 },
    summon: { every: 6, type: 'dreadhulk', count: 1 },
    phases: [
      { at: 0.8, type: 'colossus', count: 2 }, { at: 0.8, type: 'gloomwing', count: 30 },
      { at: 0.6, type: 'aegis', count: 16 }, { at: 0.6, type: 'mender', count: 6 },
      { at: 0.4, type: 'colossus', count: 3 }, { at: 0.4, type: 'wisp', count: 30 },
      { at: 0.2, type: 'gloomwing', count: 50 }, { at: 0.2, type: 'herald', count: 8 },
    ],
    shed: [{ type: 'colossus', count: 2 }, { type: 'wisp', count: 24 }],
    tags: ['Boss', 'Heavy'], desc: 'The night itself, come for the last flame (Hard, wave 60). Frost does half, and barely slows it. It drags Dreadhulks behind it, calls a new host at every fifth of its health, and breaks into colossi and Wisps when it falls.',
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

// How tough a kind of Gloom is, for "Strong" targeting: everything inside it (its total layers, as
// above), so a boss outranks a Gloomcolossus, which outranks a Dreadhulk, then the shells and so on.
// It ranks the kind, not the health left, so a ward keeps working on the biggest thing in reach
// instead of switching to a fresh one of the same kind.
for (const type of Object.keys(ENEMIES)) ENEMIES[type].rank = pops(type);

// Enemies with an aura or a timed action get a pass after the spatial grid is built each step.
for (const d of Object.values(ENEMIES)) d.special = !!(d.haste || d.heal || d.summon);
