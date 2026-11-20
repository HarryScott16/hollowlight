// Skin A · LANTERNS: every ward is a lantern holding a captured light. The housing's silhouette is
// the role, the light in its window is the damage type (colour + glyph). See kit.js for units.
//
// Every ward has:
//   body(ctx, P, d)        the static ward, drawn once into a cached sprite; returns its top (y)
//   back(ctx, P, st, d)    live parts behind the body (optional)
//   front(ctx, P, st, d)   live parts in front: whatever aims, recoils, flickers or spins
//   muzzle(P, ang, out)    where shots leave, in ward units (out = [x, y])
// P = mainPath(tiers) + { tiers }. st = { ang, recoil, time, pulse, fire (0-1), id }.
import { DMG, INK, TAU, circle, poly, rrect, star, ink, flat, line, glow, notches, pips, glyph, aim, aimPlane, FORE, shade, crown, groundAura } from './kit.js';

export const IRON = '#3a4160', IRON2 = '#4d5677', BRONZE = '#8f6b47', WOOD = '#7a5236', STEEL = '#b8c2d2';

export function plinth(ctx, w, P, d) {
  poly(ctx, [[-w / 2, 14], [w / 2, 14], [w / 2 - 3, 7], [-w / 2 + 3, 7]]); ink(ctx, IRON, 2, -w / 2, w / 2);
  notches(ctx, P.mt, 0, 10.5, w - 6, DMG[d].core, 3.2);
  pips(ctx, P.tiers, P.main, w / 2 - 6, 4.5);
}
// The lantern's window: a pane of light in the damage colour, with its glyph.
export function pane(ctx, x, y, w, h, d) {
  const D = DMG[d];
  rrect(ctx, x - w / 2, y - h / 2, w, h, 2.5);
  const g = ctx.createRadialGradient(x - w * 0.15, y - h * 0.15, 0, x, y, Math.max(w, h) * 0.7);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, D.core); g.addColorStop(1, D.glow ? shade(D.core, -0.15) : D.deep);
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
  glyph(ctx, D.glyph, x, y, Math.min(w, h) * 0.42, D.glow ? shade(D.deep, -0.3) : INK);
}
export function roof(ctx, x, y, w, h, fill = IRON) { poly(ctx, [[x - w / 2, y], [x + w / 2, y], [x, y - h]]); ink(ctx, fill, 2, x - w / 2, x + w / 2); }

// A small crossbow in the squashed aim plane.
export function crossbow(ctx, x, y, ang, size = 1, heavy = false, recoil = 0) {
  const back = recoil * 2.5;
  ctx.save(); ctx.translate(x, y); aimPlane(ctx, ang); ctx.scale(size, size);
  rrect(ctx, -7 - back, -1.8, 15, 3.6, 1.2); flat(ctx, heavy ? BRONZE : WOOD, 1.4);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(3 - back, -8); ctx.quadraticCurveTo(9 - back, 0, 3 - back, 8);
  ctx.strokeStyle = INK; ctx.lineWidth = heavy ? 4.5 : 3.6; ctx.stroke();
  ctx.strokeStyle = heavy ? '#e0b070' : '#c9925a'; ctx.lineWidth = heavy ? 2.6 : 2; ctx.stroke();
  ctx.lineCap = 'butt';
  if (recoil < 0.5) { poly(ctx, [[12 - back, 0], [8 - back, -2.4], [8 - back, 2.4]]); flat(ctx, STEEL, 1); }
  ctx.restore();
}

