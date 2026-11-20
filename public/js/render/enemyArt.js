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
  herald: '#ffb020', gloomwing: '#ff4fd8', aegis: '#3aa0ff', nullback: '#3f8f86', wisp: '#c8f5ff',
  mender: '#e8fff0', veilmother: '#b9a6ff', bastion: '#9aa8c0', hollowking: '#3b2a6b',
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

Object.assign(ART, {
  herald(ctx, e) {
    const sw = Math.sin(e.wob) * 2;
    // banner pole and pennant behind
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-16, -15); ctx.stroke();
    ctx.fillStyle = '#ff5a2e';
    ctx.beginPath(); ctx.moveTo(-16, -15); ctx.lineTo(-24 + sw, -13); ctx.lineTo(-17, -9); ctx.closePath(); ctx.fill(); outline(ctx, 1.2);
    ctx.fillStyle = ENEMY_COLORS.herald;
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-2, -12); ctx.lineTo(-11, -7); ctx.lineTo(-11, 7); ctx.lineTo(-2, 12); ctx.closePath();
    ctx.fill(); outline(ctx, 2);
    // horn
    ctx.fillStyle = '#fff1b0';
    ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(17, -6); ctx.lineTo(17, 6); ctx.lineTo(6, 2); ctx.closePath(); ctx.fill(); outline(ctx, 1.4);
    ctx.fillStyle = '#ffe28a';
    ctx.beginPath(); ctx.ellipse(-3, -4, 5, 2.5, 0, 0, TAU); ctx.fill();
    eye(ctx, 3, -5, 1.8, INK); eye(ctx, 3, 5, 1.8, INK);
  },

  gloomwing(ctx, e) {
    const flap = Math.sin(e.wob * 2.2);
    ctx.fillStyle = '#b02fa0';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(2, 2 * s);
      ctx.quadraticCurveTo(-2, (14 + flap * 6) * s, -12, (16 + flap * 8) * s);
      ctx.quadraticCurveTo(-8, 7 * s, -6, 2 * s);
      ctx.closePath(); ctx.fill(); outline(ctx, 1.5);
    }
    ctx.fillStyle = ENEMY_COLORS.gloomwing;
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 4.5, 0, 0, TAU); ctx.fill(); outline(ctx, 1.6);
    ctx.fillStyle = '#ffc2f2';
    ctx.beginPath(); ctx.ellipse(-2, -1.4, 4, 1.4, 0, 0, TAU); ctx.fill();
    eye(ctx, 6, -2, 1.5, '#fff36b'); eye(ctx, 6, 2, 1.5, '#fff36b');
  },

  aegis(ctx, e) {
    legs(ctx, 2, 8, -3, 3, e.wob, INK);
    ctx.fillStyle = '#1f5fb0';
    ctx.beginPath(); ctx.arc(-1, 0, 11, 0, TAU); ctx.fill(); outline(ctx, 2);
    // the shield emitter: a hexagonal plate on its back
    ctx.fillStyle = ENEMY_COLORS.aegis;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + Math.PI / 6; ctx.lineTo(-2 + Math.cos(a) * 7.5, Math.sin(a) * 7.5); }
    ctx.closePath(); ctx.fill(); outline(ctx, 1.4);
    ctx.fillStyle = '#c8ecff';
    ctx.beginPath(); ctx.arc(-2, 0, 3, 0, TAU); ctx.fill();
    eye(ctx, 8, -3.5, 1.8); eye(ctx, 8, 3.5, 1.8);
  },

  nullback(ctx, e) {
    const step = Math.sin(e.wob);
    ctx.fillStyle = '#1e3f3b';
    for (const [x, y] of [[-8, -13], [-8, 13], [6, -13], [6, 13]]) {
      ctx.beginPath(); ctx.ellipse(x + (x < 0 ? step : -step) * 2, y, 4.5, 3.2, 0, 0, TAU); ctx.fill(); outline(ctx, 1.4);
    }
    ctx.fillStyle = ENEMY_COLORS.nullback;
    ctx.beginPath(); ctx.ellipse(-1, 0, 16, 13, 0, 0, TAU); ctx.fill(); outline(ctx, 2.2);
    // matte bands
    ctx.strokeStyle = '#1e3f3b'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (const x of [-9, -3, 3]) { ctx.moveTo(x, -12); ctx.quadraticCurveTo(x + 3, 0, x, 12); }
    ctx.stroke();
    // null sigil
    ctx.strokeStyle = '#d8fff6'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(-3, 0, 4.5, 0, TAU); ctx.moveTo(-6.5, 3.5); ctx.lineTo(0.5, -3.5); ctx.stroke();
    ctx.fillStyle = '#1e3f3b';
    ctx.beginPath(); ctx.ellipse(14, 0, 4, 5, 0, 0, TAU); ctx.fill(); outline(ctx, 1.4);
    eye(ctx, 15, -2, 1.3, '#ff9a4a'); eye(ctx, 15, 2, 1.3, '#ff9a4a');
  },

  wisp(ctx, e) {
    const f = Math.sin(e.wob * 2) * 2;
    ctx.fillStyle = 'rgba(160,230,255,0.45)';
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.quadraticCurveTo(0, -9, -14 + f, -3); ctx.quadraticCurveTo(-8, 0, -14 - f, 3); ctx.quadraticCurveTo(0, 9, 8, 0); ctx.fill();
    ctx.fillStyle = ENEMY_COLORS.wisp;
    ctx.beginPath(); ctx.arc(2, 0, 6.5, 0, TAU); ctx.fill(); outline(ctx, 1.4);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(3, -1, 2.8, 0, TAU); ctx.fill();
    eye(ctx, 5, -2, 1.2, '#2a6cff'); eye(ctx, 5, 2, 1.2, '#2a6cff');
  },

  mender(ctx, e) {
    const p = 1 + Math.sin(e.wob * 1.5) * 0.05;
    ctx.strokeStyle = '#2fbf5f'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * 0.65 + i * 0.35, w = Math.sin(e.wob * 2 + i) * 0.15;
      ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
      ctx.quadraticCurveTo(Math.cos(a + w) * 16, Math.sin(a + w) * 16, Math.cos(a - w) * 20, Math.sin(a - w) * 20);
    }
    ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = ENEMY_COLORS.mender;
    ctx.beginPath(); ctx.arc(0, 0, 12 * p, 0, TAU); ctx.fill(); outline(ctx, 2);
    ctx.fillStyle = '#28d860';
    ctx.fillRect(-6, -2.2, 12, 4.4); ctx.fillRect(-2.2, -6, 4.4, 12);
    eye(ctx, 8, -4, 1.6, INK); eye(ctx, 8, 4, 1.6, INK);
  },

  veilmother(ctx, e) {
    const b = Math.sin(e.wob * 0.8);
    ctx.fillStyle = 'rgba(185,166,255,0.35)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(8, 10 * s);
      ctx.quadraticCurveTo(-6, (44 + b * 6) * s, -40, (34 + b * 8) * s);
      ctx.quadraticCurveTo(-26, 16 * s, -20, 6 * s);
      ctx.closePath(); ctx.fill(); outline(ctx, 2);
    }
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = 'rgba(200,190,255,0.6)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-20, (i - 1.5) * 8);
      ctx.quadraticCurveTo(-38, (i - 1.5) * 10 + Math.sin(e.wob * 2 + i) * 6, -54, (i - 1.5) * 12);
      ctx.stroke();
    }
    ctx.fillStyle = ENEMY_COLORS.veilmother;
    ctx.beginPath(); ctx.ellipse(0, 0, 28, 18, 0, 0, TAU); ctx.fill(); outline(ctx, 3);
    ctx.fillStyle = '#e8e0ff';
    ctx.beginPath(); ctx.ellipse(-6, -6, 13, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5b3fbf';
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-14 + i * 9, 6, 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e8e0ff';
    ctx.beginPath(); ctx.ellipse(22, 0, 9, 11, 0, 0, TAU); ctx.fill(); outline(ctx, 2);
    eye(ctx, 26, -4, 2.6, '#7a3bff'); eye(ctx, 26, 4, 2.6, '#7a3bff'); eye(ctx, 29, 0, 1.8, '#7a3bff');
  },

  bastion(ctx, e) {
    const step = Math.sin(e.wob * 0.6);
    ctx.fillStyle = '#3d4a68';
    for (const [x, y] of [[-18, -27], [-18, 27], [12, -28], [12, 28]]) {
      ctx.beginPath(); ctx.ellipse(x + (x < 0 ? step : -step) * 3, y, 9, 6.5, 0, 0, TAU); ctx.fill(); outline(ctx, 2.2);
    }
    ctx.fillStyle = ENEMY_COLORS.bastion;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + Math.PI / 8; ctx.lineTo(Math.cos(a) * 33, Math.sin(a) * 28); }
    ctx.closePath(); ctx.fill(); outline(ctx, 3.4);
    // crenellated keep on its back
    ctx.fillStyle = '#d6dff0';
    ctx.beginPath(); ctx.rect(-16, -14, 26, 28); ctx.fill(); outline(ctx, 2);
    ctx.fillStyle = '#9aa8c0';
    for (let i = 0; i < 3; i++) { ctx.fillRect(-16 + i * 10, -18, 6, 5); ctx.fillRect(-16 + i * 10, 13, 6, 5); }
    ctx.fillStyle = '#ffd23a';
    ctx.beginPath(); ctx.arc(-3, 0, 5, 0, TAU); ctx.fill(); outline(ctx, 1.5);
    ctx.fillStyle = '#3d4a68';
    ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(22, -10); ctx.lineTo(22, 10); ctx.closePath(); ctx.fill();
    eye(ctx, 24, -6, 2.4, '#ff4a3a'); eye(ctx, 24, 6, 2.4, '#ff4a3a');
  },

  hollowking(ctx, e) {
    const b = Math.sin(e.wob * 0.7);
    // cloak
    ctx.fillStyle = '#1d1030';
    ctx.beginPath();
    ctx.moveTo(14, -18); ctx.quadraticCurveTo(-20, -40 - b * 4, -44, -24); ctx.lineTo(-36, -8); ctx.lineTo(-48, 0); ctx.lineTo(-36, 8); ctx.lineTo(-44, 24);
    ctx.quadraticCurveTo(-20, 40 + b * 4, 14, 18); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7fe8ff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = ENEMY_COLORS.hollowking;
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 22, 0, 0, TAU); ctx.fill(); outline(ctx, 3);
    // hollow chest
    ctx.fillStyle = '#05010d';
    ctx.beginPath(); ctx.ellipse(-6, 0, 10, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(127,232,255,0.6)';
    ctx.beginPath(); ctx.arc(-6, 0, 3 + b, 0, TAU); ctx.fill();
    // ice crown
    ctx.fillStyle = '#e9f6ff';
    ctx.beginPath(); ctx.moveTo(8, -14);
    for (let i = 0; i <= 6; i++) { const y = -14 + i * (28 / 6); ctx.lineTo(i % 2 ? 26 : 16, y); }
    ctx.lineTo(8, 14); ctx.closePath(); ctx.fill(); outline(ctx, 2);
    eye(ctx, 18, -5, 2.6, '#7fe8ff'); eye(ctx, 18, 5, 2.6, '#7fe8ff');
  },
});

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
let sprites = Object.create(null);   // type -> [frame canvases]
let overlays = new Map();            // cached overlays: shield bubbles, freeze crystals, crack sets, shadows
let combos = new Map();              // crowd sprites: body + cracks + veil baked into one image
let spriteScale = 0;
let makeCanvas = null;

