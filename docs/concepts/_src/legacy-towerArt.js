// The game's original top-down tower art (before the 2026-11 visual overhaul), kept only so the
// concept scripts can render the 'current art' comparisons. The game no longer uses it.
// Tower designs, drawn from shapes at the origin.
//
// How upgrades show:
//   - every tier makes the tower a little bigger, and pips around the base count tiers per path
//   - tier 2 on a path adds a coloured band to the base
//   - tier 3 swaps in a design specific to that path (a Ballista looks nothing like a Volley drum)
//     and adds buttresses to the base
//   - tier 4 is a bigger capstone design with an animated aura and rune ring in the path colour
//
// st: { ang, recoil (0-1), time, pulse (0-1), tx, ty (target offset or null), pop (0-1 upgrade pop) }
import { PATH_COLORS } from '../../../public/js/data/towers.js';

const TAU = Math.PI * 2;
const INK = '#1d1030';
const PATH_DARK = ['#b86a0a', '#0f8fb5', '#7b2fc0'];
const PATH_LIGHT = ['#ffe0a0', '#b8f6ff', '#ecc8ff'];

// ---- shape helpers --------------------------------------------------------------------------
function poly(ctx, r, sides, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * TAU;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

function star(ctx, rOut, rIn, points, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = rot + (i / (points * 2)) * TAU, r = i % 2 ? rIn : rOut;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
}

function fillInk(ctx, fill, w = 2) {
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.stroke();
}

function rect(ctx, x, y, w, h, fill, lw = 2) {
  ctx.beginPath(); ctx.rect(x, y, w, h);
  fillInk(ctx, fill, lw);
}

// Additive glow made of a few soft discs (cheaper than gradients every frame).
function glow(ctx, r, color, alpha) {
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = color;
  for (const [k, a] of [[1, 0.25], [0.7, 0.35], [0.45, 0.5]]) {
    ctx.globalAlpha = alpha * a;
    circle(ctx, 0, 0, r * k); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = op;
}

function mainPath(tiers) {
  let best = -1, bt = 0;
  for (let i = 0; i < 3; i++) if (tiers[i] > bt) { bt = tiers[i]; best = i; }
  return { main: best, mt: bt };
}

// ---- shared base ----------------------------------------------------------------------------
function platform(ctx, sides, rot, body, tiers, st) {
  const { main, mt } = mainPath(tiers);
  const col = main >= 0 ? PATH_COLORS[main] : '#8fb8d8';
  const r = 17 + (mt >= 3 ? 2 : 0) + (mt >= 4 ? 2 : 0);

  ctx.fillStyle = 'rgba(10,40,35,0.45)';
  ctx.beginPath(); ctx.ellipse(3, 5, r + 2, r, 0, 0, TAU); ctx.fill();

  if (mt >= 4) {
    // capstone aura: pulsing glow + rotating rune ring
    glow(ctx, r + 20 + Math.sin(st.time * 3) * 3, col, 0.55);
    ctx.save();
    ctx.rotate(st.time * 0.8);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 6]);
    circle(ctx, 0, 0, r + 11); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PATH_LIGHT[main];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      ctx.save(); ctx.translate(Math.cos(a) * (r + 11), Math.sin(a) * (r + 11)); ctx.rotate(a);
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();
    }
    ctx.restore();
  }
  if (mt >= 3) {
    // buttresses
    const n = sides > 8 ? 4 : sides === 6 ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const a = rot + Math.PI / n + (i / n) * TAU;
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(r - 4, -6); ctx.lineTo(r + 7, 0); ctx.lineTo(r - 4, 6); ctx.closePath();
      fillInk(ctx, PATH_DARK[main], 1.8);
      ctx.restore();
    }
  }
  poly(ctx, r, sides, rot);
  fillInk(ctx, '#2b3a58', 2.5);
  poly(ctx, r - 4, sides, rot);
  ctx.fillStyle = body; ctx.fill();
  if (mt >= 2) {
    poly(ctx, r - 1.8, sides, rot);
    ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.stroke();
  }
  // tier pips: one dot per tier bought, grouped by path along the bottom edge
  for (let pi = 0; pi < 3; pi++) {
    const n = tiers[pi];
    for (let k = 0; k < n; k++) {
      const a = Math.PI / 2 + (pi - 1) * 1.1 + (k - (n - 1) / 2) * 0.26;
      circle(ctx, Math.cos(a) * (r - 1.5), Math.sin(a) * (r - 1.5), 2.4);
      fillInk(ctx, PATH_COLORS[pi], 1);
    }
  }
}