// ==== Bolt Ward (Shooter): a square carriage lantern with a crossbow on its roof ================
const bolt = {
  body(ctx, P, d) {
    const { might, craft, mt } = P;
    plinth(ctx, 22, P, d);
    rrect(ctx, -9, -15, 18, 22, 2); ink(ctx, IRON, 2, -9, 9);
    pane(ctx, 0, -4, 12, 15, d);
    if (might && mt >= 2) for (const y of [-12, 4]) { rrect(ctx, -10, y - 1.5, 20, 3, 1); flat(ctx, BRONZE, 1.2); }
    if (might && mt >= 3) for (const x of [-11, 11]) { poly(ctx, [[x, 7], [x * 1.25, 7], [x, -8]]); ink(ctx, IRON2, 1.4, -13, 13); }
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -4, 6, 3.6, 0, 0, TAU); flat(ctx, '#ffffff', 1.4); circle(ctx, 1, -4, 2.2); flat(ctx, INK, 0); }
    roof(ctx, 0, -15, 22, 7);
    if (P.mt >= 4) crown(ctx, 0, -21, d);   // on the roof's peak, behind the crossbow
    return P.mt >= 4 && P.might ? -38 : -34;
  },
  back(ctx, P, st, d) { if (P.mt >= 4) groundAura(ctx, d, st.time, 20); },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P;
    if (might) crossbow(ctx, 0, -24, st.ang, mt >= 4 ? 1.7 : mt >= 2 ? 1.25 : 1, mt >= 3, st.recoil);
    else if (many && mt >= 3) {
      const spin = st.time * (mt >= 4 ? 18 : 10);
      ctx.save(); ctx.translate(0, -25); aimPlane(ctx, st.ang);
      for (let i = 0; i < 4; i++) { const off = Math.sin(spin + (i / 4) * TAU) * 5; rrect(ctx, -6 - st.recoil * 2, off - 1.4, 18, 2.8, 1); flat(ctx, STEEL, 1); }
      rrect(ctx, -8, -7, 9, 14, 2.5); flat(ctx, BRONZE, 1.6); ctx.restore();
    } else if (many && mt >= 2) { crossbow(ctx, -5, -23, st.ang, 0.9, false, st.recoil); crossbow(ctx, 5, -23, st.ang, 0.9, false, st.recoil); }
    else crossbow(ctx, 0, -23, st.ang, 1, false, st.recoil);
    if (many && mt >= 4) { crossbow(ctx, -12, -18, st.ang, 0.75, false, st.recoil); crossbow(ctx, 12, -18, st.ang, 0.75, false, st.recoil); }
    if (might && mt >= 4) glow(ctx, Math.cos(st.ang) * 18, -24 + Math.sin(st.ang) * 18 * FORE, 9 + Math.sin(st.time * 8) * 1.5, '#ffffff', 0.55);
    if (craft && mt >= 4) { // the hunter's mark floats over the lantern, turning
      const x = -15, y = -27 + Math.sin(st.time * 2.4) * 1.2;
      glow(ctx, x, y, 11, '#ffffff', 0.5);
      ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(st.time * 1.6), 1);
      poly(ctx, [[0, -5], [4, 0], [0, 5], [-4, 0]]); flat(ctx, '#ffffff', 1.4); ctx.restore();
      circle(ctx, x, y, 7); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
    }
  },
  muzzle(P, ang, out) {
    const s = P.might ? (P.mt >= 4 ? 1.7 : P.mt >= 2 ? 1.25 : 1) : 1;
    out[0] = Math.cos(ang) * 12 * s; out[1] = (P.might ? -24 : P.many && P.mt >= 3 ? -25 : -23) + Math.sin(ang) * 12 * s * FORE;
    return out;
  },
};

