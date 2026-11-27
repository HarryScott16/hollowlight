// Mock-up art for six new ward concepts (docs/new-wards-2.md), in BOTH skins, built on the game's
// own ward kit (public/js/render/wards/*), so they follow the same units, tier ladder, notches and
// pips, crowns, tier 5 sigil and diadem, body-and-face rule and height caps as the real wards.
// Documentation only: nothing here is imported by the game. registerNewWards() adds the six to the
// game's skin tables *in this process only*, so tools like drawWard() can draw them.
//
//   avatar      Heartfire Avatar   hero        Radiant  Solar / Orrery / Eclipse
//   choir       Astral Choir       hero        Arcane   Hymn / Chorus / Requiem
//   ferry       Ferrylight         water       Kinetic  Harpooner / Flotilla / Lighthouse Barge
//   undertow    The Undertow       water       Frost    Maelstrom / Tidecaller / Abyss
//   lampwright  Lampwright         road-maker  Fire     Tallow / Wickstorm / Beaconwax
//   runewright  Runewright         road-maker  Blast    Ember Rune / Frost Rune / Seal Rune
//
// Each art object has the game's interface: body (static, cached), back / front (live), muzzle,
// self (the body box the gear must not cover). A tier 5 is drawn as tier 4 (P.mt = 4, P.t5) plus
// its second form: static parts at the start of body(), moving parts in back(); wardArt.js adds
// the tier 5 ground sigil and the diadem for every ward.
import { FACE, gearInFront, DMG, INK, TAU, WARD_DMG, circle, poly, rrect, star, ink, flat, line, glow, notches, pips, glyph, aim, shade, rgba, crown, groundAura, twinkle, risingMotes } from '../../../public/js/render/wards/kit.js';
import { KINDLINGS, hearthstone, eyes, tuft, WAX, WAX2, WOOD, BRONZE } from '../../../public/js/render/wards/kindlings.js';
import { LANTERNS, plinth, pane, roof, IRON, IRON2, BRASS } from '../../../public/js/render/wards/lanterns.js';
import { GOLD, COPPER, sunDisc, gyro, torchFlame, beam, chainRing, runeCircle, emberWisp, orbitSparks, smokePuffs } from '../../../public/js/render/wards/parts.js';

export const NEW_WARDS = {
  avatar: { name: 'Heartfire Avatar', family: 'Avatar (hero)', dmg: 'radiant', cost: 3200, paths: ['Solar', 'Orrery', 'Eclipse'], t5: ['Zenith', 'Grand Orrery', 'Syzygy'], water: false },
  choir: { name: 'Astral Choir', family: 'Choir (hero)', dmg: 'arcane', cost: 3000, paths: ['Hymn', 'Chorus', 'Requiem'], t5: ['Great Bell', 'Heavenly Host', 'Last Requiem'], water: false },
  ferry: { name: 'Ferrylight', family: 'Vessel (water)', dmg: 'kinetic', cost: 400, paths: ['Harpooner', 'Flotilla', 'Lighthouse Barge'], t5: ['Heartline', 'Lantern Armada', 'Harbour Star'], water: true },
  undertow: { name: 'The Undertow', family: 'Spring (water)', dmg: 'frost', cost: 450, paths: ['Maelstrom', 'Tidecaller', 'Abyss'], t5: ['Great Maelstrom', 'Tidal Throne', 'Drowned Deep'], water: true },
  lampwright: { name: 'Lampwright', family: 'Thrower (road-maker)', dmg: 'fire', cost: 225, paths: ['Tallow', 'Wickstorm', 'Beaconwax'], t5: ['Undying Taper', 'Thousand Wicks', 'Eternal Vigil'], water: false },
  runewright: { name: 'Runewright', family: 'Carver (road-maker)', dmg: 'blast', cost: 325, paths: ['Ember Rune', 'Frost Rune', 'Seal Rune'], t5: ['Ember Script', 'Winter Script', 'Seal of Ages'], water: false },
};

const WHITE = '#ffffff';
const lit = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
const ring = (ctx, x, y, rx, ry, col, w = 1.4, a0 = 0, a1 = TAU) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, a0, a1); ctx.strokeStyle = INK; ctx.lineWidth = w + 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
const softRing = (ctx, x, y, rx, ry, col, a, w = 1.6) => lit(ctx, () => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.strokeStyle = rgba(col, a); ctx.lineWidth = w; ctx.stroke(); });
function orbit(n, cx, cy, rx, ry, t, speed, half, fn) {
  for (let i = 0; i < n; i++) {
    const a = t * speed + (i / n) * TAU, s = Math.sin(a);
    if (half && (s >= 0) !== (half > 0)) continue;
    fn(cx + Math.cos(a) * rx, cy + s * ry, i, s);
  }
}
function starMote(ctx, x, y, r, col = '#fff6c0') { glow(ctx, x, y, r * 3, DMG.radiant.core, 0.6); star(ctx, x, y, r, r * 0.42, 5); flat(ctx, col, 1); }
// A musical note (the Choir's): a filled head on a stem with a flag.
function note(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.ellipse(0, 0, 2.4, 1.7, -0.4, 0, TAU); flat(ctx, col, 1);
  line(ctx, [[2, -0.6], [2, -7]], col, 0.9);
  ctx.beginPath(); ctx.moveTo(2, -7); ctx.quadraticCurveTo(5, -5.5, 4.4, -3); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}
