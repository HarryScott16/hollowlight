// Enemy creation and per-step behaviour. No DOM access.
import { ENEMIES, PARENT } from '../data/enemies.js';

// mods: { hpMul (tough types only), speedMul, veiled, mending }. `root` ties every layer shed from
// one spawned enemy together, so a single bolt or chain can't strike the same enemy twice by
// hitting its freshly shed inner layers.
export function createEnemy(game, type, dist, wave, mods, root) {
  const def = ENEMIES[type];
  const tough = def.tough ? mods.hpMul : 1;
  const hp = def.hp * tough;
  const shield = (def.shield || 0) * tough;
  const id = game.nextId++;
  const speed = def.speed * mods.speedMul;
  // Flyers follow the flight route; `prog` scales their distance to ground-path terms so
  // "first"/"last" targeting compares flyers and walkers fairly.
  const path = def.flying ? game.map.flyPath : game.map.path;
  const e = {
    id, root: root || id, type, def, wave, mods, path, prog: game.map.path.length / path.length,
    x: 0, y: 0, ang: 0, dist, off: def.flying ? 0 : (game.rand() - 0.5) * Math.max(4, Math.min(20, 34 - def.r)),
    hp, maxHp: hp, shield, maxShield: shield, shieldCd: 0,
    speed, curSpeed: speed, r: def.r, alive: true, leaked: false, veiled: !!(mods.veiled || def.veiled),
    hasteT: 0, hasteF: 0, healCd: def.heal ? def.heal.every : 0, summonCd: def.summon ? def.summon.every : 0,
    flash: 0, hitT: 0, frozenAmp: 0, wob: game.rand() * 6.28, phase: 0, lastHit: game.time,
    mendTop: mods.mending ? type : null,
    mends: 0,      // times this lineage has grown a layer back (capped at MAX_MENDS)
    unpaid: 0,     // layers grown back that pay no gold when broken again
    // status effects
    slowT: 0, slowF: 0, freezeT: 0, freezeImm: 0, stunT: 0,
    markT: 0, markPct: 0, brittleT: 0, brittlePct: 0,
    chargedT: 0, chargedPct: 0, chargedSlow: 0, scorchT: 0, scorchPct: 0,
    burnT: 0, burnDps: 0, burnSrc: null, burnType: 'blast', revealT: 0, zoneT: -1,
    searT: 0, searAmp: 0, brand: false,   // Scorched (Ember Censer): no healing, regrowing or shield recharge
    shatterT: 0, shatterDmg: 0, shatterRadius: 0, shatterSrc: null,
    rootT: 0, snaredBy: 0,                                  // held by a Thornlight Snare; the snare that bit it
    lure: null, lureT: 0, lureW: 0, lureA: 0, lureImm: 0, lureAmp: 0, groundT: 0,   // Moth Lantern
  };
  path.posAt(dist, e, e.off);
  return e;
}

// Inner layers keep the outer layer's lingering effects (slows, marks, burns), like shrapnel
// still on fire. Freezes, stuns and shatter charges do not carry over.
const INHERIT = ['slowT', 'slowF', 'markT', 'markPct', 'brittleT', 'brittlePct', 'chargedT', 'chargedPct',
  'chargedSlow', 'burnT', 'burnDps', 'burnSrc', 'burnType', 'scorchT', 'scorchPct', 'revealT', 'mendTop', 'mends',
  'searT', 'searAmp', 'brand'];
export function inherit(child, parent) {
  for (const k of INHERIT) child[k] = parent[k];
}

export function applySlow(e, factor, dur) {
  if (e.slowT <= 0 || factor >= e.slowF) e.slowF = factor;
  if (dur > e.slowT) e.slowT = dur;
}

const MEND_DELAY = 3;
const MAX_MENDS = 2;