// ---- Bolt Ward ------------------------------------------------------------------------------
function bolt(ctx, tiers, st) {
  const [a, b, c] = tiers;
  const { main, mt } = mainPath(tiers);
  platform(ctx, 6, Math.PI / 6, '#3d72c4', tiers, st);
  const back = st.recoil * 4;

  if (main === 2 && mt >= 3 && st.tx != null) {
    // Hunter's laser sight
    ctx.strokeStyle = mt >= 4 ? 'rgba(220,120,255,0.75)' : 'rgba(210,120,255,0.45)';
    ctx.lineWidth = mt >= 4 ? 2 : 1.2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(st.tx, st.ty); ctx.stroke();
  }

  ctx.rotate(st.ang);

  if (main === 0 && mt >= 3) {
    // Ballista / Siege Lance: long heavy siege frame
    const big = mt >= 4;
    const len = big ? 40 : 32, lim = big ? 22 : 18;
    rect(ctx, -14 - back, -6, len + 2, 12, big ? '#c48a2a' : '#8a5a2e');
    rect(ctx, -10 - back, -3, len - 4, 6, '#d9dee8', 1.5);
    ctx.strokeStyle = INK; ctx.lineWidth = big ? 7 : 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4 - back, -lim); ctx.quadraticCurveTo(16 - back, 0, 4 - back, lim); ctx.stroke();
    ctx.strokeStyle = big ? '#ffd166' : '#e0a050'; ctx.lineWidth = big ? 4.5 : 3.5;
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(4 - back, -lim); ctx.lineTo(-8 + st.recoil * 10, 0); ctx.lineTo(4 - back, lim); ctx.stroke();
    // loaded bolt
    const tip = len - 10 - back;
    ctx.beginPath(); ctx.moveTo(tip + 12, 0); ctx.lineTo(tip, -5); ctx.lineTo(tip, 5); ctx.closePath();
    fillInk(ctx, big ? '#fff3c4' : '#e8eef5', 1.5);
    for (const y of [-7, 7]) rect(ctx, -6 - back, y - 2, 6, 4, '#ffae2b', 1.2);
    if (big) {
      ctx.save(); ctx.translate(tip + 8, 0);
      glow(ctx, 14 + Math.sin(st.time * 8) * 2, '#ffcf5a', 0.9);
      ctx.restore();
    }
    return;
  }

  if (main === 1 && mt >= 3) {
    // Ricochet Volley / Storm of Bolts: spinning rotary drum(s)
    const big = mt >= 4;
    const spin = st.time * (big ? 9 : 6);
    const barrels = big ? 6 : 4;
    const drums = big ? [-7, 7] : [0];
    for (const dy of drums) {
      for (let i = 0; i < barrels / drums.length + (big ? 0 : 0); i++) {
        const off = Math.sin(spin + (i / (barrels / drums.length)) * TAU) * (big ? 4 : 6);
        rect(ctx, -2 - back, dy + off - 1.8, big ? 24 : 21, 3.6, '#a9c4dd', 1.2);
      }
      circle(ctx, -3 - back, dy, big ? 7.5 : 9);
      fillInk(ctx, '#2fe0ff', 2);
      ctx.save(); ctx.translate(-3 - back, dy); ctx.rotate(spin);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();
      ctx.restore();
    }
    if (big) { ctx.save(); ctx.translate(-3, 0); glow(ctx, 18, '#2fe0ff', 0.5); ctx.restore(); }
    return;
  }

  if (main === 2 && mt >= 3) {
    // Hunting Party / Death Sentence: hunter's eye on a diamond crossbow
    const big = mt >= 4;
    ctx.beginPath(); ctx.moveTo(18 - back, 0); ctx.lineTo(0, -11); ctx.lineTo(-12 - back, 0); ctx.lineTo(0, 11); ctx.closePath();
    fillInk(ctx, big ? '#5a1c8c' : '#6d2fb0', 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4 - back, -15); ctx.quadraticCurveTo(13 - back, 0, 4 - back, 15); ctx.stroke();
    ctx.strokeStyle = '#e6b3ff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.rotate(-st.ang);
    if (big) {
      ctx.save(); ctx.rotate(st.time * 1.5);
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.rotate((i / 3) * TAU); ctx.translate(16, 0);
        star(ctx, 5, 2, 4, st.time); fillInk(ctx, '#ecc8ff', 1.2);
        ctx.restore();
      }
      ctx.restore();
      glow(ctx, 16, '#c86bff', 0.7);
    }
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 5.5, 0, 0, TAU);
    fillInk(ctx, '#ffffff', 1.8);
    circle(ctx, Math.cos(st.ang) * 2.5, Math.sin(st.ang) * 2, 3.4);
    ctx.fillStyle = big ? '#ff3d7f' : '#c86bff'; ctx.fill();
    circle(ctx, Math.cos(st.ang) * 2.5, Math.sin(st.ang) * 2, 1.4);
    ctx.fillStyle = INK; ctx.fill();
    return;
  }

  // Default crossbow, growing with each tier bought.
  const limb = 11 + a * 2.2 + b * 0.8;
  ctx.strokeStyle = INK; ctx.lineWidth = 5 + a; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(1 - back, -limb); ctx.quadraticCurveTo(11 + a - back, 0, 1 - back, limb); ctx.stroke();
  ctx.strokeStyle = a >= 1 ? '#ffb347' : '#d39352'; ctx.lineWidth = 3 + a * 0.8; ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(1 - back, -limb); ctx.lineTo(-5 - back + st.recoil * 6, 0); ctx.lineTo(1 - back, limb); ctx.stroke();
  const rails = b >= 2 ? 2 : 1;
  for (let i = 0; i < rails; i++) {
    const y = (i - (rails - 1) / 2) * 6;
    rect(ctx, -8 - back, y - 2, 23 + a * 2, 4, b >= 1 ? '#b8f6ff' : '#c9d4e2', 1.5);
  }
  if (a >= 1) {
    const tip = 15 + a * 2 - back;
    ctx.beginPath(); ctx.moveTo(tip + 6 + a, 0); ctx.lineTo(tip, -3.5 - a * 0.6); ctx.lineTo(tip, 3.5 + a * 0.6); ctx.closePath();
    fillInk(ctx, '#ffe0a0', 1.2);
  }
  if (c >= 1) {
    circle(ctx, -4 - back, 0, 3 + c);
    fillInk(ctx, '#c86bff', 1.5);
    circle(ctx, -4 - back, 0, 1.2 + c * 0.4); ctx.fillStyle = '#fff'; ctx.fill();
  }
}

