// Skin B · KINDLINGS (the active skin): every ward is a little spirit of the Heartfire with big
// eyes that watch the target and a flame on its head in the damage colour. Each one is coloured
// and dressed for its job (a hardy green archer, an ember salamander, a frosted ghost, a watchful
// eye on a mast). Same interface as lanterns.js (body / back / front / muzzle), plus
// `breathe: true` for a slow idle squash. The Longeye is the Lantern body with a Kindling eye.
import { FACE, gearInFront, DMG, INK, TAU, circle, poly, rrect, star, ink, flat, line, glow, notches, pips, glyph, aim, FORE, shade, crown, groundAura, twinkle, risingMotes, brows } from './kit.js';
import { longeyeArt, roof } from './lanterns.js';
import { crossbowX, tripod, ballista, repeater, hawk, mark, banner, sigil, quiver, BALLISTA_TIP, REPEATER_TIP, STEEL as STEEL_B, STEEL2, GOLD, LEATHER, BRASS, GREEN, GREEN2, NIGHT, NIGHT2, SILVER } from './bolt-parts.js';
import { iceCrystal, iceBlade, snowCloud, scarf, fuelTank, ashCollar, IRON as P_IRON, GOLD as P_GOLD, BRASS as P_BRASS, COPPER, tubeLean, tube, shell, crate, cinderPool, chimney, smokePuffs, lavaCracks, prong, orb, zap, pylon, cloud, gyro, gem, shard, lensRing, sunDisc, starBurst, drum, warhorn, pennant, coins, chest, beam,
  snareArt, crook, paperLantern, moths, flyStrips, stickyNet, wand, wandTip, torchPole, torchFlame, orbitSparks, bowl, emberHeap, emberTop, emberWisp, crescent, heartGrill } from './parts.js';

export const WAX = '#f3e4c6', WAX2 = '#e2cfa8', WOOD = '#7a5236', BRONZE = '#c8963a', STEEL = STEEL_B;
const EMBER = '#ff7a3a', EMBER2 = '#ffb070', CHAR = '#3a1a14';
const ICE = '#9fe6ff', ICE2 = '#3fb0dc';

// The stone each Kindling stands on, dressed for the ward: plain, snow-capped or smouldering.
export function hearthstone(ctx, w, P, d, look = 'plain') {
  ctx.beginPath(); ctx.ellipse(0, 11, w / 2, 4.5, 0, 0, TAU); ink(ctx, look === 'coals' ? '#4a3a3a' : '#5a5f78', 1.8, -w / 2, w / 2);
  ctx.beginPath(); ctx.ellipse(0, 9.5, w / 2 - 1.5, 3, 0, 0, TAU); ctx.fillStyle = look === 'coals' ? '#5c4646' : '#727893'; ctx.fill();
  if (look === 'snow') {
    ctx.beginPath(); ctx.ellipse(0, 9.2, w / 2 - 0.5, 3.4, 0, Math.PI, TAU);
    for (let i = 0; i <= 6; i++) { const x = w / 2 - 0.5 - i * ((w - 1) / 6); ctx.lineTo(x, 9.5 + (i % 2 ? 1.6 : 0.6)); }
    ctx.closePath(); flat(ctx, '#f4fdff', 1.2);
  }
  if (look === 'coals') for (let i = 0; i < 7; i++) { circle(ctx, -w / 2 + 3 + i * ((w - 6) / 6), 9.5 + (i % 2) * 1.2, 1.3); ctx.fillStyle = i % 2 ? '#ff9a3a' : '#ff5a2a'; ctx.fill(); }
  notches(ctx, P.mt, 0, 13.2, w - 8, DMG[d].core, 2.6);
  pips(ctx, P.tiers, P.main, w / 2 - 2, 6.5);
}

// Big eyes that look along the aim and blink now and then; brows and iris colour give character.
export function eyes(ctx, x, y, st, { sep = 3.6, r = 2.8, one = false, lid = false, brow = null, iris = INK } = {}) {
  if (FACE.skip) return;
  const A = aim(st.ang), blink = ((st.time + (st.id || 0) * 1.7) % 4.3) < 0.11;
  for (const s of one ? [0] : [-1, 1]) {
    const ex = x + s * sep;
    if (blink) { line(ctx, [[ex - r, y], [ex + r, y]], '#3a2a40', 0.8); continue; }
    ctx.beginPath(); ctx.ellipse(ex, y, r, r * 1.15, 0, 0, TAU); flat(ctx, '#ffffff', 1.3);
    const px = ex + A.x * r * 0.42, py = y + A.y * r * 0.5;
    if (iris !== INK) { circle(ctx, px, py, r * 0.66); ctx.fillStyle = iris; ctx.fill(); }
    circle(ctx, px, py, r * (iris !== INK ? 0.36 : 0.55)); ctx.fillStyle = INK; ctx.fill();
    circle(ctx, px - r * 0.2, py - r * 0.25, r * 0.18); ctx.fillStyle = '#fff'; ctx.fill();
    if (lid) { ctx.beginPath(); ctx.ellipse(ex, y - r * 0.5, r * 1.1, r * 0.7, 0, Math.PI, TAU); flat(ctx, INK, 0); }
  }
  if (brow && !one) brows(ctx, x, y, sep, r, brow);
}

// The head flame (the ward's light), flickering.
export function tuft(ctx, x, y, size, d, t = 0, lean = 0) {
  if (FACE.skip) return;
  const D = DMG[d], fl = 1 + Math.sin(t * 9) * 0.08 + Math.sin(t * 23) * 0.05;
  const h = 10 * size * fl, w = 5 * size;
  glow(ctx, x, y - h * 0.4, h * 1.3, D.glow ? D.core : '#ffffff', D.glow ? 0.5 : 0.3);
  const sway = lean + Math.sin(t * 5) * 0.6 * size;
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.6, x + sway, y - h);
  ctx.quadraticCurveTo(x + w * 0.2, y - h * 0.55, x + w * 0.55, y - h * 0.7); ctx.quadraticCurveTo(x + w * 1.2, y - h * 0.3, x + w, y); ctx.closePath();
  flat(ctx, D.core, 1.6);
  ctx.beginPath(); ctx.moveTo(x - w * 0.45, y); ctx.quadraticCurveTo(x - w * 0.4, y - h * 0.4, x + sway * 0.4, y - h * 0.6); ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.3, x + w * 0.45, y); ctx.closePath();
  ctx.globalAlpha *= 0.8; ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.globalAlpha /= 0.8;
}

export function badge(ctx, x, y, r, d) { const D = DMG[d]; circle(ctx, x, y, r); flat(ctx, D.core, 1.2); glyph(ctx, D.glyph, x, y, r * 0.95, D.glow ? shade(D.deep, -0.3) : INK); }

