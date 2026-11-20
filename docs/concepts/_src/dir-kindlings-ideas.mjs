// Mock-ups of all 13 new-ward ideas from docs/tower-ideas.md in the Kindlings direction (B).
// Same rules as dir-kindlings.mjs: a wax spirit with big eyes (the aim) and a head flame in the
// damage colour; body shape + held tool = role family; MIGHT = a bigger tool, MANY = more of it /
// more kindlings, CRAFT = gear or a special trick. Notches on the hearthstone = tier; T4 = crown + halo.
import { DMG, INK, TAU, mainPath, circle, poly, rrect, star, ink, flat, glow, shadow, notches, secondaryPips, aim, shadeHex, glyph } from './kit.mjs';
import { hearthstone, eyes, tuft, badge, crown, crossbow, mini, WAX, WAX2, WOOD, IRON, BRONZE, STEEL } from './dir-kindlings.mjs';

export const IDEAS = {
  snare:   { n: 1,  name: 'Thornlight Snare', family: 'Snare',    dmg: 'kinetic', paths: ['Caltrops', 'Flashmines', 'Binding Light'], top: true },
  gate:    { n: 2,  name: 'Lychgate Wardens', family: 'Garrison', dmg: 'radiant', paths: ['Shieldwall', 'Muster', 'Lamplighters'], top: true },
  glass:   { n: 3,  name: 'Burning Glass',    family: 'Frame',    dmg: 'fire',    paths: ['Kindling Glass', 'Splitting Glass', 'Truing Glass'], top: true },
  bell:    { n: 4,  name: 'Recall Bell',      family: 'Hanger',   dmg: 'arcane',  paths: ['Great Bell', 'Carillon', 'Knell'], top: true },
  vault:   { n: 5,  name: 'Ember Vault',      family: 'Hoard',    dmg: 'hearth',  paths: ['Deep Vault', 'Tithe Box', 'Heartfire Coffer'] },
  moth:    { n: 6,  name: 'Moth Lantern',     family: 'Hanger',   dmg: 'radiant', paths: ['Bright Lure', 'Flypaper', 'Moth-trap'] },
  candles: { n: 7,  name: 'Vigil Candles',    family: 'Emitter',  dmg: 'hearth',  paths: ['Tall Candle', 'Candelabra', 'Votive'] },
  jar:     { n: 8,  name: 'Gloom Jar',        family: 'Hoard',    dmg: 'blight',  paths: ['Great Jar', 'Many Jars', 'Rot Jar'] },
  dial:    { n: 9,  name: 'Sunwell Dial',     family: 'Spotter',  dmg: 'radiant', paths: ['Searing Sigil', 'Long Sigil', 'Dawn Sigil'] },
  wander:  { n: 10, name: 'Wandering Light',  family: 'Floating', dmg: 'kinetic', paths: ['Hunter', 'Swarm', 'Torchbearer'] },
  shrine:  { n: 11, name: 'Kindred Shrine',   family: 'Emitter',  dmg: 'hearth',  paths: ['Overcharge', 'Twin Tether', 'Kindle'] },
  rot:     { n: 12, name: 'Rot Lantern',      family: 'Lobber',   dmg: 'blight',  paths: ['Deep Rot', 'Spore Bloom', 'Wither'] },
  flare:   { n: 13, name: 'Flarepot',         family: 'Snare',    dmg: 'blast',   paths: ['Great Pot', 'String of Pots', 'Heartfire Pot'] },
};

const CLAY = '#b0603a', GLASS = 'rgba(200,235,255,0.35)', PAPER = '#f6e2a8';
const ring = (ctx, x, y, rx, ry, col, w = 2.4) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.strokeStyle = INK; ctx.lineWidth = w + 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
const line = (ctx, pts, col, w) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = w + 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
const lit = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
// a low ground disc for wards that sit on or beside the path instead of on a hearthstone
function groundMarks(ctx, P, d, w, y = 13) { notches(ctx, P.mt, 0, y, w, DMG[d].core, 2.6); secondaryPips(ctx, P.tiers, P.main, w / 2 + 2, y - 0.5); }

