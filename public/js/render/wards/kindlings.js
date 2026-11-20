// Skin B · KINDLINGS (the active skin): every ward is a little spirit of the Heartfire with big
// eyes that watch the target and a flame on its head in the damage colour. Each one is coloured
// and dressed for its job (a hardy green archer, an ember salamander, a frosted ghost, a watchful
// eye on a mast). Same interface as lanterns.js (body / back / front / muzzle), plus
// `breathe: true` for a slow idle squash. The Longeye is the Lantern body with a Kindling eye.
import { DMG, INK, TAU, circle, poly, rrect, star, ink, flat, line, glow, notches, pips, glyph, aim, FORE, shade, crown, groundAura, twinkle, risingMotes, brows } from './kit.js';
import { crossbow, longeyeArt, roof, BRASS } from './lanterns.js';

export const WAX = '#f3e4c6', WAX2 = '#e2cfa8', WOOD = '#7a5236', BRONZE = '#c8963a', STEEL = '#b8c2d2';
const LEATHER = '#8a5a32', GREEN = '#4f8a3c', GREEN2 = '#2f5a28';
const EMBER = '#ff7a3a', EMBER2 = '#ffb070', CHAR = '#3a1a14';
const ICE = '#9fe6ff', ICE2 = '#3fb0dc';

// The stone each Kindling stands on, dressed for the ward: plain, snow-capped or smouldering.
export function hearthstone(ctx, w, P, d, look = 'plain') {
  ctx.beginPath(); ctx.ellipse(0, 11, w / 2, 4.5, 0, 0, TAU); ink(ctx, look === 'coals' ? '#4a3a3a' : '#5a5f78', 1.8, -w / 2, w / 2);
  ctx.beginPath(); ctx.ellipse(0, 9.5, w / 2 - 1.5, 3, 0, 0, TAU); ctx.fillStyle = look === 'coals' ? '#5c4646' : '#727893'; ctx.fill();
  if (look === 'snow') {
    ctx.beginPath(); ctx.ellipse(0, 9.2, w / 2 - 0.5, 3.4, 0, Math.PI, TAU);
    for (let i = 0; i <= 6; i++) { const x = w / 2 - 0.5 - i * ((w - 1) / 6); ctx.lineTo(x, 9.5 + (i % 2 ? 1.6 : 0.6)); }
    ctx.closePath(); flat(ctx, '#f4fdff', 1.2);
  }
  if (look === 'coals') for (let i = 0; i < 7; i++) { circle(ctx, -w / 2 + 3 + i * ((w - 6) / 6), 9.5 + (i % 2) * 1.2, 1.3); ctx.fillStyle = i % 2 ? '#ff9a3a' : '#ff5a2a'; ctx.fill(); }
  notches(ctx, P.mt, 0, 13.2, w - 8, DMG[d].core, 2.6);
  pips(ctx, P.tiers, P.main, w / 2 - 2, 6.5);
}

// Big eyes that look along the aim and blink now and then; brows and iris colour give character.
export function eyes(ctx, x, y, st, { sep = 3.6, r = 2.8, one = false, lid = false, brow = null, iris = INK } = {}) {
  const A = aim(st.ang), blink = ((st.time + (st.id || 0) * 1.7) % 4.3) < 0.11;
  for (const s of one ? [0] : [-1, 1]) {
    const ex = x + s * sep;
    if (blink) { line(ctx, [[ex - r, y], [ex + r, y]], '#3a2a40', 0.8); continue; }
    ctx.beginPath(); ctx.ellipse(ex, y, r, r * 1.15, 0, 0, TAU); flat(ctx, '#ffffff', 1.3);
    const px = ex + A.x * r * 0.42, py = y + A.y * r * 0.5;
    if (iris !== INK) { circle(ctx, px, py, r * 0.66); ctx.fillStyle = iris; ctx.fill(); }
    circle(ctx, px, py, r * (iris !== INK ? 0.36 : 0.55)); ctx.fillStyle = INK; ctx.fill();
    circle(ctx, px - r * 0.2, py - r * 0.25, r * 0.18); ctx.fillStyle = '#fff'; ctx.fill();
    if (lid) { ctx.beginPath(); ctx.ellipse(ex, y - r * 0.5, r * 1.1, r * 0.7, 0, Math.PI, TAU); flat(ctx, INK, 0); }
  }
  if (brow && !one) brows(ctx, x, y, sep, r, brow);
}

