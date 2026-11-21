// Tier 5: the second form. Every ward's tier 5 is drawn here, for BOTH skins (each skin passes its
// own materials, SKIN5 below), on top of that skin's tier 4 form:
//   - a ground sigil in the ward's damage colour, brighter than the tier 4 aura (live, back);
//   - the path's second form: a companion, a summoned shape or a great apparatus beside or behind
//     the ward (static parts in the cached body, `behind`; moving parts live, `back`). Nothing big
//     is ever drawn in front of the body: the body-and-face rule holds (tools/wards.mjs checks it);
//   - a floating five-point diadem with a white-hot core, the only pure white on an idle ward (the
//     channel the visual system kept back for tier 5), drawn last, above the head.
// See docs/tier5-design.md for what each form is, and docs/upgrade-visuals-research.md 2.5.
import { TAU, INK, DMG, circle, poly, rrect, star, ink, flat, line, glow, rgba, shade, twinkle, risingMotes, DETAIL, FACE, newCanvas } from './kit.js';
import { GOLD, IRON, IRON2, BRASS, COPPER, cloud, zap, orb, iceCrystal, iceBlade, snowCloud, sunDisc, shard, drum, pennant, coins, chest, moths, crescent, heartGrill, emberWisp, torchFlame, runeCircle, chainRing, briar, lampSeed, beam as lightBeam, smokePuffs, lavaCracks, warhorn, tube } from './parts.js';
import { STEEL, SILVER, hawk, mark, banner, crossbowX } from './bolt-parts.js';

// Materials per skin: Kindlings are wax, wood and bronze; Lanterns iron, brass and smoked glass.
export const SKIN5 = {
  kindling: { metal: '#c8963a', metal2: '#8a5a32', dark: '#5a3a22', trim: GOLD, cloth: '#3f7a34', glass: '#fff1c8' },
  lantern: { metal: '#5a6478', metal2: '#3a4160', dark: '#262a3a', trim: '#e0b84a', cloth: '#3a2a58', glass: '#d8e8ff' },
};
const WHITE = '#ffffff', PALE = '#fff8e0';

// ---- shared pieces ------------------------------------------------------------------------------
// The tier 5 ground sigil: two rings and five turning points in the damage colour, flat on the ground.
function sigil5(ctx, d, t, R = 27) {
  const D = DMG[d], col = D.glow ? D.core : '#ffffff';
  glow(ctx, 0, 11, R * 1.6, col, 0.42 + Math.sin(t * 2.6) * 0.08);
  if (DETAIL.q < 1) return;
  ctx.save(); ctx.translate(0, 11); ctx.scale(1, 0.38);
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = 2.2;
  circle(ctx, 0, 0, R); ctx.stroke();
  ctx.strokeStyle = rgba('#ffffff', 0.5); ctx.lineWidth = 1.2;
  circle(ctx, 0, 0, R * 0.78); ctx.stroke();
  ctx.rotate(t * 0.5);
  ctx.fillStyle = rgba('#ffffff', 0.9);
  for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); star(ctx, R * 0.89, 0, 3.6, 1.4, 4, 0); ctx.fill(); }
  ctx.restore();
}
// The diadem: a small five-point star crown floating over the head, white-hot at the core.
function diadem(ctx, x, y, d, t, k = 1) {
  const D = DMG[d], col = D.glow ? D.core : '#dfe8ff';
  const by = y + Math.sin(t * 2) * 0.8;
  glow(ctx, x, by, 9 * k, col, 0.55);
  star(ctx, x, by, 5.2 * k, 2.3 * k, 5); flat(ctx, GOLD, 1.1);
  star(ctx, x, by, 2.6 * k, 1.2 * k, 5); ctx.fillStyle = WHITE; ctx.fill();
  glow(ctx, x, by, 4 * k, WHITE, 0.8);
  twinkle(ctx, x + 3.5 * k, by - 3.5 * k, 2.4 * k, Math.sin(t * 3.1) * 1.4 - 0.2);
}
// Feathered wings spread behind the ward (spirit-hawk, phoenix, moth queen), live: they beat slowly.
function wings(ctx, x, y, span, h, fill, edge, t, beat = 1, feathers = 5) {
  const f = Math.sin(t * 2.2 * beat) * 0.12;
  for (const k of [-1, 1]) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, 1); ctx.rotate(-f);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(span * 0.35, -h * 1.15, span, -h);
    for (let i = 0; i < feathers; i++) { const u = (i + 1) / feathers; ctx.lineTo(span * (1 - u * 0.75), -h + h * 0.9 * u + 4); ctx.lineTo(span * (1 - u * 0.75) - 2.5, -h + h * 0.9 * u); }
    ctx.quadraticCurveTo(span * 0.2, h * 0.1, 0, 3);
    ctx.closePath();
    flat(ctx, fill, 1.4);
    ctx.beginPath(); ctx.moveTo(2, -1); ctx.quadraticCurveTo(span * 0.35, -h * 1.0, span * 0.95, -h + 1);
    ctx.strokeStyle = edge; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }
}
// n things orbiting on a tilted ring at height y (draw fn(x, y, i, depth)); `half` picks the back
// (-1) or front (+1) half so the ring can pass behind and in front of something.
function orbit(n, cx, cy, rx, ry, t, speed, half, fn) {
  for (let i = 0; i < n; i++) {
    const a = t * speed + (i / n) * TAU, s = Math.sin(a);
    if (half && (s >= 0) !== (half > 0)) continue;
    fn(cx + Math.cos(a) * rx, cy + s * ry, i, s);
  }
}

// A six-armed snowflake (live).
function snowflake(ctx, x, y, r, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.8);
  ctx.strokeStyle = INK; ctx.lineWidth = r * 0.5 + 1.4; ctx.lineCap = 'round';
  ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(-Math.cos(a) * r, -Math.sin(a) * r); } ctx.stroke();
  ctx.strokeStyle = '#f0fcff'; ctx.lineWidth = r * 0.5; ctx.stroke();
  ctx.lineCap = 'butt'; ctx.restore();
}
// A tumbling snow-crusted ice boulder (live).
function boulder(ctx, x, y, r, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 1.3);
  poly(ctx, [[-r, 0], [-r * 0.5, -r * 0.9], [r * 0.6, -r * 0.8], [r, 0.1 * r], [r * 0.4, r * 0.9], [-r * 0.6, r * 0.8]]); flat(ctx, '#bfe8f8', 1.2);
  poly(ctx, [[-r * 0.5, -r * 0.9], [r * 0.6, -r * 0.8], [r * 0.2, -r * 0.2]]); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
}

