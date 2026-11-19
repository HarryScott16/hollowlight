// Direction C: WAYSTONES. Every ward is a rune-carved standing stone that the Hollowlight wakes.
// Slate stone everywhere; carved rune channels glow in the damage colour. Megalith shape = role
// family. Path grammar: MIGHT = the capstone grows massive, MANY = the stone splits into several,
// CRAFT = a large emblem rune / floating relic. Tier ladder: notches cut into the plinth, growth,
// T3 changes the capstone, T4 adds a floating crown-shard and a halo in its own rune colour.
import { DMG, WARD_SPEC, INK, TAU, mainPath, circle, poly, rrect, star, ink, flat, glow, shadow, notches, secondaryPips, aim, shadeHex, glyph } from './kit.mjs';

const SLATE = '#5d6787', SLATE2 = '#6f7a9c', DARK = '#434b66', MOSS = '#5f8a4a';

function rune(d) { const D = DMG[d]; return D.glow ? D.core : '#dfe6f2'; }

function plinth(ctx, w, P, d) {
  poly(ctx, [[-w / 2, 14], [w / 2, 14], [w / 2 - 2, 7], [-w / 2 + 2, 7]]); ink(ctx, DARK, 2, -w / 2, w / 2);
  notches(ctx, P.mt, 0, 10.5, w - 6, rune(d), 3.2);
  secondaryPips(ctx, P.tiers, P.main, w / 2 - 6, 4.5);
}

// Carved glowing line(s) along a polyline.
function carve(ctx, pts, d, w = 2) {
  const D = DMG[d];
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (D.glow) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = D.core; ctx.globalAlpha = 0.35; ctx.lineWidth = w * 3; ctx.stroke(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  ctx.strokeStyle = rune(d); ctx.lineWidth = w; ctx.stroke();
  ctx.restore();
}
function runeDisc(ctx, x, y, r, d) {
  const D = DMG[d];
  if (D.glow) glow(ctx, x, y, r * 2.6, D.core, 0.5);
  circle(ctx, x, y, r); flat(ctx, DARK, 1.6);
  glyph(ctx, D.glyph, x, y, r * 1.05, rune(d));
}

function shard(ctx, x, y, d, s = 1) {
  const D = DMG[d];
  glow(ctx, x, y, 12 * s, D.glow ? D.core : '#ffffff', 0.55);
  poly(ctx, [[x, y - 7 * s], [x + 4 * s, y], [x, y + 5 * s], [x - 4 * s, y]]); ink(ctx, SLATE2, 1.5, x - 4, x + 4);
  carve(ctx, [[x, y - 4 * s], [x, y + 2.5 * s]], d, 1.4);
}

// ---- 1. Shooter: Bolt = a pillar with a floating arrowhead stone that aims --------------------
function arrowStone(ctx, x, y, st, s, d) {
  const A = aim(st);
  ctx.save(); ctx.translate(x, y); ctx.rotate(A.a); ctx.scale(s, s);
  poly(ctx, [[9, 0], [-3, -5.5], [-1, 0], [-3, 5.5]]); ink(ctx, SLATE2, 1.6, -3, 9);
  carve(ctx, [[-0.5, 0], [6, 0]], d, 1.3);
  ctx.restore();
}
function pillar(ctx, x, w, top, d, cap = true) {
  rrect(ctx, x - w / 2, top, w, 7 - top, 1.5); ink(ctx, SLATE, 2, x - w / 2, x + w / 2);
  if (cap) { poly(ctx, [[x - w / 2 - 1, top + 1], [x + w / 2 + 1, top + 1], [x, top - w * 0.55]]); ink(ctx, SLATE2, 2, x - w / 2, x + w / 2); }
  carve(ctx, [[x, top + 4], [x, 3]], d, 1.6);
}
function bolt(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  plinth(ctx, 24, P, d);
  if (many && mt >= 2) { pillar(ctx, -8, 8, -10, d); arrowStone(ctx, -8, -20, st, 0.8, d); pillar(ctx, 8, 8, -10, d); arrowStone(ctx, 8, -20, st, 0.8, d);
    if (mt >= 4) { pillar(ctx, 0, 10, -17, d); arrowStone(ctx, 0, -28, st, 1, d); return -32; } return -24; }
  pillar(ctx, 0, 13, -16, d);
  if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -5, 5, 3, 0, 0, TAU); flat(ctx, DARK, 1.3); circle(ctx, 0.8, -5, 1.8); ctx.fillStyle = rune(d); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -5, 5, 3, 0, 0, TAU); ctx.strokeStyle = rune(d); ctx.lineWidth = 1.2; ctx.stroke(); }
  if (might && mt >= 2) for (const y of [-12, 0]) { rrect(ctx, -7.5, y, 15, 3, 1); flat(ctx, '#8f6b47', 1.1); }
  arrowStone(ctx, 0, -29, st, might ? (mt >= 4 ? 1.9 : mt >= 2 ? 1.4 : 1.1) : 1.1, d);
  if (craft && mt >= 4) { ctx.save(); ctx.translate(15, -30); poly(ctx, [[0, -4.5], [3.6, 0], [0, 4.5], [-3.6, 0]]); flat(ctx, '#ffffff', 1.3); circle(ctx, 0, 0, 6.5); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke(); ctx.restore(); }
  return might && mt >= 4 ? -40 : -36;
}