// The head flame (the ward's light), flickering.
export function tuft(ctx, x, y, size, d, t = 0, lean = 0) {
  const D = DMG[d], fl = 1 + Math.sin(t * 9) * 0.08 + Math.sin(t * 23) * 0.05;
  const h = 10 * size * fl, w = 5 * size;
  glow(ctx, x, y - h * 0.4, h * 1.3, D.glow ? D.core : '#ffffff', D.glow ? 0.5 : 0.3);
  const sway = lean + Math.sin(t * 5) * 0.6 * size;
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.6, x + sway, y - h);
  ctx.quadraticCurveTo(x + w * 0.2, y - h * 0.55, x + w * 0.55, y - h * 0.7); ctx.quadraticCurveTo(x + w * 1.2, y - h * 0.3, x + w, y); ctx.closePath();
  flat(ctx, D.core, 1.6);
  ctx.beginPath(); ctx.moveTo(x - w * 0.45, y); ctx.quadraticCurveTo(x - w * 0.4, y - h * 0.4, x + sway * 0.4, y - h * 0.6); ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.3, x + w * 0.45, y); ctx.closePath();
  ctx.globalAlpha *= 0.8; ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.globalAlpha /= 0.8;
}

export function badge(ctx, x, y, r, d) { const D = DMG[d]; circle(ctx, x, y, r); flat(ctx, D.core, 1.2); glyph(ctx, D.glyph, x, y, r * 0.95, D.glow ? shade(D.deep, -0.3) : INK); }

