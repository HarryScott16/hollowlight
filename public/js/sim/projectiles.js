// Projectiles, explosions and lingering ground zones. No DOM access.
const buf = [];

const marks = [];
function mark(game, e, s, src) {
  e.markT = Math.max(e.markT, s.markDur);
  e.markPct = Math.max(e.markPct, s.markPct);
  if (s.execute && !e.def.boss && e.hp < e.maxHp * s.execute) {
    game.damage(e, e.hp + e.shield + 1, 'true', src, EXECUTE);
    if (!e.alive) game.emit('execute', { x: e.x, y: e.y });
  }
}
const EXECUTE = { big: true };

function hitBolt(game, p, e) {
  const s = p.s;
  game.damage(e, p.dmg, s.type, p.src, s.armorPierce ? { armorPierce: s.armorPierce } : null);
  if (e.alive && s.knockback && !e.def.heavy) e.dist = Math.max(0, e.dist - s.knockback);
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
export function explode(game, x, y, s, src, sub) {
  const r = s.radius * (sub ? 0.6 : 1);
  const dmg = s.damage * (sub ? 0.5 : 1);
  const cap = Math.max(1, Math.round((s.maxHits || 999) * (sub ? 0.4 : 1)));
  game.grid.query(x, y, r + 34, buf);
  inBlast.length = 0;
  for (const e of buf) {
    if (!e.alive || e.def.flying) continue;
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
    if (s.burnDps) { e.burnT = s.burnDur; e.burnDps = Math.max(e.burnDps, s.burnDps); e.burnSrc = src; }
  }
  game.emit('explosion', { x, y, r, sub });
  if (sub) return;
  if (s.poolDps) {
    game.zones.push({ x, y, r: r * (s.poolRadiusMul || 1) * 0.9, dps: s.poolDps, t: s.poolDur, tick: 0, scorch: s.scorch || 0, src });
  }
  for (let i = 0; i < (s.cluster || 0); i++) {
    const a = game.rand() * 6.283, d = r * (0.5 + game.rand() * 0.7);
    game.projectiles.push({
      kind: 'shell', x, y, sx: x, sy: y, tx: x + Math.cos(a) * d, ty: y + Math.sin(a) * d,
      t: 0, flight: 0.3 + game.rand() * 0.15, sub: true, src, s, dead: false,
    });
  }
}

// Lobs one of a mortar's shells at a point (used by the Saturation ability).
export function launchShell(game, src, tx, ty, flight) {
  game.projectiles.push({
    kind: 'shell', x: src.x, y: src.y, sx: src.x, sy: src.y, tx, ty, t: 0, flight,
    sub: false, src, s: src.stats, dead: false,
  });
}

function updateShell(game, p, dt) {
  p.t += dt;
  const u = Math.min(1, p.t / p.flight);
  p.x = p.sx + (p.tx - p.sx) * u;
  p.y = p.sy + (p.ty - p.sy) * u;
  if (u >= 1) {
    p.dead = true;
    explode(game, p.tx, p.ty, p.s, p.src, p.sub);
  }
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
      if (!e.alive || e.def.flying) continue;
      if ((e.x - z.x) ** 2 + (e.y - z.y) ** 2 > (z.r + e.r * 0.5) ** 2) continue;
      // Overlapping pools don't stack: an enemy burns in one pool per tick.
      if (game.time - e.zoneT < ZONE_TICK * 0.9) continue;
      e.zoneT = game.time;
      if (z.scorch) { e.scorchT = ZONE_TICK * 2; e.scorchPct = z.scorch; }
      game.damage(e, z.dps * ZONE_TICK, 'blast', z.src, DOT);
      if (++hits >= ZONE_MAX_HITS) break;
    }
  }
  let w = 0;
  for (let i = 0; i < zones.length; i++) if (zones[i].t > 0) zones[w++] = zones[i];
  zones.length = w;
}