export function initSprites(factory, scale) {
  makeCanvas = factory;
  if (Math.abs(scale - spriteScale) > 0.001) { spriteScale = scale; sprites = Object.create(null); overlays = new Map(); combos = new Map(); }
}

// A sprite's half-size: measured once per type from what its art actually draws (over every wobble
// frame), so the GPU doesn't fill hundreds of mostly empty squares in a big wave. Falls back to a
// generous box where the canvas can't be read back.
const halves = Object.create(null);
function spriteHalf(type, r) {
  let h = halves[type];
  if (h) return h;
  h = Math.ceil(r * 1.6 + 7);
  try {
    const N = Math.ceil(r * 2.4 + 24), c = makeCanvas(), g = c.getContext('2d');
    c.width = c.height = N * 2;
    let ext = 0;
    for (let f = 0; f < FRAMES; f++) {
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, N * 2, N * 2); g.translate(N, N);
      ART[type](g, { wob: (f / FRAMES) * TAU, r });
      const px = g.getImageData(0, 0, N * 2, N * 2).data;
      for (let y = 0; y < N * 2; y++) for (let x = 0; x < N * 2; x++) if (px[(y * N * 2 + x) * 4 + 3] > 8) { const d = Math.max(Math.abs(x - N), Math.abs(y - N)); if (d > ext) ext = d; }
    }
    if (ext > 0) h = Math.min(N, ext + 2);
  } catch { /* no read-back (stub canvas): keep the generous box */ }
  if (!(h > 0)) h = Math.ceil(r * 1.6 + 7);
  halves[type] = h;
  return h;
}

