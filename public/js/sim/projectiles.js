// Projectiles, explosions and lingering ground zones. No DOM access.
const buf = [];

function hitBolt(game, p, e) {
  const s = p.s;
  game.damage(e, p.dmg, s.type, p.src, s.armorPierce ? { armorPierce: s.armorPierce } : null);
  if (e.alive && s.markPct) {
    e.markT = Math.max(e.markT, s.markDur);
    e.markPct = Math.max(e.markPct, s.markPct);
    if (s.execute && !e.def.boss && e.hp < e.maxHp * s.execute) game.damage(e, e.hp + e.shield + 1, 'true', p.src);
  }
  p.hit.push(e.id);
  p.homing = false;
  if (--p.pierce <= 0) p.dead = true;
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
  if (p.life <= 0) { p.dead = true; return; }
  game.grid.query(p.x, p.y, 40, buf);
  for (let i = 0; i < buf.length && !p.dead; i++) {
    const e = buf[i];
    if (!e.alive || p.hit.includes(e.id) || !game.targetable(e, p.s)) continue;
    const rr = e.r + 6;
    if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 <= rr * rr) hitBolt(game, p, e);
  }
}

export function explode(game, x, y, s, src, sub) {
  const r = s.radius * (sub ? 0.6 : 1);
  const dmg = s.damage * (sub ? 0.5 : 1);
  game.grid.query(x, y, r + 34, buf);
  for (const e of buf) {
    if (!e.alive || e.def.flying) continue;
    const reach = r + e.r * 0.6;
    if ((e.x - x) ** 2 + (e.y - y) ** 2 > reach * reach) continue;
    game.damage(e, dmg, s.type, src);
    if (!e.alive) continue;
    if (s.stun && !e.def.boss) e.stunT = Math.max(e.stunT, s.stun * (sub ? 0.5 : 1));
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
const DOT = { dot: true };
export function updateZones(game, dt) {
  const zones = game.zones;
  for (const z of zones) {
    z.t -= dt;
    z.tick -= dt;
    if (z.tick > 0) continue;
    z.tick += ZONE_TICK;
    game.grid.query(z.x, z.y, z.r + 20, buf);
    for (const e of buf) {
      if (!e.alive || e.def.flying) continue;
      if (z.scorch) { e.scorchT = ZONE_TICK * 2; e.scorchPct = z.scorch; }
      game.damage(e, z.dps * ZONE_TICK, 'blast', z.src, DOT);
    }
  }
  let w = 0;
  for (let i = 0; i < zones.length; i++) if (zones[i].t > 0) zones[w++] = zones[i];
  zones.length = w;
}
