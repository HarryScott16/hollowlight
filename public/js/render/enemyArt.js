// Enemy silhouettes, drawn from shapes. Each faces +x; the caller's transform handles heading.
import { ENEMIES } from '../data/enemies.js';

const TAU = Math.PI * 2;

export const ENEMY_COLORS = {
  shambler: '#8f6cc0', skitter: '#e8694c', husk: '#93a0b2', brood: '#43a871',
  broodling: '#5cc486', mite: '#a4f07c', gravemaw: '#8a2338',
};

function eye(ctx, x, y, r, color = '#ffe66b') {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

function legs(ctx, n, len, x0, x1, wob, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / Math.max(1, n - 1);
    const sw = Math.sin(wob * 3 + i * 2.1) * len * 0.35;
    ctx.moveTo(x, 0); ctx.lineTo(x + sw, -len);
    ctx.moveTo(x, 0); ctx.lineTo(x - sw, len);
  }
  ctx.stroke();
}

const ART = {
  shambler(ctx, e) {
    const sq = 1 + Math.sin(e.wob) * 0.08;
    // swinging arms
    ctx.fillStyle = '#6b4f96';
    const sw = Math.sin(e.wob) * 3;
    ctx.beginPath(); ctx.arc(2 + sw, -10, 3.6, 0, TAU); ctx.arc(2 - sw, 10, 3.6, 0, TAU); ctx.fill();
    ctx.fillStyle = ENEMY_COLORS.shambler;
    ctx.strokeStyle = '#d9c4ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 11 * sq, 9 / sq, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a4183';
    ctx.beginPath(); ctx.ellipse(-4, 0, 4, 5, 0, 0, TAU); ctx.fill();
    eye(ctx, 6, -3.4, 1.9); eye(ctx, 6, 3.4, 1.9);
  },

  skitter(ctx, e) {
    legs(ctx, 3, 9, -4, 4, e.wob, '#ffb39c');
    ctx.fillStyle = ENEMY_COLORS.skitter;
    ctx.strokeStyle = '#ffd0c0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(0, -8, -9, -2);
    ctx.lineTo(-12, 0); ctx.lineTo(-9, 2);
    ctx.quadraticCurveTo(0, 8, 10, 0);
    ctx.fill(); ctx.stroke();
    eye(ctx, 5, 0, 1.8, '#fff3d0');
  },

  husk(ctx, e) {
    const bob = Math.sin(e.wob) * 1;
    ctx.fillStyle = '#20252d';
    ctx.beginPath(); ctx.arc(bob, 0, 12, 0, TAU); ctx.fill();
    // plated shell
    ctx.fillStyle = ENEMY_COLORS.husk;
    ctx.strokeStyle = '#e6eef8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 13);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#5d6a7c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-14, 0); ctx.lineTo(2, 0);
    ctx.moveTo(2, 0); ctx.lineTo(7, -11);
    ctx.moveTo(2, 0); ctx.lineTo(7, 11);
    ctx.stroke();
    ctx.fillStyle = '#ff5a4a';
    ctx.fillRect(8, -4, 3, 8);
  },

  brood(ctx, e) { sack(ctx, e, 15, ENEMY_COLORS.brood, '#b5f5cd', 4); },
  broodling(ctx, e) { sack(ctx, e, 9, ENEMY_COLORS.broodling, '#c9f8da', 2); },

  mite(ctx, e) {
    legs(ctx, 2, 6, -2, 2, e.wob, '#d6ffc0');
    ctx.fillStyle = ENEMY_COLORS.mite;
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 4, 0, 0, TAU); ctx.fill();
    eye(ctx, 3, 0, 1.2, '#123');
  },

  gravemaw(ctx, e) {
    const breathe = 1 + Math.sin(e.wob * 0.6) * 0.03;
    const open = 0.5 + Math.sin(e.wob * 0.9) * 0.5;
    // stubby legs
    ctx.fillStyle = '#4a1220';
    for (const [x, y] of [[-14, -22], [-14, 22], [10, -23], [10, 23]]) {
      const s = Math.sin(e.wob + x) * 3;
      ctx.beginPath(); ctx.ellipse(x + s, y, 7, 5, 0, 0, TAU); ctx.fill();
    }
    // body
    ctx.fillStyle = ENEMY_COLORS.gravemaw;
    ctx.strokeStyle = '#ff9a8a';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(-2, 0, 30 * breathe, 23 / breathe, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // spine plates
    ctx.fillStyle = '#3b0d18';
    for (let i = 0; i < 4; i++) {
      const x = -24 + i * 9;
      ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x + 7, 0); ctx.lineTo(x, 6); ctx.closePath(); ctx.fill();
    }
    // horns
    ctx.fillStyle = '#f1e2c8';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(8, 17 * s); ctx.quadraticCurveTo(24, 30 * s, 34, 16 * s); ctx.quadraticCurveTo(22, 22 * s, 14, 12 * s); ctx.closePath(); ctx.fill();
    }
    // maw
    const gape = 5 + open * 8;
    ctx.fillStyle = '#16040a';
    ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(12, -gape); ctx.lineTo(8, 0); ctx.lineTo(12, gape); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) {
      const x = 14 + i * 5, y = gape * (1 - i * 0.3);
      ctx.beginPath(); ctx.moveTo(x, -y); ctx.lineTo(x + 2, -y + 4); ctx.lineTo(x + 4, -y * 0.8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 4); ctx.lineTo(x + 4, y * 0.8); ctx.fill();
    }
    eye(ctx, 10, -14, 3); eye(ctx, 10, 14, 3);
    eye(ctx, 11, -14, 1.2, '#300'); eye(ctx, 11, 14, 1.2, '#300');
  },
};

