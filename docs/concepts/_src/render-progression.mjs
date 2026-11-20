// The proposed upgrade progression for the Bolt Ward, in both skins (docs/upgrade-visuals-research.md).
//   docs/concepts/progression/bolt-<skin>.png   paths as rows, tiers 0-4 as columns (2x), real size under each,
//                                               and the three tier 4 silhouettes side by side
//   docs/concepts/progression/bolt-both.png     both skins at real size, for comparison
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createCanvas, turf, text, save, panel } from './sheet.mjs';
import { setCanvasFactory } from '../../../public/js/render/wards/kit.js';
import { TOWERS } from '../../../public/js/data/towers.js';
import { draw } from './dir-bolt-progression.mjs';

setCanvasFactory(() => createCanvas(1, 1));
const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../progression');
const BG = '#0f1420', SUB = '#8fa0b8';
const paths = TOWERS.bolt.paths;
const tiersFor = (p, n) => { const t = [0, 0, 0]; t[p] = n; return t; };
const ST = (i) => ({ ang: -0.35, recoil: 0, time: 1.1 + i * 0.37, pulse: 0, fire: 0, id: i });
const SKIN_TITLE = { kindlings: 'B · Kindlings (active skin)', lanterns: 'A · Lanterns' };

function cell(skin, tiers, w, h, z, seed, i) {
  const c = createCanvas(w, h), k = c.getContext('2d');
  turf(k, 0, 0, w, h, seed);
  k.translate(w / 2, h * 0.8); k.scale(z, z);
  draw(k, skin, tiers, ST(i));
  return c;
}
// Black silhouette of a ward on a clear background (for the divergence check).
function sil(skin, tiers, w, h, z, i) {
  const c = createCanvas(w, h), k = c.getContext('2d');
  k.translate(w / 2, h * 0.78); k.scale(z, z); draw(k, skin, tiers, ST(i));
  const img = k.getImageData(0, 0, w, h), px = img.data;
  for (let j = 0; j < px.length; j += 4) { const a = px[j + 3] > 70 ? 255 : 0; px[j] = px[j + 1] = px[j + 2] = 20; px[j + 3] = a; }
  k.putImageData(img, 0, 0);
  const o = createCanvas(w, h), ok = o.getContext('2d'); ok.fillStyle = '#e8eef5'; ok.fillRect(0, 0, w, h); ok.drawImage(c, 0, 0);
  return o;
}

for (const skin of ['kindlings', 'lanterns']) {
  const Z = 2.6, CW = 88 * Z, CH = 84 * Z, gap = 8, left = 190, top = 96, real = 100;
  const rowH = CH + 22 + real + 14;
  const W = left + 5 * (CW + gap) + 10, H = top + 3 * rowH + 64 + CH * 0.62 + 40;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, `Bolt Ward upgrade progression · ${SKIN_TITLE[skin]}`, 16, 34, { size: 22, bold: true, align: 'left' });
  text(ctx, 'Rows: the three paths. Columns: tiers 0-4. Each tier adds visibly; tier 2 starts the split, tier 3 transforms, tier 4 is the capstone form. Real size underneath.', 16, 58, { size: 12, color: SUB, align: 'left' });
  ['Tier 0', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'].forEach((s, i) => text(ctx, s, left + i * (CW + gap) + CW / 2, top - 10, { size: 13, bold: true, color: i >= 3 ? '#ffd166' : '#c9d4e2' }));
  paths.forEach((path, p) => {
    const y = top + p * rowH;
    text(ctx, `${['Might', 'Many', 'Craft'][p]} path`, 14, y + 40, { size: 11, color: SUB, align: 'left' });
    text(ctx, path.name, 14, y + 60, { size: 17, bold: true, align: 'left' });
    for (let n = 0; n <= 4; n++) {
      const x = left + n * (CW + gap), tiers = tiersFor(p, n);
      ctx.drawImage(cell(skin, tiers, CW, CH, Z, p * 7 + n, p * 5 + n), x, y);
      text(ctx, n ? path.tiers[n - 1].name : 'Base', x + CW / 2, y + CH + 16, { size: 12, color: n >= 3 ? '#ffd166' : '#c9d4e2', bold: n >= 3 });
      ctx.drawImage(cell(skin, tiers, real, real, 1, p * 7 + n + 50, p * 5 + n), x + CW / 2 - real / 2, y + CH + 24);
    }
  });
  // the three tier 4 forms as silhouettes: they should read as three different shapes
  const sy = top + 3 * rowH + 30;
  text(ctx, 'Tier 4 silhouettes (one per path) next to tier 0: same ward, three clearly different forms', 16, sy - 8, { size: 14, bold: true, align: 'left' });
  const SW = Math.round(CW * 0.62);
  [[0, 0, 0], tiersFor(0, 4), tiersFor(1, 4), tiersFor(2, 4)].forEach((t, i) => ctx.drawImage(sil(skin, t, SW, SW, Z * 0.62, i), left + i * (SW + gap), sy));
  save(cv, `${OUT}/bolt-${skin}.png`);
}

// both skins side by side at real size
{
  const C = 92, gap = 4, left = 150, top = 70;
  const W = left + 2 * (5 * (C + gap)) + 40, H = top + 3 * (C + gap) + 20;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, 'Bolt Ward progression at real size: Kindlings (left) and Lanterns (right), tiers 0-4', 16, 30, { size: 18, bold: true, align: 'left' });
  ['kindlings', 'lanterns'].forEach((skin, s) => {
    const ox = left + s * (5 * (C + gap) + 30);
    for (let n = 0; n <= 4; n++) text(ctx, `T${n}`, ox + n * (C + gap) + C / 2, top - 8, { size: 12, color: SUB });
    paths.forEach((path, p) => {
      if (!s) text(ctx, path.name, 14, top + p * (C + gap) + C / 2 + 4, { size: 13, bold: true, align: 'left' });
      for (let n = 0; n <= 4; n++) ctx.drawImage(cell(skin, tiersFor(p, n), C, C, 1, p * 9 + n + s, p * 5 + n), ox + n * (C + gap), top + p * (C + gap));
    });
  });
  save(cv, `${OUT}/bolt-both.png`);
}
