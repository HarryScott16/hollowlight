// Props the Bolt Ward uses in BOTH skins, following the upgrade progression framework
// (docs/upgrade-visuals-research.md): each path grows its own story tier by tier.
//   path 1 MIGHT  Ballista:      a heavier crossbow with a winch -> steel -> a mounted ballista -> armoured, bannered siege lance
//   path 2 MANY   Twin-shot:     a second quiver -> twin crossbows -> a repeater and a helper -> a bolt battery and two helpers
//   path 3 CRAFT  Hunter's Mark: a keen-eye lens -> a hood and a mark -> a cloak, mask and hawk -> a night hunter, orbiting marks, hawk aloft
// Aimed parts turn in the ground plane (aimPlane); their muzzles are computed in each skin.
import { INK, TAU, circle, poly, rrect, ink, flat, line, glow, glyph, aimPlane } from './kit.js';

export const STEEL = '#b8c2d2', STEEL2 = '#8a96aa', GOLD = '#ffcf4a', LEATHER = '#8a5a32', WOOD = '#7a5236', DARKWOOD = '#4a3020', BRASS = '#c8963a';
export const GREEN = '#4f8a3c', GREEN2 = '#2f5a28', NIGHT = '#1f2a22', NIGHT2 = '#2c3a30', SILVER = '#e9eef6';

// A small crossbow; Might's tier 1-2 adds a steel winch at the back (the "heavier crossbow" cue).
export function crossbowX(ctx, x, y, ang, size = 1, { heavy = false, winch = false, recoil = 0 } = {}) {
  const back = recoil * 2.5;
  ctx.save(); ctx.translate(x, y); aimPlane(ctx, ang); ctx.scale(size, size);
  if (winch) { circle(ctx, -8 - back, 0, 2.8); flat(ctx, STEEL, 1.2); line(ctx, [[-8 - back, 0], [-8 - back, -4.5]], STEEL2, 0.9); circle(ctx, -8 - back, -4.8, 1.1); flat(ctx, STEEL, 0.8); }
  rrect(ctx, -7 - back, -1.8, 15, 3.6, 1.2); flat(ctx, heavy ? '#8f6b47' : WOOD, 1.4);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(3 - back, -8); ctx.quadraticCurveTo(9 - back, 0, 3 - back, 8);
  ctx.strokeStyle = INK; ctx.lineWidth = heavy ? 4.5 : 3.6; ctx.stroke();
  ctx.strokeStyle = heavy ? STEEL : '#c9925a'; ctx.lineWidth = heavy ? 2.6 : 2; ctx.stroke();
  ctx.lineCap = 'butt';
  if (recoil < 0.5) { poly(ctx, [[12 - back, 0], [8 - back, -2.4], [8 - back, 2.4]]); flat(ctx, STEEL, 1); }
  ctx.restore();
}

// Mounted ballista: a tripod on the ground (static) and a great bow that turns in the aim plane.
export function tripod(ctx, x, y, s, gold) {
  for (const [dx, dy] of [[-7, 9], [7, 9], [0, 11]]) line(ctx, [[x, y], [x + dx * s, y + dy * s]], gold ? '#6a4a2a' : DARKWOOD, 2 * s);
  circle(ctx, x, y, 2.4 * s); flat(ctx, gold ? GOLD : STEEL2, 1.2);
}
export const BALLISTA_TIP = 22;   // bolt tip, in ballista units along the aim
export function ballista(ctx, x, y, ang, s, gold, lance, t, recoil = 0) {
  const back = recoil * 3;
  ctx.save(); ctx.translate(x, y); aimPlane(ctx, ang); ctx.scale(s, s);
  rrect(ctx, -12 - back, -2.6, 26, 5.2, 1.6); flat(ctx, gold ? '#6a4a2a' : DARKWOOD, 1.6);
  rrect(ctx, -10 - back, -1.2, 22, 2.4, 1); flat(ctx, STEEL2, 0.8);
  if (gold) for (const x0 of [-9, -1, 7]) { rrect(ctx, x0 - back, -3.2, 2, 6.4, 0.6); flat(ctx, GOLD, 0.8); }
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(4 - back, -14); ctx.quadraticCurveTo(13 - back, 0, 4 - back, 14);
  ctx.strokeStyle = INK; ctx.lineWidth = 5.5; ctx.stroke(); ctx.strokeStyle = gold ? GOLD : STEEL; ctx.lineWidth = 3.4; ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(4 - back, -14); ctx.lineTo(-8 + recoil * 10, 0); ctx.lineTo(4 - back, 14); ctx.stroke();
  ctx.lineCap = 'butt';
  if (recoil < 0.5) {
    if (lance) { glow(ctx, 12, 0, 12 + Math.sin(t * 7) * 2, '#ffffff', 0.7); rrect(ctx, -6, -1.6, 26, 3.2, 1.4); flat(ctx, '#ffffff', 1); poly(ctx, [[25, 0], [19, -3.6], [19, 3.6]]); flat(ctx, SILVER, 1); }
    else { rrect(ctx, -6, -1, 20, 2, 0.8); flat(ctx, WOOD, 0.8); poly(ctx, [[18, 0], [13, -3], [13, 3]]); flat(ctx, STEEL, 1); }
  }
  ctx.restore();
}

