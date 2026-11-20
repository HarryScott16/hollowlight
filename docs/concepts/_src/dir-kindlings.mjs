// Direction B: KINDLINGS. Every ward is a little spirit of the Heartfire: a wax-pale body, two big
// eyes that look at the target (the aim indicator), and a flame on its head in the damage colour.
// Body shape + held tool = role family. Path grammar: MIGHT = a bigger tool, MANY = more kindlings
// join it, CRAFT = it puts on gear (hood, mask, cloak). Tier ladder: notches on the hearthstone it
// stands on, growth, T3 changes the tool, T4 adds a crown and a soft halo in its own flame colour.
import { DMG, WARD_SPEC, INK, TAU, mainPath, circle, poly, rrect, star, ink, flat, glow, shadow, notches, secondaryPips, aim, shadeHex, glyph } from './kit.mjs';

const WAX = '#f3e4c6', WAX2 = '#e2cfa8', WOOD = '#7a5236', IRON = '#3f4763', BRONZE = '#8f6b47', STEEL = '#b8c2d2';

function hearthstone(ctx, w, P, d) {
  ctx.beginPath(); ctx.ellipse(0, 11, w / 2, 4.5, 0, 0, TAU); ink(ctx, '#5a5f78', 1.8, -w / 2, w / 2);
  ctx.beginPath(); ctx.ellipse(0, 9.5, w / 2 - 1.5, 3, 0, 0, TAU); ctx.fillStyle = '#727893'; ctx.fill();
  notches(ctx, P.mt, 0, 13.2, w - 8, DMG[d].core, 2.6);
  secondaryPips(ctx, P.tiers, P.main, w / 2 - 2, 7);
}

function eyes(ctx, x, y, st, { sep = 3.6, r = 2.8, one = false, lid = false } = {}) {
  const A = aim(st);
  for (const s of one ? [0] : [-1, 1]) {
    const ex = x + s * sep;
    ctx.beginPath(); ctx.ellipse(ex, y, r, r * 1.15, 0, 0, TAU); flat(ctx, '#ffffff', 1.3);
    circle(ctx, ex + A.x * r * 0.42, y + A.y * r * 0.5, r * 0.55); ctx.fillStyle = INK; ctx.fill();
    circle(ctx, ex + A.x * r * 0.42 - r * 0.2, y + A.y * r * 0.5 - r * 0.25, r * 0.18); ctx.fillStyle = '#fff'; ctx.fill();
    if (lid) { ctx.beginPath(); ctx.ellipse(ex, y - r * 0.5, r * 1.1, r * 0.7, 0, Math.PI, TAU); flat(ctx, INK, 0); }
  }
}

// The head flame: the ward's light. size ~ 1 at base.
function tuft(ctx, x, y, size, d, lean = 0) {
  const D = DMG[d], h = 10 * size, w = 5 * size;
  if (D.glow) glow(ctx, x, y - h * 0.4, h * 1.2, D.core, 0.55);
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.6, x + lean, y - h);
  ctx.quadraticCurveTo(x + w * 0.2, y - h * 0.55, x + w * 0.55, y - h * 0.7); ctx.quadraticCurveTo(x + w * 1.2, y - h * 0.3, x + w, y); ctx.closePath();
  flat(ctx, D.core, 1.6);
  ctx.beginPath(); ctx.moveTo(x - w * 0.45, y); ctx.quadraticCurveTo(x - w * 0.4, y - h * 0.4, x + lean * 0.4, y - h * 0.6); ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.3, x + w * 0.45, y); ctx.closePath();
  ctx.fillStyle = D.glow ? '#ffffff' : '#ffffff'; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
}

function badge(ctx, x, y, r, d) { const D = DMG[d]; circle(ctx, x, y, r); flat(ctx, D.core, 1.2); glyph(ctx, D.glyph, x, y, r * 0.95, D.glow ? shadeHex(D.deep, -0.3) : INK); }

function crown(ctx, x, y, d) {
  const D = DMG[d];
  poly(ctx, [[x - 5.5, y], [x - 6, y - 5], [x - 3, y - 2.5], [x, y - 7], [x + 3, y - 2.5], [x + 6, y - 5], [x + 5.5, y]]);
  flat(ctx, '#ffd34d', 1.5);
  circle(ctx, x, y - 2, 1.4); ctx.fillStyle = D.core; ctx.fill();
}

