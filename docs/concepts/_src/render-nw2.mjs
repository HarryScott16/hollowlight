// Renders the six new ward concepts (nw2-art.mjs, docs/new-wards-2.md) into docs/concepts/new-wards-2/:
//   <type>.png         both skins: base, then tiers 2, 4 and 5 on each path (2x), real size under each
//   <type>-attack.png  its attack or effect on a road with real enemies, one panel per path (tier 4)
//   lineup.png         all 12 current wards + the six, base and a tier 4, both skins, at real size
//   lineup-2x.png      the same, doubled (nearest neighbour) for reading
//   silhouettes.png    the same lineup as solid black shapes (the silhouette test)
//   water-<map>.png    the two water wards on each map's water (Rimecoil: in a hole in the ice;
//                      Ashfork: the lava variant), with the Undertow's whirlpool on the road
// and prints the checks: height caps and the body-and-face rule (same rules as tools/wards.mjs),
// plus each map's water: area, how much of it is within reach of the road.
//   CANVAS_MODULES=~/scratch/rnd/node_modules FONT_DIR=<dir with DejaVuSans*.ttf> node docs/concepts/_src/render-nw2.mjs [only]
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { createCanvas, turf, text, para, save } from './sheet.mjs';
import { NEW_WARDS, ART, registerNewWards } from './nw2-art.mjs';
import { drawFx, ROADY } from './nw2-fx.mjs';
import { initWardArt, setSkin, drawWard, SKINS, wardScale, artPath } from '../../../public/js/render/wardArt.js';
import { FACE, WARD_DMG } from '../../../public/js/render/wards/kit.js';
import { ascendFront } from '../../../public/js/render/wards/ascend.js';
import { MAPS, MAP_ORDER } from '../../../public/js/data/maps.js';
import { buildMap } from '../../../public/js/sim/path.js';
import { paintBackground } from '../../../public/js/render/background.js';
import { TOWER_ORDER, TOWERS } from '../../../public/js/data/towers.js';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../new-wards-2');
mkdirSync(OUT, { recursive: true });
registerNewWards();
const only = process.argv[2] || 'all';
const want = (k) => only === 'all' || only.split(',').includes(k);
const BG = '#0f1420', SUB = '#8fa0b8', LBL = '#c9d4e2';
const SKIN_KEYS = ['kindling', 'lantern'];
const TYPES = Object.keys(NEW_WARDS);
const tiersOf = (p, t) => { const a = [0, 0, 0]; if (p >= 0) a[p] = t; return a; };
const STATES = [[-1, 0], [0, 2], [0, 4], [0, 5], [1, 2], [1, 4], [1, 5], [2, 2], [2, 4], [2, 5]];