// ---- 1. Snare: a kindling peeking up out of a grate sunk into the road; thorns round the rim. Flat.
function snare(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2, R = 17;
  ctx.beginPath(); ctx.ellipse(0, 6, R + 9, 10, 0, 0, TAU); ctx.fillStyle = 'rgba(214,176,120,0.6)'; ctx.fill();
  const n = might ? 10 + mt * 2 : 10, L = might && mt >= 2 ? 8 : 5.5;
  for (let i = 0; i < n; i++) { const a = Math.PI + (i / n) * TAU, x = Math.cos(a) * R, y = 5 + Math.sin(a) * R * 0.42; poly(ctx, [[x - 2.2, y], [x + 2.2, y], [x + Math.cos(a) * 1.5, y - L]]); flat(ctx, STEEL, 1.2); }
  ctx.beginPath(); ctx.ellipse(0, 5, R, R * 0.42, 0, 0, TAU); ink(ctx, IRON, 2, -R, R);
  ctx.beginPath(); ctx.ellipse(0, 4.5, R - 4, (R - 4) * 0.42, 0, 0, TAU); ctx.fillStyle = '#1e1a2a'; ctx.fill();
  // the kindling's head poking out of the grate (only the top half: eyes and flame)
  ctx.save(); ctx.beginPath(); ctx.rect(-20, -30, 40, 34.5); ctx.clip();
  rrect(ctx, -7, -4, 14, 16, 6); ink(ctx, WAX, 1.8, -7, 7); eyes(ctx, 0, 0.5, st, { sep: 3.2, r: 2.5 }); ctx.restore();
  for (let k = -2; k <= 2; k++) line(ctx, [[k * 5, 4.5 - 4.2 * Math.cos(k * 0.5) + 1.5], [k * 5, 8.5]], '#4b5470', 1.2);
  tuft(ctx, 0, -4, 0.7, d);
  groundMarks(ctx, P, d, 26, 14);
  if (many && mt >= 2) for (let i = 0; i < (mt >= 4 ? 3 : 2); i++) { const x = (i % 2 ? 1 : -1) * (14 + (i >> 1) * 8), y = 12 - (i >> 1) * 13; circle(ctx, x, y, 3.6); flat(ctx, '#55505f', 1.3); circle(ctx, x, y - 3.8, 1.6); flat(ctx, DMG.blast.core, 0.8); }
  if (craft && mt >= 2) lit(ctx, () => { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.8; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 8, 3); ctx.quadraticCurveTo(s * 16, -10, s * 4, -(mt >= 4 ? 24 : 17)); ctx.stroke(); } });
  return -16;
}

// ---- 2. Gate: a round arch; a warden kindling with a spear stands under it, more muster at its feet.
function warden(ctx, x, y, st, d, s, shield, lamp) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line(ctx, [[7, 2], [7, -22]], WOOD, 1.6); poly(ctx, [[7, -27], [9.3, -22], [4.7, -22]]); flat(ctx, STEEL, 1);
  rrect(ctx, -6, -14, 12, 16, 5.5); ink(ctx, WAX, 1.8, -6, 6); eyes(ctx, 0, -8, st, { sep: 2.8, r: 2.3 }); tuft(ctx, 0, -13.5, 0.7, d);
  if (shield) { rrect(ctx, -9, -8, 7, 10, 3); ink(ctx, BRONZE, 1.3, -9, -2); glyph(ctx, 'sun', -5.5, -3, 3, INK); }
  if (lamp) { circle(ctx, -7, -5, 2.6); flat(ctx, DMG[d].core, 1.1); glow(ctx, -7, -5, 8, DMG[d].core, 0.6); }
  ctx.restore();
}
function gate(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 34, P, d);
  const w = might && mt >= 3 ? 6.5 : 5;
  for (const s of [-1, 1]) { rrect(ctx, s * 13 - w / 2, -14, w, 24, 1.5); ink(ctx, '#7d6a58', 1.8, s * 13 - w / 2, s * 13 + w / 2); }
  ctx.beginPath(); ctx.arc(0, -14, 13 + w / 2 + 1, Math.PI, 0); ctx.arc(0, -14, 13 - w / 2 - 1, 0, Math.PI, true); ctx.closePath(); ink(ctx, '#8a7560', 2, -19, 19);
  circle(ctx, 0, -29, 3); flat(ctx, DMG[d].core, 1.2); glow(ctx, 0, -29, 10, DMG[d].core, 0.5);
  warden(ctx, 0, 9, st, d, 1, might && mt >= 2, craft && mt >= 2);
  const n = many ? (mt >= 4 ? 2 : mt >= 2 ? 1 : 0) : 0;
  [-21, 21].slice(0, n).forEach((x) => warden(ctx, x, 12, st, d, 0.66, false, false));
  return -32;
}

