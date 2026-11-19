// Mock-ups of the four recommended NEW wards in the Lanterns direction (see docs/tower-ideas.md).
// Same rules as dir-lanterns.mjs: housing = family, light colour + glyph = damage type, notches =
// tier, path grammar MIGHT / MANY / CRAFT.
//   snare  Thornlight Snare   Snare family (flat, on the path)      Kinetic
//   gate   Lychgate Wardens   Garrison family (arch / gate)         Radiant
//   glass  Burning Glass      Frame family (upright ring on stand)  Fire
//   bell   Recall Bell        Hanger family (bell, top-heavy)       Arcane
import { DMG, INK, TAU, mainPath, circle, poly, rrect, ink, flat, glow, shadow, core, notches, secondaryPips, glyph, aim, shadeHex } from './kit.mjs';
import { plinth, pane, roof, crown, IRON, IRON2, BRONZE, WOOD, STEEL } from './dir-lanterns.mjs';

export const NEW_SPEC = {
  snare: { name: 'Thornlight Snare', family: 'Snare', dmg: 'kinetic', paths: ['Caltrops', 'Flashmines', 'Binding Light'] },
  gate: { name: 'Lychgate Wardens', family: 'Garrison', dmg: 'radiant', paths: ['Shieldwall', 'Muster', 'Lamplighters'] },
  glass: { name: 'Burning Glass', family: 'Frame', dmg: 'fire', paths: ['Kindling Glass', 'Splitting Glass', 'Truing Glass'] },
  bell: { name: 'Recall Bell', family: 'Hanger', dmg: 'arcane', paths: ['Great Bell', 'Carillon', 'Knell'] },
};

// ---- Snare: a floor-lantern grate sunk into the path, ringed with thorns. No height. -----------
function snare(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  const R = 17;
  // path sand under it, so it reads as "on the road"
  ctx.beginPath(); ctx.ellipse(0, 6, R + 9, 10, 0, 0, TAU); ctx.fillStyle = 'rgba(214,176,120,0.55)'; ctx.fill();
  const n = might ? 10 + mt * 2 : 10, L = might && mt >= 2 ? 8 : 5.5;
  for (let i = 0; i < n; i++) { // thorns round the rim (back half first)
    const a = Math.PI + (i / n) * TAU;
    const x = Math.cos(a) * R, y = 4 + Math.sin(a) * R * 0.42;
    poly(ctx, [[x - 2.2, y], [x + 2.2, y], [x + Math.cos(a) * 1.5, y - L]]); flat(ctx, STEEL, 1.2);
  }
  ctx.beginPath(); ctx.ellipse(0, 4, R, R * 0.42, 0, 0, TAU); ink(ctx, IRON2, 2, -R, R);
  ctx.beginPath(); ctx.ellipse(0, 3.5, R - 4, (R - 4) * 0.42, 0, 0, TAU);
  glow(ctx, 0, 2, R + 4, '#ffffff', 0.35);
  ctx.beginPath(); ctx.ellipse(0, 3.5, R - 4, (R - 4) * 0.42, 0, 0, TAU); flat(ctx, DMG[d].core, 1.4);
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 5, -0.5); ctx.lineTo(k * 5, 7.5); ctx.strokeStyle = IRON; ctx.lineWidth = 1.6; ctx.stroke(); }
  glyph(ctx, 'arrow', 0, 3.2, 3.6, INK);
  notches(ctx, mt, 0, 12.5, 26, DMG[d].core, 2.8);
  secondaryPips(ctx, P.tiers, main, 14, 12.5);
  if (many && mt >= 2) { const k = mt >= 4 ? 3 : 2; for (let i = 0; i < k; i++) { const x = (i - (k - 1) / 2) * 11; ctx.beginPath(); ctx.ellipse(x, -1, 4.5, 3.5, 0, Math.PI, TAU); ctx.closePath(); ink(ctx, IRON2, 1.4, x - 4, x + 4); circle(ctx, x, -3.5, 1.6); flat(ctx, '#ff6a3a', 0.8); } }
  if (craft && mt >= 2) { // chains of light rising from the grate
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.8;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 7, 2); ctx.quadraticCurveTo(s * 14, -10, s * 3, -(mt >= 4 ? 22 : 15)); ctx.stroke(); }
    ctx.restore();
    if (mt >= 4) { circle(ctx, 0, -24, 4); ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
  }
  return craft && mt >= 4 ? -30 : -10;
}