function sprite(type, r, frame) {
  const list = sprites[type] || (sprites[type] = []);
  let c = list[frame];
  if (c) return c;
  const half = spriteHalf(type, r);
  c = makeCanvas();
  c.width = c.height = Math.ceil(half * 2 * spriteScale);
  const g = c.getContext('2d');
  g.setTransform(spriteScale, 0, 0, spriteScale, half * spriteScale, half * spriteScale);
  ART[type](g, { wob: (frame / FRAMES) * TAU, r });
  list[frame] = c;
  return c;
}
// A cached overlay drawn once into a canvas of `half` (map units) around the origin.
// Which of n frames an angle-like value (radians, any size) falls in.
function frameOf(v, n) { return Math.floor((((v % TAU) + TAU) % TAU) / TAU * n) % n; }
// Stun stars circling over the head: one of six cached frames.
function stunOverlay(r, wob) {
  const k = frameOf(wob * 2, 6), R = r * 1.6 + 8;
  return overlay(`sn${Math.round(r)}|${k}`, R, (g) => {
    g.fillStyle = '#fff36b';
    for (let i = 0; i < 3; i++) { const a = (k / 6) * TAU + (i / 3) * TAU; g.fillRect(Math.cos(a) * (r + 3) - 2, Math.sin(a) * (r + 3) * 0.5 - r - 2, 4, 4); }
  });
}
function overlay(key, half, draw) {
  let c = overlays.get(key);
  if (c) return c;
  c = makeCanvas();
  c.width = c.height = Math.ceil(half * 2 * spriteScale);
  const g = c.getContext('2d');
  g.setTransform(spriteScale, 0, 0, spriteScale, half * spriteScale, half * spriteScale);
  draw(g);
  overlays.set(key, c);
  return c;
}

