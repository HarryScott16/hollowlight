// Skin A · LANTERNS: every ward is a lantern holding a captured light. The housing's silhouette is
// the role, the light in its window is the damage type (colour + glyph), and the housing's
// materials are themed on the ward's job (a green archer's watch-post, a red-hot fire-pot, a
// frosted globe, a teal-and-brass spotting mast). See kit.js for units.
//
// Every ward has:
//   body(ctx, P, d)        the static ward, drawn once into a cached sprite; returns its top (y)
//   back(ctx, P, st, d)    live parts behind the body (optional)
//   front(ctx, P, st, d)   live parts in front: whatever aims, recoils, flickers or spins
//   muzzle(P, ang, out)    where shots leave, in ward units (out = [x, y])
// P = mainPath(tiers) + { tiers }. st = { ang, recoil, time, pulse, fire (0-1), id }.
import { DMG, INK, TAU, circle, poly, rrect, star, ink, flat, line, glow, notches, pips, glyph, aimPlane, FORE, shade, crown, groundAura, twinkle, risingMotes } from './kit.js';

export const IRON = '#3a4160', IRON2 = '#4d5677', BRONZE = '#8f6b47', WOOD = '#7a5236', STEEL = '#b8c2d2', BRASS = '#c8963a';
const GREEN_IRON = '#35553a', GREEN_TRIM = '#5f8a4a';
const SOOT = '#2a2024', CHARWOOD = '#4a2c1e';
const FROST_IRON = '#6d8fb0', TEAL = '#2f5560', TEAL2 = '#3f6f7a';

