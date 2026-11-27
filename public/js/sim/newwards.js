// The five round-2 wards (data/towers-new.js): the Heartfire Avatar, Astral Choir, Ferrylight, the
// Undertow and the Lampwright. Their per-step behaviours, their tier 4 abilities (one per path),
// and the things they leave in the world (wisps, candles, waves). No DOM access.
//
// Performance: Avatar motes and Orrery stars are damage ticks (no projectile objects); candles live
// in one pool on the game (game.candles) with a map-wide cap (RULES.candleCap), tick every 0.25 s
// like ground zones, and are drawn from cached sprites; Choir notes are one grid query each.
import { RULES } from '../data/rules.js';
import { applySlow } from './enemies.js';
import { newBolt, isLow } from './projectiles.js';

const TAU = Math.PI * 2;
const buf = [], buf2 = [], list = [];
const QUIET = { quiet: true }, DOT = { dot: true }, BIG = { big: true };
const TICK = 0.1;          // whirlpools, beams, wisps
const CANDLE_TICK = 0.25;  // candles (as ground zones)

const small = (e) => !e.def.heavy && !e.def.tough && !e.def.boss;
const layers = (e) => Math.ceil(e.hp / 10);
// A ward's main path (the one at tier 3+), else -1.
export function mainPathOf(t) { let pi = -1; for (let i = 0; i < 3; i++) if (t.tiers[i] >= 3 && (pi < 0 || t.tiers[i] > t.tiers[pi])) pi = i; return pi; }
function hold(e, dur) { e.stunT = Math.max(e.stunT, dur); e.rootT = Math.max(e.rootT, dur); }

// ---- shared targeting --------------------------------------------------------------------------
// Can the ward hit this enemy (it sees Veiled within `sight` of itself)?
function sees(game, t, s, e, x = t.x, y = t.y) {
  if (game.targetable(e, s)) return true;
  if (!e.alive || !e.veiled || !s.sight) return false;
  if (e.def.flying && !s.hitsAir && !isLow(e)) return false;
  return (e.x - x) ** 2 + (e.y - y) ** 2 <= s.sight * s.sight;
}
function pick(game, t, s, x, y, range, mode, prefer = null) {
  game.grid.query(x, y, range, buf);
  let best = null, bs = -Infinity;
  for (const e of buf) {
    if (!sees(game, t, s, e, x, y)) continue;
    const d2 = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d2 > (range + e.r * 0.5) ** 2) continue;
    let sc = mode === 'strong' ? e.def.rank * 1e5 + e.dist * e.prog : mode === 'close' ? -d2 : e.dist * e.prog;
    if (prefer === 'air' && e.def.flying) sc += 1e9;
    if (sc > bs) { bs = sc; best = e; }
  }
  return best;
}
// The road point nearest (x, y) and how far it is.
function nearestRoad(game, x, y) {
  const n = game.map.nearestRoute(x, y);
  const p = { x: 0, y: 0 };
  n.path.posAt(n.dist, p, 0);
  return { x: p.x, y: p.y, route: n.route, dist: n.dist, d: n.d, path: n.path };
}