function crossbow(ctx, x, y, st, size = 1, heavy = false) {
  const A = aim(st);
  ctx.save(); ctx.translate(x, y); ctx.rotate(A.a); ctx.scale(size, size);
  rrect(ctx, -6, -1.7, 14, 3.4, 1.2); flat(ctx, heavy ? BRONZE : WOOD, 1.3);
  ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(3, -7); ctx.quadraticCurveTo(8.5, 0, 3, 7);
  ctx.strokeStyle = INK; ctx.lineWidth = heavy ? 4.2 : 3.4; ctx.stroke(); ctx.strokeStyle = heavy ? '#e0b070' : '#c9925a'; ctx.lineWidth = heavy ? 2.4 : 1.9; ctx.stroke();
  poly(ctx, [[11.5, 0], [7.5, -2.3], [7.5, 2.3]]); flat(ctx, STEEL, 1);
  ctx.restore();
}

// A small helper kindling (the MANY path): a mini body with eyes and its own flame.
function mini(ctx, x, y, st, d, s = 0.62, tool) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -6, -14, 12, 15, 5.5); ink(ctx, WAX, 1.8, -6, 6);
  eyes(ctx, 0, -8, st, { sep: 2.8, r: 2.3 });
  tuft(ctx, 0, -13.5, 0.75, d);
  if (tool) tool(ctx);
  ctx.restore();
}

// ---- 1. Shooter: Bolt = a candle-stub kindling with a crossbow ----------------------------------
function bolt(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 24, P, d);
  if (many && mt >= 2) mini(ctx, -11, 9, st, d, 0.66, (c) => crossbow(c, 0, -4, st, 0.9));
  if (many && mt >= 4) mini(ctx, 11, 9, st, d, 0.66, (c) => crossbow(c, 0, -4, st, 0.9));
  rrect(ctx, -7.5, -14, 15, 23, 6.5); ink(ctx, WAX, 2, -7.5, 7.5);
  if (craft && mt >= 2) { // hunter's hood
    ctx.beginPath(); ctx.moveTo(-8.5, -2); ctx.quadraticCurveTo(-9.5, -16, 0, -17); ctx.quadraticCurveTo(9.5, -16, 8.5, -2); ctx.lineTo(5, -4); ctx.quadraticCurveTo(0, -12, -5, -4); ctx.closePath();
    ink(ctx, mt >= 4 ? '#3c4a2c' : '#55663a', 1.6, -9, 9);
  }
  eyes(ctx, 0, -6, st, { lid: craft && mt >= 2 });
  if (might && mt >= 2) { rrect(ctx, -8, -12.5, 16, 3.2, 1.2); flat(ctx, BRONZE, 1.2); }
  tuft(ctx, 0, -14, might && mt >= 4 ? 1.25 : 1, d);
  crossbow(ctx, 4, 2, st, might ? (mt >= 4 ? 1.7 : mt >= 2 ? 1.3 : 1) : 1, might && mt >= 3);
  if (craft && mt >= 4) { ctx.save(); ctx.translate(0, -33); poly(ctx, [[0, -4.5], [3.6, 0], [0, 4.5], [-3.6, 0]]); flat(ctx, '#ffffff', 1.3); circle(ctx, 0, 0, 6.5); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke(); ctx.restore(); return -40; }
  return -26 - (might && mt >= 4 ? 3 : 0);
}