// A repeating crossbow with a brass rotary magazine (more barrels on Storm of Bolts).
export const REPEATER_TIP = 16;
export function repeater(ctx, x, y, ang, s, t, big, recoil = 0) {
  ctx.save(); ctx.translate(x, y); aimPlane(ctx, ang); ctx.scale(s, s);
  const spin = t * (big ? 16 : 9), n = big ? 5 : 3;
  for (let i = 0; i < n; i++) { const off = Math.sin(spin + (i / n) * TAU) * (big ? 5 : 3.5); rrect(ctx, -4 - recoil * 2, off - 1.3, 20, 2.6, 1); flat(ctx, STEEL, 0.9); }
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(10, -9); ctx.quadraticCurveTo(15, 0, 10, 9); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = '#c9925a'; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.lineCap = 'butt';
  circle(ctx, -5, 0, big ? 7 : 5.5); flat(ctx, BRASS, 1.5);
  ctx.save(); ctx.translate(-5, 0); ctx.rotate(spin * 0.5); for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); line(ctx, [[0, 0], [big ? 5 : 4, 0]], '#6a4a2a', 0.7); } ctx.restore();
  ctx.restore();
}

// A hunting hawk: perched (wings folded) or aloft (wings beating).
export function hawk(ctx, x, y, s, t, aloft) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (aloft) { const f = Math.sin(t * 10) * 0.8;
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -1); ctx.quadraticCurveTo(k * 6, -4 - f * 4, k * 11, -1 - f * 5); ctx.quadraticCurveTo(k * 6, 1, 0, 1.5); ctx.closePath(); flat(ctx, '#6a4a2e', 1.1); } }
  ctx.beginPath(); ctx.ellipse(0, 0, 3.2, 4.5, 0, 0, TAU); flat(ctx, '#7a5a3a', 1.2);
  ctx.beginPath(); ctx.ellipse(0.4, 1, 2, 3, 0, 0, TAU); ctx.fillStyle = '#f0e6d0'; ctx.fill();
  if (!aloft) { ctx.beginPath(); ctx.ellipse(-2.2, 0.5, 1.8, 4, 0.2, 0, TAU); flat(ctx, '#5a3e24', 0.9); }
  circle(ctx, 0.6, -4.6, 2.4); flat(ctx, '#7a5a3a', 1.1);
  poly(ctx, [[2.6, -4.8], [4.6, -4], [2.6, -3.4]]); flat(ctx, GOLD, 0.7);
  circle(ctx, 1.3, -5.1, 0.6); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}

// The hunter's mark: a diamond in a ring, turning.
export function mark(ctx, x, y, r, t, k = 1) {
  glow(ctx, x, y, r * 1.8, '#ffffff', 0.45 * k);
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(t * 1.6), 1);
  poly(ctx, [[0, -r * 0.7], [r * 0.55, 0], [0, r * 0.7], [-r * 0.55, 0]]); flat(ctx, '#ffffff', 1.2); ctx.restore();
  circle(ctx, x, y, r); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
}

// The Siege Lance's war banner: silver cloth, gold trim, the Kinetic arrow.
export function banner(ctx, x, yTop, yFoot) {
  line(ctx, [[x, yFoot], [x, yTop]], '#6a4a2a', 1.4);
  circle(ctx, x, yTop - 1, 1.6); flat(ctx, GOLD, 0.8);
  ctx.beginPath(); ctx.moveTo(x + 0.6, yTop + 1); ctx.lineTo(x + 11, yTop + 1); ctx.lineTo(x + 11, yTop + 13); ctx.lineTo(x + 6, yTop + 10.5); ctx.lineTo(x + 0.6, yTop + 13); ctx.closePath();
  ink(ctx, SILVER, 1.3, x, x + 11);
  ctx.beginPath(); ctx.moveTo(x + 0.6, yTop + 2.6); ctx.lineTo(x + 11, yTop + 2.6); ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2; ctx.stroke();
  glyph(ctx, 'arrow', x + 5.8, yTop + 7, 4, '#5a6478');
}

// Death Sentence: a hunter's sigil turning on the ground (in place of the plain tier 4 aura).
export function sigil(ctx, t, R) {
  glow(ctx, 0, 11, R * 1.4, '#ffffff', 0.3);
  ctx.save(); ctx.translate(0, 11); ctx.scale(1, 0.38);
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(233,238,246,0.7)'; ctx.lineWidth = 2;
  circle(ctx, 0, 0, R); ctx.stroke(); circle(ctx, 0, 0, R * 0.72); ctx.stroke();
  ctx.rotate(t * 0.6);
  for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.beginPath(); ctx.moveTo(R * 0.72, 0); ctx.lineTo(R, -3); ctx.lineTo(R * 1.12, 0); ctx.lineTo(R, 3); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
}

export function quiver(ctx, x, y, n, tips) {
  for (let i = 0; i < n; i++) {
    const bx = x + 1 + (n > 1 ? i * (4 / (n - 1)) : 2), by = y - 5 - (i % 2) * 1.6;
    line(ctx, [[bx, y + 1], [bx, by]], WOOD, 0.8);
    poly(ctx, [[bx - 1.6, by + 2.6], [bx, by - 0.6], [bx + 1.6, by + 2.6]]); flat(ctx, tips, 0.8);
  }
  rrect(ctx, x, y, 6, 15, 2); ink(ctx, LEATHER, 1.4, x, x + 6);
  rrect(ctx, x - 0.3, y + 2, 6.6, 1.6, 0.6); flat(ctx, BRASS, 0.7);
}