// ---- 3. Glass: a kindling holding up a great round lens on a handle; a pale bolt goes in, fire comes out.
function lensAt(ctx, x, y, r, d, rim = IRON) {
  circle(ctx, x, y, r + 2.4); ink(ctx, rim, 2, x - r, x + r);
  circle(ctx, x, y, r); const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#ffb0a0'); g.addColorStop(1, DMG[d].core); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
  glow(ctx, x, y, r * 2.2, DMG[d].core, 0.45);
  glyph(ctx, 'flame', x, y, r * 0.75, DMG[d].deep);
}
function glass(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 26, P, d);
  const r = might ? (mt >= 4 ? 11.5 : mt >= 2 ? 9.5 : 8) : 8, lx = 12, ly = -17;
  line(ctx, [[-14, ly + 2], [lx - r - 3, ly]], '#e9eef6', 1.4);
  lit(ctx, () => { ctx.fillStyle = 'rgba(255,90,40,0.85)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(lx + r + 5 + i * 4, ly - 1 - i, 3.5 - i * 0.8, 2 - i * 0.4, -0.2, 0, TAU); ctx.fill(); } });
  rrect(ctx, -12, -12, 14, 21, 6); ink(ctx, WAX, 2, -12, 2); eyes(ctx, -5, -5, st, { sep: 3.2, r: 2.6 }); tuft(ctx, -5, -12, 0.85, d);
  line(ctx, [[-1, -2], [lx - 2, ly + r]], WOOD, 2.2);
  if (many && mt >= 2) { lensAt(ctx, lx + 3, ly - r - 3, 5, d); if (mt >= 4) lensAt(ctx, lx + r + 3, ly + 9, 5, d); }
  lensAt(ctx, lx, ly, r, d, craft && mt >= 2 ? '#d8b23a' : IRON);
  if (craft && mt >= 4) for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; line(ctx, [[lx + Math.cos(a) * (r + 4), ly + Math.sin(a) * (r + 4)], [lx + Math.cos(a) * (r + 8), ly + Math.sin(a) * (r + 8)]], DMG.radiant.core, 1.4); }
  return ly - r - 4;
}

// ---- 4. Bell: a belfry frame; the bell itself is the kindling (eyes on the bell), mouth glowing violet.
function bellBody(ctx, x, y, s, st, d, face = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-10, 6); ctx.quadraticCurveTo(-9, -12, 0, -13); ctx.quadraticCurveTo(9, -12, 10, 6); ctx.quadraticCurveTo(0, 9, -10, 6); ctx.closePath(); ink(ctx, '#c08a4a', 2, -10, 10);
  ctx.beginPath(); ctx.ellipse(0, 6, 10, 3, 0, 0, TAU); flat(ctx, DMG[d].core, 1.4); glow(ctx, 0, 7, 14, DMG[d].core, 0.5);
  if (face) eyes(ctx, 0, -3, st, { sep: 3.6, r: 2.7 });
  ctx.restore();
}
function bell(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 30, P, d);
  const H = -21;
  for (const s of [-1, 1]) { rrect(ctx, s * 14 - 2.5, H, 5, 31, 1.5); ink(ctx, WOOD, 1.6, s * 14 - 2.5, s * 14 + 2.5); }
  poly(ctx, [[-19, H + 1], [0, H - 9], [19, H + 1], [17, H + 4], [-17, H + 4]]); ink(ctx, '#6a4a6a', 1.8, -19, 19);
  const s = might ? (mt >= 4 ? 1.3 : mt >= 2 ? 1.15 : 1) : 1;
  line(ctx, [[0, H + 4], [0, H + 9]], '#3a3040', 1.2);
  bellBody(ctx, 0, H + 18 * s, s, st, d);
  tuft(ctx, 0, H - 8, 0.8, d);
  if (many && mt >= 2) for (const x of mt >= 4 ? [-9, 9] : [9]) { line(ctx, [[x, H + 4], [x, H + 8]], '#3a3040', 1); bellBody(ctx, x, H + 13, 0.42, st, d, false); }
  const rings = craft ? (mt >= 4 ? 3 : mt >= 2 ? 2 : 1) : 1;
  lit(ctx, () => { for (let i = 0; i < rings; i++) { ctx.beginPath(); ctx.ellipse(0, 8, 20 + i * 6, 6 + i * 2, 0, 0.1, Math.PI - 0.1); ctx.strokeStyle = `rgba(190,130,255,${0.75 - i * 0.18})`; ctx.lineWidth = 1.6; ctx.stroke(); } });
  if (craft && mt >= 2) { circle(ctx, 0, H + 18 * s + 2, 2.2); flat(ctx, '#fff', 1); }
  return H - 9;
}

