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
  if (map.data.theme && map.data.theme !== 'meadow') { paintThemed(ctx, map, THEMES[map.data.theme]); return; }
  const { data } = map, path = { distTo: map.distTo };
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
  for (const r of map.routes) strokePath(ctx, r.path, data.pathWidth + 14, 'rgba(10,50,40,0.35)');
  for (const r of map.routes) strokePath(ctx, r.path, data.pathWidth + 4, '#7a4e34');
  for (const r of map.routes) strokePath(ctx, r.path, data.pathWidth - 2, '#d9b47a');
  for (const r of map.routes) strokePath(ctx, r.path, data.pathWidth - 16, '#ecd0a0');
  for (const { path } of map.routes) for (let i = 0; i < path.count; i += 2) {
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

// ---- themed maps ----------------------------------------------------------------------------------
// Ashfork (cinders and lava), Rimecoil (snow and ice), Mirefen (bog and black water). Same layers as
// the meadow: ground, scattered detail, water, the roads, rocks, glowing things, trees, the Heartfire.
export const THEMES = {
  ash: {
    ground: ['#7a5a4a', '#5e4038', '#3a2626'], mottle: ['rgba(255,140,80,0.08)', 'rgba(20,10,10,0.18)'],
    detail: 'cracks', detailCols: ['rgba(255,120,50,0.55)', 'rgba(40,20,20,0.5)'],
    pond: 'lava', path: ['rgba(20,8,8,0.4)', '#2a1c1e', '#5a4e52', '#76686a'], pathStyle: 'stone',
    rock: ['#4a4048', '#2a2228', '#6a5e66'], tree: 'dead', glow: ['rgba(255,110,40,0.25)', '#ff8a3a', '#ffd27a'],
    vignette: 'rgba(30,8,4,0.4)', goalRing: '#6a3a3a',
  },
  snow: {
    ground: ['#f2f8ff', '#d6e6f4', '#a8c0d8'], mottle: ['rgba(255,255,255,0.35)', 'rgba(120,150,190,0.14)'],
    detail: 'drifts', detailCols: ['rgba(255,255,255,0.8)', 'rgba(140,170,210,0.35)'],
    pond: 'ice', path: ['rgba(60,80,120,0.25)', '#6a7a96', '#b8c8dc', '#dce8f4'], pathStyle: 'snow',
    rock: ['#8a9ab8', '#4a5878', '#d8e4f4'], tree: 'pine', glow: ['rgba(140,230,255,0.25)', '#9fe6ff', '#ffffff'],
    vignette: 'rgba(40,60,100,0.3)', goalRing: '#5a6a8a',
  },
  marsh: {
    ground: ['#3e6a4a', '#2c5040', '#1a3430'], mottle: ['rgba(140,200,110,0.12)', 'rgba(10,30,25,0.2)'],
    detail: 'reeds', detailCols: ['rgba(150,190,90,0.7)', 'rgba(40,80,50,0.6)'],
    pond: 'bog', path: ['rgba(10,25,20,0.4)', '#3a2414', '#7a5634', '#9a7248'], pathStyle: 'planks',
    rock: ['#5a6a5e', '#2e3a32', '#8a9a8e'], tree: 'willow', glow: ['rgba(170,255,140,0.22)', '#b8ff8a', '#f0ffd0'],
    vignette: 'rgba(5,20,15,0.45)', goalRing: '#4a5a46',
  },
};

function paintThemed(ctx, map, T) {
  const { data } = map, W = data.width, H = data.height, rand = mulberry32(data.seed + 99);
  const near = (x, y, pad) => map.distTo(x, y) < data.pathWidth / 2 + pad;
  const inPond = (x, y, pad = 0) => data.ponds.some((p) => ((x - p.x) / (p.rx + pad)) ** 2 + ((y - p.y) / (p.ry + pad)) ** 2 < 1);

  // ground
  const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 60, W * 0.5, H * 0.5, W * 0.72);
  g.addColorStop(0, T.ground[0]); g.addColorStop(0.6, T.ground[1]); g.addColorStop(1, T.ground[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 240; i++) {
    const x = rand() * W, y = rand() * H, r = 14 + rand() * 46;
    ctx.fillStyle = rand() < 0.55 ? T.mottle[0] : T.mottle[1];
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.5 + rand() * 0.5), rand() * 3, 0, TAU); ctx.fill();
  }
  // ground detail: ember cracks, snow drifts or reeds
  for (let i = 0; i < (T.detail === 'reeds' ? 700 : 260); i++) {
    const x = rand() * W, y = rand() * H;
    if (near(x, y, 4)) continue;
    const c = rand() < 0.35 ? T.detailCols[0] : T.detailCols[1];
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.4; ctx.beginPath();
    if (T.detail === 'cracks') { let px = x, py = y; ctx.moveTo(px, py); for (let k = 0; k < 3; k++) { px += (rand() - 0.5) * 18; py += (rand() - 0.5) * 12; ctx.lineTo(px, py); } ctx.stroke(); }
    else if (T.detail === 'drifts') { ctx.ellipse(x, y, 6 + rand() * 12, 2 + rand() * 2, 0, Math.PI, TAU); ctx.fill(); }
    else { ctx.moveTo(x, y); ctx.lineTo(x - 2, y - 7 - rand() * 4); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 6 - rand() * 4); ctx.stroke(); }
  }

  // water: lava, ice or bog
  for (const p of data.ponds) {
    if (T.pond === 'lava') {
      ctx.fillStyle = '#2a1414'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx + 6, p.ry + 6, 0, 0, TAU); ctx.fill();
      const pg = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, Math.max(p.rx, p.ry));
      pg.addColorStop(0, '#ffe27a'); pg.addColorStop(0.45, '#ff8a2a'); pg.addColorStop(1, '#b0301a');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(60,20,16,0.7)'; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(p.x + (rand() - 0.5) * p.rx, p.y + (rand() - 0.5) * p.ry, 6 + rand() * 9, 3 + rand() * 3, rand() * 3, 0, TAU); ctx.stroke(); }
    } else if (T.pond === 'ice') {
      ctx.fillStyle = '#7a9ac0'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx + 5, p.ry + 5, 0, 0, TAU); ctx.fill();
      const pg = ctx.createLinearGradient(p.x - p.rx, p.y - p.ry, p.x + p.rx, p.y + p.ry);
      pg.addColorStop(0, '#f4fcff'); pg.addColorStop(0.5, '#bfe8f8'); pg.addColorStop(1, '#8ccce8');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) { const x0 = p.x + (rand() - 0.5) * p.rx, y0 = p.y + (rand() - 0.5) * p.ry; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (rand() - 0.5) * 30, y0 + (rand() - 0.5) * 20); ctx.lineTo(x0 + (rand() - 0.5) * 40, y0 + (rand() - 0.5) * 30); ctx.stroke(); }
    } else {
      ctx.fillStyle = '#16261e'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx + 6, p.ry + 6, 0, 0, TAU); ctx.fill();
      const pg = ctx.createRadialGradient(p.x - p.rx * 0.3, p.y - p.ry * 0.3, 4, p.x, p.y, Math.max(p.rx, p.ry));
      pg.addColorStop(0, '#3e6a6a'); pg.addColorStop(0.6, '#1e4448'); pg.addColorStop(1, '#122a2e');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < Math.round(p.rx / 18); i++) {   // lily pads
        const a = rand() * TAU, d = 0.2 + rand() * 0.7, x = p.x + Math.cos(a) * p.rx * d, y = p.y + Math.sin(a) * p.ry * d;
        ctx.fillStyle = rand() < 0.5 ? '#4a8a4a' : '#3a7a44'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 4 + rand() * 4, 0.4, TAU); ctx.closePath(); ctx.fill();
        if (rand() < 0.3) { ctx.fillStyle = '#f0e0ff'; ctx.beginPath(); ctx.arc(x + 1, y - 1, 1.8, 0, TAU); ctx.fill(); }
      }
      ctx.strokeStyle = 'rgba(150,200,190,0.35)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(p.x + (rand() - 0.5) * p.rx, p.y + (rand() - 0.5) * p.ry, 10 + rand() * 12, 3, 0, 0.3, 2.6); ctx.stroke(); }
    }
  }

  // roads
  ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
  for (const r of map.routes) strokePath(ctx, r.path, data.pathWidth + 14, T.path[0]);
  for (const r of map.routes) strokePath(ctx, r.path, data.pathWidth + 4, T.path[1]);
  for (const r of map.routes) strokePath(ctx, r.path, data.pathWidth - 2, T.path[2]);
  for (const r of map.routes) strokePath(ctx, r.path, data.pathWidth - 16, T.path[3]);
  for (const { path } of map.routes) for (let i = 0; i < path.count; i += T.pathStyle === 'planks' ? 3 : 2) {
    const j = Math.min(path.count - 1, i + 1), a = Math.atan2(path.ys[j] - path.ys[i], path.xs[j] - path.xs[i]);
    const nx = -Math.sin(a), ny = Math.cos(a), hw = (data.pathWidth - 4) / 2;
    if (T.pathStyle === 'planks') {   // a wooden causeway: plank seams across the road
      ctx.strokeStyle = 'rgba(40,24,12,0.55)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(path.xs[i] - nx * hw, path.ys[i] - ny * hw); ctx.lineTo(path.xs[i] + nx * hw, path.ys[i] + ny * hw); ctx.stroke();
      continue;
    }
    const off = (rand() - 0.5) * (data.pathWidth - 10), x = path.xs[i] + nx * off + (rand() - 0.5) * 6, y = path.ys[i] + ny * off + (rand() - 0.5) * 6;
    ctx.fillStyle = T.pathStyle === 'snow' ? (rand() < 0.5 ? 'rgba(255,255,255,0.6)' : 'rgba(120,140,170,0.25)') : (rand() < 0.5 ? 'rgba(20,10,10,0.3)' : 'rgba(255,140,80,0.25)');
    ctx.beginPath(); ctx.ellipse(x, y, 2 + rand() * 3.5, 1.5 + rand() * 2.5, rand() * 3, 0, TAU); ctx.fill();
  }
  if (T.pathStyle === 'stone') for (const r of map.routes) strokePath(ctx, r.path, data.pathWidth + 6, 'rgba(255,110,40,0.12)');   // ember-lit edges

  // rocks
  for (const r of data.rocks) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(r.x + 4, r.y + 5, r.r, r.r * 0.8, 0, 0, TAU); ctx.fill();
    const pts = [];
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU, rr = r.r * (0.78 + rand() * 0.28); pts.push([r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr]); }
    ctx.fillStyle = T.rock[0]; ctx.strokeStyle = T.rock[1]; ctx.lineWidth = 2;
    ctx.beginPath(); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = T.rock[2];
    ctx.beginPath(); ctx.moveTo(pts[4][0], pts[4][1]); ctx.lineTo(pts[5][0], pts[5][1]); ctx.lineTo(pts[6][0], pts[6][1]); ctx.lineTo(r.x, r.y - r.r * 0.15); ctx.closePath(); ctx.fill();
  }

  // glowing things: embers, ice crystals, marsh lights
  for (let i = 0; i < 46; i++) {
    const x = rand() * W, y = rand() * H;
    if (near(x, y, 8) || inPond(x, y, 4)) continue;
    ctx.fillStyle = T.glow[0]; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = rand() < 0.5 ? T.glow[1] : T.glow[2];
    if (T.tree === 'pine') { ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 2, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 2, y); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.arc(x + 5, y + 3, 1.6, 0, TAU); ctx.fill(); }
  }

  // trees: charred dead trees, snowy pines, or weeping willows (from above, slightly tilted)
  for (const t of map.trees) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(t.x + 5, t.y + 7, t.r * 1.1, t.r, 0, 0, TAU); ctx.fill();
    if (T.tree === 'dead') {
      ctx.strokeStyle = '#1e1416'; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const a = t.rot + (i / 5) * TAU, L = t.r * (0.8 + (i % 2) * 0.3);
        ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x + Math.cos(a) * L, t.y + Math.sin(a) * L); ctx.stroke();
        ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(t.x + Math.cos(a) * L * 0.6, t.y + Math.sin(a) * L * 0.6); ctx.lineTo(t.x + Math.cos(a + 0.6) * L, t.y + Math.sin(a + 0.6) * L); ctx.stroke();
      }
      ctx.fillStyle = '#2e2224'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.28, 0, TAU); ctx.fill();
      if (t.r > 16) { ctx.fillStyle = '#ff8a3a'; ctx.beginPath(); ctx.arc(t.x + 2, t.y - 1, 1.8, 0, TAU); ctx.fill(); }
      ctx.lineCap = 'butt';
    } else if (T.tree === 'pine') {
      for (let k = 0; k < 3; k++) {
        const r = t.r * (1 - k * 0.28), y = t.y - k * t.r * 0.25;
        ctx.fillStyle = k % 2 ? '#2a6a5a' : '#215a4c';
        ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = t.rot + (i / 8) * TAU, rr = i % 2 ? r * 0.65 : r; ctx.lineTo(t.x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(t.x - r * 0.25, y - r * 0.3, r * 0.35, 0, TAU); ctx.fill();
      }
    } else {
      ctx.fillStyle = '#2e5a3a';
      for (let i = 0; i < 7; i++) { const a = t.rot + (i / 7) * TAU; ctx.beginPath(); ctx.ellipse(t.x + Math.cos(a) * t.r * 0.55, t.y + Math.sin(a) * t.r * 0.55 + 3, t.r * 0.42, t.r * 0.7, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#4a7a4a'; ctx.beginPath(); ctx.arc(t.x - t.r * 0.1, t.y - t.r * 0.15, t.r * 0.62, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(150,200,120,0.6)'; ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) { const a = t.rot + (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(t.x + Math.cos(a) * t.r * 0.3, t.y + Math.sin(a) * t.r * 0.3); ctx.lineTo(t.x + Math.cos(a) * t.r * 0.9, t.y + Math.sin(a) * t.r * 0.9 + 6); ctx.stroke(); }
    }
  }

  // Heartfire plinth
  const goal = data.goal;
  ctx.fillStyle = 'rgba(255,200,90,0.2)'; ctx.beginPath(); ctx.arc(goal.x, goal.y, goal.r + 28, 0, TAU); ctx.fill();
  ctx.fillStyle = T.goalRing; ctx.strokeStyle = '#2a1f38'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(goal.x, goal.y, 36, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.arc(goal.x + Math.cos(a) * 36, goal.y + Math.sin(a) * 36, 6, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#2a1f38'; ctx.beginPath(); ctx.arc(goal.x, goal.y, 22, 0, TAU); ctx.fill();

  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, W * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, T.vignette);
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