// ---- the forms --------------------------------------------------------------------------------------
// FORMS[type][path] = { behind(ctx, d, S) static, under the body; back(ctx, st, d, S) live, behind;
// front(ctx, st, d, S) live, small things beside or above the body only }.
const FORMS = {
  bolt: [
    { // Worldpiercer: a towering siege gantry behind the archer, a colossal glowing lance across its top
      behind(ctx, d, S) {
        for (const k of [-1, 1]) {
          line(ctx, [[k * 30, 13], [k * 20, -18], [k * 9, -44]], S.metal2, 4.2);
          line(ctx, [[k * 30, 13], [k * 12, 2]], S.metal2, 2.4);
          line(ctx, [[k * 20, -18], [0, -18]], S.metal2, 2.2);
          circle(ctx, k * 20, -18, 4.2); flat(ctx, S.metal, 1.2); circle(ctx, k * 20, -18, 1.6); flat(ctx, S.trim, 0.8);
          poly(ctx, [[k * 35, 13], [k * 25, 13], [k * 30, 6]]); flat(ctx, S.metal, 1.1);
        }
        rrect(ctx, -12, -49, 24, 7, 2.5); ink(ctx, S.metal, 1.5, -12, 12);
        for (const x of [-8, 0, 8]) { circle(ctx, x, -45.5, 1.2); ctx.fillStyle = S.trim; ctx.fill(); }
      },
      back(ctx, st, d, S) {
        for (const k of [-1, 1]) { ctx.save(); ctx.translate(k * 20, -18); ctx.rotate(st.time * 1.5 * k); for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); line(ctx, [[0, 0], [5.5, 0]], S.metal2, 1.3); } ctx.restore(); }
        const L = 36, cy = -52;
        ctx.save(); ctx.translate(0, cy); ctx.rotate(-0.08);
        glow(ctx, L - 2, 0, 16, WHITE, 0.45 + Math.sin(st.time * 4) * 0.15);
        rrect(ctx, -L, -2.6, L * 2, 5.2, 2.4); flat(ctx, S.dark, 1.3);
        rrect(ctx, -L + 6, -1.2, L * 2 - 14, 2.4, 1); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
        poly(ctx, [[L, -6], [L + 12, 0], [L, 6]]); flat(ctx, STEEL, 1.3);
        poly(ctx, [[L + 2, -2.4], [L + 9, 0], [L + 2, 2.4]]); ctx.fillStyle = WHITE; ctx.fill();
        poly(ctx, [[-L, -5], [-L - 8, -8], [-L - 5, 0], [-L - 8, 8], [-L, 5]]); flat(ctx, SILVER, 1.1);
        ctx.restore();
        risingMotes(ctx, st.time, 5, 18, 46, cy + 2, 10, '#ffffff', 1.6, 0.9, st.id || 0);
      },
    },
    { // Thousand Bolts: a great double wheel of crossbows turning behind the archer
      back(ctx, st, d, S) {
        const cy = -22;
        glow(ctx, 0, cy, 36, '#e9eef6', 0.22);
        ctx.save(); ctx.translate(0, cy);
        circle(ctx, 0, 0, 31); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = S.metal; ctx.lineWidth = 3; ctx.stroke();
        circle(ctx, 0, 0, 20); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = S.metal2; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.save(); ctx.rotate(st.time * 1.2);
        for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); line(ctx, [[20, 0], [31, 0]], S.metal2, 1.4); line(ctx, [[31, 0], [37, 0]], '#7a5236', 1.2); poly(ctx, [[37, -2.6], [42, 0], [37, 2.6]]); flat(ctx, SILVER, 0.9); }
        ctx.restore();
        ctx.save(); ctx.rotate(-st.time * 2);
        for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); crossbowX(ctx, 26, 0, 0, 0.6, {}); }
        ctx.restore();
        ctx.restore();
      },
    },
    { // Wild Hunt: the great spirit-hawk, wings spread wide behind the hunter, eyes white
      back(ctx, st, d, S) {
        glow(ctx, 0, -28, 44, '#bfe0ff', 0.3);
        wings(ctx, 0, -18, 48, 30, 'rgba(206,230,255,0.92)', WHITE, st.time, 0.9, 7);
        wings(ctx, 0, -14, 36, 20, 'rgba(170,205,245,0.85)', '#e8f4ff', st.time + 0.3, 0.9, 5);
        hawk(ctx, 0, -42, 2.1, st.time, false);
        if (!FACE.skip) glow(ctx, 2, -51.5, 4, WHITE, 0.95);
        orbit(3, 0, -30, 40, 10, st.time, 0.8, 0, (x, y, i) => mark(ctx, x, y, 3.4, st.time + i, 0.9));
      },
    },
  ],
  mortar: [
    { // Worldbreaker: a mountain of rock hangs over the kiln, glowing through its cracks, rubble circling
      back(ctx, st, d, S) {
        const y = -40 + Math.sin(st.time * 1.3) * 1.5;
        glow(ctx, 0, y, 34, '#ff9a1f', 0.45);
        poly(ctx, [[-24, y + 6], [-19, y - 9], [-6, y - 17], [9, y - 15], [22, y - 4], [17, y + 10], [2, y + 13], [-14, y + 12]]); ink(ctx, '#6a5a52', 2, -24, 24);
        poly(ctx, [[-14, y - 4], [-6, y - 12], [6, y - 10], [2, y - 2]]); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
        lavaCracks(ctx, [[[-16, y], [-6, y + 4], [3, y - 6], [12, y - 2]], [[6, y + 8], [14, y + 1]], [[-10, y - 9], [-4, y - 3]]], '#ffb347', 1.6);
        glow(ctx, -4, y + 2, 10, '#ffd27a', 0.6);
        orbit(7, 0, y + 4, 34, 9, st.time, 0.9, 0, (x, yy, i) => { poly(ctx, [[x - 3.5, yy], [x, yy - 3.6], [x + 3.5, yy - 0.6], [x + 1.4, yy + 2.8]]); flat(ctx, '#7a6a60', 1); });
        for (let i = 0; i < 3; i++) { const u = (st.time * 0.7 + i / 3) % 1; circle(ctx, -10 + i * 10, y + 13 + u * 30, 1.8 * (1 - u)); ctx.fillStyle = '#9a8a80'; ctx.fill(); }
      },
    },
    { // Grand Battery: a fan of four great guns rising behind the kiln, smoking
      behind(ctx, d, S) {
        for (const [x, lean] of [[-22, -0.45], [-8, -0.15], [8, 0.15], [22, 0.45]]) {
          tube(ctx, x, 6, lean, 9, 34, { fill: S.metal, bands: 3, gold: true });
          circle(ctx, x, 9, 5); flat(ctx, S.metal2, 1.3); circle(ctx, x, 9, 1.8); flat(ctx, S.trim, 0.8);
        }
      },
      back(ctx, st, d, S) {
        pennant(ctx, 0, -14, -52, '#ff9a1f', st.time);
        for (const [x, lean] of [[-22, -0.45], [-8, -0.15], [8, 0.15], [22, 0.45]]) {
          const tx = x + Math.sin(lean) * 34, ty = 6 - Math.cos(lean) * 34;
          glow(ctx, tx, ty, 6, '#ffcf8a', 0.4 + Math.sin(st.time * 5 + x) * 0.2);
          smokePuffs(ctx, tx, ty - 3, DETAIL.q >= 2 ? 2 : 1, st.time + x, 0.5);
        }
      },
    },
    { // Magma Heart: a volcano of magma erupting behind the kiln, a lake of fire round its foot
      back(ctx, st, d, S) {
        ctx.save(); ctx.translate(0, 11); ctx.scale(1, 0.36);
        glow(ctx, 0, 0, 52, '#ff5a1a', 0.5);
        circle(ctx, 0, 0, 40); ctx.strokeStyle = 'rgba(255,120,30,0.9)'; ctx.lineWidth = 7; ctx.stroke();
        ctx.restore();
        poly(ctx, [[-34, 12], [-12, -28], [12, -28], [34, 12]]); ink(ctx, '#4a2a22', 2, -34, 34);
        poly(ctx, [[-12, -28], [-6, -14], [0, -24], [6, -12], [12, -28]]); flat(ctx, '#ff7a2a', 1.4);
        lavaCracks(ctx, [[[-20, 4], [-12, -10], [-8, -20]], [[22, 6], [14, -8]]], '#ffb347', 1.8);
        const h = 18 + Math.sin(st.time * 6) * 4;
        glow(ctx, 0, -32 - h * 0.4, 22, '#ff5a1a', 0.7);
        ctx.beginPath(); ctx.moveTo(-8, -28); ctx.quadraticCurveTo(-4, -28 - h, 0, -30 - h * 1.1); ctx.quadraticCurveTo(4, -28 - h, 8, -28); ctx.closePath(); flat(ctx, '#ff9a3a', 1.3);
        for (let i = 0; i < 5; i++) { const u = (st.time * 0.9 + i / 5) % 1, a = -Math.PI / 2 + (i - 2) * 0.5; circle(ctx, Math.cos(a) * u * 30, -32 - h + Math.sin(a) * u * 20 + u * u * 40, 2.4 * (1 - u * 0.5)); ctx.fillStyle = i % 2 ? '#ffd27a' : '#ff7a2a'; ctx.fill(); }
      },
    },
  ],
  rime: [
    { // Permafrost: a great ice cathedral of jagged spires rising behind the spire, glowing from inside
      spires(ctx) {
        for (const [x, w, h, l] of [[-34, 9, 30, -0.4], [-24, 11, 46, -0.22], [-12, 12, 58, -0.08], [12, 12, 58, 0.08], [24, 11, 46, 0.22], [34, 9, 30, 0.4], [0, 14, 66, 0]]) iceCrystal(ctx, x, 13, w, h, l);
        for (const [x, y] of [[-30, 12], [30, 12], [-16, 13], [16, 13]]) { poly(ctx, [[x - 6, y], [x - 2, y - 9], [x + 3, y - 6], [x + 6, y]]); flat(ctx, '#d8f6ff', 1.1); }
      },
      back(ctx, st, d, S) {
        glow(ctx, 0, -26, 46, '#9fe6ff', 0.45 + Math.sin(st.time * 1.8) * 0.1);
        this.spires(ctx);
        glow(ctx, 0, -46, 16, WHITE, 0.4 + Math.sin(st.time * 2.6) * 0.15);
        risingMotes(ctx, st.time, 8, -36, 36, 8, 50, '#e8fbff', 1.8, 2.2, st.id || 0);
        orbit(6, 0, -6, 40, 9, st.time, 0.5, -1, (x, y, i) => snowflake(ctx, x, y, 4, st.time + i));
      },
      front(ctx, st, d, S) { orbit(6, 0, -6, 40, 9, st.time, 0.5, 1, (x, y, i) => { if (Math.abs(x) > 16) snowflake(ctx, x, y, 4, st.time + i); }); },
    },
    { // Avalanche: a rotating mandala of ice behind it, ice boulders and blades tumbling round it
      back(ctx, st, d, S) {
        glow(ctx, 0, -24, 40, '#9fe6ff', 0.35);
        ctx.save(); ctx.translate(0, -24); ctx.rotate(st.time * 0.5);
        for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); poly(ctx, [[0, -4], [30, -3], [38, 0], [30, 3], [0, 4]]); flat(ctx, 'rgba(220,248,255,0.9)', 1.3); poly(ctx, [[20, 0], [26, -7], [30, 0], [26, 7]]); flat(ctx, '#bff3ff', 1); }
        ctx.restore();
        circle(ctx, 0, -24, 9); flat(ctx, '#e8fbff', 1.4);
        orbit(8, 0, -14, 44, 11, st.time, 1.4, -1, (x, y, i) => (i % 2 ? iceBlade(ctx, x, y, st.time * 3 + i, 1.6) : boulder(ctx, x, y, 4.6, st.time + i)));
      },
      front(ctx, st, d, S) { orbit(8, 0, -14, 44, 11, st.time, 1.4, 1, (x, y, i) => { if (Math.abs(x) < 18) return; i % 2 ? iceBlade(ctx, x, y, st.time * 3 + i, 1.6) : boulder(ctx, x, y, 4.6, st.time + i); }); },
    },
    { // Whiteout: a towering blizzard vortex behind it: spiral arms of snow round a storm-cloud crown
      back(ctx, st, d, S) {
        glow(ctx, 0, -26, 48, '#dff6ff', 0.4);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let arm = 0; arm < 4; arm++) {
          ctx.beginPath();
          for (let k = 0; k <= 16; k++) { const u = k / 16, a = st.time * 1.6 + arm * (TAU / 4) + u * 3.2, R = 8 + u * 40; ctx.lineTo(Math.cos(a) * R, -24 + Math.sin(a) * R * 0.55); }
          ctx.strokeStyle = 'rgba(225,246,255,0.75)'; ctx.lineWidth = 3.2; ctx.stroke();
        }
        ctx.restore();
        snowCloud(ctx, 0, -42, 34, st.time, DETAIL.q >= 2 ? 9 : 4);
        snowflake(ctx, 0, -24, 8, st.time * 0.6);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 10; i++) { const u = (st.time * 0.5 + i / 10) % 1, a = i * 2.4 + st.time * 2; ctx.fillRect(Math.cos(a) * (14 + u * 30) - 1, -20 + Math.sin(a) * 12 + u * 30 - 1, 2, 2); }
      },
    },
  ],
  coil: [
    { // Stormlord: a great storm-cloud crown, lightning forking down to tall copper rods
      behind(ctx, d, S) { for (const k of [-1, 1]) { line(ctx, [[k * 30, 13], [k * 30, -26]], S.metal, 2.8); for (const y of [-6, -16]) { ctx.beginPath(); ctx.ellipse(k * 30, y, 4.5, 1.5, 0, 0, TAU); ctx.strokeStyle = COPPER; ctx.lineWidth = 1.6; ctx.stroke(); } circle(ctx, k * 30, -29, 4); flat(ctx, COPPER, 1.2); } },
      back(ctx, st, d, S) {
        glow(ctx, 0, -42, 40, DMG.arcane.core, 0.35);
        cloud(ctx, -14, -42, 28, true); cloud(ctx, 14, -43, 30, true); cloud(ctx, 0, -46, 24, true);
        const f = Math.sin(st.time * 5);
        if (f > -0.2) for (const k of [-1, 1]) zap(ctx, k * 14, -40, k * 30, -30, st.time + k, 4, '#f0e0ff', 1.8);
        if (f > 0.5) { zap(ctx, 0, -40, 0, -20, st.time * 2, 3, '#ffffff', 1.4); glow(ctx, 0, -38, 12, WHITE, 0.6); }
        for (const k of [-1, 1]) orb(ctx, k * 30, -29, 3.6, 'arcane', st.time + k, 0.8);
      },
    },
    { // Ball Lightning: three big crackling spheres circling it, arcs leaping between them
      back(ctx, st, d, S) {
        const pts = [];
        orbit(3, 0, -18, 36, 12, st.time, 1.2, 0, (x, y) => pts.push([x, y]));
        for (let i = 0; i < 3; i++) { const a = pts[i], b = pts[(i + 1) % 3]; if (a[1] < -18 || b[1] < -18) zap(ctx, a[0], a[1], b[0], b[1], st.time + i, 4, '#e8d4ff', 1.3); }
        glow(ctx, 0, -18, 40, DMG.arcane.core, 0.25);
        for (const [x, y] of pts) if (y < -18) orb(ctx, x, y, 6.5, 'arcane', st.time + x);
      },
      front(ctx, st, d, S) { orbit(3, 0, -18, 36, 12, st.time, 1.2, 1, (x, y) => { if (Math.abs(x) > 14) orb(ctx, x, y, 6.5, 'arcane', st.time + x); }); },
    },
    { // Eye of the Storm: a great turning vortex behind it, a storm-eye open over it
      back(ctx, st, d, S) {
        glow(ctx, 0, -24, 44, DMG.arcane.core, 0.35);
        ctx.save(); ctx.translate(0, -24);
        for (const [R, sp, w, col] of [[36, 0.8, 5, '#8a86c8'], [26, -1.2, 4, '#a89ce0'], [16, 1.8, 3, '#d8c8ff']]) {
          ctx.save(); ctx.rotate(st.time * sp);
          for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.arc(0, 0, R, 0, 1.5); ctx.strokeStyle = INK; ctx.lineWidth = w + 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); }
          ctx.restore();
        }
        ctx.restore();
        const y = -48;
        glow(ctx, 0, y, 12, '#f4ecff', 0.6);
        ctx.beginPath(); ctx.ellipse(0, y, 11, 5.5, 0, 0, TAU); flat(ctx, '#f4ecff', 1.4);
        circle(ctx, Math.cos(st.time) * 3, y, 3.4); flat(ctx, DMG.arcane.core, 1);
        circle(ctx, Math.cos(st.time) * 3, y, 1.4); ctx.fillStyle = INK; ctx.fill();
      },
    },
  ],
  longeye: [
    { // Kingslayer: a colossal spectral rifle behind it, a broken crown hanging from its standard
      back(ctx, st, d, S) {
        glow(ctx, 0, -30, 40, '#dfe8ff', 0.25);
        ctx.save(); ctx.translate(0, -34); ctx.rotate(-0.42);
        ctx.globalAlpha = 0.85;
        rrect(ctx, -46, -3, 76, 6, 2); flat(ctx, 'rgba(210,225,245,0.9)', 1.3);
        rrect(ctx, 26, -1.6, 26, 3.2, 1); flat(ctx, 'rgba(230,240,255,0.95)', 1.1);
        rrect(ctx, -10, -9, 18, 5, 2); flat(ctx, 'rgba(190,205,230,0.9)', 1.1);
        poly(ctx, [[-46, -3], [-56, -8], [-56, 8], [-46, 3]]); flat(ctx, 'rgba(190,205,230,0.9)', 1.1);
        ctx.globalAlpha = 1;
        glow(ctx, 52, 0, 8 + Math.sin(st.time * 4) * 2, WHITE, 0.7);
        ctx.restore();
        line(ctx, [[-30, 13], [-30, -46]], S.dark, 1.8);
        ctx.beginPath(); ctx.moveTo(-29, -46); ctx.lineTo(-13, -46); ctx.lineTo(-13, -24); ctx.lineTo(-21, -29); ctx.lineTo(-29, -24); ctx.closePath(); ink(ctx, '#7a1f2a', 1.4, -29, -13);
        poly(ctx, [[-27, -34], [-27, -40], [-24.5, -37.5], [-21, -43], [-17.5, -37.5], [-15, -40], [-15, -34]]); flat(ctx, GOLD, 1);
        glow(ctx, -21, -37, 8, GOLD, 0.4 + Math.sin(st.time * 3) * 0.12);
      },
    },
    { // Shrapnel Storm: flak turrets on both sides, a whirling ring of shrapnel and smoke above
      behind(ctx, d, S) { for (const k of [-1, 1]) { rrect(ctx, k * 30 - 7, -6, 14, 19, 3); ink(ctx, S.metal2, 1.4, k * 30 - 7, k * 30 + 7); } },
      back(ctx, st, d, S) {
        for (const k of [-1, 1]) {
          ctx.save(); ctx.translate(k * 30, -12); ctx.rotate(st.time * 3 * k);
          for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); rrect(ctx, 2, -1.8, 12, 3.6, 1.2); flat(ctx, S.metal, 1.1); }
          ctx.restore();
          circle(ctx, k * 30, -12, 4.4); flat(ctx, S.trim, 1.1);
        }
        smokePuffs(ctx, 0, -46, DETAIL.q >= 2 ? 4 : 2, st.time, 0.55);
        orbit(14, 0, -38, 38, 9, st.time, 1.6, 0, (x, y, i) => { poly(ctx, [[x - 2.4, y], [x, y - 2.2], [x + 2.4, y - 0.4], [x + 0.6, y + 1.8]]); flat(ctx, '#c9d0dc', 0.8); });
      },
    },
    { // Eye of Fate: a great open eye over it, ringed by turning runes and lashes of light
      back(ctx, st, d, S) {
        const y = -38 + Math.sin(st.time * 1.5) * 1;
        glow(ctx, 0, y, 30, '#bfe0ff', 0.45);
        ctx.save(); ctx.translate(0, y); ctx.rotate(st.time * 0.4);
        for (let i = 0; i < 10; i++) { ctx.rotate(TAU / 10); poly(ctx, [[20, -1.4], [26, 0], [20, 1.4]]); ctx.fillStyle = 'rgba(220,235,255,0.85)'; ctx.fill(); }
        ctx.restore();
        ctx.save(); ctx.translate(0, y); ctx.scale(1, 0.5);
        circle(ctx, 0, 0, 30); ctx.strokeStyle = 'rgba(200,220,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        ctx.beginPath(); ctx.ellipse(0, y, 16, 8, 0, 0, TAU); flat(ctx, '#f6f9ff', 1.6);
        circle(ctx, Math.sin(st.time * 0.7) * 5, y, 5.4); flat(ctx, '#5a8ad0', 1.1);
        circle(ctx, Math.sin(st.time * 0.7) * 5, y, 2.4); ctx.fillStyle = INK; ctx.fill();
        circle(ctx, Math.sin(st.time * 0.7) * 5 - 1.6, y - 1.6, 1.1); ctx.fillStyle = WHITE; ctx.fill();
      },
    },
  ],
  censer: [
    { // Phoenix: great wings of fire spread behind the censer, a tail of flame (the bird itself flies the road)
      back(ctx, st, d, S) {
        glow(ctx, 0, -22, 46, '#ff6a2a', 0.5);
        wings(ctx, 0, -10, 48, 34, 'rgba(255,120,40,0.92)', '#ffd27a', st.time, 1.4, 7);
        wings(ctx, 0, -8, 32, 20, 'rgba(255,190,80,0.9)', '#fff1b0', st.time + 0.4, 1.4, 5);
        for (let i = 0; i < 6; i++) { const u = (st.time * 1.2 + i / 6) % 1; circle(ctx, -36 + i * 14 + Math.sin(st.time * 3 + i) * 3, -30 - u * 26, 2.4 * (1 - u)); ctx.fillStyle = '#ffd27a'; ctx.fill(); }
      },
    },
    { // Elder Wyrm: a great horned dragon rearing behind it, jaws aglow with fire
      dragon(ctx) {
        ctx.save(); ctx.translate(0, 4); ctx.scale(1.25, 1.25);
        ctx.beginPath(); ctx.moveTo(16, 8); ctx.quadraticCurveTo(30, -14, 14, -30); ctx.lineTo(4, -26); ctx.quadraticCurveTo(20, -12, 6, 8); ctx.closePath(); ink(ctx, '#7a2a1e', 1.4, 4, 30);
        for (let i = 0; i < 5; i++) { const y = 4 - i * 8; poly(ctx, [[24 - i * 1.5, y], [30 - i * 2, y - 3], [23 - i * 1.5, y - 5]]); flat(ctx, '#c84a2a', 0.8); }
        ctx.beginPath(); ctx.moveTo(14, -30); ctx.quadraticCurveTo(10, -44, -6, -42); ctx.lineTo(-16, -36); ctx.lineTo(-6, -33); ctx.lineTo(-14, -29); ctx.quadraticCurveTo(0, -27, 4, -26); ctx.closePath(); ink(ctx, '#8a2e20', 1.4, -16, 14);
        for (const [x, y] of [[8, -42], [12, -38]]) { poly(ctx, [[x, y], [x + 7, y - 9], [x + 3, y + 1]]); flat(ctx, '#e8d6b0', 0.9); }
        ctx.beginPath(); ctx.moveTo(-30, 4); ctx.quadraticCurveTo(-40, -12, -26, -20); ctx.quadraticCurveTo(-30, -8, -22, 0); ctx.closePath(); ink(ctx, '#6a2218', 1.2, -40, -22);
        ctx.restore();
      },
      back(ctx, st, d, S) {
        this.dragon(ctx);
        glow(ctx, -6, -40, 22, '#ff4433', 0.4 + Math.sin(st.time * 6) * 0.15);
        circle(ctx, 2.5, -48.5, 2.2); ctx.fillStyle = '#ffd27a'; ctx.fill(); glow(ctx, 2.5, -48.5, 5, '#ffd27a', 0.9);
        for (let i = 0; i < 4; i++) { const u = (st.time * 1.5 + i / 4) % 1; circle(ctx, -18 - u * 14, -36 + Math.sin(u * 6 + i) * 3, 3 * (1 - u)); ctx.fillStyle = u < 0.5 ? '#ffd27a' : '#ff4433'; ctx.fill(); }
        smokePuffs(ctx, 8, -50, DETAIL.q >= 2 ? 2 : 1, st.time, 0.5);
      },
    },
    { // Pall of Ash: a towering column of ash and embers behind it, a dark crown of smoke
      back(ctx, st, d, S) {
        glow(ctx, 0, -30, 40, '#ff4433', 0.25);
        for (const [x, y, r] of [[-18, -18, 12], [16, -22, 12], [-10, -34, 13], [12, -40, 12], [0, -50, 11], [-22, -40, 8], [24, -34, 8]]) { circle(ctx, x + Math.sin(st.time * 0.8 + x) * 2, y, r); ctx.fillStyle = 'rgba(58,46,50,0.82)'; ctx.fill(); }
        for (const [x, y, r] of [[-6, -26, 6], [8, -36, 6], [-2, -46, 5]]) { circle(ctx, x, y, r); ctx.fillStyle = 'rgba(90,72,74,0.8)'; ctx.fill(); }
        for (let i = 0; i < 8; i++) { const u = (st.time * 0.6 + i / 8) % 1; circle(ctx, -24 + i * 7 + Math.sin(st.time * 2 + i) * 3, -10 - u * 44, 1.6); ctx.fillStyle = i % 2 ? '#ff7a3a' : '#ffd27a'; ctx.fill(); }
        ctx.fillStyle = '#d8d0c8';
        for (let i = 0; i < 8; i++) { const u = (st.time * 0.4 + i / 8) % 1; ctx.fillRect(-30 + i * 8 + Math.sin(st.time * 2 + i) * 3, -50 + u * 60, 1.8, 1.8); }
      },
    },
  ],
  prism: [
    { // Dawnbreaker: a great sun-disc behind the lens, long spear-rays turning round it
      back(ctx, st, d, S) {
        const y = -22;
        glow(ctx, 0, y, 46, '#ffe03a', 0.45);
        ctx.save(); ctx.translate(0, y); ctx.rotate(-st.time * 0.25);
        for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); poly(ctx, [[17, -2.6], [36, 0], [17, 2.6]]); flat(ctx, '#fff3a0', 1.1); }
        ctx.rotate(TAU / 16);
        for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); poly(ctx, [[17, -1.6], [30, 0], [17, 1.6]]); ctx.fillStyle = 'rgba(255,224,58,0.85)'; ctx.fill(); }
        ctx.restore();
        sunDisc(ctx, 0, y, 16, st.time, 14);
        glow(ctx, 0, y, 10, WHITE, 0.6);
      },
    },
    { // Lightweb: eight crystal nodes on a great turning ring, woven together with threads of light
      back(ctx, st, d, S) {
        const pts = [];
        orbit(8, 0, -24, 42, 20, st.time, 0.45, 0, (x, y) => pts.push([x, y]));
        glow(ctx, 0, -24, 44, '#ffe03a', 0.3);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,240,160,0.75)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 3) % pts.length]; ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke();
        ctx.restore();
        for (const [x, y] of pts) if (y < -24 || Math.abs(x) > 14) { glow(ctx, x, y, 7, '#fff3a0', 0.6); shard(ctx, x, y, 1.6, st.time + x); }
      },
    },
    { // Second Sun: a whole second sun rises behind the prism, corona flaring, small worlds circling it
      back(ctx, st, d, S) {
        const y = -40 + Math.sin(st.time * 1.2) * 1.2, p = 1 + Math.sin(st.time * 3) * 0.05;
        glow(ctx, 0, y, 50 * p, '#ffb020', 0.55);
        ctx.save(); ctx.translate(0, y); ctx.rotate(st.time * 0.3);
        for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(18, -3); ctx.quadraticCurveTo(26 + Math.sin(st.time * 4 + i) * 4, 0, 18, 3); flat(ctx, '#ffcf4a', 1.1); }
        ctx.restore();
        circle(ctx, 0, y, 18 * p); flat(ctx, '#ffe066', 1.8);
        circle(ctx, -4, y - 4, 9); ctx.fillStyle = '#fff6c0'; ctx.fill();
        glow(ctx, 0, y, 12, WHITE, 0.7);
        orbit(3, 0, y, 34, 10, st.time, 0.7, 0, (x, yy, i) => { circle(ctx, x, yy, 2.8 + i * 0.6); flat(ctx, ['#ffd27a', '#f6c8d8', '#bfe0ff'][i], 0.9); });
      },
    },
  ],
  beacon: [
    { // Anthem of War: a great war drum behind it, tall battle standards, the drumbeat rolling out
      behind(ctx, d, S) { drum(ctx, 0, -6, 20, true); for (const k of [-1, 1]) warhorn(ctx, k * 22, -26, 1.3 * k); },
      back(ctx, st, d, S) {
        pennant(ctx, -34, 13, -52, '#d84a3a', st.time); pennant(ctx, 32, 13, -48, '#d84a3a', st.time + 1);
        const u = (st.time * 0.8) % 1;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 2; k++) { const v = (u + k * 0.5) % 1; ctx.beginPath(); ctx.ellipse(0, -10, 16 + v * 34, (16 + v * 34) * 0.55, 0, 0, TAU); ctx.strokeStyle = `rgba(255,126,182,${0.6 * (1 - v)})`; ctx.lineWidth = 3; ctx.stroke(); }
        ctx.restore();
      },
    },
    { // Worldlight: a lighthouse tower rises behind it, its great lens sweeping a beam over the land
      behind(ctx, d, S) {
        poly(ctx, [[-12, 12], [-7, -40], [7, -40], [12, 12]]); ink(ctx, '#e8e0d0', 1.6, -12, 12);
        for (const y of [-2, -16, -30]) { rrect(ctx, -10 + (12 - y) * 0.02, y, 20 - (12 - y) * 0.04, 4, 1); flat(ctx, '#c84a3a', 0.8); }
        rrect(ctx, -11, -46, 22, 6, 2); ink(ctx, S.metal, 1.4, -11, 11);
        poly(ctx, [[-9, -56], [0, -62], [9, -56]]); flat(ctx, '#c84a3a', 1.2);
      },
      back(ctx, st, d, S) {
        ctx.save(); ctx.translate(0, -50); ctx.scale(1, 0.32); lightBeam(ctx, 0, 0, st.time * 0.9, 90, 22, 0.6); lightBeam(ctx, 0, 0, st.time * 0.9 + Math.PI, 90, 22, 0.4); ctx.restore();
        glow(ctx, 0, -50, 18, '#fff1b0', 0.9);
        circle(ctx, 0, -50, 5); flat(ctx, PALE, 1.4);
      },
    },
    { // Golden Age: a great golden sunburst and laurel behind it, coins wheeling, a treasure chest
      behind(ctx, d, S) { chest(ctx, -26, 13, 14, true); coins(ctx, 24, 12, 8); coins(ctx, -12, 13, 4); },
      back(ctx, st, d, S) {
        glow(ctx, 0, -26, 46, GOLD, 0.4);
        ctx.save(); ctx.translate(0, -26); ctx.rotate(st.time * 0.2);
        for (let i = 0; i < 16; i++) { ctx.rotate(TAU / 16); poly(ctx, [[22, -2], [i % 2 ? 36 : 42, 0], [22, 2]]); ctx.fillStyle = i % 2 ? 'rgba(255,224,120,0.8)' : 'rgba(255,207,74,0.9)'; ctx.fill(); }
        ctx.restore();
        ctx.save(); ctx.translate(0, -26);
        for (const k of [-1, 1]) for (let i = 0; i < 8; i++) { const a = Math.PI / 2 + k * (0.35 + i * 0.3); ctx.beginPath(); ctx.ellipse(Math.cos(a) * 22, Math.sin(a) * 22, 5, 2.2, a + k * 0.8, 0, TAU); flat(ctx, '#e0b020', 1); }
        ctx.restore();
        orbit(6, 0, -34, 34, 8, st.time, 1.1, 0, (x, y, i) => { ctx.beginPath(); ctx.ellipse(x, y, 3.6 * Math.abs(Math.cos(st.time * 3 + i)) + 0.8, 3.6, 0, 0, TAU); flat(ctx, GOLD, 1); });
      },
    },
  ],
  // The Snare lies on the road (drawn with the ground): its tier 5s stay low but spread wide.
  snare: [
    { // Thornwall: a great ring of iron briars standing round the grate
      back(ctx, st, d, S) { for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; briar(ctx, Math.cos(a) * 30, 11 + Math.sin(a) * 12, 12 + (i % 3) * 3, Math.cos(a) * 0.5, i % 3 === 0); } },
    },
    { // Constellation: seven lamp-stars round it on the road, joined in a star of light
      back(ctx, st, d, S) {
        const pts = [];
        for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + 0.3; pts.push([Math.cos(a) * 36, 11 + Math.sin(a) * 14]); }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,246,200,${0.6 + Math.sin(st.time * 3) * 0.2})`; ctx.lineWidth = 1.6;
        ctx.beginPath(); pts.forEach((p, i) => { const q = pts[(i + 3) % 7]; ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }); ctx.stroke();
        ctx.restore();
        for (const [x, y] of pts) { glow(ctx, x, y, 8, '#fff6d0', 0.6); lampSeed(ctx, x, y, 1.2, 1); }
      },
    },
    { // Seal of Dawn: a great seal of runes and chains turning on the road round it
      back(ctx, st, d, S) { runeCircle(ctx, 0, 11, 40, 15, st.time, '#fff6d0', 1); runeCircle(ctx, 0, 11, 28, 10, -st.time * 1.4, '#ffe9a0', 1); chainRing(ctx, 0, 11, 20, 7, 10, '#fff6d0', st.time); },
    },
  ],
  moth: [
    { // False Moon: a great pale moon rises behind the lantern, haloed
      back(ctx, st, d, S) {
        const y = -32;
        glow(ctx, 0, y, 44, '#fff6c0', 0.45);
        ctx.save(); ctx.translate(0, y); ctx.scale(1, 0.3); circle(ctx, 0, 0, 34); ctx.strokeStyle = 'rgba(255,246,200,0.55)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        circle(ctx, 0, y, 22); flat(ctx, '#f4f0dc', 1.8);
        for (const [x, yy, r] of [[-8, -6, 4.5], [7, 4, 3.4], [9, -9, 2.6], [-6, 8, 2.4], [-14, 2, 2]]) { circle(ctx, x, y + yy, r); ctx.fillStyle = 'rgba(180,170,150,0.55)'; ctx.fill(); }
        ctx.beginPath(); ctx.arc(0, y, 22, -0.6, 1.4); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
      },
    },
    { // Amber Trap: two great drops of amber hang from a crooked branch, moths caught inside
      behind(ctx, d, S) { line(ctx, [[-30, 13], [-30, -34], [-14, -48], [18, -46]], S.dark, 2.2); },
      back(ctx, st, d, S) {
        for (const [x, y0, s] of [[-20, -44, 1.3], [12, -45, 1]]) {
          const y = y0 + 16 * s + Math.sin(st.time * 1.2 + x) * 1.2;
          line(ctx, [[x, y0], [x, y - 11 * s]], '#c89a5a', 0.9);
          glow(ctx, x, y, 16 * s, '#ffb030', 0.5);
          ctx.beginPath(); ctx.moveTo(x, y - 12 * s); ctx.quadraticCurveTo(x + 10 * s, y + 2 * s, x, y + 11 * s); ctx.quadraticCurveTo(x - 10 * s, y + 2 * s, x, y - 12 * s); flat(ctx, 'rgba(240,160,40,0.92)', 1.5);
          ctx.save(); ctx.translate(x, y + 1); ctx.scale(s, s); ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.ellipse(-2.4, 0, 2.8, 1.6, 0.4, 0, TAU); ctx.ellipse(2.4, 0, 2.8, 1.6, -0.4, 0, TAU); ctx.fill(); ctx.restore();
          ctx.beginPath(); ctx.ellipse(x - 3 * s, y - 4 * s, 1.4 * s, 3 * s, 0.3, 0, TAU); ctx.fillStyle = 'rgba(255,240,200,0.7)'; ctx.fill();
        }
      },
    },
    { // Moth Queen: a great moth with eyed wings spread wide behind the lantern
      back(ctx, st, d, S) {
        const f = 1 + Math.sin(st.time * 3) * 0.08;
        glow(ctx, 0, -24, 44, '#e8d8ff', 0.35);
        for (const k of [-1, 1]) {
          ctx.save(); ctx.translate(0, -24); ctx.scale(k * f, 1);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(18, -30, 44, -22); ctx.quadraticCurveTo(40, -2, 14, 2); ctx.quadraticCurveTo(32, 10, 28, 26); ctx.quadraticCurveTo(10, 20, 0, 6); ctx.closePath(); flat(ctx, '#d8c8f0', 1.6);
          ctx.beginPath(); ctx.moveTo(6, -2); ctx.quadraticCurveTo(20, -20, 40, -18); ctx.strokeStyle = 'rgba(122,106,144,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
          circle(ctx, 26, -12, 6); flat(ctx, '#ffe03a', 1.1); circle(ctx, 26, -12, 2.6); ctx.fillStyle = INK; ctx.fill();
          circle(ctx, 20, 12, 3.4); flat(ctx, '#f6c8d8', 0.9);
          ctx.restore();
        }
        ctx.beginPath(); ctx.ellipse(0, -22, 3.4, 11, 0, 0, TAU); flat(ctx, '#7a6a90', 1.3);
        for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -32); ctx.quadraticCurveTo(k * 4, -42, k * 9, -46); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); }
      },
    },
  ],
  wander: [
    { // Falling Sky: a crescent of stars arching over it, great stars falling with long trails
      back(ctx, st, d, S) {
        glow(ctx, 0, -28, 44, DMG.arcane.core, 0.3);
        ctx.save(); ctx.translate(0, -12); ctx.rotate(Math.sin(st.time * 0.4) * 0.15);
        for (let i = 0; i < 9; i++) { const a = Math.PI + (i + 0.5) / 9 * Math.PI, R = 40; star(ctx, Math.cos(a) * R, Math.sin(a) * R * 0.9, 3.4 + (i % 2) * 1.2, 1.4, 5, st.time + i); flat(ctx, '#f4ecff', 0.9); }
        ctx.restore();
        for (let i = 0; i < 5; i++) {
          const u = (st.time * 0.6 + i / 5) % 1, x = -30 + i * 15, y = -54 + u * 50;
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(216,184,255,${0.8 * (1 - u)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 9, y - 16); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
          star(ctx, x, y, 4.4, 1.8, 5, st.time * 3); flat(ctx, '#ffffff', 0.9);
        }
      },
    },
    { // Starhost: a great ring of stars wheeling round it, a constellation drawn between them
      back(ctx, st, d, S) {
        const pts = [];
        orbit(7, 0, -14, 34, 11, st.time, 1.0, 0, (x, y) => pts.push([x, y]));
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(216,184,255,0.45)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 2) % pts.length]; ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke();
        ctx.restore();
        for (const [x, y] of pts) if (y < -14) { glow(ctx, x, y, 8, DMG.arcane.core, 0.55); star(ctx, x, y, 4.6, 1.9, 5, st.time); flat(ctx, '#f4ecff', 1); }
      },
      front(ctx, st, d, S) { orbit(7, 0, -14, 34, 11, st.time, 1.0, 1, (x, y) => { if (Math.abs(x) < 12) return; glow(ctx, x, y, 8, DMG.arcane.core, 0.55); star(ctx, x, y, 4.6, 1.9, 5, st.time); flat(ctx, '#f4ecff', 1); }); },
    },
    { // Dawnbringer: a great rose sunrise behind it, two tall torches flanking it
      back(ctx, st, d, S) {
        glow(ctx, 0, -18, 46, DMG.hearth.core, 0.45);
        ctx.save(); ctx.translate(0, -18); ctx.rotate(st.time * 0.25);
        for (let i = 0; i < 14; i++) { ctx.rotate(TAU / 14); poly(ctx, [[18, -2], [i % 2 ? 32 : 40, 0], [18, 2]]); ctx.fillStyle = i % 2 ? 'rgba(255,210,230,0.75)' : 'rgba(255,170,205,0.85)'; ctx.fill(); }
        ctx.restore();
        circle(ctx, 0, -18, 15); ctx.fillStyle = 'rgba(255,200,225,0.55)'; ctx.fill();
        for (const k of [-1, 1]) { line(ctx, [[k * 30, 14], [k * 30, -30]], S.metal2, 2.4); torchFlame(ctx, k * 30, -32, 1.8, st.time + k); }
      },
    },
  ],
  vault: [
    { // Dragon's Hoard: a hoard of gold heaped round it, a gold dragon with wings spread over the brazier
      behind(ctx, d, S) { coins(ctx, -26, 12, 9); coins(ctx, 24, 12, 10); chest(ctx, 28, 6, 13, true); chest(ctx, -24, 4, 10, true); },
      back(ctx, st, d, S) {
        const y = -14, fl = Math.sin(st.time * 2.4) * 0.12;
        glow(ctx, 0, y, 34, GOLD, 0.35);
        for (const k of [-1, 1]) { ctx.save(); ctx.translate(0, y); ctx.scale(k, 1); ctx.rotate(-fl); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -22, 34, -18); ctx.lineTo(28, -10); ctx.lineTo(30, -4); ctx.lineTo(22, -2); ctx.lineTo(22, 4); ctx.quadraticCurveTo(10, 4, 0, 6); ctx.closePath(); flat(ctx, '#e0b020', 1.4); ctx.restore(); }
        ctx.beginPath(); ctx.ellipse(0, y + 4, 8, 6, 0, 0, TAU); flat(ctx, GOLD, 1.3);
        ctx.beginPath(); ctx.moveTo(2, y); ctx.quadraticCurveTo(10, y - 10, 6, y - 16); flat(ctx, GOLD, 1.2);
        circle(ctx, 6, y - 17, 4.6); flat(ctx, GOLD, 1.2); circle(ctx, 7.6, y - 18, 1); ctx.fillStyle = INK; ctx.fill();
        for (const s of [-1, 1]) { poly(ctx, [[6 + s * 2, y - 20], [6 + s * 4, y - 26], [6 + s * 0.5, y - 21]]); flat(ctx, '#fff1b0', 0.8); }
        twinkle(ctx, -22, 4, 3, Math.sin(st.time * 2.2) * 1.4); twinkle(ctx, 20, 2, 2.6, Math.sin(st.time * 1.7 + 1) * 1.4);
      },
    },
    { // Ember Tide: a whirlpool of embers spiralling in to it from all round, wisps riding it
      back(ctx, st, d, S) {
        glow(ctx, 0, -10, 44, DMG.hearth.core, 0.35);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let arm = 0; arm < 3; arm++) {
          ctx.beginPath();
          for (let k = 0; k <= 14; k++) { const u = k / 14, a = -st.time * 1.4 + arm * (TAU / 3) + u * 3, R = 44 * (1 - u) + 6; ctx.lineTo(Math.cos(a) * R, -12 + Math.sin(a) * R * 0.5); }
          ctx.strokeStyle = 'rgba(255,150,90,0.7)'; ctx.lineWidth = 2.6; ctx.stroke();
        }
        for (let i = 0; i < (DETAIL.q >= 2 ? 14 : 6); i++) {
          const u = (st.time * 0.5 + i / 14) % 1, a = i * 2.4 - u * 4, R = 46 * (1 - u);
          circle(ctx, Math.cos(a) * R, -12 + Math.sin(a) * R * 0.5, 2.2); ctx.fillStyle = `rgba(255,190,110,${0.9 * u + 0.1})`; ctx.fill();
        }
        ctx.restore();
        emberWisp(ctx, -30, -34, st.time, 1.5); emberWisp(ctx, 30, -26, st.time + 1, 1.5); emberWisp(ctx, 0, -48, st.time + 2, 1.3);
      },
    },
    { // Second Heartfire: a great rose heart-flame rising behind it, crowned with fire
      back(ctx, st, d, S) {
        const y = -22 + Math.sin(st.time * 2) * 1.2, p = 1 + Math.sin(st.time * 4) * 0.06;
        glow(ctx, 0, y, 40 * p, DMG.hearth.core, 0.6);
        ctx.save(); ctx.translate(0, y); ctx.scale(1.9 * p, 1.9 * p);
        ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-11, 0, -7, -9, 0, -4); ctx.bezierCurveTo(7, -9, 11, 0, 0, 8); flat(ctx, '#ff7eb6', 0.8);
        ctx.beginPath(); ctx.moveTo(0, 4); ctx.bezierCurveTo(-5, 0, -3, -4, 0, -1.5); ctx.bezierCurveTo(3, -4, 5, 0, 0, 4); ctx.fillStyle = '#ffe0ee'; ctx.fill();
        ctx.restore();
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.45, h = 6 + Math.sin(st.time * 9 + i) * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14 - 2, y - 10 + Math.sin(a) * 4); ctx.quadraticCurveTo(Math.cos(a) * 16, y - 14 - h, Math.cos(a) * 14 + 2, y - 10 + Math.sin(a) * 4); flat(ctx, '#ff9ecb', 0.8); }
        risingMotes(ctx, st.time, 6, -20, 20, y - 6, 24, '#ffd0e6', 1.6, 1.4, st.id || 0);
      },
    },
  ],
};

// ---- entry points (wardArt.js calls these for a ward whose main path is at tier 5) --------------
function form(type, P) { const f = FORMS[type]; return f ? f[P.main] : null; }
export function hasAscension(type) { return !!FORMS[type]; }
export function ascendBehind(ctx, type, P, d, skin) { const f = form(type, P); if (f && f.behind) f.behind(ctx, d, SKIN5[skin] || SKIN5.kindling); }
// In crowds (DETAIL.q < 2) the sigil and the moving parts of the form are one cached still image:
// one drawImage per refresh instead of dozens of calls.
const stills = new Map();
const SX = -62, SY = -70, SW = 124, SH = 96, SK = 1.6;   // ward units covered by a still, and its px per unit
const STILL_ST = { time: 0.7, ang: 0.6, recoil: 0, pulse: 0, fire: 0, pop: 0, id: 0 };
function still(type, P, d, skin) {
  const key = `${skin}|${type}|${P.main}`;
  let c = stills.get(key);
  if (c !== undefined) return c;
  c = newCanvas();
  const q = DETAIL.q;
  if (c) {
    // A still that fails to draw is never retried every frame: the ward falls back to drawing live.
    try {
      c.width = SW * SK; c.height = SH * SK;
      const g = c.getContext('2d');
      g.setTransform(SK, 0, 0, SK, -SX * SK, -SY * SK);
      DETAIL.q = 2;
      sigil5(g, d, STILL_ST.time, type === 'snare' ? 42 : 34);
      const f = form(type, P);
      if (f && f.back) f.back(g, STILL_ST, d, SKIN5[skin] || SKIN5.kindling);
    } catch (err) {
      console.error(`[Hollowlight] couldn't draw the ${type} tier 5 still:`, err);
      c = null;
    } finally { DETAIL.q = q; }
  }
  stills.set(key, c);
  return c;
}
export function clearAscendCache() { stills.clear(); }
export function ascendBack(ctx, type, P, st, d, skin) {
  if (DETAIL.q < 2) { const c = still(type, P, d, skin); if (c) { ctx.drawImage(c, SX, SY, SW, SH); return; } }
  const f = form(type, P);
  sigil5(ctx, d, st.time, type === 'snare' ? 42 : 34);
  if (f && f.back) f.back(ctx, st, d, SKIN5[skin] || SKIN5.kindling);
}
// top: the top of the ward's body (ward units), for the diadem.
export function ascendFront(ctx, type, P, st, d, skin, top) {
  const f = form(type, P);
  if (f && f.front && DETAIL.q >= 2) f.front(ctx, st, d, SKIN5[skin] || SKIN5.kindling);
  if (FACE.skip) return;
  if (type === 'snare') { diadem(ctx, 0, 1, d, st.time, 0.8); return; }
  diadem(ctx, 0, top + 3, d, st.time);
}
