// The five wards of round 2 (docs/new-wards-2.md, decided 2026-11-27): two premium wards (the
// Heartfire Avatar and the Astral Choir: stronger and dearer, no limit on how many), two water
// wards (the Ferrylight and the Undertow: placed on ponds, lava on Ashfork, frozen lakes on
// Rimecoil) and a road-maker (the Lampwright). Merged into TOWERS by data/towers.js; the same
// upgrade rules, `blurb`/`desc` split and tier 5 rule apply.
//
// Stat glossary (the simulation is sim/newwards.js)
//   avatar  damage per mote, rate (motes/s, one stream at its target), sight (sees Veiled within this)
//           heatAt/flareDmg/flareRadius/flarePct/flarePctBoss (Heat: motes heat their target, at heatAt
//           it bursts), sunMark/sunMarkDur (+% damage taken after a flare), heatCarry, zenithStep/zenithMax
//           stars/starRate/starAir/starModes (Orrery: stars firing on their own targets), lend (stars it can lend)
//           tethers/tetherRange/tetherBonus/tetherDrain/tetherSight (Eclipse), syzygyEvery/syzygyMul
//   choir   damage per note to every enemy within range (at most maxHits), rate (notes/s), hush (no haste
//           inside the song), cresEvery/cresMul/cresStun (crescendo on the strongest), bellRadius/bellNoPhase,
//           echoMul/echoDelay (Echo, map-wide), wispChance/wispDmg/wispPierce/wispMax/wispReveal/wispStrip,
//           redeem (s a redeemed hulk walks back)
//   ferry   (water) bolts: damage, rate, projSpeed, pierce, armorPierce; drag (px a hit drags its first
//           target back), dragChain, heavySlow, anchor/anchorBoss (s chained to the raft)
//           rafts/raftRange/raftRate/raftPatrol/raftSpeed/shoreParty (Flotilla)
//           beamArc/beamLen/dazzle/dazzleAmp/dazzleBoss/beamHush/twinBeams/harbourStop/harbourStopBoss/
//           revealHold (Lighthouse Barge: a sweeping beam that Dazzles what it lights)
//   undertow (water) a whirlpool on the nearest road: damage (dps), whirlRadius, slow, pull (px/s back),
//           whirlAmp, spin, spoutEvery/spoutBack/spoutAir; waveEvery/waveLen/waveBack/waves/waveHeavy,
//           breakEvery/breakLen; deep (centre dps), grip, abyssEvery, drown (Heavies %hp/s),
//           deepBoss/deepNoHeal
//   lamp    candles thrown on the road ahead of the Gloom: rate (throws/s), tossN, candleMax, candleLife,
//           candleR, damage (burn dps), burnDur, searDur (Scorched), waxSlow, taper/taperR/taperMul,
//           wildwick, candleReveal, candleSlow, candleSight, vigilAmp/vigilR, vigilLine
//           (map-wide cap: RULES.candleCap)

export const NEW_ORDER = ['avatar', 'choir', 'ferry', 'undertow', 'lamp'];