function candle(ctx, x, y, h, w = 2.6, t = 0, flame = true) {
  rrect(ctx, x - w / 2, y - h, w, h, 0.8); ink(ctx, WAX, 1, x - w / 2, x + w / 2);
  if (flame && !FACE.skip) { glow(ctx, x, y - h - 2, 5, DMG.fire.core, 0.5); ctx.beginPath(); ctx.ellipse(x, y - h - 1.8 + Math.sin(t * 9 + x) * 0.2, 1.1, 2.2, 0, 0, TAU); flat(ctx, '#ffb070', 0.6); }
}
// Water under a water ward (live, drawn before the bob): rings of ripples, a little foam.
function waterRipples(ctx, w, t, kind = 'water') {
  const col = kind === 'lava' ? '#ffcf6a' : kind === 'ice' ? '#e8f8ff' : '#cdefff';
  ctx.fillStyle = kind === 'lava' ? 'rgba(80,20,10,0.35)' : 'rgba(10,40,60,0.35)';
  ctx.beginPath(); ctx.ellipse(1, 13, w * 0.55, w * 0.17, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 2; i++) {
    const u = (t * 0.45 + i * 0.5) % 1;
    ctx.globalAlpha = 0.7 * (1 - u);
    ctx.strokeStyle = col; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, 13, w * 0.5 + u * 12, w * 0.15 + u * 3.5, 0, 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
// Rings that pulse out over the ground (the Choir's song, the Undertow's pull).
function pulseRings(ctx, y, R, t, col, n = 2, speed = 0.6) {
  for (let i = 0; i < n; i++) { const u = (t * speed + i / n) % 1; softRing(ctx, 0, y, 8 + u * R, (8 + u * R) * 0.36, col, 0.55 * (1 - u), 1.6); }
}

// =================================================================================================
// HEARTFIRE AVATAR (hero, Radiant). Kindlings: a towering sun-spirit in an ivory robe, a sun halo
// behind its head, a mote of light in its raised hand. Lanterns: a great golden chandelier on a
// gilded stand, its centre lantern the light. Solar: the halo becomes a burning sun disc and the hand
// a lens-staff (a beam). Orrery: stars orbit it, then a brass armillary. Eclipse: the halo darkens to
// an eclipse with a corona; tethers of light run to the ground (the wards it draws on).
// Tier 5: Zenith (a great sun rising behind), Grand Orrery (a huge armillary sphere), Syzygy (a
// black sun with three aligned moons).
const AV = { robe: '#f6e7b8', robe2: '#e6cf8a', sash: '#c8963a', dark: '#2a1e3e', corona: '#fff0a0' };
function avatarForm(ctx, P, S, live, t = 0) {
  const { might, many, craft } = P, cy = -36;
  if (might) {
    if (!live) { circle(ctx, 0, cy, 19); flat(ctx, '#ffd84a', 1.6); circle(ctx, 0, cy, 13); ctx.fillStyle = '#fff1a0'; ctx.fill(); }
    else { glow(ctx, 0, cy, 40, DMG.radiant.core, 0.45); sunDisc(ctx, 0, cy, 22, t, 16); }
  } else if (many) {
    if (live) {
      ctx.save(); ctx.translate(0, cy + 4);
      for (const [rx, ry, tilt] of [[32, 11, 0.35], [32, 11, -0.35], [27, 25, 0]]) { ctx.save(); ctx.rotate(tilt + (tilt ? t * 0.1 : 0)); ring(ctx, 0, 0, rx, ry, S === 'lantern' ? BRASS : GOLD, 1.4); ctx.restore(); }
      orbit(5, 0, 0, 32, 11, t, 0.7, 0, (x, y) => starMote(ctx, x, y, 3.2));
      ctx.restore();
    } else { circle(ctx, 0, cy + 4, 4); flat(ctx, GOLD, 1.2); }
  } else if (craft) {
    if (!live) { circle(ctx, 0, cy, 20); flat(ctx, '#140e22', 1.6); }
    else {
      lit(ctx, () => { for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + t * 0.2, L = 26 + Math.sin(t * 3 + i) * 1.5; ctx.strokeStyle = rgba(AV.corona, 0.55); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 21, cy + Math.sin(a) * 21); ctx.lineTo(Math.cos(a) * L, cy + Math.sin(a) * L); ctx.stroke(); } });
      ring(ctx, 0, cy, 21, 21, AV.corona, 1.6);
      for (const k of [-1, 0, 1]) { circle(ctx, k * 32, cy + 20 + Math.abs(k) * -10, 3.2); flat(ctx, '#d8d0f0', 1); }
    }
  }
}
const kAvatar = {
  breathe: true,
  self: () => [-8, -30, 8, 4],
  body(ctx, P, d) {
    const { might, many, craft, mt, t5 } = P, hy = -22;
    if (t5) avatarForm(ctx, P, 'kindling', false);
    hearthstone(ctx, 36, P, d);
    // the halo disc behind the head
    const hr = 12 + (might ? mt : 0);
    if (craft && mt >= 3) { circle(ctx, 0, hy, hr + 1); flat(ctx, AV.dark, 1.4); ring(ctx, 0, hy, hr + 1, hr + 1, AV.corona, 1.2); }
    else { circle(ctx, 0, hy, hr); flat(ctx, might && mt >= 3 ? '#ffd84a' : '#fff1b0', 1.4); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; line(ctx, [[Math.cos(a) * (hr - 3), hy + Math.sin(a) * (hr - 3)], [Math.cos(a) * (hr - 1), hy + Math.sin(a) * (hr - 1)]], '#e8b830', 0.6); } }
    if (craft && mt >= 2 && mt < 3) ring(ctx, 0, hy, hr + 2, hr + 2, '#3a2a58', 1.6);
    // the robe
    ctx.beginPath(); ctx.moveTo(-14, 10); ctx.quadraticCurveTo(-12, -6, -6, -14); ctx.lineTo(6, -14); ctx.quadraticCurveTo(12, -6, 14, 10); ctx.closePath();
    ink(ctx, craft && mt >= 2 ? '#d8c8e8' : AV.robe, 2, -14, 14);
    line(ctx, [[-9, -4], [9, 4]], might && mt >= 2 ? GOLD : AV.sash, 1.6);   // the sash
    if (might && mt >= 2) { star(ctx, 0, -8, 3.6, 1.6, 8); flat(ctx, GOLD, 1); }   // sun brooch
    if (many && mt >= 2) for (const x of [-7, 7]) { star(ctx, x, 4, 2.2, 0.9, 5); flat(ctx, '#fff6c0', 0.8); }
    // arms: the left open, the right raised with the mote
    line(ctx, [[-6, -11], [-14, -4], [-16, -8]], AV.robe2, 3);
    line(ctx, [[6, -11], [13, -14]], AV.robe2, 3);
    circle(ctx, -16, -8, 2.4); flat(ctx, WAX, 1.1);
    // the head
    circle(ctx, 0, hy, 8); ink(ctx, WAX, 1.8, -8, 8);
    if (might && mt >= 2) { rrect(ctx, -8, hy - 5, 16, 2.6, 1); flat(ctx, GOLD, 1); }
    if (mt >= 4) crown(ctx, 0, hy - 9, d, 1.05);
    return mt >= 4 ? -40 : -36;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt, t5 } = P, t = st.time, hy = -22;
    if (t5) avatarForm(ctx, P, 'kindling', true, t);
    if (mt >= 4 && !t5) groundAura(ctx, d, t, 26);
    if (might && mt >= 3) sunDisc(ctx, 0, hy, 13 + mt * 0.5, t, 14);
    if (craft && mt >= 3) lit(ctx, () => { for (const x of [-20, 0, 20]) { ctx.strokeStyle = rgba(AV.corona, 0.35); ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.lineDashOffset = -t * 12; ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(x * 1.6, 12); ctx.stroke(); ctx.setLineDash([]); } });
    if (many && mt >= 3) { gyro(ctx, 0, -8, 21, 7, 0.15, -1, GOLD, 1.4); }
    if (many && mt >= 2) orbit(mt >= 4 ? 6 : mt >= 3 ? 4 : 2, 0, -8, 21, 7, t, 1.1, -1, (x, y) => starMote(ctx, x, y, 2.6));
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, hy = -22;
    if (many && mt >= 3) gyro(ctx, 0, -8, 21, 7, 0.15, 1, GOLD, 1.4);
    if (many && mt >= 2) orbit(mt >= 4 ? 6 : mt >= 3 ? 4 : 2, 0, -8, 21, 7, t, 1.1, 1, (x, y) => starMote(ctx, x, y, 2.6));
    // the mote (or lens-staff) in the raised hand
    const [hx, hyy] = [14, -15];
    if (might && mt >= 3) { line(ctx, [[hx, hyy + 12], [hx, hyy - 8]], GOLD, 1.6); ring(ctx, hx, hyy - 11, 4.2, 4.2, GOLD, 1.4); glow(ctx, hx, hyy - 11, 10, DMG.radiant.core, 0.7); }
    else { glow(ctx, hx, hyy - 2, 9 + mt, craft && mt >= 3 ? AV.corona : DMG.radiant.core, 0.7); circle(ctx, hx, hyy - 2, 2.6 + mt * 0.3); flat(ctx, craft && mt >= 3 ? '#2a1e3e' : '#fff6c0', 1); }
    circle(ctx, hx - 1, hyy + 1, 2.4); flat(ctx, WAX, 1.1);
    eyes(ctx, 0, hy + 1, st, { sep: 3.2, r: 2.6, brow: might ? 'stern' : 'soft', iris: craft && mt >= 3 ? '#5a1fb0' : '#b08a00' });
    if (mt < 4) tuft(ctx, 0, hy - 7, 0.7, d, t);
  },
  muzzle(P, ang, out) { out[0] = 14; out[1] = P.might && P.mt >= 3 ? -26 : -17; return out; },
};
// Lanterns: a golden chandelier. A gilded stand, a ring of arms each holding a small lamp, and the
// great centre lantern (the light) with a finial.
const LA = { gold: '#d9a53a', gold2: '#a8782a' };
function chandelierArms(ctx, n, y, rx, ry, P, half, t) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + 0.3, s = Math.sin(a);
    if ((s >= 0) !== (half > 0)) continue;
    const x = Math.cos(a) * rx, yy = y + s * ry;
    line(ctx, [[0, y], [x * 0.7, yy + 2], [x, yy]], LA.gold, 1.3);
    rrect(ctx, x - 2.6, yy - 6, 5.2, 6, 1.2); flat(ctx, LA.gold2, 1);
    if (!FACE.skip) { glow(ctx, x, yy - 3, 5, DMG.radiant.core, 0.5); rrect(ctx, x - 1.4, yy - 5, 2.8, 4, 0.8); ctx.fillStyle = '#fff3a0'; ctx.fill(); }
  }
}
const lAvatar = {
  self: () => [-7, -33, 7, -14],
  body(ctx, P, d) {
    const { might, many, craft, mt, t5 } = P;
    if (t5) avatarForm(ctx, P, 'lantern', false);
    plinth(ctx, 34, P, d, '#6a5030', 'brass');
    poly(ctx, [[-3, 7], [3, 7], [2, -12], [-2, -12]]); ink(ctx, LA.gold, 1.6, -3, 3);
    for (const y of [0, -6]) { ctx.beginPath(); ctx.ellipse(0, y, 3.6, 1.4, 0, 0, TAU); flat(ctx, LA.gold2, 1); }
    ctx.beginPath(); ctx.ellipse(0, -13, 15 + (many ? mt : 0), 4.5, 0, 0, TAU); ink(ctx, LA.gold, 1.8, -16, 16);   // the chandelier ring
    if (craft && mt >= 3) { circle(ctx, 0, -22, 13); flat(ctx, AV.dark, 1.4); ring(ctx, 0, -22, 13, 13, AV.corona, 1.2); }
    rrect(ctx, -8, -30, 16, 17, 3); ink(ctx, might && mt >= 3 ? '#e0b84a' : LA.gold2, 2, -8, 8);   // the centre lantern
    roof(ctx, 0, -30, 18, 6, LA.gold);
    if (mt < 4) { circle(ctx, 0, -37, 1.2); flat(ctx, GOLD, 0.9); }
    if (might && mt >= 2) for (const s of [-1, 1]) { poly(ctx, [[s * 8, -28], [s * 13, -25], [s * 8, -17]]); flat(ctx, GOLD, 1.1); }
    if (mt >= 4) crown(ctx, 0, -36, d, 0.95);
    return mt >= 4 ? -43 : -39;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt, t5 } = P, t = st.time, n = 4 + (many ? mt : 0);
    if (t5) avatarForm(ctx, P, 'lantern', true, t);
    if (mt >= 4 && !t5) groundAura(ctx, d, t, 26);
    if (might && mt >= 3) sunDisc(ctx, 0, -22, 13 + mt * 0.5, t, 14);
    if (craft && mt >= 3) lit(ctx, () => { for (const x of [-20, 0, 20]) { ctx.strokeStyle = rgba(AV.corona, 0.35); ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.lineDashOffset = -t * 12; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(x * 1.6, 12); ctx.stroke(); ctx.setLineDash([]); } });
    chandelierArms(ctx, n, -13, 15 + (many ? mt : 0), 4.5, P, -1, t);
    if (many && mt >= 2) orbit(mt >= 4 ? 6 : mt >= 3 ? 4 : 2, 0, -22, 22, 7, t, 1.1, -1, (x, y) => starMote(ctx, x, y, 2.6));
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, n = 4 + (many ? mt : 0);
    chandelierArms(ctx, n, -13, 15 + (many ? mt : 0), 4.5, P, 1, t);
    if (many && mt >= 2) orbit(mt >= 4 ? 6 : mt >= 3 ? 4 : 2, 0, -22, 22, 7, t, 1.1, 1, (x, y) => starMote(ctx, x, y, 2.6));
    if (!FACE.skip) { pane(ctx, 0, -21.5, 11, 13, d); glow(ctx, 0, -21.5, 14 + mt * 1.5, craft && mt >= 3 ? AV.corona : DMG.radiant.core, 0.45 + Math.sin(t * 7) * 0.05); }
    if (might && mt >= 3) { ring(ctx, 13, -31, 4.2, 4.2, GOLD, 1.4); glow(ctx, 13, -31, 9, DMG.radiant.core, 0.6); }
  },
  muzzle(P, ang, out) { if (P.might && P.mt >= 3) { out[0] = 13; out[1] = -31; } else { out[0] = Math.cos(ang) * 8; out[1] = -21.5; } return out; },
};

