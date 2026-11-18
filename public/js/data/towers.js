// Tower stats and upgrade paths. All balance numbers live here.
//
// Each tower has `base` stats and three `paths` of four tiers. Each path has a one-line identity
// (`blurb`), and each tier a short qualitative `blurb` (what it does and how it changes the ward's
// role) plus `desc`, the exact numbers, which the UI shows only on hover or while Shift is held.
// An upgrade modifies stats with
//   set: { stat: value }   add: { stat: +value }   mul: { stat: xvalue }
// applied in that order. Upgrade rules (two paths per tower, one specialist) are in data/rules.js.
// Enemies are stacks of 10 HP layers, so 10 damage = one layer per hit. Power targets (crowd
// pops/s vs the base ward): T1 ~1.7x, T2 ~3x, T3 ~8-12x with a new behaviour, T4 ~40-70x and an
// activated ability, and power per gold rising with tier. `node tools/report.js` prints the curve.
//
// Stat glossary
//   common  damage, rate (attacks/s), range, type (damage type), hitsAir, detect (sees stealth),
//           global (no range: reaches anywhere on the map)
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
//   snipe   instant shots: shots (targets per volley), airMul (x damage to flyers), heavyMul, armorPierce,
//           flakRadius/flakHits (burst around the target at half damage), spotRadius/spotDur (reveals Veiled
//           around the target), shieldMul (x damage to shields, any type), shieldStall (s shields can't recharge)
//   flame   a continuous stream: damage = Fire damage/s to everything in the cone (no rate).
//           arc (cone width in radians, TAU = all round), burnDps/burnDur (Fire), searDur (Scorched:
//           can't heal, regrow or recharge shields), burnHeavy (x burn on hulks/bosses), spread/spreadRadius/
//           spreadRate (Wildfire), searAmp (+% damage taken while Scorched), shieldMul, brand (Scorched lose resistances)
//   beam    damage = damage/s at x1 charge; maxCharge, ramp (s to full charge), beams, keep (charge kept on a new
//           target), burstMul/burstRadius/burstRate (light bursts from beam kills)
//   aura    range = aura radius. auraRate/auraDmg/auraRange (+% to wards inside), auraDetect, auraAir,
//           reveal, tithe (gold per wave cleared), interest/interestCap (on banked gold at each clear)

export const PATH_COLORS = ['#ffae2b', '#2fe0ff', '#c86bff'];
const TAU = Math.PI * 2;

export const TOWER_ORDER = ['bolt', 'mortar', 'rime', 'coil', 'longeye', 'censer', 'prism', 'beacon'];

