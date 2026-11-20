// Tower state, upgrade rules and attack behaviours. No DOM access.
import { TOWERS } from '../data/towers.js';
import { RULES } from '../data/rules.js';
import { applySlow } from './enemies.js';

const TAU = Math.PI * 2;

export function computeStats(def, tiers) {
  const s = { ...def.base };
  def.paths.forEach((path, pi) => {
    for (let t = 0; t < tiers[pi]; t++) {
      const up = path.tiers[t];
      if (up.set) Object.assign(s, up.set);
      if (up.add) for (const k in up.add) s[k] = (s[k] || 0) + up.add[k];
      if (up.mul) for (const k in up.mul) s[k] = (s[k] || 0) * up.mul[k];
    }
  });
  return s;
}

// Rough damage per second, used for the upgrade panel and balance reports (the simulation
// never reads it). Divide by 10 for layers popped per second. `crowd` assumes a dense, deep crowd
// around the target (overkill carries into inner layers, so it isn't wasted); otherwise one target.
export function estimateDps(kind, s, crowd = true) {
  if (kind === 'bolt') {
    const perBolt = crowd ? Math.min(s.pierce, s.lance ? 10 : 5) + (s.bounces || 0) : 1;
    return s.damage * s.rate * s.shots * perBolt * (1 + (s.markPct || 0));
  }
  if (kind === 'mortar') {
    const hits = crowd ? Math.min(s.maxHits, 5 * (s.radius / 55) ** 2) : 1;
    let d = s.damage * hits * s.shells * (1 + (s.cluster || 0) * (crowd ? 0.3 : 0.1));
    d += (s.burnDps || 0) * (s.burnDur || 0) * hits;
    d += (s.poolDps || 0) * (s.poolDur || 0) * hits * 0.5 * (s.poolRadiusMul || 1);
    return d * s.rate * (1 + (s.scorch || 0));
  }
  if (kind === 'pulse') {
    const hits = crowd ? Math.min(s.maxHits, 5 * (s.range / 105)) : 1;
    let d = s.damage * s.rate * hits;
    if (crowd && s.shatterDmg) d += Math.min(s.shatterRate, hits * s.rate) * s.shatterDmg * 2;
    return d;
  }
  if (kind === 'snipe') {
    const burst = crowd && s.flakRadius ? 1 + Math.min(s.flakHits, 3 * (s.flakRadius / 45)) * 0.5 : 1;
    return s.damage * s.rate * s.shots * burst * (crowd ? 1 : s.heavyMul || 1);
  }
  if (kind === 'flame') {
    // A continuous stream: damage/s to everything in the cone, plus the burn, which runs while an
    // enemy is in the flame and for burnDur after it leaves.
    const hits = crowd ? 2 + 3 * Math.min(4, s.arc / 0.8) * (s.range / 95) : 1;
    const burn = s.burnDps * (1 + s.burnDur * 0.25) * (crowd ? 1 : s.burnHeavy || 1);
    return (s.damage + burn) * hits * (1 + (s.searAmp || 0) * 0.5) * (crowd && s.spread ? 1.4 : 1);
  }
  if (kind === 'beam') {
    if (!crowd) return s.damage * s.maxCharge * 0.85;
    const charge = 1 + (s.maxCharge - 1) * (s.keep || 0) * 0.6 + 0.4;
    return s.damage * charge * s.beams * (1 + (s.burstMul ? 1.5 * s.burstMul : 0));
  }
  if (kind === 'snare') {
    // Bites: steady state is the refill rate (plus a stock to spend on a rush); mines burst in crowds.
    let d = s.damage * s.refill * (crowd ? 1.6 : 1) * (s.rootDur ? 1.15 : 1);
    if (s.mineMax) d += (s.mineDmg * (crowd ? Math.min(s.mineHits, 6) : 1)) / s.mineEvery;
    return d;
  }
  if (kind === 'wander') {
    const burst = crowd ? 1 + Math.min(s.starHits, 3 * (s.starRadius / 24)) * s.starMul : 1;
    return s.damage * s.rate * s.shots * s.lights * burst * (1 + (s.markPct || 0));
  }
  if (kind === 'lure') return (s.lureDps || 0) * Math.min(s.lureMax, crowd ? 6 : 1);
  if (kind === 'chain') {
    let jumps = 0, f = 1;
    const n = crowd ? Math.min(s.chains, 12) : 1;
    for (let j = 0; j < n; j++) { jumps += f; f *= s.falloff; }
    let d = s.damage * jumps * (crowd ? s.forks : 1);
    if (s.smiteEvery) d += (s.damage * (s.smiteMul - 1) + (crowd ? s.damage * s.smiteMul * 0.5 * 5 : 0)) / s.smiteEvery;
    return d * s.rate * (1 + (s.chargedPct || 0));
  }
  return 0;
}