// =================================================================================================
// ASTRAL CHOIR (hero, Arcane). Kindlings: three robed singers on a round dais, the middle one (the
// face anchor) bigger, notes rising. Lanterns: a carillon: a ring of chiming glass bell-lanterns on
// posts round a centre lantern. Hymn: the middle singer grows, a crescendo halo of arcs, then a great
// bell. Chorus: more singers (5, then 7, in choir stalls). Requiem: dark hoods, a wisp lantern, wisps
// rising. Tier 5: Great Bell (a huge bell of light behind), Heavenly Host (tiers of tiny singers on
// arcs of stars), Last Requiem (a spiral of freed wisps rising through an arch of light).
const CH = { robe: '#3a4a88', robe2: '#2a3668', trim: '#c8b8ff', hood: '#2a2040', bell: '#c8d8ff' };
function singer(ctx, x, y, s, P, hood, st, face = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-5, -10, -3.5, -12); ctx.lineTo(3.5, -12); ctx.quadraticCurveTo(5, -10, 6, 0); ctx.closePath(); ink(ctx, hood ? CH.hood : CH.robe, 1.6, -6, 6);
  rrect(ctx, -4.5, -12.5, 9, 2.4, 1); flat(ctx, CH.trim, 0.8);   // collar
  circle(ctx, 0, -16, 4.6); ink(ctx, WAX, 1.4, -4.6, 4.6);
  if (hood) { ctx.beginPath(); ctx.arc(0, -16, 5.8, Math.PI * 0.95, Math.PI * 2.05); ctx.lineTo(5.4, -12); ctx.lineTo(-5.4, -12); ctx.closePath(); flat(ctx, CH.hood, 1.2); circle(ctx, 0, -15.6, 3.6); ctx.fillStyle = WAX; ctx.fill(); }
  if (face && !FACE.skip) {
    for (const k of [-1, 1]) { circle(ctx, k * 1.7, -17, 0.8); ctx.fillStyle = INK; ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(0, -14.3, 1.1, 1.4, 0, 0, TAU); ctx.fillStyle = '#5a2a40'; ctx.fill();   // singing
  }
  ctx.restore();
}
function choirSpots(P) { // side singers [x, y, scale, behind]
  const { many, mt } = P;
  if (many && mt >= 4) return [[-12, 0, 0.8, 1], [12, 0, 0.8, 1], [-20, 7, 0.85, 0], [20, 7, 0.85, 0], [-24, -1, 0.7, 1], [24, -1, 0.7, 1]];
  if (many && mt >= 2) return [[-12, 1, 0.8, 1], [12, 1, 0.8, 1], [-19, 7, 0.85, 0], [19, 7, 0.85, 0]];
  return [[-15, 7, 0.85, 0], [15, 7, 0.85, 0]];
}
function choirForm(ctx, P, S, live, t = 0) {
  const { might, many, craft } = P;
  if (might) {
    const bell = () => { ctx.beginPath(); ctx.moveTo(-30, -10); ctx.quadraticCurveTo(-28, -58, 0, -60); ctx.quadraticCurveTo(28, -58, 30, -10); ctx.quadraticCurveTo(0, -4, -30, -10); ctx.closePath(); };
    if (!live) { bell(); flat(ctx, S === 'lantern' ? 'rgba(150,160,215,0.55)' : 'rgba(176,184,240,0.55)', 1.8); bell(); ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-30, -62, 14, 60); ctx.restore(); ring(ctx, 0, -60, 4, 3, GOLD, 1.4); }
    else { glow(ctx, 0, -32, 44, DMG.arcane.core, 0.35 + Math.sin(t * 2) * 0.08); pulseRings(ctx, 11, 40, t, DMG.arcane.core, 3, 0.5); }
  } else if (many) {
    if (!live) for (const [r, n, y] of [[34, 7, -24], [26, 5, -40]]) for (let i = 0; i < n; i++) { const a = Math.PI + (i / (n - 1)) * Math.PI; singer(ctx, Math.cos(a) * r, y + Math.sin(a) * 8 + 8, 0.55, P, false, null, false); }
    else lit(ctx, () => { for (const [rx, y] of [[38, -16], [30, -32], [22, -46]]) { ctx.strokeStyle = rgba(DMG.arcane.core, 0.4); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, y, rx, 8, 0, Math.PI, TAU); ctx.stroke(); } for (let i = 0; i < 9; i++) twinkle(ctx, Math.cos(i * 1.7) * 34, -20 - (i % 3) * 14, 2.4, Math.sin(t * 2 + i) * 1.4); });
  } else if (craft) {
    if (!live) { ctx.beginPath(); ctx.moveTo(-28, 8); ctx.lineTo(-28, -40); ctx.quadraticCurveTo(0, -66, 28, -40); ctx.lineTo(28, 8); ctx.lineTo(21, 8); ctx.lineTo(21, -38); ctx.quadraticCurveTo(0, -57, -21, -38); ctx.lineTo(-21, 8); ctx.closePath(); flat(ctx, S === 'lantern' ? '#4a4a70' : '#5a5088', 1.6); }
    else { glow(ctx, 0, -34, 30, '#e8d8ff', 0.4); for (let i = 0; i < 8; i++) { const u = (t * 0.3 + i / 8) % 1, a = u * TAU * 1.5 + i; emberWisp(ctx, Math.cos(a) * (8 + u * 14), 4 - u * 58, t + i, 0.75); } }
  }
}
const kChoir = {
  breathe: true,
  self: () => [-6, -24, 6, 2],
  body(ctx, P, d) {
    const { might, many, craft, mt, t5 } = P;
    if (t5) choirForm(ctx, P, 'kindling', false);
    hearthstone(ctx, 40, P, d);
    ctx.beginPath(); ctx.ellipse(0, 8, 17, 3.6, 0, 0, TAU); ink(ctx, '#4a5070', 1.4, -17, 17);   // the dais
    for (const [x, y, s, b] of choirSpots(P)) if (b) singer(ctx, x, y, s, P, craft && mt >= 2, null, false);
    if (might && mt >= 2) for (const r of [11, 14]) ring(ctx, 0, -14, r, r * 0.9, CH.trim, 1, Math.PI * 1.05, Math.PI * 1.95);
    const s = 1 + (might ? mt * 0.04 : 0);
    singer(ctx, 0, 6, s, P, craft && mt >= 2, null, false);
    if (might && mt >= 3) { ctx.beginPath(); ctx.moveTo(-6, -16 * s - 6); ctx.quadraticCurveTo(-6, -16 * s - 15, 0, -16 * s - 15); ctx.quadraticCurveTo(6, -16 * s - 15, 6, -16 * s - 6); ctx.closePath(); flat(ctx, CH.bell, 1.2); }
    for (const [x, y, sc, b] of choirSpots(P)) if (!b) singer(ctx, x, y, sc, P, craft && mt >= 2, null, false);
    if (craft && mt >= 2) { line(ctx, [[18, 10], [18, -10]], WOOD, 1.2); rrect(ctx, 15, -16, 6, 7, 1.5); flat(ctx, '#2a2a40', 1); }
    if (mt >= 4) crown(ctx, 0, might ? -35 : -29, d, 0.95);
    return mt >= 4 ? (might ? -42 : -36) : -30;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt, t5 } = P, t = st.time;
    if (t5) choirForm(ctx, P, 'kindling', true, t);
    pulseRings(ctx, 11, 26 + mt * 4, t, DMG.arcane.core, 2);
    if (mt >= 4 && !t5) glow(ctx, 0, -10, 30, DMG.arcane.core, 0.25);
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, s = 1 + (might ? mt * 0.04 : 0);
    if (!FACE.skip) for (const [x, y, sc] of choirSpots(P)) { circle(ctx, x - 1.4 * sc, y - 17 * sc, 0.7 * sc); circle(ctx, x + 1.4 * sc, y - 17 * sc, 0.7 * sc); ctx.fillStyle = INK; ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y - 14.3 * sc, 0.9 * sc, 1.2 * sc, 0, 0, TAU); ctx.fillStyle = '#5a2a40'; ctx.fill(); }
    const nN = 2 + (many ? mt : 0) + (might ? 1 : 0);
    for (let i = 0; i < nN; i++) { const u = (t * 0.5 + i / nN) % 1; ctx.globalAlpha = Math.min(1, (1 - u) * 1.6); note(ctx, Math.sin(i * 2.3 + t) * 16, -12 - u * 16, 0.8, i % 2 ? '#e0c8ff' : DMG.arcane.core); ctx.globalAlpha = 1; }
    if (craft && mt >= 2) { glow(ctx, 18, -12, 7, '#e8d8ff', 0.7); emberWisp(ctx, 18, -12, t, 0.5); }
    if (craft && mt >= 3) for (let i = 0; i < mt; i++) { const a = t * 0.9 + (i / mt) * TAU; emberWisp(ctx, Math.cos(a) * 20, -6 + Math.sin(a) * 6, t + i, 0.6); }
    eyes(ctx, 0, 6 - 17 * s, st, { sep: 2.6 * s, r: 2.1 * s, brow: 'soft', iris: '#5a1fb0' });
    if (!FACE.skip) { ctx.beginPath(); ctx.ellipse(0, 6 - 13.6 * s, 1.5 * s, 1.9 * s, 0, 0, TAU); ctx.fillStyle = '#5a2a40'; ctx.fill(); }
    if (mt < 4 && !(might && mt >= 3)) tuft(ctx, 0, 6 - 21 * s, 0.6, d, t);
  },
  muzzle(P, ang, out) { out[0] = 0; out[1] = -14; return out; },
};
const lChoir = {
  self: () => [-6, -30, 6, -8],
  body(ctx, P, d) {
    const { might, many, craft, mt, t5 } = P;
    if (t5) choirForm(ctx, P, 'lantern', false);
    plinth(ctx, 40, P, d, '#3a3a5a', 'brass');
    ctx.beginPath(); ctx.ellipse(0, 6, 18, 3.4, 0, 0, TAU); ink(ctx, '#4a4a70', 1.4, -18, 18);
    for (const [x, y, s, b] of choirSpots(P)) if (b) bellLantern(ctx, x, y, s, craft && mt >= 2);
    const s = 1 + (might ? mt * 0.04 : 0);
    line(ctx, [[0, 6], [0, -8]], IRON2, 2.2);
    rrect(ctx, -7 * s, -8 - 19 * s, 14 * s, 16 * s, 3); ink(ctx, craft && mt >= 2 ? CH.hood : '#5a6a9a', 2, -7 * s, 7 * s);
    if (might && mt >= 3) { ctx.beginPath(); ctx.moveTo(-9 * s, -8 - 19 * s); ctx.quadraticCurveTo(-8 * s, -8 - 26 * s, 0, -8 - 27 * s); ctx.quadraticCurveTo(8 * s, -8 - 26 * s, 9 * s, -8 - 19 * s); ctx.closePath(); ink(ctx, CH.bell, 1.6, -9, 9); }
    else roof(ctx, 0, -8 - 19 * s, 17 * s, 6, '#4a5480');
    if (might && mt >= 2) for (const r of [12, 15]) ring(ctx, 0, -19, r, r, CH.trim, 1, Math.PI * 1.1, Math.PI * 1.9);
    for (const [x, y, sc, b] of choirSpots(P)) if (!b) bellLantern(ctx, x, y, sc, craft && mt >= 2);
    if (mt >= 4) crown(ctx, 0, might ? -36 : -34, d, 0.95);
    return mt >= 4 ? -43 : -34;
  },
  back: kChoir.back,
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, s = 1 + (might ? mt * 0.04 : 0);
    if (!FACE.skip) for (const [x, y, sc] of choirSpots(P)) { glow(ctx, x, y - 11 * sc, 5, DMG.arcane.core, 0.6); circle(ctx, x, y - 11 * sc, 1.8 * sc); ctx.fillStyle = '#e8d8ff'; ctx.fill(); }
    const nN = 2 + (many ? mt : 0) + (might ? 1 : 0);
    for (let i = 0; i < nN; i++) { const u = (t * 0.5 + i / nN) % 1; ctx.globalAlpha = Math.min(1, (1 - u) * 1.6); note(ctx, Math.sin(i * 2.3 + t) * 18, -14 - u * 16, 0.8, i % 2 ? '#e0c8ff' : DMG.arcane.core); ctx.globalAlpha = 1; }
    if (craft && mt >= 3) for (let i = 0; i < mt; i++) { const a = t * 0.9 + (i / mt) * TAU; emberWisp(ctx, Math.cos(a) * 21, -12 + Math.sin(a) * 6, t + i, 0.6); }
    if (!FACE.skip) { pane(ctx, 0, -8 - 11 * s, 9 * s, 11 * s, d); glow(ctx, 0, -8 - 11 * s, 12, DMG.arcane.core, 0.4 + Math.sin(t * 5) * 0.06); }
  },
  muzzle(P, ang, out) { out[0] = 0; out[1] = -22; return out; },
};
function bellLantern(ctx, x, y, s, hood) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line(ctx, [[0, 0], [0, -6]], IRON2, 1.6);
  ctx.beginPath(); ctx.moveTo(-5, -6); ctx.quadraticCurveTo(-5, -16, 0, -16); ctx.quadraticCurveTo(5, -16, 5, -6); ctx.closePath(); ink(ctx, hood ? CH.hood : CH.bell, 1.4, -5, 5);
  ctx.restore();
}

