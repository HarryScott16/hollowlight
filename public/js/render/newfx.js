// World effects of the five round-2 wards (sim/newwards.js): Lampwright candles, Undertow whirlpools
// and waves, Lighthouse beams and light-rafts (Ferrylight), Avatar motes, stars, tethers and the
// Sunfall pillar, Choir notes, crescendos and wisps. Both skins share these, except the candles and
// rafts, which each skin draws in its own materials (Kindlings: wax and logs; Lanterns: glass and
// lantern-boats).
//
// Cheap by construction (see CLAUDE.md, Performance): candles are one cached sprite per skin and
// size (four flame frames, glow baked in) and cost one drawImage each, or a batched path of dots
// at quality 0; a whirlpool is one cached sprite drawn rotated; beams are one filled wedge; motes
// and stars are a few strokes per ward; rings and tides come from a short capped list.
import { DMG, glow } from './wards/kit.js';
import { getSkin, wardMuzzle } from './wardArt.js';

const TAU = Math.PI * 2;
const INK = '#1d1030';
const RADIANT = DMG.radiant.core, ARCANE = DMG.arcane.core, FROST = DMG.frost.core, FIRE = DMG.fire.core, KINETIC = DMG.kinetic.core;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

export class NewFx {
  constructor(r) {
    this.r = r;
    this.candleSprites = new Map();   // `${skin}|${size}` -> [4 frames]
    this.whirl = null;
    this.tides = [];    // { x, y, a, len, life, max, great }
    this.hooks = [];    // harpoon lines { x0, y0, x, y, life }
    this.bursts = [];   // flares, crescendos, spouts, pull-unders { x, y, r, life, max, col, kind }
    this.links = [];    // syzygy shots { x, y, tx, ty, life }
    this._m = [0, 0];
  }
  clear() { this.tides.length = this.hooks.length = this.bursts.length = this.links.length = 0; }

  // Simulation events (Renderer.consume hands over the ones it doesn't know). True if handled.
  event(f) {
    const r = this.r, P = r.parts;
    switch (f.type) {
      case 'note': if (r.quality > 0 || f.cres) r.ring(f.x, f.y, 10, f.r, 0.6, ARCANE, f.cres ? 3 : 1.5, null, true); return true;
      case 'crescendo':
        this.burst(f.x, f.y, f.r + 10, 0.45, '#f0e0ff', 'cres');
        if (r.quality > 0) { this.links.push({ x: f.x0, y: f.y0 - 30, tx: f.x, ty: f.y, life: 0.25, max: 0.25, col: ARCANE }); P.burst(f.x, f.y, 10, { color: '#e8d4ff', speed: 140, life: 0.4, size: 2.6 }); }
        return true;
      case 'echo': if (r.quality === 2) r.ring(f.x, f.y, 20, 260, 0.7, '#c8b0ff', 1.5, null, true); return true;
      case 'flare5': this.burst(f.x, f.y, f.r, 0.4, RADIANT, 'flare'); if (r.quality > 0) P.burst(f.x, f.y, 12, { color: '#fff0a0', speed: 160, life: 0.4, size: 2.8 }); return true;
      case 'syzygy': this.links.push({ x: f.x, y: f.y - 20, tx: f.tx, ty: f.ty, life: 0.35, max: 0.35, col: '#fff6c0' }); return true;
      case 'hook': if (this.hooks.length < 30) this.hooks.push({ x0: f.x0, y0: f.y0 - 12, x: f.x, y: f.y, life: 0.3, max: 0.3 }); return true;
      case 'tide': this.tides.push({ x: f.x, y: f.y, route: f.route, at: f.at, len: f.len, life: f.great ? 1.2 : 0.7, max: f.great ? 1.2 : 0.7, great: f.great }); if (this.tides.length > 12) this.tides.shift(); return true;
      case 'spout': this.burst(f.x, f.y, f.r, 0.9, '#bfefff', 'spout'); P.burst(f.x, f.y - 10, 18, { color: '#d8f6ff', speed: 160, life: 0.7, size: 3, grav: 120, ang: -Math.PI / 2, spread: 0.8 }); return true;
      case 'pullunder': if (r.quality > 0) this.burst(f.x, f.y, 12, 0.35, '#1a3048', 'under'); return true;
      case 'dawnpulse': if (r.quality > 0) r.ring(f.x, f.y, 8, f.r, 0.4, '#fff3c0', 2, null, true); return true;
      default: return false;
    }
  }
  burst(x, y, rad, life, col, kind) { if (this.bursts.length < 40) this.bursts.push({ x, y, r: rad, life, max: life, col, kind }); }