export function createTower(game, type, x, y) {
  const def = TOWERS[type];
  return {
    id: game.nextId++, type, def, x, y,
    tiers: [0, 0, 0], stats: computeStats(def, [0, 0, 0]),
    cd: 0, ang: -Math.PI / 2, target: null, targetMode: def.target || 'first',
    dmg: 0, kills: 0, spent: def.cost, shatterTokens: 0,
    abilityCd: null, buffT: 0, buffRate: 1,   // abilityCd stays null until the ward reaches tier 4
    recoil: 0, shotN: 0, pulseN: 0, pulseAnim: 0,
    beams: [], sunT: 0, spreadTokens: 0, burstTokens: 0, aura: null, firing: false,
    hx: x, hy: y,                                    // a Wandering Light's post (it floats around it)
    charges: def.base.charges || 0, bloomT: 0, mineT: 0, rootCd: 0, heavyCd: 0, pathDist: 0,   // Snare
    lights: [], bank: 0, warm: false, goldEarned: 0, // Wandering Light's lights; Ember Vault's embers
  };
}

// Returns { ok, up, reason } for buying the next tier of path `pi`.
export function upgradeInfo(tower, pi) {
  const tier = tower.tiers[pi];
  const path = tower.def.paths[pi];
  if (tier >= RULES.maxTier) return { ok: false, up: null, reason: 'max' };
  const up = path.tiers[tier];
  const used = tower.tiers.filter((t) => t > 0).length;
  if (tier === 0 && used >= RULES.maxPaths) return { ok: false, up, reason: 'paths' };
  if (tier + 1 > RULES.minorTierCap && tower.tiers.some((t, i) => i !== pi && t > RULES.minorTierCap)) {
    return { ok: false, up, reason: 'cap' };
  }
  return { ok: true, up, reason: null };
}

function turnTo(t, tx, ty, dt, speed = 9) {
  const want = Math.atan2(ty - t.y, tx - t.x);
  let d = ((want - t.ang + Math.PI) % TAU + TAU) % TAU - Math.PI;
  const max = speed * dt;
  t.ang += Math.abs(d) < max ? d : Math.sign(d) * max;
}

function track(t, dt) {
  const e = t.target;
  if (e && e.alive) turnTo(t, e.x, e.y, dt);
  else t.target = null;
}

const targets = [];
const buf = [];

// --- bolt: homing projectile(s) ------------------------------------------------------------
function bolt(game, t, dt) {
  const s = t.stats;
  track(t, dt);
  if (t.cd > 0) return;
  game.pickTargets(t, s.shots, targets);
  if (!targets.length) return;
  t.cd += 1 / s.rate;
  t.target = targets[0];
  t.ang = Math.atan2(targets[0].y - t.y, targets[0].x - t.x);
  t.recoil = 1;
  for (let i = 0; i < s.shots; i++) {
    const e = targets[i % targets.length];
    // Extra bolts at the same target fan out slightly.
    const fan = i >= targets.length ? ((i % 2 ? 1 : -1) * Math.ceil(i / 2)) * 0.09 : 0;
    const a = Math.atan2(e.y - t.y, e.x - t.x) + fan;
    game.projectiles.push({
      kind: 'bolt', x: t.x + Math.cos(a) * 16, y: t.y + Math.sin(a) * 16,
      vx: Math.cos(a) * s.projSpeed, vy: Math.sin(a) * s.projSpeed, speed: s.projSpeed,
      target: e, homing: fan === 0 && !s.lance, dmg: s.damage, pierce: s.pierce, hit: [],
      bounces: s.bounces || 0,
      // A Siege Lance keeps flying until it leaves the map.
      life: s.lance ? 1600 : s.range * 1.5 + 60, src: t, s, dead: false,
    });
  }
  game.emit('fire', { x: t.x, y: t.y, ang: t.ang, kind: 'bolt' });
}