function sack(ctx, e, r, fill, rim, spots) {
  const p = 1 + Math.sin(e.wob * 1.3) * 0.06;
  ctx.fillStyle = fill;
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(r * 0.75, 0, r * 0.42, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-1, 0, r * p, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(10,50,30,0.55)';
  for (let i = 0; i < spots; i++) {
    const a = i * 2.4 + 0.6, d = r * 0.5;
    ctx.beginPath(); ctx.arc(-1 + Math.cos(a) * d, Math.sin(a) * d, r * 0.2, 0, TAU); ctx.fill();
  }
  eye(ctx, r * 0.85, -r * 0.16, r * 0.1 + 0.6); eye(ctx, r * 0.85, r * 0.16, r * 0.1 + 0.6);
}

// Draws an enemy at its world position, with status overlays and health bar.
export function drawEnemy(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.save();
  ctx.rotate(e.ang);
  (ART[e.type] || ART.shambler)(ctx, e);
  ctx.restore();

  const r = e.r;
  if (e.freezeT > 0) {
    ctx.fillStyle = 'rgba(170,235,255,0.55)';
    ctx.strokeStyle = '#e8fbff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.4, rr = r + (i % 2 ? 5 : 2);
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (e.slowT > 0) {
    ctx.strokeStyle = 'rgba(150,225,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r + 2.5, 0, TAU); ctx.stroke();
  }
  if (e.stunT > 0) {
    ctx.fillStyle = '#fff7a8';
    for (let i = 0; i < 3; i++) {
      const a = e.wob * 2 + (i / 3) * TAU;
      ctx.fillRect(Math.cos(a) * (r + 3) - 1.5, Math.sin(a) * (r + 3) * 0.5 - r - 1.5, 3, 3);
    }
  }
  if (e.markT > 0) {
    ctx.strokeStyle = '#d09bff';
    ctx.lineWidth = 1.5;
    const m = r + 5;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4;
      ctx.moveTo(Math.cos(a) * m, Math.sin(a) * m);
      ctx.lineTo(Math.cos(a) * (m - 5), Math.sin(a) * (m - 5));
    }
    ctx.stroke();
  }
  if (e.chargedT > 0) {
    ctx.strokeStyle = 'rgba(190,230,255,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const a = e.wob * 5;
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a + 1) * (r + 4), Math.sin(a + 1) * (r + 4));
    ctx.lineTo(Math.cos(a + 2) * r, Math.sin(a + 2) * r);
    ctx.stroke();
  }
  if (e.flash > 0) {
    ctx.globalAlpha = Math.min(1, e.flash * 9);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // health bar (bosses get a big bar at the top of the screen instead)
  if (!e.def.boss && (e.hp < e.maxHp || e.shield > 0)) {
    const w = Math.max(16, r * 2), y = -r - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(-w / 2 - 1, y - 1, w + 2, 5);
    const f = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = f > 0.5 ? '#7be06a' : f > 0.25 ? '#f0c04a' : '#f0604a';
    ctx.fillRect(-w / 2, y, w * f, 3);
    if (e.shield > 0) {
      ctx.fillStyle = '#7fd4ff';
      ctx.fillRect(-w / 2, y - 3, w * (e.shield / e.maxShield), 2);
    }
  }
  ctx.restore();
}

// Icon for the wave preview.
export function drawEnemyIcon(canvas, type) {
  const ctx = canvas.getContext('2d');
  const def = ENEMIES[type];
  const s = Math.min(1.5, (canvas.width * 0.42) / def.r);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(s, s);
  (ART[type] || ART.shambler)(ctx, { wob: 0.8, r: def.r });
}
