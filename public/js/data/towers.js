// Tower stats and upgrade paths. All balance numbers live here.
//
// Each tower has `base` stats and three `paths` of four tiers. An upgrade modifies stats with
//   set: { stat: value }   add: { stat: +value }   mul: { stat: xvalue }
// applied in that order. Upgrade rules (two paths per tower, one specialist) are in data/rules.js.
//
// Stat glossary
//   common  damage, rate (attacks/s), range, type (damage type), hitsAir, detect (sees stealth)
//   bolt    projSpeed, pierce, shots, armorPierce (0-1 of resistance ignored),
//           markPct/markDur (target takes +% damage from everything), execute (hp fraction)
//   mortar  radius, minRange, flight (s), shells, stun (s), burnDps/burnDur,
//           poolDps/poolDur/poolRadiusMul (fire left on the ground), cluster (bomblets), scorch (+% dmg taken in fire)
//   pulse   slow (0-1), slowDur, freezeEvery (every Nth pulse), freezeDur,
//           brittle (+% kinetic/blast taken while chilled), shatterDmg/shatterRadius, globalSlow
//   chain   chains (enemies hit), jumpRange, falloff (per jump), shieldMul, forks (primary targets),
//           smiteEvery/smiteMul, stunChance/stunDur, chargedPct (+% arcane taken)/chargedSlow/chargedDur

export const PATH_COLORS = ['#ffb347', '#6fe3ff', '#c58bff'];

export const TOWER_ORDER = ['bolt', 'mortar', 'rime', 'coil'];