// ---- 2. Lobber: Mortar = a fat round kindling with a mortar tube on its back -------------------
function mortar(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 32, P, d);
  const tube = (x, s) => { ctx.save(); ctx.translate(x, -10); ctx.rotate(-0.25 + aim(st).x * 0.2); ctx.scale(s, s);
    poly(ctx, [[-4.5, 2], [4.5, 2], [6, -11], [-6, -11]]); ink(ctx, IRON, 1.8, -6, 6);
    ctx.beginPath(); ctx.ellipse(0, -11, 6, 2.2, 0, 0, TAU); flat(ctx, DMG[d].core, 1.3);
    if (might && mt >= 2) { rrect(ctx, -5.5, -5, 11, 2.6, 1); flat(ctx, BRONZE, 1); } ctx.restore(); };
  if (many && mt >= 2) { const n = mt >= 4 ? 3 : 2; for (let i = 0; i < n; i++) tube((i - (n - 1) / 2) * 9 + 2, 0.85); }
  else tube(3, might ? (mt >= 4 ? 1.55 : mt >= 2 ? 1.2 : 1) : 1);
  ctx.beginPath(); ctx.ellipse(0, 0, 14.5, 10.5, 0, 0, TAU); ink(ctx, WAX, 2.2, -14, 14);
  eyes(ctx, -2, -1, st, { sep: 4.2, r: 3 });
  badge(ctx, 7, 4.5, 3.4, d);
  if (craft && mt >= 2) { for (let i = 0; i < (mt >= 4 ? 6 : 3); i++) { circle(ctx, -13 + i * (26 / (mt >= 4 ? 5 : 2)), 13, 2.2); flat(ctx, DMG.fire.core, 1); }
    for (let i = 0; i < (mt >= 4 ? 3 : 2); i++) { circle(ctx, 8 + i * 2, -24 - i * 5.5, 2.8 + i); ctx.fillStyle = 'rgba(66,60,74,0.8)'; ctx.fill(); } }
  tuft(ctx, -9, -8, 0.8, d, -1);
  return -26 - (might && mt >= 4 ? 4 : 0);
}

// ---- 3. Pulser: Rime = a dome-shaped, jelly-skirted frost kindling -------------------------------
function rime(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 28, P, d);
  const w = might && mt >= 3 ? 15 : 13;
  if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -6, w + 9, 5, 0, Math.PI, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 3; ctx.stroke(); }
  if (many && mt >= 2) { const n = mt >= 4 ? 7 : 5; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42, L = w + (mt >= 4 ? 10 : 7);
    poly(ctx, [[Math.cos(a - 0.2) * w * 0.8, -4 + Math.sin(a - 0.2) * w * 0.8], [Math.cos(a) * L, -4 + Math.sin(a) * L], [Math.cos(a + 0.2) * w * 0.8, -4 + Math.sin(a + 0.2) * w * 0.8]]); flat(ctx, '#d8f8ff', 1.4); } }
  glow(ctx, 0, -4, w + 10, DMG[d].core, 0.4);
  // dome with a wavy skirt
  ctx.beginPath(); ctx.moveTo(-w, 6); ctx.bezierCurveTo(-w, -22, w, -22, w, 6);
  for (let i = 0; i < 4; i++) { const x0 = w - (i + 1) * (w * 2 / 4); ctx.quadraticCurveTo(x0 + w / 4, 10, x0, 6); }
  ctx.closePath();
  const g = ctx.createLinearGradient(-w, -16, w, 8); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#c6f6ff'); g.addColorStop(1, DMG[d].core);
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
  if (might && mt >= 2) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + Math.PI / 6; ctx.lineTo(Math.cos(a) * (w + 4), -4 + Math.sin(a) * (w + 2)); } ctx.closePath(); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 2.5; ctx.stroke(); }
  eyes(ctx, 0, -4, st, { sep: 4.2, r: 3 });
  glyph(ctx, 'flake', 0, 3.5, 3.5, DMG[d].deep);
  if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -6, w + 9, 5, 0, 0, Math.PI); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 3; ctx.stroke();
    if (mt >= 4) for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; star(ctx, Math.cos(a) * (w + 9), -6 + Math.sin(a) * 5, 3, 1.2, 6); flat(ctx, '#ffffff', 0.8); } }
  tuft(ctx, 0, -17, 0.9, d);
  return -29 - (many && mt >= 4 ? 4 : 0);
}