// =================================================================================================
// FERRYLIGHT (water, Kinetic). Kindlings: a ferry-keeper kindling in an oilskin hat on a log raft,
// a lantern on a mast. Lanterns: a lantern-boat, its cabin the lantern. Harpooner: a hand harpoon,
// then a deck harpoon-gun on a winch (aimed; swings behind when it points across), then a great one.
// Flotilla: little light-rafts on tethers, then a fleet. Lighthouse Barge: a lamp-post on deck, then
// a lighthouse with a sweeping beam. Tier 5: Heartline (a colossal winch-ballista whose chain glows),
// Lantern Armada (a tall ship of light behind), Harbour Star (a great lighthouse behind, twin beams).
const FY = { hat: '#e0b040', coat: '#2e4a6e', log: '#8a5a36', log2: '#6a4226', hull: '#5a3a28', sail: '#f4ecd0' };
function raft(ctx, w, P, d, hull) {
  if (hull) { // a boat hull (Lanterns)
    ctx.beginPath(); ctx.moveTo(-w / 2, 4); ctx.lineTo(w / 2, 4); ctx.quadraticCurveTo(w / 2 - 2, 12, w / 2 - 7, 13); ctx.lineTo(-w / 2 + 7, 13); ctx.quadraticCurveTo(-w / 2 + 2, 12, -w / 2, 4); ctx.closePath(); ink(ctx, FY.hull, 2, -w / 2, w / 2);
    rrect(ctx, -w / 2 + 1, 2.6, w - 2, 2.4, 1); flat(ctx, '#8a6a48', 1);
    notches(ctx, P.mt, 0, 9, w - 12, DMG[d].core, 2.8);
  } else { // a log raft (Kindlings)
    for (let i = 0; i < 4; i++) { rrect(ctx, -w / 2 + 1, 2 + i * 2.6, w - 2, 3, 1.4); ink(ctx, i % 2 ? FY.log : FY.log2, 1.1, -w / 2, w / 2); }
    for (const x of [-w / 2 + 3, w / 2 - 3]) line(ctx, [[x, 2], [x, 12]], '#c8b080', 0.7);
    notches(ctx, P.mt, 0, 13, w - 8, DMG[d].core, 2.4);
  }
  pips(ctx, P.tiers, P.main, w / 2 - 4, 0);
}
function miniRaft(ctx, x, y, s, hull) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (hull) { ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.quadraticCurveTo(6, 4, 3, 5); ctx.lineTo(-3, 5); ctx.quadraticCurveTo(-6, 4, -7, 0); ctx.closePath(); flat(ctx, FY.hull, 1.1); }
  else { rrect(ctx, -7, 0, 14, 4, 1.5); flat(ctx, FY.log, 1.1); }
  line(ctx, [[0, 0], [0, -8]], WOOD, 1);
  rrect(ctx, -2, -12, 4, 5, 1); flat(ctx, IRON, 0.9);
  if (!FACE.skip) { glow(ctx, 0, -9.5, 5, '#fff3c0', 0.6); circle(ctx, 0, -9.5, 1); ctx.fillStyle = '#fff3c0'; ctx.fill(); }
  ctx.restore();
}
function harpoonGun(ctx, x, y, ang, P, recoil) {
  const big = P.mt >= 4 ? 1.3 : 1, L = 16 * big, back = recoil * 3;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.72); ctx.rotate(ang); ctx.scale(big, big);
  rrect(ctx, -6 - back, -3, 16, 6, 2); ink(ctx, '#5a6478', 1.6, -6, 10);
  if (recoil < 0.4) { line(ctx, [[2 - back, 0], [L - back, 0]], '#c8ccd8', 1.4); poly(ctx, [[L + 4 - back, 0], [L - back, -3], [L - back, 3]]); flat(ctx, '#e9eef6', 1); }
  ctx.restore();
  circle(ctx, x, y + 2, 3.2); flat(ctx, '#7a5236', 1.2);   // the winch drum
}
function ferryForm(ctx, P, S, live, t = 0) {
  const { might, many, craft } = P;
  if (might) {
    if (!live) { for (const k of [-1, 1]) line(ctx, [[k * 26, 10], [k * 12, -30]], '#5a6478', 3.4); rrect(ctx, -16, -38, 32, 9, 3); ink(ctx, '#5a6478', 1.6, -16, 16); circle(ctx, 0, -33, 6); flat(ctx, '#7a5236', 1.4); }
    else { ctx.save(); ctx.translate(0, -48); ctx.rotate(-0.12); glow(ctx, 30, 0, 14, WHITE, 0.35); line(ctx, [[-34, 0], [32, 0]], '#e9eef6', 2.4); poly(ctx, [[40, 0], [31, -5], [31, 5]]); flat(ctx, '#e9eef6', 1.2); ctx.restore(); chainRing(ctx, 0, -33, 8, 8, 8, '#fff6d0', t); }
  } else if (many) {
    if (!live) { ctx.beginPath(); ctx.moveTo(-38, 6); ctx.lineTo(38, 6); ctx.quadraticCurveTo(34, 14, 26, 14); ctx.lineTo(-26, 14); ctx.quadraticCurveTo(-34, 14, -38, 6); ctx.closePath(); flat(ctx, S === 'lantern' ? '#4a3020' : '#7a5236', 1.6); for (const x of [-16, 14]) line(ctx, [[x, 6], [x, -56]], '#6a4226', 2.2); for (const [x, h] of [[-16, 44], [14, 50]]) { ctx.beginPath(); ctx.moveTo(x + 1, -4 - h); ctx.quadraticCurveTo(x + 20, -4 - h * 0.55, x + 1, -8); ctx.closePath(); flat(ctx, 'rgba(248,240,210,0.88)', 1.4); } }
    else lit(ctx, () => { for (const [x, h] of [[-16, 44], [14, 50]]) { glow(ctx, x + 8, -4 - h * 0.5, 16, '#fff3c0', 0.35 + Math.sin(t * 2 + x) * 0.08); } });
  } else if (craft) {
    if (!live) { poly(ctx, [[-14, 8], [14, 8], [9, -44], [-9, -44]]); ink(ctx, '#e8e2d0', 1.8, -14, 14); for (const y of [-6, -22, -36]) { rrect(ctx, -12 + (y + 44) * 0.06, y, 24 - (y + 44) * 0.12, 4, 1); ctx.fillStyle = '#c04040'; ctx.fill(); } rrect(ctx, -10, -56, 20, 12, 2); ink(ctx, IRON, 1.6, -10, 10); roof(ctx, 0, -56, 22, 8, '#c04040'); }
    else { beam(ctx, 0, -50, t * 0.9, 70, 12, 0.5); beam(ctx, 0, -50, t * 0.9 + Math.PI, 70, 12, 0.5); glow(ctx, 0, -50, 16, '#fff3c0', 0.7); }
  }
}
function ferryParts(P) { const { might, many, craft, mt } = P; return { w: (might || many) && mt >= 3 ? 36 : 30, gun: might && mt >= 3, rafts: many ? (mt >= 4 ? 3 : mt >= 3 ? 2 : mt >= 2 ? 1 : 0) : 0, light: craft ? mt : 0 }; }
const RAFT_SPOTS = [[-26, 8], [27, 6], [-30, -2]];
const kFerry = {
  float: true, breathe: true,
  self: () => [-8, -24, 4, 2],
  shadow(ctx, P, st) { waterRipples(ctx, 38, st.time, st.water); },
  body(ctx, P, d) {
    const { might, many, craft, mt, t5 } = P, F = ferryParts(P);
    if (t5) ferryForm(ctx, P, 'kindling', false);
    raft(ctx, F.w, P, d, false);
    if (F.light >= 2) { // the lamp-post, then the lighthouse
      const h = F.light >= 3 ? 27 : 22, x = 11;
      if (F.light >= 3) { poly(ctx, [[x - 5, 4], [x + 5, 4], [x + 3, -h], [x - 3, -h]]); ink(ctx, '#e8e2d0', 1.4, x - 5, x + 5); for (const y of [-6, -18]) { rrect(ctx, x - 4.4, y, 8.8, 3, 0.8); ctx.fillStyle = '#c04040'; ctx.fill(); } }
      else line(ctx, [[x, 4], [x, -h]], WOOD, 1.8);
      rrect(ctx, x - 4, -h - 8, 8, 8, 1.5); flat(ctx, IRON, 1.2); roof(ctx, x, -h - 8, 10, 5, '#c04040');
    } else { line(ctx, [[11, 4], [11, -20]], WOOD, 1.6); rrect(ctx, 8, -27, 6, 7, 1.4); flat(ctx, IRON, 1.1); }   // the mast lantern
    // the ferry-keeper: oilskin coat, hat, pole
    line(ctx, [[-12, 6], [-4, -30]], WOOD, 1.4);
    ctx.beginPath(); ctx.moveTo(-9, 4); ctx.quadraticCurveTo(-9, -10, -5, -13); ctx.lineTo(3, -13); ctx.quadraticCurveTo(5, -10, 4, 4); ctx.closePath(); ink(ctx, might && mt >= 2 ? '#3a4a5a' : FY.coat, 1.8, -9, 5);
    circle(ctx, -2, -17, 6.4); ink(ctx, WAX, 1.6, -8, 4);
    ctx.beginPath(); ctx.ellipse(-2, -21.5, 9, 2.4, 0, 0, TAU); flat(ctx, FY.hat, 1.2); ctx.beginPath(); ctx.ellipse(-2, -23.5, 5, 3.4, 0, Math.PI, TAU); flat(ctx, FY.hat, 1.2);
    if (might && mt >= 2 && mt < 3) { line(ctx, [[-14, 0], [-14, -22]], WOOD, 1.2); poly(ctx, [[-14, -27], [-16, -21], [-12, -21]]); flat(ctx, '#e9eef6', 1); circle(ctx, -16, 2, 2.6); flat(ctx, '#c8b080', 1); }
    if (mt >= 4) crown(ctx, -2, -28, d, 0.85);
    return F.light >= 3 ? -42 : -34;
  },
  back(ctx, P, st, d) {
    const { mt, t5 } = P, F = ferryParts(P), t = st.time;
    if (t5) ferryForm(ctx, P, 'kindling', true, t);
    if (F.gun && !gearInFront(st.ang, 1)) harpoonGun(ctx, 14, -2, st.ang, P, st.recoil);
    for (let i = 0; i < F.rafts; i++) { const [x, y] = RAFT_SPOTS[i]; if (y < 0) { line(ctx, [[x * 0.5, 4], [x, y + 2]], '#c8b080', 0.6); miniRaft(ctx, x, y + Math.sin(t * 2 + i) * 1, 0.8, false); } }
    if (F.light >= 3 && !t5) beam(ctx, 11, -31, t * 0.9, 50, 10, 0.4);
  },
  front(ctx, P, st, d) {
    const { mt } = P, F = ferryParts(P), t = st.time;
    for (let i = 0; i < F.rafts; i++) { const [x, y] = RAFT_SPOTS[i]; if (y >= 0) { line(ctx, [[x * 0.5, 6], [x, y + 2]], '#c8b080', 0.6); miniRaft(ctx, x, y + Math.sin(t * 2 + i) * 1, 0.8, false); } }
    if (F.gun && gearInFront(st.ang, 1)) harpoonGun(ctx, 14, -2, st.ang, P, st.recoil);
    if (!FACE.skip) { const lx = 11, ly = F.light >= 3 ? -31 : F.light >= 2 ? -26 : -23.5; glow(ctx, lx, ly, 8 + F.light * 2, '#fff3c0', 0.55); circle(ctx, lx, ly, 1.6); ctx.fillStyle = '#fff3c0'; ctx.fill(); }
    eyes(ctx, -2, -17, st, { sep: 2.6, r: 2.1, brow: 'sharp' });
    tuft(ctx, -2, -25, 0.5, d, t);
  },
  muzzle(P, ang, out) { if (P.might && P.mt >= 3) { out[0] = 14 + Math.cos(ang) * 16; out[1] = -2 + Math.sin(ang) * 11; } else { out[0] = -6; out[1] = -18; } return out; },
};
const lFerry = {
  float: true,
  self: () => [-7, -22, 7, -2],
  shadow: kFerry.shadow,
  body(ctx, P, d) {
    const { might, many, craft, mt, t5 } = P, F = ferryParts(P);
    if (t5) ferryForm(ctx, P, 'lantern', false);
    raft(ctx, F.w + 4, P, d, true);
    if (F.light >= 2) { const h = F.light >= 3 ? 27 : 22, x = -13; if (F.light >= 3) { poly(ctx, [[x - 4, 4], [x + 4, 4], [x + 2.6, -h], [x - 2.6, -h]]); ink(ctx, '#e8e2d0', 1.4, x - 4, x + 4); rrect(ctx, x - 3.6, -12, 7.2, 3, 0.8); ctx.fillStyle = '#c04040'; ctx.fill(); } else line(ctx, [[x, 4], [x, -h]], WOOD, 1.8); rrect(ctx, x - 4, -h - 8, 8, 8, 1.5); flat(ctx, IRON, 1.2); roof(ctx, x, -h - 8, 10, 5, '#c04040'); }
    else { line(ctx, [[-12, 4], [-12, -26]], WOOD, 1.6); poly(ctx, [[-12, -26], [-3, -23], [-12, -20]]); flat(ctx, '#c04040', 1); }
    rrect(ctx, -8, -20, 16, 22, 3); ink(ctx, might && mt >= 2 ? '#4a5060' : IRON2, 2, -8, 8);   // the cabin lantern
    roof(ctx, 0, -20, 20, 8, might && mt >= 2 ? '#5a6478' : IRON);
    if (mt >= 4) crown(ctx, 0, -29, d, 0.9);
    return F.light >= 3 ? -42 : -38;
  },
  back(ctx, P, st, d) {
    const { t5 } = P, F = ferryParts(P), t = st.time;
    if (t5) ferryForm(ctx, P, 'lantern', true, t);
    if (F.gun && !gearInFront(st.ang, 1)) harpoonGun(ctx, 14, -6, st.ang, P, st.recoil);
    for (let i = 0; i < F.rafts; i++) { const [x, y] = RAFT_SPOTS[i]; if (y < 0) { line(ctx, [[x * 0.5, 4], [x, y + 2]], '#c8b080', 0.6); miniRaft(ctx, x, y + Math.sin(t * 2 + i), 0.8, true); } }
    if (F.light >= 3 && !t5) beam(ctx, -13, -31, t * 0.9, 50, 10, 0.4);
  },
  front(ctx, P, st, d) {
    const F = ferryParts(P), t = st.time;
    for (let i = 0; i < F.rafts; i++) { const [x, y] = RAFT_SPOTS[i]; if (y >= 0) { line(ctx, [[x * 0.5, 6], [x, y + 2]], '#c8b080', 0.6); miniRaft(ctx, x, y + Math.sin(t * 2 + i), 0.8, true); } }
    if (F.gun && gearInFront(st.ang, 1)) harpoonGun(ctx, 14, -6, st.ang, P, st.recoil);
    if (!FACE.skip) { pane(ctx, 0, -9, 10, 13, d); glow(ctx, 0, -9, 11, '#ffffff', 0.25); if (F.light >= 2) { const ly = F.light >= 3 ? -31 : -26; glow(ctx, -13, ly, 8 + F.light * 2, '#fff3c0', 0.6); } }
  },
  muzzle(P, ang, out) { if (P.might && P.mt >= 3) { out[0] = 14 + Math.cos(ang) * 16; out[1] = -6 + Math.sin(ang) * 11; } else { out[0] = Math.cos(ang) * 6; out[1] = -9; } return out; },
};

