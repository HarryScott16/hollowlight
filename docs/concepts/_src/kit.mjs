// Shared design-system pieces used by all three concept directions:
// the damage palette + glyphs, role families, the tier ladder, and drawing helpers.
// Concepts are drawn in an upright three-quarter view: the body never rotates, the ground line is
// y = 14, and only a small aim element turns toward the target.
export const TAU = Math.PI * 2;
export const INK = '#1a1428';

// One signature hue per damage type, plus a glyph so the code survives colour blindness.
// glow:false means the core is unlit metal (Kinetic: "if it glows, it's elemental").
export const DMG = {
  kinetic: { name: 'Kinetic', core: '#e9eef6', deep: '#7d8aa3', glow: false, glyph: 'arrow' },
  blast:   { name: 'Blast',   core: '#ff9a1f', deep: '#b35a00', glow: true, glyph: 'burst' },
  fire:    { name: 'Fire',    core: '#ff4433', deep: '#a3140c', glow: true, glyph: 'flame' },
  radiant: { name: 'Radiant', core: '#ffe03a', deep: '#b08a00', glow: true, glyph: 'sun' },
  frost:   { name: 'Frost',   core: '#52e6ff', deep: '#0a7fa8', glow: true, glyph: 'flake' },
  arcane:  { name: 'Arcane',  core: '#b06bff', deep: '#5a1fb0', glow: true, glyph: 'zig' },
  blight:  { name: 'Blight (future)', core: '#5fd35a', deep: '#1f6a1a', glow: true, glyph: 'drip' },
  hearth:  { name: 'Hearth (support/economy)', core: '#ff7eb6', deep: '#b0306e', glow: true, glyph: 'heart' },
};

export const WARD_SPEC = {
  bolt:    { family: 'Shooter', dmg: 'kinetic' },
  mortar:  { family: 'Lobber', dmg: 'blast' },
  rime:    { family: 'Pulser', dmg: 'frost' },
  coil:    { family: 'Arcer', dmg: 'arcane' },
  longeye: { family: 'Spotter', dmg: 'kinetic' },
  censer:  { family: 'Sprayer', dmg: 'fire' },
  prism:   { family: 'Focuser', dmg: 'radiant' },
  beacon:  { family: 'Emitter', dmg: 'hearth' },
};

export function mainPath(tiers) {
  let main = -1, mt = 0;
  for (let i = 0; i < 3; i++) if (tiers[i] > mt) { mt = tiers[i]; main = i; }
  return { main, mt, lvl: tiers[0] + tiers[1] + tiers[2] };
}

// ---- primitives ------------------------------------------------------------------------------
export function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
export function poly(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }
export function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export function star(ctx, x, y, ro, ri, n, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU, r = i % 2 ? ri : ro; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath();
}

function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function shadeHex(h, k) {
  const [r, g, b] = hex2rgb(h);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

// Fill the current path with a left-lit gradient (light from the top-left) and ink it.
export function ink(ctx, fill, w = 2, x0 = -20, x1 = 20) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, shadeHex(fill, 0.22)); g.addColorStop(0.45, fill); g.addColorStop(1, shadeHex(fill, -0.35));
  ctx.fillStyle = g; ctx.fill();
  ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.stroke();
}
export function flat(ctx, fill, w = 2) { ctx.fillStyle = fill; ctx.fill(); if (w) { ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.stroke(); } }

export function glow(ctx, x, y, r, color, a = 0.6) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  const [R, G, B] = hex2rgb(color);
  g.addColorStop(0, `rgba(${R},${G},${B},${a})`); g.addColorStop(1, `rgba(${R},${G},${B},0)`);
  ctx.fillStyle = g; circle(ctx, x, y, r); ctx.fill();
  ctx.restore();
}

export function shadow(ctx, w, y = 14) {
  ctx.save(); ctx.fillStyle = 'rgba(8,40,34,0.45)';
  ctx.beginPath(); ctx.ellipse(3, y + 1, w, w * 0.32, 0, 0, TAU); ctx.fill(); ctx.restore();
}

// Damage glyph, drawn in ink on top of a bright core (r = core radius).
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

// The light core: the one place the damage hue lives at full strength.
export function core(ctx, dmgKey, x, y, r, { glowR = 0, glyphOn = true, shape = 'circle' } = {}) {
  const d = DMG[dmgKey];
  if (d.glow && glowR) glow(ctx, x, y, glowR, d.core, 0.55);
  if (shape === 'circle') circle(ctx, x, y, r);
  else if (shape === 'diamond') poly(ctx, [[x, y - r * 1.25], [x + r, y], [x, y + r * 1.25], [x - r, y]]);
  else if (shape === 'drop') { ctx.beginPath(); ctx.moveTo(x, y - r * 1.4); ctx.quadraticCurveTo(x + r * 1.2, y + r * 0.3, x, y + r); ctx.quadraticCurveTo(x - r * 1.2, y + r * 0.3, x, y - r * 1.4); }
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r * 1.2);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, d.core); g.addColorStop(1, d.glow ? d.core : d.deep);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();
  if (glyphOn && r >= 4) glyph(ctx, d.glyph, x, y + (shape === 'drop' ? r * 0.15 : 0), r, d.glow ? shadeHex(d.deep, -0.3) : INK);
}

// Tier ladder marks: n short glowing notches across a band (used on plinths and bodies).
export function notches(ctx, n, x, y, w, color, h = 3) {
  if (!n) return;
  const step = w / 4;
  for (let i = 0; i < n; i++) {
    const cx = x + (i - (n - 1) / 2) * step;
    rrect(ctx, cx - step * 0.32, y - h / 2, step * 0.64, h, 1.2);
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
  }
}

// Secondary-path pips: small white dots to the right of the main notches, one per tier bought.
export function secondaryPips(ctx, tiers, main, x, y) {
  let n = 0;
  for (let i = 0; i < 3; i++) if (i !== main) n += tiers[i];
  for (let i = 0; i < n; i++) { circle(ctx, x + i * 3.6, y, 1.5); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.stroke(); }
}

// Aim direction squashed for the three-quarter view.
export function aim(st) { return { x: Math.cos(st.ang), y: Math.sin(st.ang) * 0.6, a: Math.atan2(Math.sin(st.ang) * 0.6, Math.cos(st.ang)) }; }
