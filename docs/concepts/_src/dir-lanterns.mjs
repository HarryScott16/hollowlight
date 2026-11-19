// Direction A: LANTERNS. Every ward is a lantern holding a captured light.
// Housing silhouette = role family. Light colour + glyph = damage type. Iron + bronze everywhere else.
// Path grammar: path 1 MIGHT (one bigger, heavier thing), path 2 MANY (it multiplies), path 3 CRAFT
// (a special emblem is added). Tier ladder: notches on the plinth, small growth, T3 changes the
// head, T4 adds a finial crown and a soft halo in the ward's own light.
import { DMG, WARD_SPEC, INK, TAU, mainPath, circle, poly, rrect, star, ink, flat, glow, shadow, core, notches, secondaryPips, aim, shadeHex, glyph } from './kit.mjs';

const IRON = '#3a4160', IRON2 = '#4d5677', BRONZE = '#8f6b47', WOOD = '#7a5236', STEEL = '#b8c2d2';

function plinth(ctx, w, P, d) {
  poly(ctx, [[-w / 2, 14], [w / 2, 14], [w / 2 - 3, 7], [-w / 2 + 3, 7]]); ink(ctx, IRON, 2, -w / 2, w / 2);
  notches(ctx, P.mt, 0, 10.5, w - 6, DMG[d].core, 3.2);
  secondaryPips(ctx, P.tiers, P.main, w / 2 - 6, 4.5);
}

// A glass pane of light (the lantern's window) with the damage glyph.
function pane(ctx, x, y, w, h, d, glowR = 0) {
  const D = DMG[d];
  if (D.glow && glowR) glow(ctx, x, y, glowR, D.core, 0.5);
  rrect(ctx, x - w / 2, y - h / 2, w, h, 2.5);
  const g = ctx.createRadialGradient(x - w * 0.15, y - h * 0.15, 0, x, y, Math.max(w, h) * 0.7);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, D.core); g.addColorStop(1, D.glow ? shadeHex(D.core, -0.15) : D.deep);
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
  glyph(ctx, D.glyph, x, y, Math.min(w, h) * 0.42, D.glow ? shadeHex(D.deep, -0.3) : INK);
}

function roof(ctx, x, y, w, h, fill = IRON) {
  poly(ctx, [[x - w / 2, y], [x + w / 2, y], [x, y - h]]); ink(ctx, fill, 2, x - w / 2, x + w / 2);
}
function ringHandle(ctx, x, y, r = 3) { circle(ctx, x, y - r, r); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); }

function crown(ctx, x, y, d) {
  const D = DMG[d];
  glow(ctx, x, y - 3, 12, D.glow ? D.core : '#ffffff', 0.55);
  poly(ctx, [[x - 6, y], [x - 6, y - 5], [x - 3, y - 2.5], [x, y - 8], [x + 3, y - 2.5], [x + 6, y - 5], [x + 6, y]]);
  flat(ctx, D.core, 1.6);
}

// Little crossbow seen at 3/4: rotate in a squashed plane.
function crossbow(ctx, x, y, st, size = 1, heavy = false) {
  const A = aim(st);
  ctx.save(); ctx.translate(x, y); ctx.rotate(A.a); ctx.scale(size, size);
  rrect(ctx, -7, -1.8, 15, 3.6, 1.2); flat(ctx, heavy ? BRONZE : WOOD, 1.4);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(3, -8); ctx.quadraticCurveTo(9, 0, 3, 8);
  ctx.strokeStyle = INK; ctx.lineWidth = heavy ? 4.5 : 3.6; ctx.stroke();
  ctx.strokeStyle = heavy ? '#e0b070' : '#c9925a'; ctx.lineWidth = heavy ? 2.6 : 2; ctx.stroke();
  poly(ctx, [[12, 0], [8, -2.4], [8, 2.4]]); flat(ctx, STEEL, 1);
  ctx.restore();
}