// --- mortar: lobbed shells that explode on the ground ---------------------------------------
function mortar(game, t, dt) {
  const s = t.stats;
  track(t, dt);
  if (t.cd > 0) return;
  game.pickTargets(t, s.shells, targets, s.minRange);
  if (!targets.length) return;
  t.cd += 1 / s.rate;
  t.target = targets[0];
  t.recoil = 1;
  for (let i = 0; i < s.shells; i++) {
    const e = targets[i % targets.length];
    // Lead the target along the path (a flyer circling a Moth Lantern: where it is).
    if (e.lureW > 0) { aim.x = e.x; aim.y = e.y; } else e.path.posAt(e.dist + e.curSpeed * s.flight, aim, e.off);
    let tx = aim.x, ty = aim.y;
    if (i >= targets.length) { tx += (game.rand() - 0.5) * 50; ty += (game.rand() - 0.5) * 50; }
    if (i === 0) t.ang = Math.atan2(ty - t.y, tx - t.x);
    game.projectiles.push({
      kind: 'shell', x: t.x, y: t.y, sx: t.x, sy: t.y, tx, ty, t: 0, flight: s.flight,
      sub: false, src: t, s, dead: false,
    });
  }
  game.emit('fire', { x: t.x, y: t.y, ang: t.ang, kind: 'mortar' });
}
const aim = { x: 0, y: 0, ang: 0 };

// --- pulse: frost nova around the tower -----------------------------------------------------
function pulse(game, t, dt) {
  const s = t.stats;
  if (t.cd > 0) return;
  game.grid.query(t.x, t.y, s.range, buf);
  let any = false;
  for (const e of buf) if (game.targetable(e, s, true)) { any = true; break; }
  if (!any) return;
  t.cd += 1 / s.rate;
  t.pulseN++;
  t.pulseAnim = 1;
  const freeze = s.freezeEvery && t.pulseN % s.freezeEvery === 0;
  // Up to maxHits enemies, those furthest along the path first.
  hitList.length = 0;
  for (const e of buf) if (e.alive && game.targetable(e, s, true)) hitList.push(e);
  if (hitList.length > s.maxHits) { hitList.sort((a, b) => b.dist * b.prog - a.dist * a.prog); hitList.length = s.maxHits; }
  for (const e of hitList) {
    if (!e.alive) continue;
    applySlow(e, s.slow, s.slowDur);
    if (s.brittle) { e.brittleT = s.slowDur; e.brittlePct = Math.max(e.brittlePct, s.brittle); }
    if (s.shatterDmg) { e.shatterT = s.slowDur; e.shatterDmg = s.shatterDmg; e.shatterRadius = s.shatterRadius; e.shatterSrc = t; }
    if (freeze && !e.def.heavy && e.freezeImm <= 0) {
      e.freezeT = s.freezeDur; e.freezeImm = s.freezeDur + 1.5; e.frozenAmp = s.frozenAmp || 0;
    }
    game.damage(e, s.damage, s.type, t, QUIET);
  }
  game.emit('pulse', { x: t.x, y: t.y, r: s.range, freeze });
}
const QUIET = { quiet: true };
const hitList = [];