// ---- Mortar Kiln ----------------------------------------------------------------------------
function mortar(ctx, tiers, st) {
  const [a, b, c] = tiers;
  const { main, mt } = mainPath(tiers);
  platform(ctx, 12, 0, '#c25a3c', tiers, st);
  const back = st.recoil * 5;

  if (main === 2 && mt >= 3) {
    // Cluster Kiln / Inferno: glowing furnace that vents fire
    const big = mt >= 4;
    const flick = Math.sin(st.time * 13) * 0.15 + 0.85;
    if (big) glow(ctx, 26, '#ff6a1a', 0.7 * flick);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * TAU, r = (i % 2 ? 12 : 15) + (big ? 3 : 0);
      ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
    }
    ctx.closePath();
    fillInk(ctx, big ? '#4a1a10' : '#5c2c1e', 2.2);
    // lava cracks
    ctx.strokeStyle = big ? '#ffd23a' : '#ff8a2a'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const an = (i / 5) * TAU + 0.3;
      ctx.moveTo(Math.cos(an) * 5, Math.sin(an) * 5);
      ctx.lineTo(Math.cos(an + 0.2) * 11, Math.sin(an + 0.2) * 11);
    }
    ctx.stroke();
    circle(ctx, 0, 0, 7 + (big ? 2 : 0));
    fillInk(ctx, big ? '#fff1a0' : '#ffb347', 2);
    // flame tongues
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (big ? 5 : 3); i++) {
      const an = st.time * 2 + (i / (big ? 5 : 3)) * TAU;
      const h = (big ? 10 : 6) * (0.7 + Math.sin(st.time * 11 + i * 1.7) * 0.3);
      ctx.fillStyle = i % 2 ? 'rgba(255,160,40,0.75)' : 'rgba(255,90,20,0.75)';
      ctx.beginPath(); ctx.ellipse(Math.cos(an) * 6, Math.sin(an) * 6 - h * 0.5, 3, h, 0, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.rotate(st.ang);
    rect(ctx, 9 - back, -4, 9, 8, '#3a2a28', 1.8);
    return;
  }

  ctx.rotate(st.ang);

  if (main === 1 && mt >= 3) {
    // Triple Rack / Barrage Battery: racks of tubes
    const big = mt >= 4;
    const n = big ? 6 : 3, gap = big ? 5 : 8, h = big ? 4.6 : 7, len = big ? 26 : 24;
    if (big) { ctx.save(); ctx.translate(4, 0); glow(ctx, 22, '#2fe0ff', 0.45); ctx.restore(); }
    rect(ctx, -13, -(n * gap) / 2 - 3, 14, n * gap + 6, '#4a5568', 2);
    for (let i = 0; i < n; i++) {
      const y = (i - (n - 1) / 2) * gap;
      const kick = st.recoil * 5 * (i % 2 ? 1 : 0.4);
      rect(ctx, -9 - kick, y - h / 2, len, h, '#7b8798', 1.5);
      rect(ctx, len - 13 - kick, y - h / 2 - 1, 4, h + 2, '#2fe0ff', 1.2);
    }
    return;
  }

  if (main === 0 && mt >= 3) {
    // Earthshaker / Cataclysm: a fat howitzer with reinforcing bands
    const big = mt >= 4;
    const w = big ? 12 : 10, len = big ? 26 : 22;
    circle(ctx, -4, 0, w + 3);
    fillInk(ctx, '#3c4250', 2.2);
    rect(ctx, -6 - back, -w, len, w * 2, big ? '#d4a017' : '#6c7686', 2.2);
    for (const x of [0, 8]) rect(ctx, x - back, -w - 1.5, 3.5, w * 2 + 3, big ? '#fff1b0' : '#ffae2b', 1.4);
    ctx.beginPath(); ctx.ellipse(len - 6 - back, 0, 3.5, w * 0.8, 0, 0, TAU);
    fillInk(ctx, big ? '#ff6a1a' : '#1d1030', 1.5);
    if (big) { ctx.save(); ctx.translate(len - 6 - back, 0); glow(ctx, 12 + st.recoil * 10, '#ffae2b', 0.8); ctx.restore(); }
    return;
  }

  // Default kiln barrel, fattening with Big Shells and lengthening with Rapid Loader.
  const w = 6 + a * 1.4, len = 14 + b * 3;
  const barrels = b >= 2 ? [-w * 0.6, w * 0.6] : [0];
  for (const y of barrels) {
    const bw = b >= 2 ? w * 0.68 : w;
    rect(ctx, -5 - back, y - bw, len + 5, bw * 2, '#6c7686', 1.8);
    rect(ctx, len - 4 - back, y - bw - 1.5, 4.5, bw * 2 + 3, a >= 1 ? '#ffae2b' : '#c9d4e2', 1.4);
    ctx.beginPath(); ctx.ellipse(len - back, y, 2, bw * 0.7, 0, 0, TAU);
    ctx.fillStyle = c >= 1 ? '#ff7a2a' : INK; ctx.fill();
  }
  circle(ctx, -4 - back, 0, w * 0.95);
  fillInk(ctx, '#3c4250', 1.8);
  if (c >= 1) {
    ctx.fillStyle = `rgba(255,140,40,${0.7 + Math.sin(st.time * 8) * 0.3})`;
    circle(ctx, -4 - back, 0, 2 + c); ctx.fill();
  }
}

