// Mock-up of the proposed upgrade progression (docs/upgrade-visuals-research.md) for the Bolt Ward,
// in both skins: each path grows its own story tier by tier.
//   path 1 MIGHT  Ballista:      heavier crossbow -> steel -> a mounted ballista -> an armoured siege lance
//   path 2 MANY   Twin-shot:     fuller quiver -> twin crossbows -> repeater + a helper -> a bolt battery + two helpers
//   path 3 CRAFT  Hunter's Mark: keen-eye lens -> hood + mark -> cloak, mask, a hawk -> Death Sentence: orbiting marks, hawk aloft
// Kept constant on every path: the body and face (Kindlings) or the green watch-post and its
// silver window (Lanterns), the silver Kinetic light, the plinth with its tier notches, the crossbow.
// Concept code only: it reuses the game's drawing helpers read-only and changes no game code.
import { DMG, INK, TAU, circle, poly, rrect, star, ink, flat, line, glow, glyph, aimPlane, FORE, crown, groundAura, twinkle, risingMotes, mainPath, shadow } from '../../../public/js/render/wards/kit.js';
import { hearthstone, eyes, tuft, WAX } from '../../../public/js/render/wards/kindlings.js';
import { plinth, pane, roof, crossbow, BRASS } from '../../../public/js/render/wards/lanterns.js';
import { wardScale } from '../../../public/js/render/wardArt.js';

const STEEL = '#b8c2d2', STEEL2 = '#8a96aa', GOLD = '#ffcf4a', LEATHER = '#8a5a32', WOOD = '#7a5236', DARKWOOD = '#4a3020';
const GREEN = '#4f8a3c', GREEN2 = '#2f5a28', NIGHT = '#1f2a22', NIGHT2 = '#2c3a30', SILVER = '#e9eef6';
const GREEN_IRON = '#35553a', GREEN_TRIM = '#5f8a4a';
const d = 'kinetic';