// ---- 5. Vault: a squat chest-kindling; the lid is its hat, eyes peek out under it, coin slot on top.
function vault(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 32, P, d);
  const w = might ? (mt >= 4 ? 30 : mt >= 2 ? 27 : 24) : 24;
  rrect(ctx, -w / 2, -8, w, 18, 3); ink(ctx, '#8a5a3a', 2, -w / 2, w / 2);
  if (might && mt >= 2) for (const x of [-w / 2 + 4, w / 2 - 4]) { rrect(ctx, x - 1.5, -8, 3, 18, 1); flat(ctx, BRONZE, 1); }
  eyes(ctx, 0, -2, st, { sep: 4.4, r: 3 }); badge(ctx, 0, 6, 3, d);
  ctx.beginPath(); ctx.moveTo(-w / 2 - 2, -8); ctx.quadraticCurveTo(0, -20, w / 2 + 2, -8); ctx.closePath(); ink(ctx, '#a06a40', 2, -w / 2, w / 2);
  rrect(ctx, -4, -16, 8, 2.2, 1); flat(ctx, INK, 0);
  tuft(ctx, 0, -16, 0.7, d);
  if (many && mt >= 2) for (let i = 0; i < (mt >= 4 ? 3 : 2); i++) for (let k = 0; k <= i; k++) { ctx.beginPath(); ctx.ellipse(-w / 2 - 6 + i * 0, 9 - k * 2.6 - i * 0, 4, 1.6, 0, 0, TAU); flat(ctx, '#ffcf4a', 1); }
  if (many && mt >= 4) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(w / 2 + 6, 9 - k * 2.6, 4, 1.6, 0, 0, TAU); flat(ctx, '#ffcf4a', 1); }
  if (craft && mt >= 2) { glyph(ctx, 'heart', 0, -24, mt >= 4 ? 6 : 4.5, DMG[d].core); glow(ctx, 0, -24, 14, DMG[d].core, 0.5); }
  return craft && mt >= 2 ? -30 : -22;
}

// ---- 6. Moth Lantern: a kindling holds a tall shepherd's crook; a paper lantern hangs from the hook.
function moth(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 26, P, d);
  ctx.beginPath(); ctx.moveTo(-2, 8); ctx.lineTo(-2, -24); ctx.arc(5, -24, 7, Math.PI, 0); ctx.lineTo(12, -19);
  ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = WOOD; ctx.lineWidth = 2.2; ctx.stroke();
  rrect(ctx, -11, -10, 13, 19, 5.5); ink(ctx, WAX, 2, -11, 2); eyes(ctx, -4.5, -4, st, { sep: 3, r: 2.5 }); tuft(ctx, -4.5, -10, 0.75, d);
  const r = might ? (mt >= 4 ? 8 : mt >= 2 ? 6.8 : 5.5) : 5.5, cy = -19 + r + 1;
  glow(ctx, 12, cy, r * 3.4, DMG[d].core, 0.55);
  ctx.beginPath(); ctx.ellipse(12, cy, r, r * 1.2, 0, 0, TAU); ink(ctx, PAPER, 1.6, 12 - r, 12 + r);
  for (const k of [-0.5, 0.5]) { ctx.beginPath(); ctx.ellipse(12, cy, r * Math.abs(k) * 1.2, r * 1.2, 0, 0, TAU); ctx.strokeStyle = 'rgba(160,110,40,0.7)'; ctx.lineWidth = 0.8; ctx.stroke(); }
  glyph(ctx, 'sun', 12, cy, r * 0.8, DMG[d].deep);
  const moths = many ? (mt >= 4 ? 6 : mt >= 2 ? 4 : 2) : 2;
  for (let i = 0; i < moths; i++) { const a = i * 2.4 + 0.6, mx = 12 + Math.cos(a) * (r + 7), my = cy + Math.sin(a) * (r + 5);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(mx + s * 1.8, my, 2.2, 1.4, s * 0.5, 0, TAU); flat(ctx, '#efe6d0', 0.7); } }
  if (many && mt >= 2) lit(ctx, () => { ctx.strokeStyle = 'rgba(255,240,180,0.5)'; ctx.lineWidth = 0.8; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(12, cy + r); ctx.lineTo(4 + i * 6, cy + r + 10); ctx.stroke(); } });
  if (craft && mt >= 2) lit(ctx, () => { ctx.strokeStyle = 'rgba(255,224,58,0.75)'; ctx.lineWidth = 1.5; for (let i = 0; i < (mt >= 4 ? 8 : 5); i++) { const a = (i / (mt >= 4 ? 8 : 5)) * TAU; ctx.beginPath(); ctx.moveTo(12 + Math.cos(a) * (r + 3), cy + Math.sin(a) * (r + 3)); ctx.lineTo(12 + Math.cos(a) * (r + 7), cy + Math.sin(a) * (r + 7)); ctx.stroke(); } });
  return -33;
}

