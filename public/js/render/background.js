// Paints the static map (ground, path, ponds, rocks, trees) once onto an offscreen canvas.
// Palette: a vivid dusk marsh. Bright turf, a warm sandstone causeway, glowing flora.
import { mulberry32 } from '../sim/path.js';

const TAU = Math.PI * 2;

export const MAP_COLORS = {
  ground: '#2f9a74',
  groundEdge: '#1f6f63',
};

function strokePath(ctx, path, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(path.xs[0], path.ys[0]);
  for (let i = 1; i < path.count; i += 2) ctx.lineTo(path.xs[i], path.ys[i]);
  ctx.lineTo(path.xs[path.count - 1], path.ys[path.count - 1]);
  ctx.stroke();
}

export function paintBackground(ctx, map) {
  const { data, path } = map;
  const W = data.width, H = data.height;
  const rand = mulberry32(data.seed + 99);

  // ground
  const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 60, W * 0.5, H * 0.5, W * 0.72);
  g.addColorStop(0, '#46b384');
  g.addColorStop(0.6, MAP_COLORS.ground);
  g.addColorStop(1, MAP_COLORS.groundEdge);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // mottled turf
  for (let i = 0; i < 240; i++) {
    const x = rand() * W, y = rand() * H, r = 14 + rand() * 46;
    ctx.fillStyle = rand() < 0.55 ? 'rgba(120,220,140,0.13)' : 'rgba(10,70,60,0.13)';
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.5 + rand() * 0.5), rand() * 3, 0, TAU); ctx.fill();
  }
  // grass tufts
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 900; i++) {
    const x = rand() * W, y = rand() * H;
    ctx.strokeStyle = rand() < 0.35 ? 'rgba(170,250,170,0.55)' : 'rgba(30,110,80,0.5)';
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x - 2, y - 5 - rand() * 3);
    ctx.moveTo(x, y); ctx.lineTo(x + 2.5, y - 4 - rand() * 3);
    ctx.stroke();
  }
  // wildflowers
  const petals = ['#ffe45c', '#ff8ad8', '#ffffff', '#ffb04a', '#9ad8ff'];
  for (let i = 0; i < 160; i++) {
    const x = rand() * W, y = rand() * H;
    if (path.distTo(x, y) < data.pathWidth / 2 + 6) continue;
    ctx.fillStyle = petals[Math.floor(rand() * petals.length)];
    ctx.beginPath(); ctx.arc(x, y, 1.6 + rand() * 1.2, 0, TAU); ctx.fill();
  }

  // ponds
  for (const p of data.ponds) {
    ctx.fillStyle = '#16566e';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx + 5, p.ry + 5, 0, 0, TAU); ctx.fill();
    const pg = ctx.createRadialGradient(p.x - p.rx * 0.3, p.y - p.ry * 0.3, 4, p.x, p.y, Math.max(p.rx, p.ry));
    pg.addColorStop(0, '#7ff0ff');
    pg.addColorStop(0.5, '#34c6ec');
    pg.addColorStop(1, '#1d8cc4');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(p.x + (rand() - 0.5) * p.rx, p.y + (rand() - 0.5) * p.ry, 9 + rand() * 8, 3 + rand() * 2, 0, 0.3, 2.6);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const a = rand() * TAU, d = 0.25 + rand() * 0.45;
      const x = p.x + Math.cos(a) * p.rx * d, y = p.y + Math.sin(a) * p.ry * d;
      ctx.fillStyle = '#3fcf6e';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 5 + rand() * 3, 0.5, TAU); ctx.closePath(); ctx.fill();
      if (rand() < 0.6) { ctx.fillStyle = '#ff8ad8'; ctx.beginPath(); ctx.arc(x + 2, y - 1, 2, 0, TAU); ctx.fill(); }
    }
    ctx.strokeStyle = '#2f8f4e';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.1 + rand() * 0.8);
      const x = p.x + Math.cos(a) * (p.rx + 2), y = p.y + Math.sin(a) * (p.ry + 2);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rand() - 0.5) * 4, y - 9 - rand() * 7); ctx.stroke();
    }
  }

  // path: soft shadow, dark border, sandstone body, bright worn centre, cobbles
  ctx.lineJoin = 'round';
  ctx.lineCap = 'butt';
  strokePath(ctx, path, data.pathWidth + 14, 'rgba(10,50,40,0.35)');
  strokePath(ctx, path, data.pathWidth + 4, '#7a4e34');
  strokePath(ctx, path, data.pathWidth - 2, '#d9b47a');
  strokePath(ctx, path, data.pathWidth - 16, '#ecd0a0');
  for (let i = 0; i < path.count; i += 2) {
    for (let k = 0; k < 2; k++) {
      const off = (rand() - 0.5) * (data.pathWidth - 10);
      const j = Math.min(path.count - 1, i + 1);
      const a = Math.atan2(path.ys[j] - path.ys[i], path.xs[j] - path.xs[i]);
      const x = path.xs[i] - Math.sin(a) * off + (rand() - 0.5) * 6, y = path.ys[i] + Math.cos(a) * off + (rand() - 0.5) * 6;
      ctx.fillStyle = rand() < 0.5 ? 'rgba(150,100,60,0.28)' : 'rgba(255,248,225,0.4)';
      ctx.beginPath(); ctx.ellipse(x, y, 2 + rand() * 3.5, 1.5 + rand() * 2.5, rand() * 3, 0, TAU); ctx.fill();
    }
  }

  // rocks
  for (const r of data.rocks) {
    ctx.fillStyle = 'rgba(10,50,40,0.35)';
    ctx.beginPath(); ctx.ellipse(r.x + 4, r.y + 5, r.r, r.r * 0.8, 0, 0, TAU); ctx.fill();
    const n = 7, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, rr = r.r * (0.78 + rand() * 0.28);
      pts.push([r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr]);
    }
    ctx.fillStyle = '#9aa6bd';
    ctx.strokeStyle = '#4b546a';
    ctx.lineWidth = 2;
    ctx.beginPath(); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d3dbea';
    ctx.beginPath();
    ctx.moveTo(pts[4][0], pts[4][1]); ctx.lineTo(pts[5][0], pts[5][1]); ctx.lineTo(pts[6][0], pts[6][1]); ctx.lineTo(r.x, r.y - r.r * 0.15);
    ctx.closePath(); ctx.fill();
    // moss
    ctx.fillStyle = '#58c06c';
    ctx.beginPath(); ctx.arc(pts[1][0], pts[1][1] - 2, r.r * 0.22, 0, TAU); ctx.fill();
  }

  // glowcaps
  for (let i = 0; i < 46; i++) {
    const x = rand() * W, y = rand() * H;
    if (path.distTo(x, y) < data.pathWidth / 2 + 8) continue;
    const pink = rand() < 0.5;
    ctx.fillStyle = pink ? 'rgba(255,120,220,0.22)' : 'rgba(110,250,255,0.22)';
    ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = pink ? '#ff7ae0' : '#7af8ff';
    ctx.beginPath(); ctx.arc(x, y, 2.8, 0, TAU); ctx.arc(x + 5, y + 3, 1.9, 0, TAU); ctx.fill();
  }

  // trees: layered canopy seen from above
  for (const t of map.trees) {
    ctx.fillStyle = 'rgba(10,50,40,0.4)';
    ctx.beginPath(); ctx.ellipse(t.x + 5, t.y + 7, t.r * 1.1, t.r, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = t.rot + (i / 5) * TAU, d = t.r * 0.45;
      ctx.fillStyle = i % 2 ? '#1f8a4c' : '#187a45';
      ctx.beginPath(); ctx.arc(t.x + Math.cos(a) * d, t.y + Math.sin(a) * d, t.r * 0.72, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#34b062';
    ctx.beginPath(); ctx.arc(t.x - t.r * 0.15, t.y - t.r * 0.2, t.r * 0.58, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6fe08a';
    ctx.beginPath(); ctx.arc(t.x - t.r * 0.28, t.y - t.r * 0.32, t.r * 0.26, 0, TAU); ctx.fill();
    if (t.r > 16) {
      ctx.fillStyle = '#ff5a6a';
      ctx.beginPath(); ctx.arc(t.x + t.r * 0.3, t.y + t.r * 0.1, 2.2, 0, TAU); ctx.arc(t.x - t.r * 0.1, t.y + t.r * 0.4, 2.2, 0, TAU); ctx.fill();
    }
  }

  // Heartfire plinth (the flame itself is animated by the renderer)
  const goal = data.goal;
  ctx.fillStyle = 'rgba(255,200,90,0.18)';
  ctx.beginPath(); ctx.arc(goal.x, goal.y, goal.r + 28, 0, TAU); ctx.fill();
  ctx.fillStyle = '#6d5a86';
  ctx.strokeStyle = '#3a2c4e';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(goal.x, goal.y, 36, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#a58fc4';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath(); ctx.arc(goal.x + Math.cos(a) * 36, goal.y + Math.sin(a) * 36, 6, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = '#2a1f38';
  ctx.beginPath(); ctx.arc(goal.x, goal.y, 22, 0, TAU); ctx.fill();

  // soft edge vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, W * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(5,30,35,0.3)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}
