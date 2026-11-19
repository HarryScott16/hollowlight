// Renders the game's CURRENT ward art (public/js/render/towerArt.js, unmodified) into docs/concepts/current/.
// Also writes blend-pairs.png: the specific pairs that read as the same ward at high tiers.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderSet, ST } from './wardsheets.mjs';
import { createCanvas, turf, text, greyscale, save, panel } from './sheet.mjs';
import { drawTower } from '../../../public/js/render/towerArt.js';
import { TOWERS, TOWER_ORDER } from '../../../public/js/data/towers.js';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../current');

export const WARDS = TOWER_ORDER.map((type) => ({
  type, name: TOWERS[type].name, sub: TOWERS[type].role, paths: TOWERS[type].paths.map((p) => p.name),
}));

renderSet({ draw: drawTower, wards: WARDS, out, title: 'Current art' });

// Blend pairs: the groups the brief calls out, side by side at 2x and at real size, in colour and grey.
const groups = [
  { label: 'High-tier Rime, Ember Censer and Prism', items: [['rime', [0, 4, 0]], ['rime', [4, 0, 0]], ['censer', [4, 0, 0]], ['censer', [0, 0, 4]], ['prism', [0, 4, 0]], ['prism', [0, 0, 4]], ['coil', [0, 0, 4]]] },
  { label: 'Longeye and Mortar Kiln', items: [['longeye', [0, 4, 0]], ['mortar', [0, 4, 0]], ['longeye', [4, 0, 0]], ['mortar', [4, 0, 0]], ['longeye', [0, 0, 0]], ['mortar', [0, 0, 0]], ['bolt', [4, 0, 0]]] },
  { label: 'Glowing suns and stars (three different wards)', items: [['coil', [4, 0, 0]], ['prism', [4, 0, 0]], ['censer', [4, 0, 0]], ['beacon', [0, 4, 0]], ['rime', [4, 0, 0]], ['mortar', [0, 0, 4]], ['beacon', [4, 0, 0]]] },
];
const Z = 2, C = 128, gap = 10, left = 20;
const rowH = C + 40 + 84 + 20;
const W = left * 2 + 7 * (C + gap), H = 60 + groups.length * (rowH + 40);
const cv = createCanvas(W, H), ctx = cv.getContext('2d');
panel(ctx, 0, 0, W, H, '#0f1420');
text(ctx, 'Current art: wards that blend together', left, 36, { size: 22, bold: true, align: 'left' });
groups.forEach((g, gi) => {
  const y0 = 60 + gi * (rowH + 40);
  text(ctx, g.label, left, y0 + 22, { size: 15, bold: true, align: 'left', color: '#ffd166' });
  g.items.forEach(([type, tiers], i) => {
    const x = left + i * (C + gap), y = y0 + 32;
    for (const [yy, size, zoom, grey] of [[y, C, Z, false], [y + C + 30, 72, 1, false]]) {
      const cx = x + (C - size) / 2;
      const c2 = createCanvas(size, size), k = c2.getContext('2d');
      turf(k, 0, 0, size, size, gi * 10 + i);
      k.translate(size / 2, size / 2); k.scale(zoom, zoom);
      drawTower(k, type, tiers, { ...ST });
      ctx.drawImage(grey ? greyscale(c2) : c2, cx, yy);
    }
    const pi = tiers.findIndex((t) => t > 0);
    text(ctx, TOWERS[type].name, x + C / 2, y + C + 13, { size: 10.5, color: '#c9d4e2', bold: true });
    text(ctx, pi < 0 ? 'base' : TOWERS[type].paths[pi].tiers[tiers[pi] - 1].name, x + C / 2, y + C + 24, { size: 10, color: '#8fa0b8' });
  });
});
save(cv, `${out}/blend-pairs.png`);

// The blend metric for the current art (quoted in the diagnosis).
import { blendMetrics } from './metrics.mjs';
const m = blendMetrics(drawTower, WARDS);
console.log(`current: nearest-neighbour same-ward ${m.hits}/${m.n} (${Math.round(m.nnAccuracy * 100)}%), ward/path distance ratio ${m.ratio.toFixed(2)}`);
