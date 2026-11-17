// Enemy creation and per-step behaviour. No DOM access.
import { ENEMIES, PARENT } from '../data/enemies.js';

// mods: { hpMul (tough types only), speedMul, veiled, mending }. `root` ties every layer shed from
// one spawned enemy together, so a single bolt or chain can't strike the same enemy twice by
// hitting its freshly shed inner layers.
export function createEnemy(game, type, dist, wave, mods, root) {
  const def = ENEMIES[type];
  const hp = def.hp * (def.tough ? mods.hpMul : 1);
  const id = game.nextId++;
  const speed = def.speed * mods.speedMul;
  const e = {
    id, root: root || id, type, def, wave, mods,
    x: 0, y: 0, ang: 0, dist, off: (game.rand() - 0.5) * Math.max(4, Math.min(20, 34 - def.r)),
    hp, maxHp: hp, shield: 0, maxShield: 0,
    speed, curSpeed: speed, r: def.r, alive: true, leaked: false, veiled: !!mods.veiled,
    flash: 0, hitT: 0, frozenAmp: 0, wob: game.rand() * 6.28, phase: 0, lastHit: game.time,
    mendTop: mods.mending ? type : null,
    // status effects
    slowT: 0, slowF: 0, freezeT: 0, freezeImm: 0, stunT: 0,
    markT: 0, markPct: 0, brittleT: 0, brittlePct: 0,
    chargedT: 0, chargedPct: 0, chargedSlow: 0, scorchT: 0, scorchPct: 0,
    burnT: 0, burnDps: 0, burnSrc: null, revealT: 0,
    shatterT: 0, shatterDmg: 0, shatterRadius: 0, shatterSrc: null,
  };
  game.map.path.posAt(dist, e, e.off);
  return e;
}

// Inner layers keep the outer layer's lingering effects (slows, marks, burns), like shrapnel
// still on fire. Freezes, stuns and shatter charges do not carry over.
const INHERIT = ['slowT', 'slowF', 'markT', 'markPct', 'brittleT', 'brittlePct', 'chargedT', 'chargedPct',
  'chargedSlow', 'burnT', 'burnDps', 'burnSrc', 'scorchT', 'scorchPct', 'revealT', 'mendTop'];
export function inherit(child, parent) {
  for (const k of INHERIT) child[k] = parent[k];
}

export function applySlow(e, factor, dur) {
  if (e.slowT <= 0 || factor >= e.slowF) e.slowF = factor;
  if (dur > e.slowT) e.slowT = dur;
}

const MEND_DELAY = 3;

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

  if (e.burnT > 0) {
    e.burnT -= dt;
    game.damage(e, e.burnDps * dt, 'blast', e.burnSrc, DOT);
    if (!e.alive) return;
  }

  // Mending (endless modifier): a layer left alone for a while grows back its outer layer.
  if (e.mendTop && e.type !== e.mendTop && game.time - e.lastHit > MEND_DELAY) mend(game, e);

  let mul = 1;
  if (e.freezeT > 0 || e.stunT > 0) {
    mul = 0;
  } else {
    let slow = e.slowT > 0 ? e.slowF : 0;
    if (e.chargedT > 0 && e.chargedSlow > slow) slow = e.chargedSlow;
    if (game.globalSlow > slow) slow = game.globalSlow;
    if (game.whiteoutT > 0 && game.whiteout > slow) slow = game.whiteout;
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

function mend(game, e) {
  const up = PARENT[e.type];
  if (!up) { e.mendTop = null; return; }
  const def = ENEMIES[up];
  e.type = up;
  e.def = def;
  e.hp = e.maxHp = def.hp * (def.tough ? e.mods.hpMul : 1);
  e.speed = def.speed * e.mods.speedMul;
  e.r = def.r;
  e.lastHit = game.time;
  game.emit('mend', { x: e.x, y: e.y, r: e.r });
}

const DOT = { dot: true };