// ---- Rime Spire -----------------------------------------------------------------------------
function rime(ctx, tiers, st) {
  const [a, b, c] = tiers;
  const { main, mt } = mainPath(tiers);
  platform(ctx, 8, Math.PI / 8, '#2a8fd8', tiers, st);
  const flare = st.pulse || 0;
  const rot = st.time * 0.6;

  if (main === 0 && mt >= 3) {
    // Flash Freeze / Absolute Zero: a solid ice monolith
    const big = mt >= 4;
    glow(ctx, (big ? 30 : 20) + flare * 12, '#8fe8ff', big ? 0.7 : 0.45);
    poly(ctx, big ? 15 : 12.5, 8, Math.PI / 8 + (big ? rot * 0.3 : 0));
    fillInk(ctx, '#bff3ff', 2.2);
    poly(ctx, big ? 10 : 8, 8, Math.PI / 8);
    ctx.fillStyle = '#5fd0ff'; ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(2, -2); ctx.moveTo(-8, 2); ctx.lineTo(-2, 0); ctx.stroke();
    star(ctx, 5 + flare * 4, 2, 6, -rot);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    if (big) {
      for (let i = 0; i < 6; i++) {
        const an = rot * 1.5 + (i / 6) * TAU;
        ctx.save(); ctx.translate(Math.cos(an) * 24, Math.sin(an) * 24);
        star(ctx, 4, 1.5, 6, an); fillInk(ctx, '#ffffff', 1);
        ctx.restore();
      }
    }
    return;
  }

  if (main === 1 && mt >= 3) {
    // Shatter / Winter's Verdict: crown of orbiting ice blades
    const big = mt >= 4;
    const n = big ? 7 : 5;
    ctx.save(); ctx.rotate(st.time * (big ? 2.2 : 1.4));
    for (let i = 0; i < n; i++) {
      ctx.save(); ctx.rotate((i / n) * TAU);
      ctx.beginPath(); ctx.moveTo(big ? 25 : 20, 0); ctx.lineTo(7, -4.5); ctx.lineTo(9, 0); ctx.lineTo(7, 4.5); ctx.closePath();
      fillInk(ctx, big ? '#e8fbff' : '#9fe6ff', 1.6);
      ctx.restore();
    }
    ctx.restore();
    if (big) glow(ctx, 20 + flare * 8, '#2fe0ff', 0.6);
    star(ctx, 10 + flare * 3, 4, 6, -rot);
    fillInk(ctx, '#2fe0ff', 1.8);
    circle(ctx, 0, 0, 3.5); ctx.fillStyle = '#fff'; ctx.fill();
    return;
  }

  if (main === 2 && mt >= 3) {
    // Blizzard / Endless Winter: a swirling vortex
    const big = mt >= 4;
    const arms = big ? 4 : 3;
    glow(ctx, big ? 30 : 20, '#c86bff', 0.35);
    ctx.save(); ctx.rotate(-st.time * (big ? 3 : 2));
    ctx.lineCap = 'round';
    for (let i = 0; i < arms; i++) {
      ctx.save(); ctx.rotate((i / arms) * TAU);
      ctx.beginPath();
      for (let k = 0; k <= 10; k++) {
        const t = k / 10, rr = 4 + t * (big ? 22 : 16), an = t * 2.4;
        ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
      }
      ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = i % 2 ? '#ecc8ff' : '#b8f6ff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
    ctx.lineCap = 'butt';
    ctx.restore();
    star(ctx, 8 + flare * 3, 3.5, 4, rot);
    fillInk(ctx, '#ffffff', 1.5);
    return;
  }

  // Default spire: a crystal that grows facets with each tier.
  if (c >= 1) {
    ctx.strokeStyle = 'rgba(236,200,255,0.9)'; ctx.lineWidth = 2;
    circle(ctx, 0, 0, 14 + c * 2); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 2 + c; i++) {
      const an = -rot * 1.7 + (i / (2 + c)) * TAU;
      ctx.fillRect(Math.cos(an) * (14 + c * 2) - 1.8, Math.sin(an) * (14 + c * 2) - 1.8, 3.6, 3.6);
    }
  }
  if (b >= 1) {
    star(ctx, 12 + b * 2 + flare * 2, 4.5, 4 + b, -rot);
    fillInk(ctx, '#2fe0ff', 1.5);
  }
  star(ctx, 11 + a * 1.5 + flare * 3, 4.5, 4, rot);
  fillInk(ctx, '#9fe6ff', 1.8);
  star(ctx, 6 + a * 1.2, 2.5 + a * 0.4, 4, rot + Math.PI / 4);
  ctx.fillStyle = '#ffffff'; ctx.fill();
}

// ---- Storm Coil -----------------------------------------------------------------------------
function jag(ctx, x0, y0, x1, y1, amp) {
  ctx.moveTo(x0, y0);
  const nx = -(y1 - y0), ny = x1 - x0, len = Math.hypot(nx, ny) || 1;
  for (let k = 1; k < 4; k++) {
    const t = k / 4, off = (Math.random() - 0.5) * amp;
    ctx.lineTo(x0 + (x1 - x0) * t + (nx / len) * off, y0 + (y1 - y0) * t + (ny / len) * off);
  }
  ctx.lineTo(x1, y1);
}