// --- chain: instant lightning that jumps between enemies ------------------------------------
const chainHit = [];
function strike(game, t, s, first, smite) {
  const pts = [t.x, t.y];
  chainHit.length = 0;
  let cur = first;
  let dmg = s.damage * (smite ? s.smiteMul : 1);
  const opts = { shieldMul: s.shieldMul };
  for (let j = 0; j < s.chains && cur; j++) {
    pts.push(cur.x, cur.y);
    chainHit.push(cur.root);
    game.damage(cur, s.heavyMul && cur.def.heavy ? dmg * s.heavyMul : dmg, s.type, t, opts);
    if (cur.alive) {
      if (!cur.def.heavy) {
        if (smite && j === 0) cur.stunT = Math.max(cur.stunT, 1);
        else if (s.stunChance && game.rand() < s.stunChance) cur.stunT = Math.max(cur.stunT, s.stunDur);
      }
      if (s.chargedPct) { cur.chargedT = s.chargedDur; cur.chargedPct = s.chargedPct; cur.chargedSlow = s.chargedSlow; }
    }
    if (j === 0 && smite) {
      // Thunderbolt: the first target's blast also hits everything around it.
      const r = s.smiteRadius || 0;
      if (r) {
        game.grid.query(cur.x, cur.y, r, buf);
        const around = buf.slice();
        for (const e of around) if (e !== cur && game.targetable(e, s, true)) game.damage(e, s.damage * s.smiteMul * 0.5, s.type, t, opts);
        game.emit('smite', { x: cur.x, y: cur.y, r });
      }
      dmg = s.damage;
    }
    dmg *= s.falloff;
    game.grid.query(cur.x, cur.y, s.jumpRange, buf);
    let best = null, bestD = Infinity;
    for (const e of buf) {
      if (!game.targetable(e, s) || chainHit.includes(e.root)) continue;
      const d = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2;
      if (d < bestD) { bestD = d; best = e; }
    }
    cur = best;
  }
  game.emit('arc', { pts, smite });
}

const forkTargets = [];
function chain(game, t, dt) {
  const s = t.stats;
  track(t, dt);
  if (t.cd > 0) return;
  game.pickTargets(t, s.forks, targets);
  if (!targets.length) return;
  t.cd += 1 / s.rate;
  t.target = targets[0];
  t.ang = Math.atan2(targets[0].y - t.y, targets[0].x - t.x);
  t.recoil = 1;
  t.shotN++;
  const smite = !!s.smiteEvery && t.shotN % s.smiteEvery === 0;
  forkTargets.length = 0;
  for (const e of targets) forkTargets.push(e);
  for (let i = 0; i < forkTargets.length; i++) {
    if (forkTargets[i].alive) strike(game, t, s, forkTargets[i], smite && i === 0);
  }
}

// --- snipe: instant long-range shots ----------------------------------------------------------
const shotList = [];
function snipe(game, t, dt) {
  const s = t.stats;
  track(t, dt);
  if (t.cd > 0) return;
  game.pickTargets(t, s.shots, targets);
  if (!targets.length) return;
  t.cd += 1 / s.rate;
  t.target = targets[0];
  t.ang = Math.atan2(targets[0].y - t.y, targets[0].x - t.x);
  t.recoil = 1;
  shotList.length = 0;
  for (const e of targets) shotList.push(e);
  for (const e of shotList) {
    const x = e.x, y = e.y;
    snipeHit(game, t, s, e, s.damage);
    game.emit('snipe', { x: t.x, y: t.y, tx: x, ty: y, flak: s.flakRadius || 0, spot: s.spotRadius || 0, big: s.damage >= 300 });
  }
}

export function snipeHit(game, t, s, e, dmg, big) {
  const x = e.x, y = e.y;
  const opts = { armorPierce: s.armorPierce || 0, shieldMul: s.shieldMul || 0, big: big || dmg >= 300 };
  const k = (e.def.flying ? s.airMul || 1 : 1) * (e.def.heavy ? s.heavyMul || 1 : 1);
  game.damage(e, dmg * k, s.type, t, opts);
  if (s.shieldStall && e.alive && e.maxShield > 0) e.shieldCd = Math.max(e.shieldCd, s.shieldStall);
  if (s.spotRadius) {
    game.grid.query(x, y, s.spotRadius, buf);
    for (const o of buf) if (o.veiled && o.alive) o.revealT = Math.max(o.revealT, s.spotDur);
  }
  if (s.flakRadius) {
    game.grid.query(x, y, s.flakRadius, buf);
    hitList.length = 0;
    for (const o of buf) {
      if (o === e || !game.targetable(o, s, true)) continue;
      o._d2 = (o.x - x) ** 2 + (o.y - y) ** 2;
      if (o._d2 <= (s.flakRadius + o.r * 0.5) ** 2) hitList.push(o);
    }
    if (hitList.length > s.flakHits) { hitList.sort((a, b) => a._d2 - b._d2); hitList.length = s.flakHits; }
    for (const o of hitList) if (o.alive) game.damage(o, dmg * 0.5 * (o.def.flying ? s.airMul || 1 : 1), s.type, t, QUIET);
  }
}