// ==== Bolt Ward: a hardy little archer (green tunic, leather, a quiver of bolts) ==================
// MIGHT puts it in steel, MANY brings archer friends and more bolts, CRAFT hoods and cloaks it.
function archerBody(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -6, -14, 12, 15, 5.5); ink(ctx, WAX, 1.8, -6, 6);
  rrect(ctx, -6.4, -5.5, 12.8, 7.5, 3); ink(ctx, GREEN, 1.5, -6, 6);
  rrect(ctx, -6.4, -1, 12.8, 2, 0.8); flat(ctx, LEATHER, 0.9);
  ctx.restore();
}
function archerFace(ctx, x, y, s, st, d) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  eyes(ctx, 0, -9, st, { sep: 2.8, r: 2.3, brow: 'stern' });
  tuft(ctx, 0, -13.5, 0.75, d, st.time + x);
  ctx.restore();
}
function quiver(ctx, x, y, n, heavy) {
  for (let i = 0; i < n; i++) { // bolts sticking out of the top
    const bx = x + 1.2 + (n > 1 ? i * (3.6 / (n - 1)) : 1.8), by = y - 5 - (i % 2) * 1.5;
    line(ctx, [[bx, y + 1], [bx, by]], WOOD, 0.8);
    poly(ctx, [[bx - 1.6, by + 2.6], [bx, by - 0.6], [bx + 1.6, by + 2.6]]); flat(ctx, heavy ? STEEL : '#f0f0f0', 0.8);
  }
  rrect(ctx, x, y, 6, 15, 2); ink(ctx, LEATHER, 1.4, x, x + 6);
  rrect(ctx, x - 0.3, y + 2, 6.6, 1.6, 0.6); flat(ctx, BRONZE, 0.7);
}
const MINIS = (P) => (P.many && P.mt >= 4 ? [[-12, 9], [12, 9]] : P.many && P.mt >= 2 ? [[-12, 9]] : []);
const bolt = {
  breathe: true,
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    hearthstone(ctx, 26, P, d);
    if (craft && mt >= 3) { // a long hunter's cloak behind
      ctx.beginPath(); ctx.moveTo(-7, -9); ctx.quadraticCurveTo(-13, 0, -11, 10); ctx.lineTo(11, 10); ctx.quadraticCurveTo(13, 0, 7, -9); ctx.closePath();
      ink(ctx, mt >= 4 ? '#25401f' : GREEN2, 1.6, -12, 12);
    }
    quiver(ctx, -12.5, -15, many && mt >= 3 ? 5 : mt >= 2 ? 4 : 3, might && mt >= 2);
    if (many && mt >= 3) quiver(ctx, 7, -14, 4, false);
    for (const [x, y] of MINIS(P)) archerBody(ctx, x, y, 0.66);
    rrect(ctx, -7.5, -14, 15, 23, 6.5); ink(ctx, WAX, 2, -7.5, 7.5);
    // tunic, belt and buckle
    ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-2.5, -4); ctx.lineTo(0, -1); ctx.lineTo(2.5, -4); ctx.lineTo(8, -4); ctx.lineTo(8.4, 9); ctx.quadraticCurveTo(0, 11, -8.4, 9); ctx.closePath();
    ink(ctx, GREEN, 1.8, -8, 8);
    rrect(ctx, -8.2, 3, 16.4, 2.6, 1); flat(ctx, LEATHER, 1);
    rrect(ctx, -1.6, 2.7, 3.2, 3.2, 0.6); flat(ctx, BRONZE, 0.9);
    if (might && mt >= 2) { ctx.beginPath(); ctx.ellipse(6.5, -4, 4.2, 3.2, 0.3, 0, TAU); ink(ctx, STEEL, 1.4, 3, 10); }
    if (might && mt >= 3) {
      ctx.beginPath(); ctx.ellipse(-6.5, -4, 4.2, 3.2, -0.3, 0, TAU); ink(ctx, STEEL, 1.4, -10, -3);
      rrect(ctx, -5.5, -3.5, 11, 6.5, 2.5); ink(ctx, STEEL, 1.4, -5.5, 5.5); glyph(ctx, 'arrow', 0, -0.3, 2.6, '#5a6478');
    }
    if (craft && mt >= 2) { // hunter's hood
      ctx.beginPath(); ctx.moveTo(-8.5, -2); ctx.quadraticCurveTo(-9.5, -16, 0, -17); ctx.quadraticCurveTo(9.5, -16, 8.5, -2); ctx.lineTo(5, -4); ctx.quadraticCurveTo(0, -12, -5, -4); ctx.closePath();
      ink(ctx, mt >= 4 ? '#25401f' : GREEN2, 1.6, -9, 9);
    } else { // headband with a silver feather
      rrect(ctx, -7.7, -11.5, 15.4, 2.4, 1); flat(ctx, might && mt >= 4 ? STEEL : LEATHER, 1);
      ctx.beginPath(); ctx.moveTo(5.5, -10.5); ctx.quadraticCurveTo(11, -13, 12.5, -19); ctx.quadraticCurveTo(8, -16, 5.5, -10.5); flat(ctx, '#e9eef6', 1.1);
      line(ctx, [[6.5, -11], [11.5, -17.5]], '#9aa4b8', 0.4);
    }
    const top = -27 - (might && mt >= 4 ? 3 : 0);
    if (mt >= 4) crown(ctx, 0, top - 2, d);
    return top - 9;
  },
  back(ctx, P, st, d) { if (P.mt >= 4) groundAura(ctx, d, st.time, 20); },
  front(ctx, P, st, d) {
    const { might, craft, mt } = P;
    for (const [x, y] of MINIS(P)) { archerFace(ctx, x, y, 0.66, st, d); crossbow(ctx, x + 2, y - 3, st.ang, 0.62, false, st.recoil); }
    eyes(ctx, 0, -6, st, { lid: craft && mt >= 2, brow: craft && mt >= 2 ? null : 'stern' });
    tuft(ctx, 0, -14, might && mt >= 4 ? 1.25 : 1, d, st.time);
    const s = might ? (mt >= 4 ? 1.6 : mt >= 2 ? 1.3 : 1) : 1;
    crossbow(ctx, 4, 2, st.ang, s, might && mt >= 3, st.recoil);
    // a glint runs along the bolt now and then
    const g = (st.time * 0.7 + (st.id || 0) * 0.3) % 2.2;
    if (g < 0.25) twinkle(ctx, 4 + Math.cos(st.ang) * 11 * s, 2 + Math.sin(st.ang) * 11 * s * FORE, 2.4, 1 - g * 4);
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

// ==== Rime Spire: a frosted ghost of ice, icicles hanging from its skirt =========================
const RIME_SPARKS = [[-7, -12], [6, -9], [-3, 1], [8, 2], [-9, -3], [2, -15]];
const rime = {
  breathe: true,
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    hearthstone(ctx, 28, P, d, 'snow');
    const w = might && mt >= 3 ? 15 : 13;
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -6, w + 9, 5, 0, Math.PI, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 3; ctx.stroke(); }
    if (many && mt >= 2) {
      const n = mt >= 4 ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42, L = w + (mt >= 4 ? 10 : 7);
        poly(ctx, [[Math.cos(a - 0.2) * w * 0.8, -4 + Math.sin(a - 0.2) * w * 0.8], [Math.cos(a) * L, -4 + Math.sin(a) * L], [Math.cos(a + 0.2) * w * 0.8, -4 + Math.sin(a + 0.2) * w * 0.8]]);
        const g = ctx.createLinearGradient(0, -4 - L, 0, -4); g.addColorStop(0, '#ffffff'); g.addColorStop(1, ICE);
        ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke();
      }
    }
    // the dome, with a wavy skirt
    ctx.beginPath(); ctx.moveTo(-w, 6); ctx.bezierCurveTo(-w, -22, w, -22, w, 6);
    for (let i = 0; i < 4; i++) { const x0 = w - (i + 1) * (w * 2 / 4); ctx.quadraticCurveTo(x0 + w / 4, 10, x0, 6); }
    ctx.closePath();
    const g = ctx.createLinearGradient(-w, -18, w * 0.6, 10); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#c6f6ff'); g.addColorStop(0.75, ICE); g.addColorStop(1, ICE2);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
    // a shine, and a frosted cap
    ctx.beginPath(); ctx.ellipse(-w * 0.45, -10, 2.2, 4.5, 0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-w * 0.62, -12); ctx.quadraticCurveTo(0, -21, w * 0.62, -12);
    for (let i = 0; i <= 5; i++) ctx.lineTo(w * 0.62 - i * (w * 1.24 / 5), -12 + (i % 2 ? 2.4 : 0.6));
    ctx.closePath(); flat(ctx, '#f4fdff', 1.2);
    // icicles hanging from the skirt (longer with Deep Freeze)
    const L = might ? 4 + mt * 1.2 : 4;
    for (let i = 0; i < 5; i++) {
      const x = -w + 2 + i * ((w * 2 - 4) / 4), l = L * (i % 2 ? 0.7 : 1);
      poly(ctx, [[x - 1.6, 7.5], [x + 1.6, 7.5], [x, 7.5 + l]]); flat(ctx, '#e8fbff', 1);
    }
    ctx.beginPath(); ctx.ellipse(-6.5, -1.5, 2.2, 1.3, 0, 0, TAU); ctx.ellipse(6.5, -1.5, 2.2, 1.3, 0, 0, TAU); ctx.fillStyle = 'rgba(120,200,255,0.55)'; ctx.fill();
    if (might && mt >= 2) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + Math.PI / 6; ctx.lineTo(Math.cos(a) * (w + 4), -4 + Math.sin(a) * (w + 2)); } ctx.closePath(); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 2.5; ctx.stroke(); }
    glyph(ctx, 'flake', 0, 4, 3.5, DMG[d].deep);
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -6, w + 9, 5, 0, 0, Math.PI); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 3; ctx.stroke(); }
    const top = -29 - (many && mt >= 4 ? 4 : 0);
    if (mt >= 4) crown(ctx, 0, top + 1, d);
    return top - 7;
  },
  back(ctx, P, st, d) {
    if (P.mt >= 4) groundAura(ctx, d, st.time, 24);
    // cold mist rolling off the base
    const ga = ctx.globalAlpha;
    for (let i = 0; i < 3; i++) {
      const u = (st.time * 0.4 + i / 3) % 1, s = i % 2 ? 1 : -1;
      ctx.globalAlpha = ga * 0.35 * (1 - u); ctx.fillStyle = '#e8fbff';
      ctx.beginPath(); ctx.ellipse(s * (6 + u * 14), 11 + u * 2, 4 + u * 5, 1.6 + u * 1.4, 0, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = ga;
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, w = might && mt >= 3 ? 15 : 13, p = st.pulse || 0;
    glow(ctx, 0, -4, w + 7 + p * 16 + Math.sin(st.time * 3) * 1.5, DMG[d].core, 0.3 + p * 0.55);
    eyes(ctx, 0, -4, st, { sep: 4.2, r: 3, brow: 'soft', iris: '#2a7fb0' });
    tuft(ctx, 0, -17, 0.9 + (mt >= 4 ? 0.15 : 0), d, st.time);
    for (let i = 0; i < RIME_SPARKS.length; i++) { const [x, y] = RIME_SPARKS[i]; twinkle(ctx, x * w / 13, y, 1.8, Math.sin(st.time * 3 + i * 1.9) * 1.4 - 0.4); }
    if (many && mt >= 2) twinkle(ctx, 0, -4 - w - (mt >= 4 ? 10 : 7), 2.6, Math.sin(st.time * 2.2) * 1.2);
    if (craft && mt >= 4) for (let i = 0; i < 6; i++) { const a = st.time * 1.4 + (i / 6) * TAU; star(ctx, Math.cos(a) * (w + 9), -6 + Math.sin(a) * 5, 3, 1.2, 6, a); flat(ctx, '#ffffff', 0.8); }
    if (might && mt >= 4) for (let i = 0; i < 4; i++) { const a = -st.time * 1.1 + (i / 4) * TAU, x = Math.cos(a) * (w + 7), y = -4 + Math.sin(a) * (w + 7) * 0.4;
      poly(ctx, [[x, y - 4], [x + 2, y], [x, y + 4], [x - 2, y]]); flat(ctx, '#e8fbff', 1); }
    if (p > 0.3) risingMotes(ctx, st.time, 6, -w, w, 4, 14, '#e8fbff', 1.6, 0.9, st.id || 0);
  },
  muzzle(P, ang, out) { out[0] = 0; out[1] = -6; return out; },
};

// ==== Longeye: the Lantern mast and gun, with a sharp Kindling eye for a head =====================
const longeye = longeyeArt(
  (ctx, P, d, top) => { // a brass-rimmed socket holding the eye, a roof and two sharp fins
    for (const s of [-1, 1]) { poly(ctx, [[s * 5, top - 11], [s * 12, top - 17], [s * 8.5, top - 8]]); ink(ctx, BRASS, 1.3, -12, 12); }
    circle(ctx, 0, top - 5, 8.5); ink(ctx, BRASS, 2, -8.5, 8.5);
    circle(ctx, 0, top - 5, 6.9); flat(ctx, '#ffffff', 1.4);
    roof(ctx, 0, top - 12, 15, 4.5, '#2f5560');
    if (P.craft && P.mt >= 2) { circle(ctx, 0, top - 5, 8.2); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = '#ffe6a0'; ctx.lineWidth = 1.6; ctx.stroke(); line(ctx, [[6.5, top - 1], [9.5, top + 6]], BRASS, 0.8); }
  },
  (ctx, P, st, d, top) => { // a steel-blue iris that tracks the target under a narrowed lid
    const A = aim(st.ang), y = top - 5, blink = ((st.time + (st.id || 0) * 1.7) % 4.3) < 0.11;
    if (blink) { circle(ctx, 0, y, 6.9); flat(ctx, '#3f6f7a', 1.4); line(ctx, [[-6, y + 0.5], [6, y + 0.5]], INK, 0.8); return; }
    const r = 3.6, px = A.x * 2.6, py = y + 0.5 + A.y * 2.2;
    circle(ctx, px, py, r); ctx.fillStyle = '#4f8fc8'; ctx.fill();
    circle(ctx, px, py, r * 0.5); ctx.fillStyle = INK; ctx.fill();
    circle(ctx, px - 1.1, py - 1.2, 0.9); ctx.fillStyle = '#fff'; ctx.fill();
    // the narrowed upper lid: a flat, slanted edge gives the watchful look
    ctx.save(); circle(ctx, 0, y, 6.9); ctx.clip();
    ctx.beginPath(); ctx.moveTo(-7.2, y - 7.5); ctx.lineTo(7.2, y - 7.5); ctx.lineTo(7.2, y - 2.6); ctx.lineTo(-7.2, y - 1.2); ctx.closePath(); flat(ctx, '#3f6f7a', 0);
    ctx.restore();
    line(ctx, [[-6.6, y - 1.4], [6.6, y - 2.6]], '#3f6f7a', 1.2);
  },
);

// ==== Ember Censer: an ember salamander, orange-red wax, charred and smouldering =================
function heads(P, ang) {
  if (P.many && P.mt >= 4) return [ang, ang + TAU / 3, ang + (2 * TAU) / 3];
  if (P.many && P.mt >= 2) return [ang - 0.35, ang + 0.35];
  return [ang];
}
const NECK = [1, -9];
function head(ctx, a, s, st, d, main, ash) {
  const A = aim(a), flip = Math.cos(A.a) < 0;
  ctx.save(); ctx.translate(NECK[0], NECK[1]); ctx.rotate(A.a); if (flip) ctx.scale(1, -1); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-2, -3.5); ctx.lineTo(6, -3); ctx.lineTo(6, 3); ctx.lineTo(-2, 3.5); ctx.closePath(); flat(ctx, '#d8542a', 1.6);
  poly(ctx, [[4, -4.5], [1, -9.5], [7.5, -5]]); flat(ctx, CHAR, 1.1);                    // a charred horn
  ctx.beginPath(); ctx.ellipse(9, 0, 7.5, 5.6, 0, 0, TAU); flat(ctx, ash ? '#c2502a' : EMBER, 1.8);
  ctx.beginPath(); ctx.ellipse(9.5, 2.2, 5.5, 2.6, 0, 0, Math.PI); ctx.fillStyle = EMBER2; ctx.fill();
  ctx.beginPath(); ctx.moveTo(12, 1); ctx.lineTo(16.5, -0.5); ctx.lineTo(16.5, 3.5); ctx.closePath(); flat(ctx, '#4a0c0a', 1.2);
  const ex = 8, ey = -2.4, blink = main && ((st.time + (st.id || 0) * 1.7) % 4.3) < 0.11;
  if (blink) line(ctx, [[ex - 2.4, ey], [ex + 2.4, ey]], '#3a2a40', 0.8);
  else {
    ctx.beginPath(); ctx.ellipse(ex, ey, 2.6, 2.9, 0, 0, TAU); flat(ctx, '#ffe27a', 1.1);
    ctx.beginPath(); ctx.ellipse(ex + 0.9, ey + 0.3, 0.7, 1.9, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();   // a slit pupil
    line(ctx, [[ex - 2.8, ey - 3.6], [ex + 2.6, ey - 2.4]], '#4a1410', 0.9);                               // a hot-tempered brow
  }
  ctx.restore();
}
const censer = {
  breathe: true,
  body(ctx, P, d) {
    const { might, craft, mt } = P, ash = craft && mt >= 2;
    hearthstone(ctx, 26, P, d, 'coals');
    // tail, ending in a charred, glowing tip
    ctx.beginPath(); ctx.moveTo(-6, 6); ctx.quadraticCurveTo(-16, 6, -17, -2); ctx.quadraticCurveTo(-13, 2, -8, 1); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#d8542a'; ctx.lineWidth = 3; ctx.stroke();
    circle(ctx, -17, -2.5, 2.4); flat(ctx, CHAR, 1.1);
    const R = might && mt >= 3 ? 11 : 9.5;
    if (might && mt >= 3) for (let i = 0; i < 4; i++) { const a = Math.PI * (1.05 + i * 0.17); poly(ctx, [[-1 + Math.cos(a - 0.12) * R, -1 + Math.sin(a - 0.12) * R], [-1 + Math.cos(a) * (R + 5), -1 + Math.sin(a) * (R + 5)], [-1 + Math.cos(a + 0.12) * R, -1 + Math.sin(a + 0.12) * R]]); flat(ctx, CHAR, 1.1); }
    ctx.beginPath(); ctx.ellipse(-1, -1, R, R * 0.95, 0, 0, TAU);
    const g = ctx.createLinearGradient(-R, -R, R, R); g.addColorStop(0, ash ? '#e07a4a' : '#ffa060'); g.addColorStop(0.5, ash ? '#b8482a' : EMBER); g.addColorStop(1, ash ? '#6a2414' : '#b83a1a');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(1, 3, R * 0.55, R * 0.45, 0, 0, TAU); ctx.fillStyle = EMBER2; ctx.fill();       // belly
    // charred patches with glowing cracks (more of them on the Ash path)
    const patches = ash ? [[-5, -6, 4.2], [3, -7.5, 3.4], [-7.5, 0.5, 3]] : [[-5, -6, 3.6], [3, -7.5, 2.6]];
    for (const [x, y, r] of patches) {
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0.3, 0, TAU); flat(ctx, CHAR, 0);
      line(ctx, [[x - r * 0.6, y], [x, y - r * 0.2], [x + r * 0.5, y + r * 0.3]], '#ffb347', 0.6);
    }
    for (const x of [-6, 3]) { ctx.beginPath(); ctx.ellipse(x, 8, 2.8, 1.7, 0, 0, TAU); flat(ctx, '#d8542a', 1.1); }
    badge(ctx, -2, 3, 3.2, d);
    if (craft && mt >= 4) { ctx.strokeStyle = '#2a1018'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(-3.5, -1); ctx.lineTo(-10.5, -1); ctx.closePath(); ctx.stroke(); }
    const top = -27 - (might && mt >= 4 ? 4 : 0);
    if (mt >= 4) crown(ctx, -2, -10 - R * 0.95 + 1, d);
    return top - 8;
  },
  back(ctx, P, st, d) {
    if (P.mt >= 4) groundAura(ctx, d, st.time, 22);
    const hs = heads(P, st.ang), ash = P.craft && P.mt >= 2;
    for (let i = 0; i < hs.length; i++) if (Math.sin(hs[i]) < -0.2) head(ctx, hs[i], i ? 0.82 : 1, st, d, i === 0, ash);
  },
  front(ctx, P, st, d) {
    const { might, craft, mt } = P, f = st.fire || 0, R = might && mt >= 3 ? 11 : 9.5, ash = craft && mt >= 2;
    // the cracks breathe with heat, brighter while it pours fire
    glow(ctx, -2, -3, R * 1.4, '#ff6a2a', 0.18 + f * 0.25 + Math.sin(st.time * 4) * 0.06);
    glow(ctx, -17, -2.5, 5 + Math.sin(st.time * 9) * 1, '#ff8a3a', 0.8);                  // the tail tip smoulders
    if (might && mt >= 2) { // flames along its back
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
    for (let i = 0; i < hs.length; i++) if (Math.sin(hs[i]) >= -0.2) head(ctx, hs[i], i ? 0.82 : 1, st, d, i === 0, ash);
    if (f > 0.05) for (const a of hs) { const m = this.muzzle(P, a, TMP); glow(ctx, m[0], m[1], 6 + f * 6, '#ffb070', 0.6 * f); }
    tuft(ctx, 1, -9 - R * 0.95 + 2, 0.85 + (mt >= 4 ? 0.2 : 0), d, st.time, 2);
    risingMotes(ctx, st.time, mt >= 4 ? 7 : 4, -10, 8, -6, 22, '#ffb347', 1.5, 1.3, st.id || 0);   // embers
    if (ash) for (let i = 0; i < (mt >= 4 ? 4 : 2); i++) {
      const u = (st.time * 0.5 + i / (mt >= 4 ? 4 : 2)) % 1;
      circle(ctx, -7 - i * 1.5 - u * 3, -10 - u * 16, 2.5 + u * 3); ctx.fillStyle = `rgba(50,40,52,${0.75 * (1 - u)})`; ctx.fill();
    }
    if (craft && mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,80,40,${0.55 + Math.sin(st.time * 5) * 0.3})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(-3.5, -1); ctx.lineTo(-10.5, -1); ctx.closePath(); ctx.stroke(); ctx.restore(); }
  },
  muzzle(P, ang, out) { const A = aim(ang); out[0] = NECK[0] + Math.cos(A.a) * 16; out[1] = NECK[1] + Math.sin(A.a) * 16; return out; },
  spouts: heads,
};
const TMP = [0, 0];

export const KINDLINGS = { bolt, rime, longeye, censer };
