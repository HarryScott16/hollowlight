// Enemy silhouettes, drawn from shapes. Each faces +x; the caller's transform handles heading.
// Saturated bodies with dark outlines so they read clearly against turf and sandstone.
import { ENEMIES } from '../data/enemies.js';

const TAU = Math.PI * 2;
const INK = '#1d1030';

// Layer colours run bright and warm on the outside to pale on the inside, so a wave visibly
// "cools" as it is peeled.
export const ENEMY_COLORS = {
  mote: '#d9ff3d', skitter: '#ff5a2e', shambler: '#a25cff', brood: '#22d36f',
  husk: '#7f93b8', dreadhulk: '#4a5578', colossus: '#6a3a8f', gravemaw: '#ff2d55',
};

function eye(ctx, x, y, r, color = '#fff36b') {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

function outline(ctx, w = 2) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w;
  ctx.stroke();
}

function legs(ctx, n, len, x0, x1, wob, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / Math.max(1, n - 1);
    const sw = Math.sin(wob * 3 + i * 2.1) * len * 0.35;
    ctx.moveTo(x, 0); ctx.lineTo(x + sw, -len);
    ctx.moveTo(x, 0); ctx.lineTo(x - sw, len);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
}

const ART = {
  shambler(ctx, e) {
    const sq = 1 + Math.sin(e.wob) * 0.08;
    const sw = Math.sin(e.wob) * 3;
    ctx.fillStyle = '#7a35d6';
    ctx.beginPath(); ctx.arc(2 + sw, -10, 4, 0, TAU); ctx.fill(); outline(ctx, 1.5);
    ctx.beginPath(); ctx.arc(2 - sw, 10, 4, 0, TAU); ctx.fill(); outline(ctx, 1.5);
    ctx.fillStyle = ENEMY_COLORS.shambler;
    ctx.beginPath(); ctx.ellipse(0, 0, 11 * sq, 9 / sq, 0, 0, TAU); ctx.fill(); outline(ctx);
    ctx.fillStyle = '#c99bff';
    ctx.beginPath(); ctx.ellipse(-2, -3, 5, 3, 0, 0, TAU); ctx.fill();
    eye(ctx, 6, -3.4, 2.2); eye(ctx, 6, 3.4, 2.2);
  },

  skitter(ctx, e) {
    legs(ctx, 3, 9, -4, 4, e.wob, INK);
    ctx.fillStyle = ENEMY_COLORS.skitter;
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.quadraticCurveTo(0, -8, -9, -2.5);
    ctx.lineTo(-13, 0); ctx.lineTo(-9, 2.5);
    ctx.quadraticCurveTo(0, 8, 11, 0);
    ctx.fill(); outline(ctx, 1.6);
    ctx.fillStyle = '#ffb36b';
    ctx.beginPath(); ctx.ellipse(-1, 0, 5, 2, 0, 0, TAU); ctx.fill();
    eye(ctx, 6, 0, 2, '#fff8c0');
  },

  husk(ctx, e) {
    const bob = Math.sin(e.wob) * 1;
    ctx.fillStyle = '#2c3550';
    ctx.beginPath(); ctx.arc(bob, 0, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = ENEMY_COLORS.husk;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      ctx.lineTo(Math.cos(a) * 14.5, Math.sin(a) * 13.5);
    }
    ctx.closePath(); ctx.fill(); outline(ctx, 2.2);
    ctx.fillStyle = '#c9d6ef';
    ctx.beginPath(); ctx.moveTo(-10, -9); ctx.lineTo(3, -9); ctx.lineTo(-1, -2); ctx.lineTo(-12, -2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3d4a68';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-14, 0); ctx.lineTo(2, 0);
    ctx.moveTo(2, 0); ctx.lineTo(7, -11);
    ctx.moveTo(2, 0); ctx.lineTo(7, 11);
    ctx.stroke();
    ctx.fillStyle = '#ffe14a';
    ctx.fillRect(8, -4, 3.5, 8);
  },

  brood(ctx, e) { sack(ctx, e, 14, ENEMY_COLORS.brood, '#b9ffd2', 4); },

  mote(ctx, e) {
    legs(ctx, 2, 6, -2, 2, e.wob, INK);
    ctx.fillStyle = ENEMY_COLORS.mote;
    ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 5.5, 0, 0, TAU); ctx.fill(); outline(ctx, 1.5);
    ctx.fillStyle = '#f6ffc0';
    ctx.beginPath(); ctx.ellipse(-1.5, -1.8, 2.6, 1.6, 0, 0, TAU); ctx.fill();
    eye(ctx, 3.4, 0, 1.5, INK);
  },

  dreadhulk(ctx, e) {
    const step = Math.sin(e.wob * 0.8);
    ctx.fillStyle = '#262c45';
    for (const [x, y] of [[-12, -19], [-12, 19], [9, -20], [9, 20]]) {
      const s = (x < 0 ? step : -step) * 3;
      ctx.beginPath(); ctx.ellipse(x + s, y, 7, 5, 0, 0, TAU); ctx.fill(); outline(ctx, 2);
    }
    ctx.fillStyle = ENEMY_COLORS.dreadhulk;
    ctx.beginPath();
    ctx.moveTo(24, 0); ctx.lineTo(14, -18); ctx.lineTo(-10, -21); ctx.lineTo(-24, -10);
    ctx.lineTo(-24, 10); ctx.lineTo(-10, 21); ctx.lineTo(14, 18); ctx.closePath();
    ctx.fill(); outline(ctx, 3);
    // armour plates
    ctx.fillStyle = '#8fa0c8';
    for (const y of [-11, 0, 11]) {
      ctx.beginPath(); ctx.moveTo(-18, y - 4); ctx.lineTo(4, y - 5); ctx.lineTo(8, y); ctx.lineTo(4, y + 5); ctx.lineTo(-18, y + 4); ctx.closePath(); ctx.fill(); outline(ctx, 1.6);
    }
    ctx.fillStyle = '#1d1030';
    ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(13, -8); ctx.lineTo(13, 8); ctx.closePath(); ctx.fill();
    eye(ctx, 15, -10, 3, '#ff4a3a'); eye(ctx, 15, 10, 3, '#ff4a3a');
  },

  colossus(ctx, e) {
    const step = Math.sin(e.wob * 0.7);
    ctx.fillStyle = '#3a1d52';
    for (const [x, y] of [[-15, -23], [-15, 23], [10, -24], [10, 24]]) {
      const s = (x < 0 ? step : -step) * 3;
      ctx.beginPath(); ctx.ellipse(x + s, y, 8.5, 6, 0, 0, TAU); ctx.fill(); outline(ctx, 2.2);
    }
    ctx.fillStyle = ENEMY_COLORS.colossus;
    ctx.beginPath(); ctx.ellipse(-2, 0, 28, 24, 0, 0, TAU); ctx.fill(); outline(ctx, 3.2);
    // spikes
    ctx.fillStyle = '#d6c2ff';
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * 0.55 + i * (Math.PI * 0.9 / 6);
      ctx.beginPath();
      ctx.moveTo(-2 + Math.cos(a - 0.17) * 26, Math.sin(a - 0.17) * 22);
      ctx.lineTo(-2 + Math.cos(a) * 37, Math.sin(a) * 32);
      ctx.lineTo(-2 + Math.cos(a + 0.17) * 26, Math.sin(a + 0.17) * 22);
      ctx.closePath(); ctx.fill(); outline(ctx, 1.4);
    }
    ctx.fillStyle = '#9a6ad0';
    ctx.beginPath(); ctx.ellipse(-8, -8, 13, 7, -0.3, 0, TAU); ctx.fill();
    eye(ctx, 16, -9, 3.4, '#ffe14a'); eye(ctx, 16, 9, 3.4, '#ffe14a');
    eye(ctx, 21, 0, 2.6, '#ffe14a');
  },

  gravemaw(ctx, e) {
    const breathe = 1 + Math.sin(e.wob * 0.6) * 0.03;
    const open = 0.5 + Math.sin(e.wob * 0.9) * 0.5;
    ctx.fillStyle = '#8a1030';
    for (const [x, y] of [[-14, -22], [-14, 22], [10, -23], [10, 23]]) {
      const s = Math.sin(e.wob + x) * 3;
      ctx.beginPath(); ctx.ellipse(x + s, y, 7.5, 5.5, 0, 0, TAU); ctx.fill(); outline(ctx, 2);
    }
    ctx.fillStyle = ENEMY_COLORS.gravemaw;
    ctx.beginPath(); ctx.ellipse(-2, 0, 30 * breathe, 23 / breathe, 0, 0, TAU); ctx.fill(); outline(ctx, 3);
    ctx.fillStyle = '#ff7a95';
    ctx.beginPath(); ctx.ellipse(-8, -9, 14, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a0820';
    for (let i = 0; i < 4; i++) {
      const x = -24 + i * 9;
      ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x + 7, 0); ctx.lineTo(x, 6); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#fff1d6';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(8, 17 * s); ctx.quadraticCurveTo(24, 30 * s, 34, 16 * s); ctx.quadraticCurveTo(22, 22 * s, 14, 12 * s); ctx.closePath(); ctx.fill(); outline(ctx, 1.8);
    }
    const gape = 5 + open * 8;
    ctx.fillStyle = '#2a0010';
    ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(12, -gape); ctx.lineTo(8, 0); ctx.lineTo(12, gape); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) {
      const x = 14 + i * 5, y = gape * (1 - i * 0.3);
      ctx.beginPath(); ctx.moveTo(x, -y); ctx.lineTo(x + 2, -y + 4); ctx.lineTo(x + 4, -y * 0.8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 4); ctx.lineTo(x + 4, y * 0.8); ctx.fill();
    }
    eye(ctx, 10, -14, 3.4); eye(ctx, 10, 14, 3.4);
    eye(ctx, 11, -14, 1.4, '#300'); eye(ctx, 11, 14, 1.4, '#300');
  },
};