// --- flame: a continuous cone (or ring) of fire -----------------------------------------------
// The nozzle sweeps towards its target at FLAME_TURN rad/s, and everything inside the cone where it
// points now takes damage/s, ticked FLAME_TICK at a time (cheaper than every step, and smooth
// enough). Everything in the cone burns (the nearest FLAME_CAP, a safety cap for huge crowds).
// t.firing tells the renderer to pour out flame.
const FLAME_TICK = 0.1;
const FLAME_TURN = 5;
const FLAME_CAP = 80;
const FLAME_SPIN = 2.4;
const flameHits = [];
function flame(game, t, dt) {
  const s = t.stats;
  const e0 = t.target;
  // A full ring needs no aim: its three dragon heads spin while it breathes (purely for show).
  if (s.arc >= TAU - 0.01) { if (t.firing) t.ang = (t.ang + FLAME_SPIN * dt) % TAU; }
  else if (e0 && e0.alive) turnTo(t, e0.x, e0.y, dt, FLAME_TURN);
  if (t.cd > 0) return;
  t.cd += FLAME_TICK;
  // Fire is an area attack: it aims at anything in reach, Veiled included.
  game.grid.query(t.x, t.y, s.range + 12, buf);
  let best = null, bestS = -Infinity;
  const mode = t.targetMode;
  for (const e of buf) {
    if (!game.targetable(e, s, true)) continue;
    const d2 = (e.x - t.x) ** 2 + (e.y - t.y) ** 2;
    if (d2 > (s.range + e.r * 0.5) ** 2) continue;
    e._d2 = d2;
    const sc = mode === 'first' ? e.dist * e.prog : mode === 'last' ? -e.dist * e.prog : mode === 'strong' ? (e.hp + e.shield) * 10000 + e.dist : -d2;
    if (sc > bestS) { bestS = sc; best = e; }
  }
  t.target = best;
  t.firing = !!best;
  if (!best) return;
  t.recoil = 1;
  const ang = t.ang;
  const all = s.arc >= TAU - 0.01, half = s.arc / 2;
  flameHits.length = 0;
  for (const e of buf) {
    if (!game.targetable(e, s, true)) continue;
    const d2 = (e.x - t.x) ** 2 + (e.y - t.y) ** 2;
    if (d2 > (s.range + e.r * 0.5) ** 2) continue;
    if (!all) {
      const d = Math.abs(((Math.atan2(e.y - t.y, e.x - t.x) - ang + Math.PI) % TAU + TAU) % TAU - Math.PI);
      if (d > half + Math.atan2(e.r, Math.sqrt(d2) + 1)) continue;
    }
    e._d2 = d2;
    flameHits.push(e);
  }
  if (flameHits.length > FLAME_CAP) { flameHits.sort((a, b) => a._d2 - b._d2); flameHits.length = FLAME_CAP; }
  const opts = s.shieldMul ? { dot: true, shieldMul: s.shieldMul } : DOT;
  const dmg = s.damage * FLAME_TICK;
  for (const e of flameHits) {
    if (!e.alive) continue;
    ignite(e, s, t);   // before the hit, so the hit itself counts the Scorched bonus and the burn carries into what it sheds
    game.damage(e, dmg, s.type, t, opts);
  }
}

// Sets an enemy burning with Fire and Scorched (no healing, regrowing or shield recharge).
export function ignite(e, s, src) {
  const dps = s.burnDps * (e.def.heavy ? s.burnHeavy || 1 : 1);
  if (e.burnT <= 0 || dps >= e.burnDps) { e.burnDps = dps; e.burnType = 'fire'; e.burnSrc = src; }
  e.burnT = Math.max(e.burnT, s.burnDur);
  if (e.searT <= 0) { e.searAmp = 0; e.brand = false; }
  e.searT = Math.max(e.searT, s.searDur || s.burnDur);
  if (s.searAmp > e.searAmp) e.searAmp = s.searAmp;
  if (s.brand) e.brand = true;
}

