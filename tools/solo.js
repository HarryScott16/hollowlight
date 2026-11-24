// Solo ward test: one ward alone on the map, already built (tier 5 or 4 on one path, with a
// secondary path at tier 2), plays wave after wave (each called when the last one clears) until
// it loses. Report-only tooling for docs/tier5-report.md; it never changes the game.
//
//   node tools/solo.js <type> <path> [tier=5] [cond=alone|reveal|full] [start=1|41] [seed=1]
//                      [map=hollowmere] [diff=medium] [minor=0|1|2] [spot=k] [cap=150] [-v]
//
// Conditions (test-only switches, set on this one game object, nothing else changes):
//   alone   the ward as it is.
//   reveal  every Veiled enemy counts as seen by it: Game.targetable is asked to skip the veil
//           check (as it already does for area attacks). No range, rate or damage, unlike a Beacon.
//   full    reveal, and it can also target and hit flyers (its stats get hitsAir, and targetable
//           skips the flyer check). Ground-only effects (pools, snares, mines) still miss flyers.
// start=1 plays the campaign from wave 1 (then endless after wave 40); start=41 starts endless at
// wave 41 with fresh lives. The Heartfire Flare is never used (it isn't the ward's power); the
// ward's own ability is, the way tools/bot.js uses it. Lives, leaks and Last Light are as in a game.
import { Game } from '../public/js/sim/game.js';
import { TOWERS, TOWER_ORDER } from '../public/js/data/towers.js';
import { ENEMIES } from '../public/js/data/enemies.js';
import { computeStats } from '../public/js/sim/towers.js';

const STEP = 1 / 60;

// Gold spent on the ward: its price and every upgrade.
export function wardCost(type, tiers) {
  const d = TOWERS[type];
  let n = d.cost;
  tiers.forEach((t, pi) => { for (let k = 0; k < t; k++) n += d.paths[pi].tiers[k].cost; });
  return n;
}

