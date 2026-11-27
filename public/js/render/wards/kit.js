// Shared pieces of the ward design system, used by every skin (see docs/visual-design-system.md).
//
// Wards are drawn upright, in a three-quarter view, in "ward units": the plinth's centre is at
// (0, 11) and the ground line at y = 14; up is -y. wardArt.js maps ward units onto the map (the
// plinth centre lands on the ward's position) and scales them so wards grow with tier: a base
// ward stands ~35-45 px tall and a tier 4 up to ~68 px (wardScale; tools/wards.mjs checks it).
//
// One channel per fact:
//   role          -> silhouette (each skin draws its own body per role family)
//   damage type   -> the signature colour + glyph below (also projectiles, effects, numbers)
//   tier          -> notches in the damage colour on the plinth (main path), white pips (second path)
//   path          -> shape: MIGHT = one bigger thing, MANY = more of it, CRAFT = a special trick
// Path colours never appear on the battlefield; they live in the upgrade panel only.
export const TAU = Math.PI * 2;
export const INK = '#1a1428';

// The colour-blind-checked damage palette. glow:false = unlit (Kinetic: "if it glows, it's elemental").
export const DMG = {
  kinetic: { core: '#e9eef6', deep: '#7d8aa3', glow: false, glyph: 'arrow' },
  blast: { core: '#ff9a1f', deep: '#b35a00', glow: true, glyph: 'burst' },
  fire: { core: '#ff4433', deep: '#a3140c', glow: true, glyph: 'flame' },
  radiant: { core: '#ffe03a', deep: '#b08a00', glow: true, glyph: 'sun' },
  frost: { core: '#52e6ff', deep: '#0a7fa8', glow: true, glyph: 'flake' },
  arcane: { core: '#b06bff', deep: '#5a1fb0', glow: true, glyph: 'zig' },
  blight: { core: '#5fd35a', deep: '#1f6a1a', glow: true, glyph: 'drip' },
  hearth: { core: '#ff7eb6', deep: '#b0306e', glow: true, glyph: 'heart' },
};
// Each ward's damage type for its art (Beacon is support: Hearth).
export const WARD_DMG = { bolt: 'kinetic', mortar: 'blast', rime: 'frost', coil: 'arcane', longeye: 'kinetic', censer: 'fire', prism: 'radiant', beacon: 'hearth', snare: 'kinetic', moth: 'radiant', wander: 'arcane', vault: 'hearth',
  avatar: 'radiant', choir: 'arcane', ferry: 'kinetic', undertow: 'frost', lamp: 'fire', ferry_lava: 'kinetic', undertow_lava: 'frost' };

export function mainPath(tiers) {
  let main = -1, mt = 0;
  for (let i = 0; i < 3; i++) if (tiers[i] > mt) { mt = tiers[i]; main = i; }
  return { main, mt, lvl: tiers[0] + tiers[1] + tiers[2], might: main === 0, many: main === 1, craft: main === 2 };
}

// ---- primitives ------------------------------------------------------------------------------
// (a browser throws on a negative radius, which would end the frame: never pass one on)
export function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r > 0 ? r : 0, 0, TAU); }
export function poly(ctx, pts) { ctx.beginPath(); for (let i = 0; i < pts.length; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, pts[i][0], pts[i][1]); ctx.closePath(); }
export function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export function star(ctx, x, y, ro, ri, n, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU, r = i % 2 ? ri : ro; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath();
}
export function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function rgba(h, a) { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }
export function shade(h, k) {
  const [r, g, b] = hex2rgb(h);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

// Fill the current path lit from the top-left, then ink it. Only for cached bodies (gradients).
export function ink(ctx, fill, w = 2, x0 = -20, x1 = 20) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, shade(fill, 0.22)); g.addColorStop(0.45, fill); g.addColorStop(1, shade(fill, -0.35));
  ctx.fillStyle = g; ctx.fill();
  ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.stroke();
}
export function flat(ctx, fill, w = 2) {
  ctx.fillStyle = fill; ctx.fill();
  if (w) { ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.stroke(); }
}
export function line(ctx, pts, col, w) {
  ctx.beginPath(); for (let i = 0; i < pts.length; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, pts[i][0], pts[i][1]);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = w + 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  ctx.lineCap = 'butt';
}