// ---- 2. Lobber: Mortar = a wide stone cauldron on stubby legs -----------------------------------
function bowl(ctx, x, y, w, d, P) {
  const { main, mt } = P;
  poly(ctx, [[x - w, y - 9], [x + w, y - 9], [x + w * 0.7, y + 4], [x - w * 0.7, y + 4]]); ink(ctx, SLATE, 2.2, x - w, x + w);
  ctx.beginPath(); ctx.ellipse(x, y - 9, w, w * 0.28, 0, 0, TAU); ink(ctx, DARK, 2, x - w, x + w);
  ctx.beginPath(); ctx.ellipse(x, y - 9, w * 0.78, w * 0.19, 0, 0, TAU); glow(ctx, x, y - 10, w * 1.3, DMG[d].core, 0.45); ctx.beginPath(); ctx.ellipse(x, y - 9, w * 0.78, w * 0.19, 0, 0, TAU); flat(ctx, DMG[d].core, 1);
  carve(ctx, [[x - w * 0.6, y - 3], [x - w * 0.2, y], [x + w * 0.2, y - 3], [x + w * 0.6, y]], d, 1.5);
  if (main === 0 && mt >= 2) for (const yy of [y - 6, y + 1]) { ctx.beginPath(); ctx.moveTo(x - w * 0.9 + (yy - y + 9) * 0.25, yy); ctx.lineTo(x + w * 0.9 - (yy - y + 9) * 0.25, yy); ctx.strokeStyle = '#8f6b47'; ctx.lineWidth = 2.2; ctx.stroke(); }
}
function mortar(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  plinth(ctx, 30, P, d);
  for (const x of [-9, 9]) { rrect(ctx, x - 3, 1, 6, 7, 1); ink(ctx, DARK, 1.6, x - 3, x + 3); }
  if (many && mt >= 2) { if (mt >= 4) { bowl(ctx, -9, 3, 8, d, P); bowl(ctx, 9, 3, 8, d, P); bowl(ctx, 0, -8, 9, d, P); return -26; } bowl(ctx, -8, 1, 9, d, P); bowl(ctx, 9, 1, 9, d, P); return -16; }
  const w = might ? (mt >= 4 ? 19 : mt >= 2 ? 16.5 : 15) : 15;
  bowl(ctx, 0, 1, w, d, P);
  runeDisc(ctx, 0, -2, 3.8, d);
  if (craft && mt >= 2) { for (let i = 0; i < (mt >= 4 ? 4 : 2); i++) { const x = -10 + i * (20 / Math.max(1, (mt >= 4 ? 3 : 1))); ctx.beginPath(); ctx.moveTo(x - 1.6, -4); ctx.quadraticCurveTo(x, 6, x, 9); ctx.quadraticCurveTo(x + 1.6, 6, x + 1.6, -4); flat(ctx, DMG.fire.core, 1); }
    for (let i = 0; i < (mt >= 4 ? 3 : 2); i++) { circle(ctx, 4 + i * 2, -18 - i * 5.5, 2.8 + i); ctx.fillStyle = 'rgba(66,60,74,0.8)'; ctx.fill(); } }
  return -14 - (might && mt >= 4 ? 4 : 0) - (craft && mt >= 4 ? 6 : 0);
}

