// Tier 5: the second form. Every ward's tier 5 is drawn here, for BOTH skins (each skin passes its
// own materials, SKIN5 below), on top of that skin's tier 4 form:
//   - a ground sigil in the ward's damage colour, brighter than the tier 4 aura (live, back);
//   - the path's second form: a companion, a summoned shape or a great apparatus beside or behind
//     the ward (static parts in the cached body, `behind`; moving parts live, `back`). Nothing big
//     is ever drawn in front of the body: the body-and-face rule holds (tools/wards.mjs checks it);
//   - a floating five-point diadem with a white-hot core, the only pure white on an idle ward (the
//     channel the visual system kept back for tier 5), drawn last, above the head.
// See docs/tier5-design.md for what each form is, and docs/upgrade-visuals-research.md 2.5.
import { TAU, INK, DMG, circle, poly, rrect, star, ink, flat, line, glow, rgba, shade, twinkle, DETAIL, FACE, newCanvas } from './kit.js';
import { GOLD, IRON, IRON2, BRASS, COPPER, cloud, zap, orb, iceCrystal, iceBlade, snowCloud, sunDisc, shard, drum, pennant, coins, chest, moths, crescent, heartGrill, emberWisp, torchFlame, runeCircle, chainRing, briar, lampSeed, beam as lightBeam, smokePuffs, lavaCracks, warhorn, tube } from './parts.js';
import { STEEL, SILVER, hawk, mark, banner } from './bolt-parts.js';

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