// ==== Bolt Ward: a hardy little archer; each path grows its own form (see bolt-parts.js) ==========
// The archer's body, dressed per path and tier (static, cached).
function archer(ctx, x, P) {
  const { might, many, craft, mt } = P;
  ctx.save(); ctx.translate(x, 0);
  if (craft && mt >= 3) { // the hunter's cloak, long and dark, silver-trimmed at T4
    ctx.beginPath(); ctx.moveTo(-7, -10); ctx.quadraticCurveTo(-14, 0, -12, 10); ctx.lineTo(12, 10); ctx.quadraticCurveTo(14, 0, 7, -10); ctx.closePath();
    ink(ctx, mt >= 4 ? NIGHT : GREEN2, 1.6, -13, 13);
    if (mt >= 4) { ctx.beginPath(); ctx.moveTo(-12, 10); ctx.lineTo(12, 10); ctx.strokeStyle = SILVER; ctx.lineWidth = 1.3; ctx.stroke(); }
  }
  rrect(ctx, -7.5, -14, 15, 23, 6.5); ink(ctx, WAX, 2, -7.5, 7.5);
  ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-2.5, -4); ctx.lineTo(0, -1); ctx.lineTo(2.5, -4); ctx.lineTo(8, -4); ctx.lineTo(8.4, 9); ctx.quadraticCurveTo(0, 11, -8.4, 9); ctx.closePath();
  ink(ctx, craft && mt >= 4 ? NIGHT2 : GREEN, 1.8, -8, 8);
  rrect(ctx, -8.2, 3, 16.4, 2.6, 1); flat(ctx, LEATHER, 1);
  rrect(ctx, -1.6, 2.7, 3.2, 3.2, 0.6); flat(ctx, might && mt >= 4 ? GOLD : BRASS, 0.9);
  // MIGHT: a steel bracer, then a pauldron, then a breastplate, then gold-trimmed armour
  if (might && mt >= 1) { rrect(ctx, 4.5, -1.5, 5, 3.6, 1.2); ink(ctx, STEEL, 1.1, 4.5, 9.5); }
  if (might && mt >= 2) { ctx.beginPath(); ctx.ellipse(6.5, -4, 4.4, 3.3, 0.3, 0, TAU); ink(ctx, STEEL, 1.4, 3, 11); }
  if (might && mt >= 3) {
    ctx.beginPath(); ctx.ellipse(-6.5, -4, 4.4, 3.3, -0.3, 0, TAU); ink(ctx, STEEL, 1.4, -11, -3);
    rrect(ctx, -6, -4, 12, 8, 3); ink(ctx, STEEL, 1.5, -6, 6); glyph(ctx, 'arrow', 0, 0, 3, '#5a6478');
    if (mt >= 4) { rrect(ctx, -6, 2.6, 12, 1.6, 0.6); flat(ctx, GOLD, 0.8); for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 6.5, -4, 4.4, 3.3, s * 0.3, Math.PI, TAU); ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2; ctx.stroke(); } }
  }
  // MANY: a bandolier of bolts across the chest
  if (many && mt >= 1) { line(ctx, [[-7, -4], [6, 8]], LEATHER, 2.4); for (let i = 0; i < (mt >= 3 ? 4 : 3); i++) { const u = 0.15 + i * 0.22; poly(ctx, [[-7 + 13 * u - 1.3, -4 + 12 * u], [-7 + 13 * u, -4 + 12 * u - 3], [-7 + 13 * u + 1.3, -4 + 12 * u]]); flat(ctx, SILVER, 0.7); } }
  // CRAFT: a hood and mark charm (T2), a mask (T3), a sharp-peaked night cowl (T4)
  if (craft && mt >= 4) {
    ctx.beginPath(); ctx.moveTo(-8.8, -1); ctx.quadraticCurveTo(-10, -12, -4, -16.5); ctx.quadraticCurveTo(-1, -19, 1.5, -22.5);
    ctx.quadraticCurveTo(3.5, -18, 6, -15.5); ctx.quadraticCurveTo(10, -11, 8.8, -1); ctx.lineTo(5, -4); ctx.quadraticCurveTo(0, -12, -5, -4); ctx.closePath();
    ink(ctx, NIGHT, 1.6, -9, 9);
    ctx.beginPath(); ctx.moveTo(-5, -4); ctx.quadraticCurveTo(0, -12, 5, -4); ctx.strokeStyle = SILVER; ctx.lineWidth = 1; ctx.stroke();
  } else if (craft && mt >= 2) {
    ctx.beginPath(); ctx.moveTo(-8.5, -2); ctx.quadraticCurveTo(-9.5, -16, 0, -17); ctx.quadraticCurveTo(9.5, -16, 8.5, -2); ctx.lineTo(5, -4); ctx.quadraticCurveTo(0, -12, -5, -4); ctx.closePath();
    ink(ctx, GREEN2, 1.6, -9, 9);
  }
  if (craft && mt >= 2) { poly(ctx, [[0, 0.5], [1.6, 2.6], [0, 4.7], [-1.6, 2.6]]); flat(ctx, '#ffffff', 0.8); }
  if (craft && mt === 3) { rrect(ctx, -7, -8.4, 14, 4.6, 2); flat(ctx, '#1a1a20', 0.8); }
  if (!(craft && mt >= 2)) { // a headband and silver feather; a plumed steel helm on Siege Lance
    if (might && mt >= 4) {
      ctx.beginPath(); ctx.moveTo(-8, -9); ctx.quadraticCurveTo(-8, -17, 0, -17.5); ctx.quadraticCurveTo(8, -17, 8, -9); ctx.closePath(); ink(ctx, STEEL, 1.6, -8, 8);
      rrect(ctx, -8.4, -10.5, 16.8, 2.2, 1); flat(ctx, GOLD, 0.9);
      ctx.beginPath(); ctx.moveTo(-2, -17); ctx.quadraticCurveTo(-10, -24, -15, -19); ctx.quadraticCurveTo(-9, -19, -2, -14); flat(ctx, '#d84a3a', 1.1);
    } else {
      rrect(ctx, -7.7, -11.5, 15.4, 2.4, 1); flat(ctx, might && mt >= 2 ? STEEL : LEATHER, 1);
      ctx.beginPath(); ctx.moveTo(5.5, -10.5); ctx.quadraticCurveTo(11, -13, 12.5, -19); ctx.quadraticCurveTo(8, -16, 5.5, -10.5); flat(ctx, SILVER, 1.1);
    }
  }
  if (craft && mt === 1) { circle(ctx, 3.6, -6, 4.2); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = BRASS; ctx.lineWidth = 1.6; ctx.stroke(); line(ctx, [[7.6, -5], [9, 2]], BRASS, 0.8); }
  ctx.restore();
}
// A little archer friend (Twin-shot T3+), drawn live in front of the battery so it never hides.
function helper(ctx, x, y, s, st, d) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -6, -14, 12, 15, 5.5); ink(ctx, WAX, 1.8, -6, 6);
  rrect(ctx, -6.4, -5.5, 12.8, 7.5, 3); ink(ctx, GREEN, 1.5, -6, 6);
  rrect(ctx, -6.4, -1, 12.8, 2, 0.8); flat(ctx, LEATHER, 0.9);
  rrect(ctx, -6.2, -11.2, 12.4, 2, 0.8); flat(ctx, LEATHER, 0.8);
  eyes(ctx, 0, -8, st, { sep: 2.8, r: 2.3, brow: 'stern' });
  tuft(ctx, 0, -13.5, 0.75, d, st.time + x);
  ctx.restore();
  crossbowX(ctx, x + 2 * s / 0.66, y - 3, st.ang, s * 0.95, { recoil: st.recoil });
}
const HELPERS = (P) => (P.many && P.mt >= 4 ? [[-19, 10], [19, 11]] : P.many && P.mt >= 3 ? [[-18, 10]] : []);
// On Ballista and Twin-shot tiers 3-4 the archer steps left and works a machine mounted beside it.
const BOLT_AX = (P) => ((P.might || P.many) && P.mt >= 3 ? -5 : 0);
const MOUNT = [9, 0];
function boltGear(ctx, P, st) { // the big weapon: drawn in front, or behind the archer when it points across it
  const { might, mt } = P;
  if (might) ballista(ctx, MOUNT[0], MOUNT[1] + 1, st.ang, mt >= 4 ? 1.15 : 0.95, mt >= 4, mt >= 4, st.time, st.recoil);
  else repeater(ctx, MOUNT[0], MOUNT[1], st.ang, mt >= 4 ? 1.15 : 1, st.time, mt >= 4, st.recoil);
}
const bigGear = (P) => (P.might || P.many) && P.mt >= 3;
// Held crossbows follow the same rule as the machines: in front when pointing away from the body,
// behind it when pointing across it. inFront selects which ones to draw in this pass.
function heldBows(ctx, P, st, inFront) {
  const { might, many, mt } = P, ax = BOLT_AX(P);
  if (bigGear(P)) return;
  if (many && mt >= 2) {
    if (gearInFront(st.ang, -1) === inFront) crossbowX(ctx, -9, 1, st.ang, 0.95, { recoil: st.recoil });
    if (gearInFront(st.ang, 1) === inFront) crossbowX(ctx, 9, 1, st.ang, 0.95, { recoil: st.recoil });
  } else if (gearInFront(st.ang) === inFront) {
    if (might) crossbowX(ctx, ax + 8, 3, st.ang, 1 + mt * 0.2, { heavy: mt >= 1, winch: mt >= 1, recoil: st.recoil });
    else crossbowX(ctx, ax + 6, 2, st.ang, 1, { recoil: st.recoil });
  }
}
const bolt = {
  breathe: true,
  self: (P) => { const ax = BOLT_AX(P); return [ax - 8, -15, ax + 8, 9]; },
  body(ctx, P, d) {
    const { might, many, craft, mt } = P, ax = BOLT_AX(P);
    hearthstone(ctx, bigGear(P) ? 34 : 26, P, d);
    if (might && mt >= 3) for (const x of [-17, 17]) { poly(ctx, [[x - 1.4, 11], [x + 1.4, 11], [x, 4]]); flat(ctx, mt >= 4 ? GOLD : STEEL2, 0.9); }   // anchoring stakes
    if (many && mt >= 4) for (const x of [-9, 4]) { rrect(ctx, x - 3.5, 6, 7, 5, 1); ink(ctx, '#6a4a2a', 1.1, x - 3.5, x + 3.5); }                // ammo crates
    quiver(ctx, ax - 12.5, -15, many ? Math.min(6, 3 + mt) : mt >= 2 ? 4 : 3, might && mt >= 1 ? STEEL : '#f0f0f0');
    if (many && mt >= 1 && mt < 3) quiver(ctx, 7, -14, 3 + mt, '#f0f0f0');
    if (might && mt >= 4) banner(ctx, -19, -36, 10);
    if (bigGear(P)) { // the machine's mount: a tripod for the ballista, a brass post for the battery
      if (might) tripod(ctx, MOUNT[0], MOUNT[1] + 3, 1, mt >= 4);
      else { rrect(ctx, MOUNT[0] - 1.6, MOUNT[1], 3.2, 10, 1); ink(ctx, BRASS, 1.2, MOUNT[0] - 1.6, MOUNT[0] + 1.6); }
    }
    archer(ctx, ax, P);
    if (mt >= 4) crown(ctx, ax, craft ? -31.5 : -30, d, 1.1);
    return craft && mt >= 4 ? -43 : -39;
  },
  back(ctx, P, st, d) {
    if (P.mt >= 4) { if (P.craft) sigil(ctx, st.time, 24); else groundAura(ctx, d, st.time, 24); }
    if (bigGear(P) && !gearInFront(st.ang)) boltGear(ctx, P, st);
    heldBows(ctx, P, st, false);
    if (P.craft && P.mt >= 4) for (let i = 0; i < 3; i++) { const a = st.time * 1.1 + (i / 3) * TAU; if (Math.sin(a) < 0) mark(ctx, Math.cos(a) * 16, -2 + Math.sin(a) * 5, 3.4, st.time + i, 0.8); }
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, ax = BOLT_AX(P);
    // gear first: the weapon (big machines only when they point away from the archer), helpers, the hawk
    if (bigGear(P)) { if (gearInFront(st.ang)) boltGear(ctx, P, st); }
    heldBows(ctx, P, st, true);
    for (const [x, y] of HELPERS(P)) helper(ctx, x, y, 0.66, st, d);
    const g = (st.time * 0.7 + (st.id || 0) * 0.3) % 2.2;   // a glint runs along the loaded bolt now and then
    if (g < 0.25) { const m = this.muzzle(P, st.ang, TMP_B); twinkle(ctx, m[0], m[1], 2.4, 1 - g * 4); }
    if (craft && mt >= 3) { // Hunting Party: a hawk on the shoulder; Death Sentence: aloft, and marks orbit at belt height
      if (mt >= 4) {
        hawk(ctx, -10 + Math.cos(st.time * 1.2) * 6, -29 + Math.sin(st.time * 2.4) * 2, 0.9, st.time, true);
        for (let i = 0; i < 3; i++) { const a = st.time * 1.1 + (i / 3) * TAU; if (Math.sin(a) >= 0) mark(ctx, Math.cos(a) * 16, -2 + Math.sin(a) * 5, 3.4, st.time + i, 0.8); }
      } else { hawk(ctx, -10.5, -14, 0.85, st.time, false); mark(ctx, 12, -20, 5, st.time); }
    }
    if (might && mt >= 4) risingMotes(ctx, st.time, 4, 4, 18, -2, 14, '#ffffff', 1.4, 1.2, st.id || 0);
    if (many && mt >= 4) risingMotes(ctx, st.time, 3, -18, 18, 6, 8, '#ffcf4a', 1.2, 0.9, st.id || 0);
    // the face last, so no gear ever covers it
    eyes(ctx, ax, -6, st, { lid: craft && mt >= 2 && mt < 4, brow: craft && mt >= 2 ? null : 'stern' });
    if (craft && mt >= 4 && !FACE.skip) for (const s of [-1, 1]) glow(ctx, ax + s * 3.6, -6, 4.5, '#ffffff', 0.8 + Math.sin(st.time * 3) * 0.15);
    if (craft && mt === 1) twinkle(ctx, 2.4, -7.4, 2.2, Math.sin(st.time * 2.5) * 1.5 - 0.3);
    tuft(ctx, ax + (craft && mt >= 4 ? 1.5 : 0), craft && mt >= 4 ? -21.5 : -14 - (might && mt >= 4 ? 3 : 0), 1 + mt * 0.06, d, st.time);
  },
  muzzle(P, ang, out) {
    const { might, many, mt } = P, c = Math.cos(ang), s = Math.sin(ang) * FORE;
    let x, y, L;
    if (might && mt >= 3) { x = MOUNT[0]; y = MOUNT[1] + 1; L = BALLISTA_TIP * (mt >= 4 ? 1.15 : 0.95); }
    else if (might) { x = BOLT_AX(P) + 8; y = 3; L = 12 * (1 + mt * 0.2); }
    else if (many && mt >= 3) { x = MOUNT[0]; y = MOUNT[1]; L = REPEATER_TIP * (mt >= 4 ? 1.15 : 1); }
    else if (many && mt >= 2) { x = c >= 0 ? 9 : -9; y = 1; L = 12 * 0.95; }
    else { x = 6; y = 2; L = 12; }
    out[0] = x + c * L; out[1] = y + s * L; return out;
  },
};
const TMP_B = [0, 0];