// The plinth, in the ward's material, with the tier notches (main path) and pips (second path).
export function plinth(ctx, w, P, d, fill = IRON, look = null) {
  poly(ctx, [[-w / 2, 14], [w / 2, 14], [w / 2 - 3, 7], [-w / 2 + 3, 7]]); ink(ctx, fill, 2, -w / 2, w / 2);
  if (look === 'snow') { ctx.beginPath(); ctx.moveTo(-w / 2 + 2.5, 7.5); ctx.lineTo(w / 2 - 2.5, 7.5); for (let i = 0; i <= 6; i++) ctx.lineTo(w / 2 - 3 - i * ((w - 6) / 6), 8.6 + (i % 2) * 1.4); ctx.closePath(); flat(ctx, '#f4fdff', 1); }
  if (look === 'embers') for (let i = 0; i < 4; i++) line(ctx, [[-w / 2 + 4 + i * (w - 8) / 3, 13], [-w / 2 + 5 + i * (w - 8) / 3, 10]], '#ff8a3a', 0.6);
  if (look === 'brass') { rrect(ctx, -w / 2 + 2.6, 6.4, w - 5.2, 1.8, 0.6); flat(ctx, BRASS, 0.8); }
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
// A flicker for a lantern's light: a soft glow over its window that breathes and stutters.
function flicker(ctx, x, y, r, d, t, k = 1) {
  const D = DMG[d], f = 0.85 + Math.sin(t * 7) * 0.08 + Math.sin(t * 19) * 0.05;
  glow(ctx, x, y, r * f, D.glow ? D.core : '#ffffff', (D.glow ? 0.45 : 0.3) * k);
}

// ==== Bolt Ward (Shooter): an archer's watch-post lantern, a crossbow on the roof ================
const bolt = {
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    plinth(ctx, 24, P, d, WOOD);
    // a rack of bolts on the side
    rrect(ctx, 8, -10, 5, 15, 1.5); ink(ctx, '#5a3a22', 1.3, 8, 13);
    for (let i = 0; i < (many && mt >= 2 ? 4 : 3); i++) { const y = -12 - (i % 2) * 1.5, x = 9 + i * 1.2; line(ctx, [[x, -9], [x, y]], WOOD, 0.8); poly(ctx, [[x - 1.4, y + 2.2], [x, y - 0.6], [x + 1.4, y + 2.2]]); flat(ctx, might && mt >= 2 ? STEEL : '#e9eef6', 0.7); }
    rrect(ctx, -9, -15, 18, 22, 2); ink(ctx, GREEN_IRON, 2, -9, 9);
    rrect(ctx, -9.5, -15.5, 19, 2.6, 1); flat(ctx, GREEN_TRIM, 1);
    rrect(ctx, -9.5, 4, 19, 2.6, 1); flat(ctx, GREEN_TRIM, 1);
    pane(ctx, 0, -5, 10, 14, d);
    line(ctx, [[0, -12], [0, 2]], GREEN_IRON, 0.9); line(ctx, [[-5, -5], [5, -5]], GREEN_IRON, 0.9);   // arrow-slit cross
    if (might && mt >= 2) for (const y of [-11, 1]) { rrect(ctx, -10, y - 1.5, 20, 3, 1); flat(ctx, STEEL, 1.2); }
    if (might && mt >= 3) for (const x of [-11, 11]) { poly(ctx, [[x, 7], [x * 1.25, 7], [x, -8]]); ink(ctx, STEEL, 1.4, -13, 13); }
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -5, 5.5, 3.4, 0, 0, TAU); flat(ctx, '#ffffff', 1.4); circle(ctx, 1, -5, 2.1); flat(ctx, INK, 0); }
    if (craft && mt >= 3) { rrect(ctx, -9.5, -15, 19, 4, 1.5); flat(ctx, '#25401f', 1.2); }   // a dark hood over the post
    roof(ctx, 0, -15, 23, 7, '#6a3a2a');
    line(ctx, [[-10, -15], [-10, -28]], WOOD, 1);   // the pennant pole (the flag flutters live)
    if (P.mt >= 4) crown(ctx, 0, -21, d);           // on the roof's peak, behind the crossbow
    return P.mt >= 4 && might ? -38 : -34;
  },
  back(ctx, P, st, d) { if (P.mt >= 4) groundAura(ctx, d, st.time, 20); },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P;
    flicker(ctx, 0, -5, 11 + mt, d, st.time + (st.id || 0));
    const w = Math.sin(st.time * 6 + (st.id || 0)) * 1.5;   // the pennant flutters
    ctx.beginPath(); ctx.moveTo(-10, -28); ctx.quadraticCurveTo(-5, -27 + w, -1, -26 + w * 0.6); ctx.quadraticCurveTo(-5, -25 - w * 0.4, -10, -23.5); ctx.closePath();
    flat(ctx, mt >= 4 ? '#e9eef6' : GREEN_TRIM, 1.1);
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
    const g = (st.time * 0.7 + (st.id || 0) * 0.3) % 2.2;
    if (g < 0.25) twinkle(ctx, Math.cos(st.ang) * 12, -23 + Math.sin(st.ang) * 12 * FORE, 2.4, 1 - g * 4);
    if (craft && mt >= 4) { // the hunter's mark floats beside the post, turning
      const x = -16, y = -27 + Math.sin(st.time * 2.4) * 1.2;
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

// ==== Rime Spire (Pulser): a frosted globe lantern hung with icicles ============================
const RIME_SPARKS = [[-8, -18], [7, -10], [-4, -6], [9, -19], [0, -25]];
const rime = {
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    plinth(ctx, 24, P, d, FROST_IRON, 'snow');
    rrect(ctx, -3, -2, 6, 10, 1.5); ink(ctx, FROST_IRON, 1.6, -3, 3);
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
    ctx.strokeStyle = FROST_IRON; ctx.lineWidth = 1.6;
    for (const k of [-0.55, 0, 0.55]) { ctx.beginPath(); ctx.ellipse(0, cy, Math.abs(k) * r || 0.1, r, 0, 0, TAU); ctx.stroke(); }
    // a frost-rimmed band round the globe, hung with icicles (longer with Deep Freeze)
    ctx.beginPath(); ctx.ellipse(0, cy + r * 0.45, r * 0.9, 2.4, 0, 0, TAU); flat(ctx, '#e8fbff', 1.2);
    const L = might ? 4 + mt * 1.3 : 4;
    for (let i = 0; i < 5; i++) { const x = -r * 0.75 + i * (r * 1.5 / 4), l = L * (i % 2 ? 0.65 : 1), y = cy + r * 0.45 + 2;
      poly(ctx, [[x - 1.4, y], [x + 1.4, y], [x, y + l]]); flat(ctx, '#e8fbff', 0.9); }
    if (might && mt >= 2) {
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.lineTo(Math.cos(a) * (r + 3), cy + Math.sin(a) * (r + 3)); } ctx.closePath();
      ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 2.5; ctx.stroke();
    }
    glyph(ctx, 'flake', 0, cy - 2, 6.5, DMG[d].deep);
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, cy, r + 9, 5, 0, 0, Math.PI); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 3; ctx.stroke(); }
    // a snow-capped roof with icicles at its eaves
    roof(ctx, 0, cy - r + 1, 10, 5, FROST_IRON);
    ctx.beginPath(); ctx.moveTo(-3, cy - r - 1.6); ctx.quadraticCurveTo(0, cy - r - 5, 3, cy - r - 1.6); ctx.closePath(); flat(ctx, '#f4fdff', 1);
    for (const x of [-4, 4]) { poly(ctx, [[x - 1, cy - r + 1], [x + 1, cy - r + 1], [x, cy - r + 4.5]]); flat(ctx, '#e8fbff', 0.8); }
    const top = cy - r - (many && mt >= 4 ? 8 : 5);
    if (mt >= 4) crown(ctx, 0, top + 1, d);
    return top - 7;
  },
  back(ctx, P, st, d) {
    if (P.mt >= 4) groundAura(ctx, d, st.time, 24);
    const ga = ctx.globalAlpha;
    for (let i = 0; i < 3; i++) { // cold mist sinking off the plinth
      const u = (st.time * 0.4 + i / 3) % 1, s = i % 2 ? 1 : -1;
      ctx.globalAlpha = ga * 0.35 * (1 - u); ctx.fillStyle = '#e8fbff';
      ctx.beginPath(); ctx.ellipse(s * (7 + u * 14), 12 + u * 2, 4 + u * 5, 1.6 + u * 1.4, 0, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = ga;
  },
  front(ctx, P, st, d) {
    const { might, craft, mt } = P, r = might && mt >= 3 ? 14 : 12, cy = -14, p = st.pulse || 0;
    glow(ctx, 0, cy, r + 6 + p * 16 + Math.sin(st.time * 3) * 1.5, DMG[d].core, 0.35 + p * 0.5);
    for (let i = 0; i < RIME_SPARKS.length; i++) { const [x, y] = RIME_SPARKS[i]; twinkle(ctx, x * r / 12, y, 1.8, Math.sin(st.time * 3 + i * 1.9) * 1.4 - 0.4); }
    if (craft && mt >= 4) for (let i = 0; i < 6; i++) { // snowflakes riding the snow ring
      const a = st.time * 1.4 + (i / 6) * TAU, x = Math.cos(a) * (r + 9), y = cy + Math.sin(a) * 5;
      star(ctx, x, y, 3, 1.2, 6, a); flat(ctx, '#ffffff', 0.8);
    }
    if (might && mt >= 4) for (let i = 0; i < 4; i++) { // a frost crown of shards circling the globe
      const a = -st.time * 1.1 + (i / 4) * TAU, x = Math.cos(a) * (r + 6), y = cy + Math.sin(a) * (r + 6) * 0.4;
      poly(ctx, [[x, y - 4], [x + 2, y], [x, y + 4], [x - 2, y]]); flat(ctx, '#e8fbff', 1);
    }
    if (p > 0.3) risingMotes(ctx, st.time, 6, -r, r, cy + 4, 14, '#e8fbff', 1.6, 0.9, st.id || 0);
  },
  muzzle(P, ang, out) { out[0] = 0; out[1] = -14; return out; },
};

// ==== Longeye (Spotter): a tall teal-and-brass mast with a lamp-house head and a long gun ========
// `head` draws the head (the Kindlings skin swaps in a Kindling eye); everything else is shared.
const LTOP = -16, LHY = LTOP - 5;
export function longeyeArt(head, headFront) {
  return {
    body(ctx, P, d) {
      const { mt } = P;
      plinth(ctx, 20, P, d, TEAL, 'brass');
      const top = LTOP;
      poly(ctx, [[-3.5, 7], [3.5, 7], [2.2, top], [-2.2, top]]); ink(ctx, TEAL2, 1.8, -3, 3);
      for (const y of [0, -9]) { rrect(ctx, -4.5, y, 9, 2.6, 1); flat(ctx, BRASS, 1); }
      if (P.might && mt >= 3) for (const s of [-1, 1]) line(ctx, [[s * 2, -6], [s * 9, 7]], BRASS, 1.4);
      if (P.many && mt >= 3) { circle(ctx, -5, -3, 4); ink(ctx, BRASS, 1.4, -9, -1); circle(ctx, -5, -3, 1.6); flat(ctx, '#6a4a2a', 0); }   // ammo drum
      head(ctx, P, d, top);
      const t = top - 17;
      if (mt >= 4) crown(ctx, 0, t + 1, d);
      return t - 7;
    },
    back(ctx, P, st, d) { if (P.mt >= 4) groundAura(ctx, d, st.time, 18); },
    front(ctx, P, st, d) {
      const { might, many, craft, mt } = P, hy = LHY, back = st.recoil * 4;
      const barrel = (dy, len, w) => {
        ctx.save(); ctx.translate(0, hy + dy); aimPlane(ctx, st.ang);
        rrect(ctx, -3 - back, -w / 2, len, w, w / 2.2); flat(ctx, STEEL, 1.8);
        rrect(ctx, -3 - back, -w / 2, len, w * 0.4, w / 4); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
        rrect(ctx, len - 5 - back, -w / 2 - 1.2, 3.5, w + 2.4, 1); flat(ctx, BRASS, 1.2);
        if (might && mt >= 2) { rrect(ctx, 2 - back, -w / 2 - 3.4, 9, 2.8, 1.2); flat(ctx, BRASS, 1); }   // a scope
        if (might && mt >= 4) for (let x = 4; x < len - 8; x += 6) { rrect(ctx, x - back, -w / 2 - 0.8, 2, w + 1.6, 0.8); flat(ctx, DMG[d].core, 0.8); }
        ctx.restore();
      };
      if (many && mt >= 2) { const n = mt >= 4 ? 3 : 2; for (let i = 0; i < n; i++) barrel((i - (n - 1) / 2) * 5, 17, 4); circle(ctx, 0, hy, 5); flat(ctx, BRASS, 1.6); }
      else barrel(0, might ? (mt >= 4 ? 28 : mt >= 2 ? 25 : 22) : 22, might && mt >= 2 ? 5.5 : 4.6);
      if (might && mt >= 4) { const s = 0.5 + 0.5 * Math.sin(st.time * 6); glow(ctx, Math.cos(st.ang) * 14, hy + Math.sin(st.ang) * 14 * FORE, 8 + s * 3, '#ffffff', 0.3 + s * 0.25); }
      if (craft && mt >= 4) { // Eye in the Dark: a searchlight sweeps out of the head
        const ly = LTOP - 5, ax = Math.cos(st.ang), ay = Math.sin(st.ang) * 0.6;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(ax * 52 - ay * 15, ly + ay * 52 + 11); ctx.lineTo(ax * 52 + ay * 15, ly + ay * 52 - 11); ctx.fill(); ctx.restore();
      }
      if (headFront) headFront(ctx, P, st, d, LTOP);
      // a little brass vane on the roof turns in the wind
      const v = Math.cos(st.time * 1.3 + (st.id || 0));
      line(ctx, [[0, LTOP - 16], [0, LTOP - 20]], BRASS, 0.7);
      ctx.save(); ctx.translate(0, LTOP - 20); ctx.scale(v, 1); poly(ctx, [[0, -1.6], [5, 0], [0, 1.6]]); flat(ctx, BRASS, 0.8); ctx.restore();
      // a red watch-light blinks on the mast
      if (((st.time + (st.id || 0) * 0.7) % 1.8) < 0.25) { circle(ctx, 3.2, -9, 1.2); ctx.fillStyle = '#ff5a4a'; ctx.fill(); glow(ctx, 3.2, -9, 5, '#ff5a4a', 0.6); }
    },
    muzzle(P, ang, out) {
      const len = P.many && P.mt >= 2 ? 17 : P.might ? (P.mt >= 4 ? 28 : P.mt >= 2 ? 25 : 22) : 22;
      out[0] = Math.cos(ang) * (len - 3); out[1] = LHY + Math.sin(ang) * (len - 3) * FORE;
      return out;
    },
  };
}
const longeye = longeyeArt((ctx, P, d, top) => {
  rrect(ctx, -7, top - 10, 14, 11, 3); ink(ctx, TEAL2, 2, -7, 7);
  if (P.craft && P.mt >= 2) { circle(ctx, 0, top - 4.5, 5.2); flat(ctx, BRASS, 1.6); circle(ctx, 0, top - 4.5, 3.8); flat(ctx, '#ffffff', 1.1); }
  else pane(ctx, 0, top - 4.5, 9, 6, d);
  // a brass visor over the window: the watchful brow
  poly(ctx, [[-8.5, top - 9.5], [8.5, top - 9.5], [6, top - 6.5], [-6, top - 6.5]]); ink(ctx, BRASS, 1.3, -8.5, 8.5);
  roof(ctx, 0, top - 10, 16, 5, TEAL);
}, (ctx, P, st, d, top) => {
  if (P.craft && P.mt >= 2) { // the lens's iris tracks the target
    const ax = Math.cos(st.ang), ay = Math.sin(st.ang) * 0.6;
    circle(ctx, ax * 1.4, top - 4.5 + ay * 1.2, 2); ctx.fillStyle = INK; ctx.fill();
    glow(ctx, 0, top - 4.5, 9, '#ffffff', 0.3 + Math.sin(st.time * 4) * 0.1);
  } else flicker(ctx, 0, top - 4.5, 8, d, st.time + (st.id || 0), 0.8);
});

// ==== Ember Censer (Sprayer): a charred gallows with a red-hot fire-pot ==========================
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
    plinth(ctx, 26, P, d, SOOT, 'embers');
    rrect(ctx, -11, -27, 4.5, 34, 1.5); ink(ctx, CHARWOOD, 1.8, -11, -6.5);
    rrect(ctx, -11, -28, 21, 4.5, 1.5); ink(ctx, CHARWOOD, 1.8, -11, 10);
    for (const [x, y] of [[-9, -18], [-8.5, -4], [2, -26]]) { circle(ctx, x, y, 0.9); ctx.fillStyle = '#ff8a3a'; ctx.fill(); }   // embers stuck in the wood
    if (might && mt >= 3) for (const y of [-20, -8]) { rrect(ctx, -12, y, 6.5, 2.4, 0.8); flat(ctx, BRONZE, 1); }
    ctx.setLineDash([1.6, 1.2]); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;   // chains
    ctx.beginPath(); ctx.moveTo(5, -24); ctx.lineTo(2, -16); ctx.moveTo(5, -24); ctx.lineTo(8, -16); ctx.stroke(); ctx.setLineDash([]);
    const R = might && mt >= 3 ? 9.5 : 8;
    // the pot: iron going red-hot towards the bottom, with glowing seams
    circle(ctx, 5, CY, R);
    const g = ctx.createLinearGradient(0, CY - R, 0, CY + R); g.addColorStop(0, '#3a3440'); g.addColorStop(0.55, '#6a2a1a'); g.addColorStop(1, craft && mt >= 2 ? '#8a2a1a' : '#d8501a');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    for (const k of [-0.5, 0.5]) line(ctx, [[5 + k * R, CY - R * 0.4], [5 + k * R * 0.8, CY + R * 0.7]], '#ff9a3a', 0.6);
    rrect(ctx, 5 - R * 0.75, CY - R - 1.5, R * 1.5, 3, 1); flat(ctx, '#3a3440', 1.2);
    // the light: a fire drop in the pot's mouth
    const x = 5, y = CY + 1, r = 4.8;
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.4); ctx.quadraticCurveTo(x + r * 1.2, y + r * 0.3, x, y + r); ctx.quadraticCurveTo(x - r * 1.2, y + r * 0.3, x, y - r * 1.4);
    const gd = ctx.createRadialGradient(x - 1.5, y - 1.5, 0, x, y, r * 1.2); gd.addColorStop(0, '#ffffff'); gd.addColorStop(0.35, '#ffb070'); gd.addColorStop(1, DMG[d].core);
    ctx.fillStyle = gd; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
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
      poly(ctx, [[R - 2, -3.2], [R + 7, -2.2], [R + 7, 2.2], [R - 2, 3.2]]); flat(ctx, '#3a3440', 1.5);
      rrect(ctx, R + 5.5, -3, 2.5, 6, 0.8); flat(ctx, BRONZE, 1);
      ctx.restore();
    }
  },
  front(ctx, P, st, d) {
    const { might, craft, mt } = P, R = might && mt >= 3 ? 9.5 : 8, f = st.fire || 0;
    glow(ctx, 5, CY + 1, 10 + f * 8 + Math.sin(st.time * 13) * 1.2, DMG[d].core, 0.4 + f * 0.35);
    glow(ctx, 5, CY + R * 0.6, R * 1.2, '#ff6a1a', 0.25 + Math.sin(st.time * 3.5) * 0.08);   // the red-hot bottom breathes
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
    risingMotes(ctx, st.time, mt >= 4 ? 7 : 4, 0, 10, CY - R, 24, '#ffb347', 1.5, 1.3, st.id || 0);   // embers
    if (craft && mt >= 2) for (let i = 0; i < (mt >= 4 ? 4 : 2); i++) { // ash smoke rising off the pot
      const u = (st.time * 0.5 + i / (mt >= 4 ? 4 : 2)) % 1;
      circle(ctx, 8 + i * 1.5 + u * 4, CY - R - 2 - u * 16, 2.5 + u * 3); ctx.fillStyle = `rgba(50,40,52,${0.75 * (1 - u)})`; ctx.fill();
    }
    if (craft && mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,80,40,${0.55 + Math.sin(st.time * 5) * 0.3})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(5, CY - 5); ctx.lineTo(9, CY + 3.5); ctx.lineTo(1, CY + 3.5); ctx.closePath(); ctx.stroke(); ctx.restore(); }
  },
  muzzle(P, ang, out) { const R = P.might && P.mt >= 3 ? 9.5 : 8; out[0] = 5 + Math.cos(ang) * (R + 8); out[1] = CY + Math.sin(ang) * (R + 8) * FORE; return out; },
  spouts: censerSpouts,
};

export const LANTERNS = { bolt, rime, longeye, censer };