// In crowds (quality < 2) an enemy's body, its cracks and its veil are baked into one image, so a
// cracked, veiled Colossus costs one transform and one draw instead of eight or nine calls.
// Cracks come in four stages there, and the veil's dashed ring holds still.
const CRACK_STAGE = [0, 3, 3, 3, 5, 5, 7, 7];
function combo(e, frame, n, vs) {
  const key = `${e.type}|${frame}|${n}|${vs}`;
  let c = combos.get(key);
  if (c) return c;
  const r = e.def.r, half = Math.max(spriteHalf(e.type, r), vs ? Math.ceil(r + 7) : 0);
  c = makeCanvas();
  c.width = c.height = Math.ceil(half * 2 * spriteScale);
  const g = c.getContext('2d');
  g.setTransform(spriteScale, 0, 0, spriteScale, half * spriteScale, half * spriteScale);
  if (vs === 1) g.globalAlpha = 0.38;
  const sh = spriteHalf(e.type, r);
  g.drawImage(sprite(e.type, r, frame), -sh, -sh, sh * 2, sh * 2);
  if (n > 0) drawCracks(g, { r, def: e.def, root: 1, hp: 7 - n, maxHp: 7 });
  g.globalAlpha = 1;
  if (vs) {
    g.strokeStyle = vs === 2 ? '#ff7ae0' : 'rgba(225,200,255,0.75)'; g.lineWidth = 1.6; g.setLineDash([3, 4]);
    g.beginPath(); g.arc(0, 0, r + 4, 0, TAU); g.stroke();
  }
  c.half = half;
  combos.set(key, c);
  return c;
}
const FLASH_LV = 4;
// Held by a Snare's Binding Light: a ring of light with four chain links (cached).
function heldOverlay(r) {
  const R = r + 7;
  return overlay(`ht${Math.round(r)}`, R, (g) => {
    g.strokeStyle = 'rgba(255,246,208,0.95)'; g.lineWidth = 2; g.setLineDash([5, 3]);
    g.beginPath(); g.arc(0, 0, r + 4, 0, TAU); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#fff6d0'; g.strokeStyle = '#1a1428'; g.lineWidth = 1;
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; g.beginPath(); g.ellipse(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4), 2.6, 1.6, a, 0, TAU); g.fill(); g.stroke(); }
  });
}
// A flyer brought low by a Moth Lantern's Flypaper: a gold ring on its shadow (every ward can hit it).
function lowOverlay(r) {
  const R = r + 4;
  return overlay(`lw${Math.round(r)}`, R, (g) => { g.scale(1, 0.5); g.strokeStyle = 'rgba(255,224,58,0.9)'; g.lineWidth = 2.4; g.setLineDash([4, 3]); g.beginPath(); g.arc(0, 0, r + 1, 0, TAU); g.stroke(); });
}

