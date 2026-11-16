// Paints the static map (ground, path, ponds, rocks, trees) once onto an offscreen canvas.
import { mulberry32 } from '../sim/path.js';

const TAU = Math.PI * 2;

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
  const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 80, W * 0.5, H * 0.5, W * 0.75);
  g.addColorStop(0, '#16353a');
  g.addColorStop(1, '#0b1c22');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // mottled moss and mud
  for (let i = 0; i < 260; i++) {
    const x = rand() * W, y = rand() * H, r = 14 + rand() * 46;
    ctx.fillStyle = rand() < 0.5 ? 'rgba(40,96,84,0.10)' : 'rgba(4,14,20,0.14)';
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.5 + rand() * 0.5), rand() * 3, 0, TAU); ctx.fill();
  }
  // grass tufts
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 700; i++) {
    const x = rand() * W, y = rand() * H;
    ctx.strokeStyle = rand() < 0.3 ? 'rgba(86,160,130,0.35)' : 'rgba(46,104,92,0.45)';
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x - 2, y - 5 - rand() * 3);
    ctx.moveTo(x, y); ctx.lineTo(x + 2.5, y - 4 - rand() * 3);
    ctx.stroke();
  }

  // ponds
  for (const p of data.ponds) {
    ctx.fillStyle = '#0a1418';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx + 5, p.ry + 5, 0, 0, TAU); ctx.fill();
    const pg = ctx.createRadialGradient(p.x - p.rx * 0.3, p.y - p.ry * 0.3, 4, p.x, p.y, Math.max(p.rx, p.ry));
    pg.addColorStop(0, '#1d6a80');
    pg.addColorStop(1, '#0f3d52');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(150,230,240,0.25)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(p.x + (rand() - 0.5) * p.rx, p.y + (rand() - 0.5) * p.ry, 9 + rand() * 8, 3 + rand() * 2, 0, 0.3, 2.6);
      ctx.stroke();
    }
    // lily pads
    for (let i = 0; i < 3; i++) {
      const a = rand() * TAU, d = 0.25 + rand() * 0.45;
      const x = p.x + Math.cos(a) * p.rx * d, y = p.y + Math.sin(a) * p.ry * d;
      ctx.fillStyle = '#2f8a5c';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 5 + rand() * 3, 0.5, TAU); ctx.closePath(); ctx.fill();
    }
    // reeds on the bank
    ctx.strokeStyle = '#3f7d5e';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.1 + rand() * 0.8);
      const x = p.x + Math.cos(a) * (p.rx + 2), y = p.y + Math.sin(a) * (p.ry + 2);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rand() - 0.5) * 4, y - 9 - rand() * 7); ctx.stroke();
    }
  }

  // path: dark verge, stone border, worn centre, cobbles
  ctx.lineJoin = 'round';
  ctx.lineCap = 'butt';
  strokePath(ctx, path, data.pathWidth + 12, 'rgba(4,10,12,0.75)');
  strokePath(ctx, path, data.pathWidth + 2, '#3d3644');
  strokePath(ctx, path, data.pathWidth - 6, '#5b5364');
  strokePath(ctx, path, data.pathWidth - 22, '#665d70');
  for (let i = 0; i < path.count; i += 2) {
    for (let k = 0; k < 2; k++) {
      const off = (rand() - 0.5) * (data.pathWidth - 10);
      const a = Math.atan2(path.ys[Math.min(path.count - 1, i + 1)] - path.ys[i], path.xs[Math.min(path.count - 1, i + 1)] - path.xs[i]);
      const x = path.xs[i] - Math.sin(a) * off + (rand() - 0.5) * 6, y = path.ys[i] + Math.cos(a) * off + (rand() - 0.5) * 6;
      ctx.fillStyle = rand() < 0.5 ? 'rgba(30,24,38,0.35)' : 'rgba(150,140,170,0.22)';
      ctx.beginPath(); ctx.ellipse(x, y, 2 + rand() * 3.5, 1.5 + rand() * 2.5, rand() * 3, 0, TAU); ctx.fill();
    }
  }

  // rocks
  for (const r of data.rocks) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(r.x + 4, r.y + 5, r.r, r.r * 0.8, 0, 0, TAU); ctx.fill();
    const n = 7, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, rr = r.r * (0.78 + rand() * 0.28);
      pts.push([r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr]);
    }
    ctx.fillStyle = '#59636b';
    ctx.strokeStyle = '#2a3138';
    ctx.lineWidth = 2;
    ctx.beginPath(); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7b8791';
    ctx.beginPath();
    ctx.moveTo(pts[4][0], pts[4][1]); ctx.lineTo(pts[5][0], pts[5][1]); ctx.lineTo(pts[6][0], pts[6][1]); ctx.lineTo(r.x, r.y - r.r * 0.15);
    ctx.closePath(); ctx.fill();
  }

  // glowcap mushrooms (pure decoration)
  for (let i = 0; i < 46; i++) {
    const x = rand() * W, y = rand() * H;
    if (path.distTo(x, y) < data.pathWidth / 2 + 8) continue;
    ctx.fillStyle = 'rgba(120,255,230,0.10)';
    ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = rand() < 0.5 ? '#7df2d8' : '#c6a4ff';
    ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.arc(x + 5, y + 3, 1.6, 0, TAU); ctx.fill();
  }

  // trees: layered canopy seen from above
  for (const t of map.trees) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(t.x + 5, t.y + 7, t.r * 1.1, t.r, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = t.rot + (i / 5) * TAU, d = t.r * 0.45;
      ctx.fillStyle = i % 2 ? '#1c4a40' : '#17403a';
      ctx.beginPath(); ctx.arc(t.x + Math.cos(a) * d, t.y + Math.sin(a) * d, t.r * 0.72, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#2a6654';
    ctx.beginPath(); ctx.arc(t.x - t.r * 0.15, t.y - t.r * 0.2, t.r * 0.55, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3b8a6c';
    ctx.beginPath(); ctx.arc(t.x - t.r * 0.25, t.y - t.r * 0.3, t.r * 0.25, 0, TAU); ctx.fill();
  }

  // Heartfire plinth (the flame itself is animated by the renderer)
  const goal = data.goal;
  ctx.fillStyle = 'rgba(255,170,80,0.08)';
  ctx.beginPath(); ctx.arc(goal.x, goal.y, goal.r + 26, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2b2630';
  ctx.strokeStyle = '#8d7f96';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(goal.x, goal.y, 36, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6f647a';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath(); ctx.arc(goal.x + Math.cos(a) * 36, goal.y + Math.sin(a) * 36, 6, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = '#17131b';
  ctx.beginPath(); ctx.arc(goal.x, goal.y, 22, 0, TAU); ctx.fill();

  // edge vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.72);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}