// ==== Rime Spire: a frosted ghost of ice, icicles hanging from its skirt =========================
const RIME_SPARKS = [[-7, -12], [6, -9], [-3, 1], [8, 2], [-9, -3], [2, -15]];
// Deep Freeze: frost spikes on its cap, an ice crust, ice crystals rising behind it (Flash Freeze),
// then a glacier crown (Absolute Zero). Shatter: shards on its shoulders, spikes, orbiting ice
// blades, then a storm of them (Winter's Verdict). Blizzard: a scarf, a snow ring, a snow cloud over
// its head, then a great storm cloud with a wind swirl (Endless Winter).
const rime = {
  breathe: true,
  self: () => [-13, -18, 13, 8],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    hearthstone(ctx, 28, P, d, 'snow');
    const w = might && mt >= 3 ? 15 : 13;
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -6, w + 9, 5, 0, Math.PI, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 3; ctx.stroke(); }
    if (many && mt >= 2) {
      const n = mt >= 4 ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42, L = w + (mt >= 4 ? 10 : 7);
        poly(ctx, [[Math.cos(a - 0.2) * w * 0.8, -4 + Math.sin(a - 0.2) * w * 0.8], [Math.cos(a) * L, -4 + Math.sin(a) * L], [Math.cos(a + 0.2) * w * 0.8, -4 + Math.sin(a + 0.2) * w * 0.8]]);
        const g = ctx.createLinearGradient(0, -4 - L, 0, -4); g.addColorStop(0, '#ffffff'); g.addColorStop(1, ICE);
        ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke();
      }
    }
    // the dome, with a wavy skirt
    ctx.beginPath(); ctx.moveTo(-w, 6); ctx.bezierCurveTo(-w, -22, w, -22, w, 6);
    for (let i = 0; i < 4; i++) { const x0 = w - (i + 1) * (w * 2 / 4); ctx.quadraticCurveTo(x0 + w / 4, 10, x0, 6); }
    ctx.closePath();
    const g = ctx.createLinearGradient(-w, -18, w * 0.6, 10); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#c6f6ff'); g.addColorStop(0.75, ICE); g.addColorStop(1, ICE2);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
    // a shine, and a frosted cap
    ctx.beginPath(); ctx.ellipse(-w * 0.45, -10, 2.2, 4.5, 0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-w * 0.62, -12); ctx.quadraticCurveTo(0, -21, w * 0.62, -12);
    for (let i = 0; i <= 5; i++) ctx.lineTo(w * 0.62 - i * (w * 1.24 / 5), -12 + (i % 2 ? 2.4 : 0.6));
    ctx.closePath(); flat(ctx, '#f4fdff', 1.2);
    if (might && mt >= 1) for (const [x, h] of [[-5, 4], [0, 6], [5, 4]]) { poly(ctx, [[x - 1.6, -15.5], [x + 1.6, -15.5], [x, -15.5 - h]]); flat(ctx, '#e8fbff', 1); }   // frost spikes on the cap
    if (many && mt >= 1 && mt < 2) for (const s of [-1, 1]) { poly(ctx, [[s * 9, -6], [s * 14, -11], [s * 12, -3]]); flat(ctx, '#d8f8ff', 1.1); }                  // shards on its shoulders
    // icicles hanging from the skirt (longer with Deep Freeze)
    const L = might ? 4 + mt * 1.2 : 4;
    for (let i = 0; i < 5; i++) {
      const x = -w + 2 + i * ((w * 2 - 4) / 4), l = L * (i % 2 ? 0.7 : 1);
      poly(ctx, [[x - 1.6, 7.5], [x + 1.6, 7.5], [x, 7.5 + l]]); flat(ctx, '#e8fbff', 1);
    }
    ctx.beginPath(); ctx.ellipse(-6.5, -1.5, 2.2, 1.3, 0, 0, TAU); ctx.ellipse(6.5, -1.5, 2.2, 1.3, 0, 0, TAU); ctx.fillStyle = 'rgba(120,200,255,0.55)'; ctx.fill();
    if (might && mt >= 2) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + Math.PI / 6; ctx.lineTo(Math.cos(a) * (w + 4), -4 + Math.sin(a) * (w + 2)); } ctx.closePath(); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 2.5; ctx.stroke(); }
    glyph(ctx, 'flake', 0, 4, 3.5, DMG[d].deep);
    if (craft && mt >= 1) scarf(ctx, 0, 2.5, w - 1, mt >= 4 ? '#e8f4ff' : '#3a7fd0');
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, -6, w + 9, 5, 0, 0, Math.PI); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 3; ctx.stroke(); }
    const top = -29 - (many && mt >= 4 ? 4 : 0);
    if (mt >= 4) crown(ctx, 0, top + 1, d);
    return top - 7;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time;
    if (mt >= 4) groundAura(ctx, d, t, 24);
    if (might && mt >= 3) { // Flash Freeze: ice crystals rise behind it; Absolute Zero: a glacier crown of them
      const C = mt >= 4 ? [[-20, 10, 6, 24, -0.3], [20, 10, 6, 24, 0.3], [-11, 6, 7, 32, -0.12], [11, 6, 7, 32, 0.12], [0, 2, 8, 36, 0]] : [[-18, 9, 6, 24, -0.22], [18, 9, 6, 24, 0.22]];
      for (const [x, y, cw, ch, l] of C) iceCrystal(ctx, x, y, cw, ch, l);
    }
    if (many && mt >= 3) for (let i = 0; i < (mt >= 4 ? 6 : 3); i++) { const a = t * (mt >= 4 ? 1.8 : 1.3) + (i / (mt >= 4 ? 6 : 3)) * TAU; if (Math.sin(a) < 0) iceBlade(ctx, Math.cos(a) * 18, -1 + Math.sin(a) * 6, a + Math.PI / 2, mt >= 4 ? 1.3 : 1); }
    if (craft && mt >= 3) snowCloud(ctx, 0, mt >= 4 ? -28 : -27, mt >= 4 ? 19 : 14, t, mt >= 4 ? 9 : 5);
    // cold mist rolling off the base
    const ga = ctx.globalAlpha;
    for (let i = 0; i < 3; i++) {
      const u = (t * 0.4 + i / 3) % 1, s = i % 2 ? 1 : -1;
      ctx.globalAlpha = ga * 0.35 * (1 - u); ctx.fillStyle = '#e8fbff';
      ctx.beginPath(); ctx.ellipse(s * (6 + u * 14), 11 + u * 2, 4 + u * 5, 1.6 + u * 1.4, 0, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = ga;
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, w = might && mt >= 3 ? 15 : 13, p = st.pulse || 0, t = st.time;
    glow(ctx, 0, -4, w + 7 + p * 16 + Math.sin(t * 3) * 1.5, DMG[d].core, 0.3 + p * 0.55);
    if (many && mt >= 3) for (let i = 0; i < (mt >= 4 ? 6 : 3); i++) { const a = t * (mt >= 4 ? 1.8 : 1.3) + (i / (mt >= 4 ? 6 : 3)) * TAU; if (Math.sin(a) >= 0) iceBlade(ctx, Math.cos(a) * 18, -1 + Math.sin(a) * 6, a + Math.PI / 2, mt >= 4 ? 1.3 : 1); }
    if (craft && mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(232,251,255,0.6)'; ctx.lineWidth = 1.4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 10, 18 + i * 3, 5 + i, 0, t * 2 + i * 2, t * 2 + i * 2 + 1.6); ctx.stroke(); } ctx.restore(); }
    eyes(ctx, 0, -4, st, { sep: 4.2, r: 3, brow: 'soft', iris: might && mt >= 4 ? '#0a4fb0' : '#2a7fb0' });
    if (might && mt >= 4 && !FACE.skip) for (const s of [-1, 1]) glow(ctx, s * 4.2, -4, 4, DMG[d].core, 0.7);
    tuft(ctx, 0, -17, 0.9 + (mt >= 4 ? 0.15 : 0), d, t);
    for (let i = 0; i < RIME_SPARKS.length; i++) { const [x, y] = RIME_SPARKS[i]; twinkle(ctx, x * w / 13, y, 1.8, Math.sin(st.time * 3 + i * 1.9) * 1.4 - 0.4); }
    if (many && mt >= 2) twinkle(ctx, 0, -4 - w - (mt >= 4 ? 10 : 7), 2.6, Math.sin(st.time * 2.2) * 1.2);
    if (craft && mt >= 4) for (let i = 0; i < 6; i++) { const a = st.time * 1.4 + (i / 6) * TAU; star(ctx, Math.cos(a) * (w + 9), -6 + Math.sin(a) * 5, 3, 1.2, 6, a); flat(ctx, '#ffffff', 0.8); }
    if (might && mt >= 4) for (let i = 0; i < 4; i++) { const a = -st.time * 1.1 + (i / 4) * TAU, x = Math.cos(a) * (w + 7), y = -4 + Math.sin(a) * (w + 7) * 0.4;
      poly(ctx, [[x, y - 4], [x + 2, y], [x, y + 4], [x - 2, y]]); flat(ctx, '#e8fbff', 1); }
    if (p > 0.3) risingMotes(ctx, st.time, 6, -w, w, 4, 14, '#e8fbff', 1.6, 0.9, st.id || 0);
  },
  muzzle(P, ang, out) { out[0] = 0; out[1] = -6; return out; },
};

// ==== Longeye: the Lantern mast and gun, with a sharp Kindling eye for a head =====================
const longeye = longeyeArt(
  (ctx, P, d, top) => { // a brass-rimmed socket holding the eye, a roof and two sharp fins
    for (const s of [-1, 1]) { poly(ctx, [[s * 5, top - 11], [s * 12, top - 17], [s * 8.5, top - 8]]); ink(ctx, BRASS, 1.3, -12, 12); }
    circle(ctx, 0, top - 5, 8.5); ink(ctx, BRASS, 2, -8.5, 8.5);
    circle(ctx, 0, top - 5, 6.9); flat(ctx, '#ffffff', 1.4);
    roof(ctx, 0, top - 12, 15, 4.5, '#2f5560');
    if (P.craft && P.mt >= 2) { circle(ctx, 0, top - 5, 8.2); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = '#ffe6a0'; ctx.lineWidth = 1.6; ctx.stroke(); line(ctx, [[6.5, top - 1], [9.5, top + 6]], BRASS, 0.8); }
  },
  (ctx, P, st, d, top) => { // a steel-blue iris that tracks the target under a narrowed lid
    const A = aim(st.ang), y = top - 5, blink = ((st.time + (st.id || 0) * 1.7) % 4.3) < 0.11;
    if (blink) { circle(ctx, 0, y, 6.9); flat(ctx, '#3f6f7a', 1.4); line(ctx, [[-6, y + 0.5], [6, y + 0.5]], INK, 0.8); return; }
    const r = 3.6, px = A.x * 2.6, py = y + 0.5 + A.y * 2.2;
    circle(ctx, px, py, r); ctx.fillStyle = '#4f8fc8'; ctx.fill();
    circle(ctx, px, py, r * 0.5); ctx.fillStyle = INK; ctx.fill();
    circle(ctx, px - 1.1, py - 1.2, 0.9); ctx.fillStyle = '#fff'; ctx.fill();
    // the narrowed upper lid: a flat, slanted edge gives the watchful look
    ctx.save(); circle(ctx, 0, y, 6.9); ctx.clip();
    ctx.beginPath(); ctx.moveTo(-7.2, y - 7.5); ctx.lineTo(7.2, y - 7.5); ctx.lineTo(7.2, y - 2.6); ctx.lineTo(-7.2, y - 1.2); ctx.closePath(); flat(ctx, '#3f6f7a', 0);
    ctx.restore();
    line(ctx, [[-6.6, y - 1.4], [6.6, y - 2.6]], '#3f6f7a', 1.2);
  },
);

// ==== Ember Censer: an ember salamander, orange-red wax, charred and smouldering =================
function heads(P, ang) {
  if (P.many && P.mt >= 4) return [ang, ang + TAU / 3, ang + (2 * TAU) / 3];
  if (P.many && P.mt >= 2) return [ang - 0.35, ang + 0.35];
  return [ang];
}
const NECK = [1, -9];
function head(ctx, a, s, st, d, main, ash, plate) {
  const A = aim(a), flip = Math.cos(A.a) < 0;
  ctx.save(); ctx.translate(NECK[0], NECK[1]); ctx.rotate(A.a); if (flip) ctx.scale(1, -1); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-2, -3.5); ctx.lineTo(6, -3); ctx.lineTo(6, 3); ctx.lineTo(-2, 3.5); ctx.closePath(); flat(ctx, '#d8542a', 1.6);
  poly(ctx, [[4, -4.5], [1, -9.5], [7.5, -5]]); flat(ctx, CHAR, 1.1);                    // a charred horn
  ctx.beginPath(); ctx.ellipse(9, 0, 7.5, 5.6, 0, 0, TAU); flat(ctx, ash ? '#c2502a' : EMBER, 1.8);
  ctx.beginPath(); ctx.ellipse(9.5, 2.2, 5.5, 2.6, 0, 0, Math.PI); ctx.fillStyle = EMBER2; ctx.fill();
  ctx.beginPath(); ctx.moveTo(12, 1); ctx.lineTo(16.5, -0.5); ctx.lineTo(16.5, 3.5); ctx.closePath(); flat(ctx, '#4a0c0a', 1.2);
  if (plate) { rrect(ctx, 11, -4.2, 3.6, 8.4, 1.2); flat(ctx, '#7a8090', 1.1); rrect(ctx, 15.5, -2, 2.6, 6, 0.8); flat(ctx, P_BRASS, 0.9); }   // Firehose: an iron jaw plate and brass nozzle
  const ex = 8, ey = -2.4, blink = main && ((st.time + (st.id || 0) * 1.7) % 4.3) < 0.11;
  if (blink) line(ctx, [[ex - 2.4, ey], [ex + 2.4, ey]], '#3a2a40', 0.8);
  else {
    ctx.beginPath(); ctx.ellipse(ex, ey, 2.6, 2.9, 0, 0, TAU); flat(ctx, '#ffe27a', 1.1);
    ctx.beginPath(); ctx.ellipse(ex + 0.9, ey + 0.3, 0.7, 1.9, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();   // a slit pupil
    line(ctx, [[ex - 2.8, ey - 3.6], [ex + 2.6, ey - 2.4]], '#4a1410', 0.9);                               // a hot-tempered brow
  }
  ctx.restore();
}
// Pyre: hotter coals, flames on its back, a crest of spikes and flame (T3), then white-hot Wildfire.
// Dragon's Breath: a bellows sack, two heads, an iron jaw and a fuel tank (Firehose), then three
// heads breathing all round. Ash: soot, smoke, a mane of choking ash (T3), then the Ashen Brand.
const censer = {
  breathe: true,
  self: (P) => [-11, -11, 9, 8],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P, ash = craft && mt >= 2;
    hearthstone(ctx, 26, P, d, 'coals');
    if (might && mt >= 1) for (let i = 0; i < 5; i++) { circle(ctx, -9 + i * 4.5, 10.5 - (i % 2), 1.6); ctx.fillStyle = '#ffd27a'; ctx.fill(); }   // hotter coals
    if (many && mt >= 3) fuelTank(ctx, -12, 0, 1.1);
    if (many && mt >= 1 && mt < 3) { ctx.beginPath(); ctx.ellipse(-11, -3, 4, 3, -0.5, 0, TAU); ink(ctx, '#8a5a32', 1.2, -15, -7); line(ctx, [[-8, -5], [-5, -7]], '#6a4a2a', 1); }   // a bellows sack
    if (craft && mt >= 3) ashCollar(ctx, 1, -9, 9);
    // tail, ending in a charred, glowing tip
    ctx.beginPath(); ctx.moveTo(-6, 6); ctx.quadraticCurveTo(-16, 6, -17, -2); ctx.quadraticCurveTo(-13, 2, -8, 1); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#d8542a'; ctx.lineWidth = 3; ctx.stroke();
    circle(ctx, -17, -2.5, 2.4); flat(ctx, CHAR, 1.1);
    const R = might && mt >= 3 ? 11 : 9.5;
    if (might && mt >= 3) for (let i = 0; i < 4; i++) { const a = Math.PI * (1.05 + i * 0.17); poly(ctx, [[-1 + Math.cos(a - 0.12) * R, -1 + Math.sin(a - 0.12) * R], [-1 + Math.cos(a) * (R + 5), -1 + Math.sin(a) * (R + 5)], [-1 + Math.cos(a + 0.12) * R, -1 + Math.sin(a + 0.12) * R]]); flat(ctx, CHAR, 1.1); }
    ctx.beginPath(); ctx.ellipse(-1, -1, R, R * 0.95, 0, 0, TAU);
    const g = ctx.createLinearGradient(-R, -R, R, R); g.addColorStop(0, ash ? '#e07a4a' : '#ffa060'); g.addColorStop(0.5, ash ? '#b8482a' : EMBER); g.addColorStop(1, ash ? '#6a2414' : '#b83a1a');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(1, 3, R * 0.55, R * 0.45, 0, 0, TAU); ctx.fillStyle = EMBER2; ctx.fill();       // belly
    // charred patches with glowing cracks (more of them on the Ash path)
    const patches = ash ? [[-5, -6, 4.2], [3, -7.5, 3.4], [-7.5, 0.5, 3]] : [[-5, -6, 3.6], [3, -7.5, 2.6]];
    for (const [x, y, r] of patches) {
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0.3, 0, TAU); flat(ctx, CHAR, 0);
      line(ctx, [[x - r * 0.6, y], [x, y - r * 0.2], [x + r * 0.5, y + r * 0.3]], '#ffb347', 0.6);
    }
    for (const x of [-6, 3]) { ctx.beginPath(); ctx.ellipse(x, 8, 2.8, 1.7, 0, 0, TAU); flat(ctx, '#d8542a', 1.1); }
    if (craft && mt === 1) for (const [x, y] of [[-6, 1], [4, -3], [-2, -7]]) { circle(ctx, x, y, 1.6); ctx.fillStyle = 'rgba(40,30,36,0.7)'; ctx.fill(); }   // soot
    if (might && mt >= 3) for (let i = 0; i < 3; i++) { const x = -7 + i * 4; ctx.beginPath(); ctx.moveTo(x - 2, -R + 1); ctx.quadraticCurveTo(x - 1, -R - 5, x + 0.5, -R - 7 - (i % 2) * 2); ctx.quadraticCurveTo(x + 2, -R - 3, x + 2, -R + 1); ctx.closePath(); flat(ctx, mt >= 4 ? '#fff0c0' : '#ffb347', 1); }   // a flame crest
    badge(ctx, -2, 3, 3.2, d);
    if (craft && mt >= 4) { ctx.strokeStyle = '#2a1018'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(-3.5, -1); ctx.lineTo(-10.5, -1); ctx.closePath(); ctx.stroke(); }
    const top = -27 - (might && mt >= 4 ? 4 : 0);
    if (mt >= 4) crown(ctx, -2, -10 - R * 0.95 + 1, d);
    return top - 8;
  },
  back(ctx, P, st, d) {
    if (P.mt >= 4) groundAura(ctx, d, st.time, 22);
    const hs = heads(P, st.ang), ash = P.craft && P.mt >= 2;
    if (!FACE.skip) for (let i = 0; i < hs.length; i++) if (Math.sin(hs[i]) < -0.2) head(ctx, hs[i], i ? 0.82 : 1, st, d, i === 0, ash, P.many && P.mt >= 3);   // its heads are its face
  },
  front(ctx, P, st, d) {
    const { might, craft, mt } = P, f = st.fire || 0, R = might && mt >= 3 ? 11 : 9.5, ash = craft && mt >= 2;
    // the cracks breathe with heat, brighter while it pours fire
    glow(ctx, -2, -3, R * 1.4, '#ff6a2a', 0.18 + f * 0.25 + Math.sin(st.time * 4) * 0.06);
    glow(ctx, -17, -2.5, 5 + Math.sin(st.time * 9) * 1, '#ff8a3a', 0.8);                  // the tail tip smoulders
    if (might && mt >= 2 && !FACE.skip) { // flames along its back (its own fire, not gear)
      const n = mt >= 4 ? 5 : 3;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const x = -6 + i * 3, hh = (mt >= 4 ? 13 : 8) * (0.7 + 0.3 * Math.sin(st.time * 11 + i * 1.9));
        ctx.fillStyle = i % 2 ? 'rgba(255,170,50,0.85)' : mt >= 4 ? 'rgba(255,245,210,0.85)' : 'rgba(255,80,50,0.85)';
        ctx.beginPath(); ctx.ellipse(x, -R + 2 - hh * 0.4, 2.6, hh * 0.6, -0.3, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    const hs = heads(P, st.ang);
    if (P.many && mt >= 3) line(ctx, [[-10, -3], [-4, -8], [0, -9]], '#6a4a2a', 1.2);   // the hose from the tank
    if (might && mt >= 4) glow(ctx, -1, -2, 14, '#fff0c0', 0.25 + Math.sin(st.time * 5) * 0.08);   // Wildfire: it burns white-hot
    if (!FACE.skip) for (let i = 0; i < hs.length; i++) if (Math.sin(hs[i]) >= -0.2) head(ctx, hs[i], i ? 0.82 : 1, st, d, i === 0, ash, P.many && P.mt >= 3);
    if (f > 0.05) for (const a of hs) { const m = this.muzzle(P, a, TMP); glow(ctx, m[0], m[1], 6 + f * 6, '#ffb070', 0.6 * f); }
    tuft(ctx, 1, -9 - R * 0.95 + 2, 0.85 + (mt >= 4 ? 0.2 : 0), d, st.time, 2);
    risingMotes(ctx, st.time, mt >= 4 ? 7 : 4, -10, 8, -6, 22, '#ffb347', 1.5, 1.3, st.id || 0);   // embers
    if (ash) for (let i = 0; i < (mt >= 4 ? 4 : 2); i++) {
      const u = (st.time * 0.5 + i / (mt >= 4 ? 4 : 2)) % 1;
      circle(ctx, -7 - i * 1.5 - u * 3, -10 - u * 16, 2.5 + u * 3); ctx.fillStyle = `rgba(50,40,52,${0.75 * (1 - u)})`; ctx.fill();
    }
    if (craft && mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,80,40,${0.55 + Math.sin(st.time * 5) * 0.3})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(-3.5, -1); ctx.lineTo(-10.5, -1); ctx.closePath(); ctx.stroke(); ctx.restore(); }
  },
  muzzle(P, ang, out) { const A = aim(ang); out[0] = NECK[0] + Math.cos(A.a) * 16; out[1] = NECK[1] + Math.sin(A.a) * 16; return out; },
  spouts: heads,
};
const TMP = [0, 0];

