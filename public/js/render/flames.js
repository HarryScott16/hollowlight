// Ember Censer flamethrower effects. Every firing Censer pours out a stream of additive flame
// particles that leave the nozzle white-hot, cool through orange to red, billow out and rise, and
// trail smoke. Embers spark off the stream, the ground under it is scorched, the air above the
// tips shimmers, and the area glows. Dragon's Breath at tier 4 breathes a swirling ring of fire.
// Flame leaves the ward's spout (or mouth) up on the upright ward and drops to the ground as it
// travels: each particle carries a height z that fades out over its life.
//
// The renderer reads the simulation directly (t.firing, t.ang, t.stats.range/arc), so the flame
// follows the nozzle as it sweeps: particles keep the heading they left with, and the stream
// bends like a real hose. Everything is pooled and capped, so dozens of Censers stay cheap.
import { wardMuzzle } from './wardArt.js';

const TAU = Math.PI * 2;
const MAX_FLAME = 1500;     // flame particles alive at once (all Censers together)
const MAX_SMOKE = 240;
const MAX_SCORCH = 110;
const STAGES = 6;           // colour steps along a particle's life
const DRAG = 1.3;           // flame slows as it spreads

// Colour ramps from the nozzle (hottest) to the tips, per look. [0] is the white-hot core (the
// additive pass and the nozzle flare); the solid body runs through [1]-[5].
const PALETTES = {
  ember: ['#ffe9a0', '#ffb43a', '#ff7a22', '#f04a18', '#c42a14', '#6a1810'],
  warm: ['#fff6d0', '#ffc848', '#ff8a26', '#ff5a1c', '#d8301a', '#7a1c10'],
  hot: ['#ffffff', '#ffe27a', '#ffa83a', '#ff7424', '#e8401a', '#8a2010'],
  white: ['#ffffff', '#fff0a8', '#ffcc5a', '#ff9a34', '#f05a1e', '#a02c10'],
  // Wildfire: a white-hot core over deep crimson. (Fire stays in reds and oranges: blue would
  // read as Frost and pink as Hearth.)
  inferno: ['#ffffff', '#fff8e0', '#ffe08a', '#ff8a3a', '#ff3a22', '#8a0c08'],
  ash: ['#ffe0d0', '#ff9a6a', '#ff5a3a', '#d42a2a', '#7a1a1a', '#2e1010'],
  brand: ['#fff0e0', '#ff9a6a', '#ff4433', '#d01a22', '#8a1020', '#3a0c14'],   // Ashen Brand: crimson and soot
};
const EMBER = { ember: '#ffb347', warm: '#ffc24a', hot: '#ffe08a', white: '#fff4c0', inferno: '#ffffff', ash: '#ff7a5a', brand: '#ff6a4a' };
const GLOW = { ember: '#ff6a1a', warm: '#ff7a20', hot: '#ff9a30', white: '#ffc860', inferno: '#ff7a3a', ash: '#e0402a', brand: '#d0201a' };

// How a Censer's flame looks: hotter (orange -> white-hot) as it's upgraded.
function flameLook(tiers) {
  const [a, b, c] = tiers;
  if (a >= 4) return 'inferno';
  if (c >= 4) return 'brand';
  if (c >= 3) return 'ash';
  if (a >= 3 || b >= 4) return 'white';
  const heat = a + b * 0.7 + c * 0.5;
  return heat >= 3 ? 'hot' : heat >= 1.5 ? 'warm' : 'ember';
}

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