function coil(ctx, tiers, st) {
  const [a, b, c] = tiers;
  const { main, mt } = mainPath(tiers);
  platform(ctx, 10, 0, '#6a46d8', tiers, st);
  const flick = 0.8 + Math.sin(st.time * 23) * 0.1 + st.recoil * 0.4;

  if (main === 1 && mt >= 3) {
    // Forked Strike / Maelstrom: tesla pylons ringed around a core, arcing to each other
    const big = mt >= 4;
    const n = big ? 4 : 2, rr = big ? 17 : 13;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const an = st.ang + (i / n) * TAU + (n === 2 ? Math.PI / 2 : Math.PI / 4);
      pts.push([Math.cos(an) * rr, Math.sin(an) * rr]);
    }
    ctx.strokeStyle = '#b8f6ff'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      if (n === 2 && i === 1) break;
      jag(ctx, p[0], p[1], q[0], q[1], 8);
    }
    ctx.stroke();
    circle(ctx, 0, 0, 7); fillInk(ctx, '#2fe0ff', 2);
    for (const [x, y] of pts) {
      circle(ctx, x, y, big ? 5.5 : 5); fillInk(ctx, '#e08a3c', 1.8);
      circle(ctx, x, y, 2.6); ctx.fillStyle = '#fff'; ctx.fill();
    }
    if (big) glow(ctx, 26, '#2fe0ff', 0.45 * flick);
    return;
  }

  if (main === 2 && mt >= 3) {
    // Conductive / Ion Storm: spinning gyroscope rings around the orb
    const big = mt >= 4;
    const rings = big ? 3 : 2;
    if (big) glow(ctx, 24, '#c86bff', 0.55 * flick);
    for (let i = 0; i < rings; i++) {
      ctx.save();
      ctx.rotate(st.time * (big ? 4 : 2.5) * (i % 2 ? -1 : 1) + i);
      ctx.beginPath(); ctx.ellipse(0, 0, 15 + i * 2, 5 + i * 1.5, 0, 0, TAU);
      ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke();
      ctx.strokeStyle = i === 0 ? '#c86bff' : i === 1 ? '#ecc8ff' : '#2fe0ff'; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.restore();
    }
    circle(ctx, 0, 0, 6.5 * flick); fillInk(ctx, '#f3dcff', 1.8);
    circle(ctx, 0, 0, 3); ctx.fillStyle = '#fff'; ctx.fill();
    return;
  }

  if (main === 0 && mt >= 3) {
    // Thunderhead / Smite: a great charged sun with a crown of spikes
    const big = mt >= 4;
    const r = big ? 12 : 10;
    glow(ctx, (big ? 34 : 24) * flick, '#ffd23a', 0.7);
    ctx.save(); ctx.rotate(st.time * 0.7);
    star(ctx, r + (big ? 9 : 6), r - 1, big ? 10 : 8, 0);
    fillInk(ctx, '#e08a3c', 2);
    ctx.restore();
    circle(ctx, 0, 0, r * flick); fillInk(ctx, '#ffe9a8', 2);
    circle(ctx, 0, 0, r * 0.5); ctx.fillStyle = '#fff'; ctx.fill();
    if (big && Math.random() < 0.6) {
      ctx.strokeStyle = '#fff6c0'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      const an = Math.random() * TAU;
      jag(ctx, Math.cos(an) * r, Math.sin(an) * r, Math.cos(an) * (r + 16), Math.sin(an) * (r + 16), 6);
      ctx.stroke();
    }
    return;
  }

  // Default coil: copper windings, aiming electrode(s), and an orb that grows with Overcharge.
  ctx.strokeStyle = INK; ctx.lineWidth = 4;
  for (const r of [12, 8.5]) { circle(ctx, 0, 0, r); ctx.stroke(); }
  ctx.strokeStyle = '#ff9a3c'; ctx.lineWidth = 2.4;
  for (const r of [12, 8.5]) { circle(ctx, 0, 0, r); ctx.stroke(); }
  if (c >= 1) {
    ctx.fillStyle = '#ecc8ff';
    for (let i = 0; i < c + 2; i++) {
      const an = st.time * (3 + c) + (i / (c + 2)) * TAU;
      ctx.fillRect(Math.cos(an) * 14 - 1.8, Math.sin(an) * 14 - 1.8, 3.6, 3.6);
    }
  }
  ctx.save();
  ctx.rotate(st.ang);
  const prongs = b >= 2 ? 3 : b >= 1 ? 2 : 1;
  ctx.lineCap = 'round';
  for (let i = 0; i < prongs; i++) {
    const an = (i - (prongs - 1) / 2) * 0.45;
    ctx.beginPath(); ctx.moveTo(Math.cos(an) * 5, Math.sin(an) * 5); ctx.lineTo(Math.cos(an) * 18, Math.sin(an) * 18);
    ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.stroke();
    ctx.strokeStyle = b >= 1 ? '#2fe0ff' : '#c9d4e2'; ctx.lineWidth = 2.5; ctx.stroke();
  }
  ctx.lineCap = 'butt';
  ctx.restore();
  const r = 5 + a * 1.4;
  if (a >= 1) glow(ctx, (r + 8) * flick, '#ffd23a', 0.5);
  circle(ctx, 0, 0, r * flick); fillInk(ctx, a >= 1 ? '#ffe9a8' : '#b8f6ff', 1.6);
  circle(ctx, 0, 0, r * 0.45); ctx.fillStyle = '#fff'; ctx.fill();
}

// ---- Longeye --------------------------------------------------------------------------------
function longeye(ctx, tiers, st) {
  const [a, b, c] = tiers;
  const { main, mt } = mainPath(tiers);
  platform(ctx, 5, -Math.PI / 2, '#3f8a5c', tiers, st);
  const back = st.recoil * 6;
  const big = mt >= 4;

  if (main === 2 && mt >= 3) {
    // Flare Rounds / Eye in the Dark: a great lens on a swivel, sweeping a searchlight
    if (st.tx != null) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = big ? 'rgba(236,200,255,0.16)' : 'rgba(236,200,255,0.10)';
      const ang = Math.atan2(st.ty, st.tx), len = Math.min(240, Math.hypot(st.tx, st.ty));
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.arc(0, 0, len, ang - 0.12, ang + 0.12); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.rotate(st.ang);
    rect(ctx, -10 - back, -5, 30, 10, '#2c4a3a', 2);
    circle(ctx, 4 - back, 0, big ? 11 : 9);
    fillInk(ctx, big ? '#5a1c8c' : '#3c2a5c', 2.2);
    circle(ctx, 6 - back, 0, big ? 7 : 5.5);
    fillInk(ctx, '#ecc8ff', 1.5);
    circle(ctx, 7 - back, 0, big ? 3.5 : 2.6); ctx.fillStyle = big ? '#ff3d7f' : '#c86bff'; ctx.fill();
    if (big) {
      ctx.rotate(-st.ang);
      ctx.save(); ctx.rotate(st.time * 1.2);
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate((i / 4) * TAU); ctx.translate(20, 0);
        poly(ctx, 3.5, 4, st.time); fillInk(ctx, '#ecc8ff', 1);
        ctx.restore();
      }
      ctx.restore();
      glow(ctx, 18, '#c86bff', 0.55);
    }
    return;
  }

  ctx.rotate(st.ang);

  if (main === 1 && mt >= 3) {
    // Flak Battery / Flak Curtain: stubby multi-barrel flak gun with an ammo drum
    const n = big ? 4 : 2, gap = big ? 4.6 : 6;
    circle(ctx, -6, 0, big ? 10 : 8.5); fillInk(ctx, '#5b6b4a', 2);
    for (let i = 0; i < n; i++) {
      const y = (i - (n - 1) / 2) * gap;
      const kick = st.recoil * 5 * (i % 2 ? 1 : 0.5);
      rect(ctx, -2 - kick, y - 1.9, big ? 25 : 22, 3.8, '#9aa6b4', 1.3);
      rect(ctx, (big ? 19 : 16) - kick, y - 2.6, 4, 5.2, '#2fe0ff', 1.1);
    }
    circle(ctx, -6, 0, 4); fillInk(ctx, '#2fe0ff', 1.5);
    if (big) { ctx.save(); ctx.translate(14, 0); glow(ctx, 16 + st.recoil * 8, '#2fe0ff', 0.45); ctx.restore(); }
    return;
  }

  if (main === 0 && mt >= 3) {
    // Deadeye / Headhunter: a very long rifle with a bipod; the capstone is a rail rifle
    const len = big ? 44 : 38;
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(20, -10); ctx.moveTo(14, 0); ctx.lineTo(20, 10); ctx.stroke();
    rect(ctx, -12 - back, -4.5, 16, 9, '#6b4a2a', 1.8);
    rect(ctx, -2 - back, -2.4, len - 8, 4.8, big ? '#ffd166' : '#9aa6b4', 1.6);
    if (big) for (let x = 6; x < len - 14; x += 7) rect(ctx, x - back, -4, 3, 8, '#2fe0ff', 1);
    rect(ctx, len - 12 - back, -3.2, 4, 6.4, '#ffae2b', 1.2);
    rect(ctx, -4 - back, -9, 14, 4.5, '#2c3a48', 1.4);
    circle(ctx, 10 - back, -6.8, 2.6); ctx.fillStyle = '#ffe0a0'; ctx.fill();
    if (big) { ctx.save(); ctx.translate(len - 8 - back, 0); glow(ctx, 10 + st.recoil * 12, '#ffcf5a', 0.8); ctx.restore(); }
    return;
  }

  // Default rifle: the barrel lengthens with Deadeye, gets a muzzle brake with Flak, and the
  // scope grows with Spotter.
  const len = 22 + a * 3;
  rect(ctx, -10 - back, -4, 14, 8, '#6b4a2a', 1.8);
  rect(ctx, 0 - back, -2, len - 4, 4, '#9aa6b4', 1.5);
  if (b >= 1) rect(ctx, len - 6 - back, -3.5, 5 + b, 7, '#2fe0ff', 1.2);
  else rect(ctx, len - 6 - back, -2.8, 3, 5.6, '#c9d4e2', 1.2);
  const sc = 3 + c * 1.2;
  rect(ctx, -4 - back, -5 - sc, 12, sc + 1, '#2c3a48', 1.4);
  circle(ctx, 8 - back, -4.5 - sc / 2, sc * 0.55);
  ctx.fillStyle = c >= 1 ? '#ecc8ff' : '#b8f6ff'; ctx.fill();
  if (a >= 2) rect(ctx, 4 - back, -2.8, 4, 5.6, '#ffae2b', 1);
}