// --- beam: one or more Radiant beams that build charge on their target ------------------------
const near = [];
function inReach(game, t, s, e) {
  return e && e.alive && game.targetable(e, s) && (e.x - t.x) ** 2 + (e.y - t.y) ** 2 <= (s.range + e.r * 0.5) ** 2;
}
function beam(game, t, dt) {
  const s = t.stats;
  const n = s.beams;
  while (t.beams.length < n) t.beams.push({ e: null, root: 0, charge: 1, x: 0, y: 0 });
  if (t.beams.length > n) t.beams.length = n;
  if (t.sunT > 0) t.sunT -= dt;
  const rise = (s.maxCharge - 1) / s.ramp;
  let picked = false;
  for (let i = 0; i < n; i++) {
    const b = t.beams[i];
    if (!inReach(game, t, s, b.e)) {
      let next = null;
      // The target broke open: stay on what it shed (same lineage) and keep the charge.
      if (b.e && !b.e.alive && b.root) {
        game.grid.query(b.x, b.y, 45, near);
        let bestHp = -1;
        for (const o of near) if (o.root === b.root && inReach(game, t, s, o) && o.hp + o.shield > bestHp) { bestHp = o.hp + o.shield; next = o; }
      }
      if (!next) {
        if (!picked) { game.pickTargets(t, n + 4, targets); picked = true; }
        for (const o of targets) {
          if (!o.alive) continue;
          let taken = false;
          for (let j = 0; j < n; j++) if (j !== i && t.beams[j].e && t.beams[j].e.root === o.root) { taken = true; break; }
          if (!taken) { next = o; break; }
        }
        if (!next && targets.length) next = targets[i % targets.length].alive ? targets[i % targets.length] : null;
        b.charge = 1 + (b.charge - 1) * (s.keep || 0);
      }
      b.e = next;
      b.root = next ? next.root : 0;
    }
    const e = b.e;
    if (!e) continue;
    b.x = e.x; b.y = e.y;
    b.charge = t.sunT > 0 ? s.maxCharge : Math.min(s.maxCharge, b.charge + rise * dt);
    const dps = s.damage * b.charge * (t.sunT > 0 ? SUN_MUL : 1);
    game.damage(e, dps * dt, s.type, t, DOT);
    if (!e.alive && s.burstMul && t.burstTokens >= 1) {
      t.burstTokens--;
      game.grid.query(b.x, b.y, s.burstRadius, near);
      const list = near.slice(0, 16);
      for (const o of list) if (o.alive && game.targetable(o, s, true)) game.damage(o, dps * s.burstMul, s.type, t, QUIET);
      game.emit('burst', { x: b.x, y: b.y, r: s.burstRadius });
    }
  }
  const first = t.beams[0] && t.beams[0].e;
  t.target = first && first.alive ? first : null;
  if (t.target) turnTo(t, t.target.x, t.target.y, dt);
}
const DOT = { dot: true };
export const SUN_MUL = 2;

// --- aura: the Beacon never attacks; game.refreshGlobals applies its boost ---------------------
function aura() {}

// --- snare: a trap on the path. Each enemy that steps on it is bitten once (a charge each) --------
const BITE = { armorPierce: 0 };
function snare(game, t, dt) {
  const s = t.stats;
  const free = t.bloomT > 0;
  if (free) t.bloomT -= dt;
  if (t.rootCd > 0) t.rootCd -= dt;
  if (t.heavyCd > 0) t.heavyCd -= dt;
  t.charges = Math.min(s.charges, t.charges + s.refill * dt);
  if (s.mineMax) sowMines(game, t, s, dt);
  if (t.charges < 1 && !free) return;
  game.grid.query(t.x, t.y, s.radius + 30, buf);
  for (let i = 0; i < buf.length; i++) {
    const e = buf[i];
    if (!e.alive || e.def.flying || e.snaredBy === t.id) continue;   // flyers pass over it
    const reach = s.radius + e.r * 0.5;
    if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 > reach * reach) continue;
    if (t.charges < 1 && !free) break;
    e.snaredBy = t.id;
    if (!free) t.charges -= 1;
    t.recoil = 1;
    bite(game, t, s, e);
  }
}
function bite(game, t, s, e) {
  BITE.armorPierce = s.armorPierce || 0;
  game.damage(e, s.damage, s.type, t, BITE);
  if (!e.alive) return;
  if (s.slow) applySlow(e, s.slow, s.slowDur);
  if (s.rootDur && !e.def.heavy) hold(e, s.rootDur);
  if (s.heavyRoot && e.def.heavy && t.heavyCd <= 0) { t.heavyCd = s.heavyRootEvery; hold(e, s.heavyRoot); game.emit('bind', { x: e.x, y: e.y, r: e.r + 6, heavy: true }); }
  if (s.rootRadius && t.rootCd <= 0) {
    t.rootCd = 1;
    game.grid.query(t.x, t.y, s.rootRadius, near);
    let n = 0;
    for (const o of near) {
      if (o === e || !o.alive || o.def.heavy || o.def.flying) continue;
      hold(o, s.rootDur);
      if (++n >= s.rootHits) break;
    }
    game.emit('bind', { x: t.x, y: t.y, r: s.rootRadius, heavy: false });
  }
}
// Held: can't move (a stun underneath, drawn as chains of light).
function hold(e, dur) { e.stunT = Math.max(e.stunT, dur); e.rootT = Math.max(e.rootT, dur); }
// Flashmines: lamps sown on the path near the snare, up to mineMax at once.
function sowMines(game, t, s, dt) {
  if ((t.mineT -= dt) > 0) return;
  t.mineT = s.mineEvery;
  let n = 0;
  for (const m of game.mines) if (m.src === t) n++;
  if (n >= s.mineMax) return;
  const path = game.map.path;
  const d = Math.max(30, Math.min(path.length - 90, t.pathDist - 30 + game.rand() * (s.mineRange + 30)));
  path.posAt(d, aim, (game.rand() - 0.5) * 26);
  game.mines.push({ x: aim.x, y: aim.y, src: t, arm: 0.5 });
  game.emit('mine', { x: aim.x, y: aim.y });
}

