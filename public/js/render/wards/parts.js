// Props shared by BOTH skins for the Mortar Kiln, Storm Coil, Prism, Beacon and the four newer
// wards (Thornlight Snare, Moth Lantern, Wandering Light, Ember Vault); the Bolt Ward's are in
// bolt-parts.js. Each ward's paths follow the upgrade framework
// (docs/upgrade-visuals-research.md): MIGHT = one bigger thing, MANY = it multiplies,
// CRAFT = the special trick. Gear is drawn beside or behind a ward's body, never over its face.
import { DMG, INK, TAU, FACE, circle, poly, rrect, star, ink, flat, line, glow, glyph, shade, rgba, aimPlane, DETAIL, notches, pips, crown, twinkle } from './kit.js';

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

// ---- Thornlight Snare (flat on the road) -----------------------------------------------------------
// The grate: a round iron grate sunk into the road, seen from above at a slant, its hole lit from below.
export function grate(ctx, x, y, rx, ry, rim = IRON, bars = 4) {
  ctx.beginPath(); ctx.ellipse(x, y + 1, rx + 3, ry + 2, 0, 0, TAU); ctx.fillStyle = 'rgba(70,45,30,0.35)'; ctx.fill();   // churned road
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ink(ctx, rim, 2, x - rx, x + rx);
  ctx.beginPath(); ctx.ellipse(x, y + 0.5, rx - 3, ry - 1.8, 0, 0, TAU); ctx.fillStyle = '#1a1830'; ctx.fill();
  glow(ctx, x, y, rx * 1.1, '#ffffff', 0.35);
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y + 0.5, rx - 3, ry - 1.8, 0, 0, TAU); ctx.clip();
  ctx.strokeStyle = shade(rim, 0.25); ctx.lineWidth = 1.6;
  for (let i = 1; i < bars + 1; i++) { const bx = x - rx + (i * rx * 2) / (bars + 1); ctx.beginPath(); ctx.moveTo(bx, y - ry); ctx.lineTo(bx, y + ry); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x - rx, y + 0.5); ctx.lineTo(x + rx, y + 0.5); ctx.stroke();
  ctx.restore();
}
// A ring of thorns round the rim; `snap` (0-1) jabs them up when it bites.
export function thorns(ctx, x, y, rx, ry, n, size, col = '#5a7a3a', snap = 0, tip = '#e9eef6') {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + 0.2, cx = x + Math.cos(a) * rx, cy = y + Math.sin(a) * ry;
    const h = size * (1 + snap * 0.8), lean = Math.cos(a) * size * 0.5;
    poly(ctx, [[cx - size * 0.45, cy], [cx + lean, cy - h], [cx + size * 0.45, cy]]); flat(ctx, col, 0.9);
    circle(ctx, cx + lean, cy - h, 0.7); ctx.fillStyle = tip; ctx.fill();
  }
}
// An iron caltrop (Iron Thorns) and a tall iron briar spike (Iron Briar).
export function caltrop(ctx, x, y, s, gold = false) {
  const c = gold ? GOLD : '#b8c2d2';
  for (const [dx, dy] of [[-1, 0.4], [1, 0.4], [0, -1.2], [0, 0.8]]) { line(ctx, [[x, y], [x + dx * 3.2 * s, y + dy * 3 * s]], c, 1.2 * s); }
}
export function briar(ctx, x, y, h, lean, gold = false) {
  ctx.beginPath(); ctx.moveTo(x - 2.4, y); ctx.quadraticCurveTo(x + lean * 0.3, y - h * 0.6, x + lean, y - h); ctx.quadraticCurveTo(x + lean * 0.2 + 1, y - h * 0.5, x + 2.4, y); ctx.closePath();
  ink(ctx, '#6a7488', 1.3, x - 2.4, x + 2.4);
  for (const k of [0.35, 0.65]) { const sx = x + lean * k, sy = y - h * k; poly(ctx, [[sx, sy], [sx + (lean >= 0 ? -3.5 : 3.5), sy - 1.5], [sx, sy + 1.5]]); flat(ctx, '#8a96aa', 0.8); }
  if (gold) { circle(ctx, x + lean, y - h, 1.2); ctx.fillStyle = GOLD; ctx.fill(); }
}
// A Flashmine lamp-seed: a tiny lamp with a white core (glows live).
export function lampSeed(ctx, x, y, s = 1, lit = 1) {
  if (lit > 0) glow(ctx, x, y - 1.5 * s, 6 * s, '#ffffff', 0.45 * lit);
  ctx.beginPath(); ctx.ellipse(x, y, 3 * s, 1.4 * s, 0, 0, TAU); flat(ctx, '#3a4160', 1);
  circle(ctx, x, y - 2 * s, 2.2 * s); flat(ctx, '#e9eef6', 1);
  circle(ctx, x - 0.6 * s, y - 2.6 * s, 0.8 * s); ctx.fillStyle = '#ffffff'; ctx.fill();
}
// Chains of light round the rim (Binding Light), and the runic binding circle on the road.
export function chainRing(ctx, x, y, rx, ry, n, col = '#fff6d0', t = 0) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + t * 0.4, cx = x + Math.cos(a) * rx, cy = y + Math.sin(a) * ry;
    ctx.beginPath(); ctx.ellipse(cx, cy, 2.4, 1.4, a + Math.PI / 2, 0, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.stroke();
  }
}
export function runeCircle(ctx, x, y, rx, ry, t, col = '#fff6d0', k = 1) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(col, 0.55 * k); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y, rx - 3, ry - 1.2, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = rgba(col, 0.85 * k);
  for (let i = 0; i < 8; i++) { const a = t * 0.6 + (i / 8) * TAU; ctx.fillRect(x + Math.cos(a) * (rx - 1.5) - 1, y + Math.sin(a) * (ry - 0.6) - 1, 2, 2); }
  ctx.restore();
}
// A short post of light (Lightbound) with its top.
export function lightPost(ctx, x, y, h, col = '#fff6d0') {
  rrect(ctx, x - 1.6, y - h, 3.2, h, 1); ink(ctx, '#6a6a7a', 1.1, x - 1.6, x + 1.6);
  circle(ctx, x, y - h, 2.2); flat(ctx, col, 1);
}

