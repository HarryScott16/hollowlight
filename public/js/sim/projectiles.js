// Projectiles, explosions and lingering ground zones. No DOM access.
import { hookHit } from './newwards.js';
import { applySlow } from './enemies.js';
const buf = [];
// A flyer circling a Moth Lantern (or still grounded by Flypaper) flies low: anything can hit it.
export const isLow = (e) => e.lureW > 0.5 || e.groundT > 0;

// Every bolt and shell is built here with the same fields (renderer's own included), so they all
// share one shape: V8 keeps property access fast only while objects share a hidden class.
export function newBolt(f) {
  return {
    kind: 'bolt', x: f.x, y: f.y, vx: f.vx, vy: f.vy, speed: f.speed, target: f.target, homing: f.homing,
    dmg: f.dmg, pierce: f.pierce, hit: f.hit, bounces: f.bounces || 0, life: f.life, src: f.src, s: f.s, dead: false,
    rend: f.rend || 0, star: !!f.star, comet: !!f.comet, ox: f.ox || 0, oy: f.oy || 0, big: !!f.big, sky: !!f.sky,
    gen: f.gen || 0, split: !!f.split, sx: 0, sy: 0, tx: 0, ty: 0, t: 0, flight: 0, sub: false, quake: false,
    _ox: undefined, _oy: undefined, _sx: undefined, _sy: undefined, _D: undefined,
  };
}
export function newShell(f) {
  return {
    kind: 'shell', x: f.x, y: f.y, vx: 0, vy: 0, speed: 0, target: null, homing: false,
    dmg: 0, pierce: 0, hit: null, bounces: 0, life: 0, src: f.src, s: f.s, dead: false,
    rend: 0, star: false, comet: false, ox: 0, oy: 0, big: false, sky: false,
    gen: 0, split: false, sx: f.sx, sy: f.sy, tx: f.tx, ty: f.ty, t: 0, flight: f.flight, sub: !!f.sub, quake: !!f.quake,
    _ox: undefined, _oy: undefined, _sx: undefined, _sy: undefined, _D: undefined,
  };
}

const marks = [];
export function mark(game, e, s, src) {
  e.markT = Math.max(e.markT, s.markDur);
  e.markPct = Math.max(e.markPct, s.markPct);
  e.markSrc = src;   // a Dawnbringer's marks spread when the marked die
  // Executions: marked enemies close to death (Wild Hunt: hulks too; never bosses).
  const ex = e.def.boss ? 0 : e.def.heavy ? s.executeHeavy || 0 : s.execute || 0;
  if (ex && e.hp < e.maxHp * ex) {
    game.damage(e, e.hp + e.shield + 1, 'true', src, EXECUTE);
    if (!e.alive) game.emit('execute', { x: e.x, y: e.y });
  }
}
const EXECUTE = { big: true };

function hitBolt(game, p, e) {
  const s = p.s;
  game.damage(e, p.dmg, s.type, p.src, s.armorPierce ? { armorPierce: s.armorPierce } : null);
  if (e.alive && s.knockback && !e.def.heavy) game.pushBack(e, s.knockback, p.src);
  if (p.hook && p.drag) hookHit(game, p, e);   // Ferrylight harpoons
  // Worldpiercer: the giant lance stuns everything it passes through.
  if (p.rend && e.alive && !e.def.boss) e.stunT = Math.max(e.stunT, e.def.heavy ? p.rend * 0.4 : p.rend);
  // Thousand Bolts: a bolt that kills splits into new bolts.
  if (!e.alive && s.splitKill && (p.gen || 0) < 3 && p.src.splitTokens >= 1) split(game, p, e, s);
  if (s.markPct) {
    if (s.markRadius) {
      game.grid.query(e.x, e.y, s.markRadius, marks);
      const list = marks.slice();
      for (const m of list) if (m.alive && game.targetable(m, s, true)) mark(game, m, s, p.src);
      game.emit('markburst', { x: e.x, y: e.y, r: s.markRadius });
    } else if (e.alive) {
      mark(game, e, s, p.src);
    }
  }
  // A Wandering Light's star bursts on hit.
  if (p.star && s.starRadius) starBurst(game, p, e, s);
  p.hit.push(e.root);
  p.homing = false;
  if (--p.pierce > 0) return;
  // Ricochet: hop to the nearest enemy this bolt hasn't hit yet.
  if (p.bounces > 0) {
    game.grid.query(e.x, e.y, 150, marks);
    let best = null, bestD = Infinity;
    for (const o of marks) {
      if (!game.targetable(o, s) || p.hit.includes(o.root)) continue;
      const d = (o.x - e.x) ** 2 + (o.y - e.y) ** 2;
      if (d < bestD) { bestD = d; best = o; }
    }
    if (best) {
      p.bounces--;
      p.pierce = 1;
      p.target = best;
      p.homing = true;
      p.life = 260;
      p.x = e.x; p.y = e.y;
      return;
    }
  }
  p.dead = true;
}

