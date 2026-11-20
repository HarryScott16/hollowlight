// The four chosen new wards (2026-11-20), in both the Kindlings (B) and Lanterns (A) skins:
//   snare    Thornlight Snare              kept as designed (reuses dir-kindlings-ideas / dir-lanterns-new)
//   moth     Moth Lantern                  kept as designed (Lanterns skin drawn here)
//   wanderA  Wandering Light (a) Lightbreath: a stream of fairy light from its mouth
//   wanderB  Wandering Light (b) Wandlight:   casts star-bolts with a wand
//   vaultA   Ember Vault (1) Coffer:          interest bank (the original concept)
//   vaultB   Ember Vault (2) Gleaning Brazier: banks embers from kills in its radius
//   vaultC   Ember Vault (3) War Chest:       banks gold; break it to spend the gold as a blast
// The Wandering Light draws record muzzle points (st.marks.muzzle, device px) so the attack
// sheets can draw the stream or the star-bolts from the right place. st.fill (0..1) = vault fill.
import { DMG, INK, TAU, mainPath, circle, poly, rrect, star, ink, flat, glow, shadow, notches, secondaryPips, aim, shadeHex, glyph } from './kit.mjs';
import { hearthstone, eyes, tuft, badge, crown as kCrown, mini, WAX, WOOD as KWOOD, BRONZE as KBRONZE } from './dir-kindlings.mjs';
import { plinth, pane, crown as lCrown, IRON, IRON2, BRONZE, WOOD } from './dir-lanterns.mjs';
import { draw as kIdeas } from './dir-kindlings-ideas.mjs';
import { draw as lNew } from './dir-lanterns-new.mjs';

export const CHOSEN = {
  snare:   { name: 'Thornlight Snare', short: 'Snare', family: 'Snare', dmg: 'kinetic', paths: ['Caltrops', 'Flashmines', 'Binding Light'] },
  moth:    { name: 'Moth Lantern', short: 'Moth', family: 'Hanger', dmg: 'radiant', paths: ['Bright Lure', 'Flypaper', 'Moth-trap'] },
  wanderA: { name: 'Wandering Light (a) Lightbreath', short: 'Wander (a)', family: 'Floating', dmg: 'arcane', paths: ['Hunter', 'Swarm', 'Torchbearer'] },
  wanderB: { name: 'Wandering Light (b) Wandlight', short: 'Wander (b)', family: 'Floating', dmg: 'arcane', paths: ['Hunter', 'Swarm', 'Torchbearer'] },
  vaultA:  { name: 'Ember Vault (1) Coffer', short: 'Coffer', family: 'Hoard', dmg: 'hearth', paths: ['Deep Vault', 'Tithe Box', 'Heartfire Coffer'] },
  vaultB:  { name: 'Ember Vault (2) Gleaning Brazier', short: 'Brazier', family: 'Hoard', dmg: 'hearth', paths: ['Great Brazier', 'Gleaners', 'Hearthwarm'] },
  vaultC:  { name: 'Ember Vault (3) War Chest', short: 'War Chest', family: 'Hoard', dmg: 'hearth', paths: ['Iron Chest', 'Small Change', 'Heartlock'] },
};