// ---- shared props ------------------------------------------------------------------------------
// A mounted ballista: a tripod on the ground (static) and a big bow that turns in the aim plane.
function tripod(ctx, x, y, s, gold) {
  for (const [dx, dy] of [[-7, 9], [7, 9], [0, 11]]) line(ctx, [[x, y], [x + dx * s, y + dy * s]], gold ? '#6a4a2a' : DARKWOOD, 2 * s);
  circle(ctx, x, y, 2.4 * s); flat(ctx, gold ? GOLD : STEEL2, 1.2);
}
function ballista(ctx, x, y, ang, s, gold, lance, t, recoil = 0) {
  const back = recoil * 3;
  ctx.save(); ctx.translate(x, y); aimPlane(ctx, ang); ctx.scale(s, s);
  rrect(ctx, -12 - back, -2.6, 26, 5.2, 1.6); flat(ctx, gold ? '#6a4a2a' : DARKWOOD, 1.6);          // stock
  rrect(ctx, -10 - back, -1.2, 22, 2.4, 1); flat(ctx, STEEL2, 0.8);                                   // rail
  if (gold) for (const x0 of [-9, -1, 7]) { rrect(ctx, x0 - back, -3.2, 2, 6.4, 0.6); flat(ctx, GOLD, 0.8); }
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(4 - back, -14); ctx.quadraticCurveTo(13 - back, 0, 4 - back, 14);      // the great bow
  ctx.strokeStyle = INK; ctx.lineWidth = 5.5; ctx.stroke(); ctx.strokeStyle = gold ? GOLD : STEEL; ctx.lineWidth = 3.4; ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(4 - back, -14); ctx.lineTo(-8 + recoil * 10, 0); ctx.lineTo(4 - back, 14); ctx.stroke();
  ctx.lineCap = 'butt';
  if (recoil < 0.5) { // the loaded bolt (a glowing lance on Siege Lance)
    if (lance) { glow(ctx, 12, 0, 12 + Math.sin(t * 7) * 2, '#ffffff', 0.7); rrect(ctx, -6, -1.6, 26, 3.2, 1.4); flat(ctx, '#ffffff', 1); poly(ctx, [[25, 0], [19, -3.6], [19, 3.6]]); flat(ctx, SILVER, 1); }
    else { rrect(ctx, -6, -1, 20, 2, 0.8); flat(ctx, WOOD, 0.8); poly(ctx, [[18, 0], [13, -3], [13, 3]]); flat(ctx, STEEL, 1); }
  }
  ctx.restore();
}
// A repeating crossbow with a brass rotary magazine; `n` barrels on Storm of Bolts.
function repeater(ctx, x, y, ang, s, t, big, recoil = 0) {
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
function hawk(ctx, x, y, s, t, aloft) {
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
function mark(ctx, x, y, r, t, k = 1) {
  glow(ctx, x, y, r * 1.8, '#ffffff', 0.45 * k);
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(t * 1.6), 1);
  poly(ctx, [[0, -r * 0.7], [r * 0.55, 0], [0, r * 0.7], [-r * 0.55, 0]]); flat(ctx, '#ffffff', 1.2); ctx.restore();
  circle(ctx, x, y, r); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
}
// The Siege Lance's war banner: silver cloth, gold trim, the Kinetic arrow (static).
function banner(ctx, x, yTop, yFoot) {
  line(ctx, [[x, yFoot], [x, yTop]], '#6a4a2a', 1.4);
  circle(ctx, x, yTop - 1, 1.6); flat(ctx, GOLD, 0.8);
  ctx.beginPath(); ctx.moveTo(x + 0.6, yTop + 1); ctx.lineTo(x + 11, yTop + 1); ctx.lineTo(x + 11, yTop + 13); ctx.lineTo(x + 6, yTop + 10.5); ctx.lineTo(x + 0.6, yTop + 13); ctx.closePath();
  ink(ctx, SILVER, 1.3, x, x + 11);
  ctx.beginPath(); ctx.moveTo(x + 0.6, yTop + 2.6); ctx.lineTo(x + 11, yTop + 2.6); ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2; ctx.stroke();
  glyph(ctx, 'arrow', x + 5.8, yTop + 7, 4, '#5a6478');
}
// Death Sentence: a hunter's sigil turning on the ground (in place of the plain tier 4 aura).
function sigil(ctx, t, R) {
  glow(ctx, 0, 11, R * 1.4, '#ffffff', 0.3);
  ctx.save(); ctx.translate(0, 11); ctx.scale(1, 0.38);
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(233,238,246,0.7)'; ctx.lineWidth = 2;
  circle(ctx, 0, 0, R); ctx.stroke(); circle(ctx, 0, 0, R * 0.72); ctx.stroke();
  ctx.rotate(t * 0.6);
  for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.beginPath(); ctx.moveTo(R * 0.72, 0); ctx.lineTo(R, -3); ctx.lineTo(R * 1.12, 0); ctx.lineTo(R, 3); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
}
function quiver(ctx, x, y, n, tips) {
  for (let i = 0; i < n; i++) {
    const bx = x + 1 + (n > 1 ? i * (4 / (n - 1)) : 2), by = y - 5 - (i % 2) * 1.6;
    line(ctx, [[bx, y + 1], [bx, by]], WOOD, 0.8);
    poly(ctx, [[bx - 1.6, by + 2.6], [bx, by - 0.6], [bx + 1.6, by + 2.6]]); flat(ctx, tips, 0.8);
  }
  rrect(ctx, x, y, 6, 15, 2); ink(ctx, LEATHER, 1.4, x, x + 6);
  rrect(ctx, x - 0.3, y + 2, 6.6, 1.6, 0.6); flat(ctx, BRASS, 0.7);
}

// ==== Kindlings ===================================================================================
function archer(ctx, x, P, opts = {}) { // the archer's body, dressed per path and tier (static)
  const { might, many, craft, mt } = P;
  ctx.save(); ctx.translate(x, 0);
  if (craft && mt >= 3) { // the hunter's cloak, long and dark, silver-trimmed at T4
    ctx.beginPath(); ctx.moveTo(-7, -10); ctx.quadraticCurveTo(-14, 0, -12, 10); ctx.lineTo(12, 10); ctx.quadraticCurveTo(14, 0, 7, -10); ctx.closePath();
    ink(ctx, mt >= 4 ? NIGHT : GREEN2, 1.6, -13, 13);
    if (mt >= 4) { ctx.beginPath(); ctx.moveTo(-12, 10); ctx.lineTo(12, 10); ctx.strokeStyle = SILVER; ctx.lineWidth = 1.3; ctx.stroke(); }
  }
  rrect(ctx, -7.5, -14, 15, 23, 6.5); ink(ctx, WAX, 2, -7.5, 7.5);
  const tunic = craft && mt >= 4 ? NIGHT2 : GREEN;
  ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-2.5, -4); ctx.lineTo(0, -1); ctx.lineTo(2.5, -4); ctx.lineTo(8, -4); ctx.lineTo(8.4, 9); ctx.quadraticCurveTo(0, 11, -8.4, 9); ctx.closePath();
  ink(ctx, tunic, 1.8, -8, 8);
  rrect(ctx, -8.2, 3, 16.4, 2.6, 1); flat(ctx, LEATHER, 1);
  rrect(ctx, -1.6, 2.7, 3.2, 3.2, 0.6); flat(ctx, might && mt >= 4 ? GOLD : BRASS, 0.9);
  // MIGHT: steel, then a breastplate, then full armour with gold trim and a plumed helm
  if (might && mt >= 1) { rrect(ctx, 5, -1, 4, 3, 1); flat(ctx, LEATHER, 0.9); }                       // bracer
  if (might && mt >= 2) { ctx.beginPath(); ctx.ellipse(6.5, -4, 4.4, 3.3, 0.3, 0, TAU); ink(ctx, STEEL, 1.4, 3, 11); }
  if (might && mt >= 3) {
    ctx.beginPath(); ctx.ellipse(-6.5, -4, 4.4, 3.3, -0.3, 0, TAU); ink(ctx, STEEL, 1.4, -11, -3);
    rrect(ctx, -6, -4, 12, 8, 3); ink(ctx, STEEL, 1.5, -6, 6); glyph(ctx, 'arrow', 0, 0, 3, '#5a6478');
    if (mt >= 4) { rrect(ctx, -6, 2.6, 12, 1.6, 0.6); flat(ctx, GOLD, 0.8); for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 6.5, -4, 4.4, 3.3, s * 0.3, Math.PI, TAU); ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2; ctx.stroke(); } }
  }
  // MANY: a bandolier of bolts across the chest
  if (many && mt >= 1) { line(ctx, [[-7, -4], [6, 8]], LEATHER, 2.4); for (let i = 0; i < (mt >= 3 ? 4 : 3); i++) { const u = 0.15 + i * 0.22; poly(ctx, [[-7 + 13 * u - 1.3, -4 + 12 * u], [-7 + 13 * u, -4 + 12 * u - 3], [-7 + 13 * u + 1.3, -4 + 12 * u]]); flat(ctx, SILVER, 0.7); } }
  // CRAFT: a hood (T2), a hunter's mask (T3)
  if (craft && mt >= 2) {
    ctx.beginPath(); ctx.moveTo(-8.5, -2); ctx.quadraticCurveTo(-9.5, -16, 0, -17); ctx.quadraticCurveTo(9.5, -16, 8.5, -2); ctx.lineTo(5, -4); ctx.quadraticCurveTo(0, -12, -5, -4); ctx.closePath();
    ink(ctx, mt >= 4 ? NIGHT : GREEN2, 1.6, -9, 9);
    if (mt >= 4) { ctx.beginPath(); ctx.moveTo(-8.5, -2); ctx.quadraticCurveTo(-9.5, -16, 0, -17); ctx.quadraticCurveTo(9.5, -16, 8.5, -2); ctx.strokeStyle = SILVER; ctx.lineWidth = 0.9; ctx.stroke(); }
    if (mt >= 2) { poly(ctx, [[0, 0.5], [1.6, 2.6], [0, 4.7], [-1.6, 2.6]]); flat(ctx, '#ffffff', 0.8); }        // the mark charm
  }
  if (craft && mt >= 3) { rrect(ctx, -7, -8.4, 14, 4.6, 2); flat(ctx, '#1a1a20', 0.8); }                       // mask band
  if (!(craft && mt >= 2)) { // headband with a silver feather; a plumed steel helm on Siege Lance
    if (might && mt >= 4) {
      ctx.beginPath(); ctx.moveTo(-8, -9); ctx.quadraticCurveTo(-8, -17, 0, -17.5); ctx.quadraticCurveTo(8, -17, 8, -9); ctx.closePath(); ink(ctx, STEEL, 1.6, -8, 8);
      rrect(ctx, -8.4, -10.5, 16.8, 2.2, 1); flat(ctx, GOLD, 0.9);
      ctx.beginPath(); ctx.moveTo(-2, -17); ctx.quadraticCurveTo(-10, -24, -15, -19); ctx.quadraticCurveTo(-9, -19, -2, -14); flat(ctx, '#d84a3a', 1.1);     // plume
    } else {
      rrect(ctx, -7.7, -11.5, 15.4, 2.4, 1); flat(ctx, might && mt >= 2 ? STEEL : LEATHER, 1);
      ctx.beginPath(); ctx.moveTo(5.5, -10.5); ctx.quadraticCurveTo(11, -13, 12.5, -19); ctx.quadraticCurveTo(8, -16, 5.5, -10.5); flat(ctx, SILVER, 1.1);
    }
  }
  if (craft && mt === 1) { circle(ctx, 3.6, -6, 4.2); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = BRASS; ctx.lineWidth = 1.6; ctx.stroke(); line(ctx, [[7.6, -5], [9, 2]], BRASS, 0.8); }   // keen-eye lens on a chain
  ctx.restore();
}
function helper(ctx, x, y, s) { // a little archer friend (Twin-shot T3+)
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -6, -14, 12, 15, 5.5); ink(ctx, WAX, 1.8, -6, 6);
  rrect(ctx, -6.4, -5.5, 12.8, 7.5, 3); ink(ctx, GREEN, 1.5, -6, 6);
  rrect(ctx, -6.4, -1, 12.8, 2, 0.8); flat(ctx, LEATHER, 0.9);
  rrect(ctx, -6.2, -11.2, 12.4, 2, 0.8); flat(ctx, LEATHER, 0.8);
  ctx.restore();
}
const K_HELPERS = (P) => (P.many && P.mt >= 4 ? [[-13, 9], [13, 9]] : P.many && P.mt >= 3 ? [[-13, 9]] : []);
const kBolt = {
  body(ctx, P) {
    const { might, many, craft, mt } = P;
    hearthstone(ctx, might && mt >= 3 ? 32 : many && mt >= 3 ? 34 : 26, P, d);
    if (might && mt >= 3) for (const x of [-15, 15]) { poly(ctx, [[x - 1.4, 11], [x + 1.4, 11], [x, 4]]); flat(ctx, mt >= 4 ? GOLD : STEEL2, 0.9); }   // anchoring stakes
    if (many && mt >= 4) for (const x of [-7, 7]) { rrect(ctx, x - 3.5, 6, 7, 5, 1); ink(ctx, '#6a4a2a', 1.1, x - 3.5, x + 3.5); }                // ammo crates
    const ax = might && mt >= 3 ? -4 : 0;
    quiver(ctx, ax - 12.5, -15, many ? Math.min(6, 3 + mt) : mt >= 2 ? 4 : 3, might && mt >= 2 ? STEEL : '#f0f0f0');
    if (many && mt >= 1 && mt < 4) quiver(ctx, 7, -14, 3 + mt, '#f0f0f0');
    if (might && mt >= 4) banner(ctx, -17, -40, 10);
    for (const [x, y] of K_HELPERS(P)) helper(ctx, x, y, 0.66);
    archer(ctx, ax, P);
    if (might && mt >= 3) tripod(ctx, 7, 3, 1, mt >= 4);
    if (mt >= 4) crown(ctx, ax, -30, d, 1.1);
    return -38;
  },
  back(ctx, P, st) { if (P.mt >= 4) { if (P.craft) sigil(ctx, st.time, 24); else groundAura(ctx, d, st.time, 24); } },
  front(ctx, P, st) {
    const { might, many, craft, mt } = P, ax = might && mt >= 3 ? -4 : 0;
    if (craft && mt === 1) twinkle(ctx, 2.4, -7.4, 2.2, Math.sin(st.time * 2.5) * 1.5 - 0.3);
    for (const [x, y] of K_HELPERS(P)) {
      ctx.save(); ctx.translate(x, y); ctx.scale(0.66, 0.66); eyes(ctx, 0, -8, st, { sep: 2.8, r: 2.3, brow: 'stern' }); tuft(ctx, 0, -13.5, 0.75, d, st.time + x); ctx.restore();
      crossbow(ctx, x + 2, y - 3, st.ang, 0.62, false, st.recoil);
    }
    const glowEyes = craft && mt >= 4;
    eyes(ctx, ax, -6, st, { lid: craft && mt >= 2, brow: craft && mt >= 2 ? null : 'stern' });
    if (glowEyes) { glow(ctx, ax - 3.6, -6, 4, '#ffffff', 0.8); glow(ctx, ax + 3.6, -6, 4, '#ffffff', 0.8); }
    tuft(ctx, ax, -14 - (might && mt >= 4 ? 3 : 0), 1 + mt * 0.06, d, st.time);
    // the weapon: one crossbow, two, a repeater, a battery, or a mounted ballista
    if (might && mt >= 3) ballista(ctx, 7, 1, st.ang, mt >= 4 ? 1.15 : 0.95, mt >= 4, mt >= 4, st.time, st.recoil);
    else if (might) crossbow(ctx, ax + 4, 2, st.ang, 1 + mt * 0.2, mt >= 1, st.recoil);
    else if (many && mt >= 3) repeater(ctx, 4, 1, st.ang, mt >= 4 ? 1.2 : 1, st.time, mt >= 4, st.recoil);
    else if (many && mt >= 2) { crossbow(ctx, -9, 1, st.ang, 0.95, false, st.recoil); crossbow(ctx, 9, 1, st.ang, 0.95, false, st.recoil); }
    else crossbow(ctx, ax + 4, 2, st.ang, 1, false, st.recoil);
    if (craft && mt >= 3) { // Hunting Party: a hawk on the shoulder; Death Sentence: aloft, and marks orbit
      if (mt >= 4) {
        hawk(ctx, -10 + Math.cos(st.time * 1.2) * 6, -30 + Math.sin(st.time * 2.4) * 2, 0.9, st.time, true);
        for (let i = 0; i < 3; i++) { const a = st.time * 1.1 + (i / 3) * TAU; mark(ctx, Math.cos(a) * 15, -6 + Math.sin(a) * 6, 3.4, st.time + i, 0.8); }
      } else { hawk(ctx, -7.5, -15, 0.85, st.time, false); mark(ctx, 12, -20, 5, st.time); }
    }
    if (might && mt >= 4) risingMotes(ctx, st.time, 4, 2, 16, -2, 14, '#ffffff', 1.4, 1.2, st.id || 0);
    if (many && mt >= 4) risingMotes(ctx, st.time, 3, -16, 16, 6, 8, '#ffcf4a', 1.2, 0.9, st.id || 0);
  },
};