  // ---- ground pass (with zones and Snares, before the enemies) ---------------------------------
  drawGround(ctx, dt) {
    const g = this.r.game, T = this.r.time, q = this.r.quality;
    for (const t of g.towers) {
      if (t.type === 'undertow' && t.whirl) this.drawWhirl(ctx, t, T, q);
      if (t.type === 'ferry' && t.stats.dazzle && t.sweep) this.drawBeam(ctx, t, q);
    }
    this.drawTides(ctx, dt);
    if (g.candles.length) this.drawCandles(ctx, g, T, q);
  }

  whirlSprite() {
    if (this.whirl) return this.whirl;
    const N = 128, c = mk(N, N), x = c.getContext('2d');
    x.translate(N / 2, N / 2);
    x.globalAlpha = 0.5; x.fillStyle = '#123a5a'; x.beginPath(); x.arc(0, 0, N / 2 - 2, 0, TAU); x.fill();
    x.globalAlpha = 1; x.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      x.beginPath();
      for (let i = 0; i <= 40; i++) { const u = i / 40, a = k * (TAU / 4) + u * TAU * 0.9, rr = (N / 2 - 4) * (1 - u * 0.8); x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      x.strokeStyle = 'rgba(200,240,255,0.75)'; x.lineWidth = 3; x.stroke();
    }
    x.fillStyle = '#081a2a'; x.beginPath(); x.arc(0, 0, N * 0.12, 0, TAU); x.fill();
    return (this.whirl = c);
  }
  drawWhirl(ctx, t, T, q) {
    const W = t.whirl, R = t.stats.whirlRadius, img = this.whirlSprite();
    ctx.save();
    ctx.translate(W.x, W.y); ctx.scale(1, 0.55); ctx.rotate(-T * (1.2 + R / 60));
    ctx.globalAlpha = 0.7;
    ctx.drawImage(img, -R, -R, R * 2, R * 2);
    ctx.restore();
    if (t.ripT > 0 || t.floodT > 0 || t.mawT > 0) {
      const rr = t.ripT > 0 ? 140 : t.floodT > 0 ? 220 : 80;
      ctx.strokeStyle = t.mawT > 0 ? 'rgba(20,40,70,0.8)' : 'rgba(180,235,255,0.6)'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.lineDashOffset = T * 40;
      ctx.beginPath(); ctx.ellipse(W.x, W.y, rr, rr * 0.55, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  drawBeam(ctx, t, q) {
    const s = t.stats, len = s.range * s.beamLen, half = s.beamArc / 2;
    const m = wardMuzzle(t, t.beamA, this._m), x = m[0], y = m[1];
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = t.lightfallT > 0 ? 'rgba(255,250,210,0.32)' : 'rgba(255,240,190,0.2)';
    ctx.beginPath();
    for (const a of t.beamB !== null ? [t.beamA, t.beamB] : [t.beamA]) {
      ctx.moveTo(x, y);
      ctx.lineTo(t.x + Math.cos(a - half) * len, t.y + Math.sin(a - half) * len);
      ctx.lineTo(t.x + Math.cos(a + half) * len, t.y + Math.sin(a + half) * len);
      ctx.closePath();
    }
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  drawTides(ctx, dt) {
    const g = this.r.game;
    for (const w of this.tides) {
      w.life -= dt;
      if (w.life <= 0) continue;
      const P = g.map.routes[w.route] ? g.map.routes[w.route].path : null;
      if (!P) continue;
      const u = 1 - w.life / w.max, a = Math.min(1, w.life / w.max * 2);
      // a crest running back up the road (toward the Rift)
      const d0 = w.at + w.len / 2 - u * w.len, n = w.great ? 10 : 6;
      ctx.strokeStyle = `rgba(220,248,255,${0.85 * a})`; ctx.lineWidth = w.great ? 6 : 4; ctx.lineCap = 'round';
      ctx.beginPath();
      const p = this._m;
      for (let i = 0; i <= n; i++) { const pt = { x: 0, y: 0 }; P.posAt(Math.max(0, d0 - (i / n) * 30), pt, (i / n - 0.5) * 30); if (i) ctx.lineTo(pt.x, pt.y); else ctx.moveTo(pt.x, pt.y); }
      ctx.stroke();
      void p;
    }
    if (this.tides.length) this.tides = this.tides.filter((w) => w.life > 0);
  }

  // Candles: per skin and size, 4 flame frames with the glow baked in; one drawImage each.
  candleFrames(size) {
    const skin = getSkin(), key = `${skin}|${size}`;
    let fr = this.candleSprites.get(key);
    if (fr) return fr;
    fr = [];
    const H = [16, 22, 30, 54][size], Wd = [10, 14, 20, 30][size], N = 64 + size * 24;
    for (let f = 0; f < 4; f++) {
      const c = mk(N, N), x = c.getContext('2d'), cx = N / 2, base = N * 0.72;
      // glow, baked
      const gr = x.createRadialGradient(cx, base - H, 1, cx, base - H, N * 0.45);
      gr.addColorStop(0, 'rgba(255,170,80,0.55)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
      x.fillStyle = gr; x.fillRect(0, 0, N, N);
      // a little pool of light / wax on the road
      x.fillStyle = skin === 'lantern' ? 'rgba(255,200,120,0.35)' : 'rgba(250,236,200,0.6)';
      x.beginPath(); x.ellipse(cx, base, Wd * 0.9, Wd * 0.35, 0, 0, TAU); x.fill();
      if (skin === 'lantern') { // a little glass votive
        x.fillStyle = '#3a3040'; x.fillRect(cx - Wd / 2, base - 3, Wd, 3);
        x.fillStyle = 'rgba(255,214,140,0.85)'; x.strokeStyle = INK; x.lineWidth = 1.2;
        x.beginPath(); x.rect(cx - Wd / 2 + 1, base - H * 0.8, Wd - 2, H * 0.8 - 3); x.fill(); x.stroke();
        x.fillStyle = '#3a3040'; x.beginPath(); x.moveTo(cx - Wd / 2, base - H * 0.8); x.lineTo(cx, base - H * 0.95); x.lineTo(cx + Wd / 2, base - H * 0.8); x.closePath(); x.fill();
      } else { // a wax stub
        x.fillStyle = '#f6ead0'; x.strokeStyle = INK; x.lineWidth = 1.2;
        x.beginPath(); x.rect(cx - Wd / 2, base - H, Wd, H); x.fill(); x.stroke();
        x.fillStyle = '#e8d6b0'; x.fillRect(cx - Wd / 2 + 1, base - H + 2, 2, H - 4);
      }
      // the flame (4 frames)
      const fl = Math.sin(f * 1.7) * 1.5, fh = Wd * 0.7 + f % 2;
      const fx0 = cx + fl * 0.4, fy0 = base - H - (skin === 'lantern' ? -H * 0.35 : 0);
      x.fillStyle = FIRE; x.beginPath(); x.ellipse(fx0, fy0 - fh * 0.5, Wd * 0.28, fh * 0.6, 0, 0, TAU); x.fill();
      x.fillStyle = '#fff2b0'; x.beginPath(); x.ellipse(fx0, fy0 - fh * 0.4, Wd * 0.13, fh * 0.32, 0, 0, TAU); x.fill();
      fr.push({ c, N, base });
    }
    this.candleSprites.set(key, fr);
    return fr;
  }
  drawCandles(ctx, g, T, q) {
    const C = g.candles;
    if (q === 0) {
      // a huge crowd: small candles are one batched path of dots, big ones keep their sprite
      ctx.fillStyle = FIRE;
      ctx.beginPath();
      for (const c of C) if (c.land <= 0 && c.size === 0) { ctx.moveTo(c.x + 2.5, c.y - 3); ctx.arc(c.x, c.y - 3, 2.5, 0, TAU); }
      ctx.fill();
    }
    for (const c of C) {
      if (q === 0 && c.size === 0 && c.land <= 0) continue;
      const fr = this.candleFrames(c.size), F = fr[q === 0 ? 0 : ((T * 8 + c.ph) | 0) & 3];
      let x = c.x, y = c.y;
      if (c.land > 0) { const u = 1 - c.land / 0.45; x = c.sx + (c.x - c.sx) * u; y = c.sy + (c.y - c.sy) * u - Math.sin(u * Math.PI) * 40; }
      const fade = c.life < 0.5 ? Math.max(0, c.life * 2) : 1;
      if (fade < 1) ctx.globalAlpha = fade;
      const k = c.taper ? 1.4 : 1;
      ctx.drawImage(F.c, x - (F.N / 2) * k, y - F.base * k, F.N * k, F.N * k);
      if (fade < 1) ctx.globalAlpha = 1;
    }
    // Eternal Vigil: the lines of light, one path
    let any = false;
    for (const t of g.towers) if (t.type === 'lamp' && t.links && t.links.length) { any = true; break; }
    if (any) {
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,224,58,${0.45 + Math.sin(T * 6) * 0.1})`; ctx.lineWidth = 2;
      ctx.beginPath();
      for (const t of g.towers) if (t.type === 'lamp' && t.links) for (let k = 0; k < t.links.length; k += 2) { const a = t.links[k], b = t.links[k + 1]; ctx.moveTo(a.x, a.y - 4); ctx.lineTo(b.x, b.y - 4); }
      ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
    }
  }

  // ---- air pass (after the enemies) --------------------------------------------------------------
  drawAir(ctx, dt) {
    const r = this.r, g = r.game, T = r.time, q = r.quality, lite = q < 2;
    for (const t of g.towers) {
      if (t.type === 'avatar') this.drawAvatar(ctx, t, T, q);
      else if (t.type === 'ferry' && t.rafts.length) this.drawRafts(ctx, t, T);
    }
    // Requiem wisps
    if (g.wisps.length) {
      for (const w of g.wisps) {
        const y = w.y - 10 + Math.sin(T * 8 + w.dist) * 2, rad = w.great ? 12 : w.flood ? 9 : 4;
        glow(ctx, w.x, y, rad * 2.6, w.great ? '#fff3c0' : '#e8d8ff', 0.6);
        ctx.fillStyle = w.great ? '#fff6d0' : '#f4ecff'; ctx.beginPath(); ctx.arc(w.x, y, rad * 0.6, 0, TAU); ctx.fill();
      }
    }
    // syzygy shots, crescendo strokes
    for (const L of this.links) {
      L.life -= dt;
      if (L.life <= 0) continue;
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = L.col; ctx.globalAlpha = L.life / L.max; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(L.tx, L.ty); ctx.stroke();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    if (this.links.length) this.links = this.links.filter((L) => L.life > 0);
    // harpoon lines
    for (const h of this.hooks) {
      h.life -= dt;
      if (h.life <= 0) continue;
      ctx.strokeStyle = `rgba(220,226,236,${h.life / h.max})`; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(h.x0, h.y0); ctx.quadraticCurveTo((h.x0 + h.x) / 2, (h.y0 + h.y) / 2 + 12, h.x, h.y); ctx.stroke();
    }
    if (this.hooks.length) this.hooks = this.hooks.filter((h) => h.life > 0);
    // bursts
    for (const b of this.bursts) {
      b.life -= dt;
      if (b.life <= 0) continue;
      const u = 1 - b.life / b.max, a = b.life / b.max;
      if (b.kind === 'spout') {
        ctx.fillStyle = `rgba(200,240,255,${0.5 * a})`;
        ctx.beginPath(); ctx.moveTo(b.x - b.r * 0.5, b.y); ctx.quadraticCurveTo(b.x - b.r * 0.2, b.y - 60 * u - 20, b.x - 6, b.y - 110 * u - 30); ctx.lineTo(b.x + 6, b.y - 110 * u - 30); ctx.quadraticCurveTo(b.x + b.r * 0.2, b.y - 60 * u - 20, b.x + b.r * 0.5, b.y); ctx.closePath(); ctx.fill();
      } else if (b.kind === 'under') {
        ctx.strokeStyle = `rgba(20,48,72,${a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * (1 - u * 0.7), b.r * 0.5 * (1 - u * 0.7), 0, 0, TAU); ctx.stroke();
      } else {
        if (!lite) glow(ctx, b.x, b.y, b.r * (0.6 + u), b.col, 0.7 * a);
        ctx.strokeStyle = b.col; ctx.globalAlpha = a; ctx.lineWidth = b.kind === 'cres' ? 4 : 3;
        ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * (0.4 + u * 0.8), b.r * (0.4 + u * 0.8) * 0.55, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
    if (this.bursts.length) this.bursts = this.bursts.filter((b) => b.life > 0);
  }
  // The Avatar: a ribbon of motes into its target, its stars and their shots, tethers, Sunfall.
  drawAvatar(ctx, t, T, q) {
    const g = this.r.game, s = t.stats;
    const e = t.target;
    if (e && e.alive && g.time - t.moteT < 0.2) {
      const m = wardMuzzle(t, t.ang, this._m), x0 = m[0], y0 = m[1];
      const mx = (x0 + e.x) / 2, my = Math.min(y0, e.y) - 24;
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,224,58,0.35)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, e.x, e.y - 4); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,248,200,0.8)'; ctx.lineWidth = 1.6; ctx.stroke();
      // a few motes riding the ribbon
      const n = q === 2 ? 4 : 2;
      ctx.fillStyle = '#fff8c8';
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const u = ((T * 2.2 + i / n) % 1), a1 = 1 - u;
        const px = a1 * a1 * x0 + 2 * a1 * u * mx + u * u * e.x, py = a1 * a1 * y0 + 2 * a1 * u * my + u * u * (e.y - 4);
        ctx.moveTo(px + 2.4, py); ctx.arc(px, py, 2.4, 0, TAU);
      }
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt';
      if (s.heatAt && t.heat > 0) { // Heat: a ring of marks round the target filling up
        const k = t.heat / s.heatAt;
        ctx.strokeStyle = RADIANT; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r + 8, (e.r + 8) * 0.55, 0, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
      }
    }
    if (t.stars.length) {
      for (const st of t.stars) {
        if (st.x === undefined) continue;
        const live = st.tgt && st.tgt.alive && !(st.diveT > 0);
        if (live && q > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,240,160,0.4)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.lineTo(st.tgt.x, st.tgt.y - 4); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
        if (st.diveT > 0) continue;
        glow(ctx, st.x, st.y, 10, RADIANT, 0.6);
        ctx.fillStyle = '#fff6c0'; ctx.strokeStyle = INK; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? 1.8 : 4.2; ctx.lineTo(st.x + Math.cos(a) * rr, st.y + Math.sin(a) * rr); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    if (t.tethered.length) {
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = t.coronaT > 0 ? 'rgba(255,240,170,0.7)' : 'rgba(255,240,170,0.35)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]); ctx.lineDashOffset = -T * 20;
      ctx.beginPath();
      for (const id of t.tethered) { const w = g.towers.find((o) => o.id === id); if (!w) continue; ctx.moveTo(t.x, t.y - 30); ctx.quadraticCurveTo((t.x + w.x) / 2, Math.min(t.y, w.y) - 40, w.x, w.y - 20); }
      ctx.stroke(); ctx.setLineDash([]); ctx.globalCompositeOperation = 'source-over';
    }
    if (t.pillarT > 0 && t.pillar && t.pillar.alive) {
      const p = t.pillar, a = Math.min(1, t.pillarT);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,224,58,${0.3 * a})`; ctx.fillRect(p.x - 14, p.y - 400, 28, 400);
      ctx.fillStyle = `rgba(255,255,255,${0.5 * a})`; ctx.fillRect(p.x - 4, p.y - 400, 8, 400);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  // Light-rafts: each skin in its own materials (a log raft with a lamp; a little lantern-boat).
  drawRafts(ctx, t, T) {
    const lantern = getSkin() === 'lantern';
    for (const r of t.rafts) {
      const y = r.y + Math.sin(T * 2 + r.x) * 1;
      ctx.strokeStyle = 'rgba(220,240,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(r.x, y + 3, 10, 3, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = lantern ? '#4a3428' : '#8a5a36'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (lantern) { ctx.moveTo(r.x - 9, y); ctx.lineTo(r.x + 9, y); ctx.lineTo(r.x + 6, y + 4); ctx.lineTo(r.x - 6, y + 4); ctx.closePath(); }
      else ctx.rect(r.x - 8, y - 1, 16, 5);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x, y - 10); ctx.stroke();
      glow(ctx, r.x, y - 11, 7, lantern ? '#ffd27a' : KINETIC, 0.6);
      ctx.fillStyle = lantern ? '#ffe2a0' : '#eef2f8'; ctx.beginPath(); ctx.arc(r.x, y - 11, 2, 0, TAU); ctx.fill();
    }
  }
}