// ---- 3. Pulser: Rime = a domed boulder with a carved ring, cold mist round it -------------------
function rime(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  plinth(ctx, 28, P, d);
  const w = might && mt >= 3 ? 15 : 13, cy = -2;
  if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, cy - 6, w + 9, 5, 0, Math.PI, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 3; ctx.stroke(); }
  if (many && mt >= 2) { const n = mt >= 4 ? 7 : 5; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42, L = w + (mt >= 4 ? 11 : 8);
    poly(ctx, [[Math.cos(a - 0.2) * w * 0.85, cy + Math.sin(a - 0.2) * w * 0.85], [Math.cos(a) * L, cy + Math.sin(a) * L], [Math.cos(a + 0.2) * w * 0.85, cy + Math.sin(a + 0.2) * w * 0.85]]); flat(ctx, '#bdeefa', 1.4); } }
  glow(ctx, 0, cy - 4, w + 10, DMG[d].core, 0.35);
  ctx.beginPath(); ctx.moveTo(-w, 7); ctx.bezierCurveTo(-w, cy - w * 1.5, w, cy - w * 1.5, w, 7); ctx.closePath(); ink(ctx, SLATE, 2.2, -w, w);
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, cy - 2, w * 0.75, 3, 0, 0, Math.PI); ctx.restore();
  carve(ctx, [[-w * 0.8, cy + 1], [-w * 0.3, cy + 3], [w * 0.3, cy + 3], [w * 0.8, cy + 1]], d, 1.8);
  if (might && mt >= 2) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + Math.PI / 6; ctx.lineTo(Math.cos(a) * (w + 4), cy - 3 + Math.sin(a) * (w + 1)); } ctx.closePath(); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 2.5; ctx.stroke(); }
  runeDisc(ctx, 0, cy - 7, 5, d);
  if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, cy - 6, w + 9, 5, 0, 0, Math.PI); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 3; ctx.stroke();
    if (mt >= 4) for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; star(ctx, Math.cos(a) * (w + 9), cy - 6 + Math.sin(a) * 5, 3, 1.2, 6); flat(ctx, '#ffffff', 0.8); } }
  return cy - w * 1.15 - (many && mt >= 4 ? 10 : 2);
}

