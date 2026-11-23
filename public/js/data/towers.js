// Tower stats and upgrade paths. All balance numbers live here.
//
// Each tower has `base` stats and three `paths` of five tiers (tier 5, the capstones, at the end of the file). Each path has a one-line identity
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
//   snare   built ON the path. damage per bite (one charge per enemy that steps on it), charges (stock),
//           refill (charges/s; full at each wave clear), radius (trigger), armorPierce, slow/slowDur,
//           rootDur (non-heavy bitten enemies are held), rootRadius/rootHits (a bite holds more around it,
//           at most once a second), heavyRoot/heavyRootEvery (holds a Heavy), mineMax/mineEvery/mineDmg/
//           mineRadius/mineHits/mineStun/mineRange (mines sown on the path near it, burst when stepped on)
//   lure    pulls flyers in range (range) to circle it: lureMax at once, lureDur (s), lureImm (s before the
//           same flyer can be lured again). Circling flyers can be hit by every ward. lureAmp (+% damage
//           taken while lured), lureDps (Radiant/s to circling flyers), lureReveal, releaseSlow/
//           releaseSlowDur, groundDur (s a released flyer stays hittable by every ward)
//   wander  floats near its post: leash (how far it roams), moveSpeed, lights (separate lights, each
//           casting), shots (stars per cast), projSpeed, starRadius/starHits/starMul (each star
//           bursts on hit), markPct/markDur/markRadius, torchRate/torchDmg/torchRange (boost to wards
//           near its post)
//   vault   banks embers from Gloom that die in range: glean (share of their bounty, x max(gold rate,
//           0.15)), cap, growth (interest per wave cleared; RULES.vault*), gleanAll (also from kills anywhere, at half rate),
//           warmRate/warmDmg/warmAt (wards in range attack faster while it is over warmAt full)

export const PATH_COLORS = ['#ffae2b', '#2fe0ff', '#c86bff'];
const TAU = Math.PI * 2;