const GOLD = '#ffcf4a', GOLD2 = '#d89a1a', SPARK = '#f0dcff', PAPER = '#f6e2a8';
const lit = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
const line = (ctx, pts, col, w) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = w + 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
const ring = (ctx, x, y, rx, ry, col, w = 1.4) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.strokeStyle = INK; ctx.lineWidth = w + 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
function mark(ctx, st, key, x, y) {
  if (!st.marks) return;
  const m = ctx.getTransform();
  (st.marks[key] ||= []).push({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f, s: Math.hypot(m.a, m.b) });
}
function groundMarks(ctx, P, d, w, y) { notches(ctx, P.mt, 0, y, w, DMG[d].core, 2.6); secondaryPips(ctx, P.tiers, P.main, w / 2 + 2, y - 0.5); }
function sparkle(ctx, x, y, r, col = '#ffffff') { star(ctx, x, y, r, r * 0.3, 4); ctx.fillStyle = col; ctx.fill(); }
// A heart-shaped glass window that fills with gold from the bottom: the vault's fill gauge.
function heartGauge(ctx, x, y, k, fill) {
  const heart = () => { ctx.beginPath(); ctx.moveTo(x, y + k); ctx.bezierCurveTo(x - k * 1.3, y - k * 0.1, x - k * 0.5, y - k * 1.1, x, y - k * 0.35); ctx.bezierCurveTo(x + k * 0.5, y - k * 1.1, x + k * 1.3, y - k * 0.1, x, y + k); ctx.closePath(); };
  heart(); ctx.fillStyle = '#3a1e34'; ctx.fill();
  ctx.save(); heart(); ctx.clip();
  const top = y + k - fill * k * 1.9;
  const g = ctx.createLinearGradient(0, top, 0, y + k); g.addColorStop(0, '#fff2b0'); g.addColorStop(0.3, GOLD); g.addColorStop(1, GOLD2);
  ctx.fillStyle = g; ctx.fillRect(x - k * 1.4, top, k * 2.8, k * 2);
  ctx.restore();
  heart(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();
  heart(); ctx.strokeStyle = DMG.hearth.core; ctx.lineWidth = 0.9; ctx.stroke();
  if (fill >= 0.95) glow(ctx, x, y, k * 2.6, GOLD, 0.6);
}
function coinStack(ctx, x, y, n) { for (let k = 0; k < n; k++) { ctx.beginPath(); ctx.ellipse(x, y - k * 2.4, 3.8, 1.5, 0, 0, TAU); flat(ctx, GOLD, 0.9); } }
function pouch(ctx, x, y, s = 1) {
  ctx.beginPath(); ctx.moveTo(x - 3 * s, y - 3 * s); ctx.quadraticCurveTo(x - 6 * s, y + 4 * s, x, y + 4.5 * s); ctx.quadraticCurveTo(x + 6 * s, y + 4 * s, x + 3 * s, y - 3 * s); ctx.closePath(); ink(ctx, '#b0805a', 1.3, x - 5 * s, x + 5 * s);
  line(ctx, [[x - 3 * s, y - 3 * s], [x + 3 * s, y - 3 * s]], DMG.hearth.core, 0.9);
  circle(ctx, x, y + 0.8 * s, 1.4 * s); ctx.fillStyle = GOLD; ctx.fill();
}

// ======================= Wandering Light ===========================================================
// Shared structure: no hearthstone/plinth, a soft shadow; Swarm splits it into 2-3 smaller lights;
// Torchbearer carries a rose aura ring; Hunter makes the light and its weapon bigger.
function swarmSpots(mt) { return mt >= 4 ? [[-13, -5, 0.62], [13, -8, 0.62], [0, -16, 0.62]] : [[-11, -5, 0.68], [11, -8, 0.68]]; }
function wander(ctx, P, st, d, flyer) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  ctx.save(); ctx.fillStyle = 'rgba(8,40,34,0.35)'; ctx.beginPath(); ctx.ellipse(0, 11, 11, 3.4, 0, 0, TAU); ctx.fill(); ctx.restore();
  groundMarks(ctx, P, d, 22, 15);
  if (craft && mt >= 2) { glow(ctx, 0, -6, mt >= 4 ? 32 : 24, DMG.hearth.core, 0.3); ring(ctx, 0, 1, mt >= 4 ? 21 : 16, mt >= 4 ? 6 : 5, '#ff9ec8'); }
  const big = might ? (mt >= 4 ? 1.35 : mt >= 2 ? 1.15 : 1) : 1;
  if (many && mt >= 2) { for (const [x, y, s] of swarmSpots(mt)) flyer(ctx, x, y, s, st, d, P, 1); return mt >= 4 ? -31 : -22; }
  flyer(ctx, 0, -6, big, st, d, P, big);
  return -6 - 22 * big;
}
// Kindlings skin: a winged wax spirit.
function kBody(ctx, st, d) {
  for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(k * 10, -9, 7, 3.5, k * -0.5, 0, TAU); ctx.fillStyle = 'rgba(240,235,255,0.78)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, -6, 7.5, 8.5, 0, 0, TAU); ink(ctx, WAX, 2, -7.5, 7.5);
  eyes(ctx, 0, -8, st, { sep: 3, r: 2.4 });
  tuft(ctx, 0, -14, 0.75, d);
}
function kBreath(ctx, x, y, s, st, d, P, big) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  kBody(ctx, st, d);
  const A = aim(st), mx = A.x * 2.6, my = -2.2;
  glow(ctx, mx, my, 6 * big, DMG[d].core, 0.7);
  ctx.beginPath(); ctx.ellipse(mx, my, 2.2, 1.9, 0, 0, TAU); flat(ctx, '#3a1840', 1.1);
  circle(ctx, mx, my, 1); ctx.fillStyle = SPARK; ctx.fill();
  mark(ctx, st, 'muzzle', mx + A.x * 1.5, my);
  ctx.restore();
}
function wand(ctx, x0, y0, st, P, big, hand) {
  const A = aim(st), { main, mt } = P, staff = main === 0 && mt >= 3, craft = main === 2 && mt >= 2;
  const L = staff ? 10 : 9 * Math.min(big, 1.15), tx = x0 + Math.cos(A.a) * L, ty = y0 + Math.sin(A.a) * L;
  line(ctx, [[x0 - Math.cos(A.a) * 2, y0 - Math.sin(A.a) * 2], [tx, ty]], staff ? KWOOD : '#5a3a6a', staff ? 2 : 1.4);
  if (hand) { circle(ctx, x0, y0, 2.3); flat(ctx, WAX, 1.1); }
  if (staff) { poly(ctx, [[tx + Math.cos(A.a) * 5, ty + Math.sin(A.a) * 5], [tx - Math.sin(A.a) * 2.6, ty + Math.cos(A.a) * 2.6], [tx + Math.sin(A.a) * 2.6, ty - Math.cos(A.a) * 2.6]]); flat(ctx, DMG.arcane.core, 1.2); }
  const sx = tx + Math.cos(A.a) * (staff ? 6 : 2), sy = ty + Math.sin(A.a) * (staff ? 6 : 2), R = (staff ? 4 : 3) * (mt >= 4 && main === 0 ? 1.2 : 1);
  glow(ctx, sx, sy, R * 3, craft ? DMG.hearth.core : DMG.arcane.core, 0.75);
  star(ctx, sx, sy, R, R * 0.45, 5); flat(ctx, craft ? '#ffd0e6' : SPARK, 1);
  return [sx, sy];
}
function kWand(ctx, x, y, s, st, d, P, big) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  kBody(ctx, st, d);
  const [sx, sy] = wand(ctx, 6, -3, st, P, s < 0.9 ? 0.8 : big, true);
  mark(ctx, st, 'muzzle', sx, sy);
  ctx.restore();
}
// Lanterns skin: a sky-lantern with no plinth, small iron vanes and motes of lift underneath.
function lBody(ctx, d, aperture, st) {
  lit(ctx, () => { ctx.fillStyle = 'rgba(176,107,255,0.6)'; for (const [x, y, r] of [[0, 10, 1.6], [-3, 13, 1.2], [3, 15, 1]]) { circle(ctx, x, y, r); ctx.fill(); } });
  for (const k of [-1, 1]) { poly(ctx, [[k * 9, -10], [k * 16, -14], [k * 14, -6], [k * 9, -4]]); ink(ctx, IRON2, 1.4, -16, 16); }
  rrect(ctx, -6, -21, 12, 4, 1.5); ink(ctx, IRON2, 1.6, -6, 6);
  circle(ctx, 0, -24, 2.6); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  poly(ctx, [[-8, -17], [8, -17], [10, -7], [8, 3], [-8, 3], [-10, -7]]); ink(ctx, IRON, 2, -10, 10);
  if (aperture) { // the lantern's "mouth": an open round port in its pane, toward the target
    pane(ctx, 0, -7, 12, 15, d, 14);
    const A = aim(st), mx = A.x * 2.5, my = -5;
    ctx.beginPath(); ctx.arc(mx, my, 4.2 * aperture, 0, TAU); ctx.fillStyle = '#2a1238'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = BRONZE; ctx.lineWidth = 1.3; ctx.stroke();
    glow(ctx, mx, my, 9 * aperture, DMG[d].core, 0.8); circle(ctx, mx, my, 1.8 * aperture); ctx.fillStyle = '#ffffff'; ctx.fill();
    mark(ctx, st, 'muzzle', mx + A.x * 3, my);
  } else pane(ctx, 0, -7, 12, 15, d, 14);
  poly(ctx, [[-4, 3], [4, 3], [0, 8]]); ink(ctx, BRONZE, 1.4, -4, 4);
}
function lBreath(ctx, x, y, s, st, d, P, big) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); lBody(ctx, d, big, st); ctx.restore(); }
function lWand(ctx, x, y, s, st, d, P, big) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  lBody(ctx, d, 0, st);
  const [sx, sy] = wand(ctx, 7, 1, st, P, s < 0.9 ? 0.85 : big, false);
  mark(ctx, st, 'muzzle', sx, sy);
  ctx.restore();
}

