// Lightweight pooled particle system. Particles are drawn as small squares for speed.
const MAX = 1400;
const LEVELS = 4;   // fade steps: particles are drawn in batches of one colour and one alpha each

export class Particles {
  constructor() {
    this.list = [];
    this.pool = [];
    this.cap = MAX;     // lowered by the renderer for big crowds
    this.share = 1;     // fraction of each burst actually spawned (big crowds spawn fewer)
    this.groups = new Map();
  }

  clear() {
    this.list.length = 0;
  }

  // opts: color, speed, life, size, grav, drag, ang + spread (radians) for directed bursts
  burst(x, y, n, opts) {
    const { color = '#fff', speed = 80, life = 0.5, size = 2.5, grav = 0, drag = 2.5, ang = 0, spread = Math.PI * 2 } = opts;
    if (this.share < 1) n = Math.max(1, Math.round(n * this.share));
    for (let i = 0; i < n; i++) {
      if (this.list.length >= this.cap) return;
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

  // Batched: one path per (colour, fade step), so a thousand particles cost a few dozen fills.
  draw(ctx) {
    const list = this.list, groups = this.groups;
    for (const g of groups.values()) for (let l = 0; l < LEVELS; l++) g[l].length = 0;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      let g = groups.get(p.color);
      if (!g) { g = []; for (let l = 0; l < LEVELS; l++) g.push([]); groups.set(p.color, g); }
      const a = p.life / p.max;
      g[Math.max(0, Math.min(LEVELS - 1, ((a < 0.5 ? a * 2 : 1) * LEVELS - 0.001) | 0))].push(p);   // (x | 0 also turns NaN into 0)
    }
    for (const [color, g] of groups) {
      let set = false;
      for (let l = 0; l < LEVELS; l++) {
        const arr = g[l];
        if (!arr.length) continue;
        if (!set) { ctx.fillStyle = color; set = true; }
        ctx.globalAlpha = (l + 1) / LEVELS;
        ctx.beginPath();
        for (let k = 0; k < arr.length; k++) { const p = arr[k], a = p.life / p.max, s = p.size * (0.5 + a * 0.5); ctx.rect(p.x - s / 2, p.y - s / 2, s, s); }
        ctx.fill();
      }
    }
    if (groups.size > 64) groups.clear();
    ctx.globalAlpha = 1;
  }
}