export const TOWER_ORDER = ['bolt', 'mortar', 'rime', 'coil', 'longeye', 'censer', 'prism', 'beacon', 'snare', 'moth', 'wander', 'vault'];
// Build keys, in TOWER_ORDER: the number row.
export const WARD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];

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
      { name: 'Pyre', blurb: "A hotter flame, burning white-hot, that grinds through hulks and armour.", tiers: [
        { name: 'Hotter Coals', blurb: "Burns hurt twice as much.", cost: 110, desc: 'Burns deal x2 (6/s).', mul: { burnDps: 2 } },
        { name: 'Clinging Flame', blurb: "Fire sticks for longer and the flame bites harder.", cost: 260, desc: 'Burns last 3s. x1.3 flame damage.', set: { burnDur: 3, searDur: 3.5 }, mul: { damage: 1.3 } },
        { name: 'Pyre', blurb: "A white-hot flame: hulks and bosses burn like dry wood.", cost: 900, desc: 'Burns x2; hulks and bosses burn x3. x1.4 flame damage.', set: { burnHeavy: 3 }, mul: { burnDps: 2, damage: 1.4 } },
        { name: 'Wildfire', blurb: "White-hot fire that leaps from every burning death to the Gloom around it.", cost: 4200, desc: 'Burns x2.4, flames x1.9. A burning enemy that dies spreads its fire to up to 3 enemies within 70 (up to 15 a second).', set: { spread: 3, spreadRadius: 70, spreadRate: 15 }, mul: { burnDps: 2.4, damage: 1.9 } },
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
  snare: {
    name: 'Thornlight Snare', role: 'Path trap', cost: 200, kind: 'snare', onPath: true,
    desc: 'Built on the path itself. Each enemy that steps on it loses a layer and spends a charge; charges refill slowly and fully at the end of each wave. Flyers pass over it.',
    base: { damage: 10, charges: 20, refill: 3, radius: 20, type: 'kinetic', hitsAir: false },
    paths: [
      { name: 'Caltrops', blurb: "Heavier thorns that bite through armour and drag the Gloom down.", tiers: [
        { name: 'Sharp Thorns', blurb: "Every bite strips two layers.", cost: 100, desc: 'x2 damage: each bite strips 2 layers.', mul: { damage: 2 } },
        { name: 'Thornbed', blurb: "Holds more charges, refills faster and bites into plate.", cost: 250, desc: '+10 charges, x2 refill, ignores half of armour.', add: { charges: 10 }, mul: { refill: 2 }, set: { armorPierce: 0.5 } },
        { name: 'Iron Thorns', blurb: "Iron spikes tear through plate and slow whatever they bite.", cost: 750, desc: 'x2 damage, x1.5 refill, +15 charges, ignores all armour, bitten enemies slowed 30% for 1s.', mul: { damage: 2, refill: 1.5 }, add: { charges: 15 }, set: { armorPierce: 1, slow: 0.3, slowDur: 1 } },
        { name: 'Iron Briar', blurb: "A briar of iron that shreds the road and mires everything on it.", cost: 3900, desc: 'x3 damage, x2.5 refill, x2 charges, bitten enemies slowed 50% for 2s.', mul: { damage: 3, refill: 2.5, charges: 2 }, set: { slow: 0.5, slowDur: 2 } },
      ] },
      { name: 'Flashmines', blurb: "Sows little mine-lamps on the road ahead of it that burst underfoot.", tiers: [
        { name: 'Lamp Seeds', blurb: "Sows a couple of mines on the road nearby.", cost: 110, desc: 'Keeps up to 2 mines on the path near it (one every 3s). Each bursts for 20 on up to 8 enemies within 40.', set: { mineMax: 2, mineEvery: 3, mineDmg: 20, mineRadius: 40, mineHits: 8, mineRange: 150 } },
        { name: 'Seedbed', blurb: "More mines, sown faster, bursting harder.", cost: 260, desc: 'Up to 4 mines, one every 2s, bursting for 30.', set: { mineMax: 4, mineEvery: 2, mineDmg: 30 } },
        { name: 'Flashmines', blurb: "A minefield: bright bursts all along the road.", cost: 800, desc: 'Up to 8 mines, one a second, bursting for 60 on up to 15 enemies within 50.', set: { mineMax: 8, mineEvery: 1, mineDmg: 60, mineRadius: 50, mineHits: 15, mineRange: 190 } },
        { name: 'Starfield', blurb: "The road glitters with mines that blast and stun.", cost: 4200, desc: 'Up to 16 mines, 2.5 a second, bursting for 80 on up to 25 enemies within 60 and stunning for 0.6s.', set: { mineMax: 16, mineEvery: 0.4, mineDmg: 80, mineRadius: 60, mineHits: 25, mineStun: 0.6, mineRange: 230 } },
      ] },
      { name: 'Binding Light', blurb: "Chains of light hold the Gloom in place, even the Heavy.", tiers: [
        { name: 'Snaring Light', blurb: "Holds whatever it bites for a moment.", cost: 100, desc: 'Bitten non-heavy enemies are held for 0.5s. x1.5 refill.', set: { rootDur: 0.5 }, mul: { refill: 1.5 } },
        { name: 'Chains of Light', blurb: "Holds longer, with more charges.", cost: 240, desc: 'Held for 0.9s. +6 charges, x1.5 refill.', set: { rootDur: 0.9 }, add: { charges: 6 }, mul: { refill: 1.5 } },
        { name: 'Binding Circle', blurb: "Each bite binds the crowd around it too.", cost: 850, desc: 'x2 damage, x1.5 refill. Held 1.2s, and a bite also holds up to 6 non-heavy enemies within 50 (once a second).', mul: { damage: 2, refill: 1.5 }, set: { rootDur: 1.2, rootRadius: 50, rootHits: 6 } },
        { name: 'Lightbound', blurb: "Chains strong enough to hold a Heavy.", cost: 4000, desc: 'x3 damage, x2 refill. Held 1.5s, up to 12 around each bite, and it holds a Heavy for 1.5s every 5s.', mul: { damage: 3, refill: 2 }, set: { rootDur: 1.5, rootHits: 12, heavyRoot: 1.5, heavyRootEvery: 5 } },
      ] },
    ],
  },

  moth: {
    name: 'Moth Lantern', role: 'Flyer lure', cost: 250, kind: 'lure',
    desc: 'Never attacks on its own. Gloomwings that fly near it leave their route and circle it for a few seconds, where every ward can hit them (Mortars and Rime Spires included).',
    base: { damage: 0, range: 110, type: 'radiant', lureMax: 5, lureDur: 3, lureImm: 4, hitsAir: true },
    paths: [
      { name: 'Bright Lure', blurb: "A brighter light that drags in whole flocks.", tiers: [
        { name: 'Brighter Paper', blurb: "Reaches further.", cost: 90, desc: '+25 range.', add: { range: 25 } },
        { name: 'Lamp Oil', blurb: "Holds more flyers for longer.", cost: 220, desc: 'Lures up to 9 at once, for 4s.', set: { lureMax: 9, lureDur: 4 } },
        { name: 'Moonlure', blurb: "A moon of a lantern: flocks circle it dazed and take more damage.", cost: 800, desc: 'Lures up to 18, x1.25 range. Circling flyers take +25% damage.', set: { lureMax: 18, lureAmp: 0.25 }, mul: { range: 1.25 } },
        { name: 'Great Lure', blurb: "Whole skies of Gloom turn and circle the light.", cost: 3800, desc: 'Lures up to 40 for 6s, x1.25 range. Circling flyers take +50% damage.', set: { lureMax: 40, lureDur: 6, lureAmp: 0.5 }, mul: { range: 1.25 } },
      ] },
      { name: 'Flypaper', blurb: "Lured flyers come away slowed and stuck low.", tiers: [
        { name: 'Sticky Wings', blurb: "Flyers it lets go are slowed.", cost: 100, desc: 'Released flyers are slowed 35% for 3s.', set: { releaseSlow: 0.35, releaseSlowDur: 3 } },
        { name: 'Gum Paper', blurb: "Holds them longer and slows them more.", cost: 240, desc: 'Lures for 4.5s. Released flyers slowed 50% for 4s.', set: { lureDur: 4.5, releaseSlow: 0.5, releaseSlowDur: 4 } },
        { name: 'Flypaper', blurb: "Released flyers stay grounded: every ward can hit them.", cost: 750, desc: 'Lures up to 8. Released flyers stay low for 6s, where every ward can hit them.', set: { lureMax: 8, groundDur: 6 } },
        { name: 'Glue Trap', blurb: "Nothing that touches the light flies properly again.", cost: 3600, desc: 'Lures up to 16 for 6s. Released flyers stay low for 12s and are slowed 60% for 6s.', set: { lureMax: 16, lureDur: 6, groundDur: 12, releaseSlow: 0.6, releaseSlowDur: 6 } },
      ] },
      { name: 'Moth-trap', blurb: "Moths swarm the circling flyers and burn them.", tiers: [
        { name: 'Moth Fire', blurb: "Moths sting the flyers it holds.", cost: 110, desc: 'Circling flyers take 15 Radiant damage/s.', set: { lureDps: 15 } },
        { name: 'Moth Swarm', blurb: "A thicker swarm that finds the Veiled too.", cost: 260, desc: '35 damage/s, and Veiled flyers it lures are revealed to every ward.', set: { lureDps: 35, lureReveal: true } },
        { name: 'Moth-trap', blurb: "A caged light: everything Veiled near it is laid bare.", cost: 850, desc: '90 damage/s. Reveals every Veiled enemy in its light to every ward.', set: { lureDps: 90, reveal: true, detect: true } },
        { name: 'Thousand Moths', blurb: "A storm of moths that burns flocks out of the sky.", cost: 4100, desc: '300 damage/s, lures up to 12, circling flyers take +25% damage.', set: { lureDps: 300, lureMax: 12, lureAmp: 0.25 } },
      ] },
    ],
  },

  wander: {
    name: 'Wandering Light', role: 'Roaming caster', cost: 325, kind: 'wander', target: 'first',
    desc: 'A floating light that roams near its post, chasing the Gloom and casting homing Arcane stars that burst on hit. Hits flyers. Select it and press R to move its post anywhere.',
    base: { damage: 10, rate: 1.2, range: 120, type: 'arcane', projSpeed: 480, pierce: 1, shots: 1, lights: 1, leash: 80, moveSpeed: 60, starRadius: 24, starHits: 3, starMul: 0.5, hitsAir: true },
    paths: [
      { name: 'Hunter', blurb: "Bigger stars, a staff, and finally a comet.", tiers: [
        { name: 'Bright Stars', blurb: "Each star hits twice as hard.", cost: 100, desc: 'x2 damage.', mul: { damage: 2 } },
        { name: 'Seeking Stars', blurb: "Roams further and faster, and hits harder still.", cost: 260, desc: 'x1.5 damage, +20 range, +40 roaming, +30 speed.', mul: { damage: 1.5 }, add: { range: 20, leash: 40, moveSpeed: 30 } },
        { name: 'Star Staff', blurb: "A crystal staff: stars burst wide at full strength.", cost: 850, desc: 'x2 damage. Stars burst for 75% damage on up to 6 enemies within 45 and ignore half of armour.', mul: { damage: 2 }, set: { starRadius: 45, starHits: 6, starMul: 0.75, armorPierce: 0.5 } },
        { name: 'Comet', blurb: "Casts comets that crash down on the crowd.", cost: 4300, desc: 'x2.5 damage, x1.3 rate, +60 roaming. Comets burst on up to 12 enemies within 70.', mul: { damage: 2.5, rate: 1.3 }, add: { leash: 60 }, set: { starRadius: 70, starHits: 12, comet: true } },
      ] },
      { name: 'Swarm', blurb: "Splits into several lights, each casting on its own.", tiers: [
        { name: 'Quick Wand', blurb: "Casts noticeably faster.", cost: 90, desc: 'x1.4 cast rate.', mul: { rate: 1.4 } },
        { name: 'Two Lights', blurb: "Splits into two lights.", cost: 280, desc: '2 lights, each casting at its own target.', set: { lights: 2 } },
        { name: 'Wisp Swarm', blurb: "Three lights, casting faster.", cost: 800, desc: '3 lights. x1.3 rate.', set: { lights: 3 }, mul: { rate: 1.3 } },
        { name: 'Starswarm', blurb: "Every light casts volleys of stars.", cost: 4000, desc: 'Each light casts 2 stars at once. x1.5 rate, x2 damage.', set: { shots: 2 }, mul: { rate: 1.5, damage: 2 } },
      ] },
      { name: 'Torchbearer', blurb: "Rose stars mark the Gloom, and its torch lifts nearby wards.", tiers: [
        { name: 'Rune Stars', blurb: "Stars mark their target: it takes more damage from every ward.", cost: 110, desc: 'Hits mark for 3s: +15% damage from everything.', set: { markPct: 0.15, markDur: 3 } },
        { name: 'Rose Torch', blurb: "Bigger marks, and wards near its post attack faster.", cost: 260, desc: 'Marks +25%. Wards within 100 of its post attack 10% faster.', set: { markPct: 0.25, torchRate: 0.1, torchRange: 100 } },
        { name: 'Torchbearer', blurb: "Marks spread through the pack, and the torch burns brighter.", cost: 900, desc: 'Marks +35% and spread within 50. Wards near its post attack 20% faster. x1.5 damage, sees Veiled.', set: { markPct: 0.35, markRadius: 50, torchRate: 0.2, detect: true }, mul: { damage: 1.5 } },
        { name: 'Lamplighter', blurb: "A great rose torch: every ward near it fights harder.", cost: 4000, desc: 'Marks +50%, spread within 80. Wards near its post attack 30% faster and deal 15% more. x2 damage.', set: { markPct: 0.5, markRadius: 80, torchRate: 0.3, torchDmg: 0.15, torchRange: 120 }, mul: { damage: 2 } },
      ] },
    ],
  },

  vault: {
    name: 'Ember Vault', role: 'Economy', cost: 400, kind: 'vault',
    desc: 'Never attacks. Gloom that die in its light drop embers into it, up to its cap. Stored embers earn interest each wave clear (10%, +2% for every wave you leave it, up to +10%), and interest can grow them to twice the cap. Select it and press R to cash out (the bonus starts again).',
    base: { damage: 0, range: 110, type: null, glean: 0.5, cap: 300, growth: 0.1 },
    paths: [
      { name: 'Great Brazier', blurb: "A bigger brazier that holds more and earns more interest.", tiers: [
        { name: 'Deep Pan', blurb: "Holds twice as much.", cost: 150, desc: 'Cap 600.', set: { cap: 600 } },
        { name: 'Banked Coals', blurb: "Holds more, and earns more interest.", cost: 350, desc: 'Cap 1,000. Interest 15% a wave.', set: { cap: 1000, growth: 0.15 } },
        { name: 'Great Brazier', blurb: "A roaring brazier that gathers more from each kill.", cost: 1000, desc: 'Cap 2,500. Interest 20% a wave. Gathers 75% of bounties.', set: { cap: 2500, growth: 0.2, glean: 0.75 } },
        { name: 'Everburning Hearth', blurb: "A hearth that never dims: a fortune for the patient.", cost: 4000, desc: 'Cap 6,000. Interest 25% a wave. Gathers 100% of bounties.', set: { cap: 6000, growth: 0.25, glean: 1 } },
      ] },
      { name: 'Gleaners', blurb: "Ember-wisps gather from further and further away.", tiers: [
        { name: 'Long Tongs', blurb: "Gathers from further away.", cost: 120, desc: '+30 range.', add: { range: 30 } },
        { name: 'Ember Wisps', blurb: "Wisps fetch embers from further still.", cost: 300, desc: '+30 range. Gathers 75% of bounties.', add: { range: 30 }, set: { glean: 0.75 } },
        { name: 'Gleaners', blurb: "A flock of wisps gathers from a wide field.", cost: 900, desc: 'x1.5 range. Gathers 100% of bounties. +500 cap.', mul: { range: 1.5 }, add: { cap: 500 }, set: { glean: 1 } },
        { name: 'Harvest Moon', blurb: "Embers drift to it from every kill on the map.", cost: 3800, desc: 'Gathers from every kill on the map (half rate outside its light). Gathers 125%. +1,500 cap.', add: { cap: 1500 }, set: { glean: 1.25, gleanAll: true } },
      ] },
      { name: 'Hearthwarm', blurb: "While it is well stocked, nearby wards fight faster.", tiers: [
        { name: 'Warm Coals', blurb: "Over half full, wards in its light attack a little faster.", cost: 130, desc: 'While over half full: wards in range attack 8% faster.', set: { warmRate: 0.08, warmAt: 0.5 } },
        { name: 'Hearth', blurb: "A warmer glow.", cost: 320, desc: 'Wards in range attack 15% faster while it is over half full.', set: { warmRate: 0.15 } },
        { name: 'Hearthwarm', blurb: "Warms from a quarter full, and wards hit harder too.", cost: 950, desc: 'While over a quarter full: wards in range attack 25% faster and deal 10% more.', set: { warmRate: 0.25, warmDmg: 0.1, warmAt: 0.25 } },
        { name: 'Heart of the Hearth', blurb: "A blazing heart that drives every ward around it.", cost: 4200, desc: 'Wards in range attack 35% faster and deal 20% more. x1.3 range.', set: { warmRate: 0.35, warmDmg: 0.2 }, mul: { range: 1.3 } },
      ] },
    ],
  },
};

// ---- Tier 5: the capstones -------------------------------------------------------------------
// One per path (docs/tier5-design.md). A tier 5 costs about 4.5x its tier 4 and is about 3-5x as
// strong, with a signature mechanic of its own (not just bigger numbers). Only one of each tier 5
// may stand on the map at a time (RULES.uniqueTier5): one Worldpiercer, one Grand Battery, ...
//
// Signature stats (tier 5 only)
//   bolt     rendEvery/rendMul/rendStun (every Nth bolt is a giant stunning lance), splitKill/
//            splitRate (bolts that kill split into new bolts), hawkEvery/hawkMul (a spirit-hawk dives on
//            the toughest enemy on the map), executeHeavy (marked hulks under this share are executed)
//   mortar   quakeEvery/quakeMul/quakeRadius/quakeHits/quakeStun (every Nth shell is a huge stunning
//            blast), magma/eruptDmg/eruptRadius/eruptRate (pools slow, and Gloom dying in them erupt)
//   pulse    freezeHeavy (s a hulk is frozen), bossSlow, shatterChain (shatter blasts chill and can
//            shatter again), waveEvery (s between map-wide frost waves), globalReveal
//   chain    stagger (s a struck hulk is stunned by a thunderbolt), orbEvery/orbLife/orbHits/orbRadius/
//            orbMul (ball lightning rolling back up the path), field/fieldMul/fieldHits (a storm field)
//   snipe    pctHeavy/pctBoss (share of a hulk's / boss's full health per shot), shrapnel (second
//            bursts), doom/doomPct (the N toughest enemies on the map take +% from everything)
//   flame    phoenix/phoenixMul (a phoenix sweeps the path near it), wyrmEvery/wyrmLen/wyrmDps/wyrmDur
//            (a river of fire down the road), pall/pallAmp (every enemy on the map is Scorched)
//   beam     pierceBeam (share of the beam's power to everything along it at full charge), web (threads
//            between beam targets), sunEvery/sunHits/sunMul (a flare over its range at this share of the full-charge beam)
//   aura     cryEvery/cryDur/cryRate (battle cry: wards inside fire faster for a moment), auraGlobal,
//            discount (every upgrade below tier 5 costs this much less)
//   snare    rebite (s: enemies standing on it are bitten again), mineChain (mines within this burst
//            together), sealEvery/sealDur/sealBoss/sealRange/sealAmp (binds the strongest enemy near it)
//   lure     lureGlobal (every flyer on the map), releaseHold (s held still on release), mothAll/mothHits
//            (moths sting ground enemies in range too, at this share)
//   wander   skyEvery/skyMul/skyRadius/skyHits/skyStun (every Nth cast is a falling star), starBounce,
//            markBurst/markBurstRate (marked Gloom that die mark everything around them)
//   vault    hoardBonus/hoardMin (cash-outs over hoardMin pay this much extra), gleanFull (full rate from
//            anywhere), autoCash (empties at each wave clear), guard (embers spent per life saved)
const TIER5 = {
  bolt: [
    { name: 'Worldpiercer', blurb: "A walking siege engine: every third lance is colossal and stuns all it passes.", cost: 19000, desc: 'x1.8 damage, x1.2 rate. Every 3rd shot is a Worldpiercer: x3 damage, and everything it passes through is stunned 0.6s (hulks 0.25s, not bosses).', mul: { damage: 1.8, rate: 1.2 }, set: { rendEvery: 3, rendMul: 3, rendStun: 0.6, boltSize: 4 } },
    { name: 'Thousand Bolts', blurb: "Bolts that kill split into two more, again and again: a storm that feeds on crowds.", cost: 17500, desc: 'x2.5 damage, x1.3 rate. A bolt that kills splits into 2 new bolts (up to 3 generations, 40 splits a second).', mul: { damage: 2.5, rate: 1.3 }, set: { splitKill: 2, splitRate: 40 } },
    { name: 'Wild Hunt', blurb: "A great spirit-hawk hunts the whole map, and marked hulks near death are executed too.", cost: 16000, desc: 'x2 damage, x1.2 rate. Every second a spirit-hawk dives on the toughest enemy anywhere for x8 damage, marking all around it. Marked enemies under 33% health are executed, and hulks under 15% (not bosses).', mul: { damage: 2, rate: 1.2 }, set: { hawkEvery: 1, hawkMul: 8, execute: 0.33, executeHeavy: 0.15 } },
  ],
  mortar: [
    { name: 'Worldbreaker', blurb: "Every fourth shell is a falling mountain that stuns everything under it.", cost: 21000, desc: 'x1.8 damage, x1.15 rate. Every 4th shell is a Worldbreaker: x3 damage, x1.6 radius, up to 160 enemies, stunning 2s (hulks 0.5s, not bosses).', mul: { damage: 1.8, rate: 1.15 }, set: { quakeEvery: 4, quakeMul: 3, quakeRadius: 1.6, quakeHits: 160, quakeStun: 2 } },
    { name: 'Grand Battery', blurb: "A whole battery that reaches anywhere on the map.", cost: 20000, desc: 'Reaches anywhere on the map (no blind spot). 10 shells per volley, x1.3 rate, x1.5 damage.', mul: { rate: 1.3, damage: 1.5 }, set: { global: true, minRange: 0, shells: 10 } },
    { name: 'Magma Heart', blurb: "Fire pools turn to magma that mires the Gloom, and what dies in it erupts.", cost: 20000, desc: 'x1.5 shell damage. Pools are magma: 140 damage/s for 9s, slowing 40%. Gloom that die in magma erupt for 80 within 55 (up to 15 a second).', mul: { damage: 1.5 }, set: { poolDps: 140, poolDur: 9, magma: 0.4, eruptDmg: 80, eruptRadius: 55, eruptRate: 15 } },
  ],
  rime: [
    { name: 'Permafrost', blurb: "Every pulse freezes, deep enough to freeze hulks and stall bosses.", cost: 17500, desc: 'Every pulse freezes for 2s, and frozen enemies take +100% damage. Hulks freeze for 1s, bosses are slowed 50%. x2.5 damage, x1.25 rate.', mul: { damage: 2.5, rate: 1.25 }, set: { freezeEvery: 1, freezeDur: 2, frozenAmp: 1, freezeHeavy: 1, bossSlow: 0.5 } },
    { name: 'Avalanche', blurb: "Shatters set off more shatters: one death can sweep a frozen crowd.", cost: 19000, desc: 'x3 damage. Shatters deal 500 within 85 (up to 50 a second), and everything a shatter hits is chilled and can shatter in turn.', mul: { damage: 3 }, set: { shatterDmg: 500, shatterRadius: 85, shatterRate: 50, shatterChain: true } },
    { name: 'Whiteout', blurb: "A blizzard over the whole map: everything slowed, nothing hidden.", cost: 17000, desc: 'Every enemy on the map is slowed 35% and Veiled enemies are revealed to every ward. Every 4s a frost wave hits every enemy on the map for its pulse damage. x2 damage.', mul: { damage: 2 }, set: { globalSlow: 0.35, globalReveal: true, waveEvery: 4 } },
  ],
  coil: [
    { name: 'Stormlord', blurb: "Every strike is a thunderbolt, and thunderbolts stagger hulks.", cost: 22000, desc: 'Every strike calls a thunderbolt (x5, blast within 110). Hulks and bosses take x3, and a thunderbolt stuns a hulk 0.4s. x1.4 damage, x1.2 rate.', mul: { damage: 1.4, rate: 1.2 }, set: { smiteEvery: 1, smiteMul: 5, smiteRadius: 110, heavyMul: 3, stagger: 0.4 } },
    { name: 'Ball Lightning', blurb: "Releases orbs of ball lightning that roll back up the road, arcing into everything.", cost: 21000, desc: 'x2 damage, x1.2 rate. Every 1.2s an orb of ball lightning rolls up the path from near the coil for 7s, arcing into 6 enemies within 80 every 0.4s for 80% damage.', mul: { damage: 2, rate: 1.2 }, set: { orbEvery: 1.2, orbLife: 7, orbHits: 6, orbRadius: 80, orbMul: 0.8 } },
    { name: 'Eye of the Storm', blurb: "A storm field: everything near it is Charged, slowed and shocked constantly.", cost: 20000, desc: 'Everything in range takes a shock (a third of its damage) 4 times a second and is Charged: +60% Arcane damage taken, 35% slower. Stun chance 40%. x1.5 damage, x1.2 rate.', mul: { damage: 1.5, rate: 1.2 }, set: { field: true, fieldMul: 0.35, fieldHits: 40, chargedPct: 0.6, chargedSlow: 0.35, chargedDur: 3, stunChance: 0.4 } },
  ],
  longeye: [
    { name: 'Kingslayer', blurb: "Each shot tears a share of a hulk's or boss's whole health away.", cost: 20500, desc: 'x2 damage, x1.3 rate. Shots at hulks also deal 3% of their full health, and at bosses 1.2%. Hulks are staggered 0.35s, bosses slowed 30%.', mul: { damage: 2, rate: 1.3 }, set: { pctHeavy: 0.03, pctBoss: 0.012, stagger: 0.35 } },
    { name: 'Shrapnel Storm', blurb: "Every burst throws shrapnel that bursts again: whole flocks fall.", cost: 19500, desc: 'x2 damage, x1.3 rate. Each burst throws shrapnel at 5 more enemies nearby, each bursting again for half damage.', mul: { damage: 2, rate: 1.3 }, set: { shrapnel: 5, flakHits: 50 } },
    { name: 'Eye of Fate', blurb: "It picks out the toughest Gloom on the map and dooms them for every ward.", cost: 18000, desc: 'The 10 toughest enemies on the map are Doomed: +60% damage from everything, and they can\'t hide. x2.5 damage, x1.2 rate.', mul: { damage: 2.5, rate: 1.2 }, set: { doom: 10, doomPct: 0.6 } },
  ],
  censer: [
    { name: 'Phoenix', blurb: "A phoenix rises from the pyre and sweeps the road, setting everything ablaze.", cost: 19000, desc: 'A phoenix flies up and down the path near it, burning everything within 36 (ground and air) for x3 flame damage and setting it alight. Flames x2, burns x2.', mul: { damage: 2, burnDps: 2 }, set: { phoenix: true, phoenixMul: 3 } },
    { name: 'Elder Wyrm', blurb: "Every few seconds it pours a river of dragonfire down the road.", cost: 20000, desc: 'x2 flame damage. Every 6s it breathes a river of fire 280 long up the path: 250 Fire damage/s for 5s.', mul: { damage: 2 }, set: { wyrmEvery: 6, wyrmLen: 280, wyrmDps: 250, wyrmDur: 5 } },
    { name: 'Pall of Ash', blurb: "Ash falls on the whole map: every enemy is Scorched and branded.", cost: 18000, desc: 'Every enemy on the map is Scorched and branded (no healing or shields, no resistances) and takes +25%; inside its flame, +60%. x2.5 flame damage.', mul: { damage: 2.5 }, set: { pall: true, pallAmp: 0.25, searAmp: 0.6 } },
  ],
  prism: [
    { name: 'Dawnbreaker', blurb: "Charges to x30, and at full charge the beam burns through everything in its line.", cost: 22500, desc: 'x2 damage, charge up to x30. At full charge, everything along the beam takes 40% of its power.', mul: { damage: 2 }, set: { maxCharge: 30, pierceBeam: 0.4 } },
    { name: 'Lightweb', blurb: "Twelve beams, their targets joined by threads of light that burn what crosses them.", cost: 20500, desc: '12 beams, x1.8 damage. Each target is joined to the next by a thread of light that deals a quarter of a full beam to everything on it.', mul: { damage: 1.8 }, set: { beams: 12, web: 0.25 } },
    { name: 'Second Sun', blurb: "A second sun hangs over it and flares, burning everything in range.", cost: 20000, desc: 'x2 damage. Every 2.5s its sun flares: up to 40 enemies in range take 60% of the beam\'s full-charge damage/s.', mul: { damage: 2 }, set: { sunEvery: 2.5, sunHits: 40, sunMul: 0.6 } },
  ],
  beacon: [
    { name: 'Anthem of War', blurb: "A war-anthem: wards inside fight far harder, and every 15s they fire twice as fast.", cost: 20000, desc: 'Wards inside attack 70% faster and deal 50% more. Every 15s a battle cry: x2 attack speed for 4s. x1.15 radius.', mul: { range: 1.15 }, set: { auraRate: 0.7, auraDmg: 0.5, cryEvery: 15, cryDur: 4, cryRate: 2 } },
    { name: 'Worldlight', blurb: "Its light covers the whole map: every ward sees all, hits flyers and reaches further.", cost: 17000, desc: 'Every ward on the map gets +40% range, sees Veiled enemies and can hit flyers. Every Veiled enemy is revealed.', set: { auraGlobal: true, auraRange: 0.4, auraDetect: true, auraAir: true, globalReveal: true } },
    { name: 'Golden Age', blurb: "A golden age: a fortune every wave, and every upgrade costs less.", cost: 18000, desc: '+1,000 gold each wave, plus 8% of your banked gold (up to 2,000). Upgrades up to tier 4 cost 15% less.', set: { tithe: 1000, interest: 0.08, interestCap: 2000, discount: 0.15 } },
  ],
  snare: [
    { name: 'Thornwall', blurb: "A wall of iron briars: whatever stands on it is bitten again and again.", cost: 17500, desc: 'x2 damage, x2 charges, x2 refill. Enemies on it are slowed 80% and bitten again every 0.5s while they stand on it.', mul: { damage: 2, charges: 2, refill: 2 }, set: { rebite: 0.5, slow: 0.8, slowDur: 1 } },
    { name: 'Constellation', blurb: "Mines link into constellations: when one bursts, its neighbours burst too.", cost: 19000, desc: 'Up to 30 mines, 5 a second, reaching 320. Bursts deal 160 on up to 35 within 70 and stun 0.6s, and set off every mine within 150.', set: { mineMax: 30, mineEvery: 0.2, mineDmg: 160, mineRadius: 70, mineHits: 35, mineRange: 320, mineChain: 150 } },
    { name: 'Seal of Dawn', blurb: "A great seal that binds even bosses, and bound Gloom take more from every ward.", cost: 18000, desc: 'Every 8s it binds the strongest enemy within 240 for 3s (bosses 1.5s); bound enemies take +50% damage. Holds a Heavy every 3s. x2 damage.', mul: { damage: 2 }, set: { sealEvery: 8, sealDur: 3, sealBoss: 1.5, sealRange: 240, sealAmp: 0.5, heavyRootEvery: 3 } },
  ],
  moth: [
    { name: 'False Moon', blurb: "A false moon: every flyer on the map turns to circle it.", cost: 17000, desc: 'Lures flyers from anywhere on the map, up to 80 at once. Circling flyers take +80% damage.', set: { lureGlobal: true, lureMax: 80, lureAmp: 0.8 } },
    { name: 'Amber Trap', blurb: "Flyers it holds set in amber: held still, then grounded for good.", cost: 16000, desc: 'Lures up to 30. Released flyers are held still for 2.5s and never fly high again. Circling flyers take +35% damage.', set: { lureMax: 30, releaseHold: 2.5, groundDur: 9999, lureAmp: 0.35 } },
    { name: 'Moth Queen', blurb: "A Moth Queen leads the swarm: its moths sting everything in its light.", cost: 18500, desc: '900 damage/s to circling flyers, lures up to 20, and its moths sting up to 30 ground enemies in its light for 30% of that.', set: { lureDps: 900, lureMax: 20, mothAll: 0.3, mothHits: 30 } },
  ],
  wander: [
    { name: 'Falling Sky', blurb: "Every fourth cast pulls a star out of the sky onto the crowd.", cost: 19500, desc: 'x1.6 damage. Every 4th cast is a falling star: x4 damage that bursts on up to 30 enemies within 130 and stuns them 1s (not hulks).', mul: { damage: 1.6 }, set: { skyEvery: 4, skyMul: 4, skyRadius: 130, skyHits: 30, skyStun: 1 } },
    { name: 'Starhost', blurb: "Five lights, each casting volleys of stars that leap to a second target.", cost: 18000, desc: '5 lights. x2.2 damage, x1.2 rate. Stars leap on to a second enemy after they hit.', mul: { damage: 2.2, rate: 1.2 }, set: { lights: 5, starBounce: 1 } },
    { name: 'Dawnbringer', blurb: "A great torch: nearby wards fight much harder, and marked deaths spread the mark.", cost: 18000, desc: 'Wards within 180 of its post attack 45% faster and deal 30% more. Marked Gloom that die mark everything within 80 (up to 10 a second). x2 damage.', mul: { damage: 2 }, set: { torchRate: 0.45, torchDmg: 0.3, torchRange: 180, markBurst: 80, markBurstRate: 10 } },
  ],
  vault: [
    { name: "Dragon's Hoard", blurb: "A dragon's hoard: a vast cap, high interest, and big cash-outs pay extra.", cost: 18000, desc: 'Cap 20,000. Interest 30% a wave. Cashing out 5,000 or more pays 20% extra.', set: { cap: 20000, growth: 0.3, hoardBonus: 0.2, hoardMin: 5000 } },
    { name: 'Ember Tide', blurb: "Embers flow from every kill at full rate, and it pays out every wave.", cost: 17000, desc: 'Gathers 250% of bounties from every kill on the map, at full rate. +4,000 cap. Empties into your gold at each wave clear.', add: { cap: 4000 }, set: { glean: 2.5, gleanFull: true, autoCash: true } },
    { name: 'Second Heartfire', blurb: "Always warm, and it guards the Heartfire with its embers.", cost: 19000, desc: 'Always warm: wards in range attack 50% faster and deal 35% more. When an enemy gets through, it pays 40 embers for each life instead of you.', set: { warmRate: 0.5, warmDmg: 0.35, warmAt: 0, guard: 40 } },
  ],
};
for (const type in TIER5) TIER5[type].forEach((t5, pi) => TOWERS[type].paths[pi].tiers.push(t5));
