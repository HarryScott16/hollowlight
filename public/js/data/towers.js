// Tower stats and upgrade paths. All balance numbers live here.
//
// Each tower has `base` stats and three `paths` of four tiers. An upgrade modifies stats with
//   set: { stat: value }   add: { stat: +value }   mul: { stat: xvalue }
// applied in that order. Upgrade rules (two paths per tower, one specialist) are in data/rules.js.
// Enemies are stacks of 10 HP layers, so 10 damage = one layer per hit. Power targets (crowd
// pops/s vs the base ward): T1 ~1.7x, T2 ~3x, T3 ~8-12x with a new behaviour, T4 ~40-70x and an
// activated ability, and power per gold rising with tier. `node tools/report.js` prints the curve.
//
// Stat glossary
//   common  damage, rate (attacks/s), range, type (damage type), hitsAir, detect (sees stealth)
//   bolt    projSpeed, pierce, shots, armorPierce (0-1 of resistance ignored), bounces (ricochets),
//           knockback (px, non-boss), lance (bolt flies straight across the map), boltSize,
//           markPct/markDur (target takes +% damage from everything), markRadius, execute (hp fraction)
//   mortar  radius, maxHits (enemies per blast), minRange, flight (s), shells, stun (s), burnDps/burnDur,
//           poolDps/poolDur/poolRadiusMul (fire left on the ground), cluster (bomblets), scorch (+% dmg taken in fire)
//   pulse   maxHits, slow (0-1), slowDur, freezeEvery (every Nth pulse), freezeDur, frozenAmp (+% dmg taken while frozen),
//           brittle (+% kinetic/blast taken while chilled), shatterDmg/shatterRadius/shatterRate (max per s),
//           globalSlow, reveal (Veiled enemies in range can be targeted by every ward)
//   chain   chains (enemies hit), jumpRange, falloff (per jump), heavyMul (x damage to hulks/boss), forks (primary targets),
//           smiteEvery/smiteMul/smiteRadius, stunChance/stunDur, chargedPct (+% arcane taken)/chargedSlow/chargedDur

export const PATH_COLORS = ['#ffae2b', '#2fe0ff', '#c86bff'];

export const TOWER_ORDER = ['bolt', 'mortar', 'rime', 'coil'];

