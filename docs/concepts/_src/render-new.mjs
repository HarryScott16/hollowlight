// The four recommended new wards in the Lanterns direction, plus the full 12-ward lineup.
//   docs/concepts/lanterns/new-wards.png      each new ward: base, T2 and T4 on every path (2x) + real size
//   docs/concepts/lanterns/lineup-12.png      all 12 wards (8 current + 4 new) at base and T4, real size + greyscale
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createCanvas, turf, text, greyscale, save, panel } from './sheet.mjs';
import { STATES, ST } from './wardsheets.mjs';
import { draw as drawOld } from './dir-lanterns.mjs';
import { draw as drawNew, NEW_SPEC } from './dir-lanterns-new.mjs';
import { WARDS } from './render-directions.mjs';
import { DMG } from './kit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../lanterns');
const BG = '#0f1420';

function cell(draw, type, tiers, size, zoom, seed) {
  const c = createCanvas(size, size), k = c.getContext('2d');
  turf(k, 0, 0, size, size, seed);
  k.translate(size / 2, size / 2); k.scale(zoom, zoom);
  draw(k, type, tiers, { ...ST });
  return c;
}

{
  const types = Object.keys(NEW_SPEC);
  const Z = 2, C = 76 * Z, gap = 8, left = 200, top = 80, rowH = C + 26 + 84;
  const W = left + STATES.length * (C + gap) + 10, H = top + types.length * rowH + 10;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, 'A · Lanterns: the four recommended new wards', 16, 32, { size: 22, bold: true, align: 'left' });
  text(ctx, 'base, then T2 and T4 on each path; real size underneath', 16, 54, { size: 12, color: '#8fa0b8', align: 'left' });
  types.forEach((t, r) => {
    const y = top + r * rowH, sp = NEW_SPEC[t];
    text(ctx, sp.name, 14, y + 60, { size: 15, bold: true, align: 'left' });
    text(ctx, `${sp.family} · ${DMG[sp.dmg].name}`, 14, y + 78, { size: 11, color: '#8fa0b8', align: 'left' });
    STATES.forEach((s, i) => {
      const x = left + i * (C + gap);
      ctx.drawImage(cell(drawNew, t, s.tiers, C, Z, r * 10 + i), x, y);
      const pi = s.tiers.findIndex((v) => v > 0);
      text(ctx, pi < 0 ? 'Base' : `${sp.paths[pi]} T${s.tiers[pi]}`, x + C / 2, y + C + 16, { size: 11, color: '#c9d4e2' });
      ctx.drawImage(cell(drawNew, t, s.tiers, 76, 1, r * 10 + i), x + C / 2 - 38, y + C + 24);
    });
  });
  save(cv, `${OUT}/new-wards.png`);
}

{
  const all = [...WARDS.map((w) => ({ type: w.type, name: w.name, draw: drawOld })), ...Object.entries(NEW_SPEC).map(([type, s]) => ({ type, name: s.name, draw: drawNew, isNew: true }))];
  const C = 76, gap = 4, left = 20, top = 70;
  const rows = [['Base', [0, 0, 0]], ['P1 T4', [4, 0, 0]], ['P2 T4', [0, 4, 0]], ['P3 T4', [0, 0, 4]]];
  const gw = all.length * (C + gap);
  const W = left + 70 + gw + 10, H = top + 2 * (rows.length * (C + gap) + 40) + 10;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, 'A · Lanterns: the 12-ward lineup at real size (new wards on the right), colour then greyscale', 16, 30, { size: 18, bold: true, align: 'left' });
  all.forEach((w, i) => text(ctx, w.name.replace(/ Ward$/, '').replace('Lychgate ', '').replace('Thornlight ', ''), left + 70 + i * (C + gap) + C / 2, top - 8, { size: 10.5, color: w.isNew ? '#ffd166' : '#c9d4e2', bold: !!w.isNew }));
  for (let pass = 0; pass < 2; pass++) {
    const oy = top + pass * (rows.length * (C + gap) + 40);
    rows.forEach(([label, tiers], r) => {
      text(ctx, label, left, oy + r * (C + gap) + C / 2 + 4, { size: 12, align: 'left', color: '#8fa0b8' });
      all.forEach((w, i) => { let c = cell(w.draw, w.type, tiers, C, 1, r * 20 + i); if (pass) c = greyscale(c); ctx.drawImage(c, left + 70 + i * (C + gap), oy + r * (C + gap)); });
    });
  }
  save(cv, `${OUT}/lineup-12.png`);
}