// ---- 1. Shooter: Bolt Ward = square carriage lantern with a crossbow on its roof --------------
function bolt(ctx, P, st, d) {
  const { main, mt } = P;
  plinth(ctx, 22, P, d);
  const might = main === 0, many = main === 1, craft = main === 2;
  rrect(ctx, -9, -15, 18, 22, 2); ink(ctx, IRON, 2, -9, 9);
  pane(ctx, 0, -4, 12, 15, d, 14);
  if (might && mt >= 2) for (const y of [-12, 4]) { rrect(ctx, -10, y - 1.5, 20, 3, 1); flat(ctx, BRONZE, 1.2); }
  if (craft && mt >= 2) { // hunter's eye shutter over the pane
    ctx.beginPath(); ctx.ellipse(0, -4, 6, 3.6, 0, 0, TAU); flat(ctx, '#ffffff', 1.4);
    circle(ctx, 1, -4, 2.2); flat(ctx, INK, 0);
  }
  roof(ctx, 0, -15, 22, 7);
  if (might) crossbow(ctx, 0, -24, st, mt >= 4 ? 1.75 : mt >= 2 ? 1.25 : 1, mt >= 3);
  else if (many && mt >= 3) { // rotary bolt drum
    const A = aim(st); ctx.save(); ctx.translate(0, -25); ctx.rotate(A.a);
    for (let i = -1.5; i <= 1.5; i++) { rrect(ctx, -6, i * 3.4 - 1.4, 18, 2.8, 1); flat(ctx, STEEL, 1); }
    rrect(ctx, -8, -7, 9, 14, 2.5); flat(ctx, BRONZE, 1.6); ctx.restore();
  } else if (many && mt >= 2) { crossbow(ctx, -5, -23, st, 0.9); crossbow(ctx, 5, -23, st, 0.9); }
  else crossbow(ctx, 0, -23, st, 1);
  if (many && mt >= 4) { crossbow(ctx, -12, -18, st, 0.75); crossbow(ctx, 12, -18, st, 0.75); }
  if (craft && mt >= 4) { // floating hunter's mark
    ctx.save(); ctx.translate(0, -34);
    poly(ctx, [[0, -5], [4, 0], [0, 5], [-4, 0]]); flat(ctx, '#ffffff', 1.4);
    circle(ctx, 0, 0, 7); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore();
  }
  return mt >= 4 ? (craft ? -42 : -31) : -30;
}

// ---- 2. Lobber: Mortar Kiln = squat round kiln-lantern with a stubby mouth -------------------
function mortar(ctx, P, st, d) {
  const { main, mt } = P;
  plinth(ctx, 30, P, d);
  const might = main === 0, many = main === 1, craft = main === 2;
  const w = might && mt >= 3 ? 17 : 15;
  ctx.beginPath(); ctx.ellipse(0, -1, w, 10, 0, 0, TAU); ink(ctx, IRON2, 2.2, -w, w);
  // glowing vents round the belly
  for (let i = -2; i <= 2; i++) { rrect(ctx, i * 5.5 - 1.6, -2.5, 3.2, 6, 1.2); flat(ctx, DMG[d].core, 1); }
  if (might && mt >= 2) for (const y of [-6, 4]) { ctx.beginPath(); ctx.ellipse(0, y, w * 0.95, 2, 0, 0, TAU); ctx.strokeStyle = BRONZE; ctx.lineWidth = 2; ctx.stroke(); }
  const A = aim(st);
  const mouth = (x, scale) => {
    ctx.save(); ctx.translate(x, -9); ctx.rotate(A.x * 0.35); ctx.scale(scale, scale);
    poly(ctx, [[-5, 0], [5, 0], [6.5, -10], [-6.5, -10]]); ink(ctx, IRON, 2, -6, 6);
    ctx.beginPath(); ctx.ellipse(0, -10, 6.5, 2.4, 0, 0, TAU); flat(ctx, DMG[d].core, 1.4);
    ctx.restore();
  };
  if (many && mt >= 2) { const n = mt >= 4 ? 3 : 2; for (let i = 0; i < n; i++) mouth((i - (n - 1) / 2) * 10, mt >= 4 ? 0.8 : 0.85); }
  else mouth(0, might ? (mt >= 4 ? 1.5 : mt >= 2 ? 1.2 : 1) : 1);
  if (craft && mt >= 2) { // cinder: coals spilling round the foot + smoke
    for (let i = 0; i < (mt >= 4 ? 7 : 4); i++) { circle(ctx, -14 + i * (28 / (mt >= 4 ? 6 : 3)), 13, 2.3); flat(ctx, DMG.fire.core, 1); }
    for (let i = 0; i < (mt >= 4 ? 3 : 2); i++) { circle(ctx, 3 + i * 2, -24 - i * 6, 3 + i); flat(ctx, 'rgba(70,64,80,0.75)', 0); }
  }
  core(ctx, d, 0, -1, 4.6, { glowR: 13 });
  return might && mt >= 4 ? -28 : -24;
}