// ---- 7. Vigil Candles: short, fat candle-kindlings on a low stand. Flames, not balls (vs the Coil).
function candle(ctx, x, y, h, w, st, d, face = true) {
  rrect(ctx, x - w / 2, y - h, w, h, w * 0.35); ink(ctx, '#f6ead2', 1.6, x - w / 2, x + w / 2);
  ctx.beginPath(); ctx.moveTo(x - w / 2 + 1, y - h + 2); ctx.quadraticCurveTo(x - w / 2 - 0.5, y - h + 6, x - w / 2 + 1.5, y - h + 7); ctx.strokeStyle = '#e2d2b0'; ctx.lineWidth = 1.4; ctx.stroke();
  if (face) eyes(ctx, x, y - h + 6, st, { sep: w * 0.22, r: Math.min(2.4, w * 0.18) });
  tuft(ctx, x, y - h, 0.62 * Math.min(1.3, w / 10), d);
}
function candles(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 30, P, d);
  ctx.beginPath(); ctx.ellipse(0, 7, 15, 4, 0, 0, TAU); ink(ctx, BRONZE, 1.6, -15, 15);
  if (might && mt >= 2) { candle(ctx, -9, 6, 9, 8, st, d, false); candle(ctx, 0, 7, mt >= 4 ? 24 : 19, 12, st, d); candle(ctx, 9, 6, 9, 8, st, d, false); }
  else if (many && mt >= 2) { const xs = mt >= 4 ? [-12, -4, 4, 12] : [-10, 0, 10]; xs.forEach((x, i) => candle(ctx, x, 6 + (i % 2), 11 + (i % 2) * 2, 8.5, st, d, i === 1 || (xs.length === 3 && i === 1))); line(ctx, [[xs[0], -1], [xs[xs.length - 1], -1]], BRONZE, 1.4); }
  else { candle(ctx, -8, 6, 11, 9.5, st, d, false); candle(ctx, 2, 7, 14, 11, st, d); candle(ctx, 10, 6, 9, 8.5, st, d, false); }
  if (craft && mt >= 2) for (const x of [-13, 13]) { ctx.beginPath(); ctx.moveTo(x - 4, 9); ctx.lineTo(x - 3, 3); ctx.lineTo(x + 3, 3); ctx.lineTo(x + 4, 9); ctx.closePath(); ink(ctx, '#c04a7a', 1.3, x - 4, x + 4); circle(ctx, x, 1, 1.8); flat(ctx, DMG[d].core, 0.8); glow(ctx, x, 1, 7, DMG[d].core, 0.6); }
  // the boost: little rose sparks reaching out to neighbours
  lit(ctx, () => { ctx.fillStyle = 'rgba(255,126,182,0.75)'; for (const [x, y] of [[-20, 0], [20, 0], [-17, -9], [17, -9]]) { circle(ctx, x, y, 1.3); ctx.fill(); } });
  return might && mt >= 4 ? -30 : -24;
}

