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
import { FACE, gearInFront, DMG, INK, TAU, circle, poly, rrect, star, ink, flat, line, glow, notches, pips, glyph, aimPlane, FORE, shade, crown, groundAura, twinkle, risingMotes } from './kit.js';
import { crossbowX, tripod, ballista, repeater, hawk, mark, banner, sigil, BALLISTA_TIP, REPEATER_TIP, STEEL2, GOLD, GREEN2, NIGHT, NIGHT2, SILVER } from './bolt-parts.js';
import { iceCrystal, iceBlade, snowCloud, scarf, fuelTank, ashCollar, IRON as P_IRON, GOLD as P_GOLD, BRASS as P_BRASS, COPPER, tubeLean, tube, shell, crate, cinderPool, chimney, smokePuffs, lavaCracks, prong, orb, zap, pylon, cloud, gyro, gem, shard, lensRing, sunDisc, starBurst, drum, warhorn, pennant, coins, chest, beam } from './parts.js';

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

// ==== Bolt Ward (Shooter): an archer's watch-post lantern; each path grows its own form =========
// (see bolt-parts.js): a steel-clad, bannered ballista post; a bolt battery with outriggers; a dark
// hunter's spire with a glowing eye, a hawk and orbiting marks.
const L_ROOF = -15;
const bolt = {
  self: () => [-9, -15, 9, 7],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    plinth(ctx, might && mt >= 3 ? 28 : many && mt >= 4 ? 30 : 24, P, d, mt >= 4 && might ? '#5a5f70' : WOOD);
    // bolt racks: one, and a second from Quick Draw; outrigger arms carry crossbows on Storm of Bolts
    const racks = many && mt >= 1 ? 2 : 1;
    for (let r = 0; r < racks; r++) {
      const x = r ? -13 : 8;
      rrect(ctx, x, -10, 5, 15, 1.5); ink(ctx, '#5a3a22', 1.3, x, x + 5);
      const n = many ? Math.min(5, 3 + mt) : 3;
      for (let i = 0; i < n; i++) { const y = -12 - (i % 2) * 1.5, bx = x + 0.8 + i * (3.4 / (n - 1)); line(ctx, [[bx, -9], [bx, y]], WOOD, 0.8); poly(ctx, [[bx - 1.3, y + 2.2], [bx, y - 0.6], [bx + 1.3, y + 2.2]]); flat(ctx, might && mt >= 1 ? STEEL : SILVER, 0.6); }
    }
    if (many && mt >= 4) for (const s of [-1, 1]) { line(ctx, [[s * 9, -10], [s * 17, -16]], BRASS, 1.6); circle(ctx, s * 17, -16, 1.8); flat(ctx, BRASS, 0.8); }
    // the housing: a green watch-post; Might clads it in riveted steel (T3) with gold trim (T4)
    const steel = might && mt >= 3, hc = steel ? '#6a7488' : craft && mt >= 4 ? NIGHT2 : GREEN_IRON;
    const trim = steel ? (mt >= 4 ? GOLD : STEEL) : craft && mt >= 4 ? SILVER : GREEN_TRIM;
    rrect(ctx, -9, -15, 18, 22, 2); ink(ctx, hc, 2, -9, 9);
    rrect(ctx, -9.5, -15.5, 19, 2.6, 1); flat(ctx, trim, 1);
    rrect(ctx, -9.5, 4, 19, 2.6, 1); flat(ctx, trim, 1);
    if (steel) for (const [x, y] of [[-7, -12], [7, -12], [-7, 2], [7, 2]]) { circle(ctx, x, y, 0.9); ctx.fillStyle = '#e0e6f0'; ctx.fill(); }
    if (might && mt >= 1) for (const [x, y] of [[-9, -15], [9, -15], [-9, 7], [9, 7]]) { rrect(ctx, x - 1.8, y - 1.8, 3.6, 3.6, 0.8); flat(ctx, STEEL, 0.9); }   // steel corner caps
    if (might && mt >= 2 && !steel) for (const y of [-11, 1]) { rrect(ctx, -10, y - 1.5, 20, 3, 1); flat(ctx, STEEL, 1.2); }
    if (steel) for (const x of [-11, 11]) { poly(ctx, [[x, 7], [x * 1.3, 7], [x, -9]]); ink(ctx, mt >= 4 ? '#8a7a5a' : STEEL2, 1.4, -14, 14); }
    // the window: silver light; Hunter's Mark turns it into a lens, then an eye
    pane(ctx, 0, -5, 10, 14, d);
    if (craft && mt >= 1) { circle(ctx, 0, -5, 4.4); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke(); ctx.strokeStyle = BRASS; ctx.lineWidth = 1.2; ctx.stroke(); }
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -5, 4.6, 2.8, 0, 0, TAU); flat(ctx, '#ffffff', 1.2); }
    else { line(ctx, [[0, -12], [0, 2]], hc, 0.9); line(ctx, [[-5, -5], [5, -5]], hc, 0.9); }
    if (craft && mt >= 2) { // a hood awning over the window; from T3 a dark drape over the whole post
      ctx.beginPath(); ctx.moveTo(-10.5, -13); ctx.quadraticCurveTo(0, -18, 10.5, -13); ctx.lineTo(8, -9); ctx.quadraticCurveTo(0, -12, -8, -9); ctx.closePath(); ink(ctx, mt >= 4 ? NIGHT : GREEN2, 1.3, -10, 10);
      if (mt >= 3) for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10.5, -13); ctx.quadraticCurveTo(s * 13, -2, s * 11.5, 7); ctx.lineTo(s * 8.5, 7); ctx.quadraticCurveTo(s * 10, -3, s * 8, -9); ctx.closePath(); ink(ctx, mt >= 4 ? NIGHT : GREEN2, 1.2, -13, 13); }
    }
    // the roof: peaked; a ballista platform (Might T3) with crenellations (T4); a dark spire (Craft T4)
    if (steel) {
      rrect(ctx, -11, L_ROOF - 4, 22, 4, 1); ink(ctx, mt >= 4 ? '#8a7a5a' : '#5a6478', 1.6, -11, 11);
      if (mt >= 4) for (const x of [-10, -4, 2, 8]) { rrect(ctx, x, L_ROOF - 8, 3, 4, 0.6); ink(ctx, '#8a7a5a', 1.1, x, x + 3); }
      tripod(ctx, 0, L_ROOF - 6, 0.8, mt >= 4);
    } else if (craft && mt >= 4) { poly(ctx, [[-11, L_ROOF], [11, L_ROOF], [0, L_ROOF - 13]]); ink(ctx, NIGHT, 2, -11, 11); line(ctx, [[0, L_ROOF - 13], [0, L_ROOF]], SILVER, 0.6); }
    else roof(ctx, 0, L_ROOF, 23, 7, '#6a3a2a');
    if (!(craft && mt >= 3) && !steel) line(ctx, [[-10, L_ROOF], [-10, L_ROOF - 13]], WOOD, 1);   // pennant pole
    if (steel && mt >= 4) banner(ctx, -16, -30, 9);
    if (mt >= 4) crown(ctx, steel ? -16 : 0, steel ? -31 : craft ? L_ROOF - 12 : L_ROOF - 6, d, 1.05);
    return steel && mt >= 4 ? -40 : craft && mt >= 4 ? -36 : -34;
  },
  back(ctx, P, st, d) {
    if (P.mt >= 4) { if (P.craft) sigil(ctx, st.time, 24); else groundAura(ctx, d, st.time, 24); }
    if (P.craft && P.mt >= 4) for (let i = 0; i < 3; i++) { const a = st.time * 1.1 + (i / 3) * TAU; if (Math.sin(a) < 0) mark(ctx, Math.cos(a) * 17, 3 + Math.sin(a) * 5, 3.4, st.time + i, 0.8); }
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, steel = might && mt >= 3;
    flicker(ctx, 0, -5, 11 + mt * 1.5, d, st.time + (st.id || 0));
    if (craft && mt === 1) twinkle(ctx, -2, -7, 2.2, Math.sin(st.time * 2.5) * 1.5 - 0.3);
    if (!(craft && mt >= 3) && !steel) { // the pennant flutters
      const w = Math.sin(st.time * 6 + (st.id || 0)) * 1.5;
      ctx.beginPath(); ctx.moveTo(-10, L_ROOF - 13); ctx.quadraticCurveTo(-5, L_ROOF - 12 + w, -1, L_ROOF - 11 + w * 0.6); ctx.quadraticCurveTo(-5, L_ROOF - 10 - w * 0.4, -10, L_ROOF - 8.5); ctx.closePath();
      flat(ctx, many && mt >= 2 ? BRASS : GREEN_TRIM, 1.1);
    }
    if (craft && mt >= 2) { // the eye's pupil tracks the target; it glows at T4
      const ax = Math.cos(st.ang), ay = Math.sin(st.ang) * 0.6;
      circle(ctx, ax * 2, -5 + ay * 1.2, 1.8); ctx.fillStyle = INK; ctx.fill();
      if (mt >= 4) glow(ctx, 0, -5, 9, '#ffffff', 0.6 + Math.sin(st.time * 4) * 0.15);
    }
    if (steel) ballista(ctx, 0, L_ROOF - 7, st.ang, mt >= 4 ? 1.1 : 0.9, mt >= 4, mt >= 4, st.time, st.recoil);
    else if (might) crossbowX(ctx, 0, L_ROOF - 9, st.ang, 1 + mt * 0.2, { heavy: mt >= 1, winch: mt >= 1, recoil: st.recoil });
    else if (many && mt >= 3) {
      repeater(ctx, 0, L_ROOF - 10, st.ang, mt >= 4 ? 1.15 : 1, st.time, mt >= 4, st.recoil);
      if (mt >= 4) for (const s of [-1, 1]) crossbowX(ctx, s * 17, -19, st.ang, 0.75, { recoil: st.recoil });
    } else if (many && mt >= 2) { crossbowX(ctx, -5, L_ROOF - 8, st.ang, 0.9, { recoil: st.recoil }); crossbowX(ctx, 5, L_ROOF - 8, st.ang, 0.9, { recoil: st.recoil }); }
    else crossbowX(ctx, 0, L_ROOF - 8, st.ang, 1, { recoil: st.recoil });
    const g = (st.time * 0.7 + (st.id || 0) * 0.3) % 2.2;
    if (g < 0.25) { const m = this.muzzle(P, st.ang, TMP_L); twinkle(ctx, m[0], m[1], 2.4, 1 - g * 4); }
    if (craft && mt >= 3) {
      if (mt >= 4) {
        hawk(ctx, -12 + Math.cos(st.time * 1.2) * 6, -35 + Math.sin(st.time * 2.4) * 2, 0.9, st.time, true);
        for (let i = 0; i < 3; i++) { const a = st.time * 1.1 + (i / 3) * TAU; if (Math.sin(a) >= 0) mark(ctx, Math.cos(a) * 17, 3 + Math.sin(a) * 5, 3.4, st.time + i, 0.8); }
      } else { hawk(ctx, 9.5, L_ROOF - 3, 0.85, st.time, false); mark(ctx, -15, -24, 5, st.time); }
    }
    if (might && mt >= 4) risingMotes(ctx, st.time, 4, -8, 8, L_ROOF - 6, 14, '#ffffff', 1.4, 1.2, st.id || 0);
    if (many && mt >= 4) risingMotes(ctx, st.time, 3, -16, 16, 4, 8, '#ffcf4a', 1.2, 0.9, st.id || 0);
  },
  muzzle(P, ang, out) {
    const { might, many, mt } = P, c = Math.cos(ang), s = Math.sin(ang) * FORE;
    let x = 0, y, L;
    if (might && mt >= 3) { y = L_ROOF - 7; L = BALLISTA_TIP * (mt >= 4 ? 1.1 : 0.9); }
    else if (might) { y = L_ROOF - 9; L = 12 * (1 + mt * 0.2); }
    else if (many && mt >= 3) { y = L_ROOF - 10; L = REPEATER_TIP * (mt >= 4 ? 1.15 : 1); }
    else if (many && mt >= 2) { x = c >= 0 ? 5 : -5; y = L_ROOF - 8; L = 12 * 0.9; }
    else { y = L_ROOF - 8; L = 12; }
    out[0] = x + c * L; out[1] = y + s * L; return out;
  },
};
const TMP_L = [0, 0];