// ==== Mortar Kiln: a fat clay-brick kindling with a mortar tube on its back ======================
// Big Shells: a bigger tube, shells, an armoured howitzer, a gold Cataclysm. Rapid Loader: a shell
// belt, a long barrel, a rack of three with a loader, a battery of six with two. Cinder: hot shells,
// a cinder pool, a furnace body with a chimney, a blazing Inferno. Tubes always sit behind the body.
const CLAY = '#c4683a', CLAY2 = '#e0905a';
function mortarTubes(P) { // [x, y, width, length] of each tube, back row first
  const { might, many, mt } = P;
  if (many && mt >= 4) return [[-10, -8, 5, 16], [0, -10, 5, 17], [10, -8, 5, 16], [-14, -3, 5.5, 14], [14, -3, 5.5, 14], [5, -6, 5.5, 15]];
  if (many && mt >= 3) return [[-8, -6, 5.5, 15], [2, -8, 5.5, 16], [11, -6, 5.5, 15]];
  if (might && mt >= 3) return [[6, -6, mt >= 4 ? 12 : 10, mt >= 4 ? 19 : 17]];
  return [[7, -6, might ? 7 + mt : 7, many && mt >= 2 ? 19 : 15]];
}
const kMortar = {
  breathe: true,
  self: () => [-13, -11, 13, 10],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    hearthstone(ctx, 32, P, d);
    if (might && mt >= 3) lavaCracks(ctx, [[[-13, 12], [-9, 10], [-6, 12]], [[8, 12], [12, 10], [15, 12]]], mt >= 4 ? '#ffb347' : '#2a2024', 0.8);
    if (craft && mt >= 2) cinderPool(ctx, -9, 11.5, 6, 0);
    if (might && mt >= 2) { shell(ctx, -15, 7, 3.4); shell(ctx, -11.5, 8.5, 3.4); }
    if (many && mt >= 4) { crate(ctx, -13, 6); crate(ctx, 13, 6); }
    if (craft && mt >= 3) chimney(ctx, -9, -5, mt >= 4 ? 17 : 14);
    // the body: a round clay kiln-spirit with brick seams
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 11, 0, 0, TAU);
    const g = ctx.createLinearGradient(-13, -11, 13, 11); g.addColorStop(0, CLAY2); g.addColorStop(0.55, craft && mt >= 4 ? '#b0401e' : CLAY); g.addColorStop(1, '#8a3e22');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 13, 11, 0, 0, TAU); ctx.clip();
    ctx.strokeStyle = 'rgba(80,30,16,0.45)'; ctx.lineWidth = 0.8;
    for (const y of [3, 7]) { ctx.beginPath(); ctx.moveTo(-13, y); ctx.lineTo(13, y); ctx.stroke(); for (let x = -12 + (y % 2) * 3; x < 13; x += 6) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 4); ctx.stroke(); } }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(-4, -6, 4, 2.2, -0.4, 0, TAU); ctx.fillStyle = 'rgba(255,220,190,0.5)'; ctx.fill();
    if (many && mt >= 1) { line(ctx, [[-11, -5], [9, 7]], '#6a4a2a', 2.2); for (let i = 0; i < 3; i++) shell(ctx, -6 + i * 6, -2 + i * 3.6, 1.6); }
    if (might && mt >= 3) for (const y of [-3, 4]) { ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 13, 11, 0, 0, TAU); ctx.clip(); rrect(ctx, -14, y, 28, 2.8, 1); flat(ctx, mt >= 4 ? GOLD : '#7a8090', 1); ctx.restore(); }
    if (craft && mt >= 3) { rrect(ctx, -4, 2, 8, 5, 1.5); flat(ctx, '#2a1410', 1.1); for (let i = 0; i < 3; i++) line(ctx, [[-2.5 + i * 2.5, 2.6], [-2.5 + i * 2.5, 6.4]], '#ff9a3a', 0.6); }
    if (craft && mt >= 2) lavaCracks(ctx, [[[-11, -2], [-8, 1], [-9, 5]], [[10, -3], [8, 1], [11, 4]]], mt >= 4 ? '#ffe08a' : '#ff9a3a', 0.7);
    badge(ctx, 8, 5, 3, d);
    if (mt >= 4) crown(ctx, 0, -22, d, 1.05);
    return -38;
  },
  back(ctx, P, st, d) {
    const { might, craft, mt } = P, lean = tubeLean(st.ang);
    if (mt >= 4) groundAura(ctx, d, st.time, 24);
    if (craft && mt >= 3) smokePuffs(ctx, -9, mt >= 4 ? -22 : -19, 3, st.time);
    for (const [x, y, w, L] of mortarTubes(P)) tube(ctx, x, y - st.recoil * 1.5, lean, w, L, { fill: might && mt >= 3 ? '#4a4f60' : '#5a5f70', bands: might ? Math.min(3, 1 + (mt >= 2) + (mt >= 3)) : 1, gold: might && mt >= 4, hot: craft ? Math.min(1, mt * 0.3) : 0 });
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P;
    if (craft && mt >= 2) glow(ctx, -9, 11.5, 8 + Math.sin(st.time * 3) * 1, '#ff7a2a', 0.5);
    if (craft && mt >= 3) glow(ctx, 0, 4.5, 7, '#ff9a3a', 0.4 + Math.sin(st.time * 5) * 0.15);
    if (might && mt >= 4) for (const x of [-10, 12]) glow(ctx, x, 11.5, 5, '#ffb347', 0.4 + Math.sin(st.time * 4 + x) * 0.2);
    if (many && mt >= 3) { // loader helpers carrying shells
      for (const [x, y] of many && mt >= 4 ? [[-19, 10], [19, 10]] : [[-18, 10]]) {
        ctx.save(); ctx.translate(x, y); ctx.scale(0.62, 0.62);
        ctx.beginPath(); ctx.ellipse(0, -6, 7, 7.5, 0, 0, TAU); ink(ctx, CLAY, 1.6, -7, 7);
        eyes(ctx, 0, -8, st, { sep: 2.6, r: 2.2, brow: 'stern' }); tuft(ctx, 0, -13, 0.7, d, st.time + x);
        ctx.restore(); shell(ctx, x + (x < 0 ? 4 : -4), y - 3, 2.4);
      }
    }
    if (craft && mt >= 4) { // the Inferno: flames ring its head, embers fly
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { const x = -8 + i * 4, hh = 8 * (0.7 + 0.3 * Math.sin(st.time * 11 + i * 1.9)); ctx.fillStyle = i % 2 ? 'rgba(255,170,50,0.85)' : 'rgba(255,90,40,0.85)'; ctx.beginPath(); ctx.ellipse(x, -9 - hh * 0.4, 2.4, hh * 0.55, (i - 2) * 0.15, 0, TAU); ctx.fill(); }
      ctx.restore();
      risingMotes(ctx, st.time, 6, -12, 12, -8, 20, '#ffb347', 1.5, 1.2, st.id || 0);
    }
    eyes(ctx, -1, -2, st, { sep: 4.2, r: 3, brow: 'stern' });
    tuft(ctx, -1, -10.5, 0.85 + mt * 0.05, d, st.time);
  },
  muzzle(P, ang, out) { const t = mortarTubes(P), [x, y, w, L] = t[Math.floor(t.length / 2)], lean = tubeLean(ang); out[0] = x + Math.sin(lean) * L; out[1] = y - Math.cos(lean) * L; return out; },
};