// ---- 3. Pulser: Rime Spire = a round glass globe on a short stem ------------------------------
function rime(ctx, P, st, d) {
  const { main, mt } = P;
  plinth(ctx, 22, P, d);
  const might = main === 0, many = main === 1, craft = main === 2;
  rrect(ctx, -3, -2, 6, 10, 1.5); ink(ctx, IRON, 1.6, -3, 3);
  const r = might && mt >= 3 ? 14 : 12, cy = -14;
  if (craft && mt >= 2) { // snow cloud ring behind
    ctx.beginPath(); ctx.ellipse(0, cy, r + 9, 5, 0, Math.PI, TAU); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 3; ctx.stroke();
  }
  if (many && mt >= 2) { // shard spikes radiating from the globe
    const n = mt >= 4 ? 8 : 5;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * (Math.PI * 1.3 / n);
      const L = r + (mt >= 4 ? 10 : 7);
      poly(ctx, [[Math.cos(a - 0.17) * r * 0.8, cy + Math.sin(a - 0.17) * r * 0.8], [Math.cos(a) * L, cy + Math.sin(a) * L], [Math.cos(a + 0.17) * r * 0.8, cy + Math.sin(a + 0.17) * r * 0.8]]);
      flat(ctx, '#d8f8ff', 1.4);
    }
  }
  glow(ctx, 0, cy, r + 8, DMG[d].core, 0.45);
  circle(ctx, 0, cy, r);
  const g = ctx.createRadialGradient(-4, cy - 4, 1, 0, cy, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#a8f2ff'); g.addColorStop(1, DMG[d].core);
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
  // ribs (meridians)
  ctx.strokeStyle = IRON; ctx.lineWidth = 1.6;
  for (const k of [-0.55, 0, 0.55]) { ctx.beginPath(); ctx.ellipse(0, cy, Math.abs(k) * r || 0.1, r, 0, 0, TAU); ctx.stroke(); }
  if (might && mt >= 2) { // ice crust: a hexagonal frame
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.lineTo(Math.cos(a) * (r + 3), cy + Math.sin(a) * (r + 3)); } ctx.closePath();
    ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 2.5; ctx.stroke();
  }
  glyph(ctx, 'flake', 0, cy, 6.5, DMG[d].deep);
  if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, cy, r + 9, 5, 0, 0, Math.PI); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 3; ctx.stroke();
    if (mt >= 4) for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; star(ctx, Math.cos(a) * (r + 9), cy + Math.sin(a) * 5, 3, 1.2, 6); flat(ctx, '#ffffff', 0.8); } }
  roof(ctx, 0, cy - r + 1, 8, 4);
  return cy - r - (many && mt >= 4 ? 10 : 4);
}