// ---- 8. Gloom Jar: a kindling sealed in a corked glass jar, green Blight swirling round it. Low.
function jarAt(ctx, x, y, s, st, d, cracked = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -10, -18, 20, 26, 6); ctx.fillStyle = 'rgba(40,70,50,0.55)'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 2, 9, 5, 0, 0, TAU); ctx.fillStyle = 'rgba(95,211,90,0.6)'; ctx.fill();
  rrect(ctx, -6, -11, 12, 14, 5); ink(ctx, WAX, 1.6, -6, 6); eyes(ctx, 0, -6, st, { sep: 2.7, r: 2.2 });
  lit(ctx, () => { ctx.strokeStyle = 'rgba(95,211,90,0.9)'; ctx.lineWidth = 1.6; ctx.beginPath(); for (let t = 0; t < 1; t += 0.05) { const a = t * TAU * 1.6, r = 8 - t * 3; ctx.lineTo(Math.cos(a) * r, -4 + Math.sin(a) * r * 0.5 - t * 8); } ctx.stroke(); });
  rrect(ctx, -10, -18, 20, 26, 6); ctx.fillStyle = GLASS; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6.5, -14); ctx.lineTo(-6.5, 2); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.6; ctx.stroke();
  rrect(ctx, -5.5, -24, 11, 6.5, 2); ink(ctx, '#b88a5a', 1.6, -5.5, 5.5);
  if (cracked) line(ctx, [[3, -16], [6, -10], [3, -6], [7, 0]], '#d8ffd0', 0.8);
  ctx.restore();
}
function jar(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 28, P, d);
  if (many && mt >= 2) { jarAt(ctx, -10, 8, 0.6, st, d); jarAt(ctx, 10, 8, 0.6, st, d); if (mt >= 4) jarAt(ctx, 0, 11, 0.6, st, d); if (mt < 4) jarAt(ctx, 0, 4, 0.66, st, d); tuft(ctx, 0, -14, 0.6, d); return -24; }
  const s = might ? (mt >= 4 ? 1.25 : mt >= 2 ? 1.12 : 1) : 1;
  jarAt(ctx, 0, 6, s, st, d, craft && mt >= 2);
  if (craft && mt >= 2) lit(ctx, () => { ctx.fillStyle = 'rgba(95,211,90,0.35)'; for (let i = 0; i < (mt >= 4 ? 5 : 3); i++) { circle(ctx, 9 + i * 3, -10 - i * 5, 3 + i); ctx.fill(); } });
  tuft(ctx, 0, 6 - 24 * s, 0.6, d);
  return 6 - 30 * s;
}

// ---- 9. Sunwell Dial: a kindling at the foot of a sundial obelisk; the gnomon throws a gold line.
function dial(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 30, P, d);
  const L = many ? (mt >= 4 ? 36 : mt >= 2 ? 30 : 22) : 22, wd = might ? (mt >= 4 ? 4 : mt >= 2 ? 3 : 2) : 2;
  lit(ctx, () => { ctx.strokeStyle = 'rgba(255,224,58,0.9)'; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(5, 9); ctx.lineTo(5 + L, 13); ctx.stroke(); });
  poly(ctx, [[-2, 9], [-1, -30], [3, -34], [7, -30], [8, 9]]); ink(ctx, '#b8b2a0', 1.8, -2, 8);
  poly(ctx, [[3, -22], [15, -12], [3, -12]]); flat(ctx, BRONZE, 1.3);
  circle(ctx, 3, -28, 3.2); flat(ctx, DMG[d].core, 1.2); glow(ctx, 3, -28, 12, DMG[d].core, 0.5);
  if (craft && mt >= 2) { circle(ctx, 3, -28, mt >= 4 ? 9 : 7); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = DMG[d].core; ctx.lineWidth = 1.8; ctx.stroke(); }
  rrect(ctx, -16, -8, 13, 17, 5.5); ink(ctx, WAX, 2, -16, -3); eyes(ctx, -9.5, -2, st, { sep: 3, r: 2.5 }); tuft(ctx, -9.5, -8, 0.75, d);
  if (might && mt >= 4) for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; line(ctx, [[3 + Math.cos(a) * 6, -28 + Math.sin(a) * 6], [3 + Math.cos(a) * 9.5, -28 + Math.sin(a) * 9.5]], DMG[d].core, 1.3); }
  return -36;
}

