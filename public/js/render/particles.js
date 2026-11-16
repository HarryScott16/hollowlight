// Lightweight pooled particle system. Particles are drawn as small squares for speed.
const MAX = 1400;

export class Particles {
  constructor() {
    this.list = [];
    this.pool = [];
  }

  clear() {
    this.list.length = 0;
  }

  // opts: color, speed, life, size, grav, drag, ang + spread (radians) for directed bursts
  burst(x, y, n, opts) {
    const { color = '#fff', speed = 80, life = 0.5, size = 2.5, grav = 0, drag = 2.5, ang = 0, spread = Math.PI * 2 } = opts;
    for (let i = 0; i < n; i++) {
      if (this.list.length >= MAX) return;
      const p = this.pool.pop() || {};
      const a = ang + (Math.random() - 0.5) * spread;
      const v = speed * (0.35 + Math.random() * 0.65);
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v;
      p.life = p.max = life * (0.6 + Math.random() * 0.4);
      p.size = size * (0.6 + Math.random() * 0.6);
      p.color = color; p.grav = grav; p.drag = drag;
      this.list.push(p);
    }
  }

  update(dt) {
    const list = this.list;
    let w = 0;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      p.life -= dt;
      if (p.life <= 0) { this.pool.push(p); continue; }
      const k = Math.max(0, 1 - p.drag * dt);
      p.vx *= k; p.vy = p.vy * k + p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      list[w++] = p;
    }
    list.length = w;
  }

  draw(ctx) {
    const list = this.list;
    let color = null;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (p.color !== color) { color = p.color; ctx.fillStyle = color; }
      const a = p.life / p.max;
      ctx.globalAlpha = a < 0.5 ? a * 2 : 1;
      const s = p.size * (0.5 + a * 0.5);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }
}
