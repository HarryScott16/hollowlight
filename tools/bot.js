// Headless balance bot. Plays the real simulation with a few scripted strategies and reports
// how each one fares. Usage: node tools/bot.js [strategyName] [-v]
import { Game } from '../public/js/sim/game.js';
import { TOWERS, TOWER_ORDER } from '../public/js/data/towers.js';
import { upgradeInfo, computeStats, estimateDps } from '../public/js/sim/towers.js';

const STEP = 1 / 60;
const verbose = process.argv.includes('-v');
const seedArg = process.argv.find((a) => a.startsWith('--seed='));
const SEED = seedArg ? Number(seedArg.slice(7)) : 1;
const only = process.argv.slice(2).find((a) => !a.startsWith('-'));
// --endless: keep playing generated waves after a win, up to wave 60.
const ENDLESS = process.argv.includes('--endless');
const ENDLESS_CAP = Number((process.argv.find((a) => a.startsWith("--cap=")) || "--cap=60").slice(6));

// order: towers bought in this rotation. paths: [main, minor] path index per tower type.
// maxTowers(wave) caps the tower count so the bot also upgrades. tierCap: highest tier it buys.
// maxUpgrades: total upgrades it ever buys. group: which balance target the build is held to.
//   lazy        2-3 wards, little or no upgrading           -> should lose around waves 8-12
//   reasonable  a mixed defence with tier 3s, no tier 4s    -> tested around 25-35, loses before 40
//   plateau     three tier 4s as fast as possible, then stops -> loses lives late 20s, lost by ~30-35
//   strong      a full composition with tier 4s             -> wins wave 40, but not with full lives
//   probe       one-trick builds, to see what each counter-check punishes
// The full mix the investing builds draw from. Each strategy is { order, paths } plus options.
const ALL8 = ['bolt', 'rime', 'mortar', 'coil', 'censer', 'longeye', 'prism', 'beacon', 'mortar', 'coil', 'bolt', 'censer', 'prism', 'longeye', 'mortar', 'coil', 'beacon', 'prism'];
const PATHS_A = { bolt: [0, 2], mortar: [0, 1], rime: [1, 2], coil: [1, 0], longeye: [1, 2], censer: [1, 2], prism: [0, 2], beacon: [0, 1] };
const PATHS_B = { bolt: [2, 0], mortar: [2, 1], rime: [0, 2], coil: [0, 2], longeye: [0, 1], censer: [0, 1], prism: [2, 1], beacon: [1, 0] };
const PATHS_C = { bolt: [1, 2], mortar: [1, 0], rime: [2, 1], coil: [2, 1], longeye: [2, 0], censer: [2, 0], prism: [1, 0], beacon: [0, 2] };
const STRONG = { reveal: true, group: 'strong', save: 4, maxTowers: (w) => Math.min(18, 3 + Math.floor(w * 0.5)) };