function sack(ctx, e, r, fill, hi, spots) {
  const p = 1 + Math.sin(e.wob * 1.3) * 0.06;
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.arc(r * 0.75, 0, r * 0.42, 0, TAU); ctx.fill(); outline(ctx, 1.6);
  ctx.beginPath(); ctx.arc(-1, 0, r * p, 0, TAU); ctx.fill(); outline(ctx, 2);
  ctx.fillStyle = hi;
  ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.35, r * 0.2, -0.6, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(0,90,50,0.55)';
  for (let i = 0; i < spots; i++) {
    const a = i * 2.4 + 0.6, d = r * 0.5;
    ctx.beginPath(); ctx.arc(-1 + Math.cos(a) * d, Math.sin(a) * d, r * 0.18, 0, TAU); ctx.fill();
  }
  eye(ctx, r * 0.85, -r * 0.16, r * 0.1 + 0.8); eye(ctx, r * 0.85, r * 0.16, r * 0.1 + 0.8);
}

// ---- sprite cache ----------------------------------------------------------------------------
// Hundreds of enemies drawn as vector paths every frame is the main rendering cost, so each
// non-boss type is pre-rendered into FRAMES animation frames at the current canvas scale and
// blitted. Bosses (one at a time) stay fully procedural.
const FRAMES = 12;
const sprites = new Map();
let spriteScale = 0;
let makeCanvas = null;

