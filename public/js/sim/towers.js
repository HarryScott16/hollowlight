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
// never reads it). `crowd` assumes enemies bunched around the target; otherwise one lone target.
const CROWD = 6;
export function estimateDps(kind, s, crowd = true) {
  if (kind === 'bolt') {
    const perBolt = crowd ? Math.min(s.pierce, s.lance ? 4 : 2) + (s.bounces || 0) : 1;
    return s.damage * s.rate * s.shots * perBolt * (1 + (s.markPct || 0));
  }
  if (kind === 'mortar') {
    const hits = crowd ? Math.min(CROWD, 2 * (s.radius / 55) ** 2) : 1;
    let d = s.damage * hits * s.shells * (1 + (s.cluster || 0) * (crowd ? 0.35 : 0.1));
    d += (s.burnDps || 0) * (s.burnDur || 0) * hits;
    d += (s.poolDps || 0) * (s.poolDur || 0) * hits * 0.5 * (s.poolRadiusMul || 1);
    return d * s.rate * (1 + (s.scorch || 0));
  }
  if (kind === 'pulse') {
    return s.damage * s.rate * (crowd ? Math.min(CROWD, 3 * (s.range / 100)) : 1) + (crowd ? (s.shatterDmg || 0) * 0.5 : 0);
  }
  if (kind === 'chain') {
    let jumps = 0, f = 1;
    const n = crowd ? Math.min(s.chains, CROWD * 1.5) : 1;
    for (let j = 0; j < n; j++) { jumps += f; f *= s.falloff; }
    let d = s.damage * jumps * (crowd ? s.forks : 1);
    if (s.smiteEvery) d += (s.damage * (s.smiteMul - 1) + (crowd ? s.damage * s.smiteMul * 0.5 * 3 : 0)) / s.smiteEvery;
    return d * s.rate * (1 + (s.chargedPct || 0));
  }
  return 0;
}

export function createTower(game, type, x, y) {
  const def = TOWERS[type];
  return {
    id: game.nextId++, type, def, x, y,
    tiers: [0, 0, 0], stats: computeStats(def, [0, 0, 0]),
    cd: 0, ang: -Math.PI / 2, target: null, targetMode: 'first',
    dmg: 0, kills: 0, spent: def.cost,
    recoil: 0, shotN: 0, pulseN: 0, pulseAnim: 0,
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

function turnTo(t, tx, ty, dt) {
  const want = Math.atan2(ty - t.y, tx - t.x);
  let d = ((want - t.ang + Math.PI) % TAU + TAU) % TAU - Math.PI;
  const max = 9 * dt;
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
  const path = game.map.path;
  for (let i = 0; i < s.shells; i++) {
    const e = targets[i % targets.length];
    // Lead the target along the path.
    path.posAt(e.dist + e.curSpeed * s.flight, aim, e.off);
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
  for (const e of buf) {
    if (!e.alive || !game.targetable(e, s, true)) continue;
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
    game.damage(cur, dmg, s.type, t, opts);
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

const BEHAVIOURS = { bolt, mortar, pulse, chain };

export function updateTower(game, t, dt) {
  if (t.cd > 0) t.cd -= dt;
  if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 5);
  if (t.pulseAnim > 0) t.pulseAnim = Math.max(0, t.pulseAnim - dt * 2);
  BEHAVIOURS[t.def.kind](game, t, dt);
  // Idle towers stay ready rather than banking negative cooldown.
  if (t.cd < 0) t.cd = 0;
}