// Water under a cell (water wards are shown on water).
function water(ctx, x, y, w, h, kind = 'water') {
  const c = kind === 'lava' ? ['#2a1414', '#ff8a2a', '#ffe27a'] : kind === 'ice' ? ['#7a9ac0', '#bfe8f8', '#f4fcff'] : ['#16261e', '#1e4448', '#3e6a6a'];
  ctx.save();
  ctx.fillStyle = c[0]; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.62, w * 0.47, h * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(x + w * 0.4, y + h * 0.55, 4, x + w / 2, y + h * 0.62, w * 0.45);
  g.addColorStop(0, c[2]); g.addColorStop(1, c[1]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.62, w * 0.44, h * 0.27, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
const ST = (i = 0, extra = {}) => ({ ang: 0.5, recoil: 0, time: 0.9 + i * 0.37, pulse: 0, fire: 0, pop: 0, id: i, direct: true, ...extra });

// ---- checks (as tools/wards.mjs) ----------------------------------------------------------------
const CAPS = [46, 50, 56, 62, 68, 104];
const CK = createCanvas(160, 160).getContext('2d'), HK = createCanvas(170, 170).getContext('2d');
function height(type, tiers) {
  let worst = 0;
  for (let k = 0; k < 8; k++) {
    HK.setTransform(1, 0, 0, 1, 0, 0); HK.clearRect(0, 0, 170, 170);
    drawWard(HK, { type, tiers, x: 85, y: 140, id: 1 }, ST(1, { ang: (k / 8) * Math.PI * 2, time: 0.3 }));
    const px = HK.getImageData(0, 0, 170, 170).data;
    let top = 170;
    for (let y = 0; y < 170 && top === 170; y++) for (let x = 0; x < 170; x++) if (px[(y * 170 + x) * 4 + 3] > 60) { top = y; break; }
    worst = Math.max(worst, 140 + 3 * wardScale(tiers) - top);
  }
  return worst;
}
function coverage(art, type, tiers, skin) {
  const P = artPath(tiers), d = WARD_DMG[type], box = art.self(P), Z = 3, N = 160;
  let worst = 0;
  FACE.skip = true;
  for (let k = 0; k < 8; k++) {
    CK.setTransform(1, 0, 0, 1, 0, 0); CK.clearRect(0, 0, N, N);
    CK.translate(N / 2, N * 0.72); CK.scale(Z, Z); CK.translate(0, -11);
    const st = { ang: (k / 8) * Math.PI * 2, recoil: 0, time: 0.3 + k * 0.4, pulse: 0, fire: 0, pop: 0, id: 1 };
    art.front(CK, P, st, d);
    if (P.t5) ascendFront(CK, type, P, st, d, skin, -40);
    const px = CK.getImageData(0, 0, N, N).data;
    const x0 = Math.round(N / 2 + box[0] * Z), x1 = Math.round(N / 2 + box[2] * Z), y0 = Math.round(N * 0.72 + (box[1] - 11) * Z), y1 = Math.round(N * 0.72 + (box[3] - 11) * Z);
    let hit = 0, all = 0;
    for (let y = Math.max(0, y0); y < Math.min(N, y1); y++) for (let x = Math.max(0, x0); x < Math.min(N, x1); x++) { all++; if (px[(y * N + x) * 4 + 3] > 110) hit++; }
    worst = Math.max(worst, all ? hit / all : 0);
  }
  FACE.skip = false;
  return worst;
}
const HEIGHTS = {};
if (want('check') || want('sheets')) {
  let bad = 0;
  for (const s of SKIN_KEYS) {
    setSkin(s); initWardArt(() => createCanvas(1, 1), 1);
    for (const t of TYPES) for (const [p, tier] of STATES) {
      const tiers = tiersOf(p, tier), h = height(t, tiers), cap = CAPS[tier], cv = coverage(ART[s][t], t, tiers, s);
      HEIGHTS[`${s}|${t}|${tiers.join('')}`] = h;
      if (h > cap) { console.log(`TOO TALL: ${t} ${tiers.join('/')} (${s}) ${h.toFixed(1)} px (cap ${cap})`); bad++; }
      if (cv > 0.3) { console.log(`GEAR COVERS BODY: ${t} ${tiers.join('/')} (${s}) ${(cv * 100).toFixed(0)}%`); bad++; }
    }
  }
  if (process.env.HEIGHTS) for (const [k, h] of Object.entries(HEIGHTS)) console.log(k, h.toFixed(1));
  console.log(`checks: ${TYPES.length} wards x 2 skins x ${STATES.length} states, ${bad} problem(s)`);
}

// ---- per-ward sheets ------------------------------------------------------------------------------
if (want('sheets')) for (const type of TYPES) {
  const W2 = NEW_WARDS[type], Z = 2, CW = 108 * Z, CH = 124 * Z, gap = 6, left = 118, top = 92, rowH = CH + 22 + 82;
  const W = left + STATES.length * (CW + gap) + 8, H = top + 2 * rowH + 10;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  text(ctx, `${W2.name}`, 16, 32, { size: 24, bold: true, align: 'left' });
  text(ctx, `${W2.family} · ${WARD_DMG[type][0].toUpperCase() + WARD_DMG[type].slice(1)} · about ${W2.cost.toLocaleString('en')} gold · base, then tiers 2, 4 and 5 on each path (2x); real size under each${W2.water ? ' · shown on water' : ''}`, 16, 56, { size: 13, color: SUB, align: 'left' });
  STATES.forEach(([p, tier], i) => { if (p >= 0 && tier === 2) text(ctx, `${['Might', 'Many', 'Craft'][p]}: ${W2.paths[p]}  (tier 5: ${W2.t5[p]})`, left + i * (CW + gap) + 4, 82, { size: 13, bold: true, color: '#ffe8a0', align: 'left' }); });
  SKIN_KEYS.forEach((s, r) => {
    setSkin(s); initWardArt(() => createCanvas(1, 1), Z);
    const y = top + r * rowH;
    text(ctx, SKINS[s].name, 14, y + CH / 2, { size: 15, bold: true, align: 'left' });
    STATES.forEach(([p, tier], i) => {
      const x = left + i * (CW + gap), tiers = tiersOf(p, tier);
      const c = createCanvas(CW, CH), k = c.getContext('2d');
      turf(k, 0, 0, CW, CH, r * 10 + i + 3);
      if (W2.water) water(k, 0, CH * 0.35, CW, CH * 0.75);
      k.save(); k.scale(Z, Z);
      drawWard(k, { type, tiers, x: 54, y: 100, id: i }, ST(i));
      k.restore();
      ctx.drawImage(c, x, y);
      const h = HEIGHTS[`${s}|${type}|${tiers.join('')}`];
      text(ctx, `${p < 0 ? 'Base' : `T${tier}`}${h ? ` · ${Math.round(h)} px` : ''}`, x + CW / 2, y + CH + 16, { size: 12, color: LBL });
      initWardArt(() => createCanvas(1, 1), 1);
      const c1 = createCanvas(108, 80), k1 = c1.getContext('2d');
      turf(k1, 0, 0, 108, 80, i + 40);
      if (W2.water) water(k1, 0, 30, 108, 60);
      drawWard(k1, { type, tiers, x: 54, y: 66, id: i }, ST(i));
      ctx.drawImage(c1, x + CW / 2 - 54, y + CH + 22);
      initWardArt(() => createCanvas(1, 1), Z);
    });
  });
  save(cv, `${OUT}/${type}.png`);
  console.log(`wrote ${type}.png`);
}

// ---- attack samples -------------------------------------------------------------------------------
if (want('attack')) for (const type of TYPES) {
  const W2 = NEW_WARDS[type], PW = 330, PH = 190, Z = 2, top = 74;
  const W = 16 + 3 * (PW * Z / 1.5 + 12), H = top + 2 * (PH * Z / 1.5 + 34) + 10;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  text(ctx, `${W2.name}: what it does on the road`, 16, 32, { size: 22, bold: true, align: 'left' });
  text(ctx, 'Tier 4 on each path, with real enemies (the effects are drawn for the mock-up; the game would draw its own). Top: Kindlings, bottom: Lanterns.', 16, 54, { size: 13, color: SUB, align: 'left' });
  SKIN_KEYS.forEach((s, r) => {
    setSkin(s); initWardArt(() => createCanvas(1, 1), 1);
    for (let p = 0; p < 3; p++) {
      const c = createCanvas(PW * Z, PH * Z), k = c.getContext('2d');
      k.scale(Z, Z);
      drawFx(k, type, p, s, PW, PH, (x, y, tiers, st = {}) => drawWard(k, { type: st._type || type, tiers, x, y, id: p }, ST(p, st)));
      const dw = PW * Z / 1.5, dh = PH * Z / 1.5, x = 16 + p * (dw + 12), y = top + r * (dh + 34);
      ctx.drawImage(c, x, y, dw, dh);
      text(ctx, `${SKINS[s].name} · ${W2.paths[p]} T4`, x + 4, y + dh + 18, { size: 12, color: LBL, align: 'left' });
    }
  });
  save(cv, `${OUT}/${type}-attack.png`);
  console.log(`wrote ${type}-attack.png`);
}

// ---- lineup and silhouettes: the 12 current wards + the six, real size -----------------------------
function lineup(kind) {
  const all = [...TOWER_ORDER, ...TYPES], C = 76, CHh = 92, gap = 4, left = 96, top = 70;
  const rows = [['kindling', [0, 0, 0], 'Base'], ['kindling', [4, 0, 0], 'Tier 4 (path 1)'], ['kindling', [0, 0, 5], 'Tier 5 (path 3)'], ['lantern', [0, 0, 0], 'Base'], ['lantern', [4, 0, 0], 'Tier 4 (path 1)'], ['lantern', [0, 0, 5], 'Tier 5 (path 3)']];
  const W = left + all.length * (C + gap) + 10, H = top + rows.length * (CHh + gap) + 40;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = kind === 'sil' ? '#f2f4f8' : BG; ctx.fillRect(0, 0, W, H);
  const ink = kind === 'sil' ? '#1a1428' : '#e8eef5';
  text(ctx, kind === 'sil' ? 'Silhouette test: the 12 current wards and the six concepts (gold) as solid shapes, real size' : 'The 12 current wards and the six concepts (gold) at real size, both skins', 12, 26, { size: 16, bold: true, align: 'left', color: ink });
  text(ctx, 'Each shape should read as its own role at a glance. The six new ones are on the right.', 12, 46, { size: 12, align: 'left', color: kind === 'sil' ? '#5a6070' : SUB });
  all.forEach((t, i) => text(ctx, (NEW_WARDS[t] ? NEW_WARDS[t].name.replace('The ', '').replace('Heartfire ', '').replace('Astral ', '') : TOWERS[t].name.replace(' Ward', '').replace('Thornlight ', '').replace('Ember ', '').replace('Wandering ', 'Wand. ').replace('Mortar Kiln', 'Mortar')).slice(0, 12), left + i * (C + gap) + C / 2, top - 6, { size: 10, color: NEW_WARDS[t] ? (kind === 'sil' ? '#a06a00' : '#ffd166') : (kind === 'sil' ? '#3a4050' : LBL), bold: !!NEW_WARDS[t] }));
  rows.forEach(([s, tiers, label], r) => {
    setSkin(s); initWardArt(() => createCanvas(1, 1), 1);
    const y = top + r * (CHh + gap);
    text(ctx, `${SKINS[s].name}`, 8, y + CHh / 2 - 2, { size: 11, bold: true, align: 'left', color: ink });
    text(ctx, label, 8, y + CHh / 2 + 12, { size: 10, align: 'left', color: kind === 'sil' ? '#5a6070' : SUB });
    all.forEach((t, i) => {
      const x = left + i * (C + gap), c = createCanvas(C, CHh), k = c.getContext('2d');
      const water2 = NEW_WARDS[t] && NEW_WARDS[t].water;
      if (kind !== 'sil') { turf(k, 0, 0, C, CHh, r * 30 + i); if (water2) water(k, 0, 40, C, 56); }
      drawWard(k, { type: t, tiers, x: C / 2, y: CHh - 14, id: i }, ST(i, { time: 0.8 }));
      if (kind === 'sil') { k.globalCompositeOperation = 'source-in'; k.fillStyle = '#1a1428'; k.fillRect(0, 0, C, CHh); }
      if (NEW_WARDS[t]) { ctx.strokeStyle = kind === 'sil' ? '#e0a020' : '#ffd166'; ctx.lineWidth = 1; ctx.strokeRect(x - 0.5, y - 0.5, C + 1, CHh + 1); }
      ctx.drawImage(c, x, y);
    });
  });
  return cv;
}
if (want('lineup')) {
  const a = lineup('art'); save(a, `${OUT}/lineup.png`);
  const b = createCanvas(a.width * 2, a.height * 2), g = b.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(a, 0, 0, b.width, b.height); save(b, `${OUT}/lineup-2x.png`);
  save(lineup('sil'), `${OUT}/silhouettes.png`);
  console.log('wrote lineup');
}

// ---- water wards on each map's water ----------------------------------------------------------------
// The lava variant (Ashfork): the same wards, recoloured as a basalt barge and a magma spirit.
function nearRoad(m, x, y) { let best = 1e9, bx = 0, by = 0; for (const r of m.routes) { const P = r.path; for (let i = 0; i < P.count; i += 2) { const d = Math.hypot(P.xs[i] - x, P.ys[i] - y); if (d < best) { best = d; bx = P.xs[i]; by = P.ys[i]; } } } return { d: best, x: bx, y: by }; }
if (want('water')) {
  const REACH = 130, rows = [];
  for (const id of MAP_ORDER) {
    const data = MAPS[id], m = buildMap(data), kind = data.theme === 'ash' ? 'lava' : data.theme === 'snow' ? 'ice' : 'water';
    // stats: ward spots on water (a 16 px grid, at least 12 px inside the shore) and how many reach a road
    let spots = 0, reach = 0; const per = data.ponds.map(() => ({ spots: 0, reach: 0, best: 1e9 }));
    data.ponds.forEach((p, k) => { for (let y = p.y - p.ry; y <= p.y + p.ry; y += 16) for (let x = p.x - p.rx; x <= p.x + p.rx; x += 16) { if (((x - p.x) / (p.rx - 12)) ** 2 + ((y - p.y) / (p.ry - 12)) ** 2 >= 1 || x < 10 || y < 10 || x > 1110 || y > 710) continue; spots++; per[k].spots++; const n = nearRoad(m, x, y); per[k].best = Math.min(per[k].best, n.d); if (n.d <= REACH) { reach++; per[k].reach++; } } });
    const area = Math.round(data.ponds.reduce((a, p) => a + Math.PI * p.rx * p.ry, 0));
    rows.push({ id, kind, area, spots, reach, per });
    console.log(`${id.padEnd(10)} ${kind.padEnd(5)} water area ${area} px²  ward spots ${spots}  within ${REACH} px of the road ${reach}  per pond: ${per.map((q) => `${q.spots}/${q.reach} (${Math.round(q.best)} px)`).join(', ')}`);
    // picture: the map's own background, cropped round the pond with the most spots in reach
    const k = per.map((q, i) => [q.reach, i]).sort((a, b) => b[0] - a[0])[0][1], p = data.ponds[k];
    const full = createCanvas(m.width, m.height), g = full.getContext('2d');
    paintBackground(g, m);
    const CW = 360, CHt = 240, cx = Math.max(CW / 2, Math.min(m.width - CW / 2, p.x)), cy = Math.max(CHt / 2, Math.min(m.height - CHt / 2, p.y));
    const Z = 2, out = createCanvas(2 * CW * Z + 12, CHt * Z + 64), o = out.getContext('2d');
    o.fillStyle = BG; o.fillRect(0, 0, out.width, out.height);
    // two spots on the pond nearest the road, well apart
    const cand = []; for (let y = p.y - p.ry; y <= p.y + p.ry; y += 6) for (let x = p.x - p.rx; x <= p.x + p.rx; x += 6) if (((x - p.x) / (p.rx - 16)) ** 2 + ((y - p.y) / (p.ry - 14)) ** 2 < 1) cand.push([x, y, nearRoad(m, x, y).d]);
    cand.sort((a, b) => a[2] - b[2]);
    const A = cand[0], B = cand.find((c) => Math.abs(c[0] - A[0]) > 62 || Math.abs(c[1] - A[1]) > 62) || cand.slice().sort((u, v) => Math.abs(v[1] - A[1]) - Math.abs(u[1] - A[1]))[0];
    const nr = nearRoad(m, B[0], B[1]);
    SKIN_KEYS.forEach((s, si) => {
      o.save(); o.translate(si * (CW * Z + 12), 0); o.beginPath(); o.rect(0, 0, CW * Z, CHt * Z); o.clip();
      o.scale(Z, Z); o.translate(-(cx - CW / 2), -(cy - CHt / 2));
      o.drawImage(full, 0, 0);
      // the Undertow's whirlpool on the nearest stretch of road
      o.save(); o.translate(nr.x, nr.y); o.scale(1, 0.42);
      for (let i = 0; i < 3; i++) { o.beginPath(); for (let q = 0; q <= 40; q++) { const u = q / 40, a = 1.2 + u * Math.PI * 2.8 + i * 2.1, r = 30 * (1 - u * 0.85); o.lineTo(Math.cos(a) * r, Math.sin(a) * r); } o.strokeStyle = kind === 'lava' ? 'rgba(255,200,120,0.9)' : 'rgba(150,235,255,0.9)'; o.lineWidth = 2.6; o.stroke(); }
      o.restore();
      if (kind === 'ice') for (const [sx, sy] of [A, B]) { // a hole broken in the ice
        o.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = 29 + (i % 2) * 4; o.lineTo(sx + Math.cos(a) * r, sy + 2 + Math.sin(a) * r * 0.48); } o.closePath();
        o.fillStyle = '#1e4448'; o.fill(); o.strokeStyle = '#ffffff'; o.lineWidth = 1.6; o.stroke();
      }
      setSkin(s); initWardArt(() => createCanvas(1, 1), Z);
      const lava = kind === 'lava' ? '_lava' : '';
      const ws = [[('ferry' + lava), A, { ang: Math.atan2(nr.y - A[1], nr.x - A[0]) }], [('undertow' + lava), B, {}]].sort((u, v) => u[1][1] - v[1][1]);
      for (const [t, [x, y], st] of ws) drawWard(o, { type: t, tiers: [4, 0, 0], x, y, id: 1 }, ST(1, { ...st, water: kind }));
      o.restore();
      text(o, SKINS[s].name, si * (CW * Z + 12) + 10, CHt * Z + 20, { size: 13, bold: true, align: 'left', color: LBL });
    });
    text(o, `${data.name}: ${kind === 'lava' ? 'lava pools, with the lava variant (basalt barge, magma spirit)' : kind === 'ice' ? 'frozen lakes: the ward breaks a hole in the ice' : data.theme === 'marsh' ? 'the black lake' : 'ponds'} · Ferrylight Harpooner T4 and Undertow Maelstrom T4, its whirlpool on the nearest road`, 10, CHt * Z + 46, { size: 14, align: 'left', color: SUB });
    save(out, `${OUT}/water-${id}.png`);
  }
}
