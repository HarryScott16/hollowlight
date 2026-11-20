// Skin B · KINDLINGS (the active skin): every ward is a little spirit of the Heartfire, a wax-pale
// body with big eyes that watch the target and a flame on its head in the damage colour. Body
// shape + held tool = role. Same interface as lanterns.js (body / back / front / muzzle).
// The Longeye is the exception: the Lantern body with a Kindling eye in its head.
import { DMG, INK, TAU, circle, poly, rrect, star, ink, flat, line, glow, notches, pips, glyph, aim, FORE, shade, crown, groundAura } from './kit.js';
import { crossbow, longeyeArt, roof, IRON2 } from './lanterns.js';

export const WAX = '#f3e4c6', WAX2 = '#e2cfa8', WOOD = '#7a5236', BRONZE = '#8f6b47';

export function hearthstone(ctx, w, P, d) {
  ctx.beginPath(); ctx.ellipse(0, 11, w / 2, 4.5, 0, 0, TAU); ink(ctx, '#5a5f78', 1.8, -w / 2, w / 2);
  ctx.beginPath(); ctx.ellipse(0, 9.5, w / 2 - 1.5, 3, 0, 0, TAU); ctx.fillStyle = '#727893'; ctx.fill();
  notches(ctx, P.mt, 0, 13.2, w - 8, DMG[d].core, 2.6);
  pips(ctx, P.tiers, P.main, w / 2 - 2, 7);
}

// Big eyes that look along the aim; they blink now and then.
export function eyes(ctx, x, y, st, { sep = 3.6, r = 2.8, one = false, lid = false } = {}) {
  const A = aim(st.ang), blink = ((st.time + (st.id || 0) * 1.7) % 4.3) < 0.11;
  for (const s of one ? [0] : [-1, 1]) {
    const ex = x + s * sep;
    if (blink) { line(ctx, [[ex - r, y], [ex + r, y]], '#3a2a40', 0.8); continue; }
    ctx.beginPath(); ctx.ellipse(ex, y, r, r * 1.15, 0, 0, TAU); flat(ctx, '#ffffff', 1.3);
    circle(ctx, ex + A.x * r * 0.42, y + A.y * r * 0.5, r * 0.55); ctx.fillStyle = INK; ctx.fill();
    circle(ctx, ex + A.x * r * 0.42 - r * 0.2, y + A.y * r * 0.5 - r * 0.25, r * 0.18); ctx.fillStyle = '#fff'; ctx.fill();
    if (lid) { ctx.beginPath(); ctx.ellipse(ex, y - r * 0.5, r * 1.1, r * 0.7, 0, Math.PI, TAU); flat(ctx, INK, 0); }
  }
}

// The head flame (the ward's light), flickering.
export function tuft(ctx, x, y, size, d, t = 0, lean = 0) {
  const D = DMG[d], fl = 1 + Math.sin(t * 9) * 0.07 + Math.sin(t * 23) * 0.04;
  const h = 10 * size * fl, w = 5 * size;
  if (D.glow) glow(ctx, x, y - h * 0.4, h * 1.3, D.core, 0.5);
  const sway = lean + Math.sin(t * 5) * 0.6 * size;
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.6, x + sway, y - h);
  ctx.quadraticCurveTo(x + w * 0.2, y - h * 0.55, x + w * 0.55, y - h * 0.7); ctx.quadraticCurveTo(x + w * 1.2, y - h * 0.3, x + w, y); ctx.closePath();
  flat(ctx, D.core, 1.6);
  ctx.beginPath(); ctx.moveTo(x - w * 0.45, y); ctx.quadraticCurveTo(x - w * 0.4, y - h * 0.4, x + sway * 0.4, y - h * 0.6); ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.3, x + w * 0.45, y); ctx.closePath();
  ctx.globalAlpha *= 0.8; ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.globalAlpha /= 0.8;
}

export function badge(ctx, x, y, r, d) { const D = DMG[d]; circle(ctx, x, y, r); flat(ctx, D.core, 1.2); glyph(ctx, D.glyph, x, y, r * 0.95, D.glow ? shade(D.deep, -0.3) : INK); }

// A small helper kindling (the MANY path): body in the cached sprite, face and tool live.
function miniBody(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); rrect(ctx, -6, -14, 12, 15, 5.5); ink(ctx, WAX, 1.8, -6, 6); ctx.restore(); }
function miniFace(ctx, x, y, s, st, d) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  eyes(ctx, 0, -8, st, { sep: 2.8, r: 2.3 });
  tuft(ctx, 0, -13.5, 0.75, d, st.time + x);
  ctx.restore();
}

