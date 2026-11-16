// Tower stats and upgrade paths. All balance numbers live here.
//
// Each tower has `base` stats and three `paths` of four tiers. An upgrade modifies stats with
//   set: { stat: value }   add: { stat: +value }   mul: { stat: xvalue }
// applied in that order. Upgrade rules (two paths per tower, one specialist) are in data/rules.js.
// Power is meant to scale roughly exponentially with tier: T1 ~1.5x, T2 ~2.5x, T3 ~5x plus a new
// behaviour, T4 ~15x+ and screen-dominating. `node tools/report.js` prints the curve.
//
// Stat glossary
//   common  damage, rate (attacks/s), range, type (damage type), hitsAir, detect (sees stealth)
//   bolt    projSpeed, pierce, shots, armorPierce (0-1 of resistance ignored), bounces (ricochets),
//           knockback (px, non-boss), lance (bolt flies straight across the map), boltSize,
//           markPct/markDur (target takes +% damage from everything), markRadius, execute (hp fraction)
//   mortar  radius, minRange, flight (s), shells, stun (s), burnDps/burnDur,
//           poolDps/poolDur/poolRadiusMul (fire left on the ground), cluster (bomblets), scorch (+% dmg taken in fire)
//   pulse   slow (0-1), slowDur, freezeEvery (every Nth pulse), freezeDur, frozenAmp (+% dmg taken while frozen),
//           brittle (+% kinetic/blast taken while chilled), shatterDmg/shatterRadius, globalSlow
//   chain   chains (enemies hit), jumpRange, falloff (per jump), shieldMul, forks (primary targets),
//           smiteEvery/smiteMul/smiteRadius, stunChance/stunDur, chargedPct (+% arcane taken)/chargedSlow/chargedDur

export const PATH_COLORS = ['#ffae2b', '#2fe0ff', '#c86bff'];

export const TOWER_ORDER = ['bolt', 'mortar', 'rime', 'coil'];