export const NEW_TOWERS = {
  avatar: {
    name: 'Heartfire Avatar', role: 'Premium: relentless single target', cost: 900, kind: 'avatar', target: 'strong', premium: true,
    desc: 'A shard of the Heartfire given form. It pours a torrent of Radiant motes into one enemy (ignores resistances) and hits flyers. Its glow sees Veiled close by. A premium ward: stronger and dearer than most.',
    base: { damage: 10, rate: 8, range: 200, type: 'radiant', sight: 110, hitsAir: true },
    paths: [
      { name: 'Solar', blurb: 'The motes heat their target until it bursts in a solar flare.', tiers: [
        { name: 'Kindled Core', blurb: 'Hotter motes.', cost: 180, desc: 'x1.5 damage.', mul: { damage: 1.5 } },
        { name: 'Heat', blurb: 'Motes build Heat; enough of it bursts into a flare.', cost: 420, desc: 'Each mote adds 1 Heat to its target. At 12 Heat it flares: 60 Radiant damage to everything within 40.', set: { heatAt: 12, flareDmg: 60, flareRadius: 40 } },
        { name: 'Solar Flare', blurb: 'Bigger, quicker flares that tear a share of the target away.', cost: 1500, desc: 'Flares at 10 Heat for 180 within 55, plus 3% of the target\'s full health (1% for bosses).', set: { heatAt: 10, flareDmg: 180, flareRadius: 55, flarePct: 0.03, flarePctBoss: 0.01 } },
        { name: 'Noonfire', blurb: 'Flares leave the Gloom sun-marked and soft for every ward.', cost: 7000, desc: 'x2 damage. Flares deal 720, and what they hit takes +15% damage from every ward for 3s.', set: { flareDmg: 720, sunMark: 0.15, sunMarkDur: 3 }, mul: { damage: 2 } },
      ] },
      { name: 'Orrery', blurb: 'A court of stars, each firing on its own target.', tiers: [
        { name: 'First Star', blurb: 'A star orbits it and fires at a second target.', cost: 180, desc: 'One star, firing 3 motes/s at its own target.', set: { stars: 1, starRate: 3 } },
        { name: 'Twin Stars', blurb: 'Two stars, and a longer reach.', cost: 420, desc: '2 stars. x1.5 damage, +20 range.', set: { stars: 2 }, add: { range: 20 }, mul: { damage: 1.5 } },
        { name: 'Orrery', blurb: 'Four stars on a brass armillary, each with its own targeting.', cost: 1500, desc: '4 stars (First, Strong, Close, Flyers), 4 motes/s each. Stars deal x2 to flyers. x2 damage.', set: { stars: 4, starRate: 4, starAir: 2, starModes: true }, mul: { damage: 2 } },
        { name: 'Starwheel', blurb: 'Six stars, firing twice as fast.', cost: 7000, desc: '6 stars, 6 motes/s each. x3 damage, x1.5 rate.', set: { stars: 6, starRate: 6 }, mul: { damage: 3, rate: 1.5 } },
      ] },
      { name: 'Eclipse', blurb: 'It feeds on the light of the wards around it.', tiers: [
        { name: 'Penumbra', blurb: 'Tethers to nearby wards and grows stronger for each.', cost: 180, desc: 'Tethers to up to 6 wards within 120: +6% damage each. Tethered wards lose 3%.', set: { tethers: 6, tetherRange: 120, tetherBonus: 0.06, tetherDrain: 0.03 } },
        { name: 'Umbra', blurb: 'More tethers, reaching further.', cost: 420, desc: 'Up to 8 tethers, +8% each, reaching 145. x1.5 damage.', set: { tethers: 8, tetherBonus: 0.08, tetherRange: 145 }, mul: { damage: 1.5 } },
        { name: 'Eclipse', blurb: 'Its tethered wards stop paying, and share its sight.', cost: 1500, desc: 'Tethered wards no longer lose damage, and Veiled within its sight are revealed to every ward. x2 damage.', set: { tetherDrain: 0, tetherSight: true }, mul: { damage: 2 } },
        { name: 'Total Eclipse', blurb: 'Feeds on up to ten wards.', cost: 7000, desc: 'Up to 10 tethers, +10% each. x2.5 damage.', set: { tethers: 10, tetherBonus: 0.1 }, mul: { damage: 2.5 } },
      ] },
    ],
  },

  choir: {
    name: 'Astral Choir', role: 'Premium: song over a third of the map', cost: 850, kind: 'choir', premium: true,
    desc: 'A circle of celestial singers. Every note strikes every enemy in its huge song, flyers and Veiled included, and no Gloom inside the song can be hastened by a Herald. A premium ward: stronger and dearer than most.',
    base: { damage: 8, rate: 0.83, range: 230, type: 'arcane', maxHits: 80, hush: true, hitsAir: true },
    paths: [
      { name: 'Hymn', blurb: 'The notes build to one crushing crescendo.', tiers: [
        { name: 'Deeper Voice', blurb: 'Every note hits harder.', cost: 170, desc: 'x1.4 damage.', mul: { damage: 1.4 } },
        { name: 'Rising Hymn', blurb: 'Every few notes, a crescendo on the strongest enemy.', cost: 400, desc: 'x1.5 damage. Every 6th note is a crescendo: x10 on the strongest enemy in the song.', set: { cresEvery: 6, cresMul: 10 }, mul: { damage: 1.5 } },
        { name: 'Crescendo', blurb: 'More often, far harder, and it stuns.', cost: 1400, desc: 'x2.5 damage. Every 4th note, x25, and it stuns for 1s (Heavies are slowed 50% instead).', set: { cresEvery: 4, cresMul: 25, cresStun: 1 }, mul: { damage: 2.5 } },
        { name: 'Grand Crescendo', blurb: 'Every third note brings the house down.', cost: 6600, desc: 'x3 damage. Every 3rd note, x40.', set: { cresEvery: 3, cresMul: 40 }, mul: { damage: 3 } },
      ] },
      { name: 'Chorus', blurb: 'More singers, faster notes.', tiers: [
        { name: 'Second Voice', blurb: 'Sings more often.', cost: 170, desc: 'x1.3 note rate.', mul: { rate: 1.3 } },
        { name: 'Quartet', blurb: 'Five singers, and a wider song.', cost: 400, desc: 'x1.23 note rate (x1.6 in all), x1.3 damage. +20 range.', mul: { rate: 1.23, damage: 1.3 }, add: { range: 20 } },
        { name: 'Choir Stalls', blurb: 'Seven singers, faster still.', cost: 1400, desc: 'x1.375 note rate (x2.2 in all), x1.6 damage.', mul: { rate: 1.375, damage: 1.6 } },
        { name: 'Massed Choir', blurb: 'A whole choir: notes come in a flood.', cost: 6600, desc: 'x1.6 note rate (x3.5 in all), x2.2 damage.', mul: { rate: 1.6, damage: 2.2 } },
      ] },
      { name: 'Requiem', blurb: 'The Gloom it kills are freed as wisps that fly back down the road.', tiers: [
        { name: 'Gentle Requiem', blurb: 'Some of what dies in the song is freed and strikes back.', cost: 170, desc: '15% of kills in the song free a wisp that flies back up the road and strikes the first enemy it meets for 30.', set: { wispChance: 0.15, wispDmg: 30, wispPierce: 1, wispMax: 20 } },
        { name: 'Lament', blurb: 'More wisps, flying through two enemies.', cost: 400, desc: '30% of kills; wisps pass through 2 enemies.', set: { wispChance: 0.3, wispPierce: 2 } },
        { name: 'Requiem', blurb: 'Every death frees a wisp, and wisps light up the hidden.', cost: 1400, desc: 'Every kill frees a wisp (up to 20 at once). Wisps reveal the Veiled they pass and strip a layer. x1.5 damage.', set: { wispChance: 1, wispReveal: true, wispStrip: true }, mul: { damage: 1.5 } },
        { name: 'Homecoming', blurb: 'Wisps fly through whole lines of Gloom.', cost: 6600, desc: 'Wisps pass through 4 enemies for 60. x3 damage.', set: { wispPierce: 4, wispDmg: 60 }, mul: { damage: 3 } },
      ] },
    ],
  },

  ferry: {
    name: 'Ferrylight', role: 'Water: raft gunner', cost: 400, kind: 'ferry', target: 'first', water: true,
    desc: 'A lantern-lit raft that floats on water (lava on Ashfork, broken ice on Rimecoil). Its keeper throws boathook bolts at the Gloom on the road, flyers included. Place it on a pond.',
    base: { damage: 12, rate: 1, range: 165, type: 'kinetic', projSpeed: 700, pierce: 1, hitsAir: true },
    paths: [
      { name: 'Harpooner', blurb: 'Piercing harpoons that drag the Gloom back up the road.', tiers: [
        { name: 'Barbed Hook', blurb: 'Hooks hit harder and pierce.', cost: 100, desc: 'x1.5 damage, pierce 2.', mul: { damage: 1.5 }, set: { pierce: 2 } },
        { name: 'Harpoon', blurb: 'Harpoons drag their first victim back.', cost: 240, desc: 'Pierce 4. The first enemy hit is dragged 30 back up the road (not Heavies).', set: { pierce: 4, drag: 30 } },
        { name: 'Harpoon Gun', blurb: 'A deck gun on a winch: through armour, dragging further.', cost: 800, desc: 'x2.5 damage, ignores armour, drags 60. Heavies are slowed 40% for 1.5s instead.', mul: { damage: 2.5 }, set: { armorPierce: 1, drag: 60, heavySlow: 0.4 } },
        { name: 'Whaler', blurb: 'Drags whole chains of Gloom back.', cost: 4000, desc: 'Drags 90, and up to 3 enemies per harpoon.', set: { drag: 90, dragChain: 3 } },
      ] },
      { name: 'Flotilla', blurb: 'It launches little light-rafts that patrol the water and fire.', tiers: [
        { name: 'Oarsman', blurb: 'Throws faster.', cost: 90, desc: 'x1.3 rate.', mul: { rate: 1.3 } },
        { name: 'Light-raft', blurb: 'A light-raft patrols the water and fires its own bolts.', cost: 260, desc: 'One raft patrols the pond, firing its own bolts (range 140). x1.3 damage.', set: { rafts: 1, raftRange: 140, raftRate: 1, raftPatrol: 60, raftSpeed: 40 }, mul: { damage: 1.3 } },
        { name: 'Flotilla', blurb: 'Three rafts, roaming further.', cost: 800, desc: '3 rafts, patrolling up to 300 away (on water). x1.8 damage.', set: { rafts: 3, raftPatrol: 300 }, mul: { damage: 1.8 } },
        { name: 'Lantern Fleet', blurb: 'Five quicker rafts.', cost: 4000, desc: '5 rafts, faster and firing twice as often. x2.5 damage.', set: { rafts: 5, raftSpeed: 70, raftRate: 2 }, mul: { damage: 2.5 } },
      ] },
      { name: 'Lighthouse Barge', blurb: 'A sweeping beam that Dazzles the Gloom it lights.', tiers: [
        { name: 'Signal Lamp', blurb: 'Reaches further.', cost: 100, desc: '+25 range.', add: { range: 25 } },
        { name: 'Lamp Mast', blurb: 'A lamp sweeps the road, slowing what it lights and showing the hidden.', cost: 250, desc: 'A lamp sweeps a 30° arc back and forth. Gloom in it are Dazzled (20% slower, Heavies too), and Veiled in it are revealed while lit. x1.5 damage.', set: { beamArc: 0.52, beamLen: 1, dazzle: 0.2 }, mul: { damage: 1.5 } },
        { name: 'Lighthouse', blurb: 'A lighthouse: a longer beam, and the Dazzled take more damage.', cost: 850, desc: 'The beam reaches further (x1.25). Dazzled 35% slower and take +15% damage from every ward. x2.5 damage.', set: { beamLen: 1.25, dazzle: 0.35, dazzleAmp: 0.15 }, mul: { damage: 2.5 } },
        { name: 'Great Light', blurb: 'Even bosses stagger, and Heralds lose their song.', cost: 4100, desc: 'Dazzled 45% slower (bosses at half strength). A Herald in the beam loses its haste aura while lit. x3 damage.', set: { dazzle: 0.45, dazzleBoss: 0.5, beamHush: true }, mul: { damage: 3 } },
      ] },
    ],
  },

  undertow: {
    name: 'The Undertow', role: 'Water: whirlpool on the road', cost: 450, kind: 'undertow', water: true,
    desc: 'A lake spirit that twists the nearest stretch of road into a whirlpool: Gloom in it are slowed, pulled back and chilled. Never touches flyers. Place it on a pond; select it and press R to move its whirlpool.',
    base: { damage: 4, range: 150, type: 'frost', whirlRadius: 40, slow: 0.35, pull: 12, hitsAir: false },
    paths: [
      { name: 'Maelstrom', blurb: 'Bigger, crueller whirlpools.', tiers: [
        { name: 'Strong Current', blurb: 'A stronger pull and a deeper slow.', cost: 100, desc: 'Slow 45%, pulls back 18/s.', set: { slow: 0.45, pull: 18 } },
        { name: 'Whirlpool', blurb: 'A wider whirl that softens everything in it.', cost: 260, desc: 'Radius 55, 12 damage/s. Gloom inside take +15% from everything.', set: { whirlRadius: 55, damage: 12, whirlAmp: 0.15 } },
        { name: 'Maelstrom', blurb: 'A maelstrom: small Gloom spin helplessly as they enter.', cost: 850, desc: 'Radius 70, 20 damage/s, pulls 30/s. Small Gloom spin in place for 1s as they enter.', set: { whirlRadius: 70, damage: 20, pull: 30, spin: 1 } },
        { name: 'Great Whirl', blurb: 'A great whirl that drowns the road.', cost: 4200, desc: 'Radius 85, 40 damage/s.', set: { whirlRadius: 85, damage: 40 } },
      ] },
      { name: 'Tidecaller', blurb: 'Waves surge across the road, knocking crowds back.', tiers: [
        { name: 'Swell', blurb: 'Reaches further.', cost: 90, desc: '+20 range.', add: { range: 20 } },
        { name: 'Wave', blurb: 'Every few seconds a wave knocks the crowd back.', cost: 260, desc: 'Every 4s a wave crosses 90 of road, knocking non-Heavies back 40. The whirl deals +4 damage/s.', set: { waveEvery: 4, waveLen: 90, waveBack: 40 }, add: { damage: 4 } },
        { name: 'Tidecaller', blurb: 'Waves on two stretches, and even Heavies stagger.', cost: 800, desc: 'Waves on two stretches, knocking back 60. Heavies are slowed 50% for 1s. The whirl deals +6 damage/s.', set: { waves: 2, waveBack: 60, waveHeavy: 0.5 }, add: { damage: 6 } },
        { name: 'Spring Tide', blurb: 'Waves come faster and push harder.', cost: 4000, desc: 'A wave every 2.5s, knocking back 80. The whirl deals +10 damage/s.', set: { waveEvery: 2.5, waveBack: 80 }, add: { damage: 10 } },
      ] },
      { name: 'Abyss', blurb: 'Small Gloom are pulled under; big ones lose layers.', tiers: [
        { name: 'Deep Water', blurb: 'The whirl\'s dark centre hurts.', cost: 110, desc: 'The centre deals +8 damage/s.', set: { deep: 8 } },
        { name: 'Undertow Grip', blurb: 'Small Gloom that linger in the centre are pulled under.', cost: 260, desc: 'One-layer Gloom that stay 1.5s in the centre are pulled under (half bounty). The whirl deals +4 damage/s.', set: { grip: 1.5 }, add: { damage: 4 } },
        { name: 'Abyss', blurb: 'The deep takes more: small Gloom go under, tough ones lose layers.', cost: 850, desc: 'Anything with 1-2 layers in the whirl is pulled under every 2s; tough Gloom (Husks, Aegis) lose a layer every 2s inside it. The whirl deals +6 damage/s, the centre +16.', set: { abyssEvery: 2, deep: 16 }, add: { damage: 6 } },
        { name: 'Drowning Deep', blurb: 'Even hulks drown slowly in it.', cost: 4100, desc: 'Heavies lose 2% of their full health a second inside it. The whirl deals +10 damage/s, the centre +30.', set: { drown: 0.02, deep: 30 }, add: { damage: 10 } },
      ] },
    ],
  },

  lamp: {
    name: 'Lampwright', role: 'Road-maker: candles', cost: 225, kind: 'lamp', target: 'first',
    desc: 'A lamplighter who keeps tossing lit candles onto the road ahead of the Gloom. Anything that walks over one burns and is Scorched (no healing). Candles find Veiled too, but never touch flyers.',
    base: { damage: 6, rate: 0.714, range: 140, type: 'fire', tossN: 1, candleMax: 6, candleLife: 8, candleR: 12, burnDur: 2, searDur: 2, hitsAir: false },
    paths: [
      { name: 'Tallow', blurb: 'Bigger candles that burn longer.', tiers: [
        { name: 'Thick Wax', blurb: 'Candles last longer and burn hotter.', cost: 90, desc: 'Candles last 12s; x1.5 burn.', set: { candleLife: 12 }, mul: { damage: 1.5 } },
        { name: 'Pillar Candles', blurb: 'Fat pillar candles that catch more.', cost: 220, desc: 'Radius 20, 14 damage/s.', set: { candleR: 20, damage: 14 } },
        { name: 'Wax Vat', blurb: 'Great tallow candles whose wax slows what wades through.', cost: 750, desc: 'Radius 28, 30 damage/s, last 18s; their wax slows 20%. Up to 5 at once.', set: { candleR: 28, damage: 30, candleLife: 18, waxSlow: 0.2, candleMax: 5 } },
        { name: 'Everburning', blurb: 'Candles like bonfires.', cost: 3900, desc: 'Radius 34, 70 damage/s.', set: { candleR: 34, damage: 70 } },
      ] },
      { name: 'Wickstorm', blurb: 'Many small candles, thrown fast.', tiers: [
        { name: 'Quick Hands', blurb: 'Throws faster.', cost: 80, desc: 'x1.4 throw rate.', mul: { rate: 1.4 } },
        { name: 'Taper Bandolier', blurb: 'Throws two at a time.', cost: 220, desc: 'Throws 2 at once, up to 10 alive; candles burn +3/s.', set: { tossN: 2, candleMax: 10 }, add: { damage: 3 } },
        { name: 'Candle Wheel', blurb: 'A spinning wheel slings candles in a line.', cost: 750, desc: 'Slings 4 small candles in a line, up to 18 alive; candles burn +5/s.', set: { tossN: 4, candleMax: 18 }, add: { damage: 5 } },
        { name: 'Wickstorm', blurb: 'A storm of wicks.', cost: 3900, desc: 'Up to 24 alive, x2 throw rate; candles burn +26/s.', set: { candleMax: 24 }, add: { damage: 26 }, mul: { rate: 2 } },
      ] },
      { name: 'Beaconwax', blurb: 'Candles that reveal the Veiled and slow anything near.', tiers: [
        { name: 'Bright Wax', blurb: 'Candles show the hidden around them.', cost: 90, desc: 'Candles reveal Veiled within 30 to every ward.', set: { candleReveal: 30 } },
        { name: 'Votive Light', blurb: 'Candles slow what passes, and shine further.', cost: 220, desc: 'Slow 15% within 30; reveal within 50. Candles burn +3/s.', set: { candleSlow: 0.15, candleReveal: 50 }, add: { damage: 3 } },
        { name: 'Beaconwax', blurb: 'Each candle is a little beacon.', cost: 750, desc: 'Reveal within 70; slow 25%; candles burn +7/s and up to 8 stay alive.', set: { candleReveal: 70, candleSlow: 0.25, candleMax: 8 }, add: { damage: 7 } },
        { name: 'Vigil', blurb: 'Gloom near a candle take more from every ward.', cost: 3900, desc: 'Enemies within 40 of a candle take +15% damage. Candles burn +20/s.', set: { vigilAmp: 0.15, vigilR: 40 }, add: { damage: 20 } },
      ] },
    ],
  },
};