// ==== Bolt Ward: a candle-stub kindling with a crossbow ==========================================
const MINIS = (P) => (P.many && P.mt >= 4 ? [[-11, 9], [11, 9]] : P.many && P.mt >= 2 ? [[-11, 9]] : []);
const bolt = {
  body(ctx, P, d) {
    const { might, craft, mt } = P;
    hearthstone(ctx, 24, P, d);
    for (const [x, y] of MINIS(P)) miniBody(ctx, x, y, 0.66);
    rrect(ctx, -7.5, -14, 15, 23, 6.5); ink(ctx, WAX, 2, -7.5, 7.5);
    ctx.beginPath(); ctx.moveTo(-7, -6); ctx.quadraticCurveTo(-8.5, -1, -6.5, 1); ctx.strokeStyle = WAX2; ctx.lineWidth = 1.6; ctx.stroke();
    if (craft && mt >= 2) {
      ctx.beginPath(); ctx.moveTo(-8.5, -2); ctx.quadraticCurveTo(-9.5, -16, 0, -17); ctx.quadraticCurveTo(9.5, -16, 8.5, -2); ctx.lineTo(5, -4); ctx.quadraticCurveTo(0, -12, -5, -4); ctx.closePath();
      ink(ctx, mt >= 4 ? '#3c4a2c' : '#55663a', 1.6, -9, 9);
    }
    if (might && mt >= 2) { rrect(ctx, -8, -12.5, 16, 3.2, 1.2); flat(ctx, BRONZE, 1.2); }
    if (might && mt >= 3) { rrect(ctx, -8, 3, 16, 3, 1.2); flat(ctx, BRONZE, 1.2); }
    const top = -27 - (might && mt >= 4 ? 3 : 0);
    if (mt >= 4) crown(ctx, 0, top - 2, d);
    return top - 9;
  },
  back(ctx, P, st, d) { if (P.mt >= 4) groundAura(ctx, d, st.time, 20); },
  front(ctx, P, st, d) {
    const { might, craft, mt } = P;
    for (const [x, y] of MINIS(P)) { miniFace(ctx, x, y, 0.66, st, d); crossbow(ctx, x, y - 3, st.ang, 0.6, false, st.recoil); }
    eyes(ctx, 0, -6, st, { lid: craft && mt >= 2 });
    tuft(ctx, 0, -14, might && mt >= 4 ? 1.25 : 1, d, st.time);
    crossbow(ctx, 4, 2, st.ang, might ? (mt >= 4 ? 1.6 : mt >= 2 ? 1.3 : 1) : 1, might && mt >= 3, st.recoil);
    if (craft && mt >= 4) {
      const x = -14, y = -22 + Math.sin(st.time * 2.4) * 1.2;
      glow(ctx, x, y, 11, '#ffffff', 0.5);
      ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(st.time * 1.6), 1);
      poly(ctx, [[0, -4.5], [3.6, 0], [0, 4.5], [-3.6, 0]]); flat(ctx, '#ffffff', 1.3); ctx.restore();
      circle(ctx, x, y, 6.5); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke();
    }
  },
  muzzle(P, ang, out) {
    const s = P.might ? (P.mt >= 4 ? 1.6 : P.mt >= 2 ? 1.3 : 1) : 1;
    out[0] = 4 + Math.cos(ang) * 12 * s; out[1] = 2 + Math.sin(ang) * 12 * s * FORE; return out;
  },
};