export const TOWERS = {
  bolt: {
    name: 'Bolt Ward', role: 'Single target', cost: 170, kind: 'bolt',
    desc: 'Cheap, reliable Kinetic bolts. Struggles against Plated enemies until upgraded.',
    base: { damage: 12, rate: 1.2, range: 150, type: 'kinetic', projSpeed: 720, pierce: 1, shots: 1, boltSize: 1, hitsAir: true },
    paths: [
      { name: 'Ballista', tiers: [
        { name: 'Heavy Bolts', cost: 110, desc: 'x1.8 damage. Bigger, heavier bolts.', mul: { damage: 1.8 }, set: { boltSize: 1.3 } },
        { name: 'Piercing Heads', cost: 230, desc: 'x1.4 damage, bolts pierce 3 enemies and ignore 40% of armour. +15 range.', mul: { damage: 1.4 }, add: { range: 15 }, set: { pierce: 3, armorPierce: 0.4, boltSize: 1.6 } },
        { name: 'Ballista', cost: 620, desc: 'x2.2 damage, pierce 10, ignores all armour, and bolts knock enemies back.', mul: { damage: 2.2 }, set: { pierce: 10, armorPierce: 1, knockback: 14, boltSize: 2.3, projSpeed: 900 } },
        { name: 'Siege Lance', cost: 1900, desc: 'x2.5 damage, x1.2 rate. Each shot is a lance that flies the full width of the map, through everything.', mul: { damage: 2.5, rate: 1.2 }, add: { range: 60 }, set: { pierce: 999, lance: true, knockback: 24, boltSize: 3.4, projSpeed: 1150 } },
      ] },
      { name: 'Twin-shot', tiers: [
        { name: 'Quick Draw', cost: 100, desc: 'x1.5 fire rate.', mul: { rate: 1.5 } },
        { name: 'Twin Shot', cost: 220, desc: 'Fires 2 bolts at once, at separate targets when it can.', set: { shots: 2 } },
        { name: 'Ricochet Volley', cost: 580, desc: '4 bolts per volley, x1.2 damage, and every bolt ricochets to a second enemy.', set: { shots: 4, bounces: 1 }, mul: { damage: 1.2 } },
        { name: 'Storm of Bolts', cost: 1800, desc: '6 bolts per volley, x1.5 fire rate, x1.1 damage, and bolts ricochet twice.', set: { shots: 6, bounces: 2 }, mul: { rate: 1.5, damage: 1.1 } },
      ] },
      { name: "Hunter's Mark", tiers: [
        { name: 'Keen Sight', cost: 110, desc: '+30 range and x1.3 damage. Can see stealthed enemies.', add: { range: 30 }, mul: { damage: 1.3 }, set: { detect: true } },
        { name: 'Mark', cost: 240, desc: 'Hits mark the target for 4s: it takes +20% damage from everything. x1.3 damage.', set: { markPct: 0.2, markDur: 4 }, mul: { damage: 1.3 } },
        { name: 'Hunting Party', cost: 560, desc: 'Marks add +40% and spread to every enemy near the target. x1.6 damage, x1.2 rate, +30 range.', set: { markPct: 0.4, markDur: 5, markRadius: 70 }, mul: { damage: 1.6, rate: 1.2 }, add: { range: 30 } },
        { name: 'Death Sentence', cost: 1700, desc: 'Marks add +75% and spread wider. Marked non-boss enemies under 25% health are executed. x2 damage, x1.5 rate.', set: { markPct: 0.75, markRadius: 110, execute: 0.25 }, mul: { damage: 2, rate: 1.5 }, add: { range: 40 } },
      ] },
    ],
  },

  mortar: {
    name: 'Mortar Kiln', role: 'Splash', cost: 300, kind: 'mortar',
    desc: 'Lobs slow Blast shells that hit everything in an area. Great against Plated and clumps. Cannot hit flyers and has a blind spot up close.',
    base: { damage: 22, rate: 0.5, range: 200, minRange: 55, type: 'blast', radius: 55, flight: 0.8, shells: 1, hitsAir: false },
    paths: [
      { name: 'Big Shells', tiers: [
        { name: 'Packed Powder', cost: 160, desc: 'x1.6 damage.', mul: { damage: 1.6 } },
        { name: 'Wide Burst', cost: 280, desc: 'x1.3 damage and x1.3 blast radius.', mul: { damage: 1.3, radius: 1.3 } },
        { name: 'Earthshaker', cost: 700, desc: 'x2.3 damage, bigger blasts, and every blast stuns for 0.6s.', mul: { damage: 2.3, radius: 1.2 }, set: { stun: 0.6 } },
        { name: 'Cataclysm', cost: 2200, desc: 'x2.6 damage, enormous blasts that stun for 1.2s.', mul: { damage: 2.6, radius: 1.45, rate: 1.1 }, set: { stun: 1.2 } },
      ] },
      { name: 'Rapid Loader', tiers: [
        { name: 'Drilled Crew', cost: 140, desc: 'x1.5 fire rate.', mul: { rate: 1.5 } },
        { name: 'Long Barrel', cost: 260, desc: '+50 range and x1.3 fire rate.', add: { range: 50 }, mul: { rate: 1.3 } },
        { name: 'Triple Rack', cost: 680, desc: 'Fires 3 shells per volley at separate targets.', set: { shells: 3 }, mul: { rate: 1.1 } },
        { name: 'Barrage Battery', cost: 2100, desc: '6 shells per volley, x1.6 fire rate.', set: { shells: 6 }, mul: { rate: 1.6, damage: 1.2 } },
      ] },
      { name: 'Cinder', tiers: [
        { name: 'Hot Shells', cost: 150, desc: 'x1.2 damage. Blasts set enemies burning: 8 damage/s for 3s.', set: { burnDps: 8, burnDur: 3 }, mul: { damage: 1.2 } },
        { name: 'Cinder Pool', cost: 300, desc: 'Leaves fire on the ground for 3s dealing 20 damage/s.', set: { poolDps: 20, poolDur: 3 } },
        { name: 'Cluster Charge', cost: 720, desc: 'Each shell scatters 5 bomblets. Fire burns hotter (35/s).', set: { cluster: 5, poolDps: 35, burnDps: 14 } },
        { name: 'Inferno', cost: 2200, desc: 'Fire lasts 6s, deals 100 damage/s, spreads 40% wider, and enemies in it take +25% damage.', set: { poolDps: 100, poolDur: 6, poolRadiusMul: 1.4, scorch: 0.25, burnDps: 30 } },
      ] },
    ],
  },

  rime: {
    name: 'Rime Spire', role: 'Slow / freeze', cost: 240, kind: 'pulse',
    desc: 'Pulses Frost that slows every ground enemy in range. Little damage on its own: it makes other wards better.',
    base: { damage: 3, rate: 0.9, range: 100, type: 'frost', slow: 0.35, slowDur: 1.5, hitsAir: false },
    paths: [
      { name: 'Deep Freeze', tiers: [
        { name: 'Bitter Cold', cost: 120, desc: 'Slow increased to 45%. Pulses deal 6 damage.', set: { slow: 0.45, damage: 6 } },
        { name: 'Lingering Chill', cost: 200, desc: 'Slow lasts 2.5s. +15 range.', set: { slowDur: 2.5 }, add: { range: 15 } },
        { name: 'Flash Freeze', cost: 600, desc: 'Every 3rd pulse freezes enemies solid for 1.2s. Frozen enemies take +30% damage.', set: { freezeEvery: 3, freezeDur: 1.2, frozenAmp: 0.3 } },
        { name: 'Absolute Zero', cost: 1900, desc: 'Every 2nd pulse freezes for 2s, slow 65%, frozen enemies take +60% damage.', set: { freezeEvery: 2, freezeDur: 2, slow: 0.65, frozenAmp: 0.6 }, add: { range: 25 } },
      ] },
      { name: 'Shatter', tiers: [
        { name: 'Frostbite', cost: 140, desc: 'Pulses deal 10 damage.', set: { damage: 10 } },
        { name: 'Brittle', cost: 260, desc: 'Chilled enemies take +25% Kinetic and Blast damage. Pulses deal 14.', set: { brittle: 0.25, damage: 14 } },
        { name: 'Shatter', cost: 620, desc: 'Brittle +45%. Chilled enemies that die explode for 45 Frost damage. Pulses deal 20.', set: { brittle: 0.45, shatterDmg: 45, shatterRadius: 55, damage: 20 } },
        { name: "Winter's Verdict", cost: 2000, desc: 'Brittle +75%, pulses deal 45, shatter explosions deal 140 and can chain.', set: { brittle: 0.75, damage: 45, shatterDmg: 140, shatterRadius: 70 }, mul: { rate: 1.15 } },
      ] },
      { name: 'Blizzard', tiers: [
        { name: 'Wide Chill', cost: 110, desc: '+25 range.', add: { range: 25 } },
        { name: 'Updraft', cost: 200, desc: '+20 range. Pulses also hit flyers.', add: { range: 20 }, set: { hitsAir: true } },
        { name: 'Blizzard', cost: 600, desc: 'x1.5 range, x1.4 pulse rate, pulses deal 10.', mul: { range: 1.5, rate: 1.4 }, set: { damage: 10 } },
        { name: 'Endless Winter', cost: 1800, desc: 'x1.4 range, slow lasts 4s, pulses deal 25, and every enemy on the map is slowed 15%.', mul: { range: 1.4 }, set: { slowDur: 4, globalSlow: 0.15, damage: 25 } },
      ] },
    ],
  },

  coil: {
    name: 'Storm Coil', role: 'Chain lightning', cost: 380, kind: 'chain',
    desc: 'Arcane lightning that jumps between nearby enemies. Shreds swarms and shields; each jump is weaker.',
    base: { damage: 16, rate: 1.0, range: 135, type: 'arcane', chains: 4, jumpRange: 80, falloff: 0.8, forks: 1, hitsAir: true },
    paths: [
      { name: 'Overcharge', tiers: [
        { name: 'High Voltage', cost: 200, desc: 'x1.7 damage.', mul: { damage: 1.7 } },
        { name: 'Clean Arc', cost: 320, desc: 'Jumps no longer lose damage. x1.3 damage.', set: { falloff: 1 }, mul: { damage: 1.3 } },
        { name: 'Thunderhead', cost: 800, desc: 'x1.8 damage, +2 jumps, triple damage to shields.', mul: { damage: 1.8 }, add: { chains: 2 }, set: { shieldMul: 3 } },
        { name: 'Smite', cost: 2500, desc: 'x2 damage. Every 3rd strike calls a thunderbolt: x6 damage that explodes around its target and stuns for 1s.', mul: { damage: 2 }, set: { smiteEvery: 3, smiteMul: 6, smiteRadius: 80 } },
      ] },
      { name: 'Forking', tiers: [
        { name: 'Long Chain', cost: 180, desc: 'Hits 6 enemies per strike. x1.25 damage.', set: { chains: 6 }, mul: { damage: 1.25 } },
        { name: 'Wide Arc', cost: 300, desc: 'Hits 8 enemies, jumps 40 further and loses less per jump. x1.2 damage.', set: { chains: 8, falloff: 0.9 }, add: { jumpRange: 40 }, mul: { damage: 1.2 } },
        { name: 'Forked Strike', cost: 820, desc: 'Strikes 2 separate targets at once, each with a full chain. x1.3 damage.', set: { forks: 2 }, mul: { damage: 1.3 } },
        { name: 'Maelstrom', cost: 2400, desc: 'Strikes 4 targets at once, each chain hitting 14 enemies and losing less per jump. x1.4 strike rate.', set: { forks: 4, chains: 14, falloff: 0.95 }, mul: { rate: 1.4, damage: 1.2 } },
      ] },
      { name: 'Static', tiers: [
        { name: 'Capacitors', cost: 170, desc: 'x1.4 strike rate.', mul: { rate: 1.4 } },
        { name: 'Static Shock', cost: 320, desc: 'Each hit has a 20% chance to stun for 0.4s. x1.15 strike rate.', set: { stunChance: 0.2, stunDur: 0.4 }, mul: { rate: 1.15 } },
        { name: 'Conductive', cost: 700, desc: 'Struck enemies are Charged for 3s: +30% Arcane damage taken and 20% slower. x1.5 damage.', set: { chargedPct: 0.3, chargedSlow: 0.2, chargedDur: 3 }, mul: { damage: 1.5 } },
        { name: 'Ion Storm', cost: 2200, desc: 'x2.5 strike rate, x1.5 damage, stun chance 35%.', mul: { rate: 2.5, damage: 1.5 }, set: { stunChance: 0.35 } },
      ] },
    ],
  },
};