// ---- the forms --------------------------------------------------------------------------------------
// FORMS[type][path] = { behind(ctx, d, S) static, under the body; back(ctx, st, d, S) live, behind;
// front(ctx, st, d, S) live, small things beside or above the body only }.
const FORMS = {
  bolt: [
    { // Worldpiercer: a siege-engine frame striding behind the archer, a colossal lance across its top
      behind(ctx, d, S) {
        for (const k of [-1, 1]) {
          line(ctx, [[k * 25, 13], [k * 15, -14], [k * 6, -30]], S.metal2, 3.4);
          circle(ctx, k * 15, -16, 2.6); flat(ctx, S.trim, 1);
          poly(ctx, [[k * 29, 13], [k * 21, 13], [k * 25, 8]]); flat(ctx, S.metal, 1.1);
        }
        rrect(ctx, -9, -35, 18, 6, 2); ink(ctx, S.metal, 1.4, -9, 9);
      },
      back(ctx, st, d, S) {
        const a = -0.22, L = 30, cx = 0, cy = -33;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        rrect(ctx, -L, -2.2, L * 2, 4.4, 2); flat(ctx, S.dark, 1.2);
        poly(ctx, [[L, -4.5], [L + 9, 0], [L, 4.5]]); flat(ctx, STEEL, 1.2);
        glow(ctx, L + 5, 0, 7, WHITE, 0.5 + Math.sin(st.time * 4) * 0.15);
        poly(ctx, [[-L, -4], [-L - 6, -6], [-L - 4, 0], [-L - 6, 6], [-L, 4]]); flat(ctx, SILVER, 1);
        ctx.restore();
      },
    },
    { // Thousand Bolts: a turning wheel of crossbow bolts high behind the archer
      back(ctx, st, d, S) {
        ctx.save(); ctx.translate(0, -24);
        circle(ctx, 0, 0, 12); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = S.metal; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.rotate(st.time * 1.4);
        for (let i = 0; i < 10; i++) {
          ctx.rotate(TAU / 10);
          line(ctx, [[8, 0], [17, 0]], '#7a5236', 1);
          poly(ctx, [[17, -2], [21, 0], [17, 2]]); flat(ctx, SILVER, 0.7);
        }
        ctx.restore();
        circle(ctx, 0, -24, 3.4); flat(ctx, S.trim, 1.1);
      },
    },
    { // Wild Hunt: the great spirit-hawk, wings spread behind the hunter, eyes white
      back(ctx, st, d, S) {
        glow(ctx, 0, -22, 28, '#bfe0ff', 0.25);
        wings(ctx, 0, -14, 34, 20, 'rgba(200,226,255,0.88)', WHITE, st.time, 1, 6);
        hawk(ctx, -17, -30, 1.3, st.time, false);
        if (!FACE.skip) glow(ctx, -15.5, -36.5, 3, WHITE, 0.9);
      },
    },
  ],
  mortar: [
    { // Worldbreaker: a mountain of rock hangs over the kiln, molten in its cracks
      back(ctx, st, d, S) {
        const y = -32 + Math.sin(st.time * 1.3) * 1.5;
        glow(ctx, 0, y, 22, '#ff9a1f', 0.35);
        poly(ctx, [[-14, y + 4], [-11, y - 7], [-3, y - 12], [7, y - 10], [14, y - 2], [10, y + 8], [-4, y + 10]]); ink(ctx, '#6a5a52', 1.8, -14, 14);
        lavaCracks(ctx, [[[-8, y - 2], [-2, y + 2], [3, y - 4]], [[5, y + 5], [9, y - 1]]], '#ffb347', 1.1);
        orbit(5, 0, y, 22, 6, st.time, 0.9, 0, (x, yy, i) => { poly(ctx, [[x - 2.5, yy], [x, yy - 2.6], [x + 2.5, yy - 0.5], [x + 1, yy + 2]]); flat(ctx, '#7a6a60', 0.9); });
      },
    },
    { // Grand Battery: two great guns on carriages flank the kiln, and a rangefinder flag above
      behind(ctx, d, S) {
        for (const k of [-1, 1]) {
          tube(ctx, k * 24, 8, -k * 0.35, 7.5, 22, { fill: S.metal, bands: 3, gold: true });
          circle(ctx, k * 24, 11, 4); flat(ctx, S.metal2, 1.3); circle(ctx, k * 24, 11, 1.4); flat(ctx, S.trim, 0.8);
        }
      },
      back(ctx, st, d, S) {
        pennant(ctx, -22, -8, -36, '#ff9a1f', st.time);
        for (const k of [-1, 1]) { const y = -16 - 5 * Math.abs(Math.sin(st.time * 4 + k)); glow(ctx, k * 29, y, 4, '#ffcf8a', 0.35); }
      },
    },
    { // Magma Heart: a molten core rises behind the kiln, dripping into a magma ring
      back(ctx, st, d, S) {
        ctx.save(); ctx.translate(0, 11); ctx.scale(1, 0.36);
        circle(ctx, 0, 0, 30); ctx.strokeStyle = 'rgba(255,120,30,0.85)'; ctx.lineWidth = 5; ctx.stroke();
        ctx.restore();
        const y = -32 + Math.sin(st.time * 2) * 1.2;
        glow(ctx, 0, y, 24, '#ff5a1a', 0.55);
        circle(ctx, 0, y, 10); flat(ctx, '#ff7a2a', 1.6);
        circle(ctx, 0, y, 6); ctx.fillStyle = '#ffd27a'; ctx.fill();
        for (let i = 0; i < 3; i++) { const u = (st.time * 0.8 + i / 3) % 1; circle(ctx, -6 + i * 6, y + 10 + u * 22, 1.6 * (1 - u * 0.5)); ctx.fillStyle = '#ff9a3a'; ctx.fill(); }
      },
    },
  ],
  rime: [
    { // Permafrost: a glacier of great ice spears fans out behind the spire
      behind(ctx, d, S) {
        for (const [x, h, l] of [[-22, 28, -0.35], [-12, 38, -0.15], [0, 44, 0], [12, 38, 0.15], [22, 28, 0.35]]) iceCrystal(ctx, x, 12, 7, h, l);
      },
      back(ctx, st, d, S) { glow(ctx, 0, -24, 26, '#9fe6ff', 0.3 + Math.sin(st.time * 2) * 0.06); },
    },
    { // Avalanche: a storm of ice blades and snowballs tumbling round it, high up
      back(ctx, st, d, S) { orbit(7, 0, -26, 26, 7, st.time, 1.6, -1, (x, y, i) => (i % 2 ? iceBlade(ctx, x, y, st.time * 3 + i, 1.1) : (circle(ctx, x, y, 3.2), flat(ctx, '#f4fbff', 1.1)))); },
      front(ctx, st, d, S) { orbit(7, 0, -26, 26, 7, st.time, 1.6, 1, (x, y, i) => (i % 2 ? iceBlade(ctx, x, y, st.time * 3 + i, 1.1) : (circle(ctx, x, y, 3.2), flat(ctx, '#f4fbff', 1.1)))); },
    },
    { // Whiteout: a whirling blizzard cloud over it, snow spiralling down around it
      back(ctx, st, d, S) {
        snowCloud(ctx, 0, -30, 26, st.time, DETAIL.q >= 2 ? 7 : 3);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(220,245,255,0.55)'; ctx.lineWidth = 1.6;
        for (let i = 0; i < 3; i++) { const a = st.time * 2 + i * 2.1; ctx.beginPath(); ctx.ellipse(0, -8, 28 - i * 4, 9 - i, 0, a, a + 1.6); ctx.stroke(); }
        ctx.restore();
      },
    },
  ],
  coil: [
    { // Stormlord: a crown of storm cloud above, forking lightning down to two rods
      behind(ctx, d, S) { for (const k of [-1, 1]) { line(ctx, [[k * 22, 13], [k * 22, -18]], S.metal, 2.2); circle(ctx, k * 22, -20, 3); flat(ctx, COPPER, 1.1); } },
      back(ctx, st, d, S) {
        cloud(ctx, 0, -30, 24, true);
        if (Math.sin(st.time * 5) > 0.2) for (const k of [-1, 1]) zap(ctx, k * 10, -28, k * 22, -21, st.time + k, 3);
        glow(ctx, 0, -34, 22, DMG.arcane.core, 0.25);
      },
    },
    { // Ball Lightning: three crackling spheres circle it
      back(ctx, st, d, S) { orbit(3, 0, -12, 25, 9, st.time, 1.3, -1, (x, y) => orb(ctx, x, y, 4.2, 'arcane', st.time + x)); },
      front(ctx, st, d, S) { orbit(3, 0, -12, 25, 9, st.time, 1.3, 1, (x, y) => { if (Math.abs(x) > 12) orb(ctx, x, y, 4.2, 'arcane', st.time + x); }); },
    },
    { // Eye of the Storm: a turning vortex disc behind it with a storm-eye at its heart
      back(ctx, st, d, S) {
        ctx.save(); ctx.translate(0, -20); ctx.rotate(st.time * 0.8);
        for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.arc(0, 0, 23, 0, 1.6); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#8a86c8'; ctx.lineWidth = 3; ctx.stroke(); }
        ctx.restore();
        glow(ctx, 0, -20, 24, DMG.arcane.core, 0.3);
        ctx.beginPath(); ctx.ellipse(-20, -34, 7, 3.8, 0, 0, TAU); flat(ctx, '#f4ecff', 1.3);
        circle(ctx, -20 + Math.cos(st.time) * 2, -34, 2.3); flat(ctx, DMG.arcane.core, 0.9);
      },
    },
  ],
  longeye: [
    { // Kingslayer: a trophy standard with a broken crown, gold-chased
      behind(ctx, d, S) {
        line(ctx, [[-22, 13], [-22, -36]], S.dark, 1.6);
        ctx.beginPath(); ctx.moveTo(-21, -36); ctx.lineTo(-9, -36); ctx.lineTo(-9, -20); ctx.lineTo(-15, -24); ctx.lineTo(-21, -20); ctx.closePath(); ink(ctx, '#7a1f2a', 1.3, -21, -9);
        poly(ctx, [[-19, -27], [-19, -32], [-17, -30], [-15, -34], [-13, -30], [-11, -32], [-11, -27]]); flat(ctx, GOLD, 0.9);
      },
      back(ctx, st, d, S) { glow(ctx, -15, -29, 7, GOLD, 0.35 + Math.sin(st.time * 3) * 0.1); },
    },
    { // Shrapnel Storm: two flak turrets on its shoulders' level, spinning drums
      behind(ctx, d, S) { for (const k of [-1, 1]) { rrect(ctx, k * 24 - 5, -2, 10, 14, 2); ink(ctx, S.metal2, 1.3, k * 24 - 5, k * 24 + 5); } },
      back(ctx, st, d, S) {
        for (const k of [-1, 1]) {
          ctx.save(); ctx.translate(k * 24, -6); ctx.rotate(st.time * 3 * k);
          for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); rrect(ctx, 1, -1.4, 9, 2.8, 1); flat(ctx, S.metal, 1); }
          ctx.restore();
          circle(ctx, k * 24, -6, 3.4); flat(ctx, S.trim, 1);
        }
      },
    },
    { // Eye of Fate: a great open eye hangs above it, ringed with runes, lashes of light
      back(ctx, st, d, S) {
        const y = -34 + Math.sin(st.time * 1.5) * 1, X = -19;
        ctx.save(); ctx.translate(X, 0);
        glow(ctx, 0, y, 18, '#bfe0ff', 0.4);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(220,235,255,0.6)'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) / 7 * Math.PI; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 11, y + Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * 16, y + Math.sin(a) * 10); ctx.stroke(); }
        ctx.restore();
        ctx.beginPath(); ctx.ellipse(0, y, 11, 5.5, 0, 0, TAU); flat(ctx, '#f6f9ff', 1.5);
        circle(ctx, Math.sin(st.time * 0.7) * 3, y, 3.6); flat(ctx, '#5a8ad0', 1);
        circle(ctx, Math.sin(st.time * 0.7) * 3, y, 1.6); ctx.fillStyle = INK; ctx.fill();
        ctx.restore();
      },
    },
  ],
  censer: [
    { // Phoenix: wings of fire spread behind the censer (the phoenix itself flies over the road)
      back(ctx, st, d, S) {
        glow(ctx, 0, -18, 32, '#ff6a2a', 0.4);
        wings(ctx, 0, -10, 34, 26, 'rgba(255,120,40,0.9)', '#ffd27a', st.time, 1.4, 6);
        for (let i = 0; i < 4; i++) { const u = (st.time * 1.2 + i / 4) % 1; circle(ctx, -24 + i * 16, -24 - u * 18, 2 * (1 - u)); ctx.fillStyle = '#ffd27a'; ctx.fill(); }
      },
    },
    { // Elder Wyrm: a dragon's head and neck rising behind it, horned, embers in its jaw
      behind(ctx, d, S) {
        ctx.save(); ctx.translate(0, 6);
        ctx.beginPath(); ctx.moveTo(16, 12); ctx.quadraticCurveTo(30, -14, 14, -30); ctx.lineTo(4, -26); ctx.quadraticCurveTo(20, -12, 6, 12); ctx.closePath(); ink(ctx, '#7a2a1e', 1.6, 4, 30);
        for (let i = 0; i < 4; i++) { const y = 4 - i * 9; poly(ctx, [[24 - i * 1.5, y], [29 - i * 2, y - 3], [23 - i * 1.5, y - 5]]); flat(ctx, '#c84a2a', 0.9); }
        ctx.beginPath(); ctx.moveTo(14, -30); ctx.quadraticCurveTo(10, -44, -6, -42); ctx.lineTo(-14, -36); ctx.lineTo(-6, -34); ctx.lineTo(-12, -30); ctx.quadraticCurveTo(0, -28, 4, -26); ctx.closePath(); ink(ctx, '#8a2e20', 1.6, -14, 14);
        for (const [x, y] of [[8, -42], [12, -38]]) { poly(ctx, [[x, y], [x + 7, y - 9], [x + 3, y + 1]]); flat(ctx, '#e8d6b0', 1); }
        ctx.restore();
      },
      back(ctx, st, d, S) {
        circle(ctx, 2, -32, 1.8); ctx.fillStyle = '#ffd27a'; ctx.fill(); glow(ctx, 2, -32, 4, '#ffd27a', 0.8);
        glow(ctx, -12, -26, 6 + Math.sin(st.time * 6) * 1.5, '#ff4433', 0.7);
      },
    },
    { // Pall of Ash: a tall column of ash smoke rising behind it, ash flakes drifting
      back(ctx, st, d, S) {
        smokePuffs(ctx, 0, -20, DETAIL.q >= 2 ? 6 : 3, st.time, 0.85);
        for (const [x, y, r] of [[-14, -26, 8], [12, -30, 8], [-4, -36, 7]]) { circle(ctx, x + Math.sin(st.time + x) * 1.5, y, r); ctx.fillStyle = 'rgba(70,58,62,0.75)'; ctx.fill(); }
        ctx.fillStyle = '#d8d0c8';
        for (let i = 0; i < 6; i++) { const u = (st.time * 0.4 + i / 6) % 1; ctx.fillRect(-20 + i * 8 + Math.sin(st.time * 2 + i) * 3, -36 + u * 46, 1.6, 1.6); }
      },
    },
  ],
  prism: [
    { // Dawnbreaker: a great sun-disc of spear-rays behind the lens
      back(ctx, st, d, S) {
        sunDisc(ctx, 0, -18, 12, st.time, 10);
        ctx.save(); ctx.translate(0, -18); ctx.rotate(-st.time * 0.25);
        for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); poly(ctx, [[14, -1.6], [26, 0], [14, 1.6]]); flat(ctx, '#fff3a0', 1); }
        ctx.restore();
      },
    },
    { // Lightweb: six crystal nodes on a ring, joined by threads of light
      back(ctx, st, d, S) {
        const pts = [];
        orbit(6, 0, -22, 26, 14, st.time, 0.5, 0, (x, y) => pts.push([x, y]));
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,240,160,0.7)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 2) % pts.length]; ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke();
        ctx.restore();
        for (const [x, y] of pts) if (y < -22 || Math.abs(x) > 12) shard(ctx, x, y, 1, st.time + x);
      },
    },
    { // Second Sun: a small sun floats above the prism, flaring
      back(ctx, st, d, S) {
        const y = -32 + Math.sin(st.time * 1.4) * 1.2, x = -19;
        glow(ctx, x, y, 18 + Math.sin(st.time * 3) * 3, '#ffe03a', 0.6);
        star(ctx, x, y, 9.5, 6.5, 14, st.time * 0.6); flat(ctx, '#ffcf4a', 1.2);
        circle(ctx, x, y, 6); flat(ctx, '#fff3a0', 1.2);
      },
    },
  ],
  beacon: [
    { // Anthem of War: war banners flank it, and a great drum stands behind
      behind(ctx, d, S) { drum(ctx, 0, -2, 14, true); },
      back(ctx, st, d, S) { pennant(ctx, -24, 12, -40, '#d84a3a', st.time); pennant(ctx, 22, 12, -36, '#d84a3a', st.time + 1); },
    },
    { // Worldlight: a great lens high behind it, sweeping a beam across the whole map
      back(ctx, st, d, S) {
        line(ctx, [[-20, 13], [-20, -30]], S.metal, 2.2);
        ctx.save(); ctx.translate(-20, -34); ctx.scale(1, 0.3); lightBeam(ctx, 0, 0, st.time * 0.9, 70, 16, 0.55); ctx.restore();
        circle(ctx, -20, -34, 5.5); flat(ctx, PALE, 1.4); glow(ctx, -20, -34, 10, '#fff1b0', 0.8);
      },
    },
    { // Golden Age: a laurel halo of gold behind it, coins circling, a chest at its feet
      behind(ctx, d, S) { chest(ctx, -20, 13, 12, true); coins(ctx, 20, 12, 6); },
      back(ctx, st, d, S) {
        ctx.save(); ctx.translate(0, -18);
        for (const k of [-1, 1]) for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + k * (0.4 + i * 0.36); ctx.beginPath(); ctx.ellipse(Math.cos(a) * 20, Math.sin(a) * 20, 4, 1.8, a + k * 0.8, 0, TAU); flat(ctx, GOLD, 0.9); }
        ctx.restore();
        orbit(5, 0, -30, 22, 5, st.time, 1.2, 0, (x, y, i, s) => { ctx.beginPath(); ctx.ellipse(x, y, 3 * Math.abs(Math.cos(st.time * 3 + i)) + 0.6, 3, 0, 0, TAU); flat(ctx, GOLD, 0.9); });
      },
    },
  ],
  // The Snare lies on the road (drawn with the ground): its tier 5s stay low.
  snare: [
    { // Thornwall: a ring of iron briars standing round the grate
      back(ctx, st, d, S) { for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; briar(ctx, Math.cos(a) * 22, 11 + Math.sin(a) * 9, 9 + (i % 2) * 3, Math.cos(a) * 0.4, i % 3 === 0); } },
    },
    { // Constellation: five lamp-stars round it on the road, joined by lines of light
      back(ctx, st, d, S) {
        const pts = [];
        for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.3; pts.push([Math.cos(a) * 26, 11 + Math.sin(a) * 10]); }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,246,200,${0.5 + Math.sin(st.time * 3) * 0.2})`; ctx.lineWidth = 1.3;
        ctx.beginPath(); pts.forEach((p, i) => { const q = pts[(i + 2) % 5]; ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }); ctx.stroke();
        ctx.restore();
        for (const [x, y] of pts) lampSeed(ctx, x, y, 0.9, 1);
      },
    },
    { // Seal of Dawn: a great seal of runes turning on the road round it
      back(ctx, st, d, S) { runeCircle(ctx, 0, 11, 30, 11, st.time, '#fff6d0', 1); chainRing(ctx, 0, 11, 22, 8, 10, '#fff6d0', st.time); },
    },
  ],
  moth: [
    { // False Moon: a pale moon rises behind the lantern
      back(ctx, st, d, S) {
        glow(ctx, -10, -26, 24, '#fff6c0', 0.35);
        circle(ctx, -10, -26, 13); flat(ctx, '#f4f0dc', 1.6);
        for (const [x, y, r] of [[-15, -30, 3], [-6, -22, 2.4], [-4, -31, 1.8], [-14, -20, 1.6]]) { circle(ctx, x, y, r); ctx.fillStyle = 'rgba(180,170,150,0.55)'; ctx.fill(); }
      },
    },
    { // Amber Trap: a great drop of amber hangs beside it, a moth caught inside
      behind(ctx, d, S) { line(ctx, [[-20, 13], [-20, -26], [-12, -34]], S.dark, 1.6); },
      back(ctx, st, d, S) {
        const y = -24 + Math.sin(st.time * 1.2) * 1.2;
        line(ctx, [[-12, -34], [-12, y - 9]], '#c89a5a', 0.8);
        ctx.beginPath(); ctx.moveTo(-12, y - 10); ctx.quadraticCurveTo(-3, y, -12, y + 9); ctx.quadraticCurveTo(-21, y, -12, y - 10); flat(ctx, 'rgba(240,160,40,0.9)', 1.4);
        glow(ctx, -12, y, 10, '#ffb030', 0.45);
        ctx.save(); ctx.translate(-12, y); ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.ellipse(-2, 0, 2.4, 1.4, 0.4, 0, TAU); ctx.ellipse(2, 0, 2.4, 1.4, -0.4, 0, TAU); ctx.fill(); ctx.restore();
      },
    },
    { // Moth Queen: a great moth with eyed wings spread behind the lantern
      back(ctx, st, d, S) {
        const f = 1 + Math.sin(st.time * 3) * 0.08;
        for (const k of [-1, 1]) {
          ctx.save(); ctx.translate(4, -18); ctx.scale(k * f, 1);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -20, 30, -14); ctx.quadraticCurveTo(26, -2, 10, 2); ctx.quadraticCurveTo(22, 8, 18, 18); ctx.quadraticCurveTo(6, 14, 0, 4); ctx.closePath(); flat(ctx, '#d8c8f0', 1.4);
          circle(ctx, 18, -10, 4); flat(ctx, '#ffe03a', 1); circle(ctx, 18, -10, 1.8); ctx.fillStyle = INK; ctx.fill();
          ctx.restore();
        }
        ctx.beginPath(); ctx.ellipse(4, -16, 2.6, 8, 0, 0, TAU); flat(ctx, '#7a6a90', 1.2);
        for (const k of [-1, 1]) line(ctx, [[4, -23], [4 + k * 5, -31]], '#7a6a90', 0.8);
      },
    },
  ],
  wander: [
    { // Falling Sky: stars falling round it, each leaving a short trail
      back(ctx, st, d, S) {
        for (let i = 0; i < 4; i++) {
          const u = (st.time * 0.7 + i / 4) % 1, x = -22 + i * 15, y = -38 + u * 34;
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(216,184,255,${0.7 * (1 - u)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6, y - 10); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
          star(ctx, x, y, 3.2, 1.3, 5, st.time * 3); flat(ctx, '#f4ecff', 0.8);
        }
      },
    },
    { // Starhost: a ring of five small stars wheeling round it
      back(ctx, st, d, S) { orbit(5, 0, -12, 24, 8, st.time, 1.1, -1, (x, y) => { glow(ctx, x, y, 6, DMG.arcane.core, 0.5); star(ctx, x, y, 3.6, 1.5, 5, st.time); flat(ctx, '#f4ecff', 0.9); }); },
      front(ctx, st, d, S) { orbit(5, 0, -12, 24, 8, st.time, 1.1, 1, (x, y) => { if (Math.abs(x) < 10) return; glow(ctx, x, y, 6, DMG.arcane.core, 0.5); star(ctx, x, y, 3.6, 1.5, 5, st.time); flat(ctx, '#f4ecff', 0.9); }); },
    },
    { // Dawnbringer: a rising sun of rose light behind it, a great torch in the ground beside
      back(ctx, st, d, S) {
        glow(ctx, 0, -14, 30, DMG.hearth.core, 0.35);
        ctx.save(); ctx.translate(0, -14); ctx.rotate(st.time * 0.3);
        for (let i = 0; i < 10; i++) { ctx.rotate(TAU / 10); poly(ctx, [[17, -1.4], [27, 0], [17, 1.4]]); ctx.fillStyle = 'rgba(255,190,220,0.8)'; ctx.fill(); }
        ctx.restore();
        line(ctx, [[-24, 14], [-24, -22]], S.metal2, 2);
        torchFlame(ctx, -24, -24, 1.4, st.time);
      },
    },
  ],
  vault: [
    { // Dragon's Hoard: a hoard of gold heaped round it, a little gold dragon curled on top
      behind(ctx, d, S) { coins(ctx, -22, 12, 7); coins(ctx, 20, 12, 8); chest(ctx, 24, 6, 11, true); },
      back(ctx, st, d, S) {
        const y = -14;
        ctx.beginPath(); ctx.moveTo(-14, y + 6); ctx.quadraticCurveTo(-4, y - 6, 8, y); ctx.quadraticCurveTo(14, y + 6, 4, y + 6); ctx.quadraticCurveTo(-4, y + 4, -14, y + 6); flat(ctx, GOLD, 1.3);
        circle(ctx, 10, y - 2, 4); flat(ctx, GOLD, 1.1); circle(ctx, 11.5, y - 3, 0.9); ctx.fillStyle = INK; ctx.fill();
        for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-2, y); ctx.lineTo(-2 + k * 6, y - 9 + Math.sin(st.time * 3) * 1.5); ctx.lineTo(4, y - 1); flat(ctx, '#ffe08a', 1); }
        twinkle(ctx, -18, 4, 2.4, Math.sin(st.time * 2.2) * 1.4);
      },
    },
    { // Ember Tide: streams of embers spiral in to it from all round
      back(ctx, st, d, S) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < (DETAIL.q >= 2 ? 10 : 5); i++) {
          const u = (st.time * 0.5 + i / 10) % 1, a = i * 2.4 + u * 4, R = 34 * (1 - u);
          circle(ctx, Math.cos(a) * R, -6 + Math.sin(a) * R * 0.45, 1.8); ctx.fillStyle = `rgba(255,170,90,${0.9 * u + 0.1})`; ctx.fill();
        }
        ctx.restore();
        emberWisp(ctx, -22, -24, st.time, 1.1); emberWisp(ctx, 22, -18, st.time + 1, 1.1);
      },
    },
    { // Second Heartfire: a second heart-flame floats above it, warm and rose
      back(ctx, st, d, S) {
        const y = -18 + Math.sin(st.time * 2) * 1.2, p = 1 + Math.sin(st.time * 4) * 0.06, X = -22;
        ctx.save(); ctx.translate(X, 0);
        glow(ctx, 0, y, 22 * p, DMG.hearth.core, 0.55);
        ctx.save(); ctx.translate(0, y); ctx.scale(p, p);
        ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-11, 0, -7, -9, 0, -4); ctx.bezierCurveTo(7, -9, 11, 0, 0, 8); flat(ctx, '#ff7eb6', 1.4);
        ctx.beginPath(); ctx.moveTo(0, 4); ctx.bezierCurveTo(-5, 0, -3, -4, 0, -1.5); ctx.bezierCurveTo(3, -4, 5, 0, 0, 4); ctx.fillStyle = '#ffe0ee'; ctx.fill();
        ctx.restore();
        ctx.restore();
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
const SX = -44, SY = -56, SW = 88, SH = 78, SK = 2;   // ward units covered by a still, and its px per unit
const STILL_ST = { time: 0.7, ang: 0.6, recoil: 0, pulse: 0, fire: 0, pop: 0, id: 0 };
function still(type, P, d, skin) {
  const key = `${skin}|${type}|${P.main}`;
  let c = stills.get(key);
  if (c !== undefined) return c;
  c = newCanvas();
  if (c) {
    c.width = SW * SK; c.height = SH * SK;
    const g = c.getContext('2d');
    g.setTransform(SK, 0, 0, SK, -SX * SK, -SY * SK);
    const q = DETAIL.q; DETAIL.q = 2;
    sigil5(g, d, STILL_ST.time, type === 'snare' ? 32 : 27);
    const f = form(type, P);
    if (f && f.back) f.back(g, STILL_ST, d, SKIN5[skin] || SKIN5.kindling);
    DETAIL.q = q;
  }
  stills.set(key, c);
  return c;
}
export function clearAscendCache() { stills.clear(); }
export function ascendBack(ctx, type, P, st, d, skin) {
  if (DETAIL.q < 2) { const c = still(type, P, d, skin); if (c) { ctx.drawImage(c, SX, SY, SW, SH); return; } }
  const f = form(type, P);
  sigil5(ctx, d, st.time, type === 'snare' ? 32 : 27);
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