export const TOWERS = {
  bolt: {
    name: 'Bolt Ward', role: 'Single target', cost: 150, kind: 'bolt',
    desc: 'Cheap, quick Kinetic bolts that punch through 2 enemies. Plated Husks take half damage.',
    base: { damage: 10, rate: 1.5, range: 155, type: 'kinetic', projSpeed: 760, pierce: 2, shots: 1, boltSize: 1, hitsAir: true },
    paths: [
      { name: 'Ballista', blurb: "Heavy bolts that punch through lines of enemies and their armour.", tiers: [
        { name: 'Heavy Bolts', blurb: "Heavier bolts: each one strips two layers.", cost: 90, desc: 'x2 damage: each bolt strips 2 layers.', mul: { damage: 2 }, set: { boltSize: 1.3 } },
        { name: 'Piercing Heads', blurb: "Bolts skewer a row of enemies and bite through armour.", cost: 200, desc: 'Bolts punch through 5 enemies and ignore half of their armour. +15 range.', add: { range: 15 }, set: { pierce: 5, armorPierce: 0.5, boltSize: 1.6 } },
        { name: 'Ballista', blurb: "Huge bolts tear through plate and shove the Gloom back.", cost: 800, desc: 'x2 damage, pierce 12, ignores all armour, and bolts knock enemies back.', mul: { damage: 2 }, set: { pierce: 12, armorPierce: 1, knockback: 14, boltSize: 2.3, projSpeed: 950 } },
        { name: 'Siege Lance', blurb: "Every shot is a lance that crosses the whole map, through everything.", cost: 4200, desc: 'x2.5 damage, x1.3 rate. Every shot is a lance that flies the full width of the map, through everything.', mul: { damage: 2.5, rate: 1.3 }, add: { range: 60 }, set: { pierce: 999, lance: true, knockback: 24, boltSize: 3.4, projSpeed: 1150 } },
      ] },
      { name: 'Twin-shot', blurb: "A storm of quick bolts: the answer to swarms and flyers.", tiers: [
        { name: 'Quick Draw', blurb: "Fires noticeably faster.", cost: 80, desc: 'x1.5 fire rate.', mul: { rate: 1.5 } },
        { name: 'Twin Shot', blurb: "Looses two bolts at once, at two different targets.", cost: 200, desc: 'Fires 2 bolts at once, at separate targets when it can.', set: { shots: 2 } },
        { name: 'Ricochet Volley', blurb: "A fan of bolts that bounce from enemy to enemy.", cost: 750, desc: '4 bolts per volley, and every bolt ricochets to 2 more enemies.', set: { shots: 4, bounces: 2 } },
        { name: 'Storm of Bolts', blurb: "A relentless hail of ricochets that shreds whole crowds.", cost: 3900, desc: '8 bolts per volley, x2 fire rate, and bolts ricochet 3 times.', set: { shots: 8, bounces: 3 }, mul: { rate: 2 } },
      ] },
      { name: "Hunter's Mark", blurb: "Sees the Veiled and marks prey so every ward hits harder.", tiers: [
        { name: 'Keen Sight', blurb: "Spots Veiled enemies and hits harder from further away.", cost: 100, desc: 'x2 damage and +30 range. Can see Veiled enemies.', add: { range: 30 }, mul: { damage: 2 }, set: { detect: true } },
        { name: 'Mark', blurb: "Marked enemies take extra damage from every ward.", cost: 220, desc: 'Hits mark the target for 4s: it takes +30% damage from everything. Bolts find weak points (ignore half of armour). Pierce 3, x1.2 rate.', set: { markPct: 0.3, markDur: 4, pierce: 3, armorPierce: 0.5 }, mul: { rate: 1.2 } },
        { name: 'Hunting Party', blurb: "Marks spread through the pack, and bolts ignore armour.", cost: 650, desc: 'Marks add +45% and spread to every enemy near the target. Bolts ignore all armour. x1.5 damage, x1.3 rate, pierce 4, +30 range.', set: { markPct: 0.45, markDur: 5, markRadius: 70, pierce: 4, armorPierce: 1 }, mul: { damage: 1.5, rate: 1.3 }, add: { range: 30 } },
        { name: 'Death Sentence', blurb: "Marked prey close to death is executed outright.", cost: 3600, desc: 'Marks add +75% and spread wider. Marked enemies under 25% health are executed (not hulks or bosses). x2 damage, x1.4 rate, pierce 5.', set: { markPct: 0.75, markRadius: 110, execute: 0.25, pierce: 5 }, mul: { damage: 2, rate: 1.4 }, add: { range: 40 } },
      ] },
    ],
  },

  mortar: {
    name: 'Mortar Kiln', role: 'Splash', cost: 300, kind: 'mortar',
    desc: 'Lobs Blast shells that break a layer off up to 14 enemies at once. Great against Plated Husks and crowds. Cannot hit flyers and has a blind spot up close.',
    base: { damage: 10, rate: 0.8, range: 200, minRange: 50, type: 'blast', radius: 55, maxHits: 14, flight: 0.7, shells: 1, hitsAir: false },
    paths: [
      { name: 'Big Shells', blurb: "Bigger, louder blasts that flatten crowds and crack plate.", tiers: [
        { name: 'Packed Powder', blurb: "Blasts strip two layers at once.", cost: 120, desc: 'x2 damage: blasts strip 2 layers.', mul: { damage: 2 } },
        { name: 'Wide Burst', blurb: "Wider blasts that catch far more of the crowd.", cost: 250, desc: 'x1.3 blast radius, hits up to 25 enemies.', mul: { radius: 1.3 }, set: { maxHits: 25 } },
        { name: 'Earthshaker', blurb: "Massive blasts that stun everything they hit.", cost: 900, desc: 'x2 damage, bigger blasts that hit up to 40 enemies and stun for 0.6s.', mul: { damage: 2, radius: 1.1 }, set: { stun: 0.6, maxHits: 40 } },
        { name: 'Cataclysm', blurb: "Each shell levels a stretch of path and stuns it solid.", cost: 4700, desc: 'x2.5 damage, enormous blasts that hit up to 80 enemies and stun for 1.2s.', mul: { damage: 2.5, radius: 1.45, rate: 1.1 }, set: { stun: 1.2, maxHits: 80 } },
      ] },
      { name: 'Rapid Loader', blurb: "Keeps the shells coming: more blasts, more often, from further away.", tiers: [
        { name: 'Drilled Crew', blurb: "Fires noticeably faster.", cost: 100, desc: 'x1.5 fire rate.', mul: { rate: 1.5 } },
        { name: 'Long Barrel', blurb: "Reaches further and fires faster still.", cost: 220, desc: '+50 range and x1.3 fire rate.', add: { range: 50 }, mul: { rate: 1.3 } },
        { name: 'Triple Rack', blurb: "Lobs three shells at once at separate targets.", cost: 850, desc: 'Fires 3 shells per volley at separate targets.', set: { shells: 3 }, mul: { rate: 1.1 } },
        { name: 'Barrage Battery', blurb: "An unbroken barrage that carpets the path.", cost: 4400, desc: '6 shells per volley, x1.6 fire rate, x2 damage.', set: { shells: 6 }, mul: { rate: 1.6, damage: 2 } },
      ] },
      { name: 'Cinder', blurb: "Sets the ground on fire: damage that keeps burning after the blast.", tiers: [
        { name: 'Hot Shells', blurb: "Blasts set enemies alight, and the fire carries into what they shed.", cost: 120, desc: 'Blasts set enemies burning: 4 damage/s for 3s. Burns carry on into inner layers.', set: { burnDps: 4, burnDur: 3 } },
        { name: 'Cinder Pool', blurb: "Leaves burning ground that scorches everything walking through.", cost: 280, desc: 'Leaves fire on the ground for 3s dealing 10 damage/s.', set: { poolDps: 10, poolDur: 3 } },
        { name: 'Cluster Charge', blurb: "Shells burst into bomblets and the fire burns hotter.", cost: 800, desc: 'x1.5 shell damage and each shell scatters 5 bomblets. Fire burns hotter (20/s, burns 8/s).', set: { cluster: 5, poolDps: 20, burnDps: 8 }, mul: { damage: 1.5 } },
        { name: 'Inferno', blurb: "Turns the path into a lake of fire that softens everything in it.", cost: 4500, desc: 'x2 shell damage. Fire lasts 6s, deals 50 damage/s, spreads 40% wider, and enemies in it take +25% damage. Burns 15/s.', set: { poolDps: 50, poolDur: 6, poolRadiusMul: 1.4, scorch: 0.25, burnDps: 15 }, mul: { damage: 2 } },
      ] },
    ],
  },

  rime: {
    name: 'Rime Spire', role: 'Slow / area', cost: 225, kind: 'pulse',
    desc: 'Pulses Frost that breaks a layer off up to 30 nearby ground enemies and slows them. Pulses hit Veiled enemies too.',
    base: { damage: 10, rate: 0.8, range: 105, type: 'frost', slow: 0.35, slowDur: 1.5, maxHits: 30, hitsAir: false },
    paths: [
      { name: 'Deep Freeze', blurb: "Slows the Gloom to a crawl, then freezes it solid.", tiers: [
        { name: 'Bitter Cold', blurb: "A deeper slow.", cost: 90, desc: 'Slow increased to 45%.', set: { slow: 0.45 } },
        { name: 'Lingering Chill', blurb: "The chill clings longer and reaches further.", cost: 200, desc: 'Slow lasts 2.5s. +15 range.', set: { slowDur: 2.5 }, add: { range: 15 } },
        { name: 'Flash Freeze', blurb: "Every few pulses freezes enemies solid, and frozen enemies break easier.", cost: 750, desc: 'Every 3rd pulse freezes enemies solid for 1.2s. Frozen enemies take +30% damage. x2 pulse damage.', set: { freezeEvery: 3, freezeDur: 1.2, frozenAmp: 0.3 }, mul: { damage: 2 } },
        { name: 'Absolute Zero', blurb: "Freezes the crowd again and again: a wall of ice.", cost: 3900, desc: 'Every 2nd pulse freezes for 2s, slow 60%, frozen enemies take +60% damage. x2 damage, x1.3 rate, +25 range.', set: { freezeEvery: 2, freezeDur: 2, slow: 0.6, frozenAmp: 0.6 }, add: { range: 25 }, mul: { damage: 2, rate: 1.3 } },
      ] },
      { name: 'Shatter', blurb: "Turns chilled enemies into bombs for the rest of your wards.", tiers: [
        { name: 'Frostbite', blurb: "Pulses strip two layers at once.", cost: 100, desc: 'x2 damage: pulses strip 2 layers.', mul: { damage: 2 } },
        { name: 'Brittle', blurb: "Chilled enemies take extra damage from bolts and shells.", cost: 240, desc: 'Chilled enemies take +25% Kinetic and Blast damage. x1.2 pulse rate.', set: { brittle: 0.25 }, mul: { rate: 1.2 } },
        { name: 'Shatter', blurb: "Chilled enemies explode in shards when they die.", cost: 800, desc: 'Brittle +40%. Chilled enemies that die explode for 40 Frost damage (up to 8 a second).', set: { brittle: 0.4, shatterDmg: 40, shatterRadius: 55, shatterRate: 8 } },
        { name: "Winter's Verdict", blurb: "Brutal pulses and chain-reaction shatters that sweep the crowd.", cost: 4200, desc: 'x3 damage, brittle +60%, shatters deal 120 (up to 20 a second).', set: { brittle: 0.6, shatterDmg: 120, shatterRadius: 70, shatterRate: 20 }, mul: { damage: 3, rate: 1.15 } },
      ] },
      { name: 'Blizzard', blurb: "A huge field of cold that lets every ward see the Veiled.", tiers: [
        { name: 'Wide Chill', blurb: "Reaches further.", cost: 80, desc: '+25 range.', add: { range: 25 } },
        { name: 'Frost Sight', blurb: "Reveals Veiled enemies nearby so every ward can shoot them.", cost: 200, desc: 'Reveals Veiled enemies in range, so every ward can target them.', set: { reveal: true, detect: true } },
        { name: 'Blizzard', blurb: "A much bigger, faster, harder-hitting storm.", cost: 750, desc: 'x1.5 range, x1.4 pulse rate, x1.5 damage.', mul: { range: 1.5, rate: 1.4, damage: 1.5 } },
        { name: 'Endless Winter', blurb: "Slows the whole map, all the time.", cost: 3800, desc: 'x1.3 range, x2.5 damage, slow lasts 3s, and every enemy on the map is slowed 20%.', mul: { range: 1.3, damage: 2.5 }, set: { slowDur: 3, globalSlow: 0.2, maxHits: 60 } },
      ] },
    ],
  },

  coil: {
    name: 'Storm Coil', role: 'Chain lightning', cost: 350, kind: 'chain',
    desc: 'Arcane lightning that jumps between 5 nearby enemies, breaking a layer off each.',
    base: { damage: 10, rate: 1.0, range: 135, type: 'arcane', chains: 5, jumpRange: 80, falloff: 1, forks: 1, hitsAir: true },
    paths: [
      { name: 'Overcharge', blurb: "Raw voltage: the heavy-crowd breaker.", tiers: [
        { name: 'High Voltage', blurb: "Each strike strips two layers.", cost: 120, desc: 'x2 damage: strikes strip 2 layers.', mul: { damage: 2 } },
        { name: 'Surge', blurb: "Hits harder and jumps one enemy further.", cost: 300, desc: 'x1.5 damage and +1 jump.', mul: { damage: 1.5 }, add: { chains: 1 } },
        { name: 'Thunderhead', blurb: "Lightning that tears through packs of hulks.", cost: 950, desc: 'x2 damage, and double damage to Dreadhulks and bosses.', mul: { damage: 2 }, set: { heavyMul: 2 } },
        { name: 'Smite', blurb: "Calls down thunderbolts that blast and stun around their target.", cost: 4900, desc: 'x2.5 damage, x1.3 rate. Every 3rd strike calls a thunderbolt: x5 damage that explodes around its target and stuns.', mul: { damage: 2.5, rate: 1.3 }, set: { smiteEvery: 3, smiteMul: 5, smiteRadius: 80 } },
      ] },
      { name: 'Forking', blurb: "Lightning that leaps through whole crowds.", tiers: [
        { name: 'Long Chain', blurb: "Lightning jumps through far more enemies.", cost: 110, desc: 'Hits 8 enemies per strike.', set: { chains: 8 } },
        { name: 'Wide Arc', blurb: "Longer jumps through even bigger chains.", cost: 280, desc: 'Hits 12 enemies, and jumps 40 further.', set: { chains: 12 }, add: { jumpRange: 40 } },
        { name: 'Forked Strike', blurb: "Strikes two targets at once, each with its own chain.", cost: 900, desc: 'Strikes 2 separate targets at once, each with a full chain. x1.5 damage.', set: { forks: 2 }, mul: { damage: 1.5 } },
        { name: 'Maelstrom', blurb: "Four huge chains at once: the whole crowd lights up.", cost: 4700, desc: 'Strikes 4 targets at once, each chain hitting 20 enemies. x2 damage, x1.4 strike rate.', set: { forks: 4, chains: 20 }, mul: { rate: 1.4, damage: 2 } },
      ] },
      { name: 'Static', blurb: "Rapid strikes that stun and soften the Gloom for everyone.", tiers: [
        { name: 'Capacitors', blurb: "Strikes much more often.", cost: 100, desc: 'x1.4 strike rate.', mul: { rate: 1.4 } },
        { name: 'Static Shock', blurb: "Strikes sometimes stun what they hit.", cost: 280, desc: 'Each hit has a 15% chance to stun for 0.4s. x1.15 strike rate.', set: { stunChance: 0.15, stunDur: 0.4 }, mul: { rate: 1.15 } },
        { name: 'Conductive', blurb: "Struck enemies are slowed and take more lightning.", cost: 850, desc: 'Struck enemies are Charged for 3s: +30% Arcane damage taken and 20% slower. x1.5 damage, x1.2 strike rate.', set: { chargedPct: 0.3, chargedSlow: 0.2, chargedDur: 3 }, mul: { rate: 1.2, damage: 1.5 } },
        { name: 'Ion Storm', blurb: "A crackling storm of stuns and lightning.", cost: 4400, desc: 'x2.5 strike rate, x3 damage, stun chance 30%.', mul: { rate: 2.5, damage: 3 }, set: { stunChance: 0.3 } },
      ] },
    ],
  },

  longeye: {
    name: 'Longeye', role: 'Sniper', cost: 350, kind: 'snipe', target: 'strong',
    desc: 'A slow rifle that reaches anywhere on the map, wherever it stands. Each shot strips 3 layers. Sees Veiled enemies and hits flyers twice as hard.',
    base: { damage: 30, rate: 0.5, global: true, type: 'kinetic', shots: 1, airMul: 2, hitsAir: true, detect: true },
    paths: [
      { name: 'Deadeye', blurb: "One perfect shot at a time: huge hits that ignore armour and crack hulk shells.", tiers: [
        { name: 'Heavy Rounds', blurb: "Every shot hits twice as hard.", cost: 150, desc: 'x2 damage: shots strip 6 layers.', mul: { damage: 2 } },
        { name: 'Hollow Points', blurb: "Rounds punch through plate and bite deep into hulks.", cost: 350, desc: 'Ignores all armour. x1.3 damage, x1.5 to hulks and bosses.', set: { armorPierce: 1, heavyMul: 1.5 }, mul: { damage: 1.3 } },
        { name: 'Deadeye', blurb: "A marksman's rifle that breaks hulks open in a few shots.", cost: 1100, desc: 'x2.3 damage, x1.3 rate, x3 to hulks and bosses.', set: { heavyMul: 3 }, mul: { damage: 2.3, rate: 1.3 } },
        { name: 'Headhunter', blurb: "Every shot can fell a hulk; bosses feel each one.", cost: 4600, desc: 'x2.8 damage, x1.5 rate, x4 to hulks and bosses.', set: { heavyMul: 4 }, mul: { damage: 2.8, rate: 1.5 } },
      ] },
      { name: 'Flak', blurb: "Shells burst in the air and shred whole flocks.", tiers: [
        { name: 'Quick Bolt', blurb: "Fires noticeably faster.", cost: 120, desc: 'x1.5 fire rate.', mul: { rate: 1.5 } },
        { name: 'Flak Rounds', blurb: "Shots burst, peppering everything around the target.", cost: 300, desc: 'Shots burst for half damage on up to 8 enemies within 45.', set: { flakRadius: 45, flakHits: 8 } },
        { name: 'Flak Battery', blurb: "Wide bursts that tear flocks out of the sky.", cost: 1000, desc: 'Bursts reach 70 and hit up to 20. Flyers take x3 damage. x1.5 rate.', set: { flakRadius: 70, flakHits: 20, airMul: 3 }, mul: { rate: 1.5 } },
        { name: 'Flak Curtain', blurb: "A wall of bursting shells across the sky.", cost: 4300, desc: '3 shots per volley at separate targets, bursts reach 90 and hit up to 40. x1.9 damage, x1.3 rate.', set: { shots: 3, flakRadius: 90, flakHits: 40 }, mul: { damage: 1.9, rate: 1.3 } },
      ] },
      { name: 'Spotter', blurb: "Tracer rounds reveal the Veiled and break shields for every ward.", tiers: [
        { name: 'Tracers', blurb: "Shots light up hidden Gloom around the target for every ward.", cost: 130, desc: 'Hits reveal Veiled enemies within 60 of the target for 5s.', set: { spotRadius: 60, spotDur: 5 } },
        { name: 'Shieldbreaker', blurb: "Rounds shatter shields and stop them recharging.", cost: 300, desc: 'x4 damage to shields; shields hit can\'t recharge for 4s. x1.3 rate.', set: { shieldMul: 4, shieldStall: 4 }, mul: { rate: 1.3 } },
        { name: 'Flare Rounds', blurb: "Each shot lights up a wide patch of the path.", cost: 950, desc: 'Reveals within 140 for 6s. x1.5 damage, x1.4 rate.', set: { spotRadius: 140, spotDur: 6 }, mul: { damage: 1.5, rate: 1.4 } },
        { name: 'Eye in the Dark', blurb: "It sees the whole map, so nothing hides anywhere.", cost: 4000, desc: 'Reveals every Veiled enemy on the map to every ward, all the time. x6 damage to shields, x2 damage, x1.5 rate.', set: { reveal: true, shieldMul: 6 }, mul: { damage: 2, rate: 1.5 } },
      ] },
    ],
  },

  censer: {
    name: 'Ember Censer', role: 'Flamethrower / anti-heal', cost: 275, kind: 'flame', target: 'first',
    desc: 'A flamethrower: pours a constant cone of Fire over everything in front of it, flyers and Veiled included, sweeping to follow its target. Burning enemies are Scorched: no healing, regrowing or shield recharge.',
    base: { damage: 8, range: 95, type: 'fire', arc: 0.8, burnDps: 3, burnDur: 2, searDur: 2.5, hitsAir: true },
    paths: [
      { name: 'Pyre', blurb: "A hotter flame, white then blue, that grinds through hulks and armour.", tiers: [
        { name: 'Hotter Coals', blurb: "Burns hurt twice as much.", cost: 110, desc: 'Burns deal x2 (6/s).', mul: { burnDps: 2 } },
        { name: 'Clinging Flame', blurb: "Fire sticks for longer and the flame bites harder.", cost: 260, desc: 'Burns last 3s. x1.3 flame damage.', set: { burnDur: 3, searDur: 3.5 }, mul: { damage: 1.3 } },
        { name: 'Pyre', blurb: "A white-hot flame: hulks and bosses burn like dry wood.", cost: 900, desc: 'Burns x2; hulks and bosses burn x3. x1.4 flame damage.', set: { burnHeavy: 3 }, mul: { burnDps: 2, damage: 1.4 } },
        { name: 'Wildfire', blurb: "Blue fire that leaps from every burning death to the Gloom around it.", cost: 4200, desc: 'Burns x2.4, flames x1.9. A burning enemy that dies spreads its fire to up to 3 enemies within 70 (up to 15 a second).', set: { spread: 3, spreadRadius: 70, spreadRate: 15 }, mul: { burnDps: 2.4, damage: 1.9 } },
      ] },
      { name: "Dragon's Breath", blurb: "A longer, wider jet that hoses down whole crowds.", tiers: [
        { name: 'Bellows', blurb: "The jet reaches further.", cost: 100, desc: '+20 range.', add: { range: 20 } },
        { name: 'Wide Jet', blurb: "A broad fan of flame that catches far more.", cost: 250, desc: 'x1.6 cone width.', mul: { arc: 1.6 } },
        { name: 'Firehose', blurb: "A roaring, relentless torrent of fire.", cost: 950, desc: 'x2.1 flame damage, +20 range.', mul: { damage: 2.1 }, add: { range: 20 } },
        { name: "Dragon's Breath", blurb: "A full ring of fire: nothing near it escapes.", cost: 4400, desc: 'Breathes fire all the way round. x2.6 flame damage, +15 range, burns x1.5.', set: { arc: TAU }, mul: { damage: 2.6, burnDps: 1.5 }, add: { range: 15 } },
      ] },
      { name: 'Ash', blurb: "Choking smoke: Scorched enemies take more damage from every ward.", tiers: [
        { name: 'Soot', blurb: "Scorched enemies take a little more from everything.", cost: 110, desc: 'Scorched enemies take +10% damage from every ward.', set: { searAmp: 0.1 } },
        { name: 'Melt', blurb: "Fire eats through shields.", cost: 260, desc: 'x3 damage to shields. Scorched take +15%.', set: { shieldMul: 3, searAmp: 0.15 } },
        { name: 'Choking Ash', blurb: "Lingering ash leaves the Gloom soft for every ward.", cost: 900, desc: 'Scorched take +25% and stay Scorched 4s after the fire. x1.5 flame damage.', set: { searAmp: 0.25, searDur: 4 }, mul: { damage: 1.5 } },
        { name: 'Ashen Brand', blurb: "Branded Gloom lose every resistance they had.", cost: 4000, desc: 'Scorched take +40% and lose their damage resistances (immunities stay). x2.2 flame damage.', set: { searAmp: 0.4, brand: true }, mul: { damage: 2.2 } },
      ] },
    ],
  },

  prism: {
    name: 'Prism', role: 'Beam / boss killer', cost: 500, kind: 'beam', target: 'strong',
    desc: 'Locks a Radiant beam onto one enemy. Damage builds up to x5 over 4s while it stays on that enemy (and what it sheds), and resets on a new target. Poor against swarms.',
    base: { damage: 16, range: 150, type: 'radiant', maxCharge: 5, ramp: 4, beams: 1, keep: 0, hitsAir: true },
    paths: [
      { name: 'Focus', blurb: "Ramps higher and faster: melts hulks and bosses.", tiers: [
        { name: 'Polished Lens', blurb: "A hotter beam.", cost: 150, desc: 'x1.5 damage.', mul: { damage: 1.5 } },
        { name: 'Quick Focus', blurb: "Reaches full power twice as fast, and goes higher.", cost: 350, desc: 'Full charge in 2s, up to x6.', set: { ramp: 2, maxCharge: 6 } },
        { name: 'Focus', blurb: "A searing lance of light that guts hulks.", cost: 1200, desc: 'x2 damage, charge up to x10, +30 range.', set: { maxCharge: 10 }, mul: { damage: 2 }, add: { range: 30 } },
        { name: 'Sunspear', blurb: "A spear of sunlight that burns down bosses.", cost: 5000, desc: 'x2.5 damage, charge up to x16 in 1.5s.', set: { maxCharge: 16, ramp: 1.5 }, mul: { damage: 2.5 } },
      ] },
      { name: 'Refraction', blurb: "Splits into several beams, each building its own charge.", tiers: [
        { name: 'Split Beam', blurb: "Two beams at two targets.", cost: 140, desc: '2 beams, each charging on its own target.', set: { beams: 2 } },
        { name: 'Prism Array', blurb: "Three beams, reaching further.", cost: 330, desc: '3 beams. +20 range.', set: { beams: 3 }, add: { range: 20 } },
        { name: 'Refraction', blurb: "A fan of beams that picks a whole pack of hulks apart.", cost: 1100, desc: '5 beams. x1.5 damage.', set: { beams: 5 }, mul: { damage: 1.5 } },
        { name: 'Kaleidoscope', blurb: "Eight blazing beams that charge in a blink.", cost: 4600, desc: '8 beams. x2 damage, full charge twice as fast.', set: { beams: 8 }, mul: { damage: 2, ramp: 0.5 } },
      ] },
      { name: 'Afterglow', blurb: "Keeps its charge between targets, and kills burst into light.", tiers: [
        { name: 'Warm Glass', blurb: "Keeps half its charge when it switches target.", cost: 130, desc: 'Keeps 50% of its charge on a new target.', set: { keep: 0.5 } },
        { name: 'Afterglow', blurb: "Never loses its charge, so it chews through crowds too.", cost: 320, desc: 'Keeps all its charge on a new target. x1.3 damage.', set: { keep: 1 }, mul: { damage: 1.3 } },
        { name: 'Burst of Light', blurb: "Every kill bursts in light around the target.", cost: 1050, desc: 'Beam kills burst for half the beam\'s current damage/s within 55 (up to 4 a second). x1.5 damage.', set: { burstMul: 0.5, burstRadius: 55, burstRate: 4 }, mul: { damage: 1.5 } },
        { name: 'Supernova', blurb: "Kills erupt in blinding novas that clear the crowd.", cost: 4500, desc: 'Bursts deal the beam\'s full damage/s within 100 (up to 8 a second). x2 damage, charge up to x8.', set: { burstMul: 1, burstRadius: 100, burstRate: 8, maxCharge: 8 }, mul: { damage: 2 } },
      ] },
    ],
  },

  beacon: {
    name: 'Beacon', role: 'Support aura', cost: 450, kind: 'aura',
    desc: 'Never attacks. Wards inside its light attack 10% faster. Beacons don\'t stack: a ward gets the best boost of each kind it is in.',
    base: { damage: 0, range: 130, type: null, auraRate: 0.1 },
    paths: [
      { name: 'War Drum', blurb: "Nearby wards attack faster.", tiers: [
        { name: 'Drums', blurb: "A faster beat.", cost: 150, desc: 'Wards inside attack 15% faster.', set: { auraRate: 0.15 } },
        { name: 'War Chant', blurb: "The beat quickens.", cost: 350, desc: 'Wards inside attack 25% faster.', set: { auraRate: 0.25 } },
        { name: 'War Drum', blurb: "Wards inside fight much faster and harder.", cost: 1100, desc: 'Wards inside attack 35% faster and deal 15% more damage.', set: { auraRate: 0.35, auraDmg: 0.15 } },
        { name: 'Warhorn', blurb: "A call to war across a wide field.", cost: 4500, desc: 'Wards inside attack 50% faster and deal 30% more damage. x1.2 radius.', set: { auraRate: 0.5, auraDmg: 0.3 }, mul: { range: 1.2 } },
      ] },
      { name: 'Lighthouse', blurb: "Nearby wards reach further, see the Veiled, and can strike flyers.", tiers: [
        { name: 'Lamp', blurb: "Wards inside reach a little further.", cost: 120, desc: 'Wards inside get +10% range.', set: { auraRange: 0.1 } },
        { name: 'Lighthouse', blurb: "Wards inside can see Veiled enemies.", cost: 300, desc: 'Wards inside see Veiled enemies.', set: { auraDetect: true } },
        { name: 'Skyward Beam', blurb: "Mortars and Rime Spires inside can hit flyers.", cost: 900, desc: 'Every ward inside can hit flyers (Mortars and Rime Spires included). +20% range.', set: { auraAir: true, auraRange: 0.2 } },
        { name: 'Pharos', blurb: "A great light: nothing hides inside it.", cost: 3800, desc: 'Reveals Veiled enemies in its light for every ward. +30% range for wards inside, x1.5 radius.', set: { auraRange: 0.3, reveal: true }, mul: { range: 1.5 } },
      ] },
      { name: 'Tithe', blurb: "Earns gold: a bonus every wave and interest on your savings.", tiers: [
        { name: 'Tithe', blurb: "A little extra gold every wave.", cost: 200, desc: '+80 gold each wave cleared.', set: { tithe: 80 } },
        { name: 'Interest', blurb: "Your savings earn interest.", cost: 400, desc: '+150 gold each wave, plus 3% of your banked gold (up to 150).', set: { tithe: 150, interest: 0.03, interestCap: 150 } },
        { name: 'Coffers', blurb: "A steady stream of gold.", cost: 1200, desc: '+300 gold each wave, plus 5% of your banked gold (up to 300).', set: { tithe: 300, interest: 0.05, interestCap: 300 } },
        { name: 'Golden Hearth', blurb: "A treasury that pays for a ward every few waves.", cost: 4000, desc: '+450 gold each wave, plus 5% of your banked gold (up to 600).', set: { tithe: 450, interest: 0.05, interestCap: 600 } },
      ] },
    ],
  },
};