// =================================================================================================
// HEARTFIRE AVATAR: a stream of Radiant motes into one target; Heat and flares (Solar), stars on
// their own targets (Orrery), tethers to nearby wards (Eclipse).
function avatar(game, t, dt) {
  const s = t.stats;
  const boost = t.buffT > 0 ? t.buffRate : 1;
  const bonus = 1 + (s.tetherBonus || 0) * (t.tethered ? t.tethered.length : 0);
  const corona = t.coronaT > 0 ? 2 : 1;
  if (t.coronaT > 0) { t.coronaT -= dt; if (t.coronaT <= 0) game.refreshGlobals(); }
  // the torrent (Syzygy pours extra streams at their own targets)
  if (s.streams > 1) {
    while (t.streams.length < s.streams - 1) t.streams.push({ e: null, acc: 0 });
    for (let k = 0; k < t.streams.length; k++) {
      const S = t.streams[k];
      if (!S.e || !sees(game, t, s, S.e) || (S.e.x - t.x) ** 2 + (S.e.y - t.y) ** 2 > (s.range + 10) ** 2) S.e = pick(game, t, s, t.x, t.y, s.range, k ? 'close' : 'first');
      if (!S.e) { S.acc = 0; continue; }
      S.acc -= dt * s.rate * boost * corona;
      let n = 0;
      while (S.acc <= 0 && S.e.alive && n < 40) { S.acc += 1; n++; mote(game, t, s, S.e, bonus); }
      if (S.acc < -1) S.acc = 0;
    }
  }
  let e = t.target && sees(game, t, s, t.target) && (t.target.x - t.x) ** 2 + (t.target.y - t.y) ** 2 <= (s.range + 10) ** 2 ? t.target : null;
  if (!e || t.retarget-- <= 0) { const n = pick(game, t, s, t.x, t.y, s.range, t.targetMode); t.retarget = 6; if (n !== e) { if (!s.heatCarry) t.heat = 0; e = n || e; } }
  t.target = e;
  if (e) {
    t.ang = Math.atan2(e.y - t.y, e.x - t.x);
    t.moteAcc -= dt * s.rate * boost * corona;
    t.firing = true;
    let shots = 0;
    while (t.moteAcc <= 0 && e.alive && shots < 40) {
      t.moteAcc += 1; shots++;
      mote(game, t, s, e, bonus);
      if (s.heatAt) { t.heat++; if (t.heat >= s.heatAt) { t.heat = 0; flare(game, t, s, e); } }
    }
    if (t.moteAcc < -1) t.moteAcc = 0;
    if (shots) t.moteT = game.time;
  } else { t.firing = false; if (t.moteAcc < 0) t.moteAcc = 0; }
  // Eclipse T3+: its sight is shared: Veiled near it are revealed to every ward.
  if (s.tetherSight && (t.t5N -= dt) <= 0) {
    t.t5N = 0.25;
    game.grid.query(t.x, t.y, s.sight, buf);
    for (const o of buf) if (o.veiled && o.alive) o.revealT = Math.max(o.revealT, 0.3);
  }
  // Syzygy: every tethered ward fires a free shot at its target.
  if (s.syzygyEvery && e && (t.t5T -= dt) <= 0) {
    t.t5T = s.syzygyEvery;
    for (const id of t.tethered || []) {
      const w = game.towers.find((o) => o.id === id);
      if (!w || !e.alive) continue;
      const ws = w.stats, d = (ws.damage || 0) * (ws.shots || 1) * s.syzygyMul;
      if (d > 0) game.damage(e, d, ws.type || 'radiant', w, BIG);
      game.emit('syzygy', { x: w.x, y: w.y, tx: e.x, ty: e.y });
    }
  }
  // Orrery: stars, each on its own target (lent stars fire from the ward they circle).
  if (s.stars) stars(game, t, s, dt, boost);
  // Sunfall: a pillar of light on the strongest enemy.
  if (t.pillarT > 0) {
    t.pillarT -= dt;
    let p = t.pillar;
    if (!p || !p.alive) { p = t.pillar = strongestOnMap(game); }
    if (p) game.damage(p, p.maxHp * t.pillarPct * dt, 'true', t, DOT);
  }
}
// One mote. A mote that kills flies on to the nearest enemy within 70 (moteChain times).
function mote(game, t, s, e, bonus) {
  game.damage(e, s.damage * bonus, s.type, t, QUIET);
  if (!s.moteChain || e.alive) return;
  let x = e.x, y = e.y;
  for (let j = 0; j < s.moteChain; j++) {
    game.grid.query(x, y, 70, buf2);
    let n = null, nd = 1e9;
    for (const o of buf2) { if (!sees(game, t, s, o, x, y)) continue; const d = (o.x - x) ** 2 + (o.y - y) ** 2; if (d < nd) { nd = d; n = o; } }
    if (!n) return;
    x = n.x; y = n.y;
    game.damage(n, s.damage * bonus, s.type, t, QUIET);
    if (n.alive) return;
  }
}
function flare(game, t, s, e) {
  const x = e.x, y = e.y;
  if (s.flarePct && e.alive) game.damage(e, e.maxHp * (e.def.boss ? s.flarePctBoss : s.flarePct), 'true', t, BIG);
  game.grid.query(x, y, s.flareRadius + 20, buf);
  list.length = 0;
  for (const o of buf) if (o.alive && (o.x - x) ** 2 + (o.y - y) ** 2 <= (s.flareRadius + o.r * 0.5) ** 2 && (!o.def.flying || s.hitsAir)) list.push(o);
  for (const o of list) {
    if (!o.alive) continue;
    if (s.sunMark) { o.sunT = s.sunMarkDur; o.sunPct = s.sunMark; }
    if (s.zenithStep && o.def.boss) o.zenithPct = Math.min(s.zenithMax, (o.zenithPct || 0) + s.zenithStep);
    game.damage(o, s.flareDmg, s.type, t, QUIET);
  }
  game.emit('flare5', { x, y, r: s.flareRadius });
}
function strongestOnMap(game) {
  let best = null, bs = -1;
  for (const e of game.enemies) if (e.alive && e.def.rank * 1e5 + e.dist > bs) { bs = e.def.rank * 1e5 + e.dist; best = e; }
  return best;
}
const MODES = ['first', 'strong', 'close', 'air', 'first', 'strong'];
function stars(game, t, s, dt, boost) {
  while (t.stars.length < s.stars) t.stars.push({ cd: t.stars.length * 0.1, tgt: null, host: 0, ang: (t.stars.length / s.stars) * TAU, fx: 0 });
  if (t.stars.length > s.stars) t.stars.length = s.stars;
  for (let i = 0; i < t.stars.length; i++) {
    const st = t.stars[i];
    st.ang += dt * 1.2;
    const host = st.host ? game.towers.find((o) => o.id === st.host) : null;
    if (st.host && !host) st.host = 0;
    const x = host ? host.x : t.x, y = host ? host.y : t.y;
    st.x = x + Math.cos(st.ang) * 22; st.y = y - 18 + Math.sin(st.ang) * 8;
    if (st.diveT > 0) { st.diveT -= dt; continue; }
    const mode = s.starModes ? MODES[i] : 'first';
    let e = st.tgt && sees(game, t, s, st.tgt, x, y) && (st.tgt.x - x) ** 2 + (st.tgt.y - y) ** 2 <= (s.range + 10) ** 2 ? st.tgt : null;
    if (!e || st.cd <= 0) e = pick(game, t, s, x, y, s.range, mode === 'air' ? 'first' : mode, mode === 'air' ? 'air' : null) || e;
    st.tgt = e;
    if (!e) { st.cd = Math.max(0, st.cd); continue; }
    st.cd -= dt * s.starRate * boost;
    let n = 0;
    while (st.cd <= 0 && e.alive && n < 20) { st.cd += 1; n++; game.damage(e, s.damage * (e.def.flying ? s.starAir || 1 : 1), s.type, t, QUIET); }
    if (st.cd < -1) st.cd = 0;
  }
}
// Grand Orrery: lend a star to another ward (one per ward); lending to the Avatar itself recalls them.
export function lendStar(game, t, w) {
  const s = t.stats;
  if (!s.lend || !t.stars) return false;
  if (w === t) { for (const st of t.stars) st.host = 0; game.refreshGlobals(); return true; }
  if (w.type === 'avatar' || t.stars.some((st) => st.host === w.id)) return false;
  const lent = t.stars.filter((st) => st.host).length;
  if (lent >= s.lend) { const st = t.stars.find((q) => q.host); st.host = w.id; }
  else { const st = t.stars.find((q) => !q.host); if (!st) return false; st.host = w.id; }
  game.refreshGlobals();
  return true;
}
// Eclipse tethers and lent-star sight, worked out in Game.refreshGlobals (after auras).
export function eclipseGlobals(game) {
  const taken = new Set();
  for (const t of game.towers) {
    if (t.type !== 'avatar') continue;
    t.tethered = [];
    const s = t.stats;
    if (s.stars && t.stars) for (const st of t.stars) if (st.host) { const w = game.towers.find((o) => o.id === st.host); if (w) w.stats.detect = true; }
    if (!s.tethers) continue;
    const near = game.towers.filter((w) => w !== t && w.type !== 'avatar' && !w.def.onPath && !taken.has(w.id) && (w.x - t.x) ** 2 + (w.y - t.y) ** 2 <= s.tetherRange ** 2)
      .sort((a, b) => ((a.x - t.x) ** 2 + (a.y - t.y) ** 2) - ((b.x - t.x) ** 2 + (b.y - t.y) ** 2)).slice(0, s.tethers);
    for (const w of near) {
      taken.add(w.id);
      t.tethered.push(w.id);
      if (s.tetherDrain && w.stats.damage) w.stats.damage *= 1 - s.tetherDrain;
      if (t.coronaT > 0) { if (w.stats.rate) w.stats.rate *= 1.4; else if (w.stats.damage) w.stats.damage *= 1.4; }
    }
  }
}