// ==== Rime Spire: a dome-shaped, jelly-skirted frost kindling ===================================
const rime = {
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    hearthstone(ctx, 28, P, d);
    const w = might && mt >= 3 ? 15 : 13;
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -6, w + 9, 5, 0, Math.PI, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 3; ctx.stroke(); }
    if (many && mt >= 2) {
      const n = mt >= 4 ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42, L = w + (mt >= 4 ? 9 : 7);
        poly(ctx, [[Math.cos(a - 0.2) * w * 0.8, -4 + Math.sin(a - 0.2) * w * 0.8], [Math.cos(a) * L, -4 + Math.sin(a) * L], [Math.cos(a + 0.2) * w * 0.8, -4 + Math.sin(a + 0.2) * w * 0.8]]);
        flat(ctx, '#d8f8ff', 1.4);
      }
    }
    ctx.beginPath(); ctx.moveTo(-w, 6); ctx.bezierCurveTo(-w, -22, w, -22, w, 6);
    for (let i = 0; i < 4; i++) { const x0 = w - (i + 1) * (w * 2 / 4); ctx.quadraticCurveTo(x0 + w / 4, 10, x0, 6); }
    ctx.closePath();
    const g = ctx.createLinearGradient(-w, -16, w, 8); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#c6f6ff'); g.addColorStop(1, DMG[d].core);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
    if (might && mt >= 2) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + Math.PI / 6; ctx.lineTo(Math.cos(a) * (w + 4), -4 + Math.sin(a) * (w + 2)); } ctx.closePath(); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 2.5; ctx.stroke(); }
    glyph(ctx, 'flake', 0, 3.5, 3.5, DMG[d].deep);
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -6, w + 9, 5, 0, 0, Math.PI); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 3; ctx.stroke(); }
    const top = -29 - (many && mt >= 4 ? 4 : 0);
    if (mt >= 4) crown(ctx, 0, top + 1, d);
    return top - 7;
  },
  back(ctx, P, st, d) { if (P.mt >= 4) groundAura(ctx, d, st.time, 24); },
  front(ctx, P, st, d) {
    const { might, craft, mt } = P, w = might && mt >= 3 ? 15 : 13, p = st.pulse || 0;
    glow(ctx, 0, -4, w + 6 + p * 14 + Math.sin(st.time * 3) * 1.5, DMG[d].core, 0.3 + p * 0.5);
    eyes(ctx, 0, -4, st, { sep: 4.2, r: 3 });
    tuft(ctx, 0, -17, 0.9, d, st.time);
    if (craft && mt >= 4) for (let i = 0; i < 6; i++) { const a = st.time * 1.4 + (i / 6) * TAU; star(ctx, Math.cos(a) * (w + 9), -6 + Math.sin(a) * 5, 3, 1.2, 6, a); flat(ctx, '#ffffff', 0.8); }
    if (might && mt >= 4) for (let i = 0; i < 4; i++) { const a = -st.time * 1.1 + (i / 4) * TAU, x = Math.cos(a) * (w + 7), y = -4 + Math.sin(a) * (w + 7) * 0.4;
      poly(ctx, [[x, y - 4], [x + 2, y], [x, y + 4], [x - 2, y]]); flat(ctx, '#e8fbff', 1); }
  },
  muzzle(P, ang, out) { out[0] = 0; out[1] = -6; return out; },
};

// ==== Longeye: the Lantern mast and gun, with a Kindling eye for a head ==========================
const longeye = longeyeArt(
  (ctx, P, d, top) => { // the head: a round socket holding the eye
    circle(ctx, 0, top - 5, 8.5); ink(ctx, IRON2, 2, -8.5, 8.5);
    ctx.beginPath(); ctx.ellipse(0, top - 5, 6.4, 5.8, 0, 0, TAU); flat(ctx, '#ffffff', 1.4);
    roof(ctx, 0, top - 12, 14, 4.5);
    if (P.craft && P.mt >= 2) { circle(ctx, 0, top - 5, 7.4); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = BRONZE; ctx.lineWidth = 1.8; ctx.stroke(); line(ctx, [[6, top - 1], [9, top + 5]], BRONZE, 0.8); }
  },
  (ctx, P, st, d, top) => { // the pupil follows the target; a wax lid blinks
    const A = aim(st.ang), y = top - 5, blink = ((st.time + (st.id || 0) * 1.7) % 4.3) < 0.11;
    if (blink) { ctx.beginPath(); ctx.ellipse(0, y, 6.4, 5.8, 0, 0, TAU); flat(ctx, WAX, 1.4); line(ctx, [[-5.5, y], [5.5, y]], '#3a2a40', 0.8); return; }
    const r = 3.3, px = A.x * 2.6, py = y + A.y * 2.4;
    circle(ctx, px, py, r); flat(ctx, DMG[d].deep, 0);
    circle(ctx, px, py, r * 0.62); ctx.fillStyle = INK; ctx.fill();
    circle(ctx, px - 1, py - 1.1, 0.9); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, y - 3.2, 6.8, 3.2, 0, Math.PI, TAU); flat(ctx, WAX, 1.2);
  },
);

