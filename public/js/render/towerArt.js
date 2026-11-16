// Tower designs, drawn from shapes at the origin. Upgrade tiers visibly change each design.
// st: { ang, recoil (0-1), time, pulse (0-1) }   tiers: [a, b, c]
import { PATH_COLORS } from '../data/towers.js';

const TAU = Math.PI * 2;

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

// The specialist path (tier 3+) tints the rim; pips around the rim show every tier bought.
function base(ctx, sides, fill, tiers, rot = 0) {
  const main = tiers.findIndex((t) => t >= 3);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(2, 4, 20, 19, 0, 0, TAU); ctx.fill();
  poly(ctx, 19, sides, rot);
  ctx.fillStyle = '#172329'; ctx.fill();
  ctx.strokeStyle = main >= 0 ? PATH_COLORS[main] : '#52727a';
  ctx.lineWidth = main >= 0 ? 2.5 : 2;
  ctx.stroke();
  poly(ctx, 13.5, sides, rot);
  ctx.fillStyle = fill; ctx.fill();
  for (let pi = 0; pi < 3; pi++) {
    const n = tiers[pi];
    ctx.fillStyle = PATH_COLORS[pi];
    for (let k = 0; k < n; k++) {
      const a = Math.PI / 2 + (pi - 1) * 1.15 + (k - (n - 1) / 2) * 0.27;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 16.3, Math.sin(a) * 16.3, 2, 0, TAU); ctx.fill();
    }
  }
}