// ==== Rime Spire (Pulser): a globe lantern of frost on a short stand ==========================
const rime = {
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    plinth(ctx, 22, P, d);
    rrect(ctx, -3, -2, 6, 10, 1.5); ink(ctx, IRON, 1.6, -3, 3);
    const r = might && mt >= 3 ? 14 : 12, cy = -14;
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, cy, r + 9, 5, 0, Math.PI, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 3; ctx.stroke(); }
    if (many && mt >= 2) {
      const n = mt >= 4 ? 8 : 5;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * (Math.PI * 1.3 / n), L = r + (mt >= 4 ? 9 : 7);
        poly(ctx, [[Math.cos(a - 0.17) * r * 0.8, cy + Math.sin(a - 0.17) * r * 0.8], [Math.cos(a) * L, cy + Math.sin(a) * L], [Math.cos(a + 0.17) * r * 0.8, cy + Math.sin(a + 0.17) * r * 0.8]]);
        flat(ctx, '#d8f8ff', 1.4);
      }
    }
    circle(ctx, 0, cy, r);
    const g = ctx.createRadialGradient(-4, cy - 4, 1, 0, cy, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#a8f2ff'); g.addColorStop(1, DMG[d].core);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = IRON; ctx.lineWidth = 1.6;
    for (const k of [-0.55, 0, 0.55]) { ctx.beginPath(); ctx.ellipse(0, cy, Math.abs(k) * r || 0.1, r, 0, 0, TAU); ctx.stroke(); }
    if (might && mt >= 2) {
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.lineTo(Math.cos(a) * (r + 3), cy + Math.sin(a) * (r + 3)); } ctx.closePath();
      ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 2.5; ctx.stroke();
    }
    glyph(ctx, 'flake', 0, cy, 6.5, DMG[d].deep);
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, cy, r + 9, 5, 0, 0, Math.PI); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 3; ctx.stroke(); }
    roof(ctx, 0, cy - r + 1, 8, 4);
    const top = cy - r - (many && mt >= 4 ? 8 : 4);
    if (mt >= 4) crown(ctx, 0, top + 1, d);
    return top - 7;
  },
  back(ctx, P, st, d) { if (P.mt >= 4) groundAura(ctx, d, st.time, 24); },
  front(ctx, P, st, d) {
    const { might, craft, mt } = P, r = might && mt >= 3 ? 14 : 12, cy = -14, p = st.pulse || 0;
    glow(ctx, 0, cy, r + 6 + p * 14 + Math.sin(st.time * 3) * 1.5, DMG[d].core, 0.35 + p * 0.5);
    if (craft && mt >= 4) for (let i = 0; i < 6; i++) { // snowflakes riding the snow ring
      const a = st.time * 1.4 + (i / 6) * TAU, x = Math.cos(a) * (r + 9), y = cy + Math.sin(a) * 5;
      star(ctx, x, y, 3, 1.2, 6, a); flat(ctx, '#ffffff', 0.8);
    }
    if (might && mt >= 4) { // a frost crown of shards circling the globe
      for (let i = 0; i < 4; i++) { const a = -st.time * 1.1 + (i / 4) * TAU, x = Math.cos(a) * (r + 6), y = cy + Math.sin(a) * (r + 6) * 0.4;
        poly(ctx, [[x, y - 4], [x + 2, y], [x, y + 4], [x - 2, y]]); flat(ctx, '#e8fbff', 1); }
    }
  },
  muzzle(P, ang, out) { out[0] = 0; out[1] = -14; return out; },
};