// ---- 4. Arcer: Coil = a forked stone (U / trident) with an arc between the tips -----------------
function coil(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  plinth(ctx, 24, P, d);
  const n = many ? (mt >= 4 ? 4 : mt >= 2 ? 3 : 2) : 2;
  const spread = many && mt >= 4 ? 15 : 10, h = might && mt >= 3 ? 30 : 26, pw = might && mt >= 2 ? 6.5 : 5.5;
  rrect(ctx, -spread - pw / 2, -5, spread * 2 + pw, 12, 2); ink(ctx, SLATE, 2, -spread, spread);
  const tips = [];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1) - 0.5) * spread * 2, hh = h - Math.abs(i / (n - 1) - 0.5) * 6;
    poly(ctx, [[x - pw / 2, -4], [x + pw / 2, -4], [x + pw * 0.3, -hh + 2], [x, -hh], [x - pw * 0.3, -hh + 2]]); ink(ctx, SLATE2, 1.8, x - pw / 2, x + pw / 2);
    carve(ctx, [[x, -6], [x, -hh + 5]], d, 1.3);
    tips.push([x, -hh]);
  }
  ctx.strokeStyle = '#f0dcff'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < tips.length - 1; i++) { const [x0, y0] = tips[i], [x1, y1] = tips[i + 1]; ctx.moveTo(x0, y0); ctx.lineTo((x0 + x1) / 2 - 1, Math.min(y0, y1) + 5); ctx.lineTo((x0 + x1) / 2 + 1.5, Math.min(y0, y1) + 2); ctx.lineTo(x1, y1); } ctx.stroke();
  for (const [x, y] of tips) { glow(ctx, x, y, 6, DMG[d].core, 0.6); circle(ctx, x, y, 2); flat(ctx, DMG[d].core, 1); }
  if (craft && mt >= 2) for (const y of [-14, -20]) { ctx.beginPath(); ctx.ellipse(0, y, spread + 5, 2.6, 0, 0, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.stroke(); ctx.strokeStyle = SLATE2; ctx.lineWidth = 2; ctx.stroke(); }
  runeDisc(ctx, 0, 1, 3.8, d);
  if (might && mt >= 2) { const R = mt >= 4 ? 6.5 : 4.5; glow(ctx, 0, -h * 0.6, R * 3, DMG[d].core, 0.6); circle(ctx, 0, -h * 0.6, R); flat(ctx, DMG[d].core, 1.6); glyph(ctx, 'zig', 0, -h * 0.6, R, DMG[d].deep); }
  if (craft && mt >= 4) for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.4; ctx.strokeStyle = '#f0dcff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14, -12 + Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * 19, -12 + Math.sin(a) * 9); ctx.stroke(); }
  return -h - 4;
}

// ---- 5. Spotter: Longeye = a tall needle obelisk with an eye near the tip ------------------------
function longeye(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  plinth(ctx, 18, P, d);
  const top = might ? (mt >= 4 ? -40 : mt >= 2 ? -36 : -32) : -32;
  poly(ctx, [[-5.5, 7], [5.5, 7], [3.2, top + 6], [0, top], [-3.2, top + 6]]); ink(ctx, SLATE, 2, -5, 5);
  carve(ctx, [[0, 3], [0, top + 16]], d, 1.4);
  const A = aim(st), ey = top + 11;
  ctx.beginPath(); ctx.ellipse(0, ey, 4.2, 2.8, 0, 0, TAU); flat(ctx, '#ffffff', 1.3);
  circle(ctx, A.x * 1.6, ey + A.y * 1.2, 1.7); ctx.fillStyle = INK; ctx.fill();
  if (might && mt >= 2) { poly(ctx, [[-2.4, top + 3], [0, top - 7], [2.4, top + 3]]); flat(ctx, '#dfe6f2', 1.3); }
  if (many && mt >= 2) { const n = mt >= 4 ? 3 : 2; for (let i = 0; i < n; i++) { const y = top + 18 + i * 6; for (const s of [-1, 1]) { poly(ctx, [[s * 3.5, y], [s * 11, y - 5], [s * 4, y + 3.5]]); ink(ctx, SLATE2, 1.4, -4, 4); circle(ctx, s * 11, y - 5, 1.6); flat(ctx, '#dfe6f2', 0.8); } } }
  // a floating sight-stone that aims
  ctx.save(); ctx.translate(A.x * 9, ey + A.y * 9); ctx.rotate(A.a); poly(ctx, [[4, 0], [-2, -2.5], [-2, 2.5]]); flat(ctx, '#dfe6f2', 1.1); ctx.restore();
  if (craft && mt >= 2) { const R = mt >= 4 ? 7 : 5.5, ly = top - 6 - R;
    if (mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(A.x * 44 - A.y * 12, ly + A.y * 44 + 9); ctx.lineTo(A.x * 44 + A.y * 12, ly + A.y * 44 - 9); ctx.fill(); ctx.restore(); }
    ctx.beginPath(); ctx.ellipse(0, ly, R * 1.3, R, 0, 0, TAU); ink(ctx, SLATE2, 1.8, -R, R);
    circle(ctx, A.x * 1.6, ly + A.y, R * 0.6); flat(ctx, '#ffffff', 1.2); circle(ctx, A.x * 2.4, ly + A.y * 1.4, R * 0.28); flat(ctx, INK, 0);
    return ly - R - 2; }
  return top - (might && mt >= 2 ? 9 : 2);
}