const ART = {
  // Crossbow turret. A: heavier bow and lance tip. B: more rails. C: sighting gem.
  bolt(ctx, [a, b, c], st) {
    base(ctx, 6, '#2c4148', [a, b, c], Math.PI / 6);
    ctx.rotate(st.ang);
    const back = st.recoil * 3;
    const limb = 10 + a * 1.8;
    ctx.strokeStyle = a >= 3 ? '#ffcf7a' : '#c9a36a';
    ctx.lineWidth = 2.5 + a * 0.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(1 - back, -limb);
    ctx.quadraticCurveTo(10 + a - back, 0, 1 - back, limb);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240,240,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(1 - back, -limb); ctx.lineTo(-4 - back + st.recoil * 5, 0); ctx.lineTo(1 - back, limb); ctx.stroke();
    ctx.lineCap = 'butt';
    const rails = b >= 4 ? 5 : b >= 3 ? 3 : b >= 2 ? 2 : 1;
    ctx.fillStyle = '#8fa6ad';
    for (let i = 0; i < rails; i++) {
      const y = (i - (rails - 1) / 2) * 3.6;
      ctx.fillRect(-7 - back, y - 1.3, 21 + a * 1.5, 2.6);
    }
    if (b >= 1) { ctx.fillStyle = PATH_COLORS[1]; ctx.fillRect(-8 - back, -4, 3, 8); }
    if (a >= 2) {
      ctx.fillStyle = a >= 4 ? '#fff0c0' : '#e8eef0';
      const tip = 15 + a * 1.5 - back;
      ctx.beginPath(); ctx.moveTo(tip + 6, 0); ctx.lineTo(tip, -3 - a * 0.4); ctx.lineTo(tip, 3 + a * 0.4); ctx.closePath(); ctx.fill();
    }
    if (c >= 1) {
      ctx.fillStyle = PATH_COLORS[2];
      ctx.beginPath(); ctx.arc(-3 - back, 0, 2.5 + c * 0.5, 0, TAU); ctx.fill();
      if (c >= 3) {
        ctx.strokeStyle = PATH_COLORS[2]; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(-3 - back, 0, 6.5 + (c - 3) * 2, 0, TAU); ctx.stroke();
      }
    }
  },

  // Squat kiln with a recoiling barrel. A: fatter barrel. B: longer / twin barrels. C: glowing vents.
  mortar(ctx, [a, b, c], st) {
    base(ctx, 12, '#3a3230', [a, b, c]);
    ctx.fillStyle = '#6d5d55';
    for (let i = 0; i < 4; i++) {
      const an = i * (TAU / 4) + 0.78;
      ctx.beginPath(); ctx.arc(Math.cos(an) * 11, Math.sin(an) * 11, 1.8, 0, TAU); ctx.fill();
    }
    if (c >= 1) {
      ctx.fillStyle = c >= 4 ? '#ffd27a' : '#ff8a3c';
      ctx.globalAlpha = 0.6 + Math.sin(st.time * 6) * 0.2;
      for (let i = 0; i < Math.min(4, c + 1); i++) {
        const an = i * (TAU / 4);
        ctx.beginPath(); ctx.arc(Math.cos(an) * 10.5, Math.sin(an) * 10.5, 1.6 + c * 0.3, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.rotate(st.ang);
    const back = st.recoil * 4;
    const w = 6 + a * 1.1, len = 13 + (b >= 2 ? 4 : 0) + a * 0.5;
    const barrels = b >= 3 ? [-w * 0.62, w * 0.62] : [0];
    for (const y of barrels) {
      const bw = b >= 3 ? w * 0.72 : w;
      ctx.fillStyle = '#4d565c';
      ctx.fillRect(-5 - back, y - bw, len + 5, bw * 2);
      ctx.fillStyle = a >= 3 ? '#ffb347' : '#8c979e';
      ctx.fillRect(len - 4 - back, y - bw - 1, 4, bw * 2 + 2);
      ctx.fillStyle = c >= 1 ? '#ff7a2a' : '#12181b';
      ctx.beginPath(); ctx.ellipse(len - back, y, 2, bw * 0.7, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#2a3136';
    ctx.beginPath(); ctx.arc(-3 - back, 0, w * 0.9, 0, TAU); ctx.fill();
    if (b >= 1) { ctx.fillStyle = PATH_COLORS[1]; ctx.beginPath(); ctx.arc(-3 - back, 0, 2.2, 0, TAU); ctx.fill(); }
  },

  // Ice crystal that slowly turns and flares when it pulses.
  // A: bright frozen core. B: jagged shards. C: wider halo of drifting motes.
  rime(ctx, [a, b, c], st) {
    base(ctx, 8, '#1f3d52', [a, b, c], Math.PI / 8);
    const flare = st.pulse || 0;
    const rot = st.time * 0.6;
    if (c >= 1) {
      ctx.strokeStyle = `rgba(160,230,255,${0.35 + c * 0.1})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, 14 + c, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#dff8ff';
      for (let i = 0; i < 2 + c; i++) {
        const an = -rot * 1.7 + (i / (2 + c)) * TAU;
        ctx.fillRect(Math.cos(an) * (14 + c) - 1.2, Math.sin(an) * (14 + c) - 1.2, 2.4, 2.4);
      }
    }
    if (b >= 1) {
      star(ctx, 12 + b * 1.4 + flare * 2, 4, 4 + b, -rot);
      ctx.fillStyle = b >= 3 ? '#4fb6e8' : '#3b8fc0'; ctx.fill();
    }
    star(ctx, 11 + flare * 3, 4.2, 4, rot);
    ctx.fillStyle = '#8fdcff'; ctx.fill();
    ctx.strokeStyle = '#e9fbff'; ctx.lineWidth = 1; ctx.stroke();
    star(ctx, 6 + a * 0.9, 2.4 + a * 0.4, 4, rot + Math.PI / 4);
    ctx.fillStyle = a >= 3 ? '#ffffff' : '#c9f2ff'; ctx.fill();
    if (a >= 2) {
      ctx.fillStyle = `rgba(255,255,255,${0.25 + flare * 0.5})`;
      ctx.beginPath(); ctx.arc(0, 0, 3 + a, 0, TAU); ctx.fill();
    }
  },

  // Stacked coil with a crackling orb and aiming electrode(s).
  // A: bigger, hotter orb. B: more electrodes. C: orbiting sparks.
  coil(ctx, [a, b, c], st) {
    base(ctx, 10, '#2b2a4a', [a, b, c]);
    ctx.strokeStyle = '#c98a4a';
    ctx.lineWidth = 2;
    for (const r of [11.5, 8.5]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); }
    if (c >= 1) {
      ctx.fillStyle = '#e8d9ff';
      for (let i = 0; i < c + 1; i++) {
        const an = st.time * (3 + c) + (i / (c + 1)) * TAU;
        ctx.fillRect(Math.cos(an) * 12.5 - 1.3, Math.sin(an) * 12.5 - 1.3, 2.6, 2.6);
      }
    }
    ctx.save();
    ctx.rotate(st.ang);
    const prongs = b >= 4 ? 3 : b >= 3 ? 2 : 1;
    ctx.strokeStyle = b >= 1 ? PATH_COLORS[1] : '#9fb6c9';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < prongs; i++) {
      const an = (i - (prongs - 1) / 2) * 0.5;
      ctx.moveTo(Math.cos(an) * 5, Math.sin(an) * 5);
      ctx.lineTo(Math.cos(an) * (15 + b * 0.5), Math.sin(an) * (15 + b * 0.5));
    }
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.restore();
    const flick = 0.75 + Math.sin(st.time * 23) * 0.12 + st.recoil * 0.4;
    const r = 5 + a * 0.9;
    ctx.fillStyle = a >= 3 ? `rgba(255,224,140,${0.3 * flick})` : `rgba(140,200,255,${0.3 * flick})`;
    ctx.beginPath(); ctx.arc(0, 0, r + 4 + st.recoil * 3, 0, TAU); ctx.fill();
    ctx.fillStyle = a >= 3 ? '#ffe9a8' : '#bfe6ff';
    ctx.beginPath(); ctx.arc(0, 0, r * flick, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, TAU); ctx.fill();
  },
};

export function drawTower(ctx, type, tiers, st) {
  ctx.save();
  (ART[type] || ART.bolt)(ctx, tiers, st);
  ctx.restore();
}

// Static icon for shop buttons and the tower panel.
export function drawTowerIcon(canvas, type, tiers = [0, 0, 0]) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  const s = canvas.width / 48;
  ctx.scale(s, s);
  drawTower(ctx, type, tiers, { ang: -Math.PI / 4, recoil: 0, time: 0.4, pulse: 0 });
}