// ---- 4. Arcer: Coil = a kindling with forked antlers that arc --------------------------------
function coil(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 24, P, d);
  const n = many ? (mt >= 4 ? 4 : mt >= 2 ? 3 : 2) : 2;
  const spread = many && mt >= 4 ? 15 : 11, h = might && mt >= 3 ? 19 : 15;
  if (craft && mt >= 2) { ctx.beginPath(); ctx.moveTo(7, 6); for (let k = 0; k < 14; k++) ctx.lineTo(8 + k * 0.9, 6 - k * 0.9 + Math.sin(k * 1.4) * 2.5); ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.stroke(); ctx.strokeStyle = WAX; ctx.lineWidth = 2; ctx.stroke(); }
  const tips = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1) - 0.5, x = t * spread * 2;
    ctx.beginPath(); ctx.moveTo(t * 6, -12); ctx.quadraticCurveTo(x * 1.15, -12 - h * 0.4, x, -12 - h + Math.abs(t) * 3);
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = might && mt >= 2 ? 5.5 : 4.5; ctx.stroke(); ctx.strokeStyle = '#d9c39a'; ctx.lineWidth = might && mt >= 2 ? 3.2 : 2.5; ctx.stroke();
    tips.push([x, -12 - h + Math.abs(t) * 3]);
  }
  ctx.strokeStyle = '#f0dcff'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < tips.length - 1; i++) { const [x0, y0] = tips[i], [x1, y1] = tips[i + 1]; ctx.moveTo(x0, y0); ctx.lineTo((x0 + x1) / 2, Math.min(y0, y1) + 4); ctx.lineTo(x1, y1); } ctx.stroke();
  for (const [x, y] of tips) { circle(ctx, x, y, 2.6); flat(ctx, DMG[d].core, 1.2); }
  rrect(ctx, -8, -14, 16, 22, 7); ink(ctx, WAX, 2, -8, 8);
  if (craft && mt >= 2) for (let y = -4; y <= 4; y += 4) { ctx.beginPath(); ctx.ellipse(0, y, 9, 2, 0, 0, Math.PI); ctx.strokeStyle = '#d58a4a'; ctx.lineWidth = 2; ctx.stroke(); }
  eyes(ctx, 0, -6, st);
  tuft(ctx, 0, -13, 0.85, d);
  if (might && mt >= 2) { const R = mt >= 4 ? 6.5 : 4.5; glow(ctx, 0, -12 - h * 0.62, R * 3, DMG[d].core, 0.6); circle(ctx, 0, -12 - h * 0.62, R); flat(ctx, DMG[d].core, 1.6); glyph(ctx, 'zig', 0, -12 - h * 0.62, R, DMG[d].deep); }
  if (craft && mt >= 4) for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.4; ctx.strokeStyle = '#f0dcff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 11, -3 + Math.sin(a) * 7); ctx.lineTo(Math.cos(a) * 16, -3 + Math.sin(a) * 10); ctx.stroke(); }
  return -12 - h - 3;
}

// ---- 5. Spotter: Longeye = a tall, long-necked one-eyed kindling with a spyglass rifle ------------
function longeye(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 20, P, d);
  rrect(ctx, -5.5, -26, 11, 35, 5); ink(ctx, WAX, 2, -5.5, 5.5);
  eyes(ctx, 0, -18, st, { one: true, r: 4 });
  const A = aim(st), hy = -12;
  const gun = (dy, len, w) => { ctx.save(); ctx.translate(2, hy + dy); ctx.rotate(A.a);
    rrect(ctx, -6, -w / 2, len, w, w / 2.2); ink(ctx, STEEL, 1.7, 0, len); rrect(ctx, -7, -w / 2 - 0.5, 8, w + 1, 1.5); flat(ctx, WOOD, 1.2);
    rrect(ctx, len - 9, -w / 2 - 1.2, 3.5, w + 2.4, 1); flat(ctx, BRONZE, 1.1); ctx.restore(); };
  if (many && mt >= 2) { const n = mt >= 4 ? 3 : 2; for (let i = 0; i < n; i++) gun((i - (n - 1) / 2) * 4.5, 17, 3.8); }
  else gun(0, might ? (mt >= 4 ? 34 : mt >= 2 ? 27 : 22) : 22, might && mt >= 2 ? 5 : 4.2);
  if (craft && mt >= 2) { // spotter's monocle-lamp
    const R = mt >= 4 ? 6 : 4.8;
    if (mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(A.x * 44 - A.y * 12, -18 + A.y * 44 + 9); ctx.lineTo(A.x * 44 + A.y * 12, -18 + A.y * 44 - 9); ctx.fill(); ctx.restore(); }
    circle(ctx, 0, -18, R); ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.stroke(); ctx.strokeStyle = BRONZE; ctx.lineWidth = 2; ctx.stroke();
  }
  tuft(ctx, 0, -26, 0.85, d);
  return -38;
}