// =================================================================================================
// ASTRAL CHOIR: notes strike every enemy in the song; crescendos (Hymn), echoes (Chorus), freed
// wisps (Requiem). Hush (no haste in the song) is checked in Game.hasteAuras.
function choir(game, t, dt) {
  const s = t.stats;
  if (t.chorale > 0) t.chorale -= dt;
  if (t.echoes && t.echoes.length) {
    for (const ec of t.echoes) {
      if ((ec.t -= dt) > 0) continue;
      ec.done = true;
      for (const e of game.enemies) if (e.alive && (!e.def.flying || s.hitsAir)) game.damage(e, ec.dmg, s.type, t, DOT);
      game.emit('echo', { x: t.x, y: t.y });
    }
    t.echoes = t.echoes.filter((ec) => !ec.done);
    if (t.echoes.length > 8) t.echoes.splice(0, t.echoes.length - 8);
  }
  if (t.cd > 0) return;
  game.grid.query(t.x, t.y, s.range, buf);
  list.length = 0;
  for (const e of buf) if (e.alive && (!e.def.flying || s.hitsAir || isLow(e)) && (e.x - t.x) ** 2 + (e.y - t.y) ** 2 <= s.range * s.range) list.push(e);
  if (!list.length) { t.cd = 0; return; }
  t.cd += 1 / s.rate;
  t.pulseN++; t.pulseAnim = 1;
  if (list.length > s.maxHits) { for (const e of list) e._d2 = (e.x - t.x) ** 2 + (e.y - t.y) ** 2; list.sort((a, b) => a._d2 - b._d2); list.length = s.maxHits; }
  const times = t.chorale > 0 ? 2 : 1;
  const cres = s.cresEvery && (t.fortissimo > 0 || t.pulseN % s.cresEvery === 0);
  if (cres && t.fortissimo > 0) t.fortissimo--;
  let star = null;
  if (cres) { let bs = -1; for (const e of list) { const v = e.def.rank * 1e5 + e.dist * e.prog; if (v > bs) { bs = v; star = e; } } }
  for (let k = 0; k < times; k++) for (const e of list) if (e.alive) { e.songT = game.time + 0.5; e.songSrc = t; game.damage(e, s.damage, s.type, t, QUIET); }
  if (star && star.alive) {
    const x = star.x, y = star.y;
    if (s.bellNoPhase && star.def.boss) star.noPhaseT = game.time + s.bellNoPhase;
    game.damage(star, s.damage * s.cresMul, s.type, t, BIG);
    if (star.alive && s.cresStun) { if (star.def.heavy) applySlow(star, 0.5, s.cresStun); else hold(star, s.cresStun); }
    if (s.bellRadius) { game.grid.query(x, y, s.bellRadius, buf2); for (const o of buf2) if (o !== star && o.alive && (!o.def.flying || s.hitsAir)) game.damage(o, s.damage * s.cresMul, s.type, t, QUIET); }
    game.emit('crescendo', { x, y, r: s.bellRadius || 30, x0: t.x, y0: t.y });
  }
  if (s.echoMul) (t.echoes || (t.echoes = [])).push({ t: s.echoDelay, dmg: s.damage * s.echoMul });
  game.emit('note', { x: t.x, y: t.y, r: s.range, cres: !!star });
}
// Requiem: a kill in the song frees a wisp (and Last Requiem raises hulks as lantern-wisps).
function freeWisp(game, src, e, great) {
  const s = src.stats;
  if (e.def.flying) return;
  const mine = game.wisps.filter((w) => w.src === src && !w.great).length;
  if (!great && mine >= s.wispMax) return;
  game.wisps.push({ src, x: e.x, y: e.y, route: e.route, dist: e.dist, path: game.map.routes[e.route].path, great: !!great,
    left: great ? 99 : s.wispPierce, dmg: s.wispDmg, life: great ? s.redeem : 6, hit: [], speed: great ? 40 : 170, flood: false });
}
function updateWisps(game, dt) {
  const W = game.wisps;
  if (!W.length) return;
  for (const w of W) {
    w.life -= dt;
    w.dist -= w.speed * dt;
    if (w.dist <= 0) w.life = 0;
    w.path.posAt(Math.max(0, w.dist), w, 0);
    if ((w.tick = (w.tick || 0) - dt) > 0) continue;
    w.tick = w.great ? 0.2 : 0.05;
    const s = w.src.stats;
    game.grid.query(w.x, w.y, w.great ? 26 : 16, buf);
    for (const e of buf) {
      if (!e.alive || e.def.flying || e.route !== w.route) continue;
      if (s.wispReveal && e.veiled) e.revealT = Math.max(e.revealT, 2);
      if (w.great) {
        // a lantern-wisp holds back small Gloom; Heavies push through and take damage
        if (e.def.heavy) game.damage(e, s.damage * 2, s.type, w.src, DOT);
        else { hold(e, 0.25); game.pushBack(e, 6, w.src); }
        continue;
      }
      if (w.hit.includes(e.root)) continue;
      w.hit.push(e.root);
      game.damage(e, Math.max(w.dmg, s.wispStrip ? 10 : 0), s.type, w.src, QUIET);
      if (!w.flood && --w.left <= 0) { w.life = 0; break; }
    }
  }
  game.wisps = W.filter((w) => w.life > 0);
}