// ---- Gate: an arched lychgate with a lantern in the arch; wardens stand at its feet -----------
function warden(ctx, x, y, d, s = 1, shield = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -3.5, -11, 7, 12, 3); ink(ctx, '#c9b98f', 1.4, -3.5, 3.5);
  circle(ctx, 0, -13, 3.2); flat(ctx, DMG[d].core, 1.2);
  ctx.beginPath(); ctx.moveTo(4.5, 1); ctx.lineTo(4.5, -19); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = WOOD; ctx.lineWidth = 1.4; ctx.stroke();
  poly(ctx, [[4.5, -23], [6.5, -19], [2.5, -19]]); flat(ctx, STEEL, 1);
  if (shield) { rrect(ctx, -6.5, -9, 6, 8, 2.5); flat(ctx, BRONZE, 1.2); }
  ctx.restore();
}
function gate(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  plinth(ctx, 32, P, d);
  const w = might && mt >= 3 ? 7 : 5.5;
  for (const s of [-1, 1]) { rrect(ctx, s * 12 - w / 2, -16, w, 23, 1.5); ink(ctx, IRON2, 1.8, s * 12 - w / 2, s * 12 + w / 2); }
  // round arch (the Garrison primitive): a thick semicircular band joining the posts
  ctx.beginPath(); ctx.arc(0, -16, 12 + w / 2 + 1, Math.PI, 0); ctx.arc(0, -16, 12 - w / 2 - 1, 0, Math.PI, true); ctx.closePath(); ink(ctx, IRON, 2, -17, 17);
  rrect(ctx, -3, -33, 6, 5, 1.5); flat(ctx, BRONZE, 1.4);
  // the hanging lantern in the arch
  ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, -16); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
  rrect(ctx, -4.5, -16, 9, 11, 2); ink(ctx, IRON2, 1.6, -4.5, 4.5); pane(ctx, 0, -10.5, 5.5, 7, d, 12);
  if (might && mt >= 2) { rrect(ctx, -6, -3, 12, 10, 3); ink(ctx, BRONZE, 1.6, -6, 6); glyph(ctx, 'sun', 0, 2, 3.6, INK); }
  const n = many ? (mt >= 4 ? 3 : mt >= 2 ? 2 : 1) : 1;
  const xs = n === 1 ? [-19] : n === 2 ? [-20, 20] : [-21, 21, 0];
  xs.forEach((x, i) => warden(ctx, x, x === 0 ? 13 : 9, d, x === 0 ? 0.85 : 0.95, might && mt >= 2));
  if (craft && mt >= 2) for (const s of [-1, 1]) { rrect(ctx, s * 17 - 1, -22, 2, 12, 0.8); flat(ctx, WOOD, 0.8); circle(ctx, s * 17, -24, mt >= 4 ? 3.6 : 2.8); flat(ctx, DMG[d].core, 1.2); glow(ctx, s * 17, -24, 10, DMG[d].core, 0.5); }
  return -34;
}

// ---- Glass: a great upright lens in an iron ring on a swivel stand ----------------------------
function lens(ctx, x, y, r, d) {
  circle(ctx, x, y, r + 2.6); ink(ctx, IRON2, 2, x - r, x + r);
  circle(ctx, x, y, r);
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, shadeHex(DMG[d].core, 0.55)); g.addColorStop(1, shadeHex(DMG[d].core, 0.15));
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.7, Math.PI * 1.1, Math.PI * 1.45); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.stroke();
}
function glass(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  plinth(ctx, 22, P, d);
  ctx.beginPath(); ctx.moveTo(0, 7); ctx.lineTo(0, -6); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = BRONZE; ctx.lineWidth = 2.5; ctx.stroke();
  // a passing bolt being converted: plain in, burning out
  const A = aim(st);
  ctx.save(); ctx.translate(0, -17); ctx.rotate(A.a);
  ctx.strokeStyle = 'rgba(233,238,246,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-12, 0); ctx.stroke();
  ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,90,50,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(30, 0); ctx.stroke();
  ctx.restore();
  if (many && mt >= 2) { const k = mt >= 4 ? 3 : 2; const r = 7; const xs = k === 2 ? [-8, 8] : [-12, 0, 12];
    ctx.beginPath(); ctx.moveTo(xs[0], -17); ctx.lineTo(xs[xs.length - 1], -17); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    xs.forEach((x) => { lens(ctx, x, -17 - (x === 0 && k === 3 ? 4 : 0), r, d); glyph(ctx, 'flame', x, -17 - (x === 0 && k === 3 ? 4 : 0), 3.5, DMG[d].deep); });
    return -30; }
  const r = might ? (mt >= 4 ? 15 : mt >= 2 ? 12.5 : 11) : 11;
  // swivel yoke
  ctx.beginPath(); ctx.moveTo(-r - 4, -17); ctx.quadraticCurveTo(-r - 4, -4, 0, -5); ctx.quadraticCurveTo(r + 4, -4, r + 4, -17); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = BRONZE; ctx.lineWidth = 2.2; ctx.stroke();
  glow(ctx, 0, -17, r * 2, DMG[d].core, 0.35);
  lens(ctx, 0, -17, r, d);
  glyph(ctx, 'flame', 0, -16, r * 0.42, DMG[d].deep);
  if (craft && mt >= 2) { ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-r, -17); ctx.lineTo(r, -17); ctx.moveTo(0, -17 - r); ctx.lineTo(0, -17 + r); ctx.stroke();
    circle(ctx, 0, -17, r * 0.45); ctx.stroke();
    if (mt >= 4) for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; poly(ctx, [[Math.cos(a) * (r + 3), -17 + Math.sin(a) * (r + 3)], [Math.cos(a) * (r + 9), -17 + Math.sin(a) * (r + 9) - 2], [Math.cos(a) * (r + 9), -17 + Math.sin(a) * (r + 9) + 2]]); flat(ctx, STEEL, 1); } }
  return -17 - r - 6;
}

