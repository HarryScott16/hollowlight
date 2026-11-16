// Draws the game each frame and turns simulation events (game.fx) into visual effects.
import { MAP } from '../data/map.js';
import { TOWERS } from '../data/towers.js';
import { DAMAGE_TYPES } from '../data/damage.js';
import { Particles } from './particles.js';
import { paintBackground } from './background.js';
import { drawTower } from './towerArt.js';
import { drawEnemy, ENEMY_COLORS } from './enemyArt.js';

const TAU = Math.PI * 2;
const W = MAP.width, H = MAP.height;

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.ctx = canvas.getContext('2d');
    this.bg = document.createElement('canvas');
    this.scale = 0;
    this.time = 0;
    this.parts = new Particles();
    this.arcs = [];
    this.rings = [];
    this.texts = [];
    this.shake = 0;
    this.banner = null;   // { text, sub, t }
    this.resize();
  }

  clearFx() {
    this.parts.clear();
    this.arcs.length = this.rings.length = this.texts.length = 0;
    this.shake = 0;
    this.banner = null;
    this.game.fx.length = 0;
  }

  // Matches the backing store to the on-screen size (capped) and repaints the static map.
  resize() {
    const parent = this.canvas.parentElement;
    const fit = Math.max(0.25, Math.min((parent.clientWidth - 16) / W, (parent.clientHeight - 16) / H) || 1);
    // Sized from script (not CSS) so the backing-store size can never feed back into layout.
    this.canvas.style.width = `${Math.floor(W * fit)}px`;
    this.canvas.style.height = `${Math.floor(H * fit)}px`;
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.max(0.6, Math.min(2, fit * dpr));
    if (Math.abs(scale - this.scale) < 0.02) return;
    this.scale = scale;
    this.canvas.width = Math.round(W * scale);
    this.canvas.height = Math.round(H * scale);
    this.bg.width = this.canvas.width;
    this.bg.height = this.canvas.height;
    const b = this.bg.getContext('2d');
    b.setTransform(scale, 0, 0, scale, 0, 0);
    paintBackground(b, this.game.map);
  }

  text(x, y, str, color, size = 12, life = 0.9) {
    if (this.texts.length > 90) this.texts.shift();
    this.texts.push({ x, y, str, color, size, life, max: life });
  }

  // ---- simulation events -> effects -----------------------------------------------------------
  consume() {
    const fx = this.game.fx;
    const P = this.parts;
    for (let i = 0; i < fx.length; i++) {
      const f = fx[i];
      switch (f.type) {
        case 'hit':
          P.burst(f.x, f.y, f.resisted ? 2 : 3, { color: f.resisted ? '#8f9aa6' : (DAMAGE_TYPES[f.dtype] || DAMAGE_TYPES.kinetic).color, speed: 90, life: 0.25, size: 2.2 });
          break;
        case 'death': {
          const color = ENEMY_COLORS[f.etype] || '#fff';
          P.burst(f.x, f.y, Math.min(40, 5 + f.r), { color, speed: 70 + f.r * 5, life: 0.55, size: 2 + f.r * 0.12 });
          P.burst(f.x, f.y, 4, { color: '#fff', speed: 60, life: 0.3, size: 2 });
          this.rings.push({ x: f.x, y: f.y, r0: f.r * 0.5, r1: f.r * 2, life: 0.25, max: 0.25, color: color, width: 2 });
          this.text(f.x, f.y - f.r - 4, `+${f.gold}`, '#ffd95a', f.boss ? 20 : 12, f.boss ? 1.6 : 0.8);
          if (f.boss) {
            this.shake = Math.max(this.shake, 12);
            P.burst(f.x, f.y, 90, { color: '#ffb36b', speed: 320, life: 1.1, size: 4 });
            for (let k = 0; k < 3; k++) this.rings.push({ x: f.x, y: f.y, r0: 10, r1: 90 + k * 50, life: 0.5 + k * 0.2, max: 0.5 + k * 0.2, color: '#ffd9a0', width: 4 });
          }
          break;
        }
        case 'explosion':
          this.rings.push({ x: f.x, y: f.y, r0: f.r * 0.3, r1: f.r, life: 0.3, max: 0.3, color: '#ffc27a', width: 3, fill: 'rgba(255,170,80,0.5)' });
          P.burst(f.x, f.y, f.sub ? 6 : 14, { color: '#ffae52', speed: f.r * 3.2, life: 0.45, size: 3.2 });
          P.burst(f.x, f.y, f.sub ? 3 : 7, { color: '#6b6460', speed: f.r * 1.4, life: 0.8, size: 4.5, grav: -30 });
          if (!f.sub) this.shake = Math.max(this.shake, f.r > 95 ? 7 : f.r > 70 ? 4 : 1.6);
          break;
        case 'arc':
          this.arcs.push({ pts: f.pts, life: f.smite ? 0.28 : 0.14, max: f.smite ? 0.28 : 0.14, smite: f.smite });
          for (let k = 2; k < f.pts.length; k += 2) P.burst(f.pts[k], f.pts[k + 1], 2, { color: '#cfeaff', speed: 110, life: 0.22, size: 2 });
          if (f.smite) this.shake = Math.max(this.shake, 3);
          break;
        case 'pulse':
          this.rings.push({ x: f.x, y: f.y, r0: 12, r1: f.r, life: 0.45, max: 0.45, color: f.freeze ? '#ffffff' : '#9fe6ff', width: f.freeze ? 4 : 2, fill: f.freeze ? 'rgba(200,245,255,0.16)' : 'rgba(130,215,255,0.07)' });
          P.burst(f.x, f.y, f.freeze ? 16 : 6, { color: '#dff8ff', speed: f.r * 2.3, life: 0.45, size: 2.2, drag: 3 });
          break;
        case 'shatter':
          this.rings.push({ x: f.x, y: f.y, r0: 4, r1: f.r, life: 0.25, max: 0.25, color: '#e6fbff', width: 2.5, fill: 'rgba(190,240,255,0.3)' });
          P.burst(f.x, f.y, 10, { color: '#bfefff', speed: 190, life: 0.4, size: 3 });
          break;
        case 'fire':
          if (f.kind === 'mortar') P.burst(f.x + Math.cos(f.ang) * 16, f.y + Math.sin(f.ang) * 16, 6, { color: '#b9b2ab', speed: 60, life: 0.5, size: 4, ang: f.ang, spread: 1 });
          break;
        case 'place':
          this.rings.push({ x: f.x, y: f.y, r0: 6, r1: 34, life: 0.3, max: 0.3, color: '#e9fbff', width: 2 });
          P.burst(f.x, f.y, 12, { color: '#9fb6c9', speed: 90, life: 0.4, size: 3 });
          break;
        case 'upgrade':
          this.rings.push({ x: f.x, y: f.y, r0: 8, r1: 40, life: 0.4, max: 0.4, color: '#fff3b0', width: 3 });
          P.burst(f.x, f.y, 18, { color: '#fff3b0', speed: 120, life: 0.6, size: 2.6, grav: -60 });
          break;
        case 'sell':
          this.text(f.x, f.y - 20, `+${f.amount}`, '#ffd95a', 14, 1);
          P.burst(f.x, f.y, 14, { color: '#8fa6ad', speed: 110, life: 0.5, size: 3 });
          break;
        case 'bonus':
          this.text(W / 2, 92, `${f.label}  +${f.amount}`, '#ffd95a', 18, 2);
          break;
        case 'leak':
          this.shake = Math.max(this.shake, f.boss ? 12 : 3);
          this.text(MAP.goal.x, MAP.goal.y - 50, `-${f.amount}`, '#ff6b5a', 16, 1);
          P.burst(MAP.goal.x, MAP.goal.y, 12, { color: '#ff6b5a', speed: 150, life: 0.5, size: 3 });
          break;
        case 'wave':
          this.banner = { text: `Wave ${f.n}`, t: 2 };
          break;
        default:
      }
    }
    fx.length = 0;
  }

  // ---- frame ----------------------------------------------------------------------------------
  // dt is effect time (0 while paused). ui: { placing, selected, mouse: { x, y, inside } }
  draw(dt, ui) {
    this.consume();
    this.time += dt;
    this.parts.update(dt);
    this.shake *= Math.exp(-dt * 9);
    if (this.shake < 0.15) this.shake = 0;

    const { ctx, game } = this;
    const s = this.scale;
    const sx = this.shake ? (Math.random() - 0.5) * 2 * this.shake : 0;
    const sy = this.shake ? (Math.random() - 0.5) * 2 * this.shake : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.shake) { ctx.fillStyle = '#0b1c22'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }
    ctx.drawImage(this.bg, Math.round(sx * s), Math.round(sy * s));
    ctx.setTransform(s, 0, 0, s, sx * s, sy * s);

    this.drawLandmarks(ctx);
    this.drawZones(ctx, dt);

    const sel = ui.selected;
    if (sel) this.rangeCircle(ctx, sel.x, sel.y, sel.stats.range, true, sel.stats.minRange);

    const es = game.enemies;
    for (let i = 0; i < es.length; i++) drawEnemy(ctx, es[i]);

    const st = this._st || (this._st = { ang: 0, recoil: 0, time: 0, pulse: 0 });
    for (const t of game.towers) {
      ctx.save();
      ctx.translate(t.x, t.y);
      st.ang = t.ang; st.recoil = t.recoil; st.time = this.time + t.id; st.pulse = t.pulseAnim;
      drawTower(ctx, t.type, t.tiers, st);
      ctx.restore();
    }
    if (sel) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = -this.time * 14;
      ctx.beginPath(); ctx.arc(sel.x, sel.y, 23, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }

    this.drawProjectiles(ctx);
    this.drawRings(ctx, dt);
    this.drawArcs(ctx, dt);
    this.parts.draw(ctx);
    this.drawTexts(ctx, dt);
    this.drawPlacement(ctx, ui);

    ctx.setTransform(s, 0, 0, s, 0, 0);
    this.drawBossBar(ctx);
    this.drawBanner(ctx, dt);
  }

  drawLandmarks(ctx) {
    const t = this.time;
    // the Rift, where the Gloom pours in
    const rift = MAP.rift;
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.5 + i / 4) % 1;
      ctx.strokeStyle = `rgba(190,120,255,${0.5 * (1 - p)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(rift.x, rift.y, 10 + p * 22, 22 + p * 26, 0, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = '#12061d';
    ctx.beginPath(); ctx.ellipse(rift.x, rift.y, 11, 25, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c58bff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // the Heartfire
    const g = MAP.goal;
    const life = Math.max(0.15, this.game.lives / 100);
    const flick = Math.sin(t * 11) * 0.08 + Math.sin(t * 17.3) * 0.05;
    ctx.fillStyle = `rgba(255,160,70,${0.10 + life * 0.08})`;
    ctx.beginPath(); ctx.arc(g.x, g.y, 46 + flick * 40, 0, TAU); ctx.fill();
    const h = (16 + life * 22) * (1 + flick);
    for (const [w, hh, c] of [[13, h, '#ff7a2a'], [9, h * 0.75, '#ffb347'], [5, h * 0.48, '#fff1b0']]) {
      const sway = Math.sin(t * 7 + w) * 3;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(g.x - w, g.y + 4);
      ctx.quadraticCurveTo(g.x - w, g.y - hh * 0.5, g.x + sway, g.y - hh);
      ctx.quadraticCurveTo(g.x + w, g.y - hh * 0.5, g.x + w, g.y + 4);
      ctx.quadraticCurveTo(g.x, g.y + 12, g.x - w, g.y + 4);
      ctx.fill();
    }
    if (Math.random() < 0.25) this.parts.burst(g.x + (Math.random() - 0.5) * 12, g.y - h * 0.6, 1, { color: '#ffc46b', speed: 40, life: 0.8, size: 2, grav: -70, ang: -Math.PI / 2, spread: 1 });
  }

  drawZones(ctx, dt) {
    for (const z of this.game.zones) {
      const a = Math.min(1, z.t * 2);
      const flick = 0.85 + Math.sin(this.time * 14 + z.x) * 0.15;
      ctx.fillStyle = `rgba(255,110,30,${0.16 * a * flick})`;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,190,80,${0.2 * a * flick})`;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r * 0.6, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(255,150,60,${0.5 * a})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.stroke();
      if (dt > 0 && Math.random() < 0.5) {
        const an = Math.random() * TAU, d = Math.random() * z.r;
        this.parts.burst(z.x + Math.cos(an) * d, z.y + Math.sin(an) * d, 1, { color: '#ffb04a', speed: 30, life: 0.6, size: 2.6, grav: -90, ang: -Math.PI / 2, spread: 0.8 });
      }
    }
  }

  rangeCircle(ctx, x, y, r, ok, minRange) {
    ctx.fillStyle = ok ? 'rgba(150,225,255,0.07)' : 'rgba(255,90,80,0.10)';
    ctx.strokeStyle = ok ? 'rgba(170,235,255,0.55)' : 'rgba(255,110,100,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    if (minRange) {
      ctx.strokeStyle = 'rgba(255,200,120,0.4)';
      ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.arc(x, y, minRange, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawProjectiles(ctx) {
    const ps = this.game.projectiles;
    ctx.lineCap = 'round';
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      if (p.kind === 'bolt') {
        const heavy = p.s.pierce >= 5;
        const k = (heavy ? 0.035 : 0.025);
        ctx.strokeStyle = heavy ? '#fff3c4' : '#ffe9a8';
        ctx.lineWidth = heavy ? 3.2 : 2;
        ctx.beginPath(); ctx.moveTo(p.x - p.vx * k, p.y - p.vy * k); ctx.lineTo(p.x, p.y); ctx.stroke();
      } else {
        const u = Math.min(1, p.t / p.flight);
        const lift = Math.sin(u * Math.PI) * (p.sub ? 22 : 64);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 5, 3, 0, 0, TAU); ctx.fill();
        const r = (p.sub ? 3 : 4.5) + lift * 0.035;
        ctx.fillStyle = '#2b2623';
        ctx.beginPath(); ctx.arc(p.x, p.y - lift, r, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ff9a3c';
        ctx.beginPath(); ctx.arc(p.x, p.y - lift, r * 0.5, 0, TAU); ctx.fill();
        // landing marker
        if (!p.sub) {
          ctx.strokeStyle = `rgba(255,170,90,${0.15 + u * 0.4})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(p.tx, p.ty, 4 + (1 - u) * 10, 0, TAU); ctx.stroke();
        }
      }
    }
    ctx.lineCap = 'butt';
  }

  drawRings(ctx, dt) {
    const rings = this.rings;
    let w = 0;
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      r.life -= dt;
      if (r.life <= 0) continue;
      rings[w++] = r;
      const u = 1 - r.life / r.max;
      const rad = r.r0 + (r.r1 - r.r0) * (1 - (1 - u) * (1 - u));
      ctx.globalAlpha = 1 - u;
      if (r.fill) { ctx.fillStyle = r.fill; ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width;
      ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, TAU); ctx.stroke();
    }
    rings.length = w;
    ctx.globalAlpha = 1;
  }

  drawArcs(ctx, dt) {
    const arcs = this.arcs;
    let w = 0;
    ctx.lineJoin = 'round';
    for (let i = 0; i < arcs.length; i++) {
      const a = arcs[i];
      a.life -= dt;
      if (a.life <= 0) continue;
      arcs[w++] = a;
      const pts = a.pts;
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let k = 2; k < pts.length; k += 2) {
        const x0 = pts[k - 2], y0 = pts[k - 1], x1 = pts[k], y1 = pts[k + 1];
        const len = Math.hypot(x1 - x0, y1 - y0) || 1;
        const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
        const segs = Math.max(2, Math.min(6, Math.round(len / 22)));
        for (let j = 1; j < segs; j++) {
          const t = j / segs, off = (Math.random() - 0.5) * (a.smite ? 22 : 13);
          ctx.lineTo(x0 + (x1 - x0) * t + nx * off, y0 + (y1 - y0) * t + ny * off);
        }
        ctx.lineTo(x1, y1);
      }
      ctx.globalAlpha = Math.min(1, (a.life / a.max) * 1.6);
      ctx.strokeStyle = a.smite ? 'rgba(255,225,130,0.7)' : 'rgba(120,190,255,0.6)';
      ctx.lineWidth = a.smite ? 8 : 5;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = a.smite ? 3 : 1.6;
      ctx.stroke();
    }
    arcs.length = w;
    ctx.globalAlpha = 1;
    ctx.lineJoin = 'miter';
  }

  drawTexts(ctx, dt) {
    const texts = this.texts;
    let w = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      t.life -= dt;
      if (t.life <= 0) continue;
      texts[w++] = t;
      const u = 1 - t.life / t.max;
      ctx.globalAlpha = Math.min(1, t.life * 3);
      ctx.font = `bold ${t.size}px system-ui, sans-serif`;
      const y = t.y - u * 22;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(t.str, t.x + 1, y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, y);
    }
    texts.length = w;
    ctx.globalAlpha = 1;
  }

  drawPlacement(ctx, ui) {
    if (!ui.placing || !ui.mouse.inside) return;
    const def = TOWERS[ui.placing];
    const { x, y } = ui.mouse;
    const ok = this.game.canPlace(ui.placing, x, y) && this.game.gold >= def.cost;
    this.rangeCircle(ctx, x, y, def.base.range, ok, def.base.minRange);
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = ok ? 0.85 : 0.45;
    drawTower(ctx, ui.placing, [0, 0, 0], { ang: -Math.PI / 2, recoil: 0, time: this.time, pulse: 0 });
    ctx.restore();
    ctx.globalAlpha = 1;
    if (!ok) {
      ctx.strokeStyle = '#ff6b5a';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9); ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9); ctx.stroke();
    }
  }

  drawBossBar(ctx) {
    let boss = null;
    for (const e of this.game.enemies) if (e.def.boss && (!boss || e.dist > boss.dist)) boss = e;
    if (!boss) return;
    const w = 420, x = (W - w) / 2, y = 22;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - 3, y - 3, w + 6, 20);
    ctx.fillStyle = '#3a0f18';
    ctx.fillRect(x, y, w, 14);
    ctx.fillStyle = '#e0445a';
    ctx.fillRect(x, y, w * Math.max(0, boss.hp / boss.maxHp), 14);
    ctx.strokeStyle = '#ff9a8a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, 14);
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${boss.def.name}  ${Math.ceil(boss.hp)} / ${Math.ceil(boss.maxHp)}`, W / 2, y + 7.5);
  }

  drawBanner(ctx, dt) {
    const b = this.banner;
    if (!b) return;
    b.t -= dt;
    if (b.t <= 0) { this.banner = null; return; }
    const a = Math.min(1, b.t * 2, (2 - b.t) * 5);
    ctx.globalAlpha = a;
    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(b.text, W / 2 + 2, 152);
    ctx.fillStyle = '#ffe9c4';
    ctx.fillText(b.text, W / 2, 150);
    ctx.globalAlpha = 1;
  }
}
