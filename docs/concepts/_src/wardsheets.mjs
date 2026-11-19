// Builds the standard set of sheets for one art set (the current game art or a proposed direction).
//   <out>/<ward>.png        one ward: base, then tiers 2 and 4 on each path, zoomed and at real size
//   <out>/roster.png        all wards x those 7 states, zoomed
//   <out>/roster-tests.png  every tier-4 at real size: colour, greyscale, silhouette, blurred (squint)
// `draw(ctx, type, tiers, st)` draws a ward centred on the origin in game pixels (about 40-60 px across).
import { createCanvas, turf, text, greyscale, silhouette, blurred, save, panel } from './sheet.mjs';

// Seeded Math.random so jittery effects (lightning) are the same on every run.
let seed = 7;
Math.random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

export const STATES = [
  { key: 'base', tiers: [0, 0, 0], label: 'Base' },
  { key: 'p1t2', tiers: [2, 0, 0], label: 'Path 1 · T2' },
  { key: 'p1t4', tiers: [4, 0, 0], label: 'Path 1 · T4' },
  { key: 'p2t2', tiers: [0, 2, 0], label: 'Path 2 · T2' },
  { key: 'p2t4', tiers: [0, 4, 0], label: 'Path 2 · T4' },
  { key: 'p3t2', tiers: [0, 0, 2], label: 'Path 3 · T2' },
  { key: 'p3t4', tiers: [0, 0, 4], label: 'Path 3 · T4' },
];

export const ST = { ang: -Math.PI / 4, recoil: 0, time: 1.3, pulse: 0.3, tx: 60, ty: -60, pop: 0 };

const BG = '#0f1420';

function cell(ctx, draw, type, tiers, x, y, size, zoom, seedN) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, size, size); ctx.clip();
  turf(ctx, x, y, size, size, seedN);
  ctx.translate(x + size / 2, y + size / 2);
  ctx.scale(zoom, zoom);
  seed = 7 + seedN;
  draw(ctx, type, tiers, { ...ST });
  ctx.restore();
}

export function wardSheet({ draw, type, name, sub, paths, out, title }) {
  const Z = 3, C = 76 * Z, gap = 14, left = 20, top = 70;
  const W = left * 2 + STATES.length * C + (STATES.length - 1) * gap;
  const H = top + C + 44 + 90 + 40;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, `${name}`, left, 34, { size: 24, bold: true, align: 'left' });
  text(ctx, `${sub}   ·   ${title}`, left, 56, { size: 13, color: '#8fa0b8', align: 'left' });
  STATES.forEach((s, i) => {
    const x = left + i * (C + gap);
    cell(ctx, draw, type, s.tiers, x, top, C, Z, i + 1);
    const pi = s.tiers.findIndex((t) => t > 0);
    text(ctx, s.label, x + C / 2, top + C + 18, { size: 13, bold: true });
    text(ctx, pi < 0 ? '' : paths[pi], x + C / 2, top + C + 35, { size: 11, color: '#8fa0b8' });
    // real size
    cell(ctx, draw, type, s.tiers, x + C / 2 - 40, top + C + 50, 80, 1, i + 1);
  });
  text(ctx, 'top row: 3x zoom · bottom row: actual in-game size', left, H - 14, { size: 11, color: '#6f7f98', align: 'left' });
  save(cv, `${out}/${type}.png`);
}

export function rosterSheet({ draw, wards, out, title }) {
  const Z = 2, C = 76 * Z, gap = 8, left = 170, top = 80;
  const W = left + STATES.length * (C + gap) + 12;
  const H = top + wards.length * (C + gap) + 20;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, title, 16, 32, { size: 22, bold: true, align: 'left' });
  STATES.forEach((s, i) => text(ctx, s.label, left + i * (C + gap) + C / 2, top - 10, { size: 12, bold: true }));
  wards.forEach((w, r) => {
    const y = top + r * (C + gap);
    text(ctx, w.name, 14, y + C / 2, { size: 14, bold: true, align: 'left' });
    text(ctx, w.sub, 14, y + C / 2 + 17, { size: 11, color: '#8fa0b8', align: 'left' });
    STATES.forEach((s, i) => cell(ctx, draw, w.type, s.tiers, left + i * (C + gap), y, C, Z, r * 10 + i));
  });
  save(cv, `${out}/roster.png`);
}

// Real-size tier-4 grid (8 wards x 3 paths, plus base) run through four tests.
export function testSheet({ draw, wards, out, title }) {
  const C = 76, gap = 4;
  const cols = [[0, 0, 0], [4, 0, 0], [0, 4, 0], [0, 0, 4]];
  const gw = cols.length * (C + gap), gh = wards.length * (C + gap);
  const mk = (bgOnly) => {
    const cv = createCanvas(gw, gh), ctx = cv.getContext('2d');
    wards.forEach((w, r) => cols.forEach((t, c) => {
      const x = c * (C + gap), y = r * (C + gap);
      if (bgOnly) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, C, C); ctx.clip(); turf(ctx, x, y, C, C, r * 10 + c); ctx.restore(); }
      else cell(ctx, draw, w.type, t, x, y, C, 1, r * 10 + c);
    }));
    return cv;
  };
  const colour = mk(false), bg = mk(true);
  const grey = greyscale(mk(false));
  const sil = silhouette(mk(false), bg, 110);
  const blur = blurred(mk(false), 2.2);
  const panels = [['Colour (actual size)', colour], ['Greyscale (value read)', grey], ['Silhouette (shape read)', sil], ['Blurred (squint test)', blur]];
  const left = 150, top = 96, pgap = 26;
  const W = left + panels.length * (gw + pgap), H = top + gh + 24;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, title, 16, 32, { size: 22, bold: true, align: 'left' });
  text(ctx, 'columns in each panel: base, Path 1 T4, Path 2 T4, Path 3 T4', 16, 54, { size: 12, color: '#8fa0b8', align: 'left' });
  panels.forEach(([label, img], i) => {
    const x = left + i * (gw + pgap);
    text(ctx, label, x + gw / 2, top - 14, { size: 13, bold: true });
    ctx.drawImage(img, x, top);
  });
  wards.forEach((w, r) => text(ctx, w.name, 14, top + r * (C + gap) + C / 2 + 5, { size: 13, bold: true, align: 'left' }));
  save(cv, `${out}/roster-tests.png`);
}

// Render every sheet for one art set.
export function renderSet({ draw, wards, out, title }) {
  for (const w of wards) wardSheet({ draw, type: w.type, name: w.name, sub: w.sub, paths: w.paths, out, title });
  rosterSheet({ draw, wards, out, title: `${title}: every ward, base / T2 / T4 per path` });
  testSheet({ draw, wards, out, title: `${title}: readability tests at real size` });
}
