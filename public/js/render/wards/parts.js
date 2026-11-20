// Props shared by BOTH skins for the Mortar Kiln, Storm Coil, Prism and Beacon (the Bolt Ward's
// are in bolt-parts.js). Each ward's paths follow the upgrade framework
// (docs/upgrade-visuals-research.md): MIGHT = one bigger thing, MANY = it multiplies,
// CRAFT = the special trick. Gear is drawn beside or behind a ward's body, never over its face.
import { DMG, INK, TAU, circle, poly, rrect, star, ink, flat, line, glow, glyph, shade } from './kit.js';

export const IRON = '#3a4160', IRON2 = '#5a6478', GOLD = '#ffcf4a', BRASS = '#c8963a', COPPER = '#d0783a', SOOT = '#2a2024';

// ---- Mortar Kiln ---------------------------------------------------------------------------------
// The mortar tube leans toward the target, from (x, y) up. Returns its mouth.
export function tubeLean(ang) { return Math.max(-0.55, Math.min(0.55, Math.cos(ang) * 0.5)); }
export function tube(ctx, x, y, lean, w, L, { fill = '#5a5f70', bands = 1, gold = false, hot = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(lean);
  poly(ctx, [[-w * 0.45, 0], [w * 0.45, 0], [w * 0.55, -L], [-w * 0.55, -L]]); ink(ctx, fill, 1.8, -w / 2, w / 2);
  for (let i = 0; i < bands; i++) { const y0 = -L * (0.3 + i * 0.3); rrect(ctx, -w * 0.55, y0 - 1.3, w * 1.1, 2.6, 1); flat(ctx, gold ? GOLD : '#8a90a0', 1); }
  ctx.beginPath(); ctx.ellipse(0, -L, w * 0.6, w * 0.22, 0, 0, TAU); flat(ctx, gold ? GOLD : '#3a3440', 1.3);
  ctx.beginPath(); ctx.ellipse(0, -L, w * 0.42, w * 0.14, 0, 0, TAU); ctx.fillStyle = hot ? '#ffb347' : '#140e18'; ctx.fill();
  if (hot) glow(ctx, 0, -L, w * (0.9 + hot), '#ff7a2a', 0.5 + hot * 0.3);
  ctx.restore();
  return [x + Math.sin(lean) * L, y - Math.cos(lean) * L];
}
export function shell(ctx, x, y, r = 3.2, hot = false) {
  circle(ctx, x, y, r); flat(ctx, hot ? '#8a2a1a' : '#2e2a34', 1.1);
  circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.3); ctx.fillStyle = hot ? '#ffb347' : '#6a6478'; ctx.fill();
  line(ctx, [[x, y - r], [x + 1, y - r - 2.2]], '#c9925a', 0.6);
  if (hot) glow(ctx, x, y, r * 2, '#ff7a2a', 0.5);
}
export function crate(ctx, x, y, w = 7, h = 5) { rrect(ctx, x - w / 2, y, w, h, 1); ink(ctx, '#6a4a2a', 1.1, x - w / 2, x + w / 2); line(ctx, [[x - w / 2 + 1, y + 1], [x + w / 2 - 1, y + h - 1]], '#4a3020', 0.5); }
export function cinderPool(ctx, x, y, w, t) {
  ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.28, 0, 0, TAU); ctx.fillStyle = '#3a1410'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y, w * 0.8, w * 0.2, 0, 0, TAU); ctx.fillStyle = '#ff7a2a'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - w * 0.2, y - 0.4, w * 0.35, w * 0.08, 0, 0, TAU); ctx.fillStyle = '#ffd27a'; ctx.fill();
}
export function chimney(ctx, x, y, h) { rrect(ctx, x - 2.6, y - h, 5.2, h, 1); ink(ctx, '#7a3a24', 1.4, x - 2.6, x + 2.6); rrect(ctx, x - 3.4, y - h - 1.5, 6.8, 2.4, 0.8); flat(ctx, '#3a3440', 1); }
export function smokePuffs(ctx, x, y, n, t, dark = 0.7) {
  for (let i = 0; i < n; i++) { const u = (t * 0.45 + i / n) % 1; circle(ctx, x + u * 5 + Math.sin(t + i) * 1.5, y - u * 16, 2.2 + u * 3.5); ctx.fillStyle = `rgba(52,44,56,${dark * (1 - u)})`; ctx.fill(); }
}
export function lavaCracks(ctx, pts, col = '#ffb347', w = 0.8) { for (const p of pts) line(ctx, p, col, w); }