export function updateEnemy(game, e, dt) {
  if (e.flash > 0) e.flash -= dt;
  if (e.hitT > 0) e.hitT -= dt;
  if (e.slowT > 0) e.slowT -= dt;
  if (e.freezeT > 0) e.freezeT -= dt;
  if (e.freezeImm > 0) e.freezeImm -= dt;
  if (e.stunT > 0) e.stunT -= dt;
  if (e.markT > 0) e.markT -= dt;
  if (e.brittleT > 0) e.brittleT -= dt;
  if (e.chargedT > 0) e.chargedT -= dt;
  if (e.scorchT > 0) e.scorchT -= dt;
  if (e.shatterT > 0) e.shatterT -= dt;
  if (e.revealT > 0) e.revealT -= dt;
  if (e.hasteT > 0) e.hasteT -= dt;
  if (e.rootT > 0) e.rootT -= dt;
  if (e.groundT > 0) e.groundT -= dt;
  if (e.lureImm > 0) e.lureImm -= dt;
  // Scorched enemies can't recharge shields, regenerate or regrow layers.
  const seared = e.searT > 0;
  if (seared) e.searT -= dt;
  if (e.maxShield > 0) {
    // Shields recharge once they've gone shieldDelay seconds without a hit.
    if (e.shieldCd > 0) e.shieldCd -= dt;
    else if (e.shield < e.maxShield && !seared) e.shield = Math.min(e.maxShield, e.shield + e.def.shieldRegen * e.mods.hpMul * dt);
  }
  if (e.def.heal && e.hp < e.maxHp && !seared) e.hp = Math.min(e.maxHp, e.hp + e.def.heal.regen * dt);

  if (e.burnT > 0) {
    e.burnT -= dt;
    game.damage(e, e.burnDps * dt, e.burnType, e.burnSrc, DOT);
    if (!e.alive) return;
  }

  // Mending (endless modifier): a layer left alone for a while grows back its outer layer.
  if (e.mendTop && !seared && e.type !== e.mendTop && e.mends < MAX_MENDS && game.time - e.lastHit > MEND_DELAY && !regrow(game, e)) e.mendTop = null;

  let mul = 1;
  if (e.freezeT > 0 || e.stunT > 0) {
    mul = 0;
  } else {
    let slow = e.slowT > 0 ? e.slowF : 0;
    if (e.chargedT > 0 && e.chargedSlow > slow) slow = e.chargedSlow;
    if (game.globalSlow > slow) slow = game.globalSlow;
    if (e.def.slowRes) slow *= 1 - e.def.slowRes;
    mul = (1 - slow) * (1 + (e.hasteT > 0 ? e.hasteF : 0));
  }
  e.curSpeed = e.speed * mul;
  // Circling a Moth Lantern: no progress along the route while it lasts.
  const lured = e.lureT > 0 || e.lureW > 0;
  if (lured) updateLure(e, dt);
  if (!(e.lureT > 0)) e.dist += e.curSpeed * dt;
  e.wob += dt * (2 + e.curSpeed * 0.12);

  const path = e.path;
  if (e.dist >= path.length) {
    e.alive = false;
    e.leaked = true;
    game.leak(e);
    return;
  }
  path.posAt(e.dist, e, e.off);
  if (lured && e.lureW > 0) {
    // Blend from the route onto a circle round the lantern (and back again once it lets go).
    const L = e.lure, R = 30 + (e.id % 5) * 3;
    const ox = L.x + Math.cos(e.lureA) * R, oy = L.y - 8 + Math.sin(e.lureA) * R * 0.6;
    const w = e.lureW * e.lureW * (3 - 2 * e.lureW);
    e.x += (ox - e.x) * w; e.y += (oy - e.y) * w;
    e.ang = e.lureA + Math.PI / 2;
  }
}

function updateLure(e, dt) {
  const L = e.lure;
  if (e.lureT > 0) {
    e.lureT -= dt;
    if (L.sold) e.lureT = 0;
    if (e.lureT <= 0) {
      // Let go: it can't be lured again for a while, and Flypaper leaves it slowed and flying low.
      const s = L.stats;
      e.lureImm = s.lureImm || 4;
      if (s.releaseSlow) applySlow(e, s.releaseSlow, s.releaseSlowDur);
      if (s.groundDur) e.groundT = Math.max(e.groundT, s.groundDur);
      if (L.groundBonus) e.groundT = Math.max(e.groundT, L.groundBonus);
    }
    e.lureW = Math.min(1, e.lureW + dt * 2.5);
  } else {
    e.lureW = Math.max(0, e.lureW - dt * 2.5);
  }
  e.lureA += dt * Math.max(40, e.speed) / 34;
}

// Grows back e's outer layer (Mote -> Skitter -> Shambler), at most MAX_MENDS times per lineage.
// Used by the endless Mending modifier and by Menders. Returns false if it can't.
export function regrow(game, e) {
  const up = PARENT[e.type];
  if (!up || e.mends >= MAX_MENDS) return false;
  const def = ENEMIES[up];
  e.type = up;
  e.def = def;
  e.hp = e.maxHp = def.hp * (def.tough ? e.mods.hpMul : 1);
  e.speed = def.speed * e.mods.speedMul;
  e.r = def.r;
  e.lastHit = game.time;
  e.mends++;
  e.unpaid++;   // the regrown layer pays nothing; the one inside it still pays once
  game.emit('mend', { x: e.x, y: e.y, r: e.r });
  return true;
}

const DOT = { dot: true };