// The renderer's base transform (its scale and screen-shake offset). drawEnemy sets the whole
// transform for each enemy in one call rather than save/translate/rotate/restore, and does NOT
// put the base transform back: whoever draws next sets its own (the renderer resets it before a
// ward, and flushEnemyBars sets it). Tools drawing on a plain canvas can leave the default.
let BS = 1, BX = 0, BY = 0;
export function setEnemyBase(s, ox, oy) { BS = s; BX = ox; BY = oy; }

// Health bars are queued and drawn together after all the enemies (a few calls for hundreds of bars).
const bars = [];
let nBars = 0;

// Draws an enemy at its world position, with status overlays and a queued health bar.
// quality: 2 full, 1 crowd, 0 huge crowd. lite (old flag) means quality 1.
export function drawEnemy(ctx, e, lite, quality = lite ? 1 : 2) {
  const x = e.x, y = e.y, r = e.r, ox = BX + x * BS, oy = BY + y * BS;
  if (e.def.flying && quality > 0) {   // (a huge crowd skips the flyers' ground shadows)
    const sh = overlay(`sh${Math.round(r)}`, r + 2, (g) => { g.fillStyle = 'rgba(10,0,20,0.28)'; g.beginPath(); g.ellipse(0, 0, r * 0.9, r * 0.4, 0, 0, TAU); g.fill(); });
    ctx.setTransform(BS, 0, 0, BS, ox, oy);
    ctx.drawImage(sh, -4 - (r + 2), 16 - (r + 2), (r + 2) * 2, (r + 2) * 2);
  }
  if (e.def.haste && quality === 2) {
    ctx.setTransform(BS, 0, 0, BS, ox, oy);
    ctx.strokeStyle = 'rgba(255,176,32,0.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = -e.wob * 6;
    ctx.beginPath(); ctx.arc(0, 0, e.def.haste.radius, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }
  // the body: one transform (position, facing and the squash-and-stretch hit pop), one image
  const c = Math.cos(e.ang), sn = Math.sin(e.ang);
  let kx = BS, ky = BS;
  if (e.hitT > 0) { const k = e.hitT * 2.2; kx *= 1 - k * 0.5; ky *= 1 + k; }
  ctx.setTransform(c * kx, sn * kx, -sn * ky, c * ky, ox, oy);
  if (quality < 2 && makeCanvas && !e.def.boss && ART[e.type]) { drawCrowdEnemy(ctx, e, x, y, r, quality); return; }
  const veil = e.veiled && e.revealT <= 0;
  if (veil) ctx.globalAlpha = 0.38;
  if (makeCanvas && !e.def.boss && ART[e.type]) {
    const frame = Math.floor(((e.wob % TAU) / TAU) * FRAMES) % FRAMES, half = spriteHalf(e.type, e.def.r);
    ctx.drawImage(sprite(e.type, e.def.r, frame), -half, -half, half * 2, half * 2);
  } else {
    (ART[e.type] || ART.shambler)(ctx, e);
  }
  // Shells and hulks crack as they lose health (cached crack sets, three variations).
  if (e.def.hp > 10 && e.hp < e.maxHp && makeCanvas) {
    const n = Math.min(7, Math.ceil((1 - e.hp / e.maxHp) * 7)), v = e.root % 3, h = r + 2;
    ctx.drawImage(overlay(`ck${e.type}|${n}|${v}`, h, (g) => drawCracks(g, { r, def: e.def, root: v + 1, hp: 7 - n, maxHp: 7 })), -h, -h, h * 2, h * 2);
  } else if (e.def.hp > 10 && e.hp < e.maxHp) drawCracks(ctx, e);
  if (veil) ctx.globalAlpha = 1;

  // status overlays, upright (cached where they're common); skipped entirely when there are none
  const q2 = quality === 2;
  if (!(e.shield > 0 || e.veiled || e.freezeT > 0 || (e.slowT > 0 && q2) || e.stunT > 0 || e.flash > 0 || e.groundT > 0 || (q2 && (e.burnT > 0 || e.searT > 0 || e.markT > 0 || e.chargedT > 0 || e.hasteT > 0)))) {
    queueBar(e, x, y, r);
    return;
  }
  ctx.setTransform(BS, 0, 0, BS, ox, oy);
  if (e.shield > 0 && makeCanvas) {
    const lvl = Math.min(3, Math.floor((e.shield / e.maxShield) * 4)), R = r + 7;
    ctx.drawImage(overlay(`sd${Math.round(r)}|${lvl}`, R, (g) => {
      const f = (lvl + 0.5) / 4;
      g.fillStyle = `rgba(95,224,255,${0.1 + f * 0.18})`; g.strokeStyle = `rgba(160,240,255,${0.35 + f * 0.5})`; g.lineWidth = 1.5 + f * 1.5;
      g.beginPath(); g.arc(0, 0, r + 5, 0, TAU); g.fill(); g.stroke();
    }), -R, -R, R * 2, R * 2);
  }
  if (e.hasteT > 0 && quality === 2 && !e.def.haste) {
    ctx.strokeStyle = 'rgba(255,190,60,0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-r - 3, -3); ctx.lineTo(-r - 9, -3); ctx.moveTo(-r - 3, 3); ctx.lineTo(-r - 9, 3);
    ctx.stroke();
  }
  if (e.veiled) {
    if (quality === 2) {   // the dashes creep round: one of four cached frames
      const rv = e.revealT > 0, R = r + 6, k = Math.floor((((e.wob * 4) % 7 + 7) % 7) / 7 * 4) % 4;
      ctx.drawImage(overlay(`vq${Math.round(r)}|${rv}|${k}`, R, (g) => { g.strokeStyle = rv ? '#ff7ae0' : 'rgba(225,200,255,0.75)'; g.lineWidth = 1.6; g.setLineDash([3, 4]); g.lineDashOffset = k * 7 / 4; g.beginPath(); g.arc(0, 0, r + 4, 0, TAU); g.stroke(); }), -R, -R, R * 2, R * 2);
    } else {
      const rv = e.revealT > 0, R = r + 6;
      ctx.drawImage(overlay(`vl${Math.round(r)}|${rv}`, R, (g) => { g.strokeStyle = rv ? '#ff7ae0' : 'rgba(225,200,255,0.75)'; g.lineWidth = 1.6; g.setLineDash([3, 4]); g.beginPath(); g.arc(0, 0, r + 4, 0, TAU); g.stroke(); }), -R, -R, R * 2, R * 2);
    }
  }
  if (e.freezeT > 0) {
    const R = r + 8;
    ctx.drawImage(overlay(`fz${Math.round(r)}`, R, (g) => {
      g.fillStyle = 'rgba(190,245,255,0.5)'; g.strokeStyle = '#2fb8ff'; g.lineWidth = 2;
      g.beginPath();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.4, rr = r + (i % 2 ? 6 : 2); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath(); g.fill(); g.stroke();
    }), -R, -R, R * 2, R * 2);
  } else if (e.slowT > 0 && q2) {
    const R = r + 5;
    ctx.drawImage(overlay(`sl${Math.round(r)}`, R, (g) => { g.strokeStyle = '#52e6ff'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r + 3, 0, TAU); g.stroke(); }), -R, -R, R * 2, R * 2);
  }
  // Status marks, each one of a few cached frames (one drawImage each: a tier 5 defence leaves
  // almost every enemy burning, Scorched, marked and Charged at once).
  if (quality === 2) {
    const ri = Math.round(r);
    if (e.burnT > 0) {
      const k = frameOf(e.wob * 4, 8), R = r + 6;
      ctx.drawImage(overlay(`bn${ri}|${k}`, R, (g) => {
        g.fillStyle = 'rgba(255,120,30,0.85)';
        const f = (k / 8) * TAU;
        for (let i = 0; i < 3; i++) { const a = f + i * 2.1, h = 4 + Math.sin(f * 1.7 + i) * 2; g.beginPath(); g.ellipse(Math.cos(a) * r * 0.5, -r * 0.4 + Math.sin(a) * r * 0.3, 2.2, h, 0, 0, TAU); g.fill(); }
      }), -R, -R, R * 2, R * 2);
    }
    if (e.searT > 0) {
      // Scorched: a ring of ash (a branded one glows), so a player can see healing is shut off
      const R = r + 7, br = !!e.brand;
      ctx.drawImage(overlay(`sr${ri}|${br}`, R, (g) => { g.strokeStyle = br ? 'rgba(220,30,40,0.85)' : 'rgba(60,45,50,0.8)'; g.lineWidth = 2.5; g.setLineDash([3, 3]); g.beginPath(); g.arc(0, 0, r + 4, 0, TAU); g.stroke(); }), -R, -R, R * 2, R * 2);
    }
    if (e.markT > 0) {
      const k = frameOf(e.wob * 0.3 * 4, 6), R = r + 8;   // four-fold: a quarter turn repeats
      ctx.drawImage(overlay(`mk${ri}|${k}`, R, (g) => {
        g.strokeStyle = '#e9eef6'; g.lineWidth = 2.2; g.beginPath();
        const m = r + 6;
        for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4 + (k / 6) * (TAU / 4); g.moveTo(Math.cos(a) * m, Math.sin(a) * m); g.lineTo(Math.cos(a) * (m - 6), Math.sin(a) * (m - 6)); }
        g.stroke();
      }), -R, -R, R * 2, R * 2);
    }
    if (e.chargedT > 0) {
      const k = frameOf(e.wob * 5, 12), R = r + 7;
      ctx.drawImage(overlay(`cg${ri}|${k}`, R, (g) => {
        g.strokeStyle = '#c8a0ff'; g.lineWidth = 1.5; g.beginPath();
        const a = (k / 12) * TAU;
        g.moveTo(Math.cos(a) * r, Math.sin(a) * r); g.lineTo(Math.cos(a + 1) * (r + 5), Math.sin(a + 1) * (r + 5)); g.lineTo(Math.cos(a + 2) * r, Math.sin(a + 2) * r);
        g.stroke();
      }), -R, -R, R * 2, R * 2);
    }
  }
  if (e.rootT > 0) { const R = r + 7; ctx.drawImage(heldOverlay(r), -R, -R, R * 2, R * 2); }
  else if (e.stunT > 0) ctx.drawImage(stunOverlay(r, e.wob), -(r * 1.6 + 8), -(r * 1.6 + 8), (r * 1.6 + 8) * 2, (r * 1.6 + 8) * 2);
  if (e.groundT > 0 && !(e.lureT > 0)) { const R = r + 4; ctx.drawImage(lowOverlay(r), -R, 16 - R * 0.5, R * 2, R); }
  if (e.flash > 0) {
    const R = r * 1.05 + 1;
    ctx.globalAlpha = Math.min(1, e.flash * 10);
    ctx.drawImage(overlay(`fl${Math.round(r)}`, R, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, r * 1.05, 0, TAU); g.fill(); }), -R, -R, R * 2, R * 2);
    ctx.globalAlpha = 1;
  }
  queueBar(e, x, y, r);
}

