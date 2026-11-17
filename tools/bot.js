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

// order: towers bought in this rotation. paths: [main, minor] path index per tower type.
// maxTowers(wave) caps the tower count so the bot also upgrades.
const STRATEGIES = {
  mixed: {
    order: ['bolt', 'bolt', 'rime', 'mortar', 'coil', 'bolt', 'mortar', 'coil', 'rime', 'bolt'],
    paths: { bolt: [0, 1], mortar: [0, 1], rime: [1, 0], coil: [1, 0] },
    maxTowers: (w) => 3 + Math.floor(w * 0.7),
  },
  mixedAlt: {
    order: ['bolt', 'rime', 'mortar', 'coil', 'mortar', 'bolt', 'coil', 'rime', 'mortar', 'coil'],
    paths: { bolt: [2, 0], mortar: [2, 1], rime: [0, 2], coil: [0, 2] },
    maxTowers: (w) => 3 + Math.floor(w * 0.6),
    strict: true,
  },
  mixedEarly: { // same build as mixed, but calls the next wave early whenever the last one leaked nothing
    order: ['bolt', 'bolt', 'rime', 'mortar', 'coil', 'bolt', 'mortar', 'coil', 'rime', 'bolt'],
    paths: { bolt: [0, 1], mortar: [0, 1], rime: [1, 0], coil: [1, 0] },
    maxTowers: (w) => 3 + Math.floor(w * 0.7),
    early: true,
  },
  focused: { // fewer towers, deeper upgrades
    order: ['bolt', 'bolt', 'rime', 'mortar', 'coil', 'mortar'],
    paths: { bolt: [0, 2], mortar: [0, 1], rime: [1, 0], coil: [0, 2] },
    maxTowers: (w) => Math.min(6, 3 + Math.floor(w * 0.4)),
  },
  boltOnly: { // takes Keen Sight (sees Veiled) as its minor path
    order: ['bolt'], paths: { bolt: [1, 2] }, maxTowers: (w) => 3 + Math.floor(w * 1.3),
  },
  mortarOnly: {
    order: ['mortar'], paths: { mortar: [0, 1] }, maxTowers: (w) => 2 + Math.floor(w * 0.6),
  },
  markOnly: { // Hunter's Mark path, to check it pulls its weight
    order: ['bolt'], paths: { bolt: [2, 1] }, maxTowers: (w) => 3 + Math.floor(w * 1.3), strict: true,
  },
  cinderOnly: {
    order: ['mortar'], paths: { mortar: [2, 1] }, maxTowers: (w) => 2 + Math.floor(w * 0.6), strict: true,
  },
  freezeMix: { // Deep Freeze spires feeding bolts and coils
    order: ['bolt', 'rime', 'bolt', 'coil', 'mortar', 'rime', 'coil', 'bolt'],
    paths: { bolt: [0, 1], mortar: [0, 1], rime: [0, 2], coil: [0, 1] },
    maxTowers: (w) => 3 + Math.floor(w * 0.7),
    strict: true,
  },
  spamNoUpgrades: {
    order: ['bolt', 'mortar', 'coil', 'rime'], paths: {}, maxTowers: () => 99,
  },
  lazy: { // buys the opening towers and then never spends again (or uses abilities)
    order: ['bolt', 'bolt', 'rime'], paths: {}, maxTowers: () => 3, noAbilities: true,
  },
};

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