// ---- 10. Wandering Light: a winged kindling hovering over a soft shadow. No hearthstone at all.
function wander(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  ctx.save(); ctx.fillStyle = 'rgba(8,40,34,0.35)'; ctx.beginPath(); ctx.ellipse(0, 11, 10, 3.2, 0, 0, TAU); ctx.fill(); ctx.restore();
  groundMarks(ctx, P, d, 22, 15);
  const flyer = (x, y, s) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(k * 10, -9, 7, 3.5, k * -0.5, 0, TAU); ctx.fillStyle = 'rgba(240,240,255,0.75)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -6, 7.5, 8.5, 0, 0, TAU); ink(ctx, WAX, 2, -7.5, 7.5); eyes(ctx, 0, -7, st, { sep: 3, r: 2.5 }); tuft(ctx, 0, -14, 0.75, d);
    ctx.restore(); };
  if (craft && mt >= 2) { glow(ctx, 0, -10, mt >= 4 ? 30 : 22, DMG.hearth.core, 0.35); ring(ctx, 0, -2, mt >= 4 ? 19 : 15, 5, '#ff9ec8', 1.4); }
  if (many && mt >= 2) { flyer(-12, -8, 0.6); flyer(12, -10, 0.6); if (mt >= 4) flyer(0, -26, 0.6); }
  else { flyer(0, -6, 1); crossbow(ctx, 5, -3, st, might ? (mt >= 4 ? 1.45 : mt >= 2 ? 1.2 : 0.85) : 0.85, might && mt >= 3); }
  return many && mt >= 4 ? -40 : -24;
}

// ---- 11. Kindred Shrine: a little gabled shrine with a kindling inside; a thread of light to its partner.
function shrine(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 30, P, d);
  const threads = many && mt >= 2 ? [[24, -26], [-24, -18]] : [[24, -26]], tw = might ? (mt >= 4 ? 3.2 : mt >= 2 ? 2.4 : 1.6) : 1.6;
  lit(ctx, () => { for (const [x, y] of threads) { ctx.strokeStyle = 'rgba(255,126,182,0.9)'; ctx.lineWidth = tw; ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(x * 0.5, y - 8, x, y); ctx.stroke(); ctx.fillStyle = '#ffd0e6'; circle(ctx, x, y, tw + 1); ctx.fill(); } });
  for (const s of [-1, 1]) { rrect(ctx, s * 11 - 2, -12, 4, 21, 1); ink(ctx, '#7a3a3a', 1.4, s * 11 - 2, s * 11 + 2); }
  rrect(ctx, -9, -12, 18, 21, 2); ctx.fillStyle = '#2a1e2e'; ctx.fill();
  rrect(ctx, -6, -6, 12, 15, 5); ink(ctx, WAX, 1.8, -6, 6); eyes(ctx, 0, -1, st, { sep: 2.8, r: 2.3 });
  poly(ctx, [[-17, -11], [0, -24], [17, -11], [13, -9], [-13, -9]]); ink(ctx, '#8a3a4a', 1.8, -17, 17);
  tuft(ctx, 0, -6, 0.65, d);
  badge(ctx, 0, -16, 2.8, d);
  if (craft && mt >= 2) { for (let i = 0; i < (mt >= 4 ? 3 : 2); i++) { const x = -16 + i * 3; rrect(ctx, x - 1.2, 2 - i * 1.5, 2.4, 7 + i * 1.5, 1); flat(ctx, '#f6ead2', 0.8); circle(ctx, x, 0 - i * 1.5, 1.4); flat(ctx, DMG[d].core, 0.6); } }
  return -28;
}

// ---- 12. Rot Lantern: a squat crooked pot-kindling with a dripping spout, lobbing green motes.
function rot(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  hearthstone(ctx, 30, P, d);
  const A = aim(st), s = might ? (mt >= 4 ? 1.2 : mt >= 2 ? 1.1 : 1) : 1;
  ctx.save(); ctx.scale(s, s);
  ctx.save(); ctx.translate(8, -8); ctx.rotate(A.a * 0.4 - 0.6); rrect(ctx, 0, -3, 11, 6, 2.5); ink(ctx, '#4e6a3e', 1.6, 0, 11);
  circle(ctx, 13, 0, 2); flat(ctx, DMG[d].core, 1); ctx.restore();
  ctx.beginPath(); ctx.moveTo(-12, 8); ctx.quadraticCurveTo(-16, -6, -8, -11); ctx.lineTo(8, -12); ctx.quadraticCurveTo(15, -6, 12, 8); ctx.closePath(); ink(ctx, '#5e7a4a', 2.2, -14, 14);
  ctx.beginPath(); ctx.ellipse(0, -11, 8.5, 2.6, -0.08, 0, TAU); flat(ctx, '#1d2a18', 1.4);
  eyes(ctx, -1, -3, st, { sep: 4, r: 2.8 }); glyph(ctx, 'drip', -1, 4, 3.5, DMG[d].core);
  for (const x of [-9, 6]) { ctx.beginPath(); ctx.moveTo(x, 7); ctx.quadraticCurveTo(x - 1.5, 11, x, 12); ctx.quadraticCurveTo(x + 1.5, 11, x, 7); flat(ctx, DMG[d].core, 0.8); }
  tuft(ctx, -1, -12, 0.85, d, -2);
  ctx.restore();
  if (many && mt >= 2) lit(ctx, () => { for (let i = 0; i < (mt >= 4 ? 7 : 4); i++) { const a = i * 1.9, r = 13 + (i % 3) * 4; ctx.fillStyle = 'rgba(95,211,90,0.55)'; circle(ctx, Math.cos(a) * r, -6 + Math.sin(a) * r * 0.6, 2 + (i % 2)); ctx.fill(); } });
  if (craft && mt >= 2) for (const sgn of [-1, 1]) line(ctx, [[sgn * 10, 8], [sgn * 15, 0], [sgn * 13, -8], [sgn * 17, mt >= 4 ? -18 : -12]], '#6b5a3a', 1.4);
  circle(ctx, 22, -24, 2.6); flat(ctx, DMG[d].core, 1); glow(ctx, 22, -24, 8, DMG[d].core, 0.6);
  return -26 * s;
}