// ---- Moth Lantern ----------------------------------------------------------------------------------
// The shepherd's crook: a pole from yFoot up to yTop, curling over to the hook. Returns the hook tip.
export function crook(ctx, x, yFoot, yTop, curl, col = '#7a5236', w = 2.4) {
  ctx.beginPath(); ctx.moveTo(x, yFoot); ctx.lineTo(x, yTop + curl * 0.6);
  ctx.bezierCurveTo(x, yTop - curl * 0.7, x + curl * 1.6, yTop - curl * 0.7, x + curl * 1.6, yTop + curl * 0.5);
  ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = w + 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); ctx.lineCap = 'butt';
  return [x + curl * 1.6, yTop + curl * 0.5];
}
// The light it hangs: a paper lantern, a round moon lantern (Moonlure) or an iron cage (Moth-trap).
export function paperLantern(ctx, x, y, s, kind = 'paper', k = 1) {
  const D = DMG.radiant;
  glow(ctx, x, y, 12 * s * (0.8 + k * 0.4), D.core, 0.35 + 0.35 * k);
  line(ctx, [[x, y - 6 * s], [x, y - 9 * s]], '#3a3040', 0.8);
  if (kind === 'moon') {
    circle(ctx, x, y, 6.5 * s); flat(ctx, '#fff3b0', 1.4);
    ctx.beginPath(); ctx.arc(x + 1.6 * s, y - 1 * s, 5 * s, -1.1, 1.9); ctx.strokeStyle = 'rgba(176,138,0,0.45)'; ctx.lineWidth = 1.4 * s; ctx.stroke();
    circle(ctx, x - 2 * s, y - 2 * s, 1.6 * s); ctx.fillStyle = '#ffffff'; ctx.fill();
    return;
  }
  if (kind === 'cage') {
    rrect(ctx, x - 5 * s, y - 6.5 * s, 10 * s, 13 * s, 3 * s); ctx.fillStyle = rgba(D.core, 0.9); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
    for (const dx of [-2.5, 0, 2.5]) line(ctx, [[x + dx * s, y - 6.5 * s], [x + dx * s, y + 6.5 * s]], '#3a3040', 0.7);
    rrect(ctx, x - 6 * s, y - 7.5 * s, 12 * s, 2.2 * s, 1); flat(ctx, '#4a4058', 1);
    rrect(ctx, x - 6 * s, y + 5.5 * s, 12 * s, 2.2 * s, 1); flat(ctx, '#4a4058', 1);
    circle(ctx, x, y, 2.2 * s); ctx.fillStyle = '#ffffff'; ctx.fill();
    return;
  }
  ctx.beginPath(); ctx.ellipse(x, y, 5 * s, 6.5 * s, 0, 0, TAU); flat(ctx, '#ffe9a0', 1.4);
  for (const dy of [-3, 0, 3]) { ctx.beginPath(); ctx.ellipse(x, y + dy * s, 4.8 * s * Math.cos(dy / 8), 0.9 * s, 0, 0, TAU); ctx.strokeStyle = 'rgba(176,120,0,0.5)'; ctx.lineWidth = 0.8; ctx.stroke(); }
  rrect(ctx, x - 3 * s, y - 7.5 * s, 6 * s, 2 * s, 0.8); flat(ctx, '#a0302a', 0.9);
  rrect(ctx, x - 3 * s, y + 5.6 * s, 6 * s, 2 * s, 0.8); flat(ctx, '#a0302a', 0.9);
  ctx.beginPath(); ctx.ellipse(x - 1.4 * s, y - 1.5 * s, 1.6 * s, 2.6 * s, 0, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
}
// Moths circling a light (live). `fire`: Moth-trap moths glow as they sting.
export function moths(ctx, x, y, R, n, t, fire = false, half = 0) {
  for (let i = 0; i < n; i++) {
    const a = t * (1.8 + (i % 3) * 0.3) + (i / n) * TAU, sn = Math.sin(a);
    if (half && (sn < 0) !== (half < 0)) continue;   // back half (-1) or front half (+1) only
    const mx = x + Math.cos(a) * R * (1 + (i % 2) * 0.25), my = y + sn * R * 0.45 + Math.sin(t * 7 + i) * 1.2;
    const flap = Math.abs(Math.sin(t * 22 + i * 1.7));
    if (fire) glow(ctx, mx, my, 4, DMG.radiant.core, 0.5);
    ctx.fillStyle = fire ? '#ffe9a0' : '#e8e0f0';
    ctx.beginPath(); ctx.ellipse(mx - 1.3, my, 1.6, 1.1 + flap * 0.9, 0.5, 0, TAU); ctx.ellipse(mx + 1.3, my, 1.6, 1.1 + flap * 0.9, -0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.fillRect(mx - 0.4, my - 0.8, 0.8, 1.8);
  }
}
// Flypaper: sticky strips hanging from a bar (live sway), and a sticky net between two points.
export function flyStrips(ctx, x, y, n, len, t) {
  for (let i = 0; i < n; i++) {
    const sx = x + (i - (n - 1) / 2) * 3.2, sw = Math.sin(t * 2 + i) * 1.2;
    poly(ctx, [[sx - 1, y], [sx + 1, y], [sx + 1 + sw, y + len], [sx - 1 + sw, y + len]]); flat(ctx, '#e8c84a', 0.8);
    circle(ctx, sx + sw * 0.6, y + len * 0.55, 0.7); ctx.fillStyle = INK; ctx.fill();
  }
}
export function stickyNet(ctx, x0, y0, x1, y1, h, gold = false) {
  const c = gold ? 'rgba(255,207,74,0.85)' : 'rgba(240,230,200,0.75)';
  ctx.strokeStyle = c; ctx.lineWidth = 0.8;
  for (let i = 0; i <= 4; i++) { const u = i / 4; ctx.beginPath(); ctx.moveTo(x0, y0 + h * u); ctx.quadraticCurveTo((x0 + x1) / 2, y0 + h * u + 2.5, x1, y1 + h * u); ctx.stroke(); }
  for (let i = 0; i <= 4; i++) { const u = i / 4, x = x0 + (x1 - x0) * u, yy = y0 + (y1 - y0) * u; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy + h + 1.5); ctx.stroke(); }
  if (gold) for (let i = 0; i < 3; i++) { const x = x0 + (x1 - x0) * (0.25 + i * 0.25); ctx.beginPath(); ctx.ellipse(x, y0 + h + 3, 0.9, 1.5, 0, 0, TAU); ctx.fillStyle = GOLD; ctx.fill(); }
}

// ---- Wandering Light ---------------------------------------------------------------------------------
// The wand in the aim plane from the hand at (x, y): a star-tipped wand, a crystal staff (Star Staff)
// or a comet staff (Comet). Returns its length (the star tip's distance along the aim).
export function wandLen(kind) { return kind === 'comet' ? 15 : kind === 'staff' ? 13.5 : kind === 'long' ? 11 : 9; }
export function wand(ctx, x, y, ang, kind, t, recoil = 0) {
  const L = wandLen(kind), D = DMG.arcane;
  ctx.save(); ctx.translate(x, y); aimPlane(ctx, ang);
  const b = recoil * 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-2 - b, 0); ctx.lineTo(L - 2 - b, 0);
  ctx.strokeStyle = INK; ctx.lineWidth = kind === 'staff' || kind === 'comet' ? 3.6 : 2.8; ctx.stroke();
  ctx.strokeStyle = kind === 'staff' || kind === 'comet' ? '#c8b0e8' : '#7a5236'; ctx.lineWidth = kind === 'staff' || kind === 'comet' ? 2 : 1.4; ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.restore();
  // the tip, upright (a star faces the viewer whichever way the wand points)
  const c = Math.cos(ang), s = Math.sin(ang) * 0.72, tx = x + c * (L - b), ty = y + s * (L - b);
  const r = kind === 'comet' ? 4.6 : kind === 'staff' ? 4 : kind === 'long' ? 3.4 : 2.8, pulse = 1 + recoil * 0.5;
  glow(ctx, tx, ty, r * 3.2 * pulse, D.core, 0.55);
  if (kind === 'staff' || kind === 'comet') { poly(ctx, [[tx, ty - r * 1.3], [tx + r * 0.8, ty], [tx, ty + r * 1.1], [tx - r * 0.8, ty]]); flat(ctx, '#e8d4ff', 1.1); }
  else { star(ctx, tx, ty, r, r * 0.45, 5, -Math.PI / 2 + t * 0.8); flat(ctx, '#f4e8ff', 1); }
  if (kind === 'comet') { const a = t * 3; circle(ctx, tx + Math.cos(a) * 6, ty + Math.sin(a) * 3, 1.6); flat(ctx, '#ffffff', 0.8); glow(ctx, tx + Math.cos(a) * 6, ty + Math.sin(a) * 3, 5, D.core, 0.6); }
}
export function wandTip(x, y, ang, kind, out) { const L = wandLen(kind); out[0] = x + Math.cos(ang) * L; out[1] = y + Math.sin(ang) * 0.72 * L; return out; }
// The Torchbearer's rose torch (the flame is live).
export function torchPole(ctx, x, y0, y1, gold = false) {
  line(ctx, [[x, y0], [x, y1]], gold ? '#c8963a' : '#7a5236', 1.8);
  poly(ctx, [[x - 3, y1], [x + 3, y1], [x + 2, y1 + 3], [x - 2, y1 + 3]]); flat(ctx, gold ? GOLD : '#8a8f9c', 1);
}
export function torchFlame(ctx, x, y, s, t) {
  const D = DMG.hearth, f = 1 + Math.sin(t * 11) * 0.1;
  glow(ctx, x, y - 3 * s, 9 * s, D.core, 0.55);
  ctx.beginPath(); ctx.moveTo(x - 3 * s, y); ctx.quadraticCurveTo(x - 3.4 * s, y - 5 * s * f, x + Math.sin(t * 6) * s, y - 8 * s * f); ctx.quadraticCurveTo(x + 3.4 * s, y - 4 * s, x + 3 * s, y); ctx.closePath();
  flat(ctx, D.core, 1.2);
  ctx.beginPath(); ctx.ellipse(x, y - 2 * s, 1.3 * s, 2.4 * s, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
}
// Sparks orbiting a light (Swarm).
export function orbitSparks(ctx, x, y, R, n, t, half = 0) {
  for (let i = 0; i < n; i++) {
    const a = t * 2.2 + (i / n) * TAU, sn = Math.sin(a);
    if (half && (sn < 0) !== (half < 0)) continue;
    const sx = x + Math.cos(a) * R, sy = y + sn * R * 0.4;
    glow(ctx, sx, sy, 5, DMG.arcane.core, 0.6);
    star(ctx, sx, sy, 2.2, 1, 4, t * 3 + i); flat(ctx, '#f4e8ff', 0.7);
  }
}

// ---- Ember Vault -------------------------------------------------------------------------------------
// The brazier's bowl (w wide, rim at y), and its fill: a heap of embers and a rose flame that grow
// as it fills (live). `heap` 0-1.
export function bowl(ctx, x, y, w, rim = '#5a4048', gold = false) {
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w * 0.45, y + w * 0.42, x, y + w * 0.42); ctx.quadraticCurveTo(x + w * 0.45, y + w * 0.42, x + w / 2, y); ctx.closePath();
  ink(ctx, rim, 1.8, x - w / 2, x + w / 2);
  ctx.beginPath(); ctx.ellipse(x, y, w / 2, w * 0.14, 0, 0, TAU); flat(ctx, gold ? GOLD : shade(rim, 0.25), 1.4);
  ctx.beginPath(); ctx.ellipse(x, y, w / 2 - 1.6, w * 0.14 - 0.9, 0, 0, TAU); ctx.fillStyle = '#2a1418'; ctx.fill();
}
export function emberHeap(ctx, x, y, w, heap, t, coins = false) {
  const D = DMG.hearth, h = heap;
  if (h > 0.02) {
    const hw = (w / 2 - 1.5) * (0.55 + h * 0.45), hh = 1 + h * w * 0.28;
    ctx.beginPath(); ctx.moveTo(x - hw, y + 0.5); ctx.quadraticCurveTo(x, y - hh * 2, x + hw, y + 0.5); ctx.closePath(); flat(ctx, '#7a2a3a', 1.1);
    const n = 3 + Math.round(h * 5);
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, ex = x - hw * 0.8 + hw * 1.6 * u, ey = y - Math.sin(u * Math.PI) * hh * 0.9; circle(ctx, ex, ey, 1.1 + (i % 2) * 0.4); ctx.fillStyle = i % 3 ? '#ff9ac4' : '#ffd0e6'; ctx.fill(); }
    if (coins && h > 0.3) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x - 3 + i * 3, y - hh * 0.8 - (i % 2), 2, 0.9, 0, 0, TAU); flat(ctx, GOLD, 0.6); }
  }
  // the flame, which grows with the heap
  const fs = 0.45 + h * 1.1, f = 1 + Math.sin(t * 9) * 0.08 + Math.sin(t * 21) * 0.05, top = y - 1.5 - (h * w * 0.28);
  glow(ctx, x, top - 4 * fs, 10 * fs + 4, D.core, 0.35 + h * 0.35);
  const fh = 9 * fs * f, fw = 3.6 * fs;
  ctx.beginPath(); ctx.moveTo(x - fw, top); ctx.quadraticCurveTo(x - fw * 1.1, top - fh * 0.6, x + Math.sin(t * 5) * fs, top - fh); ctx.quadraticCurveTo(x + fw * 1.1, top - fh * 0.5, x + fw, top); ctx.closePath();
  flat(ctx, D.core, 1.2);
  ctx.beginPath(); ctx.ellipse(x, top - fh * 0.3, fw * 0.4, fh * 0.3, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.globalAlpha *= 0.8; ctx.fill(); ctx.globalAlpha /= 0.8;
}
export function emberTop(y, w, heap) { return y - 1.5 - heap * w * 0.28 - 4; }
// An ember-wisp (Gleaners): a little rose spark with a tail (live).
export function emberWisp(ctx, x, y, t, s = 1) {
  glow(ctx, x, y, 6 * s, DMG.hearth.core, 0.6);
  circle(ctx, x, y, 1.8 * s); flat(ctx, '#ffd0e6', 0.8);
  circle(ctx, x - Math.cos(t * 3) * 2.5 * s, y + 1.5 * s, 0.9 * s); ctx.fillStyle = 'rgba(255,126,182,0.7)'; ctx.fill();
}
// A crescent moon (Harvest Moon).
export function crescent(ctx, x, y, r) {
  glow(ctx, x, y, r * 2.4, '#fff3b0', 0.45);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.arc(x + r * 0.45, y - r * 0.2, r * 0.82, 0, TAU, true); flat(ctx, '#fff3b0', 1.2);
}
// A heart-shaped grill on the brazier (Hearthwarm).
export function heartGrill(ctx, x, y, s, lit = 0) {
  if (lit) glow(ctx, x, y, 8 * s, DMG.hearth.core, 0.5 * lit);
  glyph(ctx, 'heart', x, y, 5 * s, INK);
  glyph(ctx, 'heart', x, y, 3.8 * s, lit ? '#ffd0e6' : '#b0306e');
}