// =================================================================================================
// FERRYLIGHT: boathook bolts (drag, anchor), light-rafts (Flotilla), a sweeping beam (Lighthouse).
function ferry(game, t, dt) {
  const s = t.stats;
  const boost = t.buffT > 0 ? t.buffRate : 1;
  if (t.target && !t.target.alive) t.target = null;
  if (t.target) { const want = Math.atan2(t.target.y - t.y, t.target.x - t.x); t.ang += Math.max(-9 * dt, Math.min(9 * dt, ((want - t.ang + Math.PI) % TAU + TAU) % TAU - Math.PI)); }
  if (t.cd <= 0) {
    game.pickTargets(t, 1, buf2);
    const e = buf2[0];
    if (e) {
      t.cd += 1 / s.rate;
      t.target = e; t.recoil = 1;
      t.ang = Math.atan2(e.y - t.y, e.x - t.x);
      throwBolt(game, t, s, t.x, t.y, e, s.damage, s.drag ? 1 : 0);
      game.emit('fire', { x: t.x, y: t.y, ang: t.ang, kind: 'ferry' });
    }
  }
  // Heartline: every few seconds the glowing chain sweeps everything in reach.
  if (s.chainSweep && (t.t5T -= dt) <= 0) {
    t.t5T = s.chainSweep;
    game.grid.query(t.x, t.y, s.range, buf);
    list.length = 0;
    for (const e of buf) if (game.targetable(e, s, true) && (e.x - t.x) ** 2 + (e.y - t.y) ** 2 <= s.range * s.range) list.push(e);
    for (const e of list) if (e.alive) game.damage(e, s.damage * 3, s.type, t, QUIET);
    game.emit('dawnpulse', { x: t.x, y: t.y, r: s.range });
  }
  if (s.rafts) rafts(game, t, s, dt, boost);
  if (s.dazzle) beams(game, t, s, dt);
  if (t.broadsideT > 0) t.broadsideT -= dt;
}
function throwBolt(game, t, s, x, y, e, dmg, drag) {
  const a = Math.atan2(e.y - y, e.x - x);
  game.projectiles.push(newBolt({
    kind: 'bolt', hook: true, x: x + Math.cos(a) * 12, y: y + Math.sin(a) * 12, vx: Math.cos(a) * s.projSpeed, vy: Math.sin(a) * s.projSpeed, speed: s.projSpeed,
    target: e, homing: !s.lance, dmg, pierce: s.pierce, hit: [], bounces: 0, life: s.lance ? 900 : s.range * 1.6 + 60, src: t, s, dead: false, drag: drag ? s.dragChain || 1 : 0,
  }));
}
// Called by projectiles.js hitBolt for a hook bolt: drags its first victims back up the road.
export function hookHit(game, p, e) {
  const s = p.s;
  if (!e.alive || !p.drag) return;
  if (e.def.heavy) { if (s.heavySlow) applySlow(e, s.heavySlow, 1.5); }
  else game.pushBack(e, s.drag, p.src);
  if (s.anchor) hold(e, e.def.boss ? s.anchorBoss : s.anchor);
  p.drag--;
  game.emit('hook', { x: e.x, y: e.y, x0: p.src.x, y0: p.src.y });
}
function rafts(game, t, s, dt, boost) {
  while (t.rafts.length < s.rafts) { const a = (t.rafts.length / Math.max(1, s.rafts)) * TAU; t.rafts.push({ x: t.x + Math.cos(a) * 14, y: t.y + Math.sin(a) * 8, gx: t.x, gy: t.y, cd: t.rafts.length * 0.3, ang: 0, ashore: false }); }
  if (t.rafts.length > s.rafts) t.rafts.length = s.rafts;
  const range = s.raftRange;
  for (const r of t.rafts) {
    // patrol: toward a water point near the nearest enemy (within raftPatrol of the ward); ashore with Shore Party
    const e = pick(game, t, s, r.x, r.y, range + (s.shoreParty || 0) + 60, 'first');
    if (e && (r.retarget = (r.retarget || 0) - dt) <= 0) {
      r.retarget = 1;
      let best = null, bd = Infinity;
      for (let k = 0; k < 10; k++) {
        const a = game.rand() * TAU, d = game.rand() * s.raftPatrol;
        const x = t.x + Math.cos(a) * d, y = t.y + Math.sin(a) * d;
        const wet = game.map.inWater(x, y, 8);
        if (!wet && !(s.shoreParty && game.map.nearWater(x, y, s.shoreParty))) continue;
        const dd = (x - e.x) ** 2 + (y - e.y) ** 2;
        if (dd < bd) { bd = dd; best = [x, y, !wet]; }
      }
      if (best) { r.gx = best[0]; r.gy = best[1]; r.ashore = best[2]; }
    }
    const mx = r.gx - r.x, my = r.gy - r.y, md = Math.hypot(mx, my);
    if (md > 1) { const k = Math.min(1, (s.raftSpeed * dt) / md); r.x += mx * k; r.y += my * k; }
    r.cd -= dt * s.raftRate * boost * (t.broadsideT > 0 ? 3 : 1);
    if (r.cd > 0 || !e || (e.x - r.x) ** 2 + (e.y - r.y) ** 2 > range * range) { if (r.cd < 0) r.cd = 0; continue; }
    r.cd += 1;
    r.ang = Math.atan2(e.y - r.y, e.x - r.x);
    const fan = t.broadsideT > 0 ? 6 : 1;
    for (let k = 0; k < fan; k++) throwBolt(game, t, s, r.x, r.y, e, s.damage * 0.7, 0);
  }
}
// The Lighthouse beam(s): sweep back and forth over the road in reach; what they light is Dazzled.
function beams(game, t, s, dt) {
  if (!t.sweep) {
    // the angles of the road in reach
    let a0 = Infinity, a1 = -Infinity;
    for (const R of game.map.routes) {
      const P = R.path;
      for (let i = 0; i < P.count; i += 3) {
        const dx = P.xs[i] - t.x, dy = P.ys[i] - t.y;
        if (dx * dx + dy * dy > (s.range * 1.3) ** 2) continue;
        let a = Math.atan2(dy, dx);
        if (a0 !== Infinity && a < (a0 + a1) / 2 - Math.PI) a += TAU;
        a0 = Math.min(a0, a); a1 = Math.max(a1, a);
      }
    }
    if (a0 === Infinity) { a0 = -1; a1 = 1; }
    if (a1 - a0 > TAU * 0.9) { a0 = 0; a1 = TAU; }
    t.sweep = { a0, a1, a: a0, dir: 1 };
  }
  const sw = t.sweep;
  if (t.lightfallT > 0) t.lightfallT -= dt;
  else {
    sw.a += sw.dir * dt * 0.7;
    if (sw.a > sw.a1) { sw.a = sw.a1; sw.dir = -1; } else if (sw.a < sw.a0) { sw.a = sw.a0; sw.dir = 1; }
  }
  t.beamA = sw.a;
  t.beamB = s.twinBeams ? sw.a0 + sw.a1 - sw.a : null;   // the twin sweeps the other way
  if ((t.t5N -= dt) > 0) return;
  t.t5N = TICK;
  const len = s.range * s.beamLen, half = s.beamArc / 2;
  game.grid.query(t.x, t.y, len, buf);
  const inBeam = (e, a) => { let d = Math.atan2(e.y - t.y, e.x - t.x) - a; d = ((d + Math.PI) % TAU + TAU) % TAU - Math.PI; return Math.abs(d) <= half + e.r / Math.max(30, Math.hypot(e.x - t.x, e.y - t.y)); };
  for (const e of buf) {
    if (!e.alive || (e.x - t.x) ** 2 + (e.y - t.y) ** 2 > len * len) continue;
    const a = inBeam(e, t.beamA), b = t.beamB !== null && inBeam(e, t.beamB);
    if (!a && !b) continue;
    if (s.beamBurn) game.damage(e, s.damage * s.beamBurn * TICK, s.type, t, DOT);
    if (!e.alive) continue;
    const f = e.def.boss ? s.dazzle * (s.dazzleBoss || 0) : s.dazzle;
    if (f > 0) applySlow(e, f, 0.3);
    if (s.dazzleAmp) { e.dazzleT = 0.3; e.dazzleAmp = s.dazzleAmp; }
    if (e.veiled) e.revealT = Math.max(e.revealT, s.revealHold || 0.3);
    if (s.beamHush && e.def.haste) e.hushT = 0.3;
    if (a && b && s.harbourStop && (e.harbourCd || 0) < game.time) { e.harbourCd = game.time + 4; hold(e, e.def.boss ? s.harbourStopBoss : s.harbourStop); }
  }
}

