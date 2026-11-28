// Power sweep: one tier 5 alone at a range of `power` values, with what changes inside it logged.
// Report-only tooling (built on tools/solo.js hooks); it never changes the game.
//
//   node tools/t5power.js coil:1 [powers=8,16,24,32,48] [cond=full] [seeds=1] [start=1] [cap=150] [--json]
//   node tools/t5power.js all|bolt,coil:1 [rel=0.5,1,2]   (multiples of each tier 5's baked power)
//
// Per run: waves cleared, lives lost by cause, its damage calls (and how many landed on enemies
// already dead), overkill (damage past a leaf enemy's health, i.e. carried into nothing), where
// along the road its kills happen (0 = Rift, 1 = Heartfire), and kills per wave. For the Storm Coil
// it also logs its strikes (forks per shot, chain length), and Ball Lightning's orbs (spawned,
// spawns delayed for want of a target, arc ticks, targets per tick, empty ticks, and orb damage).
import { readFileSync } from 'node:fs';
import { TOWERS, TOWER_ORDER } from '../public/js/data/towers.js';
import { runSolo } from './solo.js';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(k + '=')); return a ? a.slice(k.length + 1) : d; };
const SPOTS = JSON.parse(readFileSync(new URL('./t5spots.json', import.meta.url), 'utf8'));
const key = process.argv.slice(2).find((a) => !a.includes('=')) || 'coil:1';
const seeds = arg('seeds', '1').split(',').map(Number);
const cond = arg('cond', 'full'), start = Number(arg('start', 1)), cap = Number(arg('cap', 150));
const json = process.argv.includes('--json');
// powers=8,16,... are absolute; rel=0.5,1,2 multiply each tier 5's baked power (default for a list)
const absPowers = arg('powers', '') ? arg('powers', '').split(',').map(Number) : null;
const rel = arg('rel', '0.5,1,2').split(',').map(Number);
const noAttack = (ty) => TOWERS[ty].kind === 'aura' || TOWERS[ty].kind === 'vault';
const list = key === 'all' ? TOWER_ORDER.flatMap((ty) => [0, 1, 2].map((p) => `${ty}:${p}`))
  : key.split(',').flatMap((k) => (k.includes(':') ? [k] : [0, 1, 2].map((p) => `${k}:${p}`)));

function measure(type, path, power, seed) {
  const tier5 = TOWERS[type].paths[path].tiers[4];
  const sp = SPOTS[`${type}:${path}`] || {};
  const [spot = 0, minor] = sp[cond] || sp.full || sp.alone || [];
  tier5.power = power;
  const m = { calls: 0, deadCalls: 0, raw: 0, dealt: 0, over: 0, carryIn: 0, killD: 0, kills: 0, strikes: 0, strikeHits: 0, shots: 0,
    orbs: 0, orbWait: 0, orbTicks: 0, orbTargets: 0, orbEmpty: 0, orbDmg: 0, orbAhead: 0, killsByWave: {} };
  const seen = new WeakSet();
  let depth = 0, lastDealt = 0;
  const setup = (game, t) => {
    const damage = game.damage.bind(game);
    game.damage = (e, amount, dtype, src, opts) => {
      if (src !== t) return damage(e, amount, dtype, src, opts);
      m.calls++;
      if (!e.alive) { m.deadCalls++; return 0; }
      const before = e.hp + e.shield;
      depth++;
      const dealtAll = t.dmg;
      const r = damage(e, amount, dtype, src, opts);
      depth--;
      const nested = t.dmg - dealtAll - r;   // what the overkill carried into inner layers dealt
      if (depth === 0) {
        // raw = what this hit could have dealt: what landed (here and in the layers it carried into)
        // plus what overshot the last layer
        const over = e.alive ? 0 : Math.max(0, -e.hp) - Math.max(0, nested);
        m.raw += r + Math.max(0, nested) + Math.max(0, over); m.dealt += r + Math.max(0, nested); m.over += Math.max(0, over);
        m.carryIn += Math.max(0, nested);
        lastDealt = r + Math.max(0, nested);
      }
      void before;
      return r;
    };
    const kill = game.kill.bind(game);
    game.kill = (e, src, ...rest) => {
      if (src === t) {
        m.kills++;
        const len = game.map.routes[e.route] ? (e.def.flying ? game.map.routes[e.route].flyPath.length : game.map.routes[e.route].path.length) : 0;
        if (len) m.killD += e.dist / len;
        m.killsByWave[game.wave] = (m.killsByWave[game.wave] || 0) + 1;
      }
      return kill(e, src, ...rest);
    };
    game.fxOn = true;   // to count strikes (the 'arc' events); drained every step
    // an orb's arc is emitted right after its damage call: that call's damage is the orb's
    const emit = game.emit.bind(game);
    game.emit = (type, data) => { if (type === 'arc' && data.orb) m.orbDmg += lastDealt; emit(type, data); };
  };
  let lastT5 = 0, lastShot = 0;
  const ticks = new WeakMap();
  const onStep = (game, t) => {
    for (const f of game.fx) if (f.type === 'arc' && !f.orb) { m.strikes++; m.strikeHits += f.pts.length / 2 - 1; }
    game.fx.length = 0;
    if (t.shotN !== lastShot) { m.shots += t.shotN - lastShot; lastShot = t.shotN; }
    const s = t.stats;
    if (!s.orbEvery) return;
    if (t.t5T > lastT5 + 1e-6 && Math.abs(t.t5T - 0.3) < 0.02) m.orbWait++;   // the timer ran out with no live target: retry in 0.3s
    lastT5 = t.t5T;
    for (const o of game.orbs) {
      if (!seen.has(o)) { seen.add(o); m.orbs++; ticks.set(o, o.tick); }
      const prev = ticks.get(o);
      if (o.tick > prev) {   // it just arced: count what was in its reach
        m.orbTicks++;
        let n = 0, ahead = 0;
        for (const e of game.enemies) {
          if (!e.alive || !game.targetable(e, s, true)) continue;
          if ((e.x - o.x) ** 2 + (e.y - o.y) ** 2 <= s.orbRadius * s.orbRadius) n++;
          if (!e.def.flying && e.path === o.path && e.dist < o.d) ahead++;
        }
        m.orbTargets += Math.min(n, s.orbHits);
        if (!n) m.orbEmpty++;
        m.orbAhead += ahead;
      }
      ticks.set(o, o.tick);
    }
  };
  const r = runSolo({ type, path, tier: 5, cond, start, seed, spot, minor, cap, setup, onStep });
  tier5.power = power;
  return { power, seed, r, m };
}