const STRATEGIES = {
  lazy: { // buys the opening wards and then never spends again (or uses abilities)
    group: 'lazy', order: ['bolt', 'bolt', 'rime'], paths: {}, maxTowers: () => 3, noAbilities: true,
  },
  minimal: { // a Rime Spire with one upgrade and an unupgraded Mortar
    group: 'lazy', order: ['rime', 'mortar'], paths: { rime: [1, 0] }, maxTowers: () => 2, maxUpgrades: 1,
  },
  lazyTier1: { // three wards, tier 1 on each
    group: 'lazy', order: ['bolt', 'mortar', 'rime'], paths: { bolt: [0], mortar: [0], rime: [1] }, maxTowers: () => 3, tierCap: 1,
  },
  lazyNew: { // three of the new wards, tier 1 on each: none of them is an opener (a probe, not a lazy build)
    group: 'probe', order: ['longeye', 'censer', 'prism'], paths: { longeye: [0], censer: [1], prism: [0] }, maxTowers: () => 3, tierCap: 1,
  },

  // Reasonable: decent mixes of all eight wards, upgraded to tier 3 but never tier 4.
  mixed: { reveal: true, group: 'reasonable', order: ALL8, paths: PATHS_A, maxTowers: (w) => Math.min(16, 3 + Math.floor(w * 0.45)), tierCap: 3 },
  mixedAlt: { reveal: true, group: 'reasonable', order: ALL8, paths: PATHS_B, maxTowers: (w) => Math.min(16, 3 + Math.floor(w * 0.45)), tierCap: 3, strict: true },
  focused: { // fewer wards, every one taken to tier 3
    reveal: true, group: 'reasonable', order: ['bolt', 'rime', 'mortar', 'censer', 'longeye', 'prism', 'coil', 'mortar', 'beacon'],
    paths: PATHS_C, maxTowers: (w) => Math.min(9, 3 + Math.floor(w * 0.3)), tierCap: 3,
  },

  // Plateau: rushes three wards to tier 4, then never spends again. The late waves should catch
  // it: losing lives in the late 20s, lost by about 30-35.
  plateau: { reveal: true, group: 'plateau', order: ['bolt', 'rime', 'mortar', 'coil', 'censer', 'longeye', 'prism', 'mortar'],
    paths: PATHS_A, maxTowers: (w) => Math.min(8, 3 + Math.floor(w * 0.5)), save: 6, saveFrom: 11, stopAtT4: 3 },
  plateauAlt: { reveal: true, group: 'plateau', order: ['bolt', 'rime', 'mortar', 'prism', 'coil', 'longeye', 'censer', 'mortar'],
    paths: PATHS_B, maxTowers: (w) => Math.min(8, 3 + Math.floor(w * 0.5)), save: 6, saveFrom: 11, stopAtT4: 3, strict: true },

  // Strong: all eight wards, taken to tier 4, spending everything.
  strong: { ...STRONG, order: ALL8, paths: PATHS_A },
  strongAlt: { ...STRONG, order: ALL8, paths: PATHS_B, strict: true },
  strongThird: { ...STRONG, order: ALL8, paths: PATHS_C, strict: true },
  strongTithe: { ...STRONG, order: ['bolt', 'rime', 'beacon', 'mortar', 'coil', 'censer', 'longeye', 'prism', 'mortar', 'coil', 'bolt', 'censer', 'prism', 'longeye', 'mortar', 'coil', 'beacon', 'prism'],
    paths: { ...PATHS_A, beacon: [2, 0] }, tithe: true },
  // Builds that commit to the new wards (they get first call on upgrades), one per path family,
  // to measure the new tier 4s against the old ones.
  newA: { ...STRONG, order: ['bolt', 'rime', 'censer', 'mortar', 'longeye', 'prism', 'coil', 'beacon', 'censer', 'longeye', 'prism', 'mortar', 'bolt', 'prism', 'longeye', 'censer', 'beacon', 'coil'],
    paths: { ...PATHS_A, longeye: [1, 2], censer: [0, 1], prism: [0, 2], beacon: [0, 1] }, favour: 4, strict: true },
  newB: { ...STRONG, order: ['bolt', 'rime', 'censer', 'mortar', 'longeye', 'prism', 'coil', 'beacon', 'censer', 'longeye', 'prism', 'mortar', 'bolt', 'prism', 'longeye', 'censer', 'beacon', 'coil'],
    paths: { ...PATHS_B, longeye: [0, 1], censer: [1, 2], prism: [2, 1], beacon: [1, 0] }, favour: 4, strict: true },
  newC: { ...STRONG, order: ['bolt', 'rime', 'censer', 'mortar', 'longeye', 'prism', 'coil', 'beacon', 'censer', 'longeye', 'prism', 'mortar', 'bolt', 'prism', 'longeye', 'censer', 'beacon', 'coil'],
    paths: { ...PATHS_C, longeye: [2, 0], censer: [2, 0], prism: [1, 0], beacon: [0, 2] }, favour: 4, strict: true },
  // The pre-expansion strong build: only the original four wards.
  original4: { ...STRONG, group: 'probe', order: ['bolt', 'rime', 'mortar', 'coil', 'mortar', 'bolt', 'coil', 'rime', 'mortar', 'coil', 'bolt', 'coil', 'mortar'],
    paths: { bolt: [2, 0], mortar: [2, 1], rime: [0, 2], coil: [0, 2] }, strict: true },

  // Probes: lopsided builds the themed waves are meant to punish.
  spamNoUpgrades: {
    group: 'probe', order: ['bolt', 'mortar', 'coil', 'rime', 'censer', 'longeye', 'prism'], paths: {}, maxTowers: () => 60,
  },
  noDetection: { // a strong mix with no way to see Veiled: no Longeye, no Frost Sight, no Mark, no Lighthouse
    group: 'probe', order: ['bolt', 'rime', 'mortar', 'coil', 'censer', 'prism', 'mortar', 'coil', 'bolt', 'censer', 'prism', 'mortar', 'coil', 'beacon'],
    paths: { bolt: [0, 1], mortar: [0, 1], rime: [1, 0], coil: [1, 0], censer: [1, 0], prism: [0, 1], beacon: [0, 2] },
    maxTowers: (w) => Math.min(18, 3 + Math.floor(w * 0.5)), save: 4,
  },
  groundOnly: { // Mortars, Rime and Censers without a Lighthouse: almost nothing for flyers
    group: 'probe', order: ['mortar', 'rime', 'mortar', 'censer', 'mortar', 'rime'], paths: { mortar: [0, 1], rime: [2, 1], censer: [1, 0] },
    maxTowers: (w) => Math.min(16, 2 + Math.floor(w * 0.5)),
  },
  prismOnly: { // the boss killer alone
    group: 'probe', order: ['prism'], paths: { prism: [1, 2] }, maxTowers: (w) => Math.min(16, 2 + Math.floor(w * 0.5)), save: 4,
  },
};