// =================================================================================================
// THE UNDERTOW (water, Frost). Kindlings: a lake spirit rising from a swirl of foam, translucent
// blue, with a wave-crest for its head flame. Lanterns: a brass diving-bell lantern rising out of
// the water, its porthole the light. Maelstrom: a spiral band, then a whirling crown of water.
// Tidecaller: a conch, then a breaking wave arched behind, then two wave-sprites. Abyss: a deep
// dark eye-pool, then dark tendrils curling beside it. Tier 5: Great Maelstrom (a waterspout behind),
// Tidal Throne (a towering wave about to break), Drowned Deep (a black ring of the deep, tendrils).
const UT = { body: '#4fa8dc', body2: '#3a9ac0', deep: '#1a3048', foam: '#eafaff', brass: '#b08a4a' };
function swirl(ctx, x, y, rx, ry, t, col, turns = 1.5, w = 1.6) {
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const u = i / 40, a = t * 2 + u * TAU * turns, r = 1 - u * 0.75; ctx.lineTo(x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r); }
  ctx.strokeStyle = INK; ctx.lineWidth = w + 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
}
function tendril(ctx, x, y, h, side, t, col = UT.deep) {
  const sw = Math.sin(t * 1.6 + x) * 2;
  line(ctx, [[x, y], [x + side * 4 + sw, y - h * 0.4], [x + side * 2 - sw, y - h * 0.8], [x + side * 6, y - h]], col, 2.6);
}
function undertowForm(ctx, P, S, live, t = 0) {
  const { might, many, craft } = P;
  if (might) {
    if (!live) { poly(ctx, [[-10, 10], [10, 10], [26, -58], [-26, -58]]); ctx.fillStyle = 'rgba(120,210,235,0.55)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke(); }
    else for (let i = 0; i < 6; i++) { const y = 6 - i * 11, r = 10 + i * 3; ring(ctx, 0, y, r, r * 0.3, UT.foam, 1.2, Math.PI * (0.1 + (t * 0.6 + i * 0.2) % 1), Math.PI * (1.1 + (t * 0.6 + i * 0.2) % 1)); }
  } else if (many) {
    const wave = () => { ctx.beginPath(); ctx.moveTo(-36, 10); ctx.quadraticCurveTo(-40, -36, -6, -54); ctx.quadraticCurveTo(26, -60, 34, -38); ctx.quadraticCurveTo(18, -46, 10, -32); ctx.quadraticCurveTo(26, -20, 34, 10); ctx.closePath(); };
    if (!live) { wave(); flat(ctx, S === 'lantern' ? '#3a7aa0' : '#4aa0c8', 1.8); ctx.save(); wave(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-40, -66, 22, 80); ctx.restore(); }
    else for (let i = 0; i < 7; i++) { const a = -2.6 + i * 0.32; circle(ctx, Math.cos(a) * 34 + 2, -32 + Math.sin(a) * 24 + Math.sin(t * 4 + i), 2.2); flat(ctx, UT.foam, 0.8); }
  } else if (craft) {
    if (!live) { circle(ctx, 0, -30, 28); flat(ctx, '#0e1828', 1.6); ring(ctx, 0, -30, 28, 28, '#2a5a80', 1.4); }
    else { swirl(ctx, 0, -30, 22, 22, t * 0.5, '#4a8ab0', 2.2, 1.2); for (const [x, s] of [[-26, -1], [26, 1], [-18, -1], [18, 1]]) tendril(ctx, x, 6, 30 + Math.abs(x) * 0.6, s, t, '#2a3a5a'); glow(ctx, 0, -30, 10, '#52e6ff', 0.6); }
  }
}
const kUndertow = {
  float: true, breathe: true,
  self: () => [-6, -24, 6, 0],
  shadow(ctx, P, st) { waterRipples(ctx, 36, st.time, st.water); },
  body(ctx, P, d) {
    const { might, many, craft, mt, t5 } = P;
    if (t5) undertowForm(ctx, P, 'kindling', false);
    ctx.beginPath(); ctx.ellipse(0, 10, 16, 4.2, 0, 0, TAU); ink(ctx, UT.foam, 1.6, -16, 16);   // the foam ring
    ctx.beginPath(); ctx.ellipse(0, 9.6, 11, 2.6, 0, 0, TAU); ctx.fillStyle = craft && mt >= 2 ? '#0e1828' : '#5ab8d8'; ctx.fill();
    notches(ctx, P.mt, 0, 13.2, 22, DMG[d].core, 2.4);
    pips(ctx, P.tiers, P.main, 12, 6);
    if (many && mt >= 3) for (const k of [-1, 1]) { ctx.save(); ctx.translate(k * 17, 6); ctx.scale(0.55, 0.55); ctx.beginPath(); ctx.moveTo(-6, 8); ctx.quadraticCurveTo(-7, -10, 0, -16); ctx.quadraticCurveTo(7, -10, 6, 8); ctx.closePath(); ink(ctx, UT.body, 1.6, -6, 6); ctx.restore(); }
    // the spirit: a rising wave whose top curls over into a breaking crest (not a dome: that's the
    // Rime Spire), sea-blue rather than frost-white, with a band of foam swirling round it
    const s = 1 + (might ? mt * 0.035 : 0);
    ring(ctx, 0, 1, 12.5 * s, 3.6, UT.foam, 1.3, Math.PI, TAU);   // the foam band, back half
    ctx.beginPath(); ctx.moveTo(-9 * s, 9); ctx.quadraticCurveTo(-12 * s, -8, -6 * s, -20 * s); ctx.quadraticCurveTo(-1, -31 * s, 8 * s, -27 * s);
    ctx.quadraticCurveTo(13 * s, -24.5 * s, 11.5 * s, -18 * s); ctx.quadraticCurveTo(8 * s, -22 * s, 5 * s, -17 * s); ctx.quadraticCurveTo(11 * s, -6, 9 * s, 9); ctx.closePath();
    ink(ctx, craft && mt >= 3 ? '#3a6a92' : UT.body, 2, -10, 10);
    ctx.beginPath(); ctx.moveTo(-5, 6); ctx.quadraticCurveTo(-8, -6, -3, -19 * s); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.4; ctx.stroke();
    for (const [x, y] of [[8, -27.5], [11.5, -24], [12, -19]]) { circle(ctx, x * s, y * s, 1.4); flat(ctx, UT.foam, 0.8); }   // foam on the crest's lip
    ring(ctx, 0, 1, 12.5 * s, 3.6, UT.foam, 1.3, 0, Math.PI);   // the foam band, front half
    for (const k of [-1, 1]) line(ctx, [[k * 7, -6], [k * (many && mt >= 2 ? 15 : 13), many && mt >= 2 ? -16 : -2]], UT.body2, 2.2);   // arms (raised for the Tidecaller)
    if (many && mt >= 2) { ctx.save(); ctx.translate(15, -18); ctx.rotate(0.5); ctx.beginPath(); ctx.moveTo(-3, 3); ctx.quadraticCurveTo(0, -6, 5, -3); ctx.quadraticCurveTo(4, 3, -3, 3); flat(ctx, '#f0d8c0', 1.1); ctx.restore(); }   // the conch
    if (might && mt >= 2) for (const y of [-2, -10]) ring(ctx, 0, y, 9 * s, 2.4, UT.foam, 1, 0, Math.PI);
    if (mt >= 4) crown(ctx, 0, -30 * s, d, 0.9);
    return mt >= 4 ? -40 : -34;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt, t5 } = P, t = st.time;
    if (t5) undertowForm(ctx, P, 'kindling', true, t);
    if (mt >= 4 && !t5) groundAura(ctx, d, t, 24);
    if (might && mt >= 3) { ring(ctx, 0, -6, 19, 6, UT.foam, 1.6, Math.PI, TAU); swirl(ctx, 0, 11, 20, 6, -t, '#bfefff', 1.2, 1.2); }
    if (many && mt >= 3) { ctx.beginPath(); ctx.moveTo(-20, 6); ctx.quadraticCurveTo(-22, -26, 0, -34); ctx.quadraticCurveTo(18, -36, 22, -22); ctx.quadraticCurveTo(12, -26, 8, -20); ctx.strokeStyle = INK; ctx.lineWidth = 4.4; ctx.stroke(); ctx.strokeStyle = '#bfefff'; ctx.lineWidth = 2.4; ctx.stroke(); }
    if (craft && mt >= 3) for (const [x, s] of [[-14, -1], [14, 1]]) tendril(ctx, x, 6, mt >= 4 ? 26 : 20, s, t);
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, s = 1 + (might ? mt * 0.035 : 0);
    if (might && mt >= 3) ring(ctx, 0, -6, 19, 6, UT.foam, 1.6, 0, Math.PI);
    if (craft && mt >= 2) for (let i = 0; i < 3; i++) { const u = (t * 0.6 + i / 3) % 1; ctx.globalAlpha = 1 - u; circle(ctx, -4 + i * 4, 6 - u * 14, 1.3); flat(ctx, '#bfefff', 0.7); ctx.globalAlpha = 1; }
    eyes(ctx, 0, -14 * s, st, { sep: 3, r: 2.4, brow: craft && mt >= 3 ? 'stern' : 'soft', iris: craft && mt >= 2 ? '#0a7fa8' : INK });
    if (mt < 4) tuft(ctx, 1, -29 * s, 0.5, d, t);
  },
  muzzle(P, ang, out) { out[0] = 0; out[1] = -14; return out; },
};
const lUndertow = {
  float: true,
  self: () => [-8, -24, 8, 2],
  shadow: kUndertow.shadow,
  body(ctx, P, d) {
    const { might, many, craft, mt, t5 } = P;
    if (t5) undertowForm(ctx, P, 'lantern', false);
    ctx.beginPath(); ctx.ellipse(0, 10, 16, 4.2, 0, 0, TAU); ink(ctx, UT.foam, 1.6, -16, 16);
    notches(ctx, P.mt, 0, 13.2, 22, DMG[d].core, 2.4);
    pips(ctx, P.tiers, P.main, 12, 6);
    const s = 1 + (might ? mt * 0.05 : 0);
    // the diving bell: a brass dome rising from the water
    ctx.beginPath(); ctx.moveTo(-11 * s, 9); ctx.lineTo(-11 * s, -8); ctx.quadraticCurveTo(-11 * s, -24 * s, 0, -25 * s); ctx.quadraticCurveTo(11 * s, -24 * s, 11 * s, -8); ctx.lineTo(11 * s, 9); ctx.closePath(); ink(ctx, craft && mt >= 2 ? '#4a5a6a' : UT.brass, 2, -11, 11);
    for (const y of [-6, 4]) { rrect(ctx, -11.5 * s, y, 23 * s, 2.2, 1); flat(ctx, COPPER, 0.9); }
    for (const a of [-0.9, -0.3, 0.3, 0.9]) { circle(ctx, Math.sin(a) * 10 * s, -1, 0.9); ctx.fillStyle = '#5a3a1a'; ctx.fill(); }
    circle(ctx, 0, -27 * s, 2.4); flat(ctx, UT.brass, 1.1);
    if (many && mt >= 2) { ctx.save(); ctx.translate(13, -14); ctx.rotate(-0.4); poly(ctx, [[-2, 4], [2, 4], [6, -8], [-6, -8]]); ink(ctx, BRASS, 1.2, -6, 6); ctx.restore(); }   // a horn
    if (craft && mt >= 3) { line(ctx, [[-14, 8], [-14, -14]], '#5a6478', 1.6); poly(ctx, [[-14, -14], [-18, -10], [-10, -10]]); flat(ctx, '#5a6478', 1); }
    if (mt >= 4) crown(ctx, 0, -30 * s, d, 0.9);
    return mt >= 4 ? -44 : -34;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt, t5 } = P, t = st.time;
    if (t5) undertowForm(ctx, P, 'lantern', true, t);
    if (mt >= 4 && !t5) groundAura(ctx, d, t, 24);
    if (might && mt >= 3) for (let i = 0; i < 4; i++) { const a = t * 3 + (i / 4) * TAU; if (Math.sin(a) < 0) { poly(ctx, [[Math.cos(a) * 14, -4 + Math.sin(a) * 5], [Math.cos(a + 0.4) * 20, -6 + Math.sin(a + 0.4) * 7], [Math.cos(a + 0.5) * 15, -2 + Math.sin(a + 0.5) * 5]]); flat(ctx, BRASS, 1); } }
    if (many && mt >= 3) { ctx.beginPath(); ctx.moveTo(-22, 6); ctx.quadraticCurveTo(-24, -26, 0, -34); ctx.quadraticCurveTo(18, -36, 22, -22); ctx.strokeStyle = INK; ctx.lineWidth = 4.4; ctx.stroke(); ctx.strokeStyle = '#bfefff'; ctx.lineWidth = 2.4; ctx.stroke(); }
    if (craft && mt >= 3) for (const [x, s] of [[-17, -1], [16, 1]]) tendril(ctx, x, 6, mt >= 4 ? 26 : 20, s, t);
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, s = 1 + (might ? mt * 0.05 : 0);
    if (might && mt >= 3) for (let i = 0; i < 4; i++) { const a = t * 3 + (i / 4) * TAU; if (Math.sin(a) >= 0) { poly(ctx, [[Math.cos(a) * 14, -4 + Math.sin(a) * 5], [Math.cos(a + 0.4) * 20, -6 + Math.sin(a + 0.4) * 7], [Math.cos(a + 0.5) * 15, -2 + Math.sin(a + 0.5) * 5]]); flat(ctx, BRASS, 1); } }
    if (!FACE.skip) { circle(ctx, 0, -12 * s, 7); flat(ctx, COPPER, 1.6); pane(ctx, 0, -12 * s, 9, 9, d); glow(ctx, 0, -12 * s, 11, DMG.frost.core, 0.45); }
    if (craft && mt >= 2) for (let i = 0; i < 3; i++) { const u = (t * 0.6 + i / 3) % 1; ctx.globalAlpha = 1 - u; circle(ctx, -4 + i * 4, 6 - u * 14, 1.3); flat(ctx, '#bfefff', 0.7); ctx.globalAlpha = 1; }
  },
  muzzle(P, ang, out) { out[0] = 0; out[1] = -12; return out; },
};