// ---- Storm Coil ------------------------------------------------------------------------------------
// A copper prong ending in an orb; the orb is where the lightning leaves.
export function prong(ctx, x0, y0, x1, y1, w = 2.6) {
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + (x1 - x0) * 0.2, y1 + (y0 - y1) * 0.4, x1, y1);
  ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = w + 2; ctx.stroke(); ctx.strokeStyle = COPPER; ctx.lineWidth = w; ctx.stroke(); ctx.lineCap = 'butt';
}
export function orb(ctx, x, y, r, d, t = 0, k = 1) {
  const D = DMG[d];
  glow(ctx, x, y, r * 3, D.core, 0.55 * k + Math.sin(t * 9) * 0.08);
  circle(ctx, x, y, r); flat(ctx, D.core, 1.2);
  circle(ctx, x - r * 0.3, y - r * 0.3, r * 0.35); ctx.fillStyle = '#ffffff'; ctx.fill();
}
// A short jagged arc between two points (live: it re-jags every frame).
export function zap(ctx, x0, y0, x1, y1, t, amp = 3, col = '#e8d4ff', w = 1.3) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny) || 1;
  for (const [ww, c] of [[w * 3, 'rgba(176,107,255,0.45)'], [w, col]]) {
    ctx.beginPath(); ctx.moveTo(x0, y0);
    for (let k = 1; k < 5; k++) { const u = k / 5, o = Math.sin(t * 37 + k * 2.3 + x0) * amp; ctx.lineTo(x0 + (x1 - x0) * u + (nx / L) * o, y0 + (y1 - y0) * u + (ny / L) * o); }
    ctx.lineTo(x1, y1); ctx.strokeStyle = c; ctx.lineWidth = ww; ctx.stroke();
  }
  ctx.restore();
}
export function pylon(ctx, x, y, h, d) { // a small tesla pylon on the ground; returns its tip
  poly(ctx, [[x - 3, y], [x + 3, y], [x + 1.2, y - h], [x - 1.2, y - h]]); ink(ctx, '#5a6478', 1.3, x - 3, x + 3);
  for (let i = 1; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(x, y - h * i * 0.3, 3.2, 1.1, 0, 0, TAU); ctx.strokeStyle = COPPER; ctx.lineWidth = 1.2; ctx.stroke(); }
  return [x, y - h - 2];
}
export function cloud(ctx, x, y, w, dark = false, fill = null) {
  ctx.beginPath();
  for (const [dx, dy, r] of [[-w * 0.5, 1, w * 0.32], [-w * 0.15, -w * 0.18, w * 0.4], [w * 0.3, -w * 0.05, w * 0.36], [w * 0.55, 1.5, w * 0.26]]) { ctx.moveTo(x + dx + r, y + dy); ctx.arc(x + dx, y + dy, r, 0, TAU); }
  flat(ctx, fill || (dark ? '#4a4660' : '#8a86a8'), 1.4);
}
// A gyroscope ring around the body (the Static path): the back half is drawn in `back`, the front half in `front`.
export function gyro(ctx, cx, cy, rx, ry, tilt, half, col = BRASS, w = 1.6) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, half === 'back' ? Math.PI : 0, half === 'back' ? TAU : Math.PI);
  ctx.strokeStyle = INK; ctx.lineWidth = w + 1.6; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  ctx.restore();
}

