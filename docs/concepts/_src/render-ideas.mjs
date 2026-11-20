// All 13 new-ward ideas from docs/tower-ideas.md, mocked up in the Kindlings direction (B).
//   docs/concepts/kindlings/ideas/<nn>-<key>.png   one idea: base, T2 and T4 on every path (2x) + real size
//   docs/concepts/kindlings/ideas/overview.png     all 13 at real size: base and T4 per path, colour + greyscale
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createCanvas, turf, text, greyscale, save, panel } from './sheet.mjs';
import { STATES, ST } from './wardsheets.mjs';
import { draw, IDEAS } from './dir-kindlings-ideas.mjs';
import { DMG } from './kit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../kindlings/ideas');
const BG = '#0f1420';
const dmgName = (d) => DMG[d].name.replace(/ \(.*/, '');

function cell(type, tiers, size, zoom, seed) {
  const c = createCanvas(size, size), k = c.getContext('2d');
  turf(k, 0, 0, size, size, seed);
  k.translate(size / 2, size / 2); k.scale(zoom, zoom);
  draw(k, type, tiers, { ...ST });
  return c;
}

for (const [type, sp] of Object.entries(IDEAS)) {
  const Z = 2, C = 76 * Z, gap = 8, left = 16, top = 78;
  const W = left + STATES.length * (C + gap) + 8, H = top + C + 26 + 84;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, `${sp.n}. ${sp.name}${sp.top ? '  ★ top 4' : ''}`, 16, 32, { size: 22, bold: true, align: 'left', color: sp.top ? '#ffd166' : '#e8eef5' });
  text(ctx, `B · Kindlings · ${sp.family} family · ${dmgName(sp.dmg)} · base, then T2 and T4 on each path; real size underneath`, 16, 54, { size: 12, color: '#8fa0b8', align: 'left' });
  STATES.forEach((s, i) => {
    const x = left + i * (C + gap);
    ctx.drawImage(cell(type, s.tiers, C, Z, sp.n * 10 + i), x, top);
    const pi = s.tiers.findIndex((v) => v > 0);
    text(ctx, pi < 0 ? 'Base' : `${sp.paths[pi]} T${s.tiers[pi]}`, x + C / 2, top + C + 16, { size: 11, color: '#c9d4e2' });
    ctx.drawImage(cell(type, s.tiers, 76, 1, sp.n * 10 + i), x + C / 2 - 38, top + C + 24);
  });
  save(cv, `${OUT}/${String(sp.n).padStart(2, '0')}-${type}.png`);
}

{
  const all = Object.entries(IDEAS);
  const C = 76, gap = 4, left = 20, top = 76;
  const rows = [['Base', [0, 0, 0]], ['P1 T4', [4, 0, 0]], ['P2 T4', [0, 4, 0]], ['P3 T4', [0, 0, 4]]];
  const W = left + 70 + all.length * (C + gap) + 10, H = top + 2 * (rows.length * (C + gap) + 40) + 10;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, 'B · Kindlings: all 13 new-ward ideas at real size (★ = recommended top 4), colour then greyscale', 16, 30, { size: 18, bold: true, align: 'left' });
  all.forEach(([, sp], i) => {
    const x = left + 70 + i * (C + gap) + C / 2, words = sp.name.split(' ');
    text(ctx, (sp.top ? '★ ' : '') + words[0], x, top - 22, { size: 10.5, color: sp.top ? '#ffd166' : '#c9d4e2', bold: !!sp.top });
    text(ctx, words.slice(1).join(' '), x, top - 9, { size: 10.5, color: sp.top ? '#ffd166' : '#c9d4e2', bold: !!sp.top });
  });
  for (let pass = 0; pass < 2; pass++) {
    const oy = top + pass * (rows.length * (C + gap) + 40);
    rows.forEach(([label, tiers], r) => {
      text(ctx, label, left, oy + r * (C + gap) + C / 2 + 4, { size: 12, align: 'left', color: '#8fa0b8' });
      all.forEach(([type], i) => { let c = cell(type, tiers, C, 1, r * 20 + i); if (pass) c = greyscale(c); ctx.drawImage(c, left + 70 + i * (C + gap), oy + r * (C + gap)); });
    });
  }
  save(cv, `${OUT}/overview.png`);
}