// =================================================================================================
// LAMPWRIGHT (road-maker, Fire). Kindlings: a sooty lamplighter in a cap with a long lighting pole
// and a basket of candles; it tosses lit candles onto the road. Lanterns: a lamp-post lantern with a
// candle hopper and a little throwing arm. Tallow: fat pillar candles, then a wax vat with a ladle.
// Wickstorm: a bandolier of tapers, then a spinning candle wheel that slings them. Beaconwax: a
// crown of candles, then a tall votive stand that glows (reveal). Tier 5: Undying Taper (a giant
// dripping candle behind), Thousand Wicks (a candelabra tree of flames), Eternal Vigil (a rose window
// of light behind).
const LW = { coat: '#3a2e36', cap: '#2a2228', apron: '#8a7a6a', basket: '#a07040', soot: '#2a2024' };
function lampForm(ctx, P, S, live, t = 0) {
  const { might, many, craft } = P;
  if (might) {
    if (!live) { rrect(ctx, -11, -44, 22, 54, 4); ink(ctx, WAX, 1.8, -11, 11); for (const x of [-8, -2, 5]) { ctx.beginPath(); ctx.moveTo(x, -44); ctx.quadraticCurveTo(x + 1.5, -36 + x, x, -30 + x * 0.5); ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.stroke(); ctx.strokeStyle = WAX2; ctx.lineWidth = 1.8; ctx.stroke(); } line(ctx, [[0, -44], [0, -47]], INK, 1); }
    else { glow(ctx, 0, -54, 20, DMG.fire.core, 0.55); torchFlame(ctx, 0, -47, 1.5, t); }
  } else if (many) {
    if (!live) { line(ctx, [[0, 10], [0, -40]], S === 'lantern' ? IRON : WOOD, 3); for (const [y, w] of [[-14, 30], [-28, 22], [-40, 14]]) { line(ctx, [[-w, y + 4], [0, y], [w, y + 4]], S === 'lantern' ? IRON2 : BRONZE, 1.8); for (const k of [-1, -0.5, 0.5, 1]) candle(ctx, k * w, y + 4 - Math.abs(k) * 0, 6, 2.2, 0, false); } }
    else for (const [y, w] of [[-14, 30], [-28, 22], [-40, 14]]) for (const k of [-1, -0.5, 0.5, 1]) { glow(ctx, k * w, y - 4, 5, DMG.fire.core, 0.5); torchFlame(ctx, k * w, y - 3, 0.5, t + k); }
  } else if (craft) {
    if (!live) { circle(ctx, 0, -34, 26); flat(ctx, '#3a2a3a', 1.6); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; line(ctx, [[0, -34], [Math.cos(a) * 25, -34 + Math.sin(a) * 25]], '#5a4a5a', 1.4); } ring(ctx, 0, -34, 10, 10, '#5a4a5a', 1.4); }
    else { lit(ctx, () => { for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.39; ctx.fillStyle = rgba(i % 2 ? '#ffe03a' : '#ff9a6a', 0.55 + Math.sin(t * 2 + i) * 0.1); ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.3) * 11, -34 + Math.sin(a - 0.3) * 11); ctx.lineTo(Math.cos(a - 0.3) * 24, -34 + Math.sin(a - 0.3) * 24); ctx.lineTo(Math.cos(a + 0.3) * 24, -34 + Math.sin(a + 0.3) * 24); ctx.lineTo(Math.cos(a + 0.3) * 11, -34 + Math.sin(a + 0.3) * 11); ctx.fill(); } }); glow(ctx, 0, -34, 14, '#ffe03a', 0.6); }
  }
}
const kLamp = {
  breathe: true,
  self: () => [-7, -26, 7, 4],
  body(ctx, P, d) {
    const { might, many, craft, mt, t5 } = P;
    if (t5) lampForm(ctx, P, 'kindling', false);
    hearthstone(ctx, 28, P, d, 'coals');
    // the basket / vat of candles at its side
    if (might && mt >= 3) { ctx.beginPath(); ctx.ellipse(14, 2, 9, 3, 0, 0, TAU); flat(ctx, '#5a4040', 1.2); rrect(ctx, 5, 2, 18, 9, 3); ink(ctx, '#6a4a3a', 1.6, 5, 23); ctx.beginPath(); ctx.ellipse(14, 2, 7.5, 2.2, 0, 0, TAU); ctx.fillStyle = WAX2; ctx.fill(); line(ctx, [[18, 1], [22, -10]], '#8a8a9a', 1.2); }
    else { rrect(ctx, 8, 0, 12, 10, 2.5); ink(ctx, LW.basket, 1.5, 8, 20); for (let i = 0; i < (might && mt >= 2 ? 3 : 4); i++) candle(ctx, 10 + i * (might && mt >= 2 ? 3.6 : 2.6), 1, might && mt >= 2 ? 7 : 6, might && mt >= 2 ? 3.4 : 2, 0, false); }
    // the lamplighter
    ctx.beginPath(); ctx.moveTo(-9, 10); ctx.quadraticCurveTo(-9, -8, -5, -12); ctx.lineTo(5, -12); ctx.quadraticCurveTo(9, -8, 9, 10); ctx.closePath(); ink(ctx, LW.coat, 1.8, -9, 9);
    poly(ctx, [[-5, -6], [5, -6], [6, 9], [-6, 9]]); ink(ctx, LW.apron, 1.2, -6, 6);
    if (many && mt >= 2) { line(ctx, [[-7, -10], [6, 4]], '#6a4a2a', 1.6); for (let i = 0; i < 4; i++) candle(ctx, -5 + i * 3, -7 + i * 3.2, 4, 1.6, 0, false); }
    circle(ctx, 0, -17, 7); ink(ctx, WAX, 1.6, -7, 7);
    ctx.beginPath(); ctx.ellipse(0, -21.5, 8, 2.2, 0, 0, TAU); flat(ctx, LW.cap, 1.1); ctx.beginPath(); ctx.ellipse(0, -22.5, 6, 4, 0, Math.PI, TAU); flat(ctx, LW.cap, 1.1);
    if (craft && mt >= 2) for (const x of [-4, 0, 4]) candle(ctx, x, -24.5, 3.4, 1.8, 0, false);   // a crown of candles
    if (craft && mt >= 3) { line(ctx, [[-16, 10], [-16, -18]], BRONZE, 1.6); rrect(ctx, -20, -22, 8, 5, 1.5); flat(ctx, BRONZE, 1.1); }
    if (mt >= 4) crown(ctx, 0, craft ? -33 : -27, d, 0.85);
    return mt >= 4 ? -38 : -32;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt, t5 } = P, t = st.time;
    if (t5) lampForm(ctx, P, 'kindling', true, t);
    if (mt >= 4 && !t5 && !craft) groundAura(ctx, d, t, 24);
    if (craft && mt >= 3) softRing(ctx, 0, 11, 30, 10, '#ffe03a', 0.4 + Math.sin(t * 2) * 0.1, 1.8);
    if (!gearInFront(st.ang, -1)) lightingPole(ctx, P, st);
    if (many && mt >= 3) candleWheel(ctx, -18, -6, P, t, -1);
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time;
    if (many && mt >= 3) candleWheel(ctx, -18, -6, P, t, 1);
    if (gearInFront(st.ang, -1)) lightingPole(ctx, P, st);
    if (!FACE.skip) {
      const n = might && mt >= 2 ? 3 : 4;
      if (!(might && mt >= 3)) for (let i = 0; i < n; i++) { const x = 10 + i * (might && mt >= 2 ? 3.6 : 2.6), h = might && mt >= 2 ? 7 : 6; glow(ctx, x, 1 - h - 2, 4, DMG.fire.core, 0.45); ctx.beginPath(); ctx.ellipse(x, 1 - h - 1.8, 0.9, 1.8, 0, 0, TAU); ctx.fillStyle = '#ffb070'; ctx.fill(); }
      if (craft && mt >= 2) for (const x of [-4, 0, 4]) { glow(ctx, x, -30, 4, '#ffe03a', 0.5); ctx.beginPath(); ctx.ellipse(x, -29.6, 0.9, 1.8, 0, 0, TAU); ctx.fillStyle = '#fff0a0'; ctx.fill(); }
      if (craft && mt >= 3) { glow(ctx, -16, -24, 10, '#ffe03a', 0.6); torchFlame(ctx, -16, -23, 0.7, t); }
    }
    eyes(ctx, 0, -17, st, { sep: 2.8, r: 2.2, brow: 'soft' });
    if (mt < 4 && !(craft && mt >= 2)) tuft(ctx, 0, -25, 0.55, d, t);
  },
  muzzle(P, ang, out) { out[0] = -12; out[1] = -26; return out; },
};
function lightingPole(ctx, P, st) {
  const A = aim(st.ang), toss = Math.sin(st.time * 3) * 0.15, L = 15, x0 = -8, y0 = -10;
  const tx = x0 - 6 + A.x * 4, ty = y0 - L + A.y * 2 + toss * 6;
  line(ctx, [[x0, y0 + 8], [tx, ty]], WOOD, 1.6);
  line(ctx, [[tx, ty], [tx - 2, ty - 3]], '#8a8a9a', 1);
  torchFlame(ctx, tx - 2, ty - 4, 0.45, st.time);
  circle(ctx, x0, y0, 2.2); flat(ctx, WAX, 1);
}
function candleWheel(ctx, x, y, P, t, half) {
  const n = P.mt >= 4 ? 8 : 6, R = P.mt >= 4 ? 9 : 7;
  if (half < 0) { circle(ctx, x, y, R); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = BRONZE; ctx.lineWidth = 1.8; ctx.stroke(); line(ctx, [[x, y], [x + 3, 10]], WOOD, 1.6); return; }
  for (let i = 0; i < n; i++) { const a = t * 2.4 + (i / n) * TAU; const cx = x + Math.cos(a) * R, cy = y + Math.sin(a) * R; candle(ctx, cx, cy + 2, 4, 1.6, t, !FACE.skip); }
  circle(ctx, x, y, 2); flat(ctx, BRONZE, 1);
}
const lLamp = {
  self: () => [-8, -24, 8, -11],
  body(ctx, P, d) {
    const { might, many, craft, mt, t5 } = P;
    if (t5) lampForm(ctx, P, 'lantern', false);
    plinth(ctx, 26, P, d, LW.soot, 'embers');
    // a crooked lamplighter's pole with a squat lamp hanging from its hook (the Beacon is an upright
    // lamp on a straight post: this one hangs, and is wide and low)
    line(ctx, [[-10, 8], [-11, -8], [-8, -22], [-9, -31]], IRON, 2.6);
    ctx.beginPath(); ctx.moveTo(-9, -31); ctx.quadraticCurveTo(-6, -38, 0, -36); ctx.quadraticCurveTo(4, -35, 3, -31); ctx.strokeStyle = INK; ctx.lineWidth = 4.4; ctx.stroke(); ctx.strokeStyle = IRON; ctx.lineWidth = 2.4; ctx.stroke();
    line(ctx, [[3, -31], [0, -27]], IRON2, 1.2);
    if (might && mt >= 3) { rrect(ctx, 6, -2, 16, 9, 3); ink(ctx, '#6a4a3a', 1.6, 6, 22); ctx.beginPath(); ctx.ellipse(14, -2, 7, 2, 0, 0, TAU); ctx.fillStyle = WAX2; ctx.fill(); }
    else { poly(ctx, [[7, -2], [19, -2], [17, 7], [9, 7]]); ink(ctx, IRON2, 1.4, 7, 19); for (let i = 0; i < 3; i++) candle(ctx, 10 + i * 3.4, -2, might && mt >= 2 ? 7 : 5, might && mt >= 2 ? 3 : 2, 0, false); }
    ctx.beginPath(); ctx.ellipse(0, -23.5, 8, 3.6, 0, Math.PI, TAU); flat(ctx, IRON, 1.4);   // the squat lamp: a low dome cap...
    rrect(ctx, -9, -24, 18, 12, 3); ink(ctx, LW.soot, 2, -9, 9);   // ...a wide, low body...
    rrect(ctx, -10, -12.5, 20, 2.6, 1); flat(ctx, IRON2, 1);   // ...and a drip tray
    if (many && mt >= 2) for (const s of [-1, 1]) { line(ctx, [[-10, -6], [-10 + s * 8, -10]], IRON2, 1.2); candle(ctx, -10 + s * 8, -10, 4, 1.8, 0, false); }
    if (craft && mt >= 2) for (const x of [-12, 12]) { line(ctx, [[x * 0.75, -18], [x, -20]], IRON2, 1); candle(ctx, x, -20, 3.4, 1.6, 0, false); }
    if (mt >= 4) crown(ctx, 0, -37, d, 0.8);
    return mt >= 4 ? -42 : -38;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt, t5 } = P, t = st.time;
    if (t5) lampForm(ctx, P, 'lantern', true, t);
    if (mt >= 4 && !t5 && !craft) groundAura(ctx, d, t, 24);
    if (craft && mt >= 3) softRing(ctx, 0, 11, 30, 10, '#ffe03a', 0.4 + Math.sin(t * 2) * 0.1, 1.8);
    if (!gearInFront(st.ang, -1)) throwArm(ctx, P, st);
    if (many && mt >= 3) candleWheel(ctx, -16, -6, P, t, -1);
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time;
    if (many && mt >= 3) candleWheel(ctx, -16, -6, P, t, 1);
    if (gearInFront(st.ang, -1)) throwArm(ctx, P, st);
    if (!FACE.skip) { pane(ctx, 0, -18, 13, 7.5, d); glow(ctx, 0, -18, 12, DMG.fire.core, 0.45 + Math.sin(t * 8) * 0.05); if (craft && mt >= 2) for (const x of [-12, 12]) { glow(ctx, x, -25, 4, '#ffe03a', 0.6); ctx.beginPath(); ctx.ellipse(x, -25, 0.9, 1.8, 0, 0, TAU); ctx.fillStyle = '#fff0a0'; ctx.fill(); } }
  },
  muzzle(P, ang, out) { out[0] = -12; out[1] = -22; return out; },
};
function throwArm(ctx, P, st) {
  const sw = Math.sin(st.time * 3) * 0.4, x0 = -11, y0 = -8;
  const tx = x0 - 8 - Math.cos(sw) * 2, ty = y0 - 10 + sw * 4;
  line(ctx, [[x0, y0], [tx, ty]], IRON2, 1.6);
  ctx.beginPath(); ctx.ellipse(tx, ty, 3, 1.6, 0, 0, TAU); flat(ctx, IRON2, 1);
  candle(ctx, tx, ty, 3.6, 1.8, st.time, !FACE.skip);
}