// ==== Storm Coil: a slim storm-blue kindling with copper coils and copper antlers ===============
// Overcharge: bigger orbs, a floating orb, a Thunderhead cloud, then Smite (a storm cloud with a
// great orb and bolts). Forking: more prongs, forked antlers, tesla pylons beside it, then a ring of
// four (Maelstrom). Static: a capacitor jar, crackling static, gyroscope rings, then an Ion Storm.
const STORM = '#7d86b8';
function coilTips(P) { // antler tips (orbs)
  const { many, mt } = P;
  if (many && mt >= 2) return [[-11, -21], [-5, -25], [5, -25], [11, -21]];
  if (many && mt >= 1) return [[-10, -21], [0, -26], [10, -21]];
  return [[-9, -22], [9, -22]];
}
const COIL_ORB = (P) => (P.might && P.mt >= 3 ? [0, -27] : [0, -21]);
function coilPylons(P) { const { many, mt } = P; return many && mt >= 4 ? [[-12, 4, 'b'], [12, 4, 'b'], [-19, 11, 'f'], [19, 11, 'f']] : many && mt >= 3 ? [[-17, 10, 'f'], [17, 10, 'f']] : []; }
const kCoil = {
  breathe: true,
  self: () => [-8, -14, 8, 8],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    hearthstone(ctx, many && mt >= 3 ? 34 : 26, P, d);
    for (const [x0, y0] of coilTips(P)) prong(ctx, Math.sign(x0) * 3 || 0, -12, x0, y0 + 2, might && mt >= 2 ? 3.2 : 2.6);
    if (craft && mt >= 1) { rrect(ctx, 7, 0, 5, 7, 1.5); ctx.fillStyle = 'rgba(200,180,255,0.35)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); rrect(ctx, 7.6, -1.6, 3.8, 2, 0.6); flat(ctx, COPPER, 0.8); }
    rrect(ctx, -8, -14, 16, 22, 7);
    const g = ctx.createLinearGradient(-8, -14, 8, 8); g.addColorStop(0, '#b4bce0'); g.addColorStop(0.5, STORM); g.addColorStop(1, '#4a5280');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    for (const y of mt >= 2 && might ? [-3, 1, 5] : [-1, 4]) { ctx.beginPath(); ctx.ellipse(0, y, 8.6, 2, 0, 0, Math.PI); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = COPPER; ctx.lineWidth = 1.6; ctx.stroke(); }
    badge(ctx, 0, 6.5, 2.4, d);
    if (mt >= 4) crown(ctx, 0, might ? -31 : -27, d, 1.05);
    return -40;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt } = P;
    if (mt >= 4) groundAura(ctx, d, st.time, 24);
    if (might && mt >= 3) cloud(ctx, 0, -28, mt >= 4 ? 20 : 16, mt >= 4);
    for (const [x, y, side] of coilPylons(P)) if (side === 'b') pylon(ctx, x, y, 16, d);
    if (craft && mt >= 3) for (let i = 0; i < (mt >= 4 ? 3 : 2); i++) gyro(ctx, 0, 5, 15 + i * 2.5, 3.4 + i * 0.8, Math.sin(st.time * (i % 2 ? -1.4 : 1.1) * 0.5 + i) * 0.16, 'back', i === 2 ? COPPER : P_BRASS, 1.2);
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, tips = coilTips(P), t = st.time;
    for (const [x, y] of tips) orb(ctx, x, y, might && mt >= 1 ? 3 : 2.4, d, t + x);
    for (let i = 0; i < tips.length - 1; i++) zap(ctx, tips[i][0], tips[i][1], tips[i + 1][0], tips[i + 1][1], t, 2.5);
    if (might && mt >= 2) { // the charged orb above, in a cloud from T3; bolts fork down at T4
      const [ox, oy] = COIL_ORB(P), R = mt >= 4 ? 6 : mt >= 3 ? 5 : 3.6;
      orb(ctx, ox, oy, R, d, t, 1.2);
      for (const [x, y] of [tips[0], tips[tips.length - 1]]) zap(ctx, ox, oy, x, y, t + x, 3);
      if (mt >= 4 && ((t * 2.3) % 1) < 0.35) { zap(ctx, -9, -27, -15, -12, t, 4, '#ffffff', 1.6); zap(ctx, 9, -27, 16, -10, t + 1, 4, '#ffffff', 1.6); }
    }
    for (const [x, y, side] of coilPylons(P)) {
      const tip = side === 'f' ? pylon(ctx, x, y, 14, d) : [x, y - 18];
      orb(ctx, tip[0], tip[1], 2.2, d, t + x);
      const near = tips[x < 0 ? 0 : tips.length - 1]; zap(ctx, tip[0], tip[1], near[0], near[1], t + y, 3);
    }
    if (many && mt >= 4) { const pl = coilPylons(P); zap(ctx, pl[2][0], pl[2][1] - 16, pl[0][0], pl[0][1] - 18, t, 3); zap(ctx, pl[3][0], pl[3][1] - 16, pl[1][0], pl[1][1] - 18, t + 2, 3); }
    if (craft && mt >= 1) glow(ctx, 9.5, 3.5, 5, DMG[d].core, 0.5 + Math.sin(t * 6) * 0.2);
    if (craft && mt >= 2 && ((t * 1.7) % 1) < 0.3) { zap(ctx, -8, -8, -12, -13, t, 1.5, '#e8d4ff', 0.9); zap(ctx, 8, -4, 12, -8, t + 1, 1.5, '#e8d4ff', 0.9); }
    if (craft && mt >= 3) for (let i = 0; i < (mt >= 4 ? 3 : 2); i++) gyro(ctx, 0, 5, 15 + i * 2.5, 3.4 + i * 0.8, Math.sin(st.time * (i % 2 ? -1.4 : 1.1) * 0.5 + i) * 0.16, 'front', i === 2 ? COPPER : P_BRASS, 1.2);
    if (craft && mt >= 4) for (let i = 0; i < 4; i++) { const a = t * 2 + (i / 4) * TAU; orb(ctx, Math.cos(a) * 19, 4 + Math.sin(a) * 5, 1.6, d, t + i, 0.7); }
    eyes(ctx, 0, -6, st, { sep: 3.6, r: 2.8, brow: 'soft', iris: '#8a4ad8' });
    tuft(ctx, 0, -14, 0.85 + mt * 0.05, d, t);
  },
  muzzle(P, ang, out) { if (P.might && P.mt >= 2) { const o = COIL_ORB(P); out[0] = o[0]; out[1] = o[1]; } else { const tips = coilTips(P), tp = tips[Math.cos(ang) >= 0 ? tips.length - 1 : 0]; out[0] = tp[0]; out[1] = tp[1]; } return out; },
};