export const TOWERS = {
  bolt: {
    name: 'Bolt Ward', role: 'Single target', cost: 180, kind: 'bolt',
    desc: 'Cheap, reliable Kinetic bolts. Struggles against Plated enemies until upgraded.',
    base: { damage: 10, rate: 1.1, range: 150, type: 'kinetic', projSpeed: 640, pierce: 1, shots: 1, hitsAir: true },
    paths: [
      { name: 'Ballista', tiers: [
        { name: 'Heavy Bolts', cost: 120, desc: '+60% damage.', mul: { damage: 1.6 } },
        { name: 'Piercing Heads', cost: 190, desc: 'Bolts pierce 3 enemies. +10 range.', set: { pierce: 3 }, add: { range: 10 } },
        { name: 'Ballista', cost: 560, desc: 'x2.2 damage, pierces 5, ignores half of armour. Fires a little slower.', mul: { damage: 2.2, rate: 0.85 }, set: { pierce: 5, armorPierce: 0.5 } },
        { name: 'Siege Lance', cost: 1900, desc: 'x3 damage, +40 range, pierces everything in line and ignores armour.', mul: { damage: 3 }, add: { range: 40 }, set: { pierce: 30, armorPierce: 1 } },
      ] },
      { name: 'Twin-shot', tiers: [
        { name: 'Quick Draw', cost: 100, desc: '+25% fire rate.', mul: { rate: 1.25 } },
        { name: 'Twin Shot', cost: 230, desc: 'Fires 2 bolts at once, at separate targets when it can.', set: { shots: 2 } },
        { name: 'Volley', cost: 620, desc: '3 bolts per volley and +25% fire rate.', set: { shots: 3 }, mul: { rate: 1.25 } },
        { name: 'Storm of Bolts', cost: 2000, desc: '5 bolts per volley and +50% fire rate.', set: { shots: 5 }, mul: { rate: 1.5 } },
      ] },
      { name: "Hunter's Mark", tiers: [
        { name: 'Keen Sight', cost: 110, desc: '+25 range. Can see stealthed enemies.', add: { range: 25 }, set: { detect: true } },
        { name: 'Mark', cost: 250, desc: 'Hits mark the target for 4s: it takes +15% damage from everything.', set: { markPct: 0.15, markDur: 4 } },
        { name: 'Deep Mark', cost: 580, desc: 'Marks last 6s and add +30% damage taken.', set: { markPct: 0.3, markDur: 6 } },
        { name: 'Death Sentence', cost: 1700, desc: 'Marks add +50%. Marked non-boss enemies under 15% health are executed.', set: { markPct: 0.5, execute: 0.15 } },
      ] },
    ],
  },

  mortar: {
    name: 'Mortar Kiln', role: 'Splash', cost: 320, kind: 'mortar',
    desc: 'Lobs slow Blast shells that hit everything in an area. Great against Plated and clumps. Cannot hit flyers and has a blind spot up close.',
    base: { damage: 19, rate: 0.42, range: 200, minRange: 55, type: 'blast', radius: 55, flight: 0.85, shells: 1, hitsAir: false },
    paths: [
      { name: 'Big Shells', tiers: [
        { name: 'Packed Powder', cost: 170, desc: '+40% damage.', mul: { damage: 1.4 } },
        { name: 'Wide Burst', cost: 250, desc: '+25% blast radius.', mul: { radius: 1.25 } },
        { name: 'Earthshaker', cost: 720, desc: 'x2 damage, +20% radius, and blasts stun for 0.5s.', mul: { damage: 2, radius: 1.2 }, set: { stun: 0.5 } },
        { name: 'Cataclysm', cost: 2400, desc: 'x3 damage, +40% radius, stuns for 1s.', mul: { damage: 3, radius: 1.4 }, set: { stun: 1 } },
      ] },
      { name: 'Rapid Loader', tiers: [
        { name: 'Drilled Crew', cost: 140, desc: '+25% fire rate.', mul: { rate: 1.25 } },
        { name: 'Long Barrel', cost: 230, desc: '+45 range and +15% fire rate.', add: { range: 45 }, mul: { rate: 1.15 } },
        { name: 'Twin Barrel', cost: 680, desc: 'Fires 2 shells per volley at separate targets.', set: { shells: 2 } },
        { name: 'Barrage Battery', cost: 2200, desc: 'x2.2 fire rate.', mul: { rate: 2.2 } },
      ] },
      { name: 'Cinder', tiers: [
        { name: 'Hot Shells', cost: 150, desc: 'Blasts set enemies burning: 5 damage/s for 3s.', set: { burnDps: 5, burnDur: 3 } },
        { name: 'Cinder Pool', cost: 290, desc: 'Leaves fire on the ground for 3s dealing 12 damage/s.', set: { poolDps: 12, poolDur: 3 } },
        { name: 'Cluster Charge', cost: 700, desc: 'Each shell scatters 4 bomblets (half damage) around the impact.', set: { cluster: 4 } },
        { name: 'Inferno', cost: 2300, desc: 'Fire lasts 6s, deals 50 damage/s, is 30% wider, and enemies in it take +20% damage.', set: { poolDps: 50, poolDur: 6, poolRadiusMul: 1.3, scorch: 0.2, burnDps: 14 } },
      ] },
    ],
  },

  rime: {
    name: 'Rime Spire', role: 'Slow / freeze', cost: 260, kind: 'pulse',
    desc: 'Pulses Frost that slows every ground enemy in range. Almost no damage on its own: it makes other wards better.',
    base: { damage: 2, rate: 0.85, range: 95, type: 'frost', slow: 0.35, slowDur: 1.5, hitsAir: false },
    paths: [
      { name: 'Deep Freeze', tiers: [
        { name: 'Bitter Cold', cost: 130, desc: 'Slow increased to 45%.', set: { slow: 0.45 } },
        { name: 'Lingering Chill', cost: 190, desc: 'Slow lasts 2.5s. +10 range.', set: { slowDur: 2.5 }, add: { range: 10 } },
        { name: 'Flash Freeze', cost: 620, desc: 'Every 3rd pulse freezes enemies solid for 1s.', set: { freezeEvery: 3, freezeDur: 1 } },
        { name: 'Absolute Zero', cost: 2000, desc: 'Every 2nd pulse freezes for 1.6s. Slow increased to 60%.', set: { freezeEvery: 2, freezeDur: 1.6, slow: 0.6 } },
      ] },
      { name: 'Shatter', tiers: [
        { name: 'Frostbite', cost: 140, desc: 'Pulses deal 8 damage.', set: { damage: 8 } },
        { name: 'Brittle', cost: 270, desc: 'Chilled enemies take +20% Kinetic and Blast damage.', set: { brittle: 0.2 } },
        { name: 'Shatter', cost: 660, desc: 'Brittle +40%. Chilled enemies that die explode for 35 Frost damage.', set: { brittle: 0.4, shatterDmg: 35, shatterRadius: 48 } },
        { name: "Winter's Verdict", cost: 2100, desc: 'Brittle +60%, pulses deal 40 damage, shatter explosions deal 130.', set: { brittle: 0.6, damage: 40, shatterDmg: 130, shatterRadius: 60 } },
      ] },
      { name: 'Blizzard', tiers: [
        { name: 'Wide Chill', cost: 120, desc: '+20 range.', add: { range: 20 } },
        { name: 'Updraft', cost: 200, desc: '+20 range. Pulses also hit flyers.', add: { range: 20 }, set: { hitsAir: true } },
        { name: 'Blizzard', cost: 640, desc: '+50% range and +30% pulse rate.', mul: { range: 1.5, rate: 1.3 } },
        { name: 'Endless Winter', cost: 1900, desc: '+40% range, slow lasts 4s, and every enemy on the map is slowed 10%.', mul: { range: 1.4 }, set: { slowDur: 4, globalSlow: 0.1 } },
      ] },
    ],
  },

  coil: {
    name: 'Storm Coil', role: 'Chain lightning', cost: 400, kind: 'chain',
    desc: 'Arcane lightning that jumps between nearby enemies. Shreds swarms and shields; each jump is weaker.',
    base: { damage: 17, rate: 1.0, range: 135, type: 'arcane', chains: 4, jumpRange: 80, falloff: 0.8, forks: 1, hitsAir: true },
    paths: [
      { name: 'Overcharge', tiers: [
        { name: 'High Voltage', cost: 200, desc: '+40% damage.', mul: { damage: 1.4 } },
        { name: 'Clean Arc', cost: 290, desc: 'Jumps no longer lose damage.', set: { falloff: 1 } },
        { name: 'Thunderhead', cost: 820, desc: 'x2 damage. Triple damage to shields.', mul: { damage: 2 }, set: { shieldMul: 3 } },
        { name: 'Smite', cost: 2600, desc: 'x2 damage. Every 4th strike is a thunderbolt: x5 damage to its first target and a 1s stun.', mul: { damage: 2 }, set: { smiteEvery: 4, smiteMul: 5 } },
      ] },
      { name: 'Forking', tiers: [
        { name: 'Long Chain', cost: 180, desc: 'Hits 5 enemies per strike.', set: { chains: 5 } },
        { name: 'Wide Arc', cost: 300, desc: 'Hits 7 enemies and jumps 40 further.', set: { chains: 7 }, add: { jumpRange: 40 } },
        { name: 'Forked Strike', cost: 860, desc: 'Strikes 2 separate targets at once, each with a full chain.', set: { forks: 2 } },
        { name: 'Maelstrom', cost: 2500, desc: 'Strikes 3 targets at once, each chain hitting 14 enemies.', set: { forks: 3, chains: 14 } },
      ] },
      { name: 'Static', tiers: [
        { name: 'Capacitors', cost: 170, desc: '+25% strike rate.', mul: { rate: 1.25 } },
        { name: 'Static Shock', cost: 320, desc: 'Each hit has a 20% chance to stun for 0.4s.', set: { stunChance: 0.2, stunDur: 0.4 } },
        { name: 'Conductive', cost: 720, desc: 'Struck enemies are Charged for 3s: +25% Arcane damage taken and 15% slower.', set: { chargedPct: 0.25, chargedSlow: 0.15, chargedDur: 3 } },
        { name: 'Ion Storm', cost: 2300, desc: 'x1.8 strike rate and stun chance 35%.', mul: { rate: 1.8 }, set: { stunChance: 0.35 } },
      ] },
    ],
  },
};