// Builds with the four newest wards (Snare, Moth Lantern, Wandering Light, Ember Vault) in the mix.
// (economy and the flyer lure come after the first boss, as a player would buy them)
const ALL12 = ['bolt', 'rime', 'mortar', 'coil', 'censer', 'prism', 'snare', 'wander', 'longeye', 'vault', 'moth', 'beacon', 'mortar', 'snare', 'wander', 'coil', 'bolt', 'prism'];
const NEWP_A = { snare: [0, 2], moth: [2, 0], wander: [0, 2], vault: [0, 1] };
const NEWP_B = { snare: [1, 0], moth: [1, 2], wander: [1, 0], vault: [2, 0] };
const NEWP_C = { snare: [2, 1], moth: [0, 1], wander: [2, 1], vault: [1, 2] };
Object.assign(STRATEGIES, {
  strong12: { ...STRONG, order: ALL12, paths: { ...PATHS_A, ...NEWP_A }, strict: true },
  strong12B: { ...STRONG, order: ALL12, paths: { ...PATHS_B, ...NEWP_B }, strict: true },
  strong12C: { ...STRONG, order: ALL12, paths: { ...PATHS_C, ...NEWP_C }, strict: true },
  mixed12: { reveal: true, group: 'reasonable', order: ALL12, paths: { ...PATHS_A, ...NEWP_B }, maxTowers: (w) => Math.min(16, 3 + Math.floor(w * 0.45)), tierCap: 3 },
  // Leans on the new wards: they get first call on upgrades (probe: how strong are their tier 4s?)
  newWards: { ...STRONG, group: 'probe', order: ['bolt', 'snare', 'wander', 'rime', 'vault', 'mortar', 'moth', 'wander', 'snare', 'coil', 'wander', 'snare', 'prism', 'vault', 'wander', 'mortar'],
    paths: { ...PATHS_A, ...NEWP_A }, favour: 4, favourSet: ['snare', 'moth', 'wander', 'vault'], strict: true },
  lazySnare: { // two Bolts and a Snare, never upgraded: a probe (a bare Snare is a supplement, not an opener)
    group: 'probe', order: ['bolt', 'bolt', 'snare'], paths: {}, maxTowers: () => 3, noAbilities: true },
});

// Without Mortars, crowd damage has to come from elsewhere: the no-Mortar build a player would make.
STRATEGIES.noMortarCrowd = { ...STRONG, group: 'ban', order: ALL8.filter((t) => t !== 'mortar'), strict: true,
  paths: { bolt: [1, 2], rime: [1, 2], coil: [1, 0], censer: [1, 2], longeye: [1, 2], prism: [0, 2], beacon: [0, 1] } };

// Ban-one probes: strongAlt (a winning build) with one ward type taken out (its slots go to the
// others). Every one of these should still be able to win: no wave needs one specific ward.
for (const ban of ['bolt', 'mortar', 'rime', 'coil', 'longeye', 'censer', 'prism', 'beacon']) {
  STRATEGIES[`no-${ban}`] = { ...STRONG, group: 'ban', order: ALL8.filter((t) => t !== ban), paths: PATHS_B, strict: true, ban };
}