// =================================================================================================
// THE UNDERTOW: a whirlpool on the nearest stretch of road; waves (Tidecaller); the Abyss.
export function placeWhirl(game, t, x = t.x, y = t.y) {
  const r = nearestRoad(game, x, y);
  if ((r.x - t.x) ** 2 + (r.y - t.y) ** 2 > (t.stats.range + 4) ** 2) return false;
  t.whirl = { x: r.x, y: r.y, route: r.route, dist: r.dist };
  t.whirl2 = null;
  return true;
}
// A tier 5's second whirlpool: the stretch of road in reach furthest along the road from the first.
function placeWhirl2(game, t) {
  const W = t.whirl, s = t.stats;
  let best = null, bs = 2 * s.whirlRadius;
  for (const R of game.map.routes) {
    const P = R.path;
    for (let i = 0; i < P.count; i += 3) {
      if ((P.xs[i] - t.x) ** 2 + (P.ys[i] - t.y) ** 2 > s.range * s.range) continue;
      const gap = R.index === W.route ? Math.abs(i * P.step - W.dist) : 1e4;
      const sep = Math.hypot(P.xs[i] - W.x, P.ys[i] - W.y);
      const sc = Math.min(gap, sep * 3);
      if (sep > s.whirlRadius * 1.6 && sc > bs) { bs = sc; best = { x: P.xs[i], y: P.ys[i], route: R.index, dist: i * P.step }; }
    }
  }
  t.whirl2 = best || false;
}
function undertow(game, t, dt) {
  const s = t.stats;
  if (!t.whirl && !placeWhirl(game, t)) return;
  const W = t.whirl;
  if (t.ripT > 0) t.ripT -= dt;
  if (t.floodT > 0) t.floodT -= dt;
  if (t.mawT > 0) t.mawT -= dt;
  // waves
  if (s.waveEvery && (t.waveT -= dt) <= 0) {
    t.waveT = s.waveEvery;
    const n = s.waves || 1;
    for (let k = 0; k < n; k++) wave(game, t, s, W.dist - k * (s.waveLen + 30), s.waveLen, s.waveBack, false);
  }
  if (s.breakEvery && (t.breakT -= dt) <= 0) { t.breakT = s.breakEvery; wave(game, t, s, W.dist, s.breakLen, s.breakLen, true); }
  if (s.spoutEvery && (t.t5T -= dt) <= 0) {
    t.t5T = s.spoutEvery;
    game.grid.query(W.x, W.y, s.whirlRadius * 1.5, buf);
    list.length = 0;
    for (const e of buf) if (e.alive) list.push(e);
    for (const e of list) {
      if (e.def.flying) { if ((e.x - W.x) ** 2 + (e.y - W.y) ** 2 <= (s.whirlRadius * 1.5) ** 2) e.groundT = Math.max(e.groundT, s.spoutAir); }
      else if (small(e) && (e.x - W.x) ** 2 + (e.y - W.y) ** 2 <= s.whirlRadius ** 2) { game.pushBack(e, s.spoutBack, t); hold(e, 0.6); }
    }
    game.emit('spout', { x: W.x, y: W.y, r: s.whirlRadius });
  }
  if ((t.t5N -= dt) > 0) return;
  t.t5N = TICK;
  const abyssNow = s.abyssEvery && (t.abyssT -= TICK) <= 0;
  if (abyssNow) t.abyssT = s.abyssEvery;
  whirlTick(game, t, s, W, true, abyssNow);
  if ((s.whirls || 1) > 1) {
    if (t.whirl2 === null) placeWhirl2(game, t);
    if (t.whirl2) whirlTick(game, t, s, t.whirl2, false, abyssNow);
  }
}
function whirlTick(game, t, s, W, main, abyssNow) {
  const R = s.whirlRadius, ripR = main && t.ripT > 0 ? 140 : 0, floodR = main && t.floodT > 0 ? 220 : 0, mawR = main && t.mawT > 0 ? 80 : 0;
  const reach = Math.max(R, ripR, floodR, mawR);
  game.grid.query(W.x, W.y, reach + 20, buf);
  list.length = 0;
  for (const e of buf) if (e.alive && !e.def.flying) list.push(e);
  for (const e of list) {
    if (!e.alive) continue;
    const d2 = (e.x - W.x) ** 2 + (e.y - W.y) ** 2;
    if (mawR && d2 <= mawR * mawR && !e.def.tough && !e.def.heavy && !e.def.boss) { game.kill(e, t, 0, s.type); continue; }
    if (ripR && d2 <= ripR * ripR && !e.def.boss && e.route === W.route) { const k = Math.sign(W.dist - e.dist) * Math.min(Math.abs(W.dist - e.dist), 70 * TICK); if (k < 0) game.pushBack(e, -k, t); else e.dist += k; }
    if (floodR && d2 <= floodR * floodR) { applySlow(e, 0.5, 0.3); if (!e.def.heavy) game.pushBack(e, 20 * TICK, t); }
    const r = R + e.r * 0.5;
    if (d2 > r * r) { if (main) e.whirlIn = false; continue; }
    // in the whirl
    if (!e.whirlIn) { e.whirlIn = true; if (s.spin && small(e)) hold(e, s.spin); }
    applySlow(e, s.slow, 0.3);
    if (!e.def.heavy) game.pushBack(e, s.pull * TICK, t);
    if (s.whirlAmp) { e.whirlT = 0.3; e.whirlAmp = s.whirlAmp; }
    if (s.deepNoHeal) e.searT = Math.max(e.searT, 0.3);
    let dps = s.damage;
    const centre = d2 <= (R * 0.4) ** 2;
    if (s.deep && centre) dps += s.deep;
    game.damage(e, dps * TICK, s.type, t, DOT);
    if (!e.alive) continue;
    if (s.drown && e.def.heavy && !e.def.boss) game.damage(e, e.maxHp * s.drown * TICK, 'true', t, DOT);
    if (s.deepBoss && e.def.boss) game.damage(e, e.maxHp * s.deepBoss * TICK, 'true', t, DOT);
    if (!e.alive) continue;
    if (s.grip && centre && small(e) && e.def.hp <= 10) { e.gripT = (e.gripT || 0) + TICK; if (e.gripT >= s.grip) { pullUnder(game, t, e); continue; } }
    if (abyssNow) {
      if (small(e) && layers(e) <= 2 && e.def.hp <= 20) pullUnder(game, t, e);
      else if (e.def.tough && !e.def.heavy) game.damage(e, 10, 'true', t, QUIET);
    }
  }
}
function pullUnder(game, t, e) {
  game.emit('pullunder', { x: e.x, y: e.y });
  game.kill(e, t, 0, t.stats.type, null, 0.5);
}
function wave(game, t, s, at, len, back, great) {
  const R = game.map.routes[t.whirl.route], P = R.path;
  for (const e of game.enemies) {
    if (!e.alive || e.def.flying || e.route !== t.whirl.route) continue;
    if (e.dist < at - len / 2 || e.dist > at + len / 2) continue;
    if (great ? e.def.boss : e.def.heavy) { if (s.waveHeavy) applySlow(e, s.waveHeavy, 1); continue; }
    game.pushBack(e, back, t);
  }
  const p = { x: 0, y: 0 };
  P.posAt(Math.max(0, at), p, 0);
  game.emit('tide', { x: p.x, y: p.y, len, great, route: t.whirl.route, at });
}