// ---- 4. Arcer: Storm Coil = tall lantern with two horn prongs and an arc between ---------------
function coil(ctx, P, st, d) {
  const { main, mt } = P;
  plinth(ctx, 20, P, d);
  const might = main === 0, many = main === 1, craft = main === 2;
  rrect(ctx, -6, -14, 12, 21, 2); ink(ctx, IRON, 2, -6, 6);
  pane(ctx, 0, -4, 7, 14, d, 10);
  if (craft && mt >= 2) for (let y = -11; y <= 3; y += 4.5) { ctx.beginPath(); ctx.ellipse(0, y, 8.5, 2.2, 0, 0, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = '#d58a4a'; ctx.lineWidth = 1.8; ctx.stroke(); }
  const n = many ? (mt >= 4 ? 4 : mt >= 2 ? 3 : 2) : 2;
  const spread = many && mt >= 4 ? 16 : 11, h = might && mt >= 3 ? 20 : 16;
  const tips = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1) - 0.5, x = t * spread * 2;
    ctx.beginPath(); ctx.moveTo(t * 6, -14); ctx.quadraticCurveTo(x * 1.1, -14 - h * 0.4, x, -14 - h + Math.abs(t) * 3);
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = might && mt >= 2 ? 5.5 : 4.5; ctx.stroke();
    ctx.strokeStyle = BRONZE; ctx.lineWidth = might && mt >= 2 ? 3.2 : 2.5; ctx.stroke();
    tips.push([x, -14 - h + Math.abs(t) * 3]);
  }
  ctx.strokeStyle = '#f0dcff'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < tips.length - 1; i++) { const [x0, y0] = tips[i], [x1, y1] = tips[i + 1]; ctx.moveTo(x0, y0); ctx.lineTo((x0 + x1) / 2, Math.min(y0, y1) + 4); ctx.lineTo(x1, y1); }
  ctx.stroke();
  for (const [x, y] of tips) { circle(ctx, x, y, 2.6); flat(ctx, DMG[d].core, 1.2); }
  if (might && mt >= 2) core(ctx, d, 0, -14 - h * 0.6, mt >= 4 ? 6.5 : 4.5, { glowR: 16 });
  if (craft && mt >= 4) for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.4; ctx.strokeStyle = '#f0dcff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 11, -4 + Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * 16, -4 + Math.sin(a) * 9); ctx.stroke(); }
  return -14 - h - 2;
}

// ---- 5. Spotter: Longeye = tallest: a thin lamp-pole carrying a big spyglass head ---------------
function longeye(ctx, P, st, d) {
  const { main, mt } = P;
  plinth(ctx, 18, P, d);
  const might = main === 0, many = main === 1, craft = main === 2;
  const top = -20;
  poly(ctx, [[-3.5, 7], [3.5, 7], [2.2, top], [-2.2, top]]); ink(ctx, IRON, 1.8, -3, 3);
  for (const y of [0, -11]) { rrect(ctx, -4.5, y, 9, 2.6, 1); flat(ctx, BRONZE, 1); }
  // lamp-house head
  rrect(ctx, -7, top - 10, 14, 11, 3); ink(ctx, IRON2, 2, -7, 7);
  pane(ctx, 0, top - 4.5, 9, 6, d, 10);
  roof(ctx, 0, top - 10, 16, 5);
  const A = aim(st), hy = top - 9;
  const barrel = (dy, len, w) => {
    ctx.save(); ctx.translate(0, hy + dy); ctx.rotate(A.a);
    rrect(ctx, -3, -w / 2, len, w, w / 2.2); ink(ctx, STEEL, 1.8, 0, len);
    rrect(ctx, len - 5, -w / 2 - 1.2, 3.5, w + 2.4, 1); flat(ctx, BRONZE, 1.2);
    ctx.restore();
  };
  if (many && mt >= 2) { const n = mt >= 4 ? 3 : 2; for (let i = 0; i < n; i++) barrel((i - (n - 1) / 2) * 5, 17, 4); circle(ctx, 0, hy, 5); flat(ctx, BRONZE, 1.6); }
  else barrel(0, might ? (mt >= 4 ? 34 : mt >= 2 ? 27 : 22) : 22, might && mt >= 2 ? 5.5 : 4.6);
  if (craft && mt >= 2) { // searchlight eye-lens above the head
    const R = mt >= 4 ? 7 : 5.5, ly = top - 17 - R * 0.6;
    if (mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(A.x * 44 - A.y * 12, ly + A.y * 44 + 9); ctx.lineTo(A.x * 44 + A.y * 12, ly + A.y * 44 - 9); ctx.fill(); ctx.restore(); }
    circle(ctx, 0, ly, R); flat(ctx, IRON2, 1.8);
    circle(ctx, A.x * 1.5, ly + A.y, R * 0.66); flat(ctx, '#ffffff', 1.2);
    circle(ctx, A.x * 2.4, ly + A.y * 1.5, R * 0.3); flat(ctx, INK, 0);
    return ly - R - 2;
  }
  return top - 16;
}