// --- lure: a Moth Lantern pulls flyers in to circle it -----------------------------------------
const LURE_TICK = 0.1;
function lure(game, t, dt) {
  const s = t.stats;
  if (t.cd > 0) return;
  t.cd += LURE_TICK;
  game.grid.query(t.x, t.y, s.range, buf);
  let n = 0;
  for (const e of buf) if (e.alive && e.lure === t && e.lureT > 0) n++;
  let tgt = null;
  for (const e of buf) {
    if (!e.alive || !e.def.flying) continue;
    if (e.lure === t && e.lureT > 0) {
      if (s.lureDps) game.damage(e, s.lureDps * LURE_TICK, s.type, t, DOT);
      if (s.lureReveal && e.veiled) e.revealT = Math.max(e.revealT, 0.3);
      if (!tgt) tgt = e;
      continue;
    }
    if (n >= s.lureMax || e.lureImm > 0 || e.lureT > 0) continue;
    if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 > s.range * s.range) continue;
    startLure(e, t, s.lureDur);
    n++;
  }
  t.target = tgt;
  t.lured = n;
  if (tgt) turnTo(t, tgt.x, tgt.y, LURE_TICK, 20);
}
export function startLure(e, t, dur) {
  e.lure = t; e.lureT = dur;
  e.lureA = Math.atan2(e.y - t.y, e.x - t.x);
  e.lureAmp = t.stats.lureAmp || 0;
}