// ---- Thornlight Snare, both skins -----------------------------------------------------------------
// The Snare lies flat on the road: a round grate ringed with thorns, white light shining up through
// it. Each skin supplies what looks up out of the grate (`face`: a Kindling spirit, or a floor-lantern
// lens). Caltrops: bigger thorns, a double ring, iron caltrops, then a crown of iron briars.
// Flashmines: lamp-seeds on the rim, then a flower of lamps, then a field of them. Binding Light: a
// chain, a ring of chains, a glowing binding circle, then four posts of light holding chains.
export function snareArt({ rim, thorn, face, d = 'kinetic' }) {
  const RX = (P) => 15 + (P.might ? P.mt * 0.7 : 0) + (P.many && P.mt >= 3 ? 1.5 : 0);
  const CY = 11;
  const posts = (rx, ry) => [[-rx - 5, CY - ry + 1], [rx + 5, CY - ry + 1], [-rx - 3, CY + ry + 1], [rx + 3, CY + ry + 1]];
  return {
    flat: true,
    self: () => [-6, 1, 6, 11],
    body(ctx, P, dd) {
      const { might, many, craft, mt } = P, rx = RX(P), ry = rx * 0.42;
      if (craft && mt >= 3) { ctx.beginPath(); ctx.ellipse(0, CY, rx + 10, ry + 4.5, 0, 0, TAU); ctx.fillStyle = 'rgba(255,246,208,0.14)'; ctx.fill(); }
      if (might && mt >= 4) for (const [a, h] of [[-2.5, 13], [-2.0, 11], [-1.1, 11], [-0.6, 13], [0.5, 8], [2.6, 8]]) briar(ctx, Math.cos(a) * (rx + 2), CY + Math.sin(a) * (ry + 1), h, Math.cos(a) * 4, true);
      grate(ctx, 0, CY, rx, ry, might && mt >= 3 ? '#5a5f70' : rim);
      thorns(ctx, 0, CY, rx + 0.5, ry + 0.3, might ? 9 + mt * 2 : 9, might ? 2.4 + mt * 0.5 : 2.2, thorn);
      if (might && mt >= 2) thorns(ctx, 0, CY + 0.5, rx + 3.5, ry + 1.6, 12, 2.2, shade(thorn, -0.2));
      if (might && mt >= 3) for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.5; caltrop(ctx, Math.cos(a) * (rx + 6), CY + Math.sin(a) * (ry + 3), 1, mt >= 4); }
      if (many) {
        const n = [0, 2, 4, 6, 8][mt], R = mt >= 3 ? rx + 5 : rx + 2;
        if (mt >= 3) for (let i = 0; i < n; i++) { const a = (i / n) * TAU; ctx.beginPath(); ctx.ellipse(Math.cos(a) * (R - 1), CY + Math.sin(a) * (ry + 2), 4, 2.2, a, 0, TAU); flat(ctx, '#8a96aa', 1); }
        for (let i = 0; i < n; i++) { const a = (i / n) * TAU + (mt < 3 ? 0 : 0.0); lampSeed(ctx, Math.cos(a) * R, CY + Math.sin(a) * (ry + (mt >= 3 ? 2 : 1)) + 1, mt >= 4 ? 1.1 : 1, 0.8); }
      }
      if (craft && mt === 1) for (let i = 0; i < 3; i++) chainRing(ctx, -rx + 2 + i * 3, CY + ry - 1 - i * 0.4, 0.1, 0.1, 1);
      if (craft && mt >= 2) chainRing(ctx, 0, CY, rx + 1.5, ry + 1, 14);
      if (craft && mt >= 4) for (const [x, y] of posts(rx, ry)) lightPost(ctx, x, y, y < CY ? 12 : 9);
      notches(ctx, P.mt, 0, CY + ry + 3.2, 22, DMG[dd].core, 2.4);
      pips(ctx, P.tiers, P.main, rx - 3, CY - ry - 2);
      return CY - ry - (might && mt >= 4 ? 14 : craft && mt >= 4 ? 14 : 6);
    },
    back(ctx, P, st, dd) {
      const { might, many, craft, mt } = P, rx = RX(P), ry = rx * 0.42, t = st.time;
      if (mt >= 4) groundAuraFlat(ctx, dd, t, rx + 8, CY);
      if (craft && mt >= 3) runeCircle(ctx, 0, CY, rx + 9, ry + 4, t, '#fff6d0', st.bloom ? 1 : 0.8);
    },
    front(ctx, P, st, dd) {
      const { might, many, craft, mt } = P, rx = RX(P), ry = rx * 0.42, t = st.time, snap = st.recoil || 0, fill = st.fill === undefined ? 1 : st.fill;
      // the light from below: brighter the more charges it holds (and blazing during a Briar Bloom)
      glow(ctx, 0, CY - 1, rx * (0.8 + fill * 0.5), st.bloom ? '#e8ffd0' : '#ffffff', 0.18 + fill * 0.32 + (st.bloom ? 0.25 : 0));
      if (craft && mt >= 4) { // chains of light between the four posts
        const ps = posts(rx, ry);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,246,208,0.7)'; ctx.lineWidth = 1.3; ctx.setLineDash([2.5, 2]); ctx.lineDashOffset = -t * 8;
        ctx.beginPath(); for (const [i, j] of [[0, 1], [1, 3], [3, 2], [2, 0]]) { const a = ps[i], b = ps[j], ha = a[1] < CY ? 12 : 9, hb = b[1] < CY ? 12 : 9; ctx.moveTo(a[0], a[1] - ha); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] - ha + b[1] - hb) / 2 + 4, b[0], b[1] - hb); }
        ctx.stroke(); ctx.restore();
        for (const [x, y] of ps) glow(ctx, x, y - (y < CY ? 12 : 9), 6, '#fff6d0', 0.6);
      }
      if (many && mt >= 4 && DETAIL.q >= 2) for (let i = 0; i < 3; i++) { const a = t * 0.7 + i * 2.1; twinkle(ctx, Math.cos(a) * (rx + 5), CY + Math.sin(a) * (ry + 2) - 4, 2.6, Math.sin(t * 3 + i * 2)); }
      if (snap > 0.1) { // a bite: thorns jab up out of the grate and the light flashes
        glow(ctx, 0, CY - 2, rx * 1.4, '#ffffff', snap * 0.6);
        thorns(ctx, 0, CY, rx - 4, ry - 1.5, 6, 3 + snap * 4, thorn, 1, '#ffffff');
      }
      face(ctx, P, st, dd, snap);
      if (mt >= 4 && !FACE.skip) crown(ctx, 0, -2 - snap * 2, dd, 0.8);
    },
    muzzle(P, ang, out) { out[0] = 0; out[1] = 4; return out; },
  };
}
// A flat version of the T4 ground ring for the Snare (it already lies on the ground).
function groundAuraFlat(ctx, d, time, R, y) {
  const col = DMG[d].glow ? DMG[d].core : '#ffffff';
  ctx.save(); ctx.translate(0, y); ctx.scale(1, 0.42);
  ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(col, 0.5); ctx.lineWidth = 2.2;
  ctx.setLineDash([6, 5]); ctx.lineDashOffset = -time * 14;
  circle(ctx, 0, 0, R); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}