// ==== Prism: a floating crystal kindling over a crystal pedestal ================================
// Focus: a polished facet, a gold band, a great lens in a gold ring beside it, then Sunspear (a
// turning sun disc behind it). Refraction: shards that orbit it, 1, 2, a ring of 4, then a
// Kaleidoscope of 6 with a ring of light. Afterglow: an inner glow, a halo, a pulsing star behind
// it, then a Supernova. The beam leaves the lens (Focus T3+) or the crystal's tip.
const PRISM_Y = -10;
function prismShards(P) { const { many, mt } = P; return many ? [0, 1, 2, 2, 4, 6][mt + 1] || 0 : 0; }
const PRISM_LENS = [12, -16];
const kPrism = {
  breathe: true,
  self: () => [-9, -24, 9, 2],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    hearthstone(ctx, 26, P, d);
    poly(ctx, [[-5, 10], [5, 10], [3, 4], [-3, 4]]); ink(ctx, '#c8b070', 1.4, -5, 5);   // the pedestal
    const s = 1 + (might ? mt * 0.05 : 0);
    gem(ctx, 0, PRISM_Y, 9 * s, 14 * s, d, craft && mt >= 4 ? '#fff6c0' : undefined);
    if (might && mt >= 2) { ctx.beginPath(); ctx.moveTo(-8.4 * s, PRISM_Y - 2); ctx.lineTo(8.4 * s, PRISM_Y - 2); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = P_GOLD; ctx.lineWidth = 1.8; ctx.stroke(); }
    if (might && mt >= 3) { line(ctx, [[8, PRISM_Y - 4], [PRISM_LENS[0] - 2, PRISM_LENS[1] + 2]], P_GOLD, 1); }
    for (const x of [-1, 1]) { circle(ctx, x * 11 * s, PRISM_Y + 4, 2); flat(ctx, WAX, 1.1); }    // little floating hands
    if (mt >= 4) crown(ctx, 0, -26 * s, d, 1);
    return -36;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, n = prismShards(P);
    if (mt >= 4 && !craft) groundAura(ctx, d, t, 24);
    if (might && mt >= 4) sunDisc(ctx, 0, PRISM_Y - 6, 13, t, 14);
    if (craft && mt >= 3) starBurst(ctx, 0, PRISM_Y - 2, mt >= 4 ? 19 : 14, t, 1);
    if (craft && mt >= 4) for (let i = 0; i < 2; i++) { const u = (t * 0.6 + i * 0.5) % 1; ctx.globalAlpha = 1 - u; ctx.strokeStyle = '#fff6c0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, 11, 8 + u * 20, 3 + u * 7, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    for (let i = 0; i < n; i++) { const a = t * 1.2 + (i / n) * TAU; if (Math.sin(a) < 0) shard(ctx, Math.cos(a) * 15, PRISM_Y + Math.sin(a) * 5, mt >= 4 ? 1.2 : 1, a); }
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, n = prismShards(P), D = DMG[d];
    glow(ctx, 0, PRISM_Y, 14 + mt * 2, D.core, 0.35 + (craft ? mt * 0.08 : 0) + Math.sin(t * 6) * 0.05);
    if (might && mt === 1) twinkle(ctx, -3, PRISM_Y - 7, 2.6, Math.sin(t * 2.5) * 1.5 - 0.2);
    if (might && mt >= 3) { lensRing(ctx, PRISM_LENS[0], PRISM_LENS[1], mt >= 4 ? 6.5 : 5.5); glow(ctx, PRISM_LENS[0], PRISM_LENS[1], 8, D.core, 0.4 + Math.sin(t * 4) * 0.1); }
    if (many && mt >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,240,170,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, PRISM_Y, 17, 6, 0, 0, Math.PI); ctx.stroke(); ctx.restore(); }
    for (let i = 0; i < n; i++) { const a = t * 1.2 + (i / n) * TAU; if (Math.sin(a) >= 0) shard(ctx, Math.cos(a) * 15, PRISM_Y + Math.sin(a) * 5, mt >= 4 ? 1.2 : 1, a); }
    if (craft && mt >= 2) { ctx.beginPath(); ctx.ellipse(0, PRISM_Y - 17, 6, 2, 0, 0, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.stroke(); ctx.strokeStyle = '#fff3a0'; ctx.lineWidth = 1.6; ctx.stroke(); }
    eyes(ctx, 0, PRISM_Y + 1, st, { sep: 3.4, r: 2.6, brow: 'soft' });
  },
  muzzle(P, ang, out) { if (P.might && P.mt >= 3) { out[0] = PRISM_LENS[0]; out[1] = PRISM_LENS[1]; } else { out[0] = 0; out[1] = PRISM_Y - 12; } return out; },
};

