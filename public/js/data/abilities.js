// Activated abilities. All balance numbers live here.
//
// Heartfire Flare is the player's own ability, ready from wave 1. Each ward type unlocks one
// ability when any ward of that type reaches tier 4 on any path. A freshly unlocked ability
// starts one-third charged. When several wards of a type have it, the button fires whichever is
// ready first. Keys, in build-bar order: the home row for the first eight wards (A S D F G H J K),
// the bottom row for the next four (Z C V B), Y I O P N for the second shop row, and X for the Flare.

export const FLARE = {
  name: 'Heartfire Flare', key: 'X', cd: 60,
  dmg: 30,          // to every enemy on the map: 3 layers each (true damage, Veiled included)
  heavyDmg: 300,    // to Dreadhulks, colossi and bosses instead
  stun: 0.5,        // non-heavy enemies
  earlyCut: 10,     // seconds taken off the cooldown each time a wave is called early
  desc: 'Strips 3 layers from every enemy on the map and briefly stuns them. Deals 300 to hulks and bosses.',
};

export const LAST_LIGHT = {
  radius: 220,
  desc: 'Once per run, the first enemy to reach the Heartfire sets off a nova that destroys every non-boss enemy near it.',
};

export const ABILITIES = {
  bolt: {
    name: 'Overdraw', key: 'A', cd: 35, dur: 6, rateMul: 3,
    desc: 'This ward fires 3x as fast for 6s.',
  },
  mortar: {
    name: 'Saturation', key: 'S', cd: 40, shells: 30, over: 3,
    desc: 'Rains 30 of this ward\'s shells onto enemies across the whole map over 3s.',
  },
  rime: {
    name: 'Hoarfrost', key: 'D', cd: 50, dur: 3, heavySlow: 0.6, dmgMul: 2,
    desc: 'Freezes every non-heavy enemy on the map for 3s (hulks and bosses are slowed 60%) and hits all of them with a double-strength pulse.',
  },
  coil: {
    name: 'Tempest', key: 'F', cd: 45, strikes: 10, over: 1.5, mul: 6, minDmg: 200, radius: 80, stun: 1,
    desc: 'Calls 10 thunderbolts on the strongest enemies on the map: x6 damage (at least 200) with a blast around each.',
  },
  longeye: {
    name: 'Killshot', key: 'G', cd: 40, targets: 12, mul: 6, minDmg: 400,
    desc: 'Fires at the 12 toughest enemies on the map at once, Veiled included: x6 damage (at least 400), ignoring armour.',
  },
  censer: {
    name: 'Firestorm', key: 'H', cd: 50, dur: 8, minBurn: 30,
    desc: 'Every enemy on the map is set burning and Scorched for 8s.',
  },
  prism: {
    name: 'Sunlance', key: 'J', cd: 45, dur: 5, mul: 2,
    desc: 'Every Prism\'s beams jump to full charge and deal double damage for 5s.',
  },
  beacon: {
    name: 'Rally', key: 'K', cd: 50, dur: 10,
    desc: 'Every ward on the map gets this Beacon\'s boost for 10s.',
  },
  snare: {
    name: 'Briar Bloom', key: 'Z', cd: 45, dur: 8,
    desc: 'Every Thornlight Snare refills, and for 8s its bites cost no charges.',
  },
  moth: {
    name: 'Lamplure', key: 'C', cd: 50, dur: 5, ground: 8,
    desc: 'Every flyer on the map is drawn to this Moth Lantern for 5s, and stays low enough for every ward to hit for 8s.',
  },
  wander: {
    name: 'Starfall', key: 'V', cd: 45, stars: 20, mul: 5, minDmg: 150,
    desc: 'Every Wandering Light casts 20 great stars at the toughest enemies on the map: x5 damage (at least 150).',
  },
  vault: {
    name: 'Windfall', key: 'B', cd: 60, mul: 2,
    desc: 'This Ember Vault\'s embers double at once (up to twice its cap).',
  },
  // Round-2 wards: one ability per path, unlocked by that path's tier 4 (the button shows the
  // ability of the ward it would fire). Keys Y I O P N (the second shop row).
  avatar: {
    name: 'Avatar', key: 'Y', cd: 45,
    desc: 'Its path\'s ability: Sunfall (Solar), Starfall (Orrery) or Corona (Eclipse).',
    paths: [
      { name: 'Sunfall', cd: 45, dur: 6, pct: 0.04, desc: 'A pillar of sunlight on the strongest enemy for 6s: 4% of its full health a second, bosses included.' },
      { name: 'Starfall', cd: 40, radius: 50, mul: 8, back: 3, desc: 'Every star dives onto its target and bursts (x8 damage within 50), returning after 3s.' },
      { name: 'Corona', cd: 50, dur: 8, desc: 'For 8s every tethered ward attacks 40% faster and the torrent doubles.' },
    ],
  },
  choir: {
    name: 'Choir', key: 'I', cd: 45,
    desc: 'Its path\'s ability: Fortissimo (Hymn), Chorale (Chorus) or Release (Requiem).',
    paths: [
      { name: 'Fortissimo', cd: 40, notes: 5, desc: 'The next 5 notes are all crescendos.' },
      { name: 'Chorale', cd: 45, dur: 6, desc: 'For 6s every note strikes twice.' },
      { name: 'Release', cd: 50, desc: 'Every living wisp joins one flood that sweeps the road back toward the Rift, through everything.' },
    ],
  },
  ferry: {
    name: 'Ferrylight', key: 'O', cd: 35,
    desc: 'Its path\'s ability: Reel In (Harpooner), Broadside (Flotilla) or Lightfall (Lighthouse Barge).',
    paths: [
      { name: 'Reel In', cd: 30, drag: 300, desc: 'Harpoons the strongest non-boss in range and drags it 300 back up the road.' },
      { name: 'Broadside', cd: 40, dur: 4, desc: 'For 4s every raft fires fans of 6 bolts, three times as often.' },
      { name: 'Lightfall', cd: 45, dur: 6, stop: 1, desc: 'The beam stops and holds its spot for 6s; everything in it stops dead for 1s (bosses are slowed).' },
    ],
  },
  undertow: {
    name: 'Undertow', key: 'P', cd: 45,
    desc: 'Its path\'s ability: Riptide (Maelstrom), Flood (Tidecaller) or Maw (Abyss).',
    paths: [
      { name: 'Riptide', cd: 40, dur: 5, desc: 'For 5s it pulls everything within 140 of the whirl into its centre (not bosses).' },
      { name: 'Flood', cd: 50, dur: 6, desc: 'For 6s the road within 220 of the whirl floods: everything at half speed, non-Heavies pushed back 120.' },
      { name: 'Maw', cd: 45, dur: 4, desc: 'For 4s the whirl swallows every non-tough enemy within 80.' },
    ],
  },
  lamp: {
    name: 'Lampwright', key: 'N', cd: 40,
    desc: 'Its path\'s ability: Wax Seal (Tallow), Wickfall (Wickstorm) or Night Watch (Beaconwax).',
    paths: [
      { name: 'Wax Seal', cd: 40, dur: 1.5, heavy: 0.5, desc: 'The wax hardens: everything standing on a candle is stuck for 1.5s (Heavies 0.5s, not bosses).' },
      { name: 'Wickfall', cd: 40, n: 24, desc: 'Scatters 24 candles over the road in range at once (within the caps).' },
      { name: 'Night Watch', cd: 50, dur: 10, desc: 'For 10s every candle flares: twice the reveal radius, and a 40% slow.' },
    ],
  },
};