// =================================================================================================
// RUNEWRIGHT (road-maker, Blast). Kindlings: a stone-carver in a grey apron with a hammer and chisel,
// a rune tablet beside it with a glowing glyph. Lanterns: a carved waystone lantern with a chisel
// arm. Ember Rune: a hot chisel and a cracked ember tablet, then a great rune monolith with fire in
// its cracks. Frost Rune: a satchel of small rune tiles, then a ring of frost tiles turning round it.
// Seal Rune: a chain, then a floating seal disc and a chained seal stone. Tier 5: Ember Script (a
// colossal rune-stone behind, its rune burning), Winter Script (a circle of standing frost stones),
// Seal of Ages (a huge floating seal ring with chains).
const RW = { apron: '#7a7068', coat: '#5a5868', slate: '#6a6e80', stone: '#8a8478', stone2: '#6a6458' };
function runeGlyph(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.moveTo(0, -5); ctx.lineTo(3.4, -1.4); ctx.moveTo(0, 0); ctx.lineTo(-3.4, 3.4); ctx.moveTo(0, -1); ctx.lineTo(3, 2);
  ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.stroke(); ctx.lineCap = 'butt';
  ctx.restore();
}
function tablet(ctx, x, y, w, h, P, hot) {
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - h + 3); ctx.quadraticCurveTo(x, y - h - 3, x + w / 2, y - h + 3); ctx.lineTo(x + w / 2, y); ctx.closePath(); ink(ctx, hot ? '#4a3a3a' : RW.slate, 1.6, x - w / 2, x + w / 2);
  if (hot) for (const p of [[[x - w / 2 + 2, y - h * 0.3], [x - 1, y - h * 0.45]], [[x + w / 2 - 2, y - h * 0.7], [x + 1, y - h * 0.55]]]) line(ctx, p, '#ff8a3a', 0.7);
}
function runeForm(ctx, P, S, live, t = 0) {
  const { might, many, craft } = P;
  if (might) {
    if (!live) { tablet(ctx, 0, 10, 36, 62, P, true); }
    else { glow(ctx, 0, -26, 28, DMG.blast.core, 0.4 + Math.sin(t * 3) * 0.1); runeGlyph(ctx, 0, -30, 2.6, DMG.blast.core); }
  } else if (many) {
    if (!live) for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; const x = Math.cos(a) * 36, y = 4 + Math.sin(a) * 12; tablet(ctx, x, y, 9, 26 + Math.sin(a) * -14, P, false); }
    else for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; const x = Math.cos(a) * 36, y = 4 + Math.sin(a) * 12, h = 26 + Math.sin(a) * -14; glow(ctx, x, y - h * 0.5, 7, DMG.frost.core, 0.5); runeGlyph(ctx, x, y - h * 0.5, 0.7, DMG.frost.core); }
  } else if (craft) {
    if (!live) { for (const k of [-1, 1]) line(ctx, [[k * 30, 10], [k * 21, -32]], '#8a8a9a', 1.4); }
    else { ctx.save(); ctx.translate(0, -36); ctx.rotate(t * 0.3); ring(ctx, 0, 0, 22, 22, '#e8d8a0', 2.2); runeCircle(ctx, 0, 0, 17, 17, t, '#fff6d0', 1); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; runeGlyph(ctx, Math.cos(a) * 19.5, Math.sin(a) * 19.5, 0.45, '#fff6d0'); } ctx.restore(); chainRing(ctx, 0, -36, 26, 26, 12, '#c8c8d8', t); }
  }
}
const kRune = {
  breathe: true,
  self: () => [-8, -26, 5, 4],
  body(ctx, P, d) {
    const { might, many, craft, mt, t5 } = P;
    if (t5) runeForm(ctx, P, 'kindling', false);
    hearthstone(ctx, 30, P, d);
    // the rune tablet beside it
    const big = might && mt >= 3;
    tablet(ctx, 14, 9, big ? 14 : 10, big ? 32 : 18, P, might && mt >= 2);
    if (many && mt >= 2) { rrect(ctx, -20, 0, 8, 8, 2); ink(ctx, '#6a5a4a', 1.2, -20, -12); for (let i = 0; i < 3; i++) { rrect(ctx, -19.5 + i * 2.4, -3 + (i % 2), 3, 4, 0.6); flat(ctx, RW.slate, 0.8); } }
    if (craft && mt >= 2) { chainRing(ctx, 0, -2, 10, 3.2, 8, '#c8c8d8', 0); }
    // the carver
    ctx.beginPath(); ctx.moveTo(-9, 10); ctx.quadraticCurveTo(-10, -8, -5, -12); ctx.lineTo(4, -12); ctx.quadraticCurveTo(8, -8, 7, 10); ctx.closePath(); ink(ctx, RW.coat, 1.8, -9, 8);
    poly(ctx, [[-6, -6], [4, -6], [5, 9], [-7, 9]]); ink(ctx, RW.apron, 1.2, -7, 5);
    circle(ctx, -1, -17, 7); ink(ctx, WAX, 1.6, -8, 6);
    ctx.beginPath(); ctx.ellipse(-1, -22, 7.4, 3.2, 0, Math.PI, TAU); flat(ctx, '#4a4a5a', 1.1);   // a cloth cap
    if (craft && mt >= 3) { circle(ctx, -14, -24, 6); flat(ctx, '#e8d8a0', 1.2); runeGlyph(ctx, -14, -24, 0.7, '#5a4a20'); }
    if (mt >= 4) crown(ctx, -1, -27, d, 0.9);
    return big ? -38 : mt >= 4 ? -38 : -32;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt, t5 } = P, t = st.time;
    if (t5) runeForm(ctx, P, 'kindling', true, t);
    if (mt >= 4 && !t5) groundAura(ctx, d, t, 24);
    if (many && mt >= 3) for (let i = 0; i < (mt >= 4 ? 5 : 3); i++) { const a = t * 0.8 + (i / (mt >= 4 ? 5 : 3)) * TAU; if (Math.sin(a) < 0) runeTile(ctx, Math.cos(a) * 20, 2 + Math.sin(a) * 6); }
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, big = might && mt >= 3;
    if (many && mt >= 3) for (let i = 0; i < (mt >= 4 ? 5 : 3); i++) { const a = t * 0.8 + (i / (mt >= 4 ? 5 : 3)) * TAU; if (Math.sin(a) >= 0) runeTile(ctx, Math.cos(a) * 20, 2 + Math.sin(a) * 6); }
    if (!FACE.skip) {
      const gy = big ? -9 : 1, col = many && mt >= 2 ? DMG.frost.core : craft && mt >= 2 ? '#fff6d0' : DMG.blast.core;
      glow(ctx, 14, gy, big ? 14 : 9, col, 0.5 + Math.sin(t * 4) * 0.1); runeGlyph(ctx, 14, gy, big ? 1.5 : 0.9, col);
    }
    hammer(ctx, st, P);
    eyes(ctx, -1, -17, st, { sep: 2.8, r: 2.2, brow: 'stern' });
    if (mt < 4) tuft(ctx, -1, -24, 0.55, d, t);
  },
  muzzle(P, ang, out) { out[0] = 14; out[1] = -2; return out; },
};
function runeTile(ctx, x, y) { rrect(ctx, x - 3, y - 4, 6, 7, 1); flat(ctx, '#8ab8d8', 1); runeGlyph(ctx, x, y - 0.5, 0.45, DMG.frost.core); }
function hammer(ctx, st, P) {
  const sw = Math.sin(st.time * 6) * 0.35, hot = P.might && P.mt >= 2;
  ctx.save(); ctx.translate(6, -8); ctx.rotate(-0.6 + sw);
  line(ctx, [[0, 0], [0, -9]], WOOD, 1.4); rrect(ctx, -3, -12, 6, 3.4, 1); flat(ctx, '#7a7a8a', 1);
  ctx.restore();
  line(ctx, [[7, -4], [11, 0]], hot ? '#ff8a3a' : '#c8ccd8', 1);
}
const lRune = {
  self: () => [-7, -30, 7, -8],
  body(ctx, P, d) {
    const { might, many, craft, mt, t5 } = P;
    if (t5) runeForm(ctx, P, 'lantern', false);
    plinth(ctx, 28, P, d, RW.stone2);
    const big = might && mt >= 3;
    // the waystone housing
    ctx.beginPath(); ctx.moveTo(-9, 7); ctx.lineTo(-10, -26); ctx.quadraticCurveTo(0, -36, 10, -26); ctx.lineTo(9, 7); ctx.closePath(); ink(ctx, big ? '#5a4a44' : RW.stone, 2, -10, 10);
    if (might && mt >= 2) for (const p of [[[-9, -6], [-4, -10]], [[9, -14], [5, -11]]]) line(ctx, p, '#ff8a3a', 0.8);
    if (big) tablet(ctx, 15, 9, 10, 26, P, true);
    if (many && mt >= 2) for (const x of [-15, 15]) { rrect(ctx, x - 3, 0, 6, 8, 1); flat(ctx, '#8ab8d8', 1); }
    if (craft && mt >= 2) chainRing(ctx, 0, -2, 11, 3.4, 8, '#c8c8d8', 0);
    if (craft && mt >= 3) { circle(ctx, -14, -30, 6); flat(ctx, '#e8d8a0', 1.2); runeGlyph(ctx, -14, -30, 0.7, '#5a4a20'); }
    if (mt >= 4) crown(ctx, 0, -36, d, 0.9);
    return mt >= 4 ? -46 : -40;
  },
  back: kRune.back,
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time;
    if (many && mt >= 3) for (let i = 0; i < (mt >= 4 ? 5 : 3); i++) { const a = t * 0.8 + (i / (mt >= 4 ? 5 : 3)) * TAU; if (Math.sin(a) >= 0) runeTile(ctx, Math.cos(a) * 21, 2 + Math.sin(a) * 6); }
    if (!FACE.skip) { const col = many && mt >= 2 ? DMG.frost.core : craft && mt >= 2 ? '#fff6d0' : DMG.blast.core; pane(ctx, 0, -15, 10, 14, d); glow(ctx, 0, -15, 12, DMG.blast.core, 0.4); runeGlyph(ctx, 0, -29, 0.6, col); if (might && mt >= 3) { glow(ctx, 15, -8, 10, DMG.blast.core, 0.5); runeGlyph(ctx, 15, -8, 1.1, DMG.blast.core); } }
    // the chisel arm
    const sw = Math.sin(t * 6) * 0.3;
    ctx.save(); ctx.translate(9, -14); ctx.rotate(0.6 + sw); line(ctx, [[0, 0], [9, 0]], IRON2, 1.6); line(ctx, [[9, 0], [12, 0]], might && mt >= 2 ? '#ff8a3a' : '#c8ccd8', 1.1); ctx.restore();
  },
  muzzle(P, ang, out) { out[0] = 0; out[1] = -15; return out; },
};