// The crowd version (quality < 2), already in the enemy's own transform: one baked image, a flash at
// a baked alpha level, and only the overlays that matter in a crowd (shield, freeze, stun).
function drawCrowdEnemy(ctx, e, x, y, r, quality) {
  const frame = Math.floor(((e.wob % TAU) / TAU) * FRAMES) % FRAMES;
  const n = e.def.hp > 10 && e.hp < e.maxHp && quality > 0 ? CRACK_STAGE[Math.min(7, Math.ceil((1 - e.hp / e.maxHp) * 7))] : 0;
  const vs = e.veiled ? (e.revealT > 0 ? 2 : 1) : 0;
  let img, h;
  if (n || vs) { img = combo(e, frame, n, vs); h = img.half; } else { h = spriteHalf(e.type, e.def.r); img = sprite(e.type, e.def.r, frame); }
  ctx.drawImage(img, -h, -h, h * 2, h * 2);
  if (e.flash > 0 && (quality > 0 || e.def.heavy)) {   // a huge crowd flashes only the hulks
    const lv = Math.min(FLASH_LV, Math.ceil(e.flash * 10 * FLASH_LV)), R = r * 1.05 + 1;
    ctx.drawImage(overlay(`fq${Math.round(r)}|${lv}`, R, (g) => { g.fillStyle = '#fff'; g.globalAlpha = lv / FLASH_LV; g.beginPath(); g.arc(0, 0, r * 1.05, 0, TAU); g.fill(); }), -R, -R, R * 2, R * 2);
  }
  if (e.shield > 0 || e.freezeT > 0 || e.stunT > 0 || e.groundT > 0) {
    ctx.setTransform(BS, 0, 0, BS, BX + x * BS, BY + y * BS);
    if (e.rootT > 0) { const R = r + 7; ctx.drawImage(heldOverlay(r), -R, -R, R * 2, R * 2); }
    if (e.groundT > 0 && !(e.lureT > 0)) { const R = r + 4; ctx.drawImage(lowOverlay(r), -R, 16 - R * 0.5, R * 2, R); }
    if (e.shield > 0) {
      const lvl = Math.min(3, Math.floor((e.shield / e.maxShield) * 4)), R = r + 7;
      ctx.drawImage(overlay(`sd${Math.round(r)}|${lvl}`, R, (g) => {
        const f = (lvl + 0.5) / 4;
        g.fillStyle = `rgba(95,224,255,${0.1 + f * 0.18})`; g.strokeStyle = `rgba(160,240,255,${0.35 + f * 0.5})`; g.lineWidth = 1.5 + f * 1.5;
        g.beginPath(); g.arc(0, 0, r + 5, 0, TAU); g.fill(); g.stroke();
      }), -R, -R, R * 2, R * 2);
    }
    if (e.freezeT > 0) {
      const R = r + 8;
      ctx.drawImage(overlay(`fz${Math.round(r)}`, R, (g) => {
        g.fillStyle = 'rgba(190,245,255,0.5)'; g.strokeStyle = '#2fb8ff'; g.lineWidth = 2;
        g.beginPath();
        for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.4, rr = r + (i % 2 ? 6 : 2); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        g.closePath(); g.fill(); g.stroke();
      }), -R, -R, R * 2, R * 2);
    }
    if (e.stunT > 0 && !(e.rootT > 0)) { const R = r * 1.6 + 8; ctx.drawImage(stunOverlay(r, e.wob), -R, -R, R * 2, R * 2); }   // (crowds are often stunned en masse)
  }
  // A huge crowd shows health bars only on hulks and shields (hundreds of small bars are noise).
  if (quality > 0 || e.def.heavy || e.shield > 0) queueBar(e, x, y, r);
}
// Health bars are queued (bosses get a big bar at the top of the screen instead).
function queueBar(e, x, y, r) {
  if (e.def.boss || e.def.hp <= 10 || (e.hp >= e.maxHp && !(e.shield > 0))) return;
  const k = nBars * 5;
  bars[k] = x; bars[k + 1] = y - r - 9; bars[k + 2] = Math.max(18, r * 2.1); bars[k + 3] = Math.max(0, e.hp / e.maxHp); bars[k + 4] = e.shield > 0 ? e.shield / e.maxShield : 0;
  nBars++;
}