// =================================================================================================
// LAMPWRIGHT: candles thrown ahead of the Gloom onto the road. One pool (game.candles), a per-ward
// cap (candleMax) and a map-wide cap (RULES.candleCap): the oldest go out first.
function lamp(game, t, dt) {
  const s = t.stats;
  if (s.taper && !t.taper) placeTaper(game, t);
  if (t.watchT > 0) t.watchT -= dt;
  if (t.cd > 0) return;
  // aim ahead of the leading enemy in reach, on its road
  const e = pick(game, t, { ...s, detect: true, hitsAir: false }, t.x, t.y, s.range + 40, 'first');
  if (!e) { t.cd = 0; return; }
  t.cd += 1 / s.rate;
  t.recoil = 1;
  t.ang = Math.atan2(e.y - t.y, e.x - t.x);
  const P = game.map.routes[e.route].path;
  let d = e.dist + e.speed * 1.2;
  for (let k = 0; k < s.tossN; k++) {
    const dd = d + (s.tossN >= 4 ? (k - 1.5) * 18 : s.tossN === 2 ? (k - 0.5) * 22 : 0);
    tossCandle(game, t, s, P, e.route, dd, false, Math.max(0, dd - e.dist + 30));
  }
  game.emit('fire', { x: t.x, y: t.y, ang: t.ang, kind: 'lamp' });
}
const at = { x: 0, y: 0 };
function tossCandle(game, t, s, P, route, d, instant = false, back = 0) {
  d = Math.max(20, Math.min(P.length - 20, d));
  P.posAt(d, at, (game.rand() - 0.5) * 18);
  // only on road in reach: if the spot ahead is out of reach, step back along the road toward the
  // Gloom (up to `back`) to the furthest point the lamplighter can reach
  for (let k = 0; k < back && (at.x - t.x) ** 2 + (at.y - t.y) ** 2 > (s.range + 20) ** 2; k += 15) { d -= 15; P.posAt(Math.max(20, d), at, (game.rand() - 0.5) * 18); }
  if ((at.x - t.x) ** 2 + (at.y - t.y) ** 2 > (s.range + 20) ** 2) return false;
  const C = game.candles;
  let mine = 0, oldest = null;
  for (const c of C) if (c.src === t && !c.taper) { mine++; if (!oldest || c.born < oldest.born) oldest = c; }
  if (mine >= s.candleMax && oldest) oldest.life = 0;
  if (C.length >= RULES.candleCap) { let o = null; for (const c of C) if (!c.taper && c.life > 0 && (!o || c.born < o.born)) o = c; if (o) o.life = 0; }
  C.push({ x: at.x, y: at.y, route, dist: d, src: t, r: s.candleR, life: s.candleLife, born: game.time, land: instant ? 0 : 0.45, sx: t.x, sy: t.y - 20, taper: false, size: s.candleR >= 26 ? 2 : s.candleR >= 18 ? 1 : 0, ph: game.rand() * 6.28 });
  return true;
}
function placeTaper(game, t, x, y) {
  const s = t.stats;
  let best = null, bs = -1;
  if (x !== undefined) { const r = nearestRoad(game, x, y); if ((r.x - t.x) ** 2 + (r.y - t.y) ** 2 <= (s.range + 4) ** 2) best = r; }
  else for (const R of game.map.routes) {
    const P = R.path;
    for (let i = 0; i < P.count; i += 4) {
      if ((P.xs[i] - t.x) ** 2 + (P.ys[i] - t.y) ** 2 > s.range * s.range) continue;
      let n = 0;
      for (let j = 0; j < P.count; j += 4) if ((P.xs[j] - P.xs[i]) ** 2 + (P.ys[j] - P.ys[i]) ** 2 <= s.taperR * s.taperR) n++;
      if (n > bs) { bs = n; best = { x: P.xs[i], y: P.ys[i], route: R.index, dist: i * P.step }; }
    }
  }
  if (!best) return false;
  game.candles = game.candles.filter((c) => !(c.taper && c.src === t));
  game.candles.push({ x: best.x, y: best.y, route: best.route, dist: best.dist, src: t, r: s.taperR, life: Infinity, born: game.time, land: 0, sx: t.x, sy: t.y, taper: true, size: 3, ph: 0 });
  t.taper = true;
  return true;
}
export function moveTaper(game, t, x, y) { return t.stats.taper ? placeTaper(game, t, x, y) : false; }
function updateCandles(game, dt) {
  const C = game.candles;
  if (!C.length) return;
  game.candleT = (game.candleT || 0) - dt;
  const tick = game.candleT <= 0;
  if (tick) game.candleT += CANDLE_TICK;
  const now = game.time;
  for (const c of C) {
    if (c.land > 0) { c.land -= dt; continue; }
    if (!c.taper) c.life -= dt;
    if (!tick || c.life <= 0) continue;
    const t = c.src, s = t.stats;
    if (!game.towers.includes(t)) { c.life = 0; continue; }
    const watch = t.watchT > 0;
    const dps = c.taper ? s.damage * s.taperMul : s.damage;
    const slow = Math.max(s.waxSlow || 0, s.candleSlow || 0, watch ? 0.4 : 0);
    const rv = (s.candleReveal || 0) * (watch ? 2 : 1);
    const reach = Math.max(c.r, rv, s.vigilR || 0);
    game.grid.query(c.x, c.y, reach + 20, buf);
    for (const e of buf) {
      if (!e.alive || (e.def.flying && !isLow(e))) continue;
      const d2 = (e.x - c.x) ** 2 + (e.y - c.y) ** 2;
      if (rv && e.veiled && d2 <= rv * rv) e.revealT = Math.max(e.revealT, CANDLE_TICK * 1.5);
      if (s.vigilAmp && d2 <= s.vigilR * s.vigilR) { e.vigilT = CANDLE_TICK * 1.5; e.vigilAmp = s.vigilAmp; }
      const r = c.r + e.r * 0.5;
      if (d2 > r * r) continue;
      if (slow) applySlow(e, slow, CANDLE_TICK * 1.6);
      e.candleAt = now; e.candleSrc = t;
      if (e.candleTick === now) continue;   // one candle per tick
      e.candleTick = now;
      if (e.burnT <= 0 || e.burnDps <= dps) { e.burnDps = dps; e.burnSrc = t; e.burnType = 'fire'; }
      e.burnT = Math.max(e.burnT, s.burnDur);
      e.searT = Math.max(e.searT, s.searDur);
    }
  }
  // Eternal Vigil: lines of light between neighbouring candles of one ward.
  if (tick) for (const t of game.towers) if (t.type === 'lamp' && t.stats.vigilLine) vigilLines(game, t);
  let w = 0;
  for (let i = 0; i < C.length; i++) if (C[i].life > 0) C[w++] = C[i];
  C.length = w;
}
function vigilLines(game, t) {
  const s = t.stats, mine = game.candles.filter((c) => c.src === t && c.land <= 0 && c.life > 0);
  const links = t.links || (t.links = []);
  links.length = 0;
  for (let i = 0; i < mine.length; i++) for (let j = i + 1; j < mine.length; j++) {
    const a = mine[i], b = mine[j];
    if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= 70 * 70 && links.length < 40) links.push(a, b);
  }
  for (let k = 0; k < links.length; k += 2) {
    const a = links[k], b = links[k + 1], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    game.grid.query(mx, my, 50, buf);
    const vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy || 1;
    for (const e of buf) {
      if (!e.alive || (e.def.flying && !isLow(e))) continue;
      const u = Math.max(0, Math.min(1, ((e.x - a.x) * vx + (e.y - a.y) * vy) / L2));
      const px = a.x + vx * u - e.x, py = a.y + vy * u - e.y;
      if (px * px + py * py > (8 + e.r * 0.5) ** 2) continue;
      if (e.veiled) e.revealT = Math.max(e.revealT, 1);
      applySlow(e, 0.3, 0.4);
      if (e.burnT <= 0 || e.burnDps <= s.damage) { e.burnDps = s.damage; e.burnSrc = t; e.burnType = 'fire'; }
      e.burnT = Math.max(e.burnT, s.burnDur);
    }
  }
}
// Thousand Wicks: an enemy that dies on a candle splits it.
function wildwick(game, e) {
  const t = e.candleSrc, s = t && t.stats;
  if (!s || !s.wildwick || game.time - e.candleAt > 0.3 || !game.towers.includes(t)) return;
  t.wickTokens = Math.min(s.wildwick, (t.wickTokens || 0));
  if (t.wickTokens < 1) return;
  t.wickTokens--;
  const P = game.map.routes[e.route].path;
  tossCandle(game, t, s, P, e.route, e.dist + (game.rand() - 0.3) * 40, true);
}