// ======================= Ember Vault, three executions ============================================
// (1) Coffer. Kindlings: a chest-kindling whose lid is its hat, coins stacking on the lid.
//     Lanterns: a squat box-lantern whose window shows the coin heap.
function kCoffer(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2, f = st.fill ?? 0.6;
  hearthstone(ctx, 32, P, d);
  const w = might ? (mt >= 4 ? 30 : mt >= 2 ? 27 : 24) : 24;
  if (many && mt >= 2) for (const x of mt >= 4 ? [-19, 19] : [19]) { rrect(ctx, x - 4, 2, 8, 7, 1.5); ink(ctx, '#8a5a3a', 1.2, x - 4, x + 4); rrect(ctx, x - 2, 3, 4, 1.2, 0.5); flat(ctx, INK, 0); }
  rrect(ctx, -w / 2, -8, w, 18, 3); ink(ctx, '#8a5a3a', 2, -w / 2, w / 2);
  if (might && mt >= 2) for (const x of [-w / 2 + 4, w / 2 - 4]) { rrect(ctx, x - 1.5, -8, 3, 18, 1); flat(ctx, KBRONZE, 1); }
  eyes(ctx, 0, -2, st, { sep: 4.4, r: 3 }); badge(ctx, 0, 6, 3, d);
  ctx.beginPath(); ctx.moveTo(-w / 2 - 2, -8); ctx.quadraticCurveTo(0, -20, w / 2 + 2, -8); ctx.closePath(); ink(ctx, '#a06a40', 2, -w / 2, w / 2);
  const n = Math.round(f * 4);
  coinStack(ctx, -5, -14, n); coinStack(ctx, 0, -15.5, Math.round(f * 5)); coinStack(ctx, 5, -14, Math.max(0, n - 1));
  const top = -15.5 - Math.round(f * 5) * 2.4;
  if (f >= 0.95) glow(ctx, 0, top + 2, 14, GOLD, 0.55);
  if (craft && mt >= 2) { tuft(ctx, -w / 2 + 1, -9, mt >= 4 ? 1 : 0.8, d); glyph(ctx, 'heart', -w / 2 + 1, -14, 3, '#ffd0e6'); }
  return top - 3;
}
function lCoffer(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2, f = st.fill ?? 0.6;
  plinth(ctx, 32, P, d);
  const w = might ? (mt >= 4 ? 30 : mt >= 2 ? 27 : 24) : 24;
  if (many && mt >= 2) for (const x of mt >= 4 ? [-19, 19] : [19]) { rrect(ctx, x - 4, -1, 8, 8, 1.2); ink(ctx, IRON2, 1.3, x - 4, x + 4); rrect(ctx, x - 2.5, 1, 5, 4, 1); flat(ctx, GOLD, 0.8); }
  rrect(ctx, -w / 2, -12, w, 19, 2); ink(ctx, IRON, 2, -w / 2, w / 2);
  if (might && mt >= 2) for (const x of [-w / 2 + 3, w / 2 - 3]) { rrect(ctx, x - 1.5, -12, 3, 19, 1); flat(ctx, BRONZE, 1); }
  const ww = w - 10;
  rrect(ctx, -ww / 2, -9, ww, 13, 2); ctx.fillStyle = '#2a1e2e'; ctx.fill();
  ctx.save(); rrect(ctx, -ww / 2, -9, ww, 13, 2); ctx.clip();
  glow(ctx, 0, 0, 14, DMG[d].core, 0.5);
  ctx.beginPath(); ctx.ellipse(0, 4, ww * 0.55, 1 + f * 12, 0, Math.PI, TAU); const g = ctx.createLinearGradient(0, 4 - f * 12, 0, 4); g.addColorStop(0, '#fff2b0'); g.addColorStop(0.4, GOLD); g.addColorStop(1, GOLD2); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  rrect(ctx, -ww / 2, -9, ww, 13, 2); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
  glyph(ctx, 'heart', 0, -3, 3.4, DMG[d].core);
  poly(ctx, [[-w / 2 - 2, -12], [w / 2 + 2, -12], [w / 2 - 4, -19], [-w / 2 + 4, -19]]); ink(ctx, BRONZE, 2, -w / 2, w / 2);
  rrect(ctx, -4, -16.5, 8, 2, 1); flat(ctx, INK, 0);
  if (f >= 0.95) glow(ctx, 0, -14, 16, GOLD, 0.55);
  if (craft && mt >= 2) { const R = mt >= 4 ? 4.5 : 3.6; glow(ctx, 0, -24, R * 3.5, DMG[d].core, 0.6); circle(ctx, 0, -24, R); flat(ctx, DMG[d].core, 1.3); glyph(ctx, 'heart', 0, -24, R, '#7a1840'); return -30; }
  return -21;
}
// (2) Gleaning Brazier. Kindlings: a kindling tending a brazier whose ember pile = fill.
//     Lanterns: an iron cresset on three legs; the ember heap and flame = fill.
function emberBowl(ctx, x, y, w, f, d, iron) {
  ctx.beginPath(); ctx.ellipse(x, y, w, 3.6, 0, Math.PI, TAU); ctx.fillStyle = '#20141e'; ctx.fill();
  if (f > 0.05) {
    ctx.beginPath(); ctx.ellipse(x, y, w - 2, 1.5 + f * 7, 0, Math.PI, TAU); const g = ctx.createLinearGradient(0, y - f * 8, 0, y); g.addColorStop(0, '#ffe7a0'); g.addColorStop(0.45, '#ff9a3a'); g.addColorStop(1, '#a8341a'); ctx.fillStyle = g; ctx.fill();
    for (let i = 0; i < 5; i++) { circle(ctx, x - w * 0.6 + i * w * 0.3, y - 1 - (i % 2) * f * 3, 1.1); ctx.fillStyle = '#fff1c0'; ctx.fill(); }
    glow(ctx, x, y - f * 6, w * (1 + f), '#ff9a3a', 0.55);
    if (f > 0.3) { // the flame on top is the Hearth colour
      const h = 4 + f * 10;
      ctx.beginPath(); ctx.moveTo(x - 4, y - f * 6); ctx.quadraticCurveTo(x - 5, y - f * 6 - h * 0.6, x, y - f * 6 - h); ctx.quadraticCurveTo(x + 5, y - f * 6 - h * 0.6, x + 4, y - f * 6); ctx.closePath(); flat(ctx, DMG[d].core, 1.3);
      ctx.beginPath(); ctx.moveTo(x - 2, y - f * 6); ctx.quadraticCurveTo(x - 2, y - f * 6 - h * 0.4, x, y - f * 6 - h * 0.6); ctx.quadraticCurveTo(x + 2, y - f * 6 - h * 0.4, x + 2, y - f * 6); ctx.closePath(); ctx.fillStyle = '#ffe6f2'; ctx.fill();
    }
  }
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * 0.9, y + 7, x, y + 7); ctx.quadraticCurveTo(x + w * 0.9, y + 7, x + w, y); ctx.ellipse(x, y, w, 3.6, 0, 0, Math.PI); ctx.closePath(); ink(ctx, iron, 1.8, x - w, x + w);
  return y - (f > 0.3 ? f * 6 + 4 + f * 10 : 4);
}
function heatRings(ctx, x, y, n) { lit(ctx, () => { for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.ellipse(x, y + 8, 18 + i * 6, 5 + i * 1.8, 0, 0, TAU); ctx.strokeStyle = `rgba(255,126,182,${0.6 - i * 0.15})`; ctx.lineWidth = 1.4; ctx.stroke(); } }); }
function gleaners(ctx, n, cx, cy) { // embers drifting in from outside, with trails
  lit(ctx, () => { for (let i = 0; i < n; i++) { const a = Math.PI + 0.5 + i * (2.2 / n), r = 24, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.6;
    ctx.strokeStyle = 'rgba(255,154,58,0.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (x - cx) * 0.25, y + (y - cy) * 0.25); ctx.stroke(); circle(ctx, x, y, 1.8); ctx.fillStyle = '#ffd27a'; ctx.fill(); } });
}
function kBrazier(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2, f = st.fill ?? 0.6;
  hearthstone(ctx, 34, P, d);
  if (craft && mt >= 2) heatRings(ctx, 5, -4, mt >= 4 ? 3 : 2);
  const w = might ? (mt >= 4 ? 14 : mt >= 2 ? 12.5 : 11) : 11, bx = 5, by = -6;
  for (const lx of [-0.6, 0, 0.6]) line(ctx, [[bx + lx * w, by + 5], [bx + lx * w * 1.3, 10]], '#3f4763', 1.4);
  rrect(ctx, -17, -8, 12, 17, 5); ink(ctx, WAX, 2, -17, -5); eyes(ctx, -11, -2, st, { sep: 2.8, r: 2.3 }); tuft(ctx, -11, -8, 0.7, d);
  line(ctx, [[-6, 1], [bx - w + 1, by + 2]], KWOOD, 1.2); // a little poker
  const top = emberBowl(ctx, bx, by, w, f, d, '#3f4763');
  badge(ctx, bx, by + 3.5, 2.6, d);
  if (many && mt >= 2) { mini(ctx, -21, 11, st, d, 0.5); if (mt >= 4) mini(ctx, 22, 11, st, d, 0.5); gleaners(ctx, mt >= 4 ? 5 : 3, bx, by); }
  return Math.min(top, -16) - 2;
}
function lBrazier(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2, f = st.fill ?? 0.6;
  plinth(ctx, 30, P, d);
  if (craft && mt >= 2) heatRings(ctx, 0, -6, mt >= 4 ? 3 : 2);
  const w = might ? (mt >= 4 ? 15 : mt >= 2 ? 13 : 11.5) : 11.5, by = -9;
  for (const lx of [-0.7, 0, 0.7]) line(ctx, [[lx * w, by + 4], [lx * w * 1.15, 8]], IRON2, 1.8);
  rrect(ctx, -2.5, by + 6, 5, 9, 1); ink(ctx, IRON, 1.4, -2.5, 2.5);
  const top = emberBowl(ctx, 0, by, w, f, d, IRON);
  for (const k of [-0.5, 0, 0.5]) line(ctx, [[k * w * 1.6, by + 1], [k * w * 1.1, by + 6]], IRON2, 0.8);
  badge(ctx, 0, by + 4, 2.4, d);
  if (many && mt >= 2) gleaners(ctx, mt >= 4 ? 6 : 4, 0, by);
  return Math.min(top, -18) - 2;
}
// (3) War Chest. Kindlings: a fat round kindling with a heart-shaped glass belly that fills with
//     gold and a padlock shackle on top. Lanterns: an iron strongbox with the same heart window.
function kWarChest(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2, f = st.fill ?? 0.6;
  hearthstone(ctx, 32, P, d);
  const R = might && mt >= 2 ? (mt >= 4 ? 15.5 : 14.5) : 13.5;
  if (many && mt >= 2) for (const x of mt >= 4 ? [-19, 19, 14] : [-19, 19]) pouch(ctx, x, x === 14 ? 4 : 7, 0.9);
  ctx.beginPath(); ctx.arc(0, -11, 6, Math.PI, 0); ctx.strokeStyle = INK; ctx.lineWidth = 4.2; ctx.stroke(); ctx.strokeStyle = '#8890a8'; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -1, R, R * 0.85, 0, 0, TAU); ink(ctx, WAX, 2.2, -R, R);
  if (might && mt >= 2) for (const x of [-R * 0.62, R * 0.62]) { ctx.beginPath(); ctx.ellipse(x * 0.98, -1, 1.6, R * 0.72, 0, 0, TAU); flat(ctx, '#5a5f78', 1); }
  eyes(ctx, 0, -6, st, { sep: 4, r: 2.8 });
  heartGauge(ctx, 0, 4, 5.4, f);
  if (craft && mt >= 2) { for (const s of [-1, 1]) { ctx.setLineDash([2.4, 1.6]); line(ctx, [[s * R * 0.9, -7], [-s * R * 0.4, 10]], '#9aa2b8', 1.2); ctx.setLineDash([]); } if (mt >= 4) glow(ctx, 0, 4, 18, DMG[d].core, 0.5); }
  tuft(ctx, 0, -17, 0.75, d);
  return -29;
}
function lWarChest(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2, f = st.fill ?? 0.6;
  plinth(ctx, 34, P, d);
  const w = might ? (mt >= 4 ? 30 : mt >= 2 ? 28 : 26) : 26;
  if (many && mt >= 2) for (const x of mt >= 4 ? [-w / 2 - 3, w / 2 + 3, 0] : [-w / 2 - 3, w / 2 + 3]) { if (x) { line(ctx, [[x, -10], [x, -6]], IRON2, 0.8); pouch(ctx, x, -2, 0.9); } else pouch(ctx, 0, -25, 0.8); }
  rrect(ctx, -w / 2, -13, w, 20, 2); ink(ctx, IRON2, 2, -w / 2, w / 2);
  for (const [x, y] of [[-w / 2 + 2.5, -10.5], [w / 2 - 2.5, -10.5], [-w / 2 + 2.5, 4.5], [w / 2 - 2.5, 4.5]]) { circle(ctx, x, y, 1); ctx.fillStyle = '#c9d0de'; ctx.fill(); }
  if (might && mt >= 2) for (const x of [-w / 2 + 5.5, w / 2 - 5.5]) { rrect(ctx, x - 1.6, -13, 3.2, 20, 1); flat(ctx, BRONZE, 1); }
  heartGauge(ctx, 0, -2.5, 6.6, f);
  rrect(ctx, -w / 2 - 1.5, -17, w + 3, 4.5, 1.5); ink(ctx, BRONZE, 1.8, -w / 2, w / 2);
  if (craft && mt >= 2) { ctx.setLineDash([2.6, 1.8]); for (const s of [-1, 1]) line(ctx, [[s * w / 2, -15], [-s * w / 2, 6]], '#9aa2b8', 1.2); ctx.setLineDash([]); circle(ctx, 0, 7, 3); flat(ctx, '#8890a8', 1.2); if (mt >= 4) glow(ctx, 0, -2, 22, DMG[d].core, 0.5); }
  const R = 3.2; glow(ctx, 0, -21, 10, DMG[d].core, 0.55); circle(ctx, 0, -21, R); flat(ctx, DMG[d].core, 1.3);
  return -26;
}

// ======================= Moth Lantern, Lanterns skin ==============================================
function lMoth(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  plinth(ctx, 22, P, d);
  ctx.beginPath(); ctx.moveTo(-5, 8); ctx.lineTo(-5, -22); ctx.arc(2, -22, 7, Math.PI, 0); ctx.lineTo(9, -18);
  ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 4.4; ctx.stroke(); ctx.strokeStyle = IRON2; ctx.lineWidth = 2.4; ctx.stroke();
  const r = might ? (mt >= 4 ? 8.5 : mt >= 2 ? 7.2 : 6) : 6, cx = 9, cy = -18 + r + 2;
  if (craft && mt >= 2) { rrect(ctx, cx - r - 3, cy - r * 1.2 - 2, (r + 3) * 2, r * 2.4 + 4, 3); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = BRONZE; ctx.lineWidth = 1.4; ctx.stroke(); }
  glow(ctx, cx, cy, r * 3.6, DMG[d].core, 0.55);
  rrect(ctx, cx - 2.5, cy - r * 1.2 - 2, 5, 2.5, 1); flat(ctx, IRON2, 1);
  ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 1.2, 0, 0, TAU); ink(ctx, PAPER, 1.6, cx - r, cx + r);
  for (const k of [-0.5, 0.5]) { ctx.beginPath(); ctx.ellipse(cx, cy, r * Math.abs(k) * 1.2, r * 1.2, 0, 0, TAU); ctx.strokeStyle = 'rgba(160,110,40,0.7)'; ctx.lineWidth = 0.8; ctx.stroke(); }
  glyph(ctx, 'sun', cx, cy, r * 0.8, DMG[d].deep);
  if (craft && mt >= 2) for (let i = 0; i < 4; i++) { const x = cx - r - 3 + (i + 0.5) * ((r + 3) * 2 / 4); line(ctx, [[x, cy - r * 1.2 - 2], [x, cy + r * 1.2 + 2]], BRONZE, 0.7); }
  const moths = many ? (mt >= 4 ? 6 : mt >= 2 ? 4 : 2) : 2;
  for (let i = 0; i < moths; i++) { const a = i * 2.4 + 0.6, mx = cx + Math.cos(a) * (r + 8), my = cy + Math.sin(a) * (r + 6);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(mx + s * 1.8, my, 2.2, 1.4, s * 0.5, 0, TAU); flat(ctx, '#efe6d0', 0.7); } }
  if (many && mt >= 2) lit(ctx, () => { ctx.strokeStyle = 'rgba(255,240,180,0.5)'; ctx.lineWidth = 0.8; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx, cy + r * 1.2); ctx.lineTo(cx - 8 + i * 6, cy + r + 12); ctx.stroke(); } });
  if (might && mt >= 4) lit(ctx, () => { ctx.strokeStyle = 'rgba(255,224,58,0.7)'; ctx.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r + 4), cy + Math.sin(a) * (r + 4)); ctx.lineTo(cx + Math.cos(a) * (r + 9), cy + Math.sin(a) * (r + 9)); ctx.stroke(); } });
  return -33;
}