// ---- 6. Sprayer: Censer = a carved beast head on a block, breathing fire ------------------------
function censer(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  plinth(ctx, 26, P, d);
  rrect(ctx, -11, -6, 18, 13, 2); ink(ctx, SLATE, 2, -11, 7);
  runeDisc(ctx, -2, 0.5, 3.6, d);
  const A = aim(st);
  const head = (ang, s, oy = 0) => { ctx.save(); ctx.translate(0, -12 + oy); ctx.rotate(ang * 0.55); ctx.scale(s, s);
    poly(ctx, [[-9, -6], [4, -7], [13, -3], [13, 3], [4, 5], [-9, 6]]); ink(ctx, SLATE2, 1.8, -9, 13);
    poly(ctx, [[-6, -6], [-9, -12], [-2, -6.5]]); ink(ctx, DARK, 1.3, -9, -2);
    circle(ctx, 3, -3, 1.6); ctx.fillStyle = rune(d); ctx.fill();
    poly(ctx, [[8, 0], [13.5, -1.5], [13.5, 2.5]]); flat(ctx, '#3a0e0a', 1);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,150,40,0.85)' : 'rgba(255,70,40,0.85)'; ctx.beginPath(); ctx.ellipse(18 + i * 4, 0.5, 5 - i, 2.8 - i * 0.6, 0, 0, TAU); ctx.fill(); }
    ctx.restore(); };
  if (many && mt >= 2) { head(A.a - 0.6, 0.78, 4); if (mt >= 4) head(A.a + 0.8, 0.78, 6); }
  head(A.a, might && mt >= 3 ? 1.2 : 1);
  if (might && mt >= 2) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (mt >= 4 ? 5 : 3); i++) { const x = -7 + i * 3.2, hh = (mt >= 4 ? 13 : 8) * (0.75 + (i % 2) * 0.3); ctx.fillStyle = i % 2 ? 'rgba(255,180,40,0.9)' : 'rgba(255,70,40,0.9)'; ctx.beginPath(); ctx.ellipse(x, -18 - hh * 0.4, 2.6, hh * 0.6, 0, 0, TAU); ctx.fill(); }
    ctx.restore(); }
  if (craft && mt >= 2) { for (let i = 0; i < (mt >= 4 ? 4 : 2); i++) { circle(ctx, -7 - i * 2, -20 - i * 5, 3 + i * 0.8); ctx.fillStyle = 'rgba(60,52,66,0.8)'; ctx.fill(); }
    if (mt >= 4) { ctx.strokeStyle = DMG.arcane.core; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-2, -4.5); ctx.lineTo(2, 3); ctx.lineTo(-6, 3); ctx.closePath(); ctx.stroke(); } }
  return -26 - (might && mt >= 4 ? 5 : 0);
}

// ---- 7. Focuser: Prism = a crystal floating between two curved horn-stones ------------------------
function crystal(ctx, x, y, w, h, d) {
  const D = DMG[d];
  poly(ctx, [[x, y - h], [x + w, y], [x, y + h * 0.6], [x - w, y]]);
  const g = ctx.createLinearGradient(x - w, y - h, x + w, y + h); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, D.core); g.addColorStop(1, shadeHex(D.core, -0.25));
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y); ctx.moveTo(x, y - h); ctx.lineTo(x - w * 0.3, y); ctx.lineTo(x, y + h * 0.6); ctx.stroke();
}
function prism(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  plinth(ctx, 24, P, d);
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 5, 7); ctx.quadraticCurveTo(s * 16, 0, s * 12, -20); ctx.quadraticCurveTo(s * 11, -6, s * 1, 7); ctx.closePath(); ink(ctx, SLATE, 1.8, -12, 12); carve(ctx, [[s * 6, 3], [s * 11, -12]], d, 1.2); }
  const cy = -16, s = might ? (mt >= 4 ? 1.5 : mt >= 2 ? 1.22 : 1) : 1;
  if (craft && mt >= 2) { circle(ctx, 0, cy, mt >= 4 ? 17 : 14); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = shadeHex(DMG[d].core, 0.4); ctx.lineWidth = 2.6; ctx.stroke();
    if (mt >= 4) for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 18, cy + Math.sin(a) * 18); ctx.lineTo(Math.cos(a) * 23, cy + Math.sin(a) * 23); ctx.strokeStyle = DMG[d].core; ctx.lineWidth = 2; ctx.stroke(); } }
  glow(ctx, 0, cy, 18 * s, DMG[d].core, 0.5);
  if (many && mt >= 2) { const sx = mt >= 4 ? 14 : 11; crystal(ctx, -sx, cy - 6, 4, 7, d); crystal(ctx, sx, cy - 6, 4, 7, d); if (mt >= 4) crystal(ctx, 0, cy - 20, 3.5, 6, d); }
  crystal(ctx, 0, cy, 7.5 * s, 12 * s, d);
  glyph(ctx, 'sun', 0, cy - 1, 4.2 * s, DMG[d].deep);
  return cy - 12 * s - (many && mt >= 4 ? 14 : 4);
}