// ---- Bell: a small belfry: two posts, a beam, and a glowing bell hung from it ------------------
function bellShape(ctx, x, y, s, d) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-3, -9); ctx.quadraticCurveTo(-5, -9, -5.5, -3); ctx.quadraticCurveTo(-6, 3, -9, 5); ctx.lineTo(9, 5); ctx.quadraticCurveTo(6, 3, 5.5, -3); ctx.quadraticCurveTo(5, -9, 3, -9); ctx.closePath();
  ink(ctx, BRONZE, 1.8, -9, 9);
  ctx.beginPath(); ctx.ellipse(0, 5, 9, 2.4, 0, 0, TAU); flat(ctx, DMG[d].core, 1.4);
  glyph(ctx, 'zig', 0, -2, 3.6, '#3a1f10');
  ctx.restore();
}
function bell(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  plinth(ctx, 28, P, d);
  for (const s of [-1, 1]) { rrect(ctx, s * 12 - 2.5, -26, 5, 33, 1.5); ink(ctx, WOOD, 1.6, s * 12 - 2.5, s * 12 + 2.5); }
  rrect(ctx, -16, -29, 32, 5, 1.5); ink(ctx, WOOD, 1.8, -16, 16);
  roof(ctx, 0, -29, 36, 7);
  // sound rings (the push), drawn behind the bell
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(190,140,255,0.55)'; ctx.lineWidth = 1.6;
  for (const k of [1, 2]) { ctx.beginPath(); ctx.ellipse(0, -6, 10 + k * 6, 4 + k * 2.5, 0, 0, TAU); ctx.stroke(); } ctx.restore();
  glow(ctx, 0, -8, 18, DMG[d].core, 0.4);
  if (many && mt >= 2) { const k = mt >= 4 ? 3 : 2; const xs = k === 2 ? [-6, 6] : [-7.5, 0, 7.5];
    xs.forEach((x, i) => { ctx.beginPath(); ctx.moveTo(x, -24); ctx.lineTo(x, -18 + (i % 2) * 3); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); bellShape(ctx, x, -11 + (i % 2) * 3, 0.62, d); }); }
  else { const s = might ? (mt >= 4 ? 1.45 : mt >= 2 ? 1.2 : 1) : 1; ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, -19); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke(); bellShape(ctx, 0, -10 + (s - 1) * 4, s, d); }
  if (craft && mt >= 2) { // the knell: an hourglass emblem on the roof
    ctx.save(); ctx.translate(0, -41); poly(ctx, [[-4, -5], [4, -5], [0, 0], [4, 5], [-4, 5], [0, 0]]); flat(ctx, '#f0dcff', 1.3); ctx.restore();
    if (mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(200,150,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 10, 26, 7, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    return -47; }
  return -38;
}

const ART = { snare, gate, glass, bell };

export function draw(ctx, type, tiers, st) {
  const P = { ...mainPath(tiers), tiers };
  const d = NEW_SPEC[type].dmg;
  const s = 0.95 + P.lvl * 0.035 + (P.mt >= 4 ? 0.08 : 0);
  ctx.save();
  ctx.translate(0, 12);
  if (type !== 'snare') shadow(ctx, 15 * s);
  ctx.translate(0, 14); ctx.scale(s, s); ctx.translate(0, -14);
  if (P.mt >= 4) glow(ctx, 0, type === 'snare' ? 0 : -10, 32, DMG[d].glow ? DMG[d].core : '#ffffff', 0.28);
  const top = ART[type](ctx, P, st, d);
  if (P.mt >= 4) crown(ctx, 0, top, d);
  ctx.restore();
}