// ======================= skins =====================================================================
const K = {
  wanderA: (c, P, st, d) => wander(c, P, st, d, kBreath), wanderB: (c, P, st, d) => wander(c, P, st, d, kWand),
  vaultA: kCoffer, vaultB: kBrazier, vaultC: kWarChest,
};
const L = {
  moth: lMoth, wanderA: (c, P, st, d) => wander(c, P, st, d, lBreath), wanderB: (c, P, st, d) => wander(c, P, st, d, lWand),
  vaultA: lCoffer, vaultB: lBrazier, vaultC: lWarChest,
};
function wrap(art, crownFn, glowY) {
  return (ctx, type, tiers, st) => {
    const P = { ...mainPath(tiers), tiers }, d = CHOSEN[type].dmg;
    const s = 0.95 + P.lvl * 0.035 + (P.mt >= 4 ? 0.08 : 0);
    ctx.save(); ctx.translate(0, 12);
    if (!type.startsWith('wander')) shadow(ctx, 15 * s);
    ctx.translate(0, 14); ctx.scale(s, s); ctx.translate(0, -14);
    if (P.mt >= 4) glow(ctx, 0, glowY, 32, DMG[d].glow ? DMG[d].core : '#ffffff', 0.28);
    const top = art[type](ctx, P, st, d);
    if (P.mt >= 4) crownFn(ctx, 0, top + 1, d);
    ctx.restore();
  };
}
const kDraw = wrap(K, kCrown, -8), lDraw = wrap(L, lCrown, -10);
export const SKINS = {
  kindlings: { title: 'B · Kindlings', draw: (ctx, type, tiers, st) => (type === 'snare' || type === 'moth' ? kIdeas(ctx, type, tiers, st) : kDraw(ctx, type, tiers, st)) },
  lanterns: { title: 'A · Lanterns', draw: (ctx, type, tiers, st) => (type === 'snare' ? lNew(ctx, type, tiers, st) : lDraw(ctx, type, tiers, st)) },
};