const splitTo = [];
function split(game, p, e, s) {
  p.src.splitTokens--;
  game.grid.query(e.x, e.y, 140, marks);
  splitTo.length = 0;
  for (const o of marks) {
    if (o.root === e.root || !game.targetable(o, s)) continue;
    o._d2 = (o.x - e.x) ** 2 + (o.y - e.y) ** 2;
    splitTo.push(o);
  }
  splitTo.sort((a, b) => a._d2 - b._d2);
  for (let i = 0; i < s.splitKill; i++) {
    const o = splitTo[i] || null;
    const a = o ? Math.atan2(o.y - e.y, o.x - e.x) : game.rand() * 6.283;
    game.projectiles.push(newBolt({
      x: e.x, y: e.y, vx: Math.cos(a) * p.speed, vy: Math.sin(a) * p.speed, speed: p.speed,
      target: o, homing: !!o, dmg: p.dmg, pierce: 1, hit: [e.root], bounces: 0, life: 240,
      src: p.src, s, gen: (p.gen || 0) + 1, split: true,
    }));
  }
}

const STAR = { quiet: true, armorPierce: 0 };
function starBurst(game, p, e, s) {
  const x = e.x, y = e.y, r = p.sky ? s.skyRadius : s.starRadius * (p.big ? 1.3 : 1);
  game.grid.query(x, y, r + 20, marks);
  const list = marks.slice();
  let n = 0;
  const cap = p.sky ? s.skyHits : s.starHits;
  STAR.armorPierce = s.armorPierce || 0;
  // Falling Sky: the falling star stuns what it lands on (hulks excepted).
  if (p.sky && e.alive && !e.def.heavy) e.stunT = Math.max(e.stunT, s.skyStun);
  for (const o of list) {
    if (o === e || !o.alive || !game.targetable(o, s, true)) continue;
    if ((o.x - x) ** 2 + (o.y - y) ** 2 > (r + o.r * 0.5) ** 2) continue;
    game.damage(o, p.dmg * s.starMul, s.type, p.src, STAR);
    if (p.sky && o.alive && !o.def.heavy) o.stunT = Math.max(o.stunT, s.skyStun);
    if (++n >= cap) break;
  }
  game.emit('starburst', { x, y, r, comet: !!p.comet, sky: !!p.sky });
}

function updateBolt(game, p, dt) {
  if (p.homing) {
    const e = p.target;
    if (e.alive) {
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
      p.vx = (dx / d) * p.speed; p.vy = (dy / d) * p.speed;
    } else {
      p.homing = false;
    }
  }
  p.x += p.vx * dt; p.y += p.vy * dt;
  p.life -= p.speed * dt;
  if (p.life <= 0 || p.x < -60 || p.y < -60 || p.x > game.map.width + 60 || p.y > game.map.height + 60) { p.dead = true; return; }
  game.grid.query(p.x, p.y, 40 + 6 * (p.s.boltSize || 1), buf);
  for (let i = 0; i < buf.length && !p.dead; i++) {
    const e = buf[i];
    if (!e.alive || p.hit.includes(e.root) || !game.targetable(e, p.s)) continue;
    const rr = e.r + 4 + 3 * (p.s.boltSize || 1);
    if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 <= rr * rr) hitBolt(game, p, e);
  }
}