function candidateSpots(game) {
  const spots = [];
  for (let y = 30; y < game.map.height; y += 20) {
    for (let x = 30; x < game.map.width; x += 20) {
      if (game.map.buildable(x, y)) spots.push({ x, y });
    }
  }
  return spots;
}

function coverage(game, x, y, range, minRange = 0) {
  const p = game.map.path;
  let n = 0;
  for (let i = 0; i < p.count; i += 2) {
    const d = Math.hypot(p.xs[i] - x, p.ys[i] - y);
    if (d <= range && d >= minRange && p.xs[i] > 0) n++;
  }
  return n;
}

// Thornlight Snares go on the road: where the most ward coverage already is (the kill zone, so
// what it holds gets hit), not too near the end.
function snareSpot(game) {
  const p = game.map.path;
  let best = null, bestScore = -1;
  for (let i = 20; i < p.count - 30; i += 3) {
    const x = p.xs[i], y = p.ys[i];
    if (!game.snapToPath(x, y)) continue;
    let score = 1;
    for (const t of game.towers) if (t.stats.range && !t.def.onPath && Math.hypot(t.hx - x, t.hy - y) < t.stats.range) score += 1 + t.spent / 500;
    score *= 1 - (i / p.count) * 0.3;   // earlier is a little better: what it holds stays in the kill zone
    if (score > bestScore) { bestScore = score; best = { x, y }; }
  }
  return best;
}
// Flyer coverage: how much of the flight route a spot reaches.
function flyCoverage(game, x, y, range) {
  const p = game.map.flyPath;
  let n = 0;
  for (let i = 0; i < p.count; i += 2) if (p.xs[i] > 0 && Math.hypot(p.xs[i] - x, p.ys[i] - y) <= range) n++;
  return n;
}