// ==== Ember Censer: a salamander kindling breathing fire ========================================
// Dragon's Breath (path 2, T4) grows three heads that breathe all round as the ward spins.
function heads(P, ang) {
  if (P.many && P.mt >= 4) return [ang, ang + TAU / 3, ang + (2 * TAU) / 3];
  if (P.many && P.mt >= 2) return [ang - 0.35, ang + 0.35];
  return [ang];
}
const NECK = [1, -9];
function head(ctx, a, s, st, d, main) {
  const A = aim(a), flip = Math.cos(A.a) < 0;
  ctx.save(); ctx.translate(NECK[0], NECK[1]); ctx.rotate(A.a); if (flip) ctx.scale(1, -1); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-2, -3.5); ctx.lineTo(6, -3); ctx.lineTo(6, 3); ctx.lineTo(-2, 3.5); ctx.closePath(); flat(ctx, WAX2, 1.6);
  ctx.beginPath(); ctx.ellipse(9, 0, 7.5, 5.6, 0, 0, TAU); flat(ctx, WAX, 1.8);
  ctx.beginPath(); ctx.moveTo(12, 1); ctx.lineTo(16.5, -0.5); ctx.lineTo(16.5, 3.5); ctx.closePath(); flat(ctx, '#7a1f1a', 1.2);
  // one big eye on the top of the head (top stays up when the head points left)
  const ex = 8, ey = -2.6, blink = main && ((st.time + (st.id || 0) * 1.7) % 4.3) < 0.11;
  if (blink) line(ctx, [[ex - 2.4, ey], [ex + 2.4, ey]], '#3a2a40', 0.8);
  else { ctx.beginPath(); ctx.ellipse(ex, ey, 2.6, 2.9, 0, 0, TAU); flat(ctx, '#ffffff', 1.1); circle(ctx, ex + 1, ey + 0.3, 1.45); ctx.fillStyle = INK; ctx.fill(); }
  ctx.restore();
}
const censer = {
  body(ctx, P, d) {
    const { might, craft, mt } = P;
    hearthstone(ctx, 26, P, d);
    ctx.beginPath(); ctx.moveTo(-6, 6); ctx.quadraticCurveTo(-16, 6, -17, -2); ctx.quadraticCurveTo(-13, 2, -8, 1); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = WAX2; ctx.lineWidth = 2.5; ctx.stroke();
    const R = might && mt >= 3 ? 11 : 9.5;
    ctx.beginPath(); ctx.ellipse(-1, -1, R, R * 0.95, 0, 0, TAU); ink(ctx, WAX, 2, -R, R);
    for (const x of [-6, 3]) { ctx.beginPath(); ctx.ellipse(x, 8, 2.6, 1.6, 0, 0, TAU); flat(ctx, WAX2, 1.1); }
    badge(ctx, -2, 3, 3.2, d);
    if (craft && mt >= 4) { ctx.strokeStyle = '#2a1018'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(-3.5, -1); ctx.lineTo(-10.5, -1); ctx.closePath(); ctx.stroke(); }
    const top = -27 - (might && mt >= 4 ? 4 : 0);
    if (mt >= 4) crown(ctx, -2, -10 - R * 0.95 + 1, d);
    return top - 8;
  },
  back(ctx, P, st, d) {
    if (P.mt >= 4) groundAura(ctx, d, st.time, 22);
    const hs = heads(P, st.ang);
    for (let i = 0; i < hs.length; i++) if (Math.sin(hs[i]) < -0.2) head(ctx, hs[i], i ? 0.82 : 1, st, d, i === 0);
  },
  front(ctx, P, st, d) {
    const { might, craft, mt } = P, f = st.fire || 0, R = might && mt >= 3 ? 11 : 9.5;
    if (might && mt >= 2) { // flames dancing along its back
      const n = mt >= 4 ? 5 : 3;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const x = -6 + i * 3, hh = (mt >= 4 ? 13 : 8) * (0.7 + 0.3 * Math.sin(st.time * 11 + i * 1.9));
        ctx.fillStyle = i % 2 ? 'rgba(255,170,50,0.85)' : mt >= 4 ? 'rgba(255,245,210,0.85)' : 'rgba(255,80,50,0.85)';
        ctx.beginPath(); ctx.ellipse(x, -R + 2 - hh * 0.4, 2.6, hh * 0.6, -0.3, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    const hs = heads(P, st.ang);
    for (let i = 0; i < hs.length; i++) if (Math.sin(hs[i]) >= -0.2) head(ctx, hs[i], i ? 0.82 : 1, st, d, i === 0);
    if (f > 0.05) for (const a of hs) { const m = this.muzzle(P, a, TMP); glow(ctx, m[0], m[1], 6 + f * 6, '#ffb070', 0.6 * f); }
    tuft(ctx, 1, -9 - R * 0.95 + 2, 0.85, d, st.time, 2);
    if (craft && mt >= 2) for (let i = 0; i < (mt >= 4 ? 4 : 2); i++) {
      const u = (st.time * 0.5 + i / (mt >= 4 ? 4 : 2)) % 1;
      circle(ctx, -7 - i * 1.5 - u * 3, -10 - u * 16, 2.5 + u * 3); ctx.fillStyle = `rgba(50,40,52,${0.75 * (1 - u)})`; ctx.fill();
    }
  },
  muzzle(P, ang, out) { const A = aim(ang); out[0] = NECK[0] + Math.cos(A.a) * 16; out[1] = NECK[1] + Math.sin(A.a) * 16; return out; },
  spouts: heads,
};
const TMP = [0, 0];

export const KINDLINGS = { bolt, rime, longeye, censer };