// ---- Ember Censer ---------------------------------------------------------------------------
function flameTongues(ctx, n, h, spread, t, hot) {
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * spread;
    const hh = h * (0.7 + Math.sin(t * 11 + i * 1.9) * 0.3);
    ctx.fillStyle = i % 2 ? 'rgba(255,170,40,0.8)' : hot ? 'rgba(255,240,150,0.8)' : 'rgba(255,90,20,0.8)';
    ctx.beginPath(); ctx.ellipse(x, -hh * 0.55, 3 + spread * 0.25, hh * 0.6, 0, 0, TAU); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

function censer(ctx, tiers, st) {
  const [a, b, c] = tiers;
  const { main, mt } = mainPath(tiers);
  platform(ctx, 8, 0, '#7a3c1a', tiers, st);
  const big = mt >= 4;
  const flick = 0.85 + Math.sin(st.time * 13) * 0.15;
  const fire = st.recoil;

  if (main === 0 && mt >= 3) {
    // Pyre / Wildfire: a roaring brazier; the capstone throws a ring of embers
    glow(ctx, (big ? 30 : 22) * flick, '#ff6a1a', big ? 0.75 : 0.55);
    if (big) {
      ctx.save(); ctx.rotate(st.time * 2);
      for (let i = 0; i < 6; i++) {
        const an = (i / 6) * TAU;
        circle(ctx, Math.cos(an) * 22, Math.sin(an) * 22, 2.6 + Math.sin(st.time * 9 + i) * 0.8);
        ctx.fillStyle = i % 2 ? '#ffd23a' : '#ff6a1a'; ctx.fill();
      }
      ctx.restore();
    }
    ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(14, -2); ctx.lineTo(9, 10); ctx.lineTo(-9, 10); ctx.closePath();
    fillInk(ctx, '#4a2414', 2.2);
    ctx.strokeStyle = '#ffae2b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-11, 3); ctx.lineTo(11, 3); ctx.stroke();
    ctx.save(); ctx.translate(0, -1);
    flameTongues(ctx, big ? 5 : 4, big ? 22 : 16, 5, st.time, big);
    ctx.restore();
    return;
  }

  if (main === 1 && mt >= 3) {
    // Firehose / Dragon's Breath: a dragon-head nozzle; the capstone has three heads all round
    const heads = big ? 3 : 1;
    if (big) glow(ctx, 26 * flick, '#ffae2b', 0.5);
    for (let h = 0; h < heads; h++) {
      ctx.save();
      ctx.rotate(st.ang + (h / heads) * TAU);
      ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(18, -5); ctx.lineTo(22, 0); ctx.lineTo(18, 5); ctx.lineTo(-6, 8); ctx.closePath();
      fillInk(ctx, '#8a3a14', 2);
      ctx.beginPath(); ctx.moveTo(4, -7); ctx.lineTo(0, -13); ctx.lineTo(9, -6); ctx.closePath(); fillInk(ctx, '#ffae2b', 1.2);
      ctx.beginPath(); ctx.moveTo(4, 7); ctx.lineTo(0, 13); ctx.lineTo(9, 6); ctx.closePath(); fillInk(ctx, '#ffae2b', 1.2);
      circle(ctx, 10, -2.5, 1.8); ctx.fillStyle = '#fff1a0'; ctx.fill();
      if (fire > 0.2) {
        ctx.save(); ctx.translate(24, 0); ctx.rotate(Math.PI / 2);
        flameTongues(ctx, 3, 10 * fire, 3, st.time, true);
        ctx.restore();
      }
      ctx.restore();
    }
    circle(ctx, 0, 0, 6); fillInk(ctx, '#ffd23a', 1.8);
    return;
  }

  if (main === 2 && mt >= 3) {
    // Choking Ash / Ashen Brand: a dark chimney censer wreathed in smoke, with a glowing brand rune
    ctx.save(); ctx.rotate(st.time * 0.6);
    for (let i = 0; i < (big ? 6 : 4); i++) {
      const an = (i / (big ? 6 : 4)) * TAU;
      circle(ctx, Math.cos(an) * 16, Math.sin(an) * 16, 6 + Math.sin(st.time * 3 + i) * 1.5);
      ctx.fillStyle = 'rgba(70,60,70,0.55)'; ctx.fill();
    }
    ctx.restore();
    poly(ctx, 12, 6, Math.PI / 6); fillInk(ctx, '#3a2a2e', 2.2);
    poly(ctx, 7, 6, Math.PI / 6); fillInk(ctx, '#5a3a3a', 1.5);
    ctx.strokeStyle = big ? '#ff3d7f' : '#c86bff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(4, 3); ctx.lineTo(-4, 3); ctx.closePath(); ctx.stroke();
    if (big) glow(ctx, 18 * flick, '#c86bff', 0.5);
    return;
  }

  // Default: a hanging censer pot with a nozzle; hotter, longer and smokier with each path.
  ctx.save(); ctx.rotate(st.ang);
  const len = 12 + b * 3;
  rect(ctx, 4, -3 - b * 0.4, len, 6 + b * 0.8, '#5a3a24', 1.6);
  rect(ctx, len + 1, -4 - b * 0.4, 4, 8 + b * 0.8, '#ffae2b', 1.2);
  if (fire > 0.2) {
    ctx.save(); ctx.translate(len + 7, 0); ctx.rotate(Math.PI / 2);
    flameTongues(ctx, 2 + b, 8 * fire + b * 2, 3, st.time, a >= 2);
    ctx.restore();
  }
  ctx.restore();
  circle(ctx, 0, 0, 10); fillInk(ctx, '#8a4a1c', 2);
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * TAU;
    circle(ctx, Math.cos(an) * 6, Math.sin(an) * 6, 1.6);
    ctx.fillStyle = a >= 1 ? '#ffd23a' : '#ff7a2a'; ctx.fill();
  }
  if (a >= 1) glow(ctx, 12 * flick, '#ff6a1a', 0.3 + a * 0.12);
  if (c >= 1) {
    for (let i = 0; i < c + 1; i++) {
      const y = -10 - ((st.time * 14 + i * 9) % 18);
      circle(ctx, Math.sin(st.time * 2 + i) * 3, y, 3 + i * 0.6);
      ctx.fillStyle = 'rgba(80,70,80,0.45)'; ctx.fill();
    }
  }
  circle(ctx, 0, 0, 4); ctx.fillStyle = '#fff1a0'; ctx.fill();
}

