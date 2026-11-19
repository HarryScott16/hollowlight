// Shared helpers for the concept sheets: a headless canvas, labels, a turf background, and the
// greyscale / blur passes used for the silhouette and squint tests.
//
// Needs @napi-rs/canvas, which is NOT a game dependency. Install it anywhere outside the game and
// point CANVAS_MODULES at that node_modules folder, e.g.
//   mkdir -p ~/scratch/rnd && cd ~/scratch/rnd && npm i @napi-rs/canvas@0.1.65
//   CANVAS_MODULES=~/scratch/rnd/node_modules FONT_DIR=~/scratch/fonts node docs/concepts/_src/render-current.mjs
// FONT_DIR must hold DejaVuSans.ttf and DejaVuSans-Bold.ttf (any TTF works if you rename it).
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const req = createRequire(process.env.CANVAS_MODULES ? join(process.env.CANVAS_MODULES, 'x.js') : import.meta.url);
const { createCanvas, GlobalFonts } = req('@napi-rs/canvas');

if (process.env.FONT_DIR) {
  GlobalFonts.registerFromPath(join(process.env.FONT_DIR, 'DejaVuSans.ttf'), 'Sans');
  GlobalFonts.registerFromPath(join(process.env.FONT_DIR, 'DejaVuSans-Bold.ttf'), 'SansBold');
}

export { createCanvas };
export const TAU = Math.PI * 2;

// The real map turf (render/background.js): #46b384 centre, #2f9a74 mid, #1f6f63 edge.
export function turf(ctx, x, y, w, h, seed = 1) {
  ctx.save();
  ctx.fillStyle = '#2f9a74';
  ctx.fillRect(x, y, w, h);
  let s = seed * 9973;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < (w * h) / 2500; i++) {
    const px = x + rand() * w, py = y + rand() * h, r = 8 + rand() * 26;
    ctx.fillStyle = rand() < 0.55 ? 'rgba(120,220,140,0.13)' : 'rgba(10,70,60,0.13)';
    ctx.beginPath(); ctx.ellipse(px, py, r, r * 0.7, rand() * 3, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

export function text(ctx, str, x, y, { size = 13, color = '#e8eef5', bold = false, align = 'center', base = 'alphabetic' } = {}) {
  ctx.save();
  ctx.font = `${size}px ${bold ? 'SansBold' : 'Sans'}`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  ctx.fillText(str, x, y);
  ctx.restore();
}

// Wrap text to a width; returns the y after the last line.
export function para(ctx, str, x, y, width, { size = 12, color = '#c9d4e2', lh = 1.35, align = 'left', bold = false } = {}) {
  ctx.save();
  ctx.font = `${size}px ${bold ? 'SansBold' : 'Sans'}`;
  ctx.fillStyle = color; ctx.textAlign = align;
  const words = str.split(' ');
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > width && line) { ctx.fillText(line, x, y); y += size * lh; line = w; }
    else line = t;
  }
  if (line) { ctx.fillText(line, x, y); y += size * lh; }
  ctx.restore();
  return y;
}

export function greyscale(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Pure silhouette: every pixel that differs from the turf behind it becomes ink.
export function silhouette(canvas, bgCanvas, threshold = 40) {
  const ctx = canvas.getContext('2d');
  const a = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const b = bgCanvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < a.data.length; i += 4) {
    const diff = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    const v = diff > threshold ? 20 : 235;
    a.data[i] = a.data[i + 1] = a.data[i + 2] = v; a.data[i + 3] = 255;
  }
  ctx.putImageData(a, 0, 0);
  return canvas;
}

export function blurred(canvas, px) {
  const out = createCanvas(canvas.width, canvas.height);
  const ctx = out.getContext('2d');
  ctx.filter = `blur(${px}px)`;
  ctx.drawImage(canvas, 0, 0);
  return out;
}

export function save(canvas, path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, canvas.toBuffer('image/png'));
  console.log('wrote', path);
}

export function panel(ctx, x, y, w, h, fill = '#141a2a') {
  ctx.save(); ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); ctx.restore();
}