const inBlast = [];
export function explode(game, x, y, s, src, sub, kind = 'shell') {
  const r = s.radius * (sub ? 0.6 : 1);
  const dmg = s.damage * (sub ? 0.5 : 1);
  const cap = Math.max(1, Math.round((s.maxHits || 999) * (sub ? 0.4 : 1)));
  game.grid.query(x, y, r + 34, buf);
  inBlast.length = 0;
  for (const e of buf) {
    if (!e.alive || (e.def.flying && !s.hitsAir && !isLow(e))) continue;
    const reach = r + e.r * 0.6;
    const d2 = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d2 > reach * reach) continue;
    e._d2 = d2;
    inBlast.push(e);
  }
  // A blast breaks up to `cap` enemies, nearest the centre first.
  if (inBlast.length > cap) { inBlast.sort((a, b) => a._d2 - b._d2); inBlast.length = cap; }
  for (const e of inBlast) {
    if (!e.alive) continue;
    game.damage(e, dmg, s.type, src);
    if (!e.alive) continue;
    if (s.stun && !e.def.heavy) e.stunT = Math.max(e.stunT, s.stun * (sub ? 0.5 : 1));
    else if (s.heavyStun && e.def.heavy && !e.def.boss) e.stunT = Math.max(e.stunT, s.heavyStun);
    if (s.burnDps) {
      if (e.burnT <= 0 || s.burnDps >= e.burnDps) { e.burnDps = s.burnDps; e.burnType = 'blast'; e.burnSrc = src; }
      e.burnT = Math.max(e.burnT, s.burnDur);
    }
  }
  game.emit('explosion', { x, y, r, sub, kind });
  if (sub) return;
  if (s.poolDps) addZone(game, { x, y, r: r * (s.poolRadiusMul || 1) * 0.9, dps: s.poolDps, t: s.poolDur, tick: 0, scorch: s.scorch || 0, magma: s.magma || 0, src });
  for (let i = 0; i < (s.cluster || 0); i++) {
    const a = game.rand() * 6.283, d = r * (0.5 + game.rand() * 0.7);
    game.projectiles.push(newShell({
      x, y, sx: x, sy: y, tx: x + Math.cos(a) * d, ty: y + Math.sin(a) * d,
      flight: 0.3 + game.rand() * 0.15, sub: true, src, s,
    }));
  }
}

// Lobs one of a mortar's shells at a point (used by the Saturation ability).
export function launchShell(game, src, tx, ty, flight) {
  game.projectiles.push(newShell({ x: src.x, y: src.y, sx: src.x, sy: src.y, tx, ty, flight, sub: false, src, s: src.stats }));
}

function updateShell(game, p, dt) {
  p.t += dt;
  const u = Math.min(1, p.t / p.flight);
  p.x = p.sx + (p.tx - p.sx) * u;
  p.y = p.sy + (p.ty - p.sy) * u;
  if (u >= 1) {
    p.dead = true;
    if (p.quake) explode(game, p.tx, p.ty, quake(p.s), p.src, false, 'quake');
    else explode(game, p.tx, p.ty, p.s, p.src, p.sub);
  }
}
// Worldbreaker: the shell's stats as a falling mountain.
const QK = {};
function quake(s) {
  Object.assign(QK, s);
  QK.damage = s.damage * s.quakeMul; QK.radius = s.radius * s.quakeRadius; QK.maxHits = s.quakeHits;
  QK.stun = s.quakeStun; QK.heavyStun = 0.5; QK.cluster = 0;
  return QK;
}

export function updateProjectiles(game, dt) {
  const list = game.projectiles;
  // Explosions may append bomblets while we iterate; they are picked up in the same pass.
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (p.kind === 'bolt') updateBolt(game, p, dt);
    else updateShell(game, p, dt);
  }
  let w = 0;
  for (let i = 0; i < list.length; i++) if (!list[i].dead) list[w++] = list[i];
  list.length = w;
}