// ---- Prism -----------------------------------------------------------------------------------------
export function gem(ctx, x, y, w, h, d, fill) {
  const D = DMG[d];
  poly(ctx, [[x, y - h], [x + w, y - h * 0.15], [x, y + h * 0.75], [x - w, y - h * 0.15]]);
  const g = ctx.createLinearGradient(x - w, y - h, x + w, y + h); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, fill || D.core); g.addColorStop(1, shade(fill || D.core, -0.3));
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x, y + h * 0.75); ctx.moveTo(x - w, y - h * 0.15); ctx.lineTo(x + w, y - h * 0.15); ctx.stroke();
}
export function shard(ctx, x, y, s, a) { // a small floating crystal shard (live)
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); poly(ctx, [[0, -4.5 * s], [2 * s, 0], [0, 4.5 * s], [-2 * s, 0]]); flat(ctx, '#fff6c0', 1); ctx.restore();
}
export function lensRing(ctx, x, y, r, gold = true) {
  circle(ctx, x, y, r + 1.8); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = gold ? GOLD : BRASS; ctx.lineWidth = 2.2; ctx.stroke();
  circle(ctx, x, y, r); ctx.fillStyle = 'rgba(255,250,210,0.35)'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.35, r * 0.25, r * 0.12, -0.7, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
}
export function sunDisc(ctx, x, y, r, t, n = 12) { // drawn behind (back layer): a turning disc of rays
  glow(ctx, x, y, r * 2.2, '#ffe03a', 0.45);
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.4);
  star(ctx, 0, 0, r * 1.35, r * 0.95, n, 0); flat(ctx, '#ffcf4a', 1.4);
  ctx.restore();
  circle(ctx, x, y, r); flat(ctx, '#fff3a0', 1.4);
}
export function starBurst(ctx, x, y, r, t, k = 1) { // Afterglow: a pulsing star behind the body
  const p = 1 + Math.sin(t * 3) * 0.08;
  glow(ctx, x, y, r * 2.4 * p, '#ffe03a', 0.4 * k);
  star(ctx, x, y, r * p, r * 0.4 * p, 8, t * 0.3); ctx.fillStyle = `rgba(255,246,190,${0.85 * k})`; ctx.fill();
}