// ======================= Wandering Light attacks (device px) ======================================
// muzzles: [{x,y,s}] from the ward draw; targets: [{x,y,r}] (device px); Z = px per game unit.
const AR = DMG.arcane.core;
export function drawAttack(ctx, variant, tiers, muzzles, targets, Z) {
  const P = mainPath(tiers), { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  muzzles.forEach((m, i) => {
    const t = targets[Math.min(i, targets.length - 1)];
    if (variant === 'a') breath(ctx, m, t, Z, { w: (might ? (mt >= 4 ? 2.6 : mt >= 2 ? 1.6 : 1) : many && mt >= 2 ? 0.7 : 1), spiral: might && mt >= 4, craft: craft && mt >= 2, big: craft && mt >= 4 });
    else bolts(ctx, m, t, Z, { size: might ? (mt >= 4 ? 2 : mt >= 2 ? 1.4 : 1) : many && mt >= 2 ? 0.75 : 1, comet: might && mt >= 4, volley: many && mt >= 4 ? 2 : 1, craft: craft && mt >= 2, big: craft && mt >= 4 });
  });
  ctx.restore();
}
function burst(ctx, x, y, R, Z, n = 8, col = SPARK) {
  glow(ctx, x, y, R * 1.6, AR, 0.7);
  lit(ctx, () => { for (let i = 0; i < n; i++) { const a = (i / n) * TAU + 0.3, r = R * (0.6 + (i % 2) * 0.4); sparkle(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, (1.8 + (i % 2)) * Z * 0.6, col); } });
  sparkle(ctx, x, y, R * 0.45, '#ffffff');
}
function markRune(ctx, x, y, Z, big) {
  const rx = (big ? 18 : 13) * Z, ry = rx * 0.38;
  lit(ctx, () => { ctx.strokeStyle = 'rgba(255,126,182,0.85)'; ctx.lineWidth = 1.4 * Z; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * rx * 0.7, y + Math.sin(a) * ry * 0.7); ctx.lineTo(x + Math.cos(a + 0.5) * rx * 0.7, y + Math.sin(a + 0.5) * ry * 0.7); ctx.stroke(); } });
}
function breath(ctx, m, t, Z, o) {
  const dx = t.x - m.x, dy = t.y - m.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const w0 = 1.6 * Z * o.w, w1 = 4.5 * Z * o.w;
  lit(ctx, () => {
    for (const [mul, col] of [[1.8, 'rgba(176,107,255,0.28)'], [1, 'rgba(190,130,255,0.6)'], [0.4, 'rgba(255,255,255,0.9)']]) {
      ctx.beginPath(); const N = 24;
      for (let i = 0; i <= N; i++) { const k = i / N, w = (w0 + (w1 - w0) * k) * mul, wav = Math.sin(k * 9) * Z * 1.2 * o.w; ctx.lineTo(m.x + dx * k + nx * (w + wav), m.y + dy * k + ny * (w + wav)); }
      for (let i = N; i >= 0; i--) { const k = i / N, w = (w0 + (w1 - w0) * k) * mul, wav = Math.sin(k * 9) * Z * 1.2 * o.w; ctx.lineTo(m.x + dx * k - nx * (w - wav), m.y + dy * k - ny * (w - wav)); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
    for (let i = 0; i < 9; i++) { const k = 0.12 + i * 0.095, j = ((i * 37) % 7 - 3) / 3; sparkle(ctx, m.x + dx * k + nx * j * (w0 + (w1 - w0) * k) * 1.6, m.y + dy * k + ny * j * (w0 + (w1 - w0) * k) * 1.6, (1.2 + (i % 3) * 0.5) * Z * Math.min(1.4, o.w), '#ffffff'); }
    if (o.spiral) { ctx.strokeStyle = 'rgba(255,240,255,0.95)'; ctx.lineWidth = 1.1 * Z; ctx.beginPath(); for (let i = 0; i <= 60; i++) { const k = i / 60, r = (w0 + (w1 - w0) * k) * 1.5; ctx.lineTo(m.x + dx * k + nx * Math.sin(k * 26) * r, m.y + dy * k + ny * Math.sin(k * 26) * r); } ctx.stroke(); }
  });
  if (o.craft) { // Torchbearer: the stream sheds motes of light that linger on the ground under it
    lit(ctx, () => { for (let i = 0; i < (o.big ? 9 : 5); i++) { const k = 0.25 + i * (0.7 / (o.big ? 9 : 5)), x = m.x + dx * k, y = Math.max(m.y + dy * k, t.y) + 10 * Z + ((i * 13) % 5) * Z; ctx.fillStyle = 'rgba(255,126,182,0.8)'; ctx.beginPath(); ctx.ellipse(x, y, (o.big ? 6 : 4.5) * Z, 2.2 * Z, 0, 0, TAU); ctx.fill(); sparkle(ctx, x, y - 2 * Z, 1.5 * Z, '#ffd0e6'); } });
  }
  burst(ctx, t.x - ux * t.r * 0.3, t.y - uy * t.r * 0.3, (6 + 5 * o.w) * Z, Z, o.spiral ? 12 : 8);
  if (o.spiral) lit(ctx, () => { ctx.strokeStyle = 'rgba(240,220,255,0.8)'; ctx.lineWidth = 1.5 * Z; ctx.beginPath(); ctx.ellipse(t.x, t.y, 18 * Z, 7 * Z, 0, 0, TAU); ctx.stroke(); });
  glow(ctx, m.x, m.y, 5 * Z * o.w, '#ffffff', 0.8);
}
function bolts(ctx, m, t, Z, o) {
  const dx = t.x - m.x, dy = t.y - m.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  glow(ctx, m.x, m.y, 7 * Z * o.size, AR, 0.8); sparkle(ctx, m.x, m.y, 3 * Z * o.size, '#ffffff'); // cast flash at the wand tip
  for (let v = 0; v < o.volley; v++) {
    const k = 0.56 - v * 0.24, off = v ? 4 * Z : 0, arc = Math.sin(k * Math.PI) * 7 * Z * (v ? -1 : 1);
    const px = m.x + dx * k + nx * (arc + off), py = m.y + dy * k + ny * (arc + off), R = 4.8 * Z * o.size;
    lit(ctx, () => { // the trail: a fading tail of sparkles (a long comet tail on Hunter T4)
      const tail = o.comet ? 0.5 : 0.3, n = o.comet ? 16 : 9;
      { const kk = Math.max(0.02, k - tail); ctx.strokeStyle = o.craft ? 'rgba(255,170,210,0.55)' : 'rgba(200,150,255,0.55)'; ctx.lineWidth = R * (o.comet ? 1.1 : 0.6); ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i <= 12; i++) { const q = kk + (k - kk) * (i / 12), ax = Math.sin(q * Math.PI) * 7 * Z * (v ? -1 : 1); ctx.lineTo(m.x + dx * q + nx * (ax + off), m.y + dy * q + ny * (ax + off)); } ctx.stroke(); }
      for (let i = 1; i <= n; i++) { const kk = k - tail * (i / n), ax = Math.sin(kk * Math.PI) * 7 * Z * (v ? -1 : 1), x = m.x + dx * kk + nx * (ax + off), y = m.y + dy * kk + ny * (ax + off);
        ctx.fillStyle = `rgba(${o.craft ? '255,190,220' : '225,200,255'},${0.95 * (1 - i / (n + 1))})`; circle(ctx, x, y, R * (o.comet ? 0.8 : 0.5) * (1 - i / (n + 2))); ctx.fill(); if (i % 3 === 1) sparkle(ctx, x + ny * R * 0.8, y - nx * R * 0.8, R * 0.45, '#ffffff'); }
    });
    glow(ctx, px, py, R * 3, o.craft ? DMG.hearth.core : AR, 0.8);
    star(ctx, px, py, R, R * 0.45, 5, Math.atan2(uy, ux)); flat(ctx, o.craft ? '#ffd0e6' : SPARK, Math.max(1, Z * 0.7));
    circle(ctx, px, py, R * 0.3); ctx.fillStyle = '#ffffff'; ctx.fill();
  }
  // the previous star landing: a starburst on the target
  burst(ctx, t.x - ux * t.r * 0.3, t.y - uy * t.r * 0.3, (o.comet ? 13 : 7) * Z * Math.max(0.8, o.size * 0.8), Z, o.comet ? 10 : 6);
  if (o.comet) lit(ctx, () => { ctx.strokeStyle = 'rgba(240,220,255,0.85)'; ctx.lineWidth = 1.6 * Z; ctx.beginPath(); ctx.ellipse(t.x, t.y + 6 * Z, 22 * Z, 8 * Z, 0, 0, TAU); ctx.stroke(); });
  if (o.craft) markRune(ctx, t.x, t.y + t.r * 0.9, Z, o.big);
}