// ---- 6. Sprayer: Ember Censer = gallows post with a hanging fire-pot (asymmetric) ---------------
function censer(ctx, P, st, d) {
  const { main, mt } = P;
  plinth(ctx, 24, P, d);
  const might = main === 0, many = main === 1, craft = main === 2;
  // gallows: post on the left, arm over the top
  rrect(ctx, -10, -26, 4, 33, 1.5); ink(ctx, WOOD, 1.8, -10, -6);
  rrect(ctx, -10, -27, 20, 4, 1.5); ink(ctx, WOOD, 1.8, -10, 10);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(5, -23); ctx.lineTo(2, -15); ctx.moveTo(5, -23); ctx.lineTo(8, -15); ctx.stroke();
  const R = might && mt >= 3 ? 9.5 : 8, cy = -8;
  const A = aim(st);
  const spout = (ang) => { ctx.save(); ctx.translate(5, cy); ctx.rotate(ang);
    poly(ctx, [[R - 2, -3], [R + 7, -2], [R + 7, 2], [R - 2, 3]]); ink(ctx, IRON, 1.5, R, R + 7);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,150,40,0.85)' : 'rgba(255,70,40,0.85)'; ctx.beginPath(); ctx.ellipse(R + 12 + i * 3.5, 0, 5 - i, 2.8 - i * 0.6, 0, 0, TAU); ctx.fill(); }
    ctx.restore(); };
  if (many && mt >= 2) { const n = mt >= 4 ? 3 : 2; for (let i = 0; i < n; i++) spout(A.a + (i - (n - 1) / 2) * 0.7); } else spout(A.a);
  circle(ctx, 5, cy, R); ink(ctx, IRON2, 2, 5 - R, 5 + R);
  if (might && mt >= 2) { // flames over the pot
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (mt >= 4 ? 5 : 3); i++) { const x = 5 + (i - (mt >= 4 ? 2 : 1)) * 3.5, hh = (mt >= 4 ? 14 : 9) * (0.75 + (i % 2) * 0.3); ctx.fillStyle = i % 2 ? 'rgba(255,180,40,0.9)' : 'rgba(255,70,40,0.9)'; ctx.beginPath(); ctx.ellipse(x, cy - R - hh * 0.4, 2.8, hh * 0.6, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  core(ctx, d, 5, cy + 1, 4.8, { glowR: 13, shape: 'drop' });
  if (craft && mt >= 2) for (let i = 0; i < (mt >= 4 ? 4 : 2); i++) { circle(ctx, 9 + i * 2.5, cy - R - 4 - i * 5, 3 + i * 0.8); ctx.fillStyle = 'rgba(60,52,66,0.8)'; ctx.fill(); }
  if (craft && mt >= 4) { ctx.strokeStyle = DMG.arcane.core; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(5, cy - 4); ctx.lineTo(8.5, cy + 3); ctx.lineTo(1.5, cy + 3); ctx.closePath(); ctx.stroke(); }
  return might && mt >= 4 ? -34 : -32;
}

// ---- 7. Focuser: Prism = a big diamond crystal held in a claw over a stand ---------------------
function crystal(ctx, x, y, w, h, d) {
  const D = DMG[d];
  poly(ctx, [[x, y - h], [x + w, y], [x, y + h * 0.55], [x - w, y]]);
  const g = ctx.createLinearGradient(x - w, y - h, x + w, y + h);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, D.core); g.addColorStop(1, shadeHex(D.core, -0.25));
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y); ctx.moveTo(x, y - h); ctx.lineTo(x - w * 0.3, y); ctx.lineTo(x, y + h * 0.55); ctx.stroke();
}
function prism(ctx, P, st, d) {
  const { main, mt } = P;
  plinth(ctx, 20, P, d);
  const might = main === 0, many = main === 1, craft = main === 2;
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 7); ctx.lineTo(0, -2); ctx.moveTo(-8, -9); ctx.quadraticCurveTo(-7, -2, 0, -2); ctx.quadraticCurveTo(7, -2, 8, -9); ctx.stroke();
  ctx.strokeStyle = BRONZE; ctx.lineWidth = 2.2; ctx.stroke();
  const cy = -16;
  if (craft && mt >= 2) { circle(ctx, 0, cy, mt >= 4 ? 17 : 14); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = shadeHex(DMG[d].core, 0.4); ctx.lineWidth = 2.6; ctx.stroke();
    if (mt >= 4) for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 18, cy + Math.sin(a) * 18); ctx.lineTo(Math.cos(a) * 23, cy + Math.sin(a) * 23); ctx.strokeStyle = DMG[d].core; ctx.lineWidth = 2; ctx.stroke(); } }
  glow(ctx, 0, cy, might && mt >= 4 ? 26 : 18, DMG[d].core, 0.5);
  if (many && mt >= 2) { const sx = mt >= 4 ? 13 : 10; crystal(ctx, -sx, cy + 2, 4.5, 8, d); crystal(ctx, sx, cy + 2, 4.5, 8, d); if (mt >= 4) { crystal(ctx, -7, cy - 10, 3.5, 6, d); crystal(ctx, 7, cy - 10, 3.5, 6, d); } }
  const s = might ? (mt >= 4 ? 1.55 : mt >= 2 ? 1.25 : 1) : 1;
  crystal(ctx, 0, cy, 8 * s, 13 * s, d);
  glyph(ctx, 'sun', 0, cy - 1, 4.5 * s, DMG[d].deep);
  return cy - 13 * s - 4;
}