// =================================================================================================
// Abilities: one per path at tier 4 (data/abilities.js ABILITIES[type].paths[pi]).
export function useNewAbility(game, t, type, ab, pi) {
  const s = t.stats;
  if (type === 'avatar') {
    if (pi === 0) { t.pillarT = ab.dur; t.pillarPct = ab.pct; t.pillar = strongestOnMap(game); }
    else if (pi === 1) {
      for (const st of t.stars || []) {
        const e = st.tgt && st.tgt.alive ? st.tgt : pick(game, t, s, st.x || t.x, st.y || t.y, s.range * 1.5, 'strong');
        if (!e) continue;
        const x = e.x, y = e.y;
        game.grid.query(x, y, ab.radius, buf);
        list.length = 0; for (const o of buf) if (o.alive) list.push(o);
        for (const o of list) if (o.alive) game.damage(o, s.damage * ab.mul, s.type, t, QUIET);
        st.diveT = ab.back;
        game.emit('flare5', { x, y, r: ab.radius });
      }
    } else { t.coronaT = ab.dur; game.refreshGlobals(); }
  } else if (type === 'choir') {
    if (pi === 0) { t.fortissimo = ab.notes; t.cd = Math.min(t.cd, 0.2); }
    else if (pi === 1) t.chorale = ab.dur;
    else {
      // Release: every living wisp joins one flood sweeping the road back toward the Rift.
      const mine = game.wisps.filter((w) => w.src === t && !w.great);
      if (mine.length) {
        const w = mine.reduce((a, b) => (b.dist > a.dist ? b : a));
        const n = mine.length;
        for (const m of mine) m.life = 0;
        game.wisps.push({ ...w, life: 8, left: 999, dmg: s.wispDmg * Math.max(3, n), speed: 420, flood: true, hit: [] });
      }
      // Each road in the song also gets a flood from its nearest point.
      const r = nearestRoad(game, t.x, t.y);
      game.wisps.push({ src: t, x: r.x, y: r.y, route: r.route, dist: r.dist + s.range, path: game.map.routes[r.route].path, great: false, left: 999, dmg: s.wispDmg * 3, life: 8, hit: [], speed: 420, flood: true });
    }
  } else if (type === 'ferry') {
    if (pi === 0) {
      game.grid.query(t.x, t.y, s.range, buf);
      let best = null, bs = -1;
      for (const e of buf) if (e.alive && !e.def.boss && (!e.def.flying || s.hitsAir) && e.def.rank * 1e5 + e.dist > bs) { bs = e.def.rank * 1e5 + e.dist; best = e; }
      if (best) { game.pushBack(best, ab.drag, t); hold(best, 0.5); game.emit('hook', { x: best.x, y: best.y, x0: t.x, y0: t.y }); }
    } else if (pi === 1) t.broadsideT = ab.dur;
    else {
      t.lightfallT = ab.dur;
      const len = s.range * (s.beamLen || 1);
      game.grid.query(t.x, t.y, len, buf);
      for (const e of buf) {
        if (!e.alive) continue;
        let d = Math.atan2(e.y - t.y, e.x - t.x) - (t.beamA || 0);
        d = ((d + Math.PI) % TAU + TAU) % TAU - Math.PI;
        if (Math.abs(d) <= (s.beamArc || 0.5) && (e.x - t.x) ** 2 + (e.y - t.y) ** 2 <= len * len) { if (e.def.boss) applySlow(e, 0.6, ab.stop); else hold(e, ab.stop); }
      }
    }
  } else if (type === 'undertow') {
    if (pi === 0) t.ripT = ab.dur; else if (pi === 1) t.floodT = ab.dur; else t.mawT = ab.dur;
  } else if (type === 'lamp') {
    if (pi === 0) {
      for (const c of game.candles) {
        if (c.land > 0) continue;
        game.grid.query(c.x, c.y, c.r + 10, buf);
        for (const e of buf) if (e.alive && !e.def.boss && !e.def.flying && (e.x - c.x) ** 2 + (e.y - c.y) ** 2 <= (c.r + e.r * 0.5) ** 2) hold(e, e.def.heavy ? ab.heavy : ab.dur);
      }
    } else if (pi === 1) {
      let n = 0;
      for (let k = 0; k < ab.n * 3 && n < ab.n; k++) {
        const R = game.map.routes[Math.floor(game.rand() * game.map.routes.length)], P = R.path;
        const d = game.rand() * P.length;
        P.posAt(d, at, 0);
        if ((at.x - t.x) ** 2 + (at.y - t.y) ** 2 > s.range * s.range) continue;
        if (tossCandle(game, t, { ...s, candleMax: Math.max(s.candleMax, ab.n) }, P, R.index, d)) n++;
      }
    } else t.watchT = ab.dur;
  }
}

