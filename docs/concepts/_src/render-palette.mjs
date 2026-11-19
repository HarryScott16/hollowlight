// Colour-vision check for the proposed damage palette vs the current colours.
// Simulates protanopia / deuteranopia / tritanopia (Machado et al. 2009, severity 1.0) and reports
// the closest pair in each palette (CIE76 delta E; under ~20 is hard to tell apart at a glance,
// under ~10 is near-identical). Writes docs/concepts/palette-cvd.png and prints a table.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createCanvas, text, save, panel } from './sheet.mjs';
import { DMG, glyph, circle, INK } from './kit.mjs';
import { DAMAGE_TYPES } from '../../../public/js/data/damage.js';
import { PATH_COLORS } from '../../../public/js/data/towers.js';

const here = dirname(fileURLToPath(import.meta.url));
const M = {
  Normal: null,
  Protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  Deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  Tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};
const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const toSrgb = (c) => { c = Math.max(0, Math.min(1, c)); return Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)); };
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
function sim(rgb, m) {
  if (!m) return rgb;
  const l = rgb.map(toLin);
  return m.map((row) => toSrgb(row[0] * l[0] + row[1] * l[1] + row[2] * l[2]));
}
function lab(rgb) {
  const [r, g, b] = rgb.map(toLin);
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, y = r * 0.2126 + g * 0.7152 + b * 0.0722, z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const dE = (a, b) => { const A = lab(a), B = lab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };

const palettes = [
  { title: 'Proposed damage palette (8)', items: Object.entries(DMG).map(([k, d]) => ({ name: d.name.replace(/ \(.*/, ''), hex: d.core, glyph: d.glyph })) },
  { title: 'Current damage colours (6)', items: Object.entries(DAMAGE_TYPES).map(([k, d]) => ({ name: d.name, hex: d.color })) },
  { title: 'Current path colours (3)', items: PATH_COLORS.map((h, i) => ({ name: `Path ${i + 1}`, hex: h })) },
];

const rows = [];
const W = 1240, rowH = 120;
const H = 70 + palettes.length * (Object.keys(M).length * rowH * 0.62 + 50);
const cv = createCanvas(W, Math.ceil(H)), ctx = cv.getContext('2d');
panel(ctx, 0, 0, W, Math.ceil(H), '#0f1420');
text(ctx, 'Colour-vision check: the closest pair in each palette (ΔE; under ~20 is hard to tell apart at a glance)', 16, 30, { size: 17, bold: true, align: 'left' });
let y = 60;
for (const p of palettes) {
  text(ctx, p.title, 16, y + 18, { size: 15, bold: true, align: 'left', color: '#ffd166' });
  y += 30;
  for (const [mode, m] of Object.entries(M)) {
    const cols = p.items.map((it) => sim(hex(it.hex), m));
    let min = Infinity, pair = '';
    for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) { const d = dE(cols[i], cols[j]); if (d < min) { min = d; pair = `${p.items[i].name} / ${p.items[j].name}`; } }
    rows.push(`${p.title} | ${mode} | min ΔE ${min.toFixed(1)} (${pair})`);
    text(ctx, mode, 16, y + 28, { size: 12, color: '#c9d4e2', align: 'left' });
    p.items.forEach((it, i) => {
      const x = 150 + i * 62;
      ctx.fillStyle = '#2f9a74'; ctx.fillRect(x, y, 58, 50);
      const [r, g, b] = cols[i];
      circle(ctx, x + 29, y + 25, 19); ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      if (it.glyph) glyph(ctx, it.glyph, x + 29, y + 25, 17, INK);
    });
    text(ctx, `closest: ${pair}  ΔE ${min.toFixed(1)}`, 150 + p.items.length * 62 + 14, y + 30, { size: 12, color: min < 20 ? '#ff8a8a' : '#9be59b', align: 'left' });
    y += 58;
  }
  y += 16;
}
save(cv, resolve(here, '../palette-cvd.png'));
console.log(rows.join('\n'));