// ==== Beacon: a rose-wax kindling holding up a banner pole with a lamp ==========================
// War Drum: a small drum at its hip, drumsticks and war paint, a great drum it beats, then a
// warhorn on a stand and war banners. Lighthouse: a brighter lamp, a taller lamp-cage, a lighthouse
// lamp with a sweeping beam, then Pharos's twin beams. Tithe: a coin pouch, a pile of coins, a
// coffer, then a golden hearth throwing up coins. Gear stands beside the kindling, never over it.
const ROSE = '#f6c8d8', ROSE2 = '#e8a8c0';
const B_POLE_X = 7;
const B_LAMP = (P) => (P.many && P.mt >= 3 ? [B_POLE_X, -31] : P.many && P.mt >= 2 ? [B_POLE_X, -30] : [B_POLE_X, -27]);
const kBeacon = {
  breathe: true,
  self: () => [-8, -13, 6, 9],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P, L = B_LAMP(P);
    hearthstone(ctx, might && mt >= 3 || craft && mt >= 3 ? 34 : 28, P, d);
    if (might && mt >= 4) for (const x of [-16, -11]) { line(ctx, [[x, 10], [x, -24]], '#6a4a2a', 1.1); }
    if (might && mt >= 3) drum(ctx, -15, 4, 6, mt >= 4);
    if (might && mt >= 4) warhorn(ctx, 16, 1, 0.9);
    if (craft && mt >= 2 && mt < 3) coins(ctx, -14, 9, 4);
    if (craft && mt >= 3) chest(ctx, -14, 10, mt >= 4 ? 12 : 10, mt >= 4);
    rrect(ctx, B_POLE_X - 1.6, L[1] + 3, 3.2, 12 - L[1], 1.2); ink(ctx, WOOD, 1.3, B_POLE_X - 1.6, B_POLE_X + 1.6);   // the pole
    // the banner
    ctx.beginPath(); ctx.moveTo(B_POLE_X + 1.6, L[1] + 6); ctx.lineTo(B_POLE_X + 14, L[1] + 8); ctx.lineTo(B_POLE_X + 10, L[1] + 12); ctx.lineTo(B_POLE_X + 14, L[1] + 16); ctx.lineTo(B_POLE_X + 1.6, L[1] + 17); ctx.closePath();
    ink(ctx, DMG[d].deep, 1.4, B_POLE_X, B_POLE_X + 14); glyph(ctx, 'heart', B_POLE_X + 6.5, L[1] + 11.5, 3.4, '#ffd0e6');
    if (many && mt >= 2) { rrect(ctx, L[0] - 4.5, L[1] - 1, 9, 9, 2); ink(ctx, '#5a4a5a', 1.4, L[0] - 4.5, L[0] + 4.5); }   // a lamp-cage
    if (many && mt >= 3) { poly(ctx, [[L[0] - 6, L[1] - 1], [L[0] + 6, L[1] - 1], [L[0], L[1] - 6]]); ink(ctx, '#8a3a4a', 1.4, L[0] - 6, L[0] + 6); }
    rrect(ctx, -7, -12, 14, 21, 6.5); ink(ctx, ROSE, 2, -7, 7);
    if (might && mt >= 2) for (const y of [-3, 0]) line(ctx, [[-6, y], [-2, y + 1]], '#c03a5a', 0.9);   // war paint
    if (craft && mt >= 1) { ctx.beginPath(); ctx.ellipse(-6, 5, 3, 3.6, 0, 0, TAU); flat(ctx, '#b0805a', 1.1); line(ctx, [[-8, 2], [-4, 2]], DMG[d].core, 0.8); }   // coin pouch
    if (craft && mt >= 4) { ctx.beginPath(); ctx.moveTo(-7, -4); ctx.quadraticCurveTo(-12, 4, -9, 9); ctx.lineTo(7, 9); ctx.quadraticCurveTo(9, 2, 7, -4); ctx.closePath(); ctx.fillStyle = 'rgba(255,207,74,0.35)'; ctx.fill(); }
    circle(ctx, B_POLE_X - 0.5, -1, 2.4); flat(ctx, ROSE, 1.2);   // the hand on the pole
    if (mt >= 4) crown(ctx, -1, -13, d, 0.95);
    return -40;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, L = B_LAMP(P);
    if (mt >= 4) groundAura(ctx, d, t, 24);
    if (many && mt >= 3) { beam(ctx, L[0], L[1] + 2, t * 1.2, 34, 7, 0.22); if (mt >= 4) beam(ctx, L[0], L[1] + 2, t * 1.2 + Math.PI, 34, 7, 0.22); }
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, L = B_LAMP(P), beat = Math.max(0, Math.sin(t * 6)) ** 4;
    if (might && mt >= 4) { pennant(ctx, -16, 10, -24, DMG[d].core, t); pennant(ctx, -11, 10, -21, '#c03a5a', t + 1); }
    if (might && mt >= 1 && mt < 3) { ctx.beginPath(); ctx.ellipse(-8, 6, 3.6, 3, 0, 0, TAU); flat(ctx, '#a0482a', 1.1); }
    if (might && mt >= 2) line(ctx, [[-9, -2 - beat * 3], [-14, mt >= 3 ? -1 - beat * 4 : 3]], '#8a5a32', 1);   // a drumstick, beating
    if (might && mt >= 3) glow(ctx, -15, 2, 8 + beat * 6, DMG[d].core, 0.25 + beat * 0.3);
    if (craft && mt >= 3) { glow(ctx, -14, 4, mt >= 4 ? 12 : 8, '#ffcf4a', 0.45 + Math.sin(t * 3) * 0.1); risingMotes(ctx, t, mt >= 4 ? 6 : 3, -19, -9, 3, 14, '#ffcf4a', 1.6, 1.1, st.id || 0); }
    const r = many ? 4.2 + mt * 0.5 : 4.2 + (craft && mt >= 4 ? 1 : 0);
    glow(ctx, L[0], L[1] + 3, r * 3.5 * (0.9 + beat * 0.2), DMG[d].core, 0.6);
    circle(ctx, L[0], L[1] + 3, r); flat(ctx, DMG[d].core, 1.5);
    circle(ctx, L[0] - 1, L[1] + 2, r * 0.4); ctx.fillStyle = '#fff'; ctx.fill();
    if (many && mt >= 2) { // the lighthouse: a cage round the lamp, then a red cap over it
      for (const dx of [-r * 0.55, 0, r * 0.55]) line(ctx, [[L[0] + dx, L[1] + 3 - r], [L[0] + dx, L[1] + 3 + r]], '#3a3040', 0.6);
      rrect(ctx, L[0] - r - 1, L[1] + 3 + r - 1, r * 2 + 2, 2.4, 1); flat(ctx, '#5a4a5a', 1);
      if (mt >= 3) { poly(ctx, [[L[0] - r - 2, L[1] + 3 - r], [L[0] + r + 2, L[1] + 3 - r], [L[0], L[1] - r - 3]]); ink(ctx, '#c03a5a', 1.4, L[0] - r, L[0] + r); }
    }
    eyes(ctx, -1, -5, st, { sep: 3.4, r: 2.6, brow: 'soft' });
    tuft(ctx, -1, -12, 0.8, d, t);
  },
  muzzle(P, ang, out) { const L = B_LAMP(P); out[0] = L[0]; out[1] = L[1] + 3; return out; },
};

// ==== Thornlight Snare: a little spirit peeking up out of an iron grate in the road ================
// (the grate, thorns and path props are shared: snareArt in parts.js). It ducks and pops up as it bites.
const kSnare = snareArt({
  rim: '#4a4a58', thorn: '#4f7a3a',
  face(ctx, P, st, d, snap) {
    if (FACE.skip) return;
    const y = 6 - snap * 2.5;
    ctx.beginPath(); ctx.ellipse(0, y + 1, 6, 5, 0, Math.PI, TAU); ctx.lineTo(6, y + 4); ctx.quadraticCurveTo(0, y + 6, -6, y + 4); ctx.closePath(); ink(ctx, WAX, 1.6, -6, 6);
    eyes(ctx, 0, y, st, { sep: 2.8, r: 2.1, brow: 'sharp' });
    tuft(ctx, 0, y - 4, 0.55, d, st.time);
  },
});

// ==== Moth Lantern: a moth-winged spirit with a shepherd's crook, a paper lantern on the hook ======
// Bright Lure: a bigger lantern, a brighter one, a round moon lantern (Moonlure), then a great moon
// with rays. Flypaper: sticky strips on a post, more strips and a gum pot, a sticky net, then a
// golden glue net. Moth-trap: glowing moths, more of them, an iron cage lantern, then a swarm.
const MOTH_X = 8, MOTH_CURL = 4.2;
const mothTop = (P) => (P.might && P.mt >= 3 ? -33 : -31);
const mothLamp = (P) => { const s = P.might ? [1, 1.12, 1.24, 1.3, 1.42][P.mt] : 1; return { x: MOTH_X + MOTH_CURL * 1.6, y: mothTop(P) + MOTH_CURL * 0.5 + 3 + 6.5 * s, s, kind: P.might && P.mt >= 3 ? 'moon' : P.craft && P.mt >= 3 ? 'cage' : 'paper' }; };
const MOTH_WING = '#d8c8f0';
const kMoth = {
  breathe: true,
  self: () => [-8, -12, 6, 9],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    hearthstone(ctx, many && mt >= 3 ? 34 : 28, P, d);
    if (many && mt >= 1) { const h = mt >= 3 ? 30 : 22; line(ctx, [[-15, 10], [-15, 10 - h]], '#7a5236', 1.6); line(ctx, [[-18, 10 - h + 1], [-12, 10 - h + 1]], '#7a5236', 1.2); }   // the flypaper post
    if (many && mt >= 2) { ctx.beginPath(); ctx.ellipse(-19, 9, 3.4, 2.2, 0, 0, TAU); flat(ctx, '#8a6a3a', 1.1); ctx.beginPath(); ctx.ellipse(-19, 7.6, 2.6, 1, 0, 0, TAU); flat(ctx, '#e8c84a', 0.8); }   // the gum pot
    // moth wings on its back, both sides
    for (const sx of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(sx * 9, -5, 5.5, 7.5, sx * 0.5, 0, TAU); ink(ctx, MOTH_WING, 1.4, sx * 9 - 5, sx * 9 + 5);
      ctx.beginPath(); ctx.ellipse(sx * 8, 3, 3.6, 4.6, sx * -0.4, 0, TAU); ink(ctx, shade(MOTH_WING, -0.1), 1.2, sx * 8 - 3, sx * 8 + 3);
      circle(ctx, sx * 10, -6, 1.6); ctx.fillStyle = craft && mt >= 2 ? '#ffb030' : '#8a6aa8'; ctx.fill();
    }
    crook(ctx, MOTH_X, 10, mothTop(P), MOTH_CURL, might && mt >= 4 ? P_GOLD : '#7a5236', 2.2);
    rrect(ctx, -7, -12, 14, 21, 6.5); ink(ctx, '#f2ecf8', 2, -7, 7);
    rrect(ctx, -5, 1, 10, 6, 3); ctx.fillStyle = 'rgba(160,140,200,0.35)'; ctx.fill();   // a fuzzy moth belly
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 2, -11); ctx.quadraticCurveTo(sx * 4, -17, sx * 6.5, -18); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); for (let i = 0; i < 3; i++) line(ctx, [[sx * (3 + i * 1.2), -14 - i * 1.3], [sx * (4 + i * 1.2), -15.5 - i * 1.3]], '#6a5a80', 0.5); }   // feathery antennae
    circle(ctx, MOTH_X - 0.5, -2, 2.4); flat(ctx, '#f2ecf8', 1.2);   // the hand on the crook
    if (mt >= 4) crown(ctx, 0, -12, d, 0.9);
    return mothTop(P) - 4;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, L = mothLamp(P);
    if (mt >= 4) groundAura(ctx, d, t, 24);
    if (might && mt >= 4) sunDisc(ctx, L.x, L.y, 13, t, 12);
    if (many && mt >= 3) stickyNet(ctx, -15, mt >= 4 ? -18 : -14, MOTH_X - 1, -20, mt >= 4 ? 22 : 18, mt >= 4);
    moths(ctx, L.x, L.y, 9 + L.s * 3, craft ? [3, 4, 6, 7, 10][mt] : 3, t, craft && mt >= 1, -1);
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, L = mothLamp(P), sway = Math.sin(t * 1.6) * 0.8;
    if (many && mt >= 1) flyStrips(ctx, -15, (mt >= 3 ? -20 : -12) + 1, mt >= 2 ? 3 : 2, 7, t);
    paperLantern(ctx, L.x + sway, L.y, L.s, L.kind, 0.5 + (st.fill || 0) * 0.5);
    if (might && mt >= 2) glow(ctx, L.x + sway, L.y, 18 * L.s, DMG[d].core, 0.25 + Math.sin(t * 3) * 0.06);
    moths(ctx, L.x, L.y, 9 + L.s * 3, craft ? [3, 4, 6, 7, 10][mt] : 3, t, craft && mt >= 1, 1);
    eyes(ctx, 0, -5, st, { sep: 3.4, r: 2.6, brow: 'soft' });
    tuft(ctx, 0, -12, 0.7, d, t);
  },
  muzzle(P, ang, out) { const L = mothLamp(P); out[0] = L.x; out[1] = L.y; return out; },
};