export const ART = {
  kindling: { avatar: kAvatar, choir: kChoir, ferry: kFerry, undertow: kUndertow, lampwright: kLamp, runewright: kRune },
  lantern: { avatar: lAvatar, choir: lChoir, ferry: lFerry, undertow: lUndertow, lampwright: lLamp, runewright: lRune },
};
// The lava variant for Ashfork (a proposal): the same wards and stats, recoloured: a basalt barge
// with an ember-glass lantern, and a spirit of molten rock rising from a lava swirl.
export const FY_LAVA = { log: '#4a3434', log2: '#3a2626', hull: '#3a2a2a', coat: '#4a3a3a', hat: '#c8963a' };
const UT_LAVA = { body: '#ffb070', body2: '#c8501a', foam: '#ffe0a0', brass: '#6a4a3a' };
function lavaArt(art) {
  const swap = (fn) => (...a) => { const f = { ...FY }, u = { ...UT }; Object.assign(FY, FY_LAVA); Object.assign(UT, UT_LAVA); try { return fn(...a); } finally { Object.assign(FY, f); Object.assign(UT, u); } };
  return { ...art, body: swap(art.body), back: swap(art.back), front: swap(art.front) };
}
// Adds the six (and the lava variants of the two water wards) to the game's skin tables and damage
// table, in this process only.
export function registerNewWards() {
  for (const [type, w] of Object.entries(NEW_WARDS)) {
    WARD_DMG[type] = w.dmg;
    KINDLINGS[type] = ART.kindling[type];
    LANTERNS[type] = ART.lantern[type];
  }
  for (const type of ['ferry', 'undertow']) {
    WARD_DMG[type + '_lava'] = NEW_WARDS[type].dmg;
    KINDLINGS[type + '_lava'] = lavaArt(ART.kindling[type]);
    LANTERNS[type + '_lava'] = lavaArt(ART.lantern[type]);
  }
}