// ==== Rime Spire (Pulser): a frosted globe lantern hung with icicles ============================
const RIME_SPARKS = [[-8, -18], [7, -10], [-4, -6], [9, -19], [0, -25]];
const rime = {
  self: () => [-12, -26, 12, 7],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    plinth(ctx, 24, P, d, FROST_IRON, 'snow');
    if (many && mt === 1) for (const s of [-1, 1]) { poly(ctx, [[s * 10, 7], [s * 15, -1], [s * 12, 7]]); flat(ctx, '#d8f8ff', 1.1); }   // shards by the plinth
    if (craft && mt >= 1) scarf(ctx, 0, 1, 5.5, mt >= 4 ? '#e8f4ff' : '#3a7fd0');                                                           // a scarf round the stand
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
    if (might && mt >= 1) for (const [x, h] of [[-7, 4], [7, 4]]) { poly(ctx, [[x - 1.6, cy - r + 3], [x + 1.6, cy - r + 3], [x * 1.1, cy - r + 3 - h]]); flat(ctx, '#e8fbff', 1); }   // frost spikes
    const top = cy - r - (many && mt >= 4 ? 8 : 5);
    if (mt >= 4) crown(ctx, 0, top + 1, d);
    return top - 7;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time;
    if (mt >= 4) groundAura(ctx, d, t, 24);
    if (might && mt >= 3) {
      const C = mt >= 4 ? [[-15, 9, 6, 22, -0.3], [15, 9, 6, 22, 0.3], [-8, 6, 7, 30, -0.12], [8, 6, 7, 30, 0.12], [0, 3, 8, 36, 0]] : [[-13, 8, 6, 22, -0.2], [13, 8, 6, 22, 0.2]];
      for (const [x, y, cw, ch, l] of C) iceCrystal(ctx, x, y, cw, ch, l);
    }
    if (many && mt >= 3) for (let i = 0; i < (mt >= 4 ? 6 : 3); i++) { const a = t * (mt >= 4 ? 1.8 : 1.3) + (i / (mt >= 4 ? 6 : 3)) * TAU; if (Math.sin(a) < 0) iceBlade(ctx, Math.cos(a) * 18, -14 + Math.sin(a) * 6, a + Math.PI / 2, mt >= 4 ? 1.3 : 1); }
    if (craft && mt >= 3) snowCloud(ctx, 0, mt >= 4 ? -32 : -32, mt >= 4 ? 16 : 14, t, mt >= 4 ? 9 : 5);
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
    if (P.many && mt >= 3) for (let i = 0; i < (mt >= 4 ? 6 : 3); i++) { const a = st.time * (mt >= 4 ? 1.8 : 1.3) + (i / (mt >= 4 ? 6 : 3)) * TAU; if (Math.sin(a) >= 0) iceBlade(ctx, Math.cos(a) * 18, -14 + Math.sin(a) * 6, a + Math.PI / 2, mt >= 4 ? 1.3 : 1); }
    if (craft && mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(232,251,255,0.6)'; ctx.lineWidth = 1.4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 10, 18 + i * 3, 5 + i, 0, st.time * 2 + i * 2, st.time * 2 + i * 2 + 1.6); ctx.stroke(); } ctx.restore(); }
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
const LTOP = -16, LHY = LTOP + 5;   // the gun is mounted on the mast, just below the head
// Deadeye: a longer barrel, a scope, bipod legs and armour plates (T3), then a rail rifle with
// glowing capacitor rings (Headhunter). Flak: a muzzle brake, twin barrels, three and an ammo drum
// (T3), then four barrels, two drums and flak smoke (Flak Curtain). Spotter: a tracer lamp, a lens,
// a flare launcher on the mast (T3), then the searchlight and orbiting eye-sigils (Eye in the Dark).
// The head (the Kindling eye, or the Lantern's window) is always drawn last.
const LE_LEN = (P) => (P.many && P.mt >= 2 ? 17 : P.might ? [22, 24, 25, 26, 28][P.mt] : 22);
const LE_BARRELS = (P) => (P.many ? (P.mt >= 4 ? 4 : P.mt >= 3 ? 3 : P.mt >= 2 ? 2 : 1) : 1);
function eyeSigil(ctx, x, y, t) { circle(ctx, x, y, 3.4); flat(ctx, 'rgba(255,255,255,0.85)', 1); ctx.beginPath(); ctx.ellipse(x, y, 2.2, 1.2, 0, 0, TAU); flat(ctx, '#ffffff', 0.6); circle(ctx, x + Math.cos(t * 2) * 0.6, y, 0.8); ctx.fillStyle = INK; ctx.fill(); glow(ctx, x, y, 6, '#ffffff', 0.4); }
export function longeyeArt(head, headFront) {
  return {
    self: () => [-8, -29, 8, -12],   // the head: the mast is its stand, and the gun is mounted on it
    body(ctx, P, d) {
      const { might, many, craft, mt } = P;
      plinth(ctx, many && mt >= 3 ? 26 : 20, P, d, TEAL, 'brass');
      const top = LTOP;
      if (might && mt >= 3) for (const s of [-1, 1]) line(ctx, [[s * 2, -6], [s * 10, 7]], BRASS, 1.4);
      if (many && mt >= 3) for (const x of [-11, 11]) { rrect(ctx, x - 3, 3, 6, 4.5, 1); ink(ctx, '#6a4a2a', 1, x - 3, x + 3); }   // shell crates
      poly(ctx, [[-3.5, 7], [3.5, 7], [2.2, top], [-2.2, top]]); ink(ctx, TEAL2, 1.8, -3, 3);
      for (const y of [0, -9]) { rrect(ctx, -4.5, y, 9, 2.6, 1); flat(ctx, BRASS, 1); }
      if (might && mt >= 3) for (const y of [-6, 2]) { rrect(ctx, -4.4, y, 8.8, 4, 1); ink(ctx, '#8a96aa', 1.1, -4.4, 4.4); }   // armour plates
      if (might && mt >= 4) for (const y of [-12, -4, 4]) { ctx.beginPath(); ctx.ellipse(0, y, 5.4, 1.6, 0, 0, TAU); flat(ctx, '#e9eef6', 1); }   // capacitor rings
      if (many && mt >= 3) { circle(ctx, -6, -3, 4); ink(ctx, BRASS, 1.4, -10, -2); circle(ctx, -6, -3, 1.6); flat(ctx, '#6a4a2a', 0); }   // ammo drum
      if (many && mt >= 4) { circle(ctx, 6, -1, 3.6); ink(ctx, BRASS, 1.3, 2.4, 9.6); circle(ctx, 6, -1, 1.4); flat(ctx, '#6a4a2a', 0); }
      if (craft && mt >= 3) { ctx.save(); ctx.translate(-4, -4); ctx.rotate(-0.5); rrect(ctx, -2, -10, 4, 10, 1.2); ink(ctx, '#8a3a2a', 1.2, -2, 2); ctx.restore(); }   // flare launcher
      head(ctx, P, d, top);
      const t = top - 17;
      if (mt >= 4) crown(ctx, 0, t + 1, d);
      return t - 7;
    },
    back(ctx, P, st, d) {
      if (P.mt >= 4) groundAura(ctx, d, st.time, 18);
      if (Math.sin(st.ang) <= -0.35) this.gun(ctx, P, st, d);   // pointing up the screen: the gun swings behind the head
      if (P.craft && P.mt >= 4) for (let i = 0; i < 2; i++) { const a = st.time * 1.1 + i * Math.PI; if (Math.sin(a) < 0) eyeSigil(ctx, Math.cos(a) * 13, LTOP - 6 + Math.sin(a) * 4, st.time); }
    },
    gun(ctx, P, st, d) {
      const { might, many, craft, mt } = P, hy = LHY, back = st.recoil * 4, len = LE_LEN(P);
      const barrel = (dy, L, w) => {
        ctx.save(); ctx.translate(0, hy + dy); aimPlane(ctx, st.ang);
        rrect(ctx, -3 - back, -w / 2, L, w, w / 2.2); flat(ctx, STEEL, 1.8);
        rrect(ctx, -3 - back, -w / 2, L, w * 0.4, w / 4); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
        if (many && mt >= 1) { rrect(ctx, L - 6 - back, -w / 2 - 2, 4, w + 4, 1); flat(ctx, '#5a6478', 1.1); }   // a muzzle brake
        else { rrect(ctx, L - 5 - back, -w / 2 - 1.2, 3.5, w + 2.4, 1); flat(ctx, BRASS, 1.2); }
        if (might && mt >= 1) { rrect(ctx, L - 9 - back, -w / 2 - 0.6, 2, w + 1.2, 0.6); flat(ctx, BRASS, 0.8); }
        if (might && mt >= 2) { rrect(ctx, 2 - back, -w / 2 - 3.4, mt >= 3 ? 12 : 9, 2.8, 1.2); flat(ctx, BRASS, 1); }   // a scope
        if (might && mt >= 4) for (let x = 4; x < L - 8; x += 6) { rrect(ctx, x - back, -w / 2 - 0.8, 2, w + 1.6, 0.8); flat(ctx, DMG[d].core, 0.8); }
        if (craft && mt >= 1 && dy === 0) { circle(ctx, 6 - back, -w / 2 - 1.2, 1.4); ctx.fillStyle = '#ff5a4a'; ctx.fill(); }   // the tracer lamp
        ctx.restore();
      };
      const n = LE_BARRELS(P);
      if (n > 1) { for (let i = 0; i < n; i++) barrel((i - (n - 1) / 2) * (n >= 4 ? 3.2 : 4.6), len, n >= 4 ? 3 : 3.8); circle(ctx, 0, hy, 3.8); flat(ctx, BRASS, 1.4); }
      else barrel(0, len, might && mt >= 2 ? 5.5 : 4.6);
    },
    front(ctx, P, st, d) {
      const { might, many, craft, mt } = P, hy = LHY, len = LE_LEN(P);
      if (Math.sin(st.ang) > -0.35) this.gun(ctx, P, st, d);
      if (might && mt >= 4) { const s = 0.5 + 0.5 * Math.sin(st.time * 6); glow(ctx, Math.cos(st.ang) * 14, hy + Math.sin(st.ang) * 14 * FORE, 8 + s * 3, '#ffffff', 0.3 + s * 0.25); for (const y of [-12, -4, 4]) glow(ctx, 0, y, 6, '#ffffff', 0.3 + s * 0.2); }
      if (many && mt >= 4) for (let i = 0; i < 3; i++) { const u = (st.time * 0.8 + i / 3) % 1, a = st.ang; circle(ctx, Math.cos(a) * (len + 2 + u * 8), hy + Math.sin(a) * (len + 2) * FORE - u * 6, 2 + u * 2.5); ctx.fillStyle = `rgba(140,140,150,${0.6 * (1 - u)})`; ctx.fill(); }
      if (craft && mt >= 1) glow(ctx, Math.cos(st.ang) * 6, hy + Math.sin(st.ang) * 6 * FORE - 2, 3.5, '#ff5a4a', 0.5);
      if (craft && mt >= 3) { const fx = -4 - Math.sin(0.5) * 10, fy = -4 - Math.cos(0.5) * 10; glow(ctx, fx, fy, 6, '#ffd27a', 0.5 + Math.sin(st.time * 7) * 0.2); }
      if (craft && mt >= 4) { // Eye in the Dark: a searchlight sweeps out of the head; eye-sigils orbit it
        const ly = LTOP - 5, ax = Math.cos(st.ang), ay = Math.sin(st.ang) * 0.6;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(ax * 52 - ay * 15, ly + ay * 52 + 11); ctx.lineTo(ax * 52 + ay * 15, ly + ay * 52 - 11); ctx.fill(); ctx.restore();
        for (let i = 0; i < 2; i++) { const a = st.time * 1.1 + i * Math.PI; if (Math.sin(a) >= 0) eyeSigil(ctx, Math.cos(a) * 13, LTOP - 6 + Math.sin(a) * 4, st.time); }
      }
      // a little brass vane on the roof turns in the wind; a red watch-light blinks on the mast
      const v = Math.cos(st.time * 1.3 + (st.id || 0));
      line(ctx, [[0, LTOP - 16], [0, LTOP - 20]], BRASS, 0.7);
      ctx.save(); ctx.translate(0, LTOP - 20); ctx.scale(v, 1); poly(ctx, [[0, -1.6], [5, 0], [0, 1.6]]); flat(ctx, BRASS, 0.8); ctx.restore();
      if (((st.time + (st.id || 0) * 0.7) % 1.8) < 0.25) { circle(ctx, 3.2, -9, 1.2); ctx.fillStyle = '#ff5a4a'; ctx.fill(); glow(ctx, 3.2, -9, 5, '#ff5a4a', 0.6); }
      if (headFront && !FACE.skip) headFront(ctx, P, st, d, LTOP);   // the face, last
    },
    muzzle(P, ang, out) { const L = LE_LEN(P); out[0] = Math.cos(ang) * (L - 3); out[1] = LHY + Math.sin(ang) * (L - 3) * FORE; return out; },
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
// Pyre: a hotter pot, flames over it, a flame crest and bands (T3), then white-hot Wildfire.
// Dragon's Breath: a bellows on the post, two spouts, a fuel tank and hose (Firehose), then three
// spouts all round. Ash: soot, smoke, a chimney hood (T3), then the Ashen Brand.
const censer = {
  self: () => [-3, -16, 13, 0],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    plinth(ctx, 26, P, d, SOOT, 'embers');
    if (many && mt >= 1 && mt < 3) { ctx.beginPath(); ctx.ellipse(-14, -6, 3, 4.2, 0, 0, TAU); ink(ctx, '#8a5a32', 1.2, -17, -11); line(ctx, [[-14, -10], [-14, -13]], '#6a4a2a', 1); }   // a bellows
    if (many && mt >= 3) fuelTank(ctx, -15, 6, 1.1);
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
    for (const k of [-0.5, 0.5]) line(ctx, [[5 + k * R, CY - R * 0.4], [5 + k * R * 0.8, CY + R * 0.7]], might && mt >= 1 ? '#ffe08a' : '#ff9a3a', might && mt >= 1 ? 0.9 : 0.6);
    if (craft && mt === 1) for (const [x, y] of [[2, -11], [8, -6], [3, -3]]) { circle(ctx, x, y, 1.5); ctx.fillStyle = 'rgba(30,24,28,0.75)'; ctx.fill(); }   // soot
    rrect(ctx, 5 - R * 0.75, CY - R - 1.5, R * 1.5, 3, 1); flat(ctx, '#3a3440', 1.2);
    // the light: a fire drop in the pot's mouth
    const x = 5, y = CY + 1, r = 4.8;
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.4); ctx.quadraticCurveTo(x + r * 1.2, y + r * 0.3, x, y + r); ctx.quadraticCurveTo(x - r * 1.2, y + r * 0.3, x, y - r * 1.4);
    const gd = ctx.createRadialGradient(x - 1.5, y - 1.5, 0, x, y, r * 1.2); gd.addColorStop(0, '#ffffff'); gd.addColorStop(0.35, '#ffb070'); gd.addColorStop(1, DMG[d].core);
    ctx.fillStyle = gd; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
    glyph(ctx, 'flame', x, y + 0.7, r * 0.9, shade(DMG[d].deep, -0.3));
    if (might && mt >= 3) for (let i = 0; i < 3; i++) { const fx = 1 + i * 4; ctx.beginPath(); ctx.moveTo(fx - 2, CY - R - 1); ctx.quadraticCurveTo(fx - 1, CY - R - 6, fx + 0.5, CY - R - 8 - (i % 2) * 2); ctx.quadraticCurveTo(fx + 2, CY - R - 4, fx + 2, CY - R - 1); ctx.closePath(); flat(ctx, mt >= 4 ? '#fff0c0' : '#ffb347', 1); }   // a flame crest
    if (craft && mt >= 3) { poly(ctx, [[5 - R * 0.8, CY - R - 1], [5 + R * 0.8, CY - R - 1], [7, CY - R - 6], [3, CY - R - 6]]); ink(ctx, '#3a3440', 1.3, -R, R); rrect(ctx, 3.5, -23.5, 3, CY - R - 6 + 23.5, 0.8); flat(ctx, '#3a3440', 1); }   // a chimney hood
    if (many && mt >= 3) line(ctx, [[-13, 0], [-6, -2], [-1, -6]], '#6a4a2a', 1.3);   // the hose
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
    if (might && mt >= 4) glow(ctx, 5, CY - 4, 16, '#fff0c0', 0.3 + Math.sin(st.time * 5) * 0.08);   // Wildfire: white-hot
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

// ==== Mortar Kiln (Lobber): a brick kiln-lantern with a mortar mouth on top =====================
// Same paths as the Kindling: Big Shells grows an armoured howitzer, Rapid Loader a rack then a
// battery, Cinder a furnace with a chimney then an Inferno. Tubes sit behind the kiln's dome.
const BRICK = '#a8502e';
function lMortarTubes(P) {
  const { might, many, mt } = P;
  if (many && mt >= 4) return [[-6, -12, 5, 12], [0, -14, 5, 13], [6, -12, 5, 12], [-9, -8, 5, 11], [9, -8, 5, 11]];
  if (many && mt >= 3) return [[-6, -11, 5.5, 13], [0, -13, 5.5, 14], [6, -11, 5.5, 13]];
  if (might && mt >= 3) return [[0, -12, mt >= 4 ? 12 : 10, mt >= 4 ? 17 : 15]];
  return [[0, -12, might ? 7 + mt : 7, many && mt >= 2 ? 17 : 13]];
}
const lMortar = {
  self: () => [-12, -15, 12, 7],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    plinth(ctx, 30, P, d, '#5a4a48');
    if (might && mt >= 2) { shell(ctx, -15, 4, 3.4); shell(ctx, -12, 6.5, 3.4); }
    if (many && mt >= 1) { rrect(ctx, 12, -4, 5, 10, 1); ink(ctx, '#6a4a2a', 1.1, 12, 17); for (let i = 0; i < 3; i++) shell(ctx, 14.5, -6 + i * 3.4, 1.7); }
    if (many && mt >= 4) crate(ctx, -15, 2);
    if (craft && mt >= 2) cinderPool(ctx, 0, 12.5, 9, 0);
    if (craft && mt >= 3) chimney(ctx, 10, -6, mt >= 4 ? 18 : 15);
    // the kiln: a brick dome with an arched fire-window
    ctx.beginPath(); ctx.moveTo(-12, 7); ctx.lineTo(-12, -5); ctx.quadraticCurveTo(-12, -15, 0, -15); ctx.quadraticCurveTo(12, -15, 12, -5); ctx.lineTo(12, 7); ctx.closePath();
    ink(ctx, craft && mt >= 4 ? '#8a3018' : BRICK, 2, -12, 12);
    ctx.save(); ctx.beginPath(); ctx.moveTo(-12, 7); ctx.lineTo(-12, -5); ctx.quadraticCurveTo(-12, -15, 0, -15); ctx.quadraticCurveTo(12, -15, 12, -5); ctx.lineTo(12, 7); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = 'rgba(60,24,12,0.5)'; ctx.lineWidth = 0.8;
    for (let y = -11, r = 0; y < 7; y += 4, r++) { ctx.beginPath(); ctx.moveTo(-12, y); ctx.lineTo(12, y); ctx.stroke(); for (let x = -12 + (r % 2) * 3; x < 12; x += 6) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 4); ctx.stroke(); } }
    ctx.restore();
    if (might && mt >= 3) for (const y of [-8, 3]) { rrect(ctx, -12.6, y, 25.2, 2.8, 1); flat(ctx, mt >= 4 ? GOLD : '#7a8090', 1); }
    if (might && mt >= 1) for (const x of [-12, 12]) { rrect(ctx, x - 1.6, -6, 3.2, 13, 1); flat(ctx, '#7a8090', 0.9); }
    ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(-5, -2); ctx.quadraticCurveTo(-5, -7, 0, -7); ctx.quadraticCurveTo(5, -7, 5, -2); ctx.lineTo(5, 4); ctx.closePath(); flat(ctx, '#2a1410', 1.4);
    pane(ctx, 0, -1, 7.4, 8.6, d);
    if (craft && mt >= 2) lavaCracks(ctx, [[[-10, -6], [-8, -2], [-10, 2]], [[9, -9], [7, -5], [9, -1]]], mt >= 4 ? '#ffe08a' : '#ff9a3a', 0.7);
    if (mt >= 4) crown(ctx, -12, -15, d, 0.9);
    return -36;
  },
  back(ctx, P, st, d) {
    const { might, craft, mt } = P, lean = tubeLean(st.ang);
    if (mt >= 4) groundAura(ctx, d, st.time, 24);
    if (craft && mt >= 3) smokePuffs(ctx, 10, mt >= 4 ? -24 : -21, 3, st.time);
    for (const [x, y, w, L] of lMortarTubes(P)) tube(ctx, x, y - st.recoil * 1.5, lean, w, L, { fill: '#4a4f60', bands: might ? Math.min(3, 1 + (mt >= 2) + (mt >= 3)) : 1, gold: might && mt >= 4, hot: craft ? Math.min(1, mt * 0.3) : 0 });
  },
  front(ctx, P, st, d) {
    const { might, craft, mt } = P;
    flicker(ctx, 0, -1, 9 + mt * 1.5, d, st.time + (st.id || 0));
    if (craft && mt >= 2) glow(ctx, 0, 12.5, 11 + Math.sin(st.time * 3), '#ff7a2a', 0.45);
    if (might && mt >= 4) for (const x of [-12, 12]) glow(ctx, x, 12, 5, '#ffb347', 0.4 + Math.sin(st.time * 4 + x) * 0.2);
    if (craft && mt >= 4) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { const x = -7 + i * 4.6, hh = 7 * (0.7 + 0.3 * Math.sin(st.time * 11 + i * 1.9)); ctx.fillStyle = i % 2 ? 'rgba(255,170,50,0.85)' : 'rgba(255,90,40,0.85)'; ctx.beginPath(); ctx.ellipse(x, -14 - hh * 0.4, 2.2, hh * 0.55, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
      risingMotes(ctx, st.time, 6, -11, 11, -12, 20, '#ffb347', 1.5, 1.2, st.id || 0);
    }
  },
  muzzle(P, ang, out) { const t = lMortarTubes(P), [x, y, w, L] = t[Math.floor(t.length / 2)], lean = tubeLean(ang); out[0] = x + Math.sin(lean) * L; out[1] = y - Math.cos(lean) * L; return out; },
};

// ==== Storm Coil (Arcer): a slender storm-slate lantern with copper coils and horn prongs ========
// Overcharge: a floating orb, a charged sun-orb, then a thundercloud. Forking: more prongs, pylons
// beside it, then a ring of four. Static: capacitor jars, static, gyroscope rings, an Ion Storm.
const SLATE = '#4f5a88';
function lCoilTips(P) {
  const { many, mt } = P;
  if (many && mt >= 2) return [[-10, -27], [-4, -31], [4, -31], [10, -27]];
  if (many && mt >= 1) return [[-9, -27], [0, -32], [9, -27]];
  return [[-8, -28], [8, -28]];
}
const L_COIL_ORB = (P) => (P.might && P.mt >= 3 ? [0, -31] : [0, -27]);
function lCoilPylons(P) { const { many, mt } = P; return many && mt >= 4 ? [[-12, 3, 'b'], [12, 3, 'b'], [-17, 10, 'f'], [17, 10, 'f']] : many && mt >= 3 ? [[-16, 9, 'f'], [16, 9, 'f']] : []; }
const lCoil = {
  self: () => [-6, -20, 6, 7],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    plinth(ctx, many && mt >= 3 ? 30 : 22, P, d, '#3a4160');
    if (craft && mt >= 1) for (const x of mt >= 2 ? [-12, 12] : [12]) { rrect(ctx, x - 2.5, -2, 5, 8, 1.5); ctx.fillStyle = 'rgba(200,180,255,0.35)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); rrect(ctx, x - 1.8, -3.6, 3.6, 2, 0.6); flat(ctx, COPPER, 0.8); }
    for (const [x0, y0] of lCoilTips(P)) prong(ctx, Math.sign(x0) * 3 || 0, -20, x0, y0 + 2, might && mt >= 2 ? 3 : 2.4);
    rrect(ctx, -6, -21, 12, 28, 3); ink(ctx, SLATE, 2, -6, 6);
    for (const y of might && mt >= 2 ? [-18, -12, 3] : [-17, 3]) { ctx.beginPath(); ctx.ellipse(0, y, 7, 1.8, 0, 0, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = COPPER; ctx.lineWidth = 1.6; ctx.stroke(); }
    pane(ctx, 0, -6, 8, 14, d);
    rrect(ctx, -7.5, -23, 15, 3, 1); flat(ctx, '#2e3458', 1.2);
    if (mt >= 4) crown(ctx, 0, -23, d, 0.95);
    return -40;
  },
  back(ctx, P, st, d) {
    const { might, craft, mt } = P;
    if (mt >= 4) groundAura(ctx, d, st.time, 24);
    if (might && mt >= 4) cloud(ctx, 0, -30, 18, true);
    for (const [x, y, side] of lCoilPylons(P)) if (side === 'b') pylon(ctx, x, y, 16, d);
    if (craft && mt >= 3) for (let i = 0; i < (mt >= 4 ? 3 : 2); i++) gyro(ctx, 0, 4, 14 + i * 2.5, 3.2 + i * 0.8, Math.sin(st.time * (i % 2 ? -1.4 : 1.1) * 0.5 + i) * 0.16, 'back', i === 2 ? COPPER : P_BRASS, 1.2);
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, tips = lCoilTips(P), t = st.time;
    flicker(ctx, 0, -6, 10 + mt * 1.5, d, t + (st.id || 0));
    for (const [x, y] of tips) orb(ctx, x, y, might && mt >= 1 ? 2.8 : 2.2, d, t + x);
    for (let i = 0; i < tips.length - 1; i++) zap(ctx, tips[i][0], tips[i][1], tips[i + 1][0], tips[i + 1][1], t, 2.5);
    if (might && mt >= 2) {
      const [ox, oy] = L_COIL_ORB(P), R = mt >= 4 ? 5.5 : mt >= 3 ? 5 : 3.4;
      if (mt === 3) { ctx.save(); ctx.translate(ox, oy); ctx.rotate(t * 0.8); star(ctx, 0, 0, R + 4, R + 1, 10, 0); flat(ctx, '#d0a8ff', 1); ctx.restore(); }
      orb(ctx, ox, oy, R, d, t, 1.2);
      for (const [x, y] of [tips[0], tips[tips.length - 1]]) zap(ctx, ox, oy, x, y, t + x, 3);
      if (mt >= 4 && ((t * 2.3) % 1) < 0.35) { zap(ctx, -9, -31, -14, -16, t, 4, '#ffffff', 1.6); zap(ctx, 9, -31, 15, -14, t + 1, 4, '#ffffff', 1.6); }
    }
    for (const [x, y, side] of lCoilPylons(P)) {
      const tip = side === 'f' ? pylon(ctx, x, y, 14, d) : [x, y - 18];
      orb(ctx, tip[0], tip[1], 2.2, d, t + x);
      const near = tips[x < 0 ? 0 : tips.length - 1]; zap(ctx, tip[0], tip[1], near[0], near[1], t + y, 3);
    }
    if (many && mt >= 4) { const pl = lCoilPylons(P); zap(ctx, pl[2][0], pl[2][1] - 16, pl[0][0], pl[0][1] - 18, t, 3); zap(ctx, pl[3][0], pl[3][1] - 16, pl[1][0], pl[1][1] - 18, t + 2, 3); }
    if (craft && mt >= 1) for (const x of mt >= 2 ? [-12, 12] : [12]) glow(ctx, x, 2, 5, DMG[d].core, 0.5 + Math.sin(t * 6 + x) * 0.2);
    if (craft && mt >= 2 && ((t * 1.7) % 1) < 0.3) { zap(ctx, -12, -4, -6, -14, t, 1.5, '#e8d4ff', 0.9); zap(ctx, 12, -4, 6, -14, t + 1, 1.5, '#e8d4ff', 0.9); }
    if (craft && mt >= 3) for (let i = 0; i < (mt >= 4 ? 3 : 2); i++) gyro(ctx, 0, 4, 14 + i * 2.5, 3.2 + i * 0.8, Math.sin(st.time * (i % 2 ? -1.4 : 1.1) * 0.5 + i) * 0.16, 'front', i === 2 ? COPPER : P_BRASS, 1.2);
    if (craft && mt >= 4) for (let i = 0; i < 4; i++) { const a = t * 2 + (i / 4) * TAU; orb(ctx, Math.cos(a) * 18, 4 + Math.sin(a) * 4, 1.6, d, t + i, 0.7); }
  },
  muzzle(P, ang, out) { if (P.might && P.mt >= 2) { const o = L_COIL_ORB(P); out[0] = o[0]; out[1] = o[1]; } else { const tips = lCoilTips(P), tp = tips[Math.cos(ang) >= 0 ? tips.length - 1 : 0]; out[0] = tp[0]; out[1] = tp[1]; } return out; },
};

// ==== Prism (Focuser): a great crystal held in a gold claw over a stand ==========================
// Focus: a polished facet, a gold band, a great lens in a ring beside it, then a sun disc behind.
// Refraction: orbiting shards up to a Kaleidoscope. Afterglow: a halo, a star, then a Supernova.
const LP_Y = -16;
function prismShards(P) { const { many, mt } = P; return many ? [0, 1, 2, 2, 4, 6][mt + 1] || 0 : 0; }
const lPrism = {
  self: () => [-8, -30, 8, 7],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    plinth(ctx, 22, P, d, '#5a4a6a');
    poly(ctx, [[-3, 7], [3, 7], [2, -4], [-2, -4]]); ink(ctx, '#5a4a6a', 1.6, -3, 3);       // the stand
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(s * 9, -6, s * 7, -13); ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ctx.stroke(); ctx.strokeStyle = P_GOLD; ctx.lineWidth = 2; ctx.stroke(); }   // the claw
    const sz = 1 + (might ? mt * 0.05 : 0);
    gem(ctx, 0, LP_Y, 8 * sz, 13 * sz, d, craft && mt >= 4 ? '#fff6c0' : undefined);
    if (might && mt >= 2) { ctx.beginPath(); ctx.moveTo(-7.5 * sz, LP_Y - 2); ctx.lineTo(7.5 * sz, LP_Y - 2); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = P_GOLD; ctx.lineWidth = 1.8; ctx.stroke(); }
    if (might && mt >= 3) line(ctx, [[2, -4], [12, -8], [12, -16]], P_GOLD, 1.2);
    if (mt >= 4) crown(ctx, 0, LP_Y - 14 * sz - 1, d, 0.95);
    return -38;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, n = prismShards(P);
    if (mt >= 4 && !craft) groundAura(ctx, d, t, 24);
    if (might && mt >= 4) sunDisc(ctx, 0, LP_Y - 4, 13, t, 14);
    if (craft && mt >= 3) starBurst(ctx, 0, LP_Y, mt >= 4 ? 19 : 14, t, 1);
    if (craft && mt >= 4) for (let i = 0; i < 2; i++) { const u = (t * 0.6 + i * 0.5) % 1; ctx.globalAlpha = 1 - u; ctx.strokeStyle = '#fff6c0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, 11, 8 + u * 20, 3 + u * 7, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    for (let i = 0; i < n; i++) { const a = t * 1.2 + (i / n) * TAU; if (Math.sin(a) < 0) shard(ctx, Math.cos(a) * 15, LP_Y + Math.sin(a) * 5, mt >= 4 ? 1.2 : 1, a); }
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, n = prismShards(P), D = DMG[d];
    glow(ctx, 0, LP_Y, 13 + mt * 2, D.core, 0.35 + (craft ? mt * 0.08 : 0) + Math.sin(t * 6) * 0.05);
    if (might && mt === 1) twinkle(ctx, -3, LP_Y - 7, 2.6, Math.sin(t * 2.5) * 1.5 - 0.2);
    if (might && mt >= 3) { lensRing(ctx, 13, -21, mt >= 4 ? 6.5 : 5.5); glow(ctx, 13, -21, 8, D.core, 0.4 + Math.sin(t * 4) * 0.1); }
    if (many && mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,240,170,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, LP_Y, 17, 6, 0, 0, Math.PI); ctx.stroke(); ctx.restore(); }
    for (let i = 0; i < n; i++) { const a = t * 1.2 + (i / n) * TAU; if (Math.sin(a) >= 0) shard(ctx, Math.cos(a) * 15, LP_Y + Math.sin(a) * 5, mt >= 4 ? 1.2 : 1, a); }
    if (craft && mt >= 2 && !FACE.skip) { ctx.beginPath(); ctx.ellipse(0, LP_Y - 16, 6, 2, 0, 0, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.stroke(); ctx.strokeStyle = '#fff3a0'; ctx.lineWidth = 1.6; ctx.stroke(); }
  },
  muzzle(P, ang, out) { if (P.might && P.mt >= 3) { out[0] = 13; out[1] = -21; } else { out[0] = 0; out[1] = LP_Y - 11; } return out; },
};

// ==== Beacon (Emitter): a tall lamp-post with a banner =========================================
// War Drum: a drum at its foot, then a great drum and a warhorn with war banners. Lighthouse: a
// lighthouse cap with a sweeping beam, then twin beams. Tithe: coins, a coffer, a golden hearth.
const LB_LAMP = (P) => (P.many && P.mt >= 3 ? [0, -31] : [0, -28]);
const lBeacon = {
  self: () => [-5, -24, 5, 7],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P, L = LB_LAMP(P);
    plinth(ctx, might && mt >= 3 || craft && mt >= 3 ? 30 : 24, P, d, '#6a4a58');
    if (might && mt >= 4) for (const x of [-16, -12]) line(ctx, [[x, 9], [x, -22]], '#6a4a2a', 1.1);
    if (might && mt >= 1) drum(ctx, mt >= 3 ? -13 : -10, 5, mt >= 3 ? 5.5 : 3.6, mt >= 4);
    if (might && mt >= 4) warhorn(ctx, 13, 2, 0.85);
    if (craft && mt >= 1 && mt < 3) coins(ctx, 10, 8, mt + 2);
    if (craft && mt >= 3) chest(ctx, 13, 9, mt >= 4 ? 12 : 10, mt >= 4);
    rrect(ctx, -4, -24, 8, 31, 1.5); ink(ctx, '#7a5a68', 1.8, -4, 4);   // the post
    rrect(ctx, -5, -6, 10, 2.4, 1); flat(ctx, P_BRASS, 1);
    ctx.beginPath(); ctx.moveTo(4, -21); ctx.lineTo(15, -19); ctx.lineTo(11.5, -15.5); ctx.lineTo(15, -12); ctx.lineTo(4, -10); ctx.closePath();
    ink(ctx, DMG[d].deep, 1.4, 4, 15); glyph(ctx, 'heart', 8.5, -15.5, 3.2, '#ffd0e6');
    pane(ctx, 0, 0, 5, 8, d);
    rrect(ctx, L[0] - 5.5, L[1] - 3, 11, 9, 2); ink(ctx, '#5a4a5a', 1.6, -5.5, 5.5);   // the lamp-house
    poly(ctx, [[L[0] - 7, L[1] - 3], [L[0] + 7, L[1] - 3], [L[0], L[1] - (many && mt >= 3 ? 10 : 7)]]); ink(ctx, many && mt >= 3 ? '#c03a5a' : '#5a4a5a', 1.6, -7, 7);
    if (many && mt >= 3) for (let i = -1; i <= 1; i++) line(ctx, [[L[0] + i * 4, L[1] - 3], [L[0] + i * 4, L[1] + 6]], '#3a3040', 0.7);
    if (mt >= 4) crown(ctx, 0, -24, d, 0.9);
    return -40;
  },
  back(ctx, P, st, d) {
    const { many, mt } = P, t = st.time, L = LB_LAMP(P);
    if (mt >= 4) groundAura(ctx, d, t, 24);
    if (many && mt >= 3) { beam(ctx, L[0], L[1] + 1, t * 1.2, 36, 8, 0.22); if (mt >= 4) beam(ctx, L[0], L[1] + 1, t * 1.2 + Math.PI, 36, 8, 0.22); }
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, L = LB_LAMP(P), beat = Math.max(0, Math.sin(t * 6)) ** 4;
    if (might && mt >= 4) { pennant(ctx, -16, 9, -22, DMG[d].core, t); pennant(ctx, -12, 9, -19, '#c03a5a', t + 1); }
    if (might && mt >= 2) glow(ctx, mt >= 3 ? -13 : -10, 3, 7 + beat * 6, DMG[d].core, 0.2 + beat * 0.35);
    if (craft && mt >= 3) { glow(ctx, 13, 5, mt >= 4 ? 12 : 8, '#ffcf4a', 0.45 + Math.sin(t * 3) * 0.1); risingMotes(ctx, t, mt >= 4 ? 6 : 3, 8, 18, 4, 14, '#ffcf4a', 1.6, 1.1, st.id || 0); }
    flicker(ctx, 0, 0, 7, d, t + (st.id || 0));
    if (!FACE.skip) {
      const r = many ? 3.6 + mt * 0.5 : 3.6 + (craft && mt >= 4 ? 1 : 0);
      glow(ctx, L[0], L[1] + 1.5, r * 3.5 * (0.9 + beat * 0.2), DMG[d].core, 0.6);
      circle(ctx, L[0], L[1] + 1.5, r); flat(ctx, DMG[d].core, 1.4);
      circle(ctx, L[0] - 1, L[1] + 0.5, r * 0.4); ctx.fillStyle = '#fff'; ctx.fill();
    }
  },
  muzzle(P, ang, out) { const L = LB_LAMP(P); out[0] = L[0]; out[1] = L[1] + 1.5; return out; },
};

export const LANTERNS = { bolt, mortar: lMortar, rime, coil: lCoil, longeye, censer, prism: lPrism, beacon: lBeacon };