// ---- 6. Sprayer: Censer = a salamander kindling leaning forward, breathing fire ------------------
function censer(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 26, P, d);
  const A = aim(st);
  // tail and body (teardrop leaning toward the aim side)
  ctx.beginPath(); ctx.moveTo(-6, 6); ctx.quadraticCurveTo(-16, 6, -17, -2); ctx.quadraticCurveTo(-13, 2, -8, 1); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = WAX2; ctx.lineWidth = 2.5; ctx.stroke();
  const R = might && mt >= 3 ? 11 : 9.5;
  ctx.beginPath(); ctx.ellipse(-1, -1, R, R * 0.95, 0, 0, TAU); ink(ctx, WAX, 2, -R, R);
  badge(ctx, -2, 3, 3.2, d);
  const head = (ang, s) => { ctx.save(); ctx.translate(3, -10); ctx.rotate(ang * 0.6); ctx.scale(s, s);
    ctx.beginPath(); ctx.ellipse(3, 0, 8, 6, 0, 0, TAU); ink(ctx, WAX, 1.8, -5, 11);
    ctx.beginPath(); ctx.moveTo(6, 1); ctx.lineTo(11, -1); ctx.lineTo(11, 3.5); ctx.closePath(); flat(ctx, '#7a1f1a', 1.2);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,150,40,0.85)' : 'rgba(255,70,40,0.85)'; ctx.beginPath(); ctx.ellipse(15 + i * 4, 1.5, 5 - i, 2.8 - i * 0.6, 0, 0, TAU); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore(); };
  if (many && mt >= 2) { head(A.a - 0.5, 0.8); if (mt >= 4) head(A.a + 0.9, 0.8); }
  head(A.a, 1);
  eyes(ctx, 4.5, -13, st, { sep: 2.8, r: 2.4 });
  if (might && mt >= 2) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (mt >= 4 ? 5 : 3); i++) { const x = -6 + i * 3, hh = (mt >= 4 ? 13 : 8) * (0.75 + (i % 2) * 0.3); ctx.fillStyle = i % 2 ? 'rgba(255,180,40,0.9)' : 'rgba(255,70,40,0.9)'; ctx.beginPath(); ctx.ellipse(x, -7 - hh * 0.4, 2.6, hh * 0.6, -0.3, 0, TAU); ctx.fill(); }
    ctx.restore(); }
  if (craft && mt >= 2) { for (let i = 0; i < (mt >= 4 ? 4 : 2); i++) { circle(ctx, -6 - i * 2, -14 - i * 5, 3 + i * 0.8); ctx.fillStyle = 'rgba(60,52,66,0.8)'; ctx.fill(); }
    if (mt >= 4) { ctx.strokeStyle = DMG.arcane.core; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-1, -5); ctx.lineTo(3, 2); ctx.lineTo(-5, 2); ctx.closePath(); ctx.stroke(); } }
  tuft(ctx, 1, -15, 0.85, d, 2);
  return -28 - (might && mt >= 4 ? 4 : 0);
}

// ---- 7. Focuser: Prism = a floating crystal-bodied kindling ---------------------------------------
function gem(ctx, x, y, w, h, d) {
  const D = DMG[d];
  poly(ctx, [[x, y - h], [x + w, y], [x, y + h * 0.7], [x - w, y]]);
  const g = ctx.createLinearGradient(x - w, y - h, x + w, y + h); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, D.core); g.addColorStop(1, shadeHex(D.core, -0.25));
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
}
function prism(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 22, P, d);
  const cy = -10, s = might ? (mt >= 4 ? 1.45 : mt >= 2 ? 1.2 : 1) : 1;
  if (craft && mt >= 2) { circle(ctx, 0, cy - 2, mt >= 4 ? 18 : 15); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#fff3a0'; ctx.lineWidth = 2.6; ctx.stroke();
    if (mt >= 4) for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 19, cy - 2 + Math.sin(a) * 19); ctx.lineTo(Math.cos(a) * 24, cy - 2 + Math.sin(a) * 24); ctx.strokeStyle = DMG[d].core; ctx.lineWidth = 2; ctx.stroke(); } }
  glow(ctx, 0, cy, 20 * s, DMG[d].core, 0.5);
  if (many && mt >= 2) { const sx = mt >= 4 ? 14 : 11; for (const x of [-sx, sx]) { gem(ctx, x, cy + 4, 4, 7, d); } if (mt >= 4) { gem(ctx, -8, cy - 13, 3.2, 5.5, d); gem(ctx, 8, cy - 13, 3.2, 5.5, d); } }
  gem(ctx, 0, cy, 9 * s, 14 * s, d);
  eyes(ctx, 0, cy + 1, st, { sep: 3.4 * s, r: 2.6 * s });
  // little floating arms
  for (const sx of [-1, 1]) { circle(ctx, sx * 11 * s, cy + 5, 2); flat(ctx, WAX, 1.2); }
  return cy - 14 * s - 4;
}