function bestSpot(game, spots, type) {
  const base = TOWERS[type].base;
  let best = null, bestScore = -1;
  for (const s of spots) {
    if (!game.canPlace(type, s.x, s.y)) continue;
    let score = coverage(game, s.x, s.y, base.range, base.minRange || 0);
    // Slow towers are worth more next to damage dealers.
    if (type === 'rime') for (const t of game.towers) if (Math.hypot(t.x - s.x, t.y - s.y) < 130) score += 12;
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return best;
}

// Builds up to the strategy's tower count, then buys the upgrade with the best estimated power
// gained per gold, saving up for it when it can't afford it yet (like a player chasing a tier 3/4).
function upgradeValue(t, pi) {
  const info = upgradeInfo(t, pi);
  if (!info.ok) return null;
  const tiers = t.tiers.slice();
  tiers[pi]++;
  const gain = estimateDps(t.def.kind, computeStats(t.def, tiers)) - estimateDps(t.def.kind, t.stats);
  // Frost spires are worth more than their own damage: they multiply everyone else's.
  const util = t.def.kind === 'pulse' ? 3 : 1;
  return { t, pi, cost: info.up.cost, value: (gain * util) / info.up.cost };
}

function spend(game, strat, spots, state) {
  for (let guard = 0; guard < 50; guard++) {
    if (game.towers.length < strat.maxTowers(game.wave)) {
      const type = strat.order[state.bought % strat.order.length];
      if (game.gold < TOWERS[type].cost) return;
      const spot = bestSpot(game, spots, type);
      if (!spot || !game.place(type, spot.x, spot.y)) return;
      state.bought++;
      continue;
    }
    // Save for the best-value upgrade only if about one wave of income will cover it;
    // otherwise buy the best one affordable now.
    const lastIncome = game.income[game.wave - 2] || 300;
    let pick = null, now = null;
    for (const t of game.towers) {
      const plan = strat.paths[t.type];
      if (!plan) continue;
      // strict: follow the plan's main path first, the minor path only once it can't go further.
      const order = strat.strict ? [upgradeInfo(t, plan[0]).ok ? plan[0] : plan[1]] : plan;
      for (const pi of order) {
        const v = upgradeValue(t, pi);
        if (!v) continue;
        if (v.cost <= game.gold + lastIncome && (!pick || v.value > pick.value)) pick = v;
        if (v.cost <= game.gold && (!now || v.value > now.value)) now = v;
      }
    }
    if (pick && game.gold >= pick.cost) { game.upgrade(pick.t, pick.pi); continue; }
    if (!pick && now) { game.upgrade(now.t, now.pi); continue; }
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
    if (e.dist > len * 0.75) near++;
    if (e.def.heavy) heavy = true;
  }
  if (game.flareReady && (near >= 12 || game.enemies.some((e) => e.def.boss && e.dist > len * 0.6))) {
    game.useFlare(); abilityUse.flare++;
  }
  if (game.enemies.length >= 40 || heavy) {
    for (const type of TOWER_ORDER) {
      const t = game.abilityTower(type);
      if (t && t.abilityCd <= 0 && game.useAbility(type)) abilityUse.ward++;
    }
  }
}

function run(name, strat, seed = SEED) {
  abilityUse.flare = abilityUse.ward = 0;
  const game = new Game({ fx: false, seed });
  const spots = candidateSpots(game);
  const state = { bought: 0 };
  const log = [];
  let maxEnemies = 0;
  const boss = { result: 'none', cost: 0, time: 0 };
  const leak = game.leak.bind(game), kill = game.kill.bind(game);
  let leaks = {};
  game.leak = (e) => {
    if (e.def.boss) { boss.result = `leaked at ${Math.round(100 * e.hp / e.maxHp)}% hp`; boss.cost = game.leakCost(e); }
    const k = (e.veiled ? 'veiled ' : '') + e.type;
    leaks[k] = (leaks[k] || 0) + game.leakCost(e);
    leak(e);
  };
  game.kill = (e, src) => { if (e.def.boss) boss.result = `killed after ${game.time.toFixed(0) - boss.spawn}s`; kill(e, src); };
  let earlyCalls = 0;
  while (!game.over) {
    spend(game, strat, spots, state);
    const livesBefore = game.lives;
    state.calledEarly = false;
    if (!(strat.early && game.spawners.length)) game.startWave();
    let t = 0, steps = 0;
    while (!game.over && !game.clear) {
      game.step(STEP);
      if (boss.spawn === undefined && game.enemies.some((e) => e.def.boss)) boss.spawn = Math.round(game.time);
      if (game.enemies.length > maxEnemies) maxEnemies = game.enemies.length;
      if (++steps % 120 === 0) spend(game, strat, spots, state);
      if (steps % 30 === 0 && !strat.noAbilities) useAbilities(game);
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
    log.push(`  wave ${String(game.wave).padStart(2)}: ${t.toFixed(0).padStart(3)}s  lives ${String(game.lives).padStart(3)} (${game.lives - livesBefore})  income ${String(Math.round(game.income[game.wave - 1] || 0)).padStart(5)}  bank ${String(Math.floor(game.gold)).padStart(5)}  towers ${game.towers.length}  tiers ${game.towers.map((tw) => tw.tiers.join('')).join(' ')}${Object.keys(leaks).length ? `  leaks: ${Object.entries(leaks).map(([k, v]) => `${k} ${v}`).join(', ')}` : ''}`);
    leaks = {};
  }
  console.log(`${name.padEnd(16)} ${game.over.toUpperCase().padEnd(5)} wave ${game.wave}/${game.totalWaves}  lives ${String(game.lives).padStart(3)}  earned ${Math.floor(game.earned)}  peak enemies ${maxEnemies}  boss: ${boss.result}${boss.cost ? ` (-${boss.cost} lives)` : ''}${earlyCalls ? `  early calls ${earlyCalls}` : ''}  abilities ${abilityUse.flare}F/${abilityUse.ward}W${game.lastLight ? '' : '  LAST LIGHT used'}`);
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
  return game;
}

const t0 = Date.now();
for (const [name, strat] of Object.entries(STRATEGIES)) {
  if (only && only !== name) continue;
  run(name, strat);
}
console.log(`(${Date.now() - t0} ms)`);