// ==== Lanterns ====================================================================================
const L_ROOF = -15;
const lBolt = {
  body(ctx, P) {
    const { might, many, craft, mt } = P;
    plinth(ctx, might && mt >= 3 ? 28 : many && mt >= 4 ? 30 : 24, P, d, mt >= 4 && might ? '#5a5f70' : WOOD);
    // Twin-shot: bolt racks fill up (T1), outrigger arms carry extra crossbows (T4)
    const racks = many && mt >= 1 ? 2 : 1;
    for (let r = 0; r < racks; r++) {
      const x = r ? -13 : 8;
      rrect(ctx, x, -10, 5, 15, 1.5); ink(ctx, '#5a3a22', 1.3, x, x + 5);
      const n = many ? Math.min(5, 3 + mt) : 3;
      for (let i = 0; i < n; i++) { const y = -12 - (i % 2) * 1.5, bx = x + 0.8 + i * (3.4 / (n - 1)); line(ctx, [[bx, -9], [bx, y]], WOOD, 0.8); poly(ctx, [[bx - 1.3, y + 2.2], [bx, y - 0.6], [bx + 1.3, y + 2.2]]); flat(ctx, might && mt >= 2 ? STEEL : SILVER, 0.6); }
    }
    if (many && mt >= 4) for (const s of [-1, 1]) { line(ctx, [[s * 9, -10], [s * 17, -16]], BRASS, 1.6); circle(ctx, s * 17, -16, 1.8); flat(ctx, BRASS, 0.8); }
    // the housing: green watch-post; MIGHT clads it in riveted steel and crenellates it at T4
    const steel = might && mt >= 3, hc = steel ? '#6a7488' : craft && mt >= 4 ? NIGHT2 : GREEN_IRON;
    rrect(ctx, -9, -15, 18, 22, 2); ink(ctx, hc, 2, -9, 9);
    rrect(ctx, -9.5, -15.5, 19, 2.6, 1); flat(ctx, steel ? (mt >= 4 ? GOLD : STEEL) : craft && mt >= 4 ? SILVER : GREEN_TRIM, 1);
    rrect(ctx, -9.5, 4, 19, 2.6, 1); flat(ctx, steel ? (mt >= 4 ? GOLD : STEEL) : craft && mt >= 4 ? SILVER : GREEN_TRIM, 1);
    if (steel) for (const [x, y] of [[-7, -12], [7, -12], [-7, 2], [7, 2]]) { circle(ctx, x, y, 0.9); ctx.fillStyle = '#e0e6f0'; ctx.fill(); }
    if (might && mt >= 1) for (const [x, y] of [[-9, -15], [9, -15], [-9, 7], [9, 7]]) { rrect(ctx, x - 1.6, y - 1.6, 3.2, 3.2, 0.8); flat(ctx, STEEL, 0.8); }   // corner caps
    if (might && mt >= 2 && !steel) for (const y of [-11, 1]) { rrect(ctx, -10, y - 1.5, 20, 3, 1); flat(ctx, STEEL, 1.2); }
    if (steel) for (const x of [-11, 11]) { poly(ctx, [[x, 7], [x * 1.3, 7], [x, -9]]); ink(ctx, mt >= 4 ? '#8a7a5a' : STEEL2, 1.4, -14, 14); }
    // the window: silver light; CRAFT turns it into a hunter's eye
    pane(ctx, 0, -5, 10, 14, d);
    if (craft && mt >= 1) { circle(ctx, 0, -5, 4.4); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke(); ctx.strokeStyle = BRASS; ctx.lineWidth = 1.2; ctx.stroke(); }
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -5, 4.6, 2.8, 0, 0, TAU); flat(ctx, '#ffffff', 1.2); }
    else { line(ctx, [[0, -12], [0, 2]], hc, 0.9); line(ctx, [[-5, -5], [5, -5]], hc, 0.9); }
    if (craft && mt >= 2) { // a hood awning over the window; at T3 a dark drape over the whole post
      ctx.beginPath(); ctx.moveTo(-10.5, -13); ctx.quadraticCurveTo(0, -18, 10.5, -13); ctx.lineTo(8, -9); ctx.quadraticCurveTo(0, -12, -8, -9); ctx.closePath(); ink(ctx, mt >= 4 ? NIGHT : GREEN2, 1.3, -10, 10);
      if (mt >= 3) for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10.5, -13); ctx.quadraticCurveTo(s * 13, -2, s * 11.5, 7); ctx.lineTo(s * 8.5, 7); ctx.quadraticCurveTo(s * 10, -3, s * 8, -9); ctx.closePath(); ink(ctx, mt >= 4 ? NIGHT : GREEN2, 1.2, -13, 13); }
    }
    // the roof: a peaked roof, a ballista platform (MIGHT T3), crenellations (T4), a dark spire (CRAFT T4)
    if (steel) {
      rrect(ctx, -11, L_ROOF - 4, 22, 4, 1); ink(ctx, mt >= 4 ? '#8a7a5a' : '#5a6478', 1.6, -11, 11);
      if (mt >= 4) for (const x of [-10, -4, 2, 8]) { rrect(ctx, x, L_ROOF - 8, 3, 4, 0.6); ink(ctx, '#8a7a5a', 1.1, x, x + 3); }
      tripod(ctx, 0, L_ROOF - 6, 0.8, mt >= 4);
    } else if (craft && mt >= 4) { poly(ctx, [[-11, L_ROOF], [11, L_ROOF], [0, L_ROOF - 13]]); ink(ctx, NIGHT, 2, -11, 11); line(ctx, [[0, L_ROOF - 13], [0, L_ROOF]], SILVER, 0.6); }
    else roof(ctx, 0, L_ROOF, 23, 7, '#6a3a2a');
    if (!(craft && mt >= 3) && !steel) line(ctx, [[-10, L_ROOF], [-10, L_ROOF - 13]], WOOD, 1);   // pennant pole
    if (steel && mt >= 4) banner(ctx, -15, -36, 9);
    if (mt >= 4) crown(ctx, steel ? -15 : 0, steel ? -37 : craft ? L_ROOF - 12 : L_ROOF - 6, d, 1.05);
    return -42;
  },
  back(ctx, P, st) { if (P.mt >= 4) { if (P.craft) sigil(ctx, st.time, 24); else groundAura(ctx, d, st.time, 24); } },
  front(ctx, P, st) {
    const { might, many, craft, mt } = P, steel = might && mt >= 3;
    if (craft && mt === 1) twinkle(ctx, -2, -7, 2.2, Math.sin(st.time * 2.5) * 1.5 - 0.3);
    glow(ctx, 0, -5, 12 + mt * 1.5, '#ffffff', 0.28 + mt * 0.04);
    if (!(craft && mt >= 3) && !steel) { // the pennant flutters
      const w = Math.sin(st.time * 6 + (st.id || 0)) * 1.5;
      ctx.beginPath(); ctx.moveTo(-10, L_ROOF - 13); ctx.quadraticCurveTo(-5, L_ROOF - 12 + w, -1, L_ROOF - 11 + w * 0.6); ctx.quadraticCurveTo(-5, L_ROOF - 10 - w * 0.4, -10, L_ROOF - 8.5); ctx.closePath();
      flat(ctx, many && mt >= 2 ? BRASS : GREEN_TRIM, 1.1);
    }
    if (craft && mt >= 2) { // the eye's pupil tracks the target; it glows at T4
      const ax = Math.cos(st.ang), ay = Math.sin(st.ang) * 0.6;
      circle(ctx, ax * 2, -5 + ay * 1.2, 1.8); ctx.fillStyle = INK; ctx.fill();
      if (mt >= 4) glow(ctx, 0, -5, 9, '#ffffff', 0.6 + Math.sin(st.time * 4) * 0.15);
    }
    if (steel) ballista(ctx, 0, L_ROOF - 7, st.ang, mt >= 4 ? 1.1 : 0.9, mt >= 4, mt >= 4, st.time, st.recoil);
    else if (might) crossbow(ctx, 0, L_ROOF - 9, st.ang, 1 + mt * 0.2, mt >= 1, st.recoil);
    else if (many && mt >= 3) {
      repeater(ctx, 0, L_ROOF - 10, st.ang, mt >= 4 ? 1.15 : 1, st.time, mt >= 4, st.recoil);
      if (mt >= 4) for (const s of [-1, 1]) crossbow(ctx, s * 17, -19, st.ang, 0.75, false, st.recoil);
    } else if (many && mt >= 2) { crossbow(ctx, -5, L_ROOF - 8, st.ang, 0.9, false, st.recoil); crossbow(ctx, 5, L_ROOF - 8, st.ang, 0.9, false, st.recoil); }
    else crossbow(ctx, 0, L_ROOF - 8, st.ang, 1, false, st.recoil);
    if (craft && mt >= 3) {
      if (mt >= 4) {
        hawk(ctx, -12 + Math.cos(st.time * 1.2) * 6, -36 + Math.sin(st.time * 2.4) * 2, 0.9, st.time, true);
        for (let i = 0; i < 3; i++) { const a = st.time * 1.1 + (i / 3) * TAU; mark(ctx, Math.cos(a) * 16, -8 + Math.sin(a) * 6, 3.4, st.time + i, 0.8); }
      } else { hawk(ctx, 9.5, L_ROOF - 3, 0.85, st.time, false); mark(ctx, -15, -24, 5, st.time); }
    }
    if (might && mt >= 4) risingMotes(ctx, st.time, 4, -8, 8, L_ROOF - 6, 14, '#ffffff', 1.4, 1.2, st.id || 0);
    if (many && mt >= 4) risingMotes(ctx, st.time, 3, -16, 16, 4, 8, '#ffcf4a', 1.2, 0.9, st.id || 0);
  },
};

// ---- draw: the same transform as the game (wardArt.drawWard), so sizes are true ----------------
export const SKINS = { kindlings: kBolt, lanterns: lBolt };
export function draw(ctx, skin, tiers, st) {
  const art = SKINS[skin], P = { ...mainPath(tiers), tiers };
  const S = wardScale(tiers);
  ctx.save(); ctx.scale(S, S); ctx.translate(0, -11);
  art.back(ctx, P, st);
  shadow(ctx, 15);
  if (skin === 'kindlings') { const b = Math.sin(st.time * 2.4) * 0.025; ctx.translate(0, 14); ctx.scale(1 - b * 0.5, 1 + b); ctx.translate(0, -14); }
  art.body(ctx, P);
  art.front(ctx, P, st);
  ctx.restore();
}