// Soft additive glow from a cached sprite (cheap enough to use every frame).
const glowCache = new Map();
let makeCanvas = null;
export function setCanvasFactory(f) { makeCanvas = f; glowCache.clear(); }
export function newCanvas() { return makeCanvas ? makeCanvas() : null; }
function glowSprite(color) {
  let c = glowCache.get(color);
  if (c) return c;
  c = makeCanvas();
  c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  const [r, gg, b] = hex2rgb(color);
  gr.addColorStop(0, `rgba(${r},${gg},${b},1)`); gr.addColorStop(0.35, `rgba(${r},${gg},${b},0.45)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  glowCache.set(color, c);
  return c;
}
export function glow(ctx, x, y, r, color, a = 0.6) {
  if (!makeCanvas || r <= 0) return;
  const op = ctx.globalCompositeOperation, ga = ctx.globalAlpha;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = ga * a;
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = op; ctx.globalAlpha = ga;
}

export function shadow(ctx, w, y = 14) {
  ctx.fillStyle = 'rgba(8,40,34,0.45)';
  ctx.beginPath(); ctx.ellipse(2, y, w, w * 0.3, 0, 0, TAU); ctx.fill();
}

// Damage glyph in ink on a bright core.
export function glyph(ctx, kind, x, y, r, color = INK) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(1, r * 0.28); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const k = r * 0.62;
  switch (kind) {
    case 'arrow': poly(ctx, [[0, -k], [k * 0.8, k * 0.55], [0, k * 0.15], [-k * 0.8, k * 0.55]]); ctx.fill(); break;
    case 'burst': star(ctx, 0, 0, k, k * 0.42, 6); ctx.fill(); break;
    case 'flame': ctx.beginPath(); ctx.moveTo(0, -k); ctx.quadraticCurveTo(k * 0.9, k * 0.1, 0, k); ctx.quadraticCurveTo(-k * 0.9, k * 0.1, 0, -k); ctx.fill(); break;
    case 'sun': circle(ctx, 0, 0, k * 0.42); ctx.fill(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * k * 0.62, Math.sin(a) * k * 0.62); ctx.lineTo(Math.cos(a) * k, Math.sin(a) * k); ctx.stroke(); } break;
    case 'flake': for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI + Math.PI / 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * k, Math.sin(a) * k); ctx.lineTo(-Math.cos(a) * k, -Math.sin(a) * k); ctx.stroke(); } break;
    case 'zig': ctx.beginPath(); ctx.moveTo(-k * 0.3, -k); ctx.lineTo(k * 0.35, -k * 0.15); ctx.lineTo(-k * 0.35, k * 0.15); ctx.lineTo(k * 0.3, k); ctx.stroke(); break;
    case 'drip': ctx.beginPath(); ctx.arc(0, k * 0.25, k * 0.55, 0, Math.PI); ctx.lineTo(0, -k); ctx.closePath(); ctx.fill(); break;
    case 'heart': ctx.beginPath(); ctx.moveTo(0, k); ctx.bezierCurveTo(-k * 1.3, -k * 0.1, -k * 0.5, -k * 1.1, 0, -k * 0.35); ctx.bezierCurveTo(k * 0.5, -k * 1.1, k * 1.3, -k * 0.1, 0, k); ctx.fill(); break;
  }
  ctx.restore();
}

// Tier ladder: n notches in the damage colour across a band (the main path's tier).
export function notches(ctx, n, x, y, w, color, h = 3) {
  if (!n) return;
  const step = w / 4;
  for (let i = 0; i < n; i++) {
    const cx = x + (i - (n - 1) / 2) * step;
    rrect(ctx, cx - step * 0.32, y - h / 2, step * 0.64, h, 1.2);
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
  }
}
// Second-path pips: small white dots, one per tier bought on the other path(s).
export function pips(ctx, tiers, main, x, y) {
  let n = 0;
  for (let i = 0; i < 3; i++) if (i !== main) n += tiers[i];
  for (let i = 0; i < n; i++) { circle(ctx, x + i * 3.6, y, 1.5); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.stroke(); }
}

// Aimed parts (crossbows, barrels, spouts) turn in the ground plane, seen at this squash.
export const FORE = 0.72;
export function aimPlane(ctx, ang) { ctx.scale(1, FORE); ctx.rotate(ang); }

// Body-and-face rule: a ward's own body and face are never covered by its gear. Big aimed gear sits
// beside the body and swings behind it whenever it points across it (drawn in `back` when this is
// false, in `front` when true). The face is always drawn last. FACE.skip makes every face part (eyes,
// head flames, Lantern windows drawn live) skip itself: tools/wards.mjs uses it to measure how much
// of each ward's body box (art.self) its gear covers.
export const FACE = { skip: false };
// Detail level, set by the renderer from the crowd size (2 full, 1 crowd, 0 huge crowd): in big
// crowds the purely decorative idle details (twinkles, rising motes, the dashed T4 ground ring)
// are dropped. Weapons, faces, glows and tier markers always draw.
export function gearInFront(ang, side = 1) { const c = Math.cos(ang) * side, s = Math.sin(ang); return c > 0.15 || s > 0.6; }

// Aim direction squashed for the three-quarter view (for eyes and other non-rotating cues).
export function aim(ang) { const x = Math.cos(ang), y = Math.sin(ang) * 0.6; return { x, y, a: Math.atan2(y, x) }; }

// The T4 crown, in the damage colour, drawn over the ward's top.
export function crown(ctx, x, y, d, s = 1) {
  const D = DMG[d];
  poly(ctx, [[x - 6 * s, y], [x - 6.5 * s, y - 5 * s], [x - 3 * s, y - 2.5 * s], [x, y - 7.5 * s], [x + 3 * s, y - 2.5 * s], [x + 6.5 * s, y - 5 * s], [x + 6 * s, y]]);
  flat(ctx, '#ffd34d', 1.5);
  circle(ctx, x, y - 2.2 * s, 1.5 * s); ctx.fillStyle = D.core; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.stroke();
}

// Ground aura under a T4 ward: a slowly turning ring of light in the damage colour. Flat on the
// ground, so it adds drama without hiding the enemies behind the ward.
export function groundAura(ctx, d, time, R = 22) {
  const D = DMG[d], col = D.glow ? D.core : '#ffffff';
  glow(ctx, 0, 11, R * 1.5, col, 0.35 + Math.sin(time * 3) * 0.08);
  if (DETAIL.q < 1) return;
  ctx.save();
  ctx.translate(0, 11); ctx.scale(1, 0.38);
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(col, 0.55); ctx.lineWidth = 2.2;
  ctx.setLineDash([6, 5]); ctx.lineDashOffset = -time * 14;
  circle(ctx, 0, 0, R); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = rgba(col, 0.9);
  for (let i = 0; i < 6; i++) { const a = time * 0.8 + (i / 6) * TAU; circle(ctx, Math.cos(a) * R, Math.sin(a) * R, 2.4); ctx.fill(); }
  ctx.restore();
}

// ---- small live details (cheap enough to draw every frame) -----------------------------------
// A four-point twinkle.
export const DETAIL = { q: 2 };
export function twinkle(ctx, x, y, r, a, color = '#ffffff') {
  if (a <= 0.02 || DETAIL.q < 2) return;
  const ga = ctx.globalAlpha;
  ctx.globalAlpha = ga * Math.min(1, a);
  star(ctx, x, y, r, r * 0.28, 4, 0); ctx.fillStyle = color; ctx.fill();
  ctx.globalAlpha = ga;
}
// n motes rising from a strip (x0..x1 at y) and fading, looping every `period` seconds.
export function risingMotes(ctx, t, n, x0, x1, y, h, color, size = 1.4, period = 1.6, seed = 0) {
  if (DETAIL.q < 2) return;
  const ga = ctx.globalAlpha;
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const u = (t / period + i / n + seed * 0.37) % 1;
    const x = x0 + (x1 - x0) * ((i * 0.618 + seed) % 1) + Math.sin(t * 3 + i * 2.1) * 1.5;
    ctx.globalAlpha = ga * (u < 0.15 ? u / 0.15 : 1 - u);
    ctx.fillRect(x - size / 2, y - u * h - size / 2, size, size);
  }
  ctx.globalAlpha = ga;
}
// Eyebrows give a Kindling its character: 'stern' (angled in), 'sharp' (flat and low), 'soft'.
export function brows(ctx, x, y, sep, r, kind) {
  ctx.lineCap = 'round'; ctx.strokeStyle = '#3a2a40'; ctx.lineWidth = Math.max(1, r * 0.42);
  for (const s of [-1, 1]) {
    const ex = x + s * sep;
    ctx.beginPath();
    if (kind === 'stern') { ctx.moveTo(ex - s * r * 1.0, y - r * 1.75); ctx.lineTo(ex + s * r * 0.9, y - r * 1.25); }
    else if (kind === 'sharp') { ctx.moveTo(ex - s * r * 1.1, y - r * 1.35); ctx.lineTo(ex + s * r * 1.0, y - r * 1.2); }
    else { ctx.moveTo(ex - r * 0.9, y - r * 1.5); ctx.quadraticCurveTo(ex, y - r * 2.0, ex + r * 0.9, y - r * 1.5); }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}