// ==== Wandering Light: a floating wisp with a star-tipped wand, over a little rune-disc ============
// No hearthstone: it floats (its plinth is a hovering disc with the tier notches). Hunter: a longer
// wand, then a wizard's hat and crystal staff (Star Staff), then a comet staff. Swarm: orbiting
// sparks, a split tail, a little sibling wisp, then a wand in each hand. Torchbearer: a rose rune,
// a rose torch, a bigger gold torch with a rose ring, then a tall lamplighter's torch.
const WD_HAND = [7, -8], WD_HAND2 = [-7, -8];
const wandKind = (P) => (P.might ? (P.mt >= 4 ? 'comet' : P.mt >= 3 ? 'staff' : P.mt >= 2 ? 'long' : 'wand') : 'wand');
function wisp(ctx, x, y, s, fill, deep) {
  ctx.beginPath(); ctx.moveTo(x, y - 13 * s);
  ctx.bezierCurveTo(x + 8 * s, y - 12 * s, x + 8 * s, y - 2 * s, x + 4 * s, y + 3 * s);
  ctx.quadraticCurveTo(x + 4 * s, y + 8 * s, x + 7 * s, y + 10 * s);
  ctx.quadraticCurveTo(x - 1 * s, y + 10 * s, x - 3 * s, y + 4 * s);
  ctx.bezierCurveTo(x - 8 * s, y - 1 * s, x - 8 * s, y - 12 * s, x, y - 13 * s); ctx.closePath();
  ink(ctx, fill, 1.8, x - 8 * s, x + 8 * s);
  ctx.beginPath(); ctx.ellipse(x - 2.5 * s, y - 7 * s, 2.4 * s, 3.6 * s, -0.3, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
}
const kWander = {
  float: true,
  self: () => [-7, -21, 7, -1],
  shadow(ctx) { ctx.fillStyle = 'rgba(8,40,34,0.35)'; ctx.beginPath(); ctx.ellipse(1, 14, 9, 2.6, 0, 0, TAU); ctx.fill(); },
  body(ctx, P, d) {
    const { might, many, craft, mt } = P;
    // the hovering rune-disc (its plinth), with the tier notches
    ctx.beginPath(); ctx.ellipse(0, 7, 11, 3.4, 0, 0, TAU); ink(ctx, '#3a2a58', 1.6, -11, 11);
    ctx.beginPath(); ctx.ellipse(0, 6.4, 8, 2.2, 0, 0, TAU); ctx.strokeStyle = 'rgba(216,184,255,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
    notches(ctx, mt, 0, 9.6, 18, DMG[d].core, 2.2);
    pips(ctx, P.tiers, P.main, 8, 3.5);
    if (many && mt >= 3) wisp(ctx, -13, -4, 0.55, '#e0d0ff', DMG[d].deep);   // a little sibling wisp
    if (craft && mt >= 2) torchPole(ctx, -9, 4, mt >= 4 ? -24 : mt >= 3 ? -18 : -14, mt >= 3);
    wisp(ctx, 0, -8, 1, '#efe4ff', DMG[d].deep);
    if (many && mt >= 2) { ctx.beginPath(); ctx.moveTo(-1, 1); ctx.quadraticCurveTo(-4, 6, -7, 7); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = '#efe4ff'; ctx.lineWidth = 1.2; ctx.stroke(); }   // a split tail
    for (const h of [WD_HAND, WD_HAND2]) { circle(ctx, h[0], h[1], 2.2); flat(ctx, '#efe4ff', 1.1); }
    if (craft && mt >= 1) glyph(ctx, 'heart', 0, -4, 2.6, '#ff7eb6');   // the rose rune on its chest
    if (might && mt >= 3) { // a wizard's hat, with a star on it
      poly(ctx, [[-8, -18], [8, -18], [2, -31], [-1, -32]]); ink(ctx, '#3a2a68', 1.6, -8, 8);
      ctx.beginPath(); ctx.ellipse(0, -18, 9.5, 2.4, 0, 0, TAU); flat(ctx, '#4a3a80', 1.4);
      star(ctx, 1, -24, 2.4, 1, 5); flat(ctx, '#fff3a0', 0.8);
    }
    if (mt >= 4) crown(ctx, 0, might ? -31 : -21, d, 0.9);
    return might && mt >= 3 ? -36 : craft && mt >= 4 ? -30 : -25;
  },
  back(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time;
    if (mt >= 4) glow(ctx, 0, -6, 26, DMG[d].core, 0.3 + Math.sin(t * 3) * 0.06);
    if (craft && mt >= 3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,126,182,0.6)'; ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -t * 10; ctx.beginPath(); ctx.ellipse(0, 7, 16, 5, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    if (many) orbitSparks(ctx, 0, -8, 13, [0, 2, 3, 4, 6][mt], t, -1);
    if (!gearInFront(st.ang, 1)) wand(ctx, WD_HAND[0], WD_HAND[1], st.ang, wandKind(P), t, st.recoil);
    if (many && mt >= 4 && !gearInFront(st.ang, -1)) wand(ctx, WD_HAND2[0], WD_HAND2[1], st.ang, 'wand', t, st.recoil);
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time;
    if (many) orbitSparks(ctx, 0, -8, 13, [0, 2, 3, 4, 6][mt], t, 1);
    if (craft && mt >= 2) torchFlame(ctx, -9, (mt >= 4 ? -24 : mt >= 3 ? -18 : -14), mt >= 4 ? 1.4 : mt >= 3 ? 1.15 : 0.9, t);
    if (gearInFront(st.ang, 1)) wand(ctx, WD_HAND[0], WD_HAND[1], st.ang, wandKind(P), t, st.recoil);
    if (many && mt >= 4 && gearInFront(st.ang, -1)) wand(ctx, WD_HAND2[0], WD_HAND2[1], st.ang, 'wand', t, st.recoil);
    eyes(ctx, 0, -12, st, { sep: 3.2, r: 2.5, brow: might && mt >= 2 ? 'sharp' : 'soft', iris: '#5a1fb0' });
    if (!(might && mt >= 3)) tuft(ctx, 0, -20, 0.75, d, t);
  },
  muzzle(P, ang, out) { return wandTip(WD_HAND[0], WD_HAND[1], ang, wandKind(P), out); },
};

// ==== Ember Vault: an aproned keeper tending a brazier of rose embers =============================
// The embers heap up and the rose flame grows as it fills (st.fill). Great Brazier: a deeper pan,
// banked coals, a great gold-rimmed brazier, then an everburning hearth heaped with gold. Gleaners:
// long tongs, ember-wisps, a gleaner's lantern-pole, then a harvest moon over it. Hearthwarm: a warm
// glow, hearthstones, a heart grill, then a blazing heart.
const VB_X = 9, VB_Y = -1;
const vaultW = (P) => (P.might ? [15, 17, 19, 22, 25][P.mt] : 15);
const kVault = {
  breathe: true,
  self: () => [-14, -11, 0, 9],
  body(ctx, P, d) {
    const { might, many, craft, mt } = P, w = vaultW(P);
    hearthstone(ctx, 34, P, d, 'coals');
    if (craft && mt >= 2) for (let i = 0; i < 7; i++) { const a = Math.PI * (0.05 + i * 0.15); circle(ctx, VB_X + Math.cos(a) * 12, 10 + Math.sin(a) * 2.5, 1.8); flat(ctx, '#8a7a80', 0.9); }   // hearthstones
    if (many && mt >= 1 && mt < 3) { line(ctx, [[-19, 10], [-15, -10]], '#5a5f70', 1.2); line(ctx, [[-17, 10], [-15, -10]], '#5a5f70', 1.2); }   // long tongs
    if (many && mt >= 3) { line(ctx, [[-19, 10], [-19, mt >= 4 ? -26 : -22]], '#7a5236', 1.8); line(ctx, [[-19, mt >= 4 ? -24 : -20], [-14, mt >= 4 ? -24 : -20]], '#7a5236', 1.2); }   // the gleaner's pole
    // the brazier: three legs and the bowl
    for (const dx of [-5, 0, 5]) line(ctx, [[VB_X + dx, 10], [VB_X + dx * 0.3, VB_Y + w * 0.3]], might && mt >= 3 ? P_BRASS : '#5a4048', 1.5);
    bowl(ctx, VB_X, VB_Y, w, '#5a4048', might && mt >= 3);
    if (craft && mt >= 3) heartGrill(ctx, VB_X, VB_Y + w * 0.22, 0.9 + (mt >= 4 ? 0.2 : 0));
    // the keeper: a plump rose-wax spirit in an apron, poking the embers
    rrect(ctx, -14, -11, 14, 20, 6.5); ink(ctx, '#f4bccb', 2, -14, 0);
    poly(ctx, [[-11.5, 1.5], [-2.5, 1.5], [-3, 8], [-11, 8]]); flat(ctx, '#d0708e', 1);   // the apron
    glyph(ctx, 'heart', -7, 4.6, 2, '#ffe0ec');
    ctx.beginPath(); ctx.ellipse(-7, -8.2, 7.3, 3.4, 0, Math.PI, TAU); ctx.closePath(); flat(ctx, '#b0306e', 1.1);   // a headscarf
    circle(ctx, -0.6, -8.6, 1.3); flat(ctx, '#b0306e', 0.9);
    line(ctx, [[-2, 0], [VB_X - 3, VB_Y - 3]], '#8a96aa', 0.8);   // the poker
    circle(ctx, -2, 0, 2.3); flat(ctx, '#f4bccb', 1.1);
    if (mt >= 4) crown(ctx, -7, -13, d, 0.85);
    return Math.min(-22, emberTop(VB_Y, w, 1) - 14);
  },
  back(ctx, P, st, d) {
    const { many, craft, mt } = P, t = st.time;
    if (mt >= 4) groundAura(ctx, d, t, 26);
    if (craft && mt >= 1) glow(ctx, VB_X, 6, 16 + mt * 2, DMG[d].core, (st.warm ? 0.45 : 0.15) + Math.sin(t * 2) * 0.05);
    if (many && mt >= 4) crescent(ctx, -16, -31, 4.5);
  },
  front(ctx, P, st, d) {
    const { might, many, craft, mt } = P, t = st.time, w = vaultW(P), fill = st.fill || 0;
    emberHeap(ctx, VB_X, VB_Y, w, fill, t, might && mt >= 4);
    if (craft && mt >= 3) heartGrill(ctx, VB_X, VB_Y + w * 0.22, 0.9 + (mt >= 4 ? 0.2 : 0), st.warm ? 0.8 + Math.sin(t * 4) * 0.2 : 0);
    if (many && mt >= 2) { const n = mt >= 4 ? 4 : 2; for (let i = 0; i < n; i++) { const a = t * 1.6 + (i / n) * TAU; emberWisp(ctx, VB_X + Math.cos(a) * 11, VB_Y - 8 + Math.sin(a) * 4, t + i); } }
    if (many && mt >= 3) { glow(ctx, -14, mt >= 4 ? -22 : -18, 6, DMG[d].core, 0.5); circle(ctx, -14, mt >= 4 ? -22 : -18, 2.2); flat(ctx, '#ffd0e6', 1); }
    eyes(ctx, -7, -4, st, { sep: 3.2, r: 2.5, brow: 'soft' });
    tuft(ctx, -7, -11, 0.6, d, t);
  },
  muzzle(P, ang, out) { out[0] = VB_X; out[1] = VB_Y - 6; return out; },
};

export const KINDLINGS = { bolt, mortar: kMortar, rime, coil: kCoil, longeye, censer, prism: kPrism, beacon: kBeacon, snare: kSnare, moth: kMoth, wander: kWander, vault: kVault };