// ---- 8. Emitter: Beacon = a kindling holding up a banner with a lamp on top -------------------
function beacon(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 26, P, d);
  const top = many && mt >= 3 ? -32 : -27;
  rrect(ctx, 5, top, 3.5, 22 - top, 1.4); ink(ctx, WOOD, 1.4, 5, 8.5);
  ctx.beginPath(); ctx.moveTo(8.5, top + 4); ctx.lineTo(22, top + 7); ctx.lineTo(17.5, top + 11.5); ctx.lineTo(22, top + 16); ctx.lineTo(8.5, top + 18); ctx.closePath(); ink(ctx, DMG[d].deep, 1.5, 8, 22);
  glyph(ctx, 'heart', 14, top + 11, 3.6, '#ffd0e6');
  if (might && mt >= 2) { ctx.beginPath(); ctx.ellipse(-12, 7, 6, 5, 0, 0, TAU); ink(ctx, '#a0482a', 1.6, -18, -6); ctx.beginPath(); ctx.ellipse(-12, 3.5, 6, 2, 0, 0, TAU); flat(ctx, '#f0dcb0', 1.2);
    if (mt >= 4) { ctx.beginPath(); ctx.ellipse(-13, -4, 5, 4, 0, 0, TAU); ink(ctx, '#a0482a', 1.4, -18, -8); ctx.beginPath(); ctx.ellipse(-13, -7, 5, 1.6, 0, 0, TAU); flat(ctx, '#f0dcb0', 1); } }
  if (craft && mt >= 2) { ctx.beginPath(); ctx.moveTo(-17, 9); ctx.quadraticCurveTo(-18, 0, -12, -1); ctx.quadraticCurveTo(-6, 0, -7, 9); ctx.closePath(); ink(ctx, '#9a7a4a', 1.5, -17, -7); for (let i = 0; i < (mt >= 4 ? 4 : 2); i++) { circle(ctx, -15 + i * 2.6, -2 - (i % 2) * 2, 2.1); flat(ctx, DMG.radiant.core, 1); } }
  rrect(ctx, -7, -12, 14, 21, 6.5); ink(ctx, WAX, 2, -7, 7);
  eyes(ctx, -1, -5, st);
  circle(ctx, 6.5, -1, 2.3); flat(ctx, WAX, 1.2);
  tuft(ctx, -1, -12, 0.8, d);
  const lampR = many && mt >= 2 ? 5.5 : 4.2;
  if (many && mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,170,210,0.22)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(6.7, top - 4); ctx.lineTo(6.7 + s * 30, top - 11); ctx.lineTo(6.7 + s * 30, top + 3); ctx.fill(); } ctx.restore(); }
  glow(ctx, 6.7, top - lampR, lampR * 3.5, DMG[d].core, 0.6);
  circle(ctx, 6.7, top - lampR, lampR); flat(ctx, DMG[d].core, 1.6);
  circle(ctx, 6.7 - 1, top - lampR - 1, lampR * 0.4); ctx.fillStyle = '#fff'; ctx.fill();
  return top - lampR * 2 - 2;
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
  if (P.mt >= 4) glow(ctx, 0, -8, 32, DMG[d].glow ? DMG[d].core : '#ffffff', 0.28);
  const top = ART[type](ctx, P, st, d);
  if (P.mt >= 4) crown(ctx, type === 'beacon' ? -1 : type === 'censer' ? 1 : 0, type === 'beacon' ? -21 : top + 1, d);
  ctx.restore();
}

// Shared with dir-kindlings-ideas.mjs (the 13 new-ward ideas in this style).
export { hearthstone, eyes, tuft, badge, crown, crossbow, mini, WAX, WAX2, WOOD, IRON, BRONZE, STEEL };