// A soft round blob, pre-rendered once.
function blob(make, color, size, mid, midA) {
  const c = make();
  c.width = c.height = size;
  const g = c.getContext('2d');
  const h = size / 2;
  const gr = g.createRadialGradient(h, h, 0, h, h, h);
  gr.addColorStop(0, rgba(color, 1));
  gr.addColorStop(mid, rgba(color, midA));
  gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

export class FlameFx {
  constructor(renderer) {
    this.r = renderer;
    this.flame = [];
    this.smoke = [];
    this.scorch = [];
    this.pool = [];
    this.state = new Map();   // tower id -> { k (0-1 intensity), acc, scorchT, waveT, seen }
    this.frame = 0;
    this.time = 0;
    this.active = [];         // Censers drawing this frame: [tower, state] pairs
    this.sprites = null;
    this.hazeCache = new Map();   // tower id -> cached background patch
    this.m = [0, 0];
  }

  initSprites() {
    const make = () => document.createElement('canvas');
    const sp = { flame: {}, glow: {}, smoke: null, ash: null, scorch: null, coal: null };
    for (const k in PALETTES) {
      sp.flame[k] = PALETTES[k].map((col, i) => blob(make, col, 32, 0.35 + i * 0.04, 0.6 - i * 0.05));
      sp.glow[k] = blob(make, GLOW[k], 64, 0.3, 0.35);
    }
    sp.smoke = blob(make, '#4a4248', 32, 0.4, 0.5);
    sp.ash = blob(make, '#2a2026', 32, 0.4, 0.6);
    sp.scorch = blob(make, '#140a06', 32, 0.45, 0.75);
    sp.coal = blob(make, '#ff6a1a', 32, 0.2, 0.4);
    this.sprites = sp;
  }

  clear() {
    for (const p of this.flame) this.pool.push(p);
    this.flame.length = this.smoke.length = this.scorch.length = 0;
    this.state.clear();
    this.hazeCache.clear();
    this.active.length = 0;
  }

  // Advances the effect and returns the roar level for the sound (about 1 per Censer at full blast).
  // quality: the renderer's crowd level (2 full, 1 crowd, 0 huge crowd); crowds pour thinner flame.
  update(dt, towers, lite, quality = lite ? 1 : 2) {
    this.quality = quality;
    this.active.length = 0;
    if (dt <= 0) {
      // Paused: keep drawing what's there, but nothing moves or roars.
      for (const t of towers) {
        const st = t.def.kind === 'flame' && this.state.get(t.id);
        if (st && st.k > 0.01) this.active.push(t, st);
      }
      return 0;
    }
    if (!this.sprites) this.initSprites();
    this.time += dt;
    this.frame++;
    let firing = 0;
    for (const t of towers) if (t.def.kind === 'flame' && t.firing) firing++;
    // Past a handful of Censers, each pours a little thinner so the total stays bounded.
    const share = (firing > 5 ? 5 / firing : 1) * [0.3, 0.5, 1][quality];
    let level = 0;
    for (const t of towers) {
      if (t.def.kind !== 'flame') continue;
      let st = this.state.get(t.id);
      if (!st) { st = { k: 0, acc: 0, scorchT: 0, waveT: 0, seen: 0 }; this.state.set(t.id, st); }
      st.seen = this.frame;
      // The flame catches fast and dies down a little slower.
      st.k = t.firing ? Math.min(1, st.k + dt * 7) : Math.max(0, st.k - dt * 3.5);
      if (st.k <= 0.01) continue;
      level += st.k;
      this.active.push(t, st);
      this.emit(t, st, dt, share);
    }
    for (const [id, st] of this.state) if (st.seen !== this.frame) this.state.delete(id);
    this.step(dt);
    return level;
  }

  emit(t, st, dt, share) {
    const s = t.stats, P = this.r.parts;
    const ring = s.arc >= TAU - 0.01;
    const look = flameLook(t.tiers);
    const lvl = t.tiers[0] + t.tiers[1] + t.tiers[2];
    const range = s.range, arc = ring ? TAU : s.arc;
    const life = 0.34 + range * 0.0007;
    const reachK = (1 - Math.exp(-DRAG * life)) / DRAG;   // distance covered per unit of start speed
    const rate = (ring ? 210 : 52 + 34 * Math.min(2.5, arc) + range * 0.26) * share * st.k;
    const M = this.m;
    wardMuzzle(t, t.ang, M);
    const ox = M[0], oz = Math.max(0, t.y + Math.sin(t.ang) * 10 - M[1]), oy = M[1] + oz;
    const s0 = 6 + lvl * 0.7, s1 = 17 + range * 0.11 + Math.min(arc, 2) * 5 + lvl * 1.6;
    st.acc += rate * dt;
    while (st.acc >= 1) {
      st.acc -= 1;
      if (this.flame.length >= MAX_FLAME) { st.acc = 0; break; }
      const p = this.pool.pop() || {};
      let a, x0 = ox, y0 = oy, z0 = oz;
      if (ring) {
        // Dragon's Breath ring: a jet from each of the three spinning heads, curling into a
        // pinwheel, with fire filling the ring between them.
        const head = t.ang + ((Math.random() * 3) | 0) * (TAU / 3);
        a = Math.random() < 0.6 ? head + (Math.random() - 0.5) * 0.4 : Math.random() * TAU;
        wardMuzzle(t, head, M);
        z0 = Math.max(0, t.y + Math.sin(head) * 10 - M[1]); x0 = M[0]; y0 = M[1] + z0;
      } else {
        // Fuller in the middle of the cone, thinning to its edges.
        a = t.ang + (Math.random() + Math.random() - 1) * arc * 0.55;
      }
      p.max = p.life = life * (0.85 + Math.random() * 0.3);
      const reach = range * (0.8 + Math.random() * 0.25);
      const v = reach / ((1 - Math.exp(-DRAG * p.max)) / DRAG || reachK);
      p.x = x0; p.y = y0; p.z = z0;
      p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v;
      if (ring) { const sw = v * 0.45; p.vx += Math.sin(a) * sw; p.vy -= Math.cos(a) * sw; }   // trails the spin
      p.s0 = s0 * (0.8 + Math.random() * 0.4);
      p.s1 = s1 * (0.75 + Math.random() * 0.5);
      if (ring && Math.random() < 0.3) {
        // The crest: a band of flame burning along the ring's edge, licking round with the spin.
        const r0 = range * (0.72 + Math.random() * 0.25);
        p.x = t.x + Math.cos(a) * r0; p.y = t.y + Math.sin(a) * r0; p.z = 0;
        const tv = 40 + Math.random() * 40;
        p.vx = Math.sin(a) * tv + Math.cos(a) * 12; p.vy = -Math.cos(a) * tv + Math.sin(a) * 12 - 20;
        p.s0 = s1 * 0.5; p.s1 = s1 * 0.9;
      }
      p.look = look;
      p.core = ring ? 0.25 : 0.45;   // how much of its life it glows white-hot (the ring overlaps a lot)
      p.seed = Math.random() * TAU;
      p.smoke = look === 'ash' || look === 'brand' ? 0.22 : 0.03 + t.tiers[2] * 0.05;
      this.flame.push(p);
    }

    // Embers spark off the stream and drift up.
    if (Math.random() < (ring ? 40 : 16) * st.k * share * dt) {
      const a = ring ? Math.random() * TAU : t.ang + (Math.random() - 0.5) * arc;
      const d = range * (0.4 + Math.random() * 0.6);
      P.burst(t.x + Math.cos(a) * d, t.y + Math.sin(a) * d, 1 + (Math.random() < 0.4 ? 1 : 0),
        { color: EMBER[look], speed: 70, life: 0.9, size: 2.2, grav: -70, ang: a, spread: 1.4, drag: 1.2 });
    }

    // Scorch marks where the flame licks the ground.
    st.scorchT -= dt * st.k;
    if (st.scorchT <= 0) {
      st.scorchT = ring ? 0.07 : 0.15;
      const a = ring ? Math.random() * TAU : t.ang + (Math.random() - 0.5) * arc * 0.9;
      const d = range * (0.3 + Math.random() * 0.7);
      if (this.scorch.length >= MAX_SCORCH) this.scorch.shift();
      this.scorch.push({ x: t.x + Math.cos(a) * d, y: t.y + Math.sin(a) * d, r: 7 + Math.random() * 8 + lvl, life: 9, max: 9 });
    }

    // The ring breathes: a wave of fire rolls out every second or so.
    if (ring && (st.waveT -= dt) <= 0) {
      st.waveT = 0.9;
      this.r.ring(t.x, t.y, 14, range, 0.55, rgba(GLOW[look], 0.9), 4, rgba(GLOW[look], 0.12), true);
    }
  }

  step(dt) {
    const fl = this.flame, sm = this.smoke;
    const k = Math.max(0, 1 - DRAG * dt);
    let w = 0;
    for (let i = 0; i < fl.length; i++) {
      const p = fl[i];
      p.life -= dt;
      if (p.life <= 0) {
        if (sm.length < MAX_SMOKE && Math.random() < p.smoke) {
          const life = 1.1 + Math.random() * 0.6;
          sm.push({ x: p.x, y: p.y, vx: p.vx * 0.12 + (Math.random() - 0.5) * 12, vy: -22 - Math.random() * 18,
            life, max: life, s0: p.s1 * 0.5, s1: p.s1 * 1.3, dark: p.look === 'ash' || p.look === 'brand' });
        }
        this.pool.push(p);
        continue;
      }
      const u = 1 - p.life / p.max;
      p.vx *= k;
      p.vy = p.vy * k - 110 * u * dt;   // hot gas rises as it slows
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      fl[w++] = p;
    }
    fl.length = w;
    w = 0;
    for (let i = 0; i < sm.length; i++) {
      const s = sm[i];
      s.life -= dt;
      if (s.life <= 0) continue;
      s.vx *= 1 - 0.8 * dt;
      s.x += s.vx * dt + Math.sin(this.time * 2 + i) * 6 * dt;
      s.y += s.vy * dt;
      sm[w++] = s;
    }
    sm.length = w;
    const sc = this.scorch;
    w = 0;
    for (let i = 0; i < sc.length; i++) { const s = sc[i]; s.life -= dt; if (s.life > 0) sc[w++] = s; }
    sc.length = w;
  }

  // The patch of background around a Censer, cut out once and cached: copying strips from the
  // full-map background every frame is slow (some canvases snapshot the whole source per copy).
  hazeSource(t, bg, scale) {
    const key = `${Math.round(t.stats.range)}|${scale}|${bg.width}`;
    let c = this.hazeCache.get(t.id);
    if (c && c.key === key) return c;
    if (this.hazeCache.size >= 8) this.hazeCache.clear();
    const bw = bg.width / scale, bh = bg.height / scale;
    const h = Math.ceil(t.stats.range * 1.3 + 20);
    const x0 = Math.max(0, Math.floor(t.x - h)), y0 = Math.max(0, Math.floor(t.y - h - 12));
    const x1 = Math.min(bw, Math.ceil(t.x + h)), y1 = Math.min(bh, Math.ceil(t.y + h));
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round((x1 - x0) * scale));
    cv.height = Math.max(1, Math.round((y1 - y0) * scale));
    cv.getContext('2d').drawImage(bg, x0 * scale, y0 * scale, cv.width, cv.height, 0, 0, cv.width, cv.height);
    c = { key, cv, x0, y0, x1, y1 };
    this.hazeCache.set(t.id, c);
    return c;
  }

  // Heat haze: strips of the ground above the flame, nudged side to side. Draw right after the
  // background, before anything else, so only the ground ripples.
  drawHaze(ctx, bg, scale, crowd) {
    const A = this.active;
    if (!A.length || crowd > 300 || !this.sprites) return;
    let n = 0;
    for (let i = 0; i < A.length && n < 2; i += 2) {
      const t = A[i], st = A[i + 1];
      if (st.k < 0.4) continue;
      n++;
      const src = this.hazeSource(t, bg, scale);
      const s = t.stats, ring = s.arc >= TAU - 0.01;
      const R = ring ? s.range * 0.95 : s.range * 0.45;
      const cx = ring ? t.x : t.x + Math.cos(t.ang) * s.range * 0.8;
      const cy = (ring ? t.y : t.y + Math.sin(t.ang) * s.range * 0.8) - 8;
      // Each strip spans the ellipse's width at its row (no clipping needed).
      const Ry = R * 0.85, step = 4;
      // Whole-pixel strips and shifts: plain copies, no resampling.
      for (let y = Math.round(Math.max(src.y0, cy - Ry)); y < Math.min(src.y1 - step, cy + Ry); y += step) {
        const dy = (y + step / 2 - cy) / Ry;
        const hw = R * Math.sqrt(Math.max(0, 1 - dy * dy));
        const x0 = Math.round(Math.max(src.x0, cx - hw)), x1 = Math.round(Math.min(src.x1, cx + hw));
        if (x1 - x0 < 2) continue;
        const off = Math.round(Math.sin(this.time * 13 + y * 0.35 + t.id) * 1.6 * st.k);
        if (!off) continue;   // unshifted strips would only redraw what's there
        ctx.drawImage(src.cv, (x0 - src.x0) * scale, (y - src.y0) * scale, (x1 - x0) * scale, step * scale, x0 + off, y, x1 - x0, step);
      }
    }
  }

  // Scorch marks on the ground: freshly scorched ground smoulders for a moment, then darkens.
  drawScorch(ctx) {
    const sc = this.scorch;
    if (!sc.length || !this.sprites) return;
    const spr = this.sprites.scorch, coal = this.sprites.coal;
    for (let i = 0; i < sc.length; i++) {
      const s = sc[i];
      ctx.globalAlpha = Math.min(0.45, (s.life / s.max) * 0.8);
      ctx.drawImage(spr, s.x - s.r, s.y - s.r * 0.8, s.r * 2, s.r * 1.6);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < sc.length; i++) {
      const s = sc[i], age = s.max - s.life;
      if (age > 1.2) continue;
      ctx.globalAlpha = 0.5 * (1 - age / 1.2);
      ctx.drawImage(coal, s.x - s.r * 0.6, s.y - s.r * 0.5, s.r * 1.2, s.r);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  // The light the fire throws on the ground around it (under the enemies).
  drawGlow(ctx) {
    const A = this.active;
    if (!A.length) return;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < A.length; i += 2) {
      const t = A[i], st = A[i + 1], s = t.stats, ring = s.arc >= TAU - 0.01;
      const look = flameLook(t.tiers);
      const flick = 0.85 + Math.sin(this.time * 17 + t.id) * 0.1 + Math.sin(this.time * 41 + t.id * 3) * 0.05;
      const R = (ring ? s.range * 1.25 : s.range * 0.8) * flick;
      const cx = ring ? t.x : t.x + Math.cos(t.ang) * s.range * 0.5;
      const cy = ring ? t.y : t.y + Math.sin(t.ang) * s.range * 0.5;
      ctx.globalAlpha = (ring ? 0.22 : 0.26) * st.k;
      ctx.drawImage(this.sprites.glow[look], cx - R, cy - R, R * 2, R * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  // Smoke under the flames, then the flames: a solid body (so the fire stays saturated over any
  // ground), then an additive pass over the young, hot part of each particle for the glowing core.
  // Particles are stretched along their heading, so the stream reads as a jet of flame tongues.
  // `m` is the renderer's current scale/offset transform: { s, e, f }.
  draw(ctx, m) {
    if (!this.sprites) return;
    const sm = this.smoke;
    for (let i = 0; i < sm.length; i++) {
      const p = sm[i], u = 1 - p.life / p.max;
      const size = p.s0 + (p.s1 - p.s0) * u;
      ctx.globalAlpha = (p.dark ? 0.26 : 0.13) * (1 - u) * Math.min(1, u * 6 + 0.2);
      ctx.drawImage(p.dark ? this.sprites.ash : this.sprites.smoke, p.x - size / 2, p.y - size / 2, size, size);
    }
    const fl = this.flame;
    if (fl.length) {
      const sp = this.sprites.flame, S = m.s;
      const tm = this.time * 30;
      for (let pass = 0; pass < (this.quality === 0 ? 1 : 2); pass++) {   // the glow pass is dropped for huge crowds
        if (pass) ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < fl.length; i++) {
          const p = fl[i];
          const u = 1 - p.life / p.max;
          if (pass && u > p.core) continue;
          const fade = (u < 0.08 ? u / 0.08 : 1) * (0.88 + Math.sin(tm + p.seed) * 0.12);
          let size = p.s0 + (p.s1 - p.s0) * Math.sqrt(u), stage;
          if (pass) {
            stage = Math.min(2, (u * 5) | 0);
            size *= 0.6;
            ctx.globalAlpha = fade * 0.5 * (1 - u / p.core);
          } else {
            stage = Math.min(STAGES - 1, 1 + ((u * STAGES) | 0));
            ctx.globalAlpha = fade * 0.78 * (1 - u * u);
          }
          // Stretch along the heading: long tongues near the nozzle, round billows at the tips.
          const sp2 = p.vx * p.vx + p.vy * p.vy;
          const inv = sp2 > 1 ? 1 / Math.sqrt(sp2) : 0;
          const cx = sp2 > 1 ? p.vx * inv : 1, cy = sp2 > 1 ? p.vy * inv : 0;
          const along = size * (1 + 1.1 * (1 - u)), across = size * (0.75 + 0.25 * u);
          const fall = (1 - u) * (1 - u);
          ctx.setTransform(S * cx * along, S * cy * along, -S * cy * across, S * cx * across, S * p.x + m.e, S * (p.y - p.z * fall) + m.f);
          ctx.drawImage(sp[p.look][stage], -0.5, -0.5, 1, 1);
        }
      }
      ctx.setTransform(S, 0, 0, S, m.e, m.f);
    }
    // A white-hot flare where the flame leaves the nozzle.
    const A = this.active;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < A.length; i += 2) {
      const t = A[i], st = A[i + 1], s = t.stats, ring = s.arc >= TAU - 0.01;
      const look = flameLook(t.tiers);
      const R = (ring ? 9 : 10) * (0.9 + Math.sin(this.time * 37 + t.id) * 0.1) * (1 + (t.tiers[0] + t.tiers[1] + t.tiers[2]) * 0.06);
      ctx.globalAlpha = 0.85 * st.k;
      for (let h = 0; h < (ring ? 3 : 1); h++) {
        const M = wardMuzzle(t, t.ang + (h * TAU) / 3, this.m);
        ctx.drawImage(this.sprites.flame[look][0], M[0] - R, M[1] - R, R * 2, R * 2);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}