// ---- 8. Emitter: Beacon = a stacked cairn whose top stone is a lamp --------------------------------
function beacon(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  plinth(ctx, 26, P, d);
  const stones = many && mt >= 3 ? [[12, 6], [10, 6], [8, 6], [6.5, 5]] : [[12, 6], [9.5, 6], [7, 5.5]];
  let y = 7;
  for (const [w, h] of stones) { ctx.beginPath(); ctx.ellipse(0, y - h / 2, w, h / 2 + 0.8, 0, 0, TAU); ink(ctx, SLATE, 1.8, -w, w); y -= h; }
  carve(ctx, [[-6, 1], [0, -1.5], [6, 1]], d, 1.3);
  if (might && mt >= 2) { for (const s of [-1, 1]) { if (s > 0 && mt < 4) continue; circle(ctx, s * 15, 3, 5.5); ink(ctx, '#a0482a', 1.6, s * 15 - 5, s * 15 + 5); circle(ctx, s * 15, 3, 3.2); flat(ctx, '#f0dcb0', 1); } }
  if (craft && mt >= 2) { for (let i = 0; i < (mt >= 4 ? 6 : 3); i++) { circle(ctx, -15 + (i % 3) * 3.4, 10 - Math.floor(i / 3) * 3, 2.3); flat(ctx, DMG.radiant.core, 1); } }
  const lampR = many && mt >= 2 ? 6.5 : 5.2, ly = y - lampR;
  if (many && mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,170,210,0.22)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(s * 32, ly - 8); ctx.lineTo(s * 32, ly + 6); ctx.fill(); } ctx.restore(); }
  glow(ctx, 0, ly, lampR * 4 + (many ? mt * 2 : 0), DMG[d].core, 0.6);
  poly(ctx, [[0, ly - lampR * 1.2], [lampR, ly], [0, ly + lampR * 0.9], [-lampR, ly]]); flat(ctx, DMG[d].core, 1.8);
  glyph(ctx, 'heart', 0, ly, lampR * 0.75, DMG[d].deep);
  return ly - lampR * 1.2 - 3;
}

const ART = { bolt, mortar, rime, coil, longeye, censer, prism, beacon };

export function draw(ctx, type, tiers, st) {
  const P = { ...mainPath(tiers), tiers };
  const d = WARD_SPEC[type].dmg;
  const s = 0.95 + P.lvl * 0.035 + (P.mt >= 4 ? 0.08 : 0);
  ctx.save();
  ctx.translate(0, 12);
  shadow(ctx, 15 * s);
  ctx.translate(0, 14); ctx.scale(s, s); ctx.translate(0, -14);
  if (P.mt >= 4) glow(ctx, 0, -10, 32, DMG[d].glow ? DMG[d].core : '#ffffff', 0.28);
  const top = ART[type](ctx, P, st, d);
  if (P.mt >= 4) shard(ctx, 0, top - 4, d);
  ctx.restore();
}