export function initSprites(factory, scale) {
  makeCanvas = factory;
  if (Math.abs(scale - spriteScale) > 0.001) { spriteScale = scale; sprites.clear(); }
}

const spriteHalf = (r) => Math.ceil(r * 1.6 + 7);

function sprite(type, r, frame) {
  const key = type + frame;
  let c = sprites.get(key);
  if (c) return c;
  const half = spriteHalf(r);
  c = makeCanvas();
  c.width = c.height = Math.ceil(half * 2 * spriteScale);
  const g = c.getContext('2d');
  g.setTransform(spriteScale, 0, 0, spriteScale, half * spriteScale, half * spriteScale);
  ART[type](g, { wob: (frame / FRAMES) * TAU, r });
  sprites.set(key, c);
  return c;
}

// Draws an enemy at its world position, with status overlays and health bar.
// lite: skip the small status overlays (used when hundreds of enemies are on screen).
export function drawEnemy(ctx, e, lite) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.save();
  ctx.rotate(e.ang);
  // Squash-and-stretch pop when hit.
  if (e.hitT > 0) { const k = e.hitT * 2.2; ctx.scale(1 - k * 0.5, 1 + k); }
  // Veiled enemies are see-through until a ward reveals them.
  const veil = e.veiled && e.revealT <= 0;
  if (veil) ctx.globalAlpha = 0.38;
  if (makeCanvas && !e.def.boss && ART[e.type]) {
    const frame = Math.floor(((e.wob % TAU) / TAU) * FRAMES) % FRAMES;
    const half = spriteHalf(e.def.r);
    ctx.drawImage(sprite(e.type, e.def.r, frame), -half, -half, half * 2, half * 2);
  } else {
    (ART[e.type] || ART.shambler)(ctx, e);
  }
  if (veil) ctx.globalAlpha = 1;
  // Shells and hulks crack as they lose health.
  if (e.def.hp > 10 && e.hp < e.maxHp) drawCracks(ctx, e);
  ctx.restore();

  const r = e.r;
  if (e.veiled) {
    ctx.strokeStyle = e.revealT > 0 ? '#ff7ae0' : 'rgba(225,200,255,0.75)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 4]);
    ctx.lineDashOffset = e.wob * 4;
    ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }
  if (e.freezeT > 0) {
    ctx.fillStyle = 'rgba(190,245,255,0.5)';
    ctx.strokeStyle = '#2fb8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.4, rr = r + (i % 2 ? 6 : 2);
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (e.slowT > 0 && !lite) {
    ctx.strokeStyle = '#3fd0ff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r + 3, 0, TAU); ctx.stroke();
  }
  if (e.burnT > 0 && !lite) {
    ctx.fillStyle = 'rgba(255,120,30,0.85)';
    const f = e.wob * 4;
    for (let i = 0; i < 3; i++) {
      const a = f + i * 2.1, h = 4 + Math.sin(f * 1.7 + i) * 2;
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.5, -r * 0.4 + Math.sin(a) * r * 0.3, 2.2, h, 0, 0, TAU); ctx.fill();
    }
  }
  if (e.stunT > 0) {
    ctx.fillStyle = '#fff36b';
    for (let i = 0; i < 3; i++) {
      const a = e.wob * 2 + (i / 3) * TAU;
      ctx.fillRect(Math.cos(a) * (r + 3) - 2, Math.sin(a) * (r + 3) * 0.5 - r - 2, 4, 4);
    }
  }
  if (e.markT > 0 && !lite) {
    ctx.strokeStyle = '#d36bff';
    ctx.lineWidth = 2.2;
    const m = r + 6;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4 + e.wob * 0.3;
      ctx.moveTo(Math.cos(a) * m, Math.sin(a) * m);
      ctx.lineTo(Math.cos(a) * (m - 6), Math.sin(a) * (m - 6));
    }
    ctx.stroke();
  }
  if (e.chargedT > 0 && !lite) {
    ctx.strokeStyle = '#7fe8ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const a = e.wob * 5;
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a + 1) * (r + 5), Math.sin(a + 1) * (r + 5));
    ctx.lineTo(Math.cos(a + 2) * r, Math.sin(a + 2) * r);
    ctx.stroke();
  }
  if (e.flash > 0) {
    ctx.globalAlpha = Math.min(1, e.flash * 10);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, r * 1.05, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // health bar (bosses get a big bar at the top of the screen instead)
  if (!e.def.boss && e.def.hp > 10 && (e.hp < e.maxHp || e.shield > 0)) {
    const w = Math.max(18, r * 2.1), y = -r - 9;
    ctx.fillStyle = INK;
    ctx.fillRect(-w / 2 - 1.5, y - 1.5, w + 3, 6);
    const f = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = f > 0.5 ? '#5dff5a' : f > 0.25 ? '#ffd23a' : '#ff4a3a';
    ctx.fillRect(-w / 2, y, w * f, 3);
    if (e.shield > 0) {
      ctx.fillStyle = '#5fe0ff';
      ctx.fillRect(-w / 2, y - 3, w * (e.shield / e.maxShield), 2);
    }
  }
  ctx.restore();
}

const crackRand = (seed, i) => { const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453; return x - Math.floor(x); };
function drawCracks(ctx, e) {
  const n = Math.min(7, Math.ceil((1 - e.hp / e.maxHp) * 7));
  const r = e.r * 0.95;
  ctx.strokeStyle = 'rgba(20,10,35,0.85)';
  ctx.lineWidth = e.def.heavy ? 2.4 : 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = crackRand(e.root, i) * TAU;
    const len = r * (0.55 + crackRand(e.root, i + 9) * 0.45);
    const bend = (crackRand(e.root, i + 17) - 0.5) * 0.9;
    const x0 = Math.cos(a) * r * 0.15, y0 = Math.sin(a) * r * 0.15;
    const xm = Math.cos(a + bend) * len * 0.55, ym = Math.sin(a + bend) * len * 0.55;
    ctx.moveTo(x0, y0); ctx.lineTo(xm, ym); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
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