// ==== Longeye (Spotter): a tall mast with a lamp-house head and a long gun ======================
// `head` draws the head (the Kindlings skin swaps in a Kindling eye); everything else is shared.
const LTOP = -16, LHY = LTOP - 5;
export function longeyeArt(head, headFront) {
  return {
    body(ctx, P, d) {
      const { mt } = P;
      plinth(ctx, 18, P, d);
      const top = LTOP;
      poly(ctx, [[-3.5, 7], [3.5, 7], [2.2, top], [-2.2, top]]); ink(ctx, IRON, 1.8, -3, 3);
      for (const y of [0, -9]) { rrect(ctx, -4.5, y, 9, 2.6, 1); flat(ctx, BRONZE, 1); }
      if (P.might && mt >= 3) for (const s of [-1, 1]) line(ctx, [[s * 2, -6], [s * 9, 7]], IRON2, 1.4);
      head(ctx, P, d, top);
      const t = top - 15;
      if (mt >= 4) crown(ctx, 0, t + 1, d);
      return t - 7;
    },
    back(ctx, P, st, d) { if (P.mt >= 4) groundAura(ctx, d, st.time, 18); },
    front(ctx, P, st, d) {
      const { might, many, craft, mt } = P, A = aim(st.ang), hy = LHY, back = st.recoil * 4;
      const barrel = (dy, len, w) => {
        ctx.save(); ctx.translate(0, hy + dy); aimPlane(ctx, st.ang);
        rrect(ctx, -3 - back, -w / 2, len, w, w / 2.2); flat(ctx, STEEL, 1.8);
        rrect(ctx, -3 - back, -w / 2, len, w * 0.4, w / 4); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
        rrect(ctx, len - 5 - back, -w / 2 - 1.2, 3.5, w + 2.4, 1); flat(ctx, BRONZE, 1.2);
        if (might && mt >= 4) for (let x = 4; x < len - 8; x += 6) { rrect(ctx, x - back, -w / 2 - 0.8, 2, w + 1.6, 0.8); flat(ctx, DMG[d].core, 0.8); }
        ctx.restore();
      };
      if (many && mt >= 2) { const n = mt >= 4 ? 3 : 2; for (let i = 0; i < n; i++) barrel((i - (n - 1) / 2) * 5, 17, 4); circle(ctx, 0, hy, 5); flat(ctx, BRONZE, 1.6); }
      else barrel(0, might ? (mt >= 4 ? 28 : mt >= 2 ? 25 : 22) : 22, might && mt >= 2 ? 5.5 : 4.6);
      if (craft && mt >= 4) { // Eye in the Dark: a searchlight sweeps out of the head
        const ly = LTOP - 5;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(A.x * 52 - A.y * 15, ly + A.y * 52 + 11); ctx.lineTo(A.x * 52 + A.y * 15, ly + A.y * 52 - 11); ctx.fill(); ctx.restore();
      }
      if (headFront) headFront(ctx, P, st, d, LTOP);
    },
    muzzle(P, ang, out) {
      const len = P.many && P.mt >= 2 ? 17 : P.might ? (P.mt >= 4 ? 28 : P.mt >= 2 ? 25 : 22) : 22;
      out[0] = Math.cos(ang) * (len - 3); out[1] = LHY + Math.sin(ang) * (len - 3) * FORE;
      return out;
    },
  };
}
const longeye = longeyeArt((ctx, P, d, top) => {
  rrect(ctx, -7, top - 10, 14, 11, 3); ink(ctx, IRON2, 2, -7, 7);
  if (P.craft && P.mt >= 2) { circle(ctx, 0, top - 4.5, 5.2); flat(ctx, BRONZE, 1.6); circle(ctx, 0, top - 4.5, 3.8); flat(ctx, '#ffffff', 1.1); }
  else pane(ctx, 0, top - 4.5, 9, 6, d);
  roof(ctx, 0, top - 10, 16, 5);
}, (ctx, P, st, d, top) => {
  if (!(P.craft && P.mt >= 2)) return;
  const A = aim(st.ang);   // the lens's iris tracks the target
  circle(ctx, A.x * 1.4, top - 4.5 + A.y * 1.2, 2); ctx.fillStyle = INK; ctx.fill();
  glow(ctx, 0, top - 4.5, 9, '#ffffff', 0.3 + Math.sin(st.time * 4) * 0.1);
});