// ---- 13. Flarepot: a small clay pot-kindling with a lit wick. The lowest ward; no grate, no thorns.
function potAt(ctx, x, y, s, st, d, face = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-6, -9); ctx.quadraticCurveTo(-13, -4, -9, 6); ctx.quadraticCurveTo(0, 10, 9, 6); ctx.quadraticCurveTo(13, -4, 6, -9); ctx.closePath(); ink(ctx, CLAY, 2, -11, 11);
  rrect(ctx, -6.5, -11, 13, 3.5, 1.5); ink(ctx, '#8a4a2a', 1.4, -6.5, 6.5);
  if (face) eyes(ctx, 0, -2, st, { sep: 3.4, r: 2.5 });
  line(ctx, [[0, -11], [2, -15], [1, -18]], '#e8d6b0', 1);
  circle(ctx, 1, -19.5, 2.2); flat(ctx, DMG[d].core, 0.9); glow(ctx, 1, -19.5, 7, DMG[d].core, 0.7);
  ctx.restore();
}
function flare(ctx, P, st, d) {
  const { main, mt } = P, might = main === 0, many = main === 1, craft = main === 2;
  ctx.beginPath(); ctx.ellipse(0, 9, 18, 5, 0, 0, TAU); ink(ctx, '#5a5f78', 1.6, -18, 18);
  groundMarks(ctx, P, d, 22, 14.5);
  if (craft && mt >= 2) { ring(ctx, 0, 8, 15, 4, DMG.hearth.core, 1.4); if (mt >= 4) glow(ctx, 0, 0, 22, DMG.hearth.core, 0.35); }
  if (many && mt >= 2) { const xs = mt >= 4 ? [-13, 0, 13] : [-8, 8]; line(ctx, xs.map((x) => [x, 4]), '#e8d6b0', 0.8); xs.forEach((x, i) => potAt(ctx, x, 9, 0.7, st, d, i === (xs.length >> 1))); return -10; }
  const s = might ? (mt >= 4 ? 1.35 : mt >= 2 ? 1.15 : 1) : 1;
  potAt(ctx, 0, 8, s, st, d);
  badge(ctx, 0, 8 + 4 * s, 2.4 * s, d);
  if (might && mt >= 3) for (const x of [-7, 7]) { rrect(ctx, x * s - 1.2, 8 - 6 * s, 2.4, 10 * s, 1); flat(ctx, IRON, 0.8); }
  return 8 - 22 * s;
}

const ART = { snare, gate, glass, bell, vault, moth, candles, jar, dial, wander, shrine, rot, flare };

export function draw(ctx, type, tiers, st) {
  const P = { ...mainPath(tiers), tiers };
  const d = IDEAS[type].dmg;
  const s = 0.95 + P.lvl * 0.035 + (P.mt >= 4 ? 0.08 : 0);
  ctx.save();
  ctx.translate(0, 12);
  if (type !== 'wander' && type !== 'snare') shadow(ctx, 15 * s);
  ctx.translate(0, 14); ctx.scale(s, s); ctx.translate(0, -14);
  if (P.mt >= 4) glow(ctx, 0, -8, 32, DMG[d].glow ? DMG[d].core : '#ffffff', 0.28);
  const top = ART[type](ctx, P, st, d);
  if (P.mt >= 4) crown(ctx, 0, top + 1, d);
  ctx.restore();
}