export const TOWERS = {
  bolt: {
    name: 'Bolt Ward', role: 'Single target', cost: 150, kind: 'bolt',
    desc: 'Cheap, quick Kinetic bolts that punch through 2 enemies. Plated Husks take half damage.',
    base: { damage: 10, rate: 1.5, range: 155, type: 'kinetic', projSpeed: 760, pierce: 2, shots: 1, boltSize: 1, hitsAir: true },
    paths: [
      { name: 'Ballista', tiers: [
        { name: 'Heavy Bolts', cost: 90, desc: 'x2 damage: each bolt strips 2 layers.', mul: { damage: 2 }, set: { boltSize: 1.3 } },
        { name: 'Piercing Heads', cost: 200, desc: 'Bolts punch through 5 enemies and ignore half of their armour. +15 range.', add: { range: 15 }, set: { pierce: 5, armorPierce: 0.5, boltSize: 1.6 } },
        { name: 'Ballista', cost: 800, desc: 'x2 damage, pierce 12, ignores all armour, and bolts knock enemies back.', mul: { damage: 2 }, set: { pierce: 12, armorPierce: 1, knockback: 14, boltSize: 2.3, projSpeed: 950 } },
        { name: 'Siege Lance', cost: 3200, desc: 'x2.5 damage, x1.3 rate. Every shot is a lance that flies the full width of the map, through everything.', mul: { damage: 2.5, rate: 1.3 }, add: { range: 60 }, set: { pierce: 999, lance: true, knockback: 24, boltSize: 3.4, projSpeed: 1150 } },
      ] },
      { name: 'Twin-shot', tiers: [
        { name: 'Quick Draw', cost: 80, desc: 'x1.5 fire rate.', mul: { rate: 1.5 } },
        { name: 'Twin Shot', cost: 200, desc: 'Fires 2 bolts at once, at separate targets when it can.', set: { shots: 2 } },
        { name: 'Ricochet Volley', cost: 750, desc: '4 bolts per volley, and every bolt ricochets to 2 more enemies.', set: { shots: 4, bounces: 2 } },
        { name: 'Storm of Bolts', cost: 3000, desc: '8 bolts per volley, x2 fire rate, and bolts ricochet 3 times.', set: { shots: 8, bounces: 3 }, mul: { rate: 2 } },
      ] },
      { name: "Hunter's Mark", tiers: [
        { name: 'Keen Sight', cost: 100, desc: 'x2 damage and +30 range. Can see Veiled enemies.', add: { range: 30 }, mul: { damage: 2 }, set: { detect: true } },
        { name: 'Mark', cost: 220, desc: 'Hits mark the target for 4s: it takes +30% damage from everything. Pierce 3, x1.2 rate.', set: { markPct: 0.3, markDur: 4, pierce: 3 }, mul: { rate: 1.2 } },
        { name: 'Hunting Party', cost: 650, desc: 'Marks add +45% and spread to every enemy near the target. x1.5 damage, x1.3 rate, pierce 4, +30 range.', set: { markPct: 0.45, markDur: 5, markRadius: 70, pierce: 4 }, mul: { damage: 1.5, rate: 1.3 }, add: { range: 30 } },
        { name: 'Death Sentence', cost: 2800, desc: 'Marks add +75% and spread wider. Marked non-boss enemies under 25% health are executed. x2 damage, x1.4 rate, pierce 5.', set: { markPct: 0.75, markRadius: 110, execute: 0.25, pierce: 5 }, mul: { damage: 2, rate: 1.4 }, add: { range: 40 } },
      ] },
    ],
  },

  mortar: {
    name: 'Mortar Kiln', role: 'Splash', cost: 300, kind: 'mortar',
    desc: 'Lobs Blast shells that break a layer off up to 14 enemies at once. Great against Plated Husks and crowds. Cannot hit flyers and has a blind spot up close.',
    base: { damage: 10, rate: 0.8, range: 200, minRange: 50, type: 'blast', radius: 55, maxHits: 14, flight: 0.7, shells: 1, hitsAir: false },
    paths: [
      { name: 'Big Shells', tiers: [
        { name: 'Packed Powder', cost: 120, desc: 'x2 damage: blasts strip 2 layers.', mul: { damage: 2 } },
        { name: 'Wide Burst', cost: 250, desc: 'x1.3 blast radius, hits up to 25 enemies.', mul: { radius: 1.3 }, set: { maxHits: 25 } },
        { name: 'Earthshaker', cost: 900, desc: 'x2 damage, bigger blasts that hit up to 40 enemies and stun for 0.6s.', mul: { damage: 2, radius: 1.1 }, set: { stun: 0.6, maxHits: 40 } },
        { name: 'Cataclysm', cost: 3600, desc: 'x2.5 damage, enormous blasts that hit up to 80 enemies and stun for 1.2s.', mul: { damage: 2.5, radius: 1.45, rate: 1.1 }, set: { stun: 1.2, maxHits: 80 } },
      ] },
      { name: 'Rapid Loader', tiers: [
        { name: 'Drilled Crew', cost: 100, desc: 'x1.5 fire rate.', mul: { rate: 1.5 } },
        { name: 'Long Barrel', cost: 220, desc: '+50 range and x1.3 fire rate.', add: { range: 50 }, mul: { rate: 1.3 } },
        { name: 'Triple Rack', cost: 850, desc: 'Fires 3 shells per volley at separate targets.', set: { shells: 3 }, mul: { rate: 1.1 } },
        { name: 'Barrage Battery', cost: 3400, desc: '6 shells per volley, x1.6 fire rate, x2 damage.', set: { shells: 6 }, mul: { rate: 1.6, damage: 2 } },
      ] },
      { name: 'Cinder', tiers: [
        { name: 'Hot Shells', cost: 120, desc: 'Blasts set enemies burning: 4 damage/s for 3s. Burns carry on into inner layers.', set: { burnDps: 4, burnDur: 3 } },
        { name: 'Cinder Pool', cost: 280, desc: 'Leaves fire on the ground for 3s dealing 10 damage/s.', set: { poolDps: 10, poolDur: 3 } },
        { name: 'Cluster Charge', cost: 800, desc: 'Each shell scatters 5 bomblets. Fire burns hotter (20/s, burns 8/s).', set: { cluster: 5, poolDps: 20, burnDps: 8 } },
        { name: 'Inferno', cost: 3500, desc: 'Fire lasts 6s, deals 60 damage/s, spreads 40% wider, and enemies in it take +25% damage. Burns 15/s.', set: { poolDps: 60, poolDur: 6, poolRadiusMul: 1.4, scorch: 0.25, burnDps: 15 } },
      ] },
    ],
  },

  rime: {
    name: 'Rime Spire', role: 'Slow / area', cost: 225, kind: 'pulse',
    desc: 'Pulses Frost that breaks a layer off up to 30 nearby ground enemies and slows them. Pulses hit Veiled enemies too.',
    base: { damage: 10, rate: 0.8, range: 105, type: 'frost', slow: 0.35, slowDur: 1.5, maxHits: 30, hitsAir: false },
    paths: [
      { name: 'Deep Freeze', tiers: [
        { name: 'Bitter Cold', cost: 90, desc: 'Slow increased to 45%.', set: { slow: 0.45 } },
        { name: 'Lingering Chill', cost: 200, desc: 'Slow lasts 2.5s. +15 range.', set: { slowDur: 2.5 }, add: { range: 15 } },
        { name: 'Flash Freeze', cost: 750, desc: 'Every 3rd pulse freezes enemies solid for 1.2s. Frozen enemies take +30% damage. x2 pulse damage.', set: { freezeEvery: 3, freezeDur: 1.2, frozenAmp: 0.3 }, mul: { damage: 2 } },
        { name: 'Absolute Zero', cost: 3000, desc: 'Every 2nd pulse freezes for 2s, slow 60%, frozen enemies take +60% damage. x2 damage, x1.3 rate, +25 range.', set: { freezeEvery: 2, freezeDur: 2, slow: 0.6, frozenAmp: 0.6 }, add: { range: 25 }, mul: { damage: 2, rate: 1.3 } },
      ] },
      { name: 'Shatter', tiers: [
        { name: 'Frostbite', cost: 100, desc: 'x2 damage: pulses strip 2 layers.', mul: { damage: 2 } },
        { name: 'Brittle', cost: 240, desc: 'Chilled enemies take +25% Kinetic and Blast damage. x1.2 pulse rate.', set: { brittle: 0.25 }, mul: { rate: 1.2 } },
        { name: 'Shatter', cost: 800, desc: 'Brittle +40%. Chilled enemies that die explode for 40 Frost damage (up to 8 a second).', set: { brittle: 0.4, shatterDmg: 40, shatterRadius: 55, shatterRate: 8 } },
        { name: "Winter's Verdict", cost: 3200, desc: 'x3 damage, brittle +60%, shatters deal 120 (up to 20 a second).', set: { brittle: 0.6, shatterDmg: 120, shatterRadius: 70, shatterRate: 20 }, mul: { damage: 3, rate: 1.15 } },
      ] },
      { name: 'Blizzard', tiers: [
        { name: 'Wide Chill', cost: 80, desc: '+25 range.', add: { range: 25 } },
        { name: 'Frost Sight', cost: 200, desc: 'Reveals Veiled enemies in range, so every ward can target them.', set: { reveal: true, detect: true } },
        { name: 'Blizzard', cost: 750, desc: 'x1.5 range, x1.4 pulse rate, x1.5 damage.', mul: { range: 1.5, rate: 1.4, damage: 1.5 } },
        { name: 'Endless Winter', cost: 2900, desc: 'x1.3 range, x2.5 damage, slow lasts 3s, and every enemy on the map is slowed 20%.', mul: { range: 1.3, damage: 2.5 }, set: { slowDur: 3, globalSlow: 0.2, maxHits: 60 } },
      ] },
    ],
  },

  coil: {
    name: 'Storm Coil', role: 'Chain lightning', cost: 350, kind: 'chain',
    desc: 'Arcane lightning that jumps between 5 nearby enemies, breaking a layer off each.',
    base: { damage: 10, rate: 1.0, range: 135, type: 'arcane', chains: 5, jumpRange: 80, falloff: 1, forks: 1, hitsAir: true },
    paths: [
      { name: 'Overcharge', tiers: [
        { name: 'High Voltage', cost: 120, desc: 'x2 damage: strikes strip 2 layers.', mul: { damage: 2 } },
        { name: 'Surge', cost: 300, desc: 'x1.5 damage and +1 jump.', mul: { damage: 1.5 }, add: { chains: 1 } },
        { name: 'Thunderhead', cost: 950, desc: 'x2 damage, and double damage to Dreadhulks and bosses.', mul: { damage: 2 }, set: { heavyMul: 2 } },
        { name: 'Smite', cost: 3800, desc: 'x2.5 damage, x1.3 rate. Every 3rd strike calls a thunderbolt: x5 damage that explodes around its target and stuns.', mul: { damage: 2.5, rate: 1.3 }, set: { smiteEvery: 3, smiteMul: 5, smiteRadius: 80 } },
      ] },
      { name: 'Forking', tiers: [
        { name: 'Long Chain', cost: 110, desc: 'Hits 8 enemies per strike.', set: { chains: 8 } },
        { name: 'Wide Arc', cost: 280, desc: 'Hits 12 enemies, and jumps 40 further.', set: { chains: 12 }, add: { jumpRange: 40 } },
        { name: 'Forked Strike', cost: 900, desc: 'Strikes 2 separate targets at once, each with a full chain. x1.5 damage.', set: { forks: 2 }, mul: { damage: 1.5 } },
        { name: 'Maelstrom', cost: 3600, desc: 'Strikes 4 targets at once, each chain hitting 20 enemies. x2 damage, x1.4 strike rate.', set: { forks: 4, chains: 20 }, mul: { rate: 1.4, damage: 2 } },
      ] },
      { name: 'Static', tiers: [
        { name: 'Capacitors', cost: 100, desc: 'x1.4 strike rate.', mul: { rate: 1.4 } },
        { name: 'Static Shock', cost: 280, desc: 'Each hit has a 15% chance to stun for 0.4s. x1.15 strike rate.', set: { stunChance: 0.15, stunDur: 0.4 }, mul: { rate: 1.15 } },
        { name: 'Conductive', cost: 850, desc: 'Struck enemies are Charged for 3s: +30% Arcane damage taken and 20% slower. x1.5 damage, x1.2 strike rate.', set: { chargedPct: 0.3, chargedSlow: 0.2, chargedDur: 3 }, mul: { rate: 1.2, damage: 1.5 } },
        { name: 'Ion Storm', cost: 3400, desc: 'x2.5 strike rate, x3 damage, stun chance 30%.', mul: { rate: 2.5, damage: 3 }, set: { stunChance: 0.3 } },
      ] },
    ],
  },
};