// Just the body, for the see-through ghosts (no overlays, no health bar).
export function drawEnemyBody(ctx, e) {
  const c = Math.cos(e.ang), sn = Math.sin(e.ang);
  ctx.setTransform(c * BS, sn * BS, -sn * BS, c * BS, BX + e.x * BS, BY + e.y * BS);
  if (makeCanvas && !e.def.boss && ART[e.type]) {
    const frame = Math.floor(((e.wob % TAU) / TAU) * FRAMES) % FRAMES, half = spriteHalf(e.type, e.def.r);
    ctx.drawImage(sprite(e.type, e.def.r, frame), -half, -half, half * 2, half * 2);
  } else (ART[e.type] || ART.shambler)(ctx, e);
  ctx.setTransform(BS, 0, 0, BS, BX, BY);
}

// Draws every queued health bar in a handful of calls: one path per colour.
const BAR_FILL = ['#5dff5a', '#ffd23a', '#ff4a3a'];
export function flushEnemyBars(ctx) {
  if (!nBars) return;
  ctx.setTransform(BS, 0, 0, BS, BX, BY);
  ctx.beginPath();
  for (let i = 0; i < nBars; i++) { const k = i * 5, w = bars[k + 2]; ctx.rect(bars[k] - w / 2 - 1.5, bars[k + 1] - 1.5, w + 3, 6); }
  ctx.fillStyle = INK; ctx.fill();
  for (let band = 0; band < 3; band++) {
    ctx.beginPath(); let any = false;
    for (let i = 0; i < nBars; i++) {
      const k = i * 5, f = bars[k + 3], b = f > 0.5 ? 0 : f > 0.25 ? 1 : 2;
      if (b !== band || f <= 0) continue;
      const w = bars[k + 2]; ctx.rect(bars[k] - w / 2, bars[k + 1], w * f, 3); any = true;
    }
    if (any) { ctx.fillStyle = BAR_FILL[band]; ctx.fill(); }
  }
  ctx.beginPath(); let sh = false;
  for (let i = 0; i < nBars; i++) { const k = i * 5, f = bars[k + 4]; if (f > 0) { const w = bars[k + 2]; ctx.rect(bars[k] - w / 2, bars[k + 1] - 3, w * f, 2); sh = true; } }
  if (sh) { ctx.fillStyle = '#5fe0ff'; ctx.fill(); }
  nBars = 0;
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
