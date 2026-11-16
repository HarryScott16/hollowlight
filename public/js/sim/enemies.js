// Enemy creation and per-step behaviour. No DOM access.
import { ENEMIES } from '../data/enemies.js';

export function createEnemy(game, type, dist, wave, hpMul) {
  const def = ENEMIES[type];
  const hp = def.hp * hpMul;
  const e = {
    id: game.nextId++, type, def, wave, hpMul,
    x: 0, y: 0, ang: 0, dist, off: (game.rand() - 0.5) * Math.min(20, 34 - def.r),
    hp, maxHp: hp, shield: 0, maxShield: 0,
    speed: def.speed, curSpeed: def.speed, r: def.r, alive: true, leaked: false,
    flash: 0, wob: game.rand() * 6.28,
    // status effects
    slowT: 0, slowF: 0, freezeT: 0, freezeImm: 0, stunT: 0,
    markT: 0, markPct: 0, brittleT: 0, brittlePct: 0,
    chargedT: 0, chargedPct: 0, chargedSlow: 0, scorchT: 0, scorchPct: 0,
    burnT: 0, burnDps: 0, burnSrc: null,
    shatterT: 0, shatterDmg: 0, shatterRadius: 0, shatterSrc: null,
  };
  game.map.path.posAt(dist, e, e.off);
  return e;
}

export function applySlow(e, factor, dur) {
  if (e.slowT <= 0 || factor >= e.slowF) e.slowF = factor;
  if (dur > e.slowT) e.slowT = dur;
}

export function updateEnemy(game, e, dt) {
  if (e.flash > 0) e.flash -= dt;
  if (e.slowT > 0) e.slowT -= dt;
  if (e.freezeT > 0) e.freezeT -= dt;
  if (e.freezeImm > 0) e.freezeImm -= dt;
  if (e.stunT > 0) e.stunT -= dt;
  if (e.markT > 0) e.markT -= dt;
  if (e.brittleT > 0) e.brittleT -= dt;
  if (e.chargedT > 0) e.chargedT -= dt;
  if (e.scorchT > 0) e.scorchT -= dt;
  if (e.shatterT > 0) e.shatterT -= dt;

  if (e.burnT > 0) {
    e.burnT -= dt;
    game.damage(e, e.burnDps * dt, 'blast', e.burnSrc, DOT);
    if (!e.alive) return;
  }

  let mul = 1;
  if (e.freezeT > 0 || e.stunT > 0) {
    mul = 0;
  } else {
    let slow = e.slowT > 0 ? e.slowF : 0;
    if (e.chargedT > 0 && e.chargedSlow > slow) slow = e.chargedSlow;
    if (game.globalSlow > slow) slow = game.globalSlow;
    if (e.def.slowRes) slow *= 1 - e.def.slowRes;
    mul = 1 - slow;
  }
  e.curSpeed = e.speed * mul;
  e.dist += e.curSpeed * dt;
  e.wob += dt * (2 + e.curSpeed * 0.12);

  const path = game.map.path;
  if (e.dist >= path.length) {
    e.alive = false;
    e.leaked = true;
    game.leak(e);
    return;
  }
  path.posAt(e.dist, e, e.off);
}

const DOT = { dot: true };