// ---- Prism ----------------------------------------------------------------------------------
function crystal(ctx, r, fill, rot = 0) {
  ctx.save(); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.62, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.62, 0); ctx.closePath();
  fillInk(ctx, fill, 1.6);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.moveTo(-r * 0.62, 0); ctx.lineTo(r * 0.62, 0); ctx.stroke();
  ctx.restore();
}

function prism(ctx, tiers, st) {
  const [a, b, c] = tiers;
  const { main, mt } = mainPath(tiers);
  platform(ctx, 6, 0, '#5a4a8a', tiers, st);
  const big = mt >= 4;
  const hum = 0.9 + Math.sin(st.time * 6) * 0.1;

  if (main === 0 && mt >= 3) {
    // Focus / Sunspear: a great lens in a ring; the capstone is a blazing sun disc
    glow(ctx, (big ? 30 : 20) * hum, '#ffd23a', big ? 0.75 : 0.5);
    if (big) {
      ctx.save(); ctx.rotate(st.time * 0.5);
      star(ctx, 24, 14, 12, 0); fillInk(ctx, '#ffae2b', 1.8);
      ctx.restore();
    }
    circle(ctx, 0, 0, 13); fillInk(ctx, '#3a2c5c', 2.2);
    circle(ctx, 0, 0, 9 * hum); fillInk(ctx, '#fff3b0', 1.6);
    circle(ctx, 0, 0, 4); ctx.fillStyle = '#ffffff'; ctx.fill();
    return;
  }

  if (main === 1 && mt >= 3) {
    // Refraction / Kaleidoscope: a ring of shards orbiting a core
    const n = big ? 6 : 4;
    ctx.save(); ctx.rotate(st.time * (big ? 1.4 : 0.9));
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU;
      ctx.save(); ctx.translate(Math.cos(an) * 15, Math.sin(an) * 15);
      crystal(ctx, big ? 7 : 6, i % 2 ? '#b8f6ff' : '#ecc8ff', an);
      ctx.restore();
    }
    ctx.restore();
    if (big) glow(ctx, 24 * hum, '#2fe0ff', 0.5);
    crystal(ctx, 9, '#ffffff', st.time * 0.3);
    return;
  }

  if (main === 2 && mt >= 3) {
    // Burst of Light / Supernova: a crystal inside a glowing halo; the capstone is a star
    glow(ctx, (big ? 28 : 20) * hum, '#c86bff', 0.55);
    ctx.strokeStyle = '#ecc8ff'; ctx.lineWidth = 2.5;
    circle(ctx, 0, 0, 16 + Math.sin(st.time * 3) * 1.5); ctx.stroke();
    if (big) { star(ctx, 15, 6, 8, st.time * 0.8); fillInk(ctx, '#ffe9ff', 1.6); }
    crystal(ctx, 11, '#c86bff', st.time * 0.4);
    return;
  }

  // Default: a single tall crystal that grows facets and an inner light with each tier.
  if (b >= 1) {
    for (let i = 0; i < b; i++) {
      const an = st.time * 0.8 + (i / b) * TAU;
      ctx.save(); ctx.translate(Math.cos(an) * 13, Math.sin(an) * 13);
      crystal(ctx, 4.5, '#b8f6ff', an);
      ctx.restore();
    }
  }
  if (c >= 1) { ctx.strokeStyle = 'rgba(236,200,255,0.9)'; ctx.lineWidth = 1.8; circle(ctx, 0, 0, 10 + c * 2); ctx.stroke(); }
  if (a >= 1) glow(ctx, (12 + a * 3) * hum, '#ffd23a', 0.35);
  crystal(ctx, 11 + a * 1.5, a >= 1 ? '#fff3b0' : '#d8d2f0', Math.sin(st.time) * 0.15);
}

