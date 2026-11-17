// Activated abilities. All balance numbers live here.
//
// Heartfire Flare is the player's own ability, ready from wave 1. Each ward type unlocks one
// ability when any ward of that type reaches tier 4 on any path. A freshly unlocked ability
// starts one-third charged. When several wards of a type have it, the button fires whichever is
// ready first.

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
    name: 'Overdraw', key: '5', cd: 35, dur: 6, rateMul: 3,
    desc: 'This ward fires 3x as fast for 6s.',
  },
  mortar: {
    name: 'Saturation', key: '6', cd: 40, shells: 30, over: 3,
    desc: 'Rains 30 of this ward\'s shells onto enemies across the whole map over 3s.',
  },
  rime: {
    name: 'Hoarfrost', key: '7', cd: 50, dur: 3, heavySlow: 0.6, dmgMul: 2,
    desc: 'Freezes every non-heavy enemy on the map for 3s (hulks and bosses are slowed 60%) and hits all of them with a double-strength pulse.',
  },
  coil: {
    name: 'Tempest', key: '8', cd: 45, strikes: 10, over: 1.5, mul: 6, minDmg: 200, radius: 80, stun: 1,
    desc: 'Calls 10 thunderbolts on the strongest enemies on the map: x6 damage (at least 200) with a blast around each.',
  },
};