// ---- Beacon ----------------------------------------------------------------------------------------
export function drum(ctx, x, y, r, gold = false) {
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.5, r, r * 0.38, 0, 0, Math.PI); ctx.lineTo(x - r, y - r * 0.4); ctx.ellipse(x, y - r * 0.4, r, r * 0.38, 0, Math.PI, 0, true); ctx.closePath();
  ink(ctx, '#a0482a', 1.5, x - r, x + r);
  for (let i = -2; i <= 2; i++) line(ctx, [[x + i * r * 0.4, y - r * 0.3], [x + i * r * 0.4 + r * 0.15, y + r * 0.6]], gold ? GOLD : '#f0dcb0', 0.6);
  ctx.beginPath(); ctx.ellipse(x, y - r * 0.4, r, r * 0.38, 0, 0, TAU); flat(ctx, '#f0dcb0', 1.2);
}
export function warhorn(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-6, 2); ctx.quadraticCurveTo(-2, -8, 8, -10); ctx.lineTo(9, -5); ctx.quadraticCurveTo(0, -4, -4, 3); ctx.closePath(); ink(ctx, '#e8d6b0', 1.3, -6, 9);
  ctx.beginPath(); ctx.ellipse(8.6, -7.5, 1.8, 3, 0.2, 0, TAU); flat(ctx, GOLD, 1);
  for (const u of [0.35, 0.65]) { rrect(ctx, -5 + u * 13 - 0.8, -7 + u * 2, 1.6, 5, 0.6); flat(ctx, GOLD, 0.6); }
  ctx.restore();
}
export function pennant(ctx, x, y0, y1, col, t, wave = 1) { // a banner on a pole, cloth flutters (live parts)
  line(ctx, [[x, y0], [x, y1]], '#6a4a2a', 1.1);
  const w = Math.sin(t * 5 + x) * 1.2 * wave;
  ctx.beginPath(); ctx.moveTo(x + 0.6, y1 + 1); ctx.quadraticCurveTo(x + 5, y1 + 2 + w, x + 9, y1 + 3 + w); ctx.lineTo(x + 7.5, y1 + 6 + w * 0.5); ctx.quadraticCurveTo(x + 4, y1 + 7, x + 0.6, y1 + 9); ctx.closePath();
  flat(ctx, col, 1);
}
export function coins(ctx, x, y, n) { for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.ellipse(x + ((i * 7) % 5) - 2, y - i * 1.9, 3.2, 1.3, 0, 0, TAU); flat(ctx, GOLD, 0.8); } }
export function chest(ctx, x, y, w, gold) {
  rrect(ctx, x - w / 2, y - w * 0.55, w, w * 0.55, 1.5); ink(ctx, gold ? '#c8963a' : '#8a5a32', 1.4, x - w / 2, x + w / 2);
  ctx.beginPath(); ctx.moveTo(x - w / 2 - 0.5, y - w * 0.55); ctx.quadraticCurveTo(x, y - w * 0.95, x + w / 2 + 0.5, y - w * 0.55); ctx.closePath(); ink(ctx, gold ? GOLD : '#a06a40', 1.3, x - w / 2, x + w / 2);
  rrect(ctx, x - 1.5, y - w * 0.6, 3, 3, 0.6); flat(ctx, GOLD, 0.8);
}
export function beam(ctx, x, y, ang, len, w, a) { // a sweeping lighthouse beam (live, additive)
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,190,220,${a})`;
  const c = Math.cos(ang), s = Math.sin(ang) * 0.45;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + c * len - s * w, y + s * len + c * w * 0.45); ctx.lineTo(x + c * len + s * w, y + s * len - c * w * 0.45); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ---- Rime Spire ------------------------------------------------------------------------------------
export function iceCrystal(ctx, x, y, w, h, lean = 0) { // a tall ice crystal standing on the ground
  ctx.save(); ctx.translate(x, y); ctx.rotate(lean);
  poly(ctx, [[-w / 2, 0], [-w / 2, -h * 0.75], [0, -h], [w / 2, -h * 0.75], [w / 2, 0]]);
  const g = ctx.createLinearGradient(-w / 2, -h, w / 2, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#bff3ff'); g.addColorStop(1, '#52c8e8');
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
  line(ctx, [[0, -h], [0, -h * 0.1]], 'rgba(255,255,255,0.8)', 0.6);
  ctx.restore();
}
export function iceBlade(ctx, x, y, a, s) { // an orbiting ice blade (live)
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s * 0.6);
  poly(ctx, [[7, 0], [-2, -2.6], [-4, 0], [-2, 2.6]]); flat(ctx, '#e8fbff', 1.1);
  ctx.restore();
}
export function snowCloud(ctx, x, y, w, t, flakes = 5) { // a snow cloud with snow falling from it (live)
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < flakes; i++) { const u = (t * 0.7 + i / flakes) % 1, fx = x + ((i * 0.37) % 1 - 0.5) * w * 1.4 + Math.sin(t * 2 + i) * 1.5; ctx.globalAlpha = 1 - u; ctx.fillRect(fx - 0.8, y + 3 + u * 14, 1.6, 1.6); }
  ctx.globalAlpha = 1;
  cloud(ctx, x, y, w, false, '#e2f2ff');
  ctx.beginPath(); ctx.ellipse(x, y + 2, w * 0.7, 2, 0, 0, TAU); ctx.fillStyle = 'rgba(160,200,230,0.6)'; ctx.fill();
}
export function scarf(ctx, x, y, w, col = '#3a7fd0') { // a knitted scarf round a Kindling's middle
  ctx.beginPath(); ctx.ellipse(x, y, w, 2.6, 0, 0, Math.PI); ctx.lineTo(x - w, y - 1); ctx.ellipse(x, y - 1, w, 2.2, 0, Math.PI, 0, true); ctx.closePath(); flat(ctx, col, 1.2);
  rrect(ctx, x + w * 0.4, y, 3, 8, 1); flat(ctx, col, 1);
  for (let i = 0; i < 3; i++) line(ctx, [[x + w * 0.4 + 0.5, y + 2 + i * 2], [x + w * 0.4 + 2.5, y + 2 + i * 2]], '#ffffff', 0.4);
}

// ---- Ember Censer ----------------------------------------------------------------------------------
export function fuelTank(ctx, x, y, s = 1) { // Firehose: a brass fuel tank with a gauge
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -4, -9, 8, 12, 3); ink(ctx, BRASS, 1.3, -4, 4);
  circle(ctx, 0, -4, 2.2); flat(ctx, '#fff3e0', 0.9); line(ctx, [[0, -4], [1.2, -5.4]], INK, 0.4);
  ctx.restore();
}
export function ashCollar(ctx, x, y, w) { // Choking Ash: a mane of ash clouds (static, behind the head)
  for (let i = 0; i < 6; i++) { const a = Math.PI + (i / 5) * Math.PI; circle(ctx, x + Math.cos(a) * w, y + Math.sin(a) * w * 0.6, 3.2); flat(ctx, '#4a4048', 1); }
}