// Candidate spots: the best few by how much road lies in reach, kept apart from each other; for a
// ward that can hit flyers, half of them by road and flight line together (flyers take their own
// straight line). A map-wide ward has one; a Snare gets points along the road; a ward with no
// attack gets one.
export function candidateSpots(game, type, tiers, air = false, k = 4) {
  const def = TOWERS[type], s = computeStats(def, tiers), out = [];
  const routes = game.map.routes;
  if (def.onPath) {
    for (const f of [0.35, 0.55, 0.75, 0.9].slice(0, k)) {
      const p = routes[0].path, i = Math.round(p.count * f), q = game.snapToPath(p.xs[i], p.ys[i]);
      out.push([q.x, q.y]);
    }
    return out;
  }
  const reach = s.global ? 0 : (s.range || 130) + (s.leash || 0) * 0.5;
  const scored = [];
  for (let y = 30; y < game.map.height; y += 16) for (let x = 30; x < game.map.width; x += 16) {
    if (!game.canPlace(type, x, y)) continue;
    let n = 0, f = 0;
    const r2 = reach * reach;
    if (reach) for (const r of routes) {
      const p = r.path, q = r.flyPath;
      for (let i = 0; i < p.count; i += 2) if ((p.xs[i] - x) ** 2 + (p.ys[i] - y) ** 2 <= r2) n++;
      if (air) for (let i = 0; i < q.count; i++) if ((q.xs[i] - x) ** 2 + (q.ys[i] - y) ** 2 <= r2) f++;
    }
    scored.push([n, x, y, n + f]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  if (!reach || def.kind === 'aura' || def.kind === 'vault') return scored.length ? [[scored[0][1], scored[0][2]]] : [];
  const apart = Math.max(60, reach * 0.6);
  const take = (list, upTo) => {
    for (const [, x, y] of list) {
      if (out.length >= upTo) break;
      if (out.some(([ox, oy]) => (ox - x) ** 2 + (oy - y) ** 2 < apart * apart)) continue;
      out.push([x, y]);
    }
  };
  if (air) { take(scored, k / 2); take(scored.slice().sort((a, b) => b[3] - a[3]), k); }
  take(scored, k);
  return out;
}

// Why a leak got through, from this ward's point of view (first match wins).
export function leakCause(e, t, cond) {
  const s = t.stats, d = e.def;
  if (d.boss) return 'bosses';
  if (e.veiled && cond === 'alone' && !s.detect) return 'veiled';
  // (a Snare's thorns and mines lie on the road: flyers pass over them even when allowed)
  if (d.flying && ((cond !== 'full' && !s.hitsAir) || t.def.kind === 'snare')) return 'flyers';
  if (d.shield) return 'shields';
  if (e.type === 'mender' || e.mends > 0) return 'healers';
  if (d.mult && d.mult[s.type] !== undefined && d.mult[s.type] < 1) return 'armour';
  if (d.heavy) return 'hulks';
  return 'numbers';
}

export function runSolo(o) {
  const { type, path, tier = 5, cond = 'alone', start = 1, seed = 1, map = 'hollowmere', diff = 'medium', cap = 150 } = o;
  const game = new Game({ fx: false, seed, map, difficulty: diff });
  game.gold = 1e9;
  // Secondary path: the given one, else the next path round.
  const minor = o.minor !== undefined ? o.minor : (path + 1) % 3;
  const build = (ty, pi, ti, mi, at) => {
    const tiers = [0, 0, 0];
    tiers[pi] = ti; tiers[mi] = 2;
    const spots = at || candidateSpots(game, ty, tiers, cond === 'full' || computeStats(TOWERS[ty], tiers).hitsAir);
    const [x, y] = spots[Math.min(o.spot || 0, spots.length - 1)];
    const w = game.place(ty, x, y);
    if (!w) throw new Error(`could not place ${ty} at ${x},${y}`);
    for (let k = 0; k < ti; k++) if (!game.upgrade(w, pi)) throw new Error(`upgrade ${ty} ${pi} failed`);
    for (let k = 0; k < 2; k++) if (!game.upgrade(w, mi)) throw new Error(`minor ${ty} ${mi} failed`);
    return w;
  };
  // partner: { type, path, tier, minor }: a fixed ward placed first (at its best spot); the ward
  // under test (unless type is 'none') then stands as close beside it as it can. The partner's
  // damage, kills and blind spots are the ones reported (support wards have no attack).
  let t, helper = null;
  if (o.partner) {
    const P = o.partner;
    t = build(P.type, P.path, P.tier, P.minor, null);
    if (type !== 'none') {
      let at = null, bd = Infinity;
      for (let yy = 20; yy < game.map.height; yy += 8) for (let xx = 20; xx < game.map.width; xx += 8) {
        const d = (xx - t.x) ** 2 + (yy - t.y) ** 2;
        if (d < bd && game.canPlace(type, xx, yy)) { bd = d; at = [xx, yy]; }
      }
      helper = build(type, path, tier, minor, [at]);
    }
  } else t = build(type, path, tier, minor, o.spots);
  const def = TOWERS[type] || TOWERS[t.type];
  const { x, y } = helper || t;
  game.gold = 0;   // nothing else to spend on: income is irrelevant here
  // The test-only switches.
  if (cond !== 'alone') {
    const targetable = game.targetable.bind(game);
    const air = cond === 'full';
    game.targetable = (e, s, area) => {
      if (air && e.alive && e.def.flying) return true;
      return targetable(e, s, true);   // `area` skips only the veil check
    };
  }
  const airOn = () => { if (cond === 'full') t.stats.hitsAir = true; };
  airOn();
  if (start > 1) {   // straight into endless at `start`, fresh lives
    game.wave = game.rewarded = game.waves.length;
    game.over = 'win'; game.continueEndless();
    game.wave = game.rewarded = start - 1;
  }
  // Leaks: lives lost by enemy type and by cause, over the run and in the losing wave.
  const leaks = {}, causes = {}, lastCauses = {};
  const leak = game.leak.bind(game);
  game.leak = (e) => {
    const before = game.lives;
    leak(e);
    const lost = before - game.lives;   // (0 when Last Light saves it)
    if (lost <= 0) return;
    const k = (e.veiled ? 'veiled ' : '') + e.type;
    leaks[k] = (leaks[k] || 0) + lost;
    const c = leakCause(e, t, cond);
    causes[c] = (causes[c] || 0) + lost;
    lastCauses[game.wave] = lastCauses[game.wave] || {};
    lastCauses[game.wave][c] = (lastCauses[game.wave][c] || 0) + lost;
  };
  const t0 = game.time;
  let timedOut = false;
  const marks = [];   // [time, damage] at each wave's start, for the late damage rate
  for (;;) {
    if (game.over === 'win') game.continueEndless();
    if (game.over || game.wave >= cap) break;
    marks.push([game.time, t.dmg]);
    game.startWave();
    let w = 0, steps = 0;
    while (!game.over && !game.clear) {
      game.step(STEP);
      if (++steps % 30 === 0) {
        airOn();
        // its ability, as the bot uses abilities: when there's a crowd or a hulk
        if (t.abilityCd !== null && t.abilityCd <= 0 && (game.enemies.length >= 40 || game.enemies.some((e) => e.def.heavy))) game.useAbility(type);
      }
      if ((w += STEP) > 900) { timedOut = true; game.over = 'lose'; break; }
    }
  }
  const lost = game.over === 'lose';
  const cleared = lost ? game.wave - 1 : game.wave;
  const time = game.time - t0;
  // Late damage rate: over the last 3 waves played (the ones that broke it), when there's more to
  // hit than it can kill. Early waves are short of targets, so the whole-run rate understates it.
  const m = marks[Math.max(0, marks.length - 3)] || [t0, 0];
  const dpsLate = Math.round((t.dmg - m[1]) / Math.max(1, game.time - m[0]));
  return {
    type, path, tier, cond, start, seed, map, diff, minor, spot: o.spot || 0, x, y,
    name: path >= 0 ? def.paths[path].tiers[tier - 1].name : 'partner alone', tiers: (helper || t).tiers.join(''), cost: wardCost((helper || t).type, (helper || t).tiers),
    partner: o.partner ? `${t.type} ${t.tiers.join('')}` : undefined,
    cleared, capped: !lost, timedOut, lives: game.lives, dmg: Math.round(t.dmg), kills: t.kills,
    time: Math.round(time), dps: Math.round(t.dmg / Math.max(1, time)), dpsLate,
    leaks, causes, lastCauses: lastCauses[game.wave] || {},
  };
}

// CLI
if (process.argv[1] && process.argv[1].endsWith('solo.js')) {
  const pos = process.argv.slice(2).filter((a) => !a.includes('=') && !a.startsWith('-'));
  const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(k + '=')); return a ? a.slice(k.length + 1) : d; };
  if (pos.length < 2 || !TOWER_ORDER.includes(pos[0])) { console.log('usage: node tools/solo.js <type> <path 0-2> [tier=5] [cond=alone|reveal|full] [start=1] [seed=1] [map=hollowmere] [minor=] [spot=0]'); process.exit(1); }
  const o = { type: pos[0], path: Number(pos[1]), tier: Number(arg('tier', 5)), cond: arg('cond', 'alone'), start: Number(arg('start', 1)), seed: Number(arg('seed', 1)), map: arg('map', 'hollowmere'), diff: arg('diff', 'medium'), cap: Number(arg('cap', 150)), spot: Number(arg('spot', 0)) };
  if (arg('minor')) o.minor = Number(arg('minor'));
  const w0 = Date.now();
  const r = runSolo(o);
  console.log(JSON.stringify(r));
  console.log(`(${((Date.now() - w0) / 1000).toFixed(1)}s)`);
  void ENEMIES;
}