// Tier 5s (appended to each path by data/towers.js, with the others). `power` multiplies
// everything a tier 5 deals (sim/towers.js computeStats), fitted with tools/t5fit.js.
export const NEW_TIER5 = {
  avatar: [
    { name: 'Zenith', blurb: 'A great sun rises behind it: Heat carries from kill to kill, and bosses melt.', cost: 28500, desc: 'Capstone power x43 (all its damage). x2 damage. A target\'s Heat jumps to the next when it dies, and each flare on a boss makes it take +5% damage from every ward (up to +50%). Flares x1.5 wider; a mote that kills flies on to the next enemy (up to 6 times).', mul: { damage: 2, flareRadius: 1.5 }, set: { heatCarry: true, zenithStep: 0.05, zenithMax: 0.5, moteChain: 6 }, power: 43 },
    { name: 'Grand Orrery', blurb: 'A huge armillary sphere: it can lend its stars to other wards anywhere.', cost: 29500, desc: 'Capstone power x10 (all its damage). x2 damage, x1.3 rate. Press R and click a ward to lend it a star (up to 3, one per ward): the star fires from there, and the ward sees Veiled. A mote that kills flies on to the next enemy (up to 6 times).', mul: { damage: 2, rate: 1.3 }, set: { lend: 3, moteChain: 6 }, power: 10 },
    { name: 'Syzygy', blurb: 'A black sun and three aligned moons: every tethered ward fires with it.', cost: 21500, desc: 'Capstone power x4.7 (all its damage). x2 damage. The torrent pours three streams at once. Every 10s every tethered ward fires one free shot at its target for x3 its normal damage, in its own damage type. A mote that kills flies on to the next enemy (up to 6 times).', mul: { damage: 2 }, set: { syzygyEvery: 10, syzygyMul: 3, streams: 3, moteChain: 6 }, power: 4.7 },
  ],
  choir: [
    { name: 'Great Bell', blurb: 'A great bell of light: crescendos strike everything round their target.', cost: 26000, desc: 'Capstone power x7.2 (all its damage). x2 damage. Each crescendo also hits everything within 60 of its target, and a boss it hits can\'t call its phase adds for 4s.', mul: { damage: 2 }, set: { bellRadius: 60, bellNoPhase: 4 }, power: 7.2 },
    { name: 'Heavenly Host', blurb: 'Tiers of tiny singers: every note echoes across the whole map.', cost: 29500, desc: 'Capstone power x5.8 (all its damage). x2 damage. Every note echoes 0.5s later at 60% damage on every enemy on the map.', mul: { damage: 2 }, set: { echoMul: 0.6, echoDelay: 0.5 }, power: 5.8 },
    { name: 'Last Requiem', blurb: 'Freed light rises through an arch: fallen hulks walk back as lantern-wisps.', cost: 24000, desc: 'Capstone power x11 (all its damage). x2 damage. Shells and hulks (not bosses) killed in the song rise as a great lantern-wisp that walks back up the road for 6s, holding back the small Gloom it meets (Heavies push through and take damage).', mul: { damage: 2 }, set: { redeem: 6 }, power: 11 },
  ],
  ferry: [
    { name: 'Heartline', blurb: 'A colossal winch-ballista: harpooned Gloom are chained to the raft.', cost: 18000, desc: 'Capstone power x10 (all its damage). x2 damage, x5 rate, +60 range. Every harpoon is a lance that flies on through everything in its line, and every 3s the chain sweeps everything in reach for x3 damage. Harpooned enemies are chained to the raft for 3s and can\'t move further from it, Heavies included (bosses 1s).', mul: { damage: 2, rate: 5 }, add: { range: 60 }, set: { anchor: 3, anchorBoss: 1, pierce: 999, lance: true, chainSweep: 3 }, power: 10 },
    { name: 'Lantern Armada', blurb: 'A tall ship of light: its rafts storm ashore.', cost: 21000, desc: 'Capstone power x49 (all its damage). x2 damage. 8 rafts, and they run up onto the road up to 120 from their water, firing, then return.', mul: { damage: 2 }, set: { shoreParty: 120, rafts: 8 }, power: 49 },
    { name: 'Harbour Star', blurb: 'A great lighthouse with twin beams: caught by both, the Gloom stop dead.', cost: 18000, desc: 'Capstone power x6.7 (all its damage). x2 damage. Two beams sweep in opposite directions. Anything lit by both at once stops for 2s (bosses 0.5s), and Veiled lit by either stay revealed for 6s. The beams burn what they light for x3 damage a second.', mul: { damage: 2 }, set: { twinBeams: true, harbourStop: 2, harbourStopBoss: 0.5, revealHold: 6, beamBurn: 3 }, power: 6.7 },
  ],
  undertow: [
    { name: 'Great Maelstrom', blurb: 'A waterspout: small Gloom are lifted and thrown back, flyers plucked down.', cost: 23500, desc: 'Capstone power x84 (all its damage). x2 damage, +40 reach, and a second whirlpool on another stretch in reach; whirls x1.6 wider. Every 12s a waterspout lifts the small Gloom in the whirl and drops them 200 back up the road; flyers over it are pulled down and walk for 3s.', mul: { damage: 2, whirlRadius: 1.6 }, add: { range: 40 }, set: { whirls: 2, spoutEvery: 12, spoutBack: 200, spoutAir: 3 }, power: 84 },
    { name: 'Tidal Throne', blurb: 'A towering wave about to break: it carries the road back.', cost: 20000, desc: 'Capstone power x76 (all its damage). x2 damage, +40 reach, and a second whirlpool on another stretch in reach; whirls x1.5 wider. Every 15s a great wave runs 300 back up the road toward the Rift, carrying every non-boss with it.', mul: { damage: 2, whirlRadius: 1.5 }, add: { range: 40 }, set: { whirls: 2, breakEvery: 15, breakLen: 300 }, power: 76 },
    { name: 'Drowned Deep', blurb: 'A black ring of the deep: bosses drown, nothing heals.', cost: 20500, desc: 'Capstone power x58 (all its damage). x2 damage, +40 reach, and a second whirlpool on another stretch in reach; whirls x1.5 wider. Bosses in the whirl lose 1% of their full health a second, and nothing inside can be healed or shielded.', mul: { damage: 2, whirlRadius: 1.5 }, add: { range: 40 }, set: { whirls: 2, deepBoss: 0.01, deepNoHeal: true }, power: 58 },
  ],
  lamp: [
    { name: 'Undying Taper', blurb: 'A giant candle that never goes out.', cost: 18500, desc: 'Capstone power x19 (all its damage). x2 damage. It plants one giant candle on the road in range (R moves it) that never goes out and burns everything within 60 at x3 the candle rate.', mul: { damage: 2 }, set: { taper: true, taperR: 60, taperMul: 3 }, power: 19 },
    { name: 'Thousand Wicks', blurb: 'A candelabra tree: a crowd lights its own way.', cost: 18500, desc: 'Capstone power x48 (all its damage). x2 damage. When an enemy dies on a candle, the candle splits in two (within the caps, up to 8 a second).', mul: { damage: 2 }, set: { wildwick: 8 }, power: 48 },
    { name: 'Eternal Vigil', blurb: 'A rose window of light: candles join into lines of light.', cost: 17500, desc: 'Capstone power x39 (all its damage). x2 damage. Up to 20 candles, thrown two at a time, link to their neighbours with lines of light; anything crossing a line is revealed, slowed 30% and burned.', mul: { damage: 2 }, set: { vigilLine: true, candleMax: 20, tossN: 2 }, power: 39 },
  ],
};