const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '-');
for (const k of list) {
  const [type, ps] = k.split(':'), path = Number(ps);
  if (!TOWERS[type] || noAttack(type)) continue;
  const tier5 = TOWERS[type].paths[path].tiers[4], baked = tier5.power || 1;
  if (!tier5.power) continue;   // (no power: a support tier 5, or one with its own multiplier)
  const powers = absPowers || rel.map((f) => +(baked * f).toFixed(2));
  for (const seed of seeds) for (const p of powers) {
    const w0 = Date.now();
    const { r, m } = measure(type, path, p, seed);
    const row = {
      key: k, name: tier5.name, power: p, rel: +(p / baked).toFixed(2), seed, cleared: r.cleared, stalled: r.stalled || '', causes: r.causes, kills: m.kills, dmg: Math.round(m.dealt),
      deadCalls: pct(m.deadCalls, m.calls), overkill: pct(m.over, m.raw), carried: pct(m.carryIn, m.dealt), killAt: m.kills ? (m.killD / m.kills).toFixed(2) : '-',
      shots: m.shots, forksPerShot: m.shots ? (m.strikes / m.shots).toFixed(2) : '-', chainLen: m.strikes ? (m.strikeHits / m.strikes).toFixed(2) : '-',
      orbs: m.orbs, orbWait: m.orbWait, orbTicks: m.orbTicks, orbTargetsPerTick: m.orbTicks ? (m.orbTargets / m.orbTicks).toFixed(2) : '-',
      orbEmpty: pct(m.orbEmpty, m.orbTicks), orbDmgShare: pct(m.orbDmg, m.dealt), orbAheadPerTick: m.orbTicks ? (m.orbAhead / m.orbTicks).toFixed(1) : '-',
      lastWaves: Object.entries(m.killsByWave).slice(-3).map(([w, n]) => `${w}:${n}`).join(' '), secs: Math.round((Date.now() - w0) / 1000),
    };
    if (type !== 'coil') for (const f of ['shots', 'forksPerShot', 'chainLen']) delete row[f];
    if (!TOWERS[type].paths[path].tiers[4].set || !TOWERS[type].paths[path].tiers[4].set.orbEvery) for (const f of ['orbs', 'orbWait', 'orbTicks', 'orbTargetsPerTick', 'orbEmpty', 'orbDmgShare', 'orbAheadPerTick']) delete row[f];
    if (json) console.log(JSON.stringify(row));
    else console.log(Object.entries(row).map(([f, v]) => `${f}=${typeof v === 'object' ? JSON.stringify(v) : v}`).join('  '));
  }
  tier5.power = baked;
}