// A pool landing mostly on top of one from the same ward refreshes that one instead (overlapping
// pools don't stack anyway: an enemy burns in one pool per tick), so the ground stays cheap to draw.
export function addZone(game, z) {
  for (const o of game.zones) {
    if (o.src === z.src && o.type === z.type && (o.x - z.x) ** 2 + (o.y - z.y) ** 2 < (o.r * 0.6) ** 2 && o.r >= z.r * 0.9) {
      o.t = Math.max(o.t, z.t);
      return o;
    }
  }
  game.zones.push(z);
  return z;
}

const ZONE_TICK = 0.25;
const ZONE_MAX_HITS = 25;   // enemies burned per pool per tick
const DOT = { dot: true };
export function updateZones(game, dt) {
  const zones = game.zones;
  for (const z of zones) {
    z.t -= dt;
    z.tick -= dt;
    if (z.tick > 0) continue;
    z.tick += ZONE_TICK;
    game.grid.query(z.x, z.y, z.r + 20, buf);
    let hits = 0;
    for (const e of buf) {
      if (!e.alive || (e.def.flying && !isLow(e))) continue;
      if ((e.x - z.x) ** 2 + (e.y - z.y) ** 2 > (z.r + e.r * 0.5) ** 2) continue;
      // Overlapping pools don't stack: an enemy burns in one pool per tick.
      if (game.time - e.zoneT < ZONE_TICK * 0.9) continue;
      e.zoneT = game.time;
      if (z.scorch) { e.scorchT = ZONE_TICK * 2; e.scorchPct = z.scorch; }
      // Magma Heart: magma mires what walks in it, and what dies in it erupts (game.kill).
      if (z.magma) { applySlow(e, z.magma, ZONE_TICK * 1.6); e.magmaT = game.time + ZONE_TICK * 1.6; e.magmaSrc = z.src; }
      game.damage(e, z.dps * ZONE_TICK, z.type || 'blast', z.src, DOT);
      if (++hits >= ZONE_MAX_HITS) break;
    }
  }
  let w = 0;
  for (let i = 0; i < zones.length; i++) if (zones[i].t > 0) zones[w++] = zones[i];
  zones.length = w;
}

// Flashmines: a mine arms after a moment, then bursts under the first ground enemy that steps on it.
const MINE_R = 12;
export function updateMines(game, dt) {
  const mines = game.mines;
  if (!mines.length) return;
  for (const m of mines) {
    if (m.arm > 0) { m.arm -= dt; continue; }
    game.grid.query(m.x, m.y, MINE_R + 30, buf);
    for (const e of buf) {
      if (!e.alive || e.def.flying) continue;
      if ((e.x - m.x) ** 2 + (e.y - m.y) ** 2 > (MINE_R + e.r) ** 2) continue;
      const s = m.src.stats;
      MINE.radius = s.mineRadius; MINE.damage = s.mineDmg; MINE.maxHits = s.mineHits; MINE.stun = s.mineStun || 0;
      m.dead = true;
      explode(game, m.x, m.y, MINE, m.src, false, 'mine');
      // Constellation: every mine of the same snare near a burst bursts with it, and so on.
      if (s.mineChain) {
        chained.length = 0; chained.push(m);
        const r2 = s.mineChain * s.mineChain;
        for (let k = 0; k < chained.length; k++) {
          const c = chained[k];
          for (const o of mines) {
            if (o.dead || o.src !== m.src || (o.x - c.x) ** 2 + (o.y - c.y) ** 2 > r2) continue;
            o.dead = true; chained.push(o);
            game.emit('minelink', { x: c.x, y: c.y, x2: o.x, y2: o.y });
            explode(game, o.x, o.y, MINE, m.src, false, 'mine');
          }
        }
      }
      break;
    }
  }
  let w = 0;
  for (let i = 0; i < mines.length; i++) if (!mines[i].dead) mines[w++] = mines[i];
  mines.length = w;
}
const chained = [];
const MINE = { radius: 40, damage: 20, maxHits: 8, stun: 0, type: 'kinetic', hitsAir: false };