function bestSpot(game, spots, type) {
  if (TOWERS[type].onPath) return snareSpot(game);
  const base = TOWERS[type].base, kind = TOWERS[type].kind;
  let best = null, bestScore = -1;
  for (const s of spots) {
    if (!game.canPlace(type, s.x, s.y)) continue;
    let score;
    if (base.auraRate !== undefined) {
      // Beacons go where they light up the most invested wards (and room for more).
      score = 0;
      for (const t of game.towers) if (t.def.kind !== 'aura' && Math.hypot(t.x - s.x, t.y - s.y) < base.range - 10) score += t.spent;
      score += coverage(game, s.x, s.y, base.range) * 2;
    } else if (kind === 'lure') {
      // Moth Lanterns: on the flight route, near the ground splash that will hit what it lures.
      score = flyCoverage(game, s.x, s.y, base.range) * 2;
      for (const t of game.towers) if (!t.stats.hitsAir && t.stats.range && Math.hypot(t.x - s.x, t.y - s.y) < t.stats.range) score += 20;
    } else if (kind === 'vault') {
      // Ember Vaults: in the kill zone, among the wards.
      score = coverage(game, s.x, s.y, base.range);
      for (const t of game.towers) if (t.stats.range && Math.hypot(t.hx - s.x, t.hy - s.y) < t.stats.range) score += 3;
    } else if (kind === 'wander') {
      score = coverage(game, s.x, s.y, base.range + base.leash);
    } else if (base.global) {
      // A map-wide ward works from anywhere: put it where it takes the least path coverage from others.
      score = 1000 - coverage(game, s.x, s.y, 160);
    } else score = coverage(game, s.x, s.y, base.range, base.minRange || 0);
    // Slow towers are worth more next to damage dealers.
    if (type === 'rime') for (const t of game.towers) if (Math.hypot(t.x - s.x, t.y - s.y) < 130) score += 12;
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return best;
}

// Builds up to the strategy's tower count, then buys the upgrade with the best estimated power
// gained per gold, saving up for it when it can't afford it yet (like a player chasing a tier 3/4).
// A Beacon's worth: the extra damage of the wards in its light (it never attacks itself).
const boostMul = (s) => (1 + (s.auraRate || 0)) * (1 + (s.auraDmg || 0)) * (1 + (s.auraRange || 0) * 0.5) * (s.auraDetect ? 1.1 : 1) * (s.auraAir ? 1.15 : 1);
function beaconGain(game, b, before, after) {
  let base = 0;
  for (const t of game.towers) {
    if (t === b || t.def.kind === 'aura' || Math.hypot(t.hx - b.hx, t.hy - b.hy) > after.range) continue;
    base += estimateDps(t.def.kind, computeStats(t.def, t.tiers));
  }
  return base * (boostMul(after) - boostMul(before));
}

const NEW_WARDS = new Set(['longeye', 'censer', 'prism', 'beacon']);
function upgradeValue(game, t, pi, strat) {
  const info = upgradeInfo(t, pi);
  if (!info.ok) return null;
  const tiers = t.tiers.slice();
  tiers[pi]++;
  const next = computeStats(t.def, tiers), now = computeStats(t.def, t.tiers);
  let gain;
  if (t.def.kind === 'vault') {
    // Embers: worth what they bank per wave (cap and growth), plus Hearthwarm's boost like a Beacon's.
    // A bigger cap only pays once the vault actually fills; a player sees that before buying it.
    const left = Math.max(0, 34 - game.wave), full = t.botFull ? 1 : 0;
    gain = ((next.cap - now.cap) * 0.1 * full + (next.glean - now.glean) * (t.botRate || 0) * 0.5 + (next.growth - now.growth) * Math.min(next.cap, t.botRate || 0) + ((next.gleanAll ? 1 : 0) - (now.gleanAll ? 1 : 0)) * (t.botRate || 0) * 0.4) * left * 0.06;
    if (next.warmRate) gain += beaconGain(game, t, { auraRate: now.warmRate || 0, auraDmg: now.warmDmg || 0 }, { auraRate: next.warmRate, auraDmg: next.warmDmg || 0, range: next.range }) * 0.7;
  } else if (t.def.kind === 'lure') {
    // A lure's worth: the ground splash it lets reach flyers (more held, longer), plus its own moths.
    let ground = 0;
    for (const o of game.towers) if (!o.stats.hitsAir && o.stats.range && Math.hypot(o.x - t.x, o.y - t.y) < o.stats.range + next.range) ground += estimateDps(o.def.kind, o.stats) * 0.15;
    const hold = (s) => Math.min(s.lureMax, 12) * s.lureDur * (1 + (s.lureAmp || 0)) + (s.groundDur || 0) * 2 + (s.releaseSlow || 0) * 10;
    gain = ground * (hold(next) - hold(now)) / 20 + estimateDps('lure', next) - estimateDps('lure', now);
    if (game.botNeedAir) gain *= 3;
  } else if (t.def.kind === 'aura') {
    gain = beaconGain(game, t, now, next);
    // Tithe: gold now for gold later, worth it with enough waves left to pay back.
    if (next.tithe) gain += ((next.tithe - (now.tithe || 0)) + ((next.interestCap || 0) - (now.interestCap || 0)) * 0.5) * Math.max(0, 32 - game.wave) * (strat.tithe ? 0.6 : 0.15);
  } else {
    // Crowd power, plus a share of single-target power (hulks and bosses need it).
    gain = estimateDps(t.def.kind, next) - estimateDps(t.def.kind, now)
      + 0.25 * (estimateDps(t.def.kind, next, false) - estimateDps(t.def.kind, now, false));
    // After flyers got through, the next upgrades go to wards that can hit them.
    if (game.botNeedAir && !now.hitsAir) gain *= 0.1;
  }
  // Frost spires are worth more than their own damage: they multiply everyone else's. Fire
  // shuts down Menders and shields, which the damage estimate doesn't see.
  const util = t.def.kind === 'pulse' ? 3 : t.def.kind === 'flame' ? 1.5 : 1;
  const fav = strat.favour && (strat.favourSet ? strat.favourSet.includes(t.type) : NEW_WARDS.has(t.type)) ? strat.favour : 1;
  return { t, pi, cost: info.cost, value: (gain * util * fav) / info.cost };
}

// Builds that read the banners get one Frost Sight spire (Blizzard tier 2) once Veiled waves
// start to matter, the way a player would after "Wisps: always Veiled".
function ensureReveal(game, strat) {
  if (!strat.reveal || game.wave < 12 || game.towers.some((t) => t.stats.reveal)) return true;
  const rime = game.towers.filter((t) => t.type === 'rime' && upgradeInfo(t, 2).ok).sort((a, b) => b.tiers[2] - a.tiers[2])[0];
  if (!rime) return true;
  const info = upgradeInfo(rime, 2);
  if (game.gold < info.cost) return false;   // save for it
  game.upgrade(rime, 2);
  return true;
}

function cashOutVaults(game) {
  for (const t of game.towers) {
    if (t.type !== 'vault') continue;
    // what it gathers a wave (for valuing its upgrades), measured as it fills
    if (t.botWave !== game.wave) { if (t.botWave) t.botRate = (t.botRate || 0) * 0.5 + Math.max(0, t.bank - (t.botBank || 0)) * 0.5; t.botWave = game.wave; t.botBank = t.bank; }
    if (t.bank >= t.stats.cap * 0.95) { t.botFull = true; game.cashOut(t); t.botBank = 0; }
  }
}

function spend(game, strat, spots, state) {
  cashOutVaults(game);
  // Plateau builds stop investing for good once they own this many tier 4 wards.
  if (strat.stopAtT4 && game.towers.filter((t) => t.tiers.includes(4)).length >= strat.stopAtT4) return;
  if (!ensureReveal(game, strat)) return;
  for (let guard = 0; guard < 50; guard++) {
    const canUpgrade = strat.maxUpgrades === undefined || state.upgrades < strat.maxUpgrades;
    if (game.towers.length < strat.maxTowers(game.wave)) {
      const type = strat.order[state.bought % strat.order.length];
      if (game.gold < TOWERS[type].cost) return;
      const spot = bestSpot(game, spots, type);
      if (!spot || !game.place(type, spot.x, spot.y)) return;
      state.bought++;
      continue;
    }
    // Save for the best-value upgrade only if `save` waves of income (default 1) will cover it;
    // otherwise buy the best one affordable now. Strong builds save up for tier 4s after wave 10.
    const lastIncome = game.botLeaked ? 0 : (game.income[game.wave - 2] || 300) * (game.wave >= (strat.saveFrom || 11) ? strat.save || 1 : 1);
    let pick = null, now = null;
    if (!canUpgrade) return;
    for (const t of game.towers) {
      const plan = strat.paths[t.type];
      if (!plan) continue;
      // strict: follow the plan's main path first, the minor path only once it can't go further.
      const order = strat.strict ? [upgradeInfo(t, plan[0]).ok ? plan[0] : plan[1]] : plan;
      for (const pi of order) {
        if (pi === undefined || (strat.tierCap !== undefined && t.tiers[pi] >= strat.tierCap)) continue;
        const v = upgradeValue(game, t, pi, strat);
        if (!v) continue;
        if (v.cost <= game.gold + lastIncome && (!pick || v.value > pick.value)) pick = v;
        if (v.cost <= game.gold && (!now || v.value > now.value)) now = v;
      }
    }
    if (pick && game.gold >= pick.cost) { game.upgrade(pick.t, pick.pi); state.upgrades++; continue; }
    if (!pick && now) { game.upgrade(now.t, now.pi); state.upgrades++; continue; }
    return;
  }
}

// Abilities, used the way a player would: the Flare as a panic button when enemies get close to
// the Heartfire (or for the boss), ward abilities whenever there is a crowd or a hulk to hit.
const abilityUse = { flare: 0, ward: 0 };
function useAbilities(game) {
  const len = game.map.path.length;
  let near = 0, heavy = false;
  for (const e of game.enemies) {
    if (e.dist * e.prog > len * 0.75) near++;
    if (e.def.heavy) heavy = true;
  }
  if (game.flareReady && (near >= 12 || game.enemies.some((e) => e.def.boss && e.dist * e.prog > len * 0.6))) {
    game.useFlare(); abilityUse.flare++;
  }
  if (game.enemies.length >= 40 || heavy) {
    for (const type of TOWER_ORDER) {
      const t = game.abilityTower(type);
      if (t && t.abilityCd <= 0 && game.useAbility(type)) abilityUse.ward++;
    }
  }
}

// A map-wide Longeye on "Strong" shoots the toughest enemy anywhere, which can leave a stream of
// flyers alone. A player watching the field switches it to "First" while flyers close in on the
// Heartfire, and back to "Strong" for the hulks once they're dealt with. During a boss fight they
// stay on the boss.
function aimLongeyes(game) {
  const len = game.map.path.length;
  const threat = !game.enemies.some((e) => e.def.boss) && game.enemies.some((e) => e.def.flying && e.dist * e.prog > len * 0.55);
  for (const t of game.towers) if (t.type === 'longeye') t.targetMode = threat ? 'first' : 'strong';
}

function run(name, strat, seed = SEED) {
  abilityUse.flare = abilityUse.ward = 0;
  const game = new Game({ fx: false, seed });
  const spots = candidateSpots(game);
  const state = { bought: 0, upgrades: 0, livesAt: {}, t4At: {} };
  const log = [];
  let maxEnemies = 0;
  const boss = { result: 'none', cost: 0, time: 0 };
  const leak = game.leak.bind(game), kill = game.kill.bind(game);
  let leaks = {};
  const trace = Number((process.argv.find((a) => a.startsWith('--trace=')) || '--trace=0').slice(8));
  game.leak = (e) => {
    if (trace && game.wave === trace) {
      const b = game.enemies.find((x) => x.def.boss && x.alive);
      console.log(`    t=${(game.time - state.waveT).toFixed(1)}s leak ${e.type} -${game.leakCost(e)}  lives ${game.lives}  enemies ${game.enemies.length}  boss ${b ? `${Math.round(100 * b.hp / b.maxHp)}% at ${Math.round(100 * b.dist / b.path.length)}% of path` : 'gone'}`);
    }
    if (e.def.boss) { boss.result = `leaked at ${Math.round(100 * e.hp / e.maxHp)}% hp`; boss.cost = game.leakCost(e); }
    const k = (e.veiled ? 'veiled ' : '') + e.type;
    leaks[k] = (leaks[k] || 0) + game.leakCost(e);
    leak(e);
  };
  game.kill = (e, src) => { if (e.def.boss) boss.result = `killed after ${game.time.toFixed(0) - boss.spawn}s`; kill(e, src); };
  let earlyCalls = 0;
  for (;;) {
    if (game.over === 'win' && ENDLESS) game.continueEndless();
    if (game.over || game.wave >= ENDLESS_CAP) break;
    spend(game, strat, spots, state);
    const livesBefore = game.lives;
    state.calledEarly = false;
    if (!(strat.early && game.spawners.length)) game.startWave();
    state.waveT = game.time;
    let t = 0, steps = 0, deepest = 0;
    const wall0 = Date.now();
    while (!game.over && !game.clear) {
      game.step(STEP);
      if (boss.spawn === undefined && game.enemies.some((e) => e.def.boss)) boss.spawn = Math.round(game.time);
      if (game.enemies.length > maxEnemies) maxEnemies = game.enemies.length;
      if (++steps % 120 === 0) spend(game, strat, spots, state);
      if (steps % 30 === 0 && !strat.noAbilities) { useAbilities(game); aimLongeyes(game); }
      if (steps % 15 === 0) for (const e of game.enemies) { const p = e.dist / e.path.length; if (p > deepest) deepest = p; }
      // Early caller: once a wave has finished spawning, call the next one (keeps one wave of overlap).
      if (strat.early && state.safe && game.canStartWave && game.enemies.length && !state.calledEarly) {
        spend(game, strat, spots, state);
        game.startWave();
        earlyCalls++;
        state.calledEarly = true;
      }
      if ((t += STEP) > 900) { log.push('  !! wave timed out'); game.over = 'lose'; break; }
    }
    state.safe = game.lives === livesBefore;
    game.botNeedAir = Object.keys(leaks).some((k) => k.endsWith('gloomwing'));
    // A player who just leaked spends now rather than saving for a tier 4.
    game.botLeaked = Object.values(leaks).reduce((a, b) => a + b, 0) >= 5;
    if (!state.safe && !state.firstLeak) state.firstLeak = game.wave;
    if (game.wave % 5 === 0 && !game.over) state.livesAt[game.wave] = game.lives;
    const t4now = game.towers.filter((tw) => tw.tiers.includes(4)).length;
    if (t4now && !state.firstT4) state.firstT4 = game.wave;
    if (t4now >= 3 && !state.thirdT4) state.thirdT4 = game.wave;
    if (game.wave === 20 || game.wave === 30) state.t4At[game.wave] = t4now;
    // sim cost: wall-clock ms per simulated second on this machine. At 3x speed the browser runs
    // 3 sim-seconds per real second, so 3x this is the share of each second spent simulating.
    const cost = ((Date.now() - wall0) / Math.max(1, t)).toFixed(1);
    log.push(`  wave ${String(game.wave).padStart(2)}: ${t.toFixed(0).padStart(3)}s ${cost.padStart(5)}ms/s  lives ${String(game.lives).padStart(3)} (${game.lives - livesBefore}) deepest ${String(Math.round(deepest * 100)).padStart(3)}%  income ${String(Math.round(game.income[game.wave - 1] || 0)).padStart(5)}  bank ${String(Math.floor(game.gold)).padStart(5)}  towers ${game.towers.length}  tiers ${game.towers.map((tw) => tw.tiers.join('')).join(' ')}${Object.keys(leaks).length ? `  leaks: ${Object.entries(leaks).map(([k, v]) => `${k} ${v}`).join(', ')}` : ''}`);
    leaks = {};
  }
  console.log(`${name.padEnd(16)} ${(game.over || 'cap').toUpperCase().padEnd(5)} wave ${game.wave}/${game.endless ? 'endless' : game.totalWaves}  lives ${String(game.lives).padStart(3)}  earned ${Math.floor(game.earned)}  peak enemies ${maxEnemies}  boss: ${boss.result}${boss.cost ? ` (-${boss.cost} lives)` : ''}${earlyCalls ? `  early calls ${earlyCalls}` : ''}  abilities ${abilityUse.flare}F/${abilityUse.ward}W${game.lastLight ? '' : '  LAST LIGHT used'}`);
  if (verbose) {
    console.log(log.join('\n'));
    const byType = {};
    for (const t of game.towers) {
      const k = `${t.def.name} [${t.tiers.join('/')}]`;
      byType[k] = byType[k] || { n: 0, dmg: 0, kills: 0, spent: 0 };
      byType[k].n++; byType[k].dmg += t.dmg; byType[k].kills += t.kills; byType[k].spent += t.spent;
    }
    for (const [k, v] of Object.entries(byType)) {
      console.log(`    ${k.padEnd(26)} x${v.n}  dmg ${Math.round(v.dmg).toString().padStart(7)}  kills ${String(v.kills).padStart(4)}  dmg/gold ${(v.dmg / v.spent).toFixed(1)}`);
    }
  }
  const t4 = game.towers.filter((t) => t.tiers.includes(4)).length, t3 = game.towers.filter((t) => t.tiers.includes(3)).length;
  results.push({ name, group: strat.group, over: game.over || 'cap', wave: game.wave, lives: game.lives, firstLeak: state.firstLeak,
    livesAt: state.livesAt, towers: game.towers.length, t3, t4, lastLight: !game.lastLight, peak: maxEnemies,
    firstT4: state.firstT4, thirdT4: state.thirdT4, t4At: state.t4At });
  return game;
}

const results = [];
function table() {
  console.log('\n(ban-one probes: the `strongAlt` build with that ward never bought)');
  const at = (r, w) => (r.livesAt[w] !== undefined ? r.livesAt[w] : r.wave <= w ? '-' : '?');
  const t4 = (r, w) => (r.t4At[w] !== undefined ? r.t4At[w] : '-');
  console.log('\n| Build | Group | Result | First leak | Lives @25 | @30 | @35 | First / 3rd T4 | T4s @20 / @30 / end | Wards (T3/T4) | Peak enemies |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of results) {
    const res = r.over === 'win' ? `**won**, ${r.lives}/150${r.lastLight ? ' (Last Light used)' : ''}` : r.over === 'lose' ? `lost on wave ${r.wave}` : `reached wave ${r.wave}`;
    console.log(`| ${r.name} | ${r.group} | ${res} | ${r.firstLeak || 'never'} | ${at(r, 25)} | ${at(r, 30)} | ${at(r, 35)} | ${r.firstT4 ? `${r.firstT4} / ${r.thirdT4 || '-'}` : '-'} | ${t4(r, 20)} / ${t4(r, 30)} / ${r.t4} | ${r.towers} (${r.t3}/${r.t4}) | ${r.peak} |`);
  }
}

const t0 = Date.now();
for (const [name, strat] of Object.entries(STRATEGIES)) {
  if (only && !only.split(',').some((k) => k === name || k === strat.group)) continue;
  run(name, strat);
}
table();
console.log(`(${Date.now() - t0} ms)`);