// ==== Ember Censer (Sprayer): a gallows post with a hanging fire-pot ===========================
// Dragon's Breath (path 2, T4) breathes all round: three spouts spinning with the ward's heading.
function censerSpouts(P, ang) {
  if (P.many && P.mt >= 4) return [ang, ang + TAU / 3, ang + (2 * TAU) / 3];
  if (P.many && P.mt >= 2) return [ang - 0.35, ang + 0.35];
  return [ang];
}
const CY = -8;
const censer = {
  body(ctx, P, d) {
    const { might, craft, mt } = P;
    plinth(ctx, 24, P, d);
    rrect(ctx, -11, -27, 4.5, 34, 1.5); ink(ctx, WOOD, 1.8, -11, -6.5);
    rrect(ctx, -11, -28, 21, 4.5, 1.5); ink(ctx, WOOD, 1.8, -11, 10);
    if (might && mt >= 3) for (const y of [-20, -8]) { rrect(ctx, -12, y, 6.5, 2.4, 0.8); flat(ctx, BRONZE, 1); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(5, -24); ctx.lineTo(2, -16); ctx.moveTo(5, -24); ctx.lineTo(8, -16); ctx.stroke();
    const R = might && mt >= 3 ? 9.5 : 8;
    circle(ctx, 5, CY, R); ink(ctx, IRON2, 2, 5 - R, 5 + R);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; circle(ctx, 5 + Math.cos(a) * (R - 2.5), CY + Math.sin(a) * (R - 2.5), 0.9); ctx.fillStyle = '#ffb070'; ctx.fill(); }
    // the light: a fire drop in the pot's mouth
    const x = 5, y = CY + 1, r = 4.8;
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.4); ctx.quadraticCurveTo(x + r * 1.2, y + r * 0.3, x, y + r); ctx.quadraticCurveTo(x - r * 1.2, y + r * 0.3, x, y - r * 1.4);
    const g = ctx.createRadialGradient(x - 1.5, y - 1.5, 0, x, y, r * 1.2); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#ffb070'); g.addColorStop(1, DMG[d].core);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
    glyph(ctx, 'flame', x, y + 0.7, r * 0.9, shade(DMG[d].deep, -0.3));
    if (craft && mt >= 4) { ctx.strokeStyle = '#2a1018'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(5, CY - 5); ctx.lineTo(9, CY + 3.5); ctx.lineTo(1, CY + 3.5); ctx.closePath(); ctx.stroke(); }
    const top = might && mt >= 4 ? -34 : -33;
    if (mt >= 4) crown(ctx, -2, top + 2, d);
    return top - 6;
  },
  back(ctx, P, st, d) {
    if (P.mt >= 4) groundAura(ctx, d, st.time, 22);
    const R = P.might && P.mt >= 3 ? 9.5 : 8;
    for (const a of censerSpouts(P, st.ang)) { // spouts sit behind the pot
      ctx.save(); ctx.translate(5, CY); aimPlane(ctx, a);
      poly(ctx, [[R - 2, -3.2], [R + 7, -2.2], [R + 7, 2.2], [R - 2, 3.2]]); flat(ctx, IRON, 1.5);
      rrect(ctx, R + 5.5, -3, 2.5, 6, 0.8); flat(ctx, BRONZE, 1);
      ctx.restore();
    }
  },
  front(ctx, P, st, d) {
    const { might, craft, mt } = P, R = might && mt >= 3 ? 9.5 : 8, f = st.fire || 0;
    glow(ctx, 5, CY + 1, 10 + f * 8 + Math.sin(st.time * 13) * 1.2, DMG[d].core, 0.4 + f * 0.35);
    if (might && mt >= 2) { // flames dancing over the pot
      const n = mt >= 4 ? 5 : 3;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const x = 5 + (i - (n - 1) / 2) * 3.4, hh = (mt >= 4 ? 13 : 8) * (0.7 + 0.3 * Math.sin(st.time * 11 + i * 1.9));
        ctx.fillStyle = i % 2 ? 'rgba(255,170,50,0.85)' : mt >= 4 ? 'rgba(255,245,210,0.85)' : 'rgba(255,80,50,0.85)';
        ctx.beginPath(); ctx.ellipse(x, CY - R - hh * 0.35, 2.6, hh * 0.55, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    if (craft && mt >= 2) for (let i = 0; i < (mt >= 4 ? 4 : 2); i++) { // ash smoke rising off the pot
      const u = (st.time * 0.5 + i / (mt >= 4 ? 4 : 2)) % 1;
      circle(ctx, 8 + i * 1.5 + u * 4, CY - R - 2 - u * 16, 2.5 + u * 3); ctx.fillStyle = `rgba(50,40,52,${0.75 * (1 - u)})`; ctx.fill();
    }
  },
  muzzle(P, ang, out) { const R = P.might && P.mt >= 3 ? 9.5 : 8; out[0] = 5 + Math.cos(ang) * (R + 8); out[1] = CY + Math.sin(ang) * (R + 8) * FORE; return out; },
  spouts: censerSpouts,
};

export const LANTERNS = { bolt, rime, longeye, censer };