// ---- hooks used by the game ---------------------------------------------------------------------
export const NEW_BEHAVIOURS = { avatar, choir, ferry, undertow, lamp };

export function newKill(game, e, src) {
  // Requiem: a kill in a Choir's song frees a wisp (Last Requiem: a hulk rises as a lantern-wisp).
  const c = e.songT > game.time ? e.songSrc : null;
  if (c && c.stats.wispChance && game.towers.includes(c)) {
    if (c.stats.redeem && (e.def.tough || e.def.heavy) && !e.def.boss) freeWisp(game, c, e, true);
    else if (game.rand() < c.stats.wispChance) freeWisp(game, c, e, false);
  }
  if (e.candleSrc) wildwick(game, e);
}

export function updateNew(game, dt) {
  updateWisps(game, dt);
  updateCandles(game, dt);
  for (const t of game.towers) if (t.type === 'lamp' && t.stats.wildwick) t.wickTokens = Math.min(t.stats.wildwick, (t.wickTokens || 0) + t.stats.wildwick * dt);
}

// The extra fields a tower of these kinds carries (one shape for every tower).
export function newTowerFields(t) {
  t.heat = 0; t.moteAcc = 0; t.retarget = 0; t.streams = []; t.stars = []; t.tethered = []; t.coronaT = 0; t.pillarT = 0; t.pillar = null; t.pillarPct = 0; t.moteT = -1;
  t.chorale = 0; t.fortissimo = 0; t.echoes = []; t.rafts = []; t.broadsideT = 0; t.sweep = null; t.beamA = 0; t.beamB = null; t.lightfallT = 0;
  t.whirl = null; t.whirl2 = null; t.waveT = 0; t.breakT = 0; t.abyssT = 0; t.ripT = 0; t.floodT = 0; t.mawT = 0;
  t.taper = false; t.watchT = 0; t.wickTokens = 0; t.links = null;
}