// --- wander: a floating light (or several) that roams near its post and casts homing stars --------
function wander(game, t, dt) {
  const s = t.stats;
  const n = s.lights;
  while (t.lights.length < n) {
    const k = t.lights.length, a = (k / Math.max(2, n)) * TAU;
    t.lights.push({ x: t.x + Math.cos(a) * 18, y: t.y + Math.sin(a) * 10, cd: 0.2 * k, ang: -Math.PI / 2, tgt: null, recoil: 0 });
  }
  if (t.lights.length > n) t.lights.length = n;
  // Targets: anything it can reach from its roaming area, best first by its targeting mode.
  const reach = s.range + s.leash;
  const R = s.range;
  s.range = reach; t.x = t.hx; t.y = t.hy;   // pick from the post, over the whole roaming area
  game.pickTargets(t, n, targets);
  s.range = R;
  const boost = t.buffT > 0 ? t.buffRate : 1;
  for (let i = 0; i < n; i++) {
    const L = t.lights[i];
    if (L.recoil > 0) L.recoil = Math.max(0, L.recoil - dt * 5);
    if (L.cd > 0) L.cd -= dt * boost;
    const e = targets.length ? targets[i % targets.length] : null;
    // Move: up to about half its range from the target, never further than `leash` from its post.
    let gx, gy;
    if (e) {
      const dx = L.x - e.x, dy = L.y - e.y, d = Math.hypot(dx, dy) || 1, want = Math.min(d, R * 0.5);
      gx = e.x + (dx / d) * want; gy = e.y + (dy / d) * want;
    } else {
      const a = (i / Math.max(1, n)) * TAU + game.time * 0.4;
      gx = t.hx + (n > 1 ? Math.cos(a) * 16 : 0); gy = t.hy + (n > 1 ? Math.sin(a) * 9 : 0);
    }
    const lx = gx - t.hx, ly = gy - t.hy, ld = Math.hypot(lx, ly);
    if (ld > s.leash) { gx = t.hx + (lx / ld) * s.leash; gy = t.hy + (ly / ld) * s.leash; }
    const mx = gx - L.x, my = gy - L.y, md = Math.hypot(mx, my), step = s.moveSpeed * dt;
    if (md > 0.5) { const k = Math.min(1, step / md); L.x += mx * k; L.y += my * k; }
    L.tgt = e;
    if (e) { const want = Math.atan2(e.y - L.y, e.x - L.x); let d = ((want - L.ang + Math.PI) % TAU + TAU) % TAU - Math.PI; L.ang += Math.abs(d) < 9 * dt ? d : Math.sign(d) * 9 * dt; }
    if (e && L.cd <= 0 && (e.x - L.x) ** 2 + (e.y - L.y) ** 2 <= (R + e.r * 0.5) ** 2) {
      L.cd += 1 / s.rate;
      L.recoil = 1;
      L.ang = Math.atan2(e.y - L.y, e.x - L.x);
      for (let k = 0; k < s.shots; k++) castStar(game, t, s, L, e, k, s.damage);
      game.emit('fire', { x: L.x, y: L.y, ang: L.ang, kind: 'wander' });
    }
    if (L.cd < 0) L.cd = 0;
  }
  const L0 = t.lights[0];
  t.x = L0.x; t.y = L0.y; t.ang = L0.ang; t.recoil = L0.recoil; t.target = L0.tgt;
}
export function castStar(game, t, s, L, e, k, dmg, big = false) {
  const a = Math.atan2(e.y - L.y, e.x - L.x) + (k ? (k % 2 ? 1 : -1) * 0.5 : 0);
  const sp = s.projSpeed * (big ? 1.2 : 1);
  game.projectiles.push({
    kind: 'bolt', star: true, comet: !!s.comet || big, x: L.x + Math.cos(a) * 8, y: L.y + Math.sin(a) * 8, ox: L.x, oy: L.y,
    vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, speed: sp,
    target: e, homing: true, dmg, pierce: s.pierce, hit: [], bounces: 0, big,
    life: big ? 3000 : s.range * 2 + 120, src: t, s, dead: false,
  });
}

// --- vault: banks embers (game.kill and the wave clear fill it); Hearthwarm warms nearby wards -----
function vault(game, t) {
  const s = t.stats;
  if (!s.warmRate) return;
  const warm = t.bank >= s.cap * (s.warmAt || 0.5);
  if (warm !== t.warm) { t.warm = warm; game.refreshGlobals(); }
}

const BEHAVIOURS = { bolt, mortar, pulse, chain, snipe, flame, beam, aura, snare, lure, wander, vault };

export function updateTower(game, t, dt) {
  // Overdraw: the attack timer runs buffRate times faster.
  if (t.buffT > 0) { t.buffT -= dt; if (t.cd > 0) t.cd -= dt * (t.buffRate - 1); }
  if (t.cd > 0) t.cd -= dt;
  if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 5);
  if (t.pulseAnim > 0) t.pulseAnim = Math.max(0, t.pulseAnim - dt * 2);
  if (t.stats.shatterRate) t.shatterTokens = Math.min(t.stats.shatterRate, t.shatterTokens + t.stats.shatterRate * dt);
  if (t.stats.spreadRate) t.spreadTokens = Math.min(t.stats.spreadRate, t.spreadTokens + t.stats.spreadRate * dt);
  if (t.stats.burstRate) t.burstTokens = Math.min(t.stats.burstRate, t.burstTokens + t.stats.burstRate * dt);
  BEHAVIOURS[t.def.kind](game, t, dt);
  // Idle towers stay ready rather than banking negative cooldown.
  if (t.cd < 0) t.cd = 0;
}