// ---- 8. Emitter: Beacon = a lamp post flying a pennant -------------------------------------------
function beacon(ctx, P, st, d) {
  const { main, mt } = P;
  plinth(ctx, 24, P, d);
  const might = main === 0, many = main === 1, craft = main === 2;
  const top = many && mt >= 3 ? -30 : -24;
  rrect(ctx, -2.5, top, 5, 7 - top, 1.5); ink(ctx, IRON, 1.6, -2.5, 2.5);
  // pennant
  ctx.beginPath(); ctx.moveTo(2.5, top + 7); ctx.lineTo(18, top + 10); ctx.lineTo(13, top + 14.5); ctx.lineTo(18, top + 19); ctx.lineTo(2.5, top + 21); ctx.closePath();
  ink(ctx, DMG[d].deep, 1.6, 2, 18);
  glyph(ctx, 'heart', 9, top + 14, 4.2, '#ffd0e6');
  if (might && mt >= 2) for (const s of [-1, 1]) { const x = s * 10 - (s > 0 ? 4 : 0); if (s > 0) continue; ctx.beginPath(); ctx.ellipse(-11, 6, 6, 5, 0, 0, TAU); ink(ctx, '#a0482a', 1.6, -17, -5); ctx.beginPath(); ctx.ellipse(-11, 2.5, 6, 2, 0, 0, TAU); flat(ctx, '#f0dcb0', 1.2); }
  if (might && mt >= 4) { ctx.beginPath(); ctx.ellipse(-12, -6, 5, 4, 0, 0, TAU); ink(ctx, '#a0482a', 1.4, -17, -7); ctx.beginPath(); ctx.ellipse(-12, -9, 5, 1.6, 0, 0, TAU); flat(ctx, '#f0dcb0', 1); }
  if (craft && mt >= 2) { rrect(ctx, -16, 0, 11, 8, 1.5); ink(ctx, WOOD, 1.6, -16, -5); for (let i = 0; i < (mt >= 4 ? 4 : 2); i++) { circle(ctx, -14 + i * 2.6, -1 - (i % 2) * 2, 2.2); flat(ctx, DMG.radiant.core, 1); } }
  const lampR = many && mt >= 2 ? 6.5 : 5;
  if (many && mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,170,210,0.22)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, top - 3); ctx.lineTo(s * 30, top - 10); ctx.lineTo(s * 30, top + 4); ctx.fill(); } ctx.restore(); }
  rrect(ctx, -lampR - 1, top - lampR * 2 - 2, lampR * 2 + 2, lampR * 2 + 3, 2); ink(ctx, IRON2, 1.8, -lampR, lampR);
  core(ctx, d, 0, top - lampR - 0.5, lampR - 1, { glowR: 16 + (many ? mt * 3 : 0), glyphOn: false });
  roof(ctx, 0, top - lampR * 2 - 2, lampR * 2 + 6, 5);
  return top - lampR * 2 - 8;
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
  if (P.mt >= 4) glow(ctx, 0, -10, 34, DMG[d].glow ? DMG[d].core : '#ffffff', 0.28);
  const top = ART[type](ctx, P, st, d);
  if (P.mt >= 4) crown(ctx, 0, top, d);
  ctx.restore();
}

// Shared pieces, reused by the new-ward mock-ups (dir-lanterns-new.mjs).
export { plinth, pane, roof, crown, IRON, IRON2, BRONZE, WOOD, STEEL };
