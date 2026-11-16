// Headless balance bot. Plays the real simulation with a few scripted strategies and reports
// how each one fares. Usage: node tools/bot.js [strategyName] [-v]
import { Game } from '../public/js/sim/game.js';
import { TOWERS } from '../public/js/data/towers.js';
import { upgradeInfo } from '../public/js/sim/towers.js';

const STEP = 1 / 60;
const verbose = process.argv.includes('-v');
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
  },
  focused: { // fewer towers, deeper upgrades
    order: ['bolt', 'bolt', 'rime', 'mortar', 'coil', 'mortar'],
    paths: { bolt: [0, 2], mortar: [0, 1], rime: [1, 0], coil: [0, 2] },
    maxTowers: (w) => Math.min(6, 3 + Math.floor(w * 0.4)),
  },
  boltOnly: {
    order: ['bolt'], paths: { bolt: [1, 0] }, maxTowers: (w) => 3 + Math.floor(w * 0.8),
  },
  mortarOnly: {
    order: ['mortar'], paths: { mortar: [0, 1] }, maxTowers: (w) => 2 + Math.floor(w * 0.6),
  },
  spamNoUpgrades: {
    order: ['bolt', 'mortar', 'coil', 'rime'], paths: {}, maxTowers: () => 99,
  },
  lazy: { // buys the opening towers and then never spends again
    order: ['bolt', 'bolt', 'rime'], paths: {}, maxTowers: () => 3,
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
    // Cheapest available upgrade along each tower's planned paths.
    let pick = null;
    for (const t of game.towers) {
      const plan = strat.paths[t.type];
      if (!plan) continue;
      for (const pi of plan) {
        const info = upgradeInfo(t, pi);
        if (info.ok && (!pick || info.up.cost < pick.cost)) pick = { t, pi, cost: info.up.cost };
      }
    }
    if (!pick || game.gold < pick.cost) return;
    game.upgrade(pick.t, pick.pi);
  }
}

function run(name, strat, seed = 1) {
  const game = new Game({ fx: false, seed });
  const spots = candidateSpots(game);
  const state = { bought: 0 };
  const log = [];
  let maxEnemies = 0;
  while (!game.over) {
    spend(game, strat, spots, state);
    const livesBefore = game.lives;
    game.startWave();
    let t = 0, steps = 0;
    while (!game.over && !game.clear) {
      game.step(STEP);
      if (game.enemies.length > maxEnemies) maxEnemies = game.enemies.length;
      if (++steps % 120 === 0) spend(game, strat, spots, state);
      if ((t += STEP) > 900) { log.push('  !! wave timed out'); game.over = 'lose'; break; }
    }
    log.push(`  wave ${String(game.wave).padStart(2)}: ${t.toFixed(0).padStart(3)}s  lives ${String(game.lives).padStart(3)} (${game.lives - livesBefore})  gold ${String(Math.floor(game.gold)).padStart(5)}  towers ${game.towers.length}`);
  }
  console.log(`${name.padEnd(16)} ${game.over.toUpperCase().padEnd(5)} wave ${game.wave}/${game.totalWaves}  lives ${game.lives}  earned ${Math.floor(game.earned)}  peak enemies ${maxEnemies}`);
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