// ---- Beacon ---------------------------------------------------------------------------------
function beacon(ctx, tiers, st) {
  const [a, b, c] = tiers;
  const { main, mt } = mainPath(tiers);
  platform(ctx, 4, Math.PI / 4, '#8a7a3a', tiers, st);
  const big = mt >= 4;
  const beat = Math.max(0, Math.sin(st.time * 6)) ** 4;

  if (main === 0 && mt >= 3) {
    // War Drum / Warhorn: a big war drum flanked by banners; the capstone adds a horn
    for (const sx of [-1, 1]) {
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx * 13, 10); ctx.lineTo(sx * 13, -18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx * 13, -18); ctx.lineTo(sx * (13 + 9 + Math.sin(st.time * 4) * 2), -14); ctx.lineTo(sx * 13, -9); ctx.closePath();
      fillInk(ctx, '#ffae2b', 1.4);
    }
    circle(ctx, 0, 0, 10 + beat * 1.5); fillInk(ctx, '#8a3a14', 2.2);
    circle(ctx, 0, 0, 7 + beat * 1.5); fillInk(ctx, '#f0dcb0', 1.5);
    if (big) {
      ctx.save(); ctx.rotate(-0.5);
      ctx.beginPath(); ctx.moveTo(-4, -12); ctx.quadraticCurveTo(10, -22, 20, -14); ctx.lineTo(18, -9); ctx.quadraticCurveTo(10, -15, -2, -9); ctx.closePath();
      fillInk(ctx, '#ffd166', 1.6);
      ctx.restore();
      glow(ctx, 22 + beat * 8, '#ffae2b', 0.5);
    }
    return;
  }

  if (main === 1 && mt >= 3) {
    // Skyward Beam / Pharos: a lighthouse lamp with sweeping beams
    const beams = big ? 2 : 1;
    ctx.save(); ctx.rotate(st.time * 1.2);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < beams; i++) {
      ctx.save(); ctx.rotate((i / beams) * TAU);
      ctx.fillStyle = 'rgba(184,246,255,0.22)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(big ? 60 : 44, -9); ctx.lineTo(big ? 60 : 44, 9); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    poly(ctx, 10, 8, 0); fillInk(ctx, '#e8eef5', 2);
    poly(ctx, 6.5, 8, 0); fillInk(ctx, '#2fe0ff', 1.5);
    circle(ctx, 0, 0, 3.5); ctx.fillStyle = '#ffffff'; ctx.fill();
    if (big) glow(ctx, 24, '#2fe0ff', 0.6);
    return;
  }

  if (main === 2 && mt >= 3) {
    // Coffers / Golden Hearth: a chest of coins; the capstone glows like a hearth
    if (big) glow(ctx, 24 + beat * 4, '#ffd23a', 0.6);
    rect(ctx, -12, -5, 24, 14, '#7a4a1a', 2);
    rect(ctx, -12, -10, 24, 6, '#9a5a1c', 2);
    rect(ctx, -2.5, -6, 5, 6, '#ffd23a', 1.2);
    for (let i = 0; i < (big ? 5 : 3); i++) {
      circle(ctx, -8 + i * 4, -12 - (i % 2) * 2, 2.8); fillInk(ctx, '#ffd23a', 1);
    }
    return;
  }

  // Default: a stone post with a lamp; drums, a brighter lamp or coins appear with each path.
  rect(ctx, -4, -4, 8, 12, '#6c7686', 1.6);
  const lamp = 6 + b * 1.2;
  glow(ctx, (14 + b * 3) * (0.85 + beat * 0.3), '#ffe45c', 0.45 + b * 0.08);
  circle(ctx, 0, -6, lamp); fillInk(ctx, '#ffe9a8', 1.8);
  circle(ctx, 0, -6, lamp * 0.45); ctx.fillStyle = '#ffffff'; ctx.fill();
  if (a >= 1) for (const sx of [-1, 1]) { circle(ctx, sx * 11, 6, 4 + a * 0.6 + beat); fillInk(ctx, '#c25a3c', 1.4); }
  if (c >= 1) for (let i = 0; i < c + 1; i++) { circle(ctx, -6 + i * 4, 10, 2.4); fillInk(ctx, '#ffd23a', 1); }
}

const ART = { bolt, mortar, rime, coil, longeye, censer, prism, beacon };

// Visual scale: each tier makes the tower a little bigger, capstones a lot.
export function towerScale(tiers) {
  const level = tiers[0] + tiers[1] + tiers[2];
  const mt = Math.max(tiers[0], tiers[1], tiers[2]);
  return 0.92 + level * 0.04 + (mt >= 4 ? 0.1 : 0);
}

export function drawTower(ctx, type, tiers, st) {
  ctx.save();
  const s = towerScale(tiers) * (1 + (st.pop || 0) * 0.45);
  ctx.scale(s, s);
  (ART[type] || ART.bolt)(ctx, tiers, st);
  ctx.restore();
  if (st.pop > 0) {
    // white flash over the whole tower during the upgrade pop
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = st.pop * 0.5;
    ctx.fillStyle = '#ffffff';
    circle(ctx, 0, 0, 22 * s); ctx.fill();
    ctx.restore();
  }
}

// Static icon for shop buttons and the tower panel.
export function drawTowerIcon(canvas, type, tiers = [0, 0, 0]) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  const s = canvas.width / (52 * Math.max(1, towerScale(tiers) * (Math.max(...tiers) >= 3 ? 1.25 : 1)));
  ctx.scale(s, s);
  drawTower(ctx, type, tiers, { ang: -Math.PI / 4, recoil: 0, time: 0.4, pulse: 0, tx: null, ty: null, pop: 0 });
}
