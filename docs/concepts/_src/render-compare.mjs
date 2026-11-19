// Cross-direction sheets in docs/concepts/:
//   comparison.png           current art vs the three directions (base + T4 on each path), 1.25x
//   comparison-realsize.png  the same at real size, in colour and in greyscale
//   system-sheet.png         damage palette + glyphs, and the role-family silhouette primitives
//   <dir>/tier-ladder.png    T0-T4 on every path plus two crosspaths, for each direction
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createCanvas, turf, text, greyscale, save, panel } from './sheet.mjs';
import { ST } from './wardsheets.mjs';
import { WARDS, DIRECTIONS } from './render-directions.mjs';
import { drawTower } from '../../../public/js/render/towerArt.js';
import { DMG, INK, TAU, glyph, poly, circle, rrect } from './kit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '..');
const BG = '#0f1420';

const sets = [{ key: 'current', title: 'Current', draw: drawTower }];
for (const [key, d] of Object.entries(DIRECTIONS)) sets.push({ key, title: d.title, draw: (await import(d.file)).draw });

function cellCanvas(draw, type, tiers, size, zoom, seed) {
  const c = createCanvas(size, size), k = c.getContext('2d');
  turf(k, 0, 0, size, size, seed);
  k.translate(size / 2, size / 2); k.scale(zoom, zoom);
  draw(k, type, tiers, { ...ST });
  return c;
}

const COLS = [[0, 0, 0, 'Base'], [4, 0, 0, 'P1 T4'], [0, 4, 0, 'P2 T4'], [0, 0, 4, 'P3 T4']];

function comparison(zoom, file, grey) {
  const C = Math.round(76 * zoom), gap = 3, ggap = 22, left = 150, top = 92;
  const gw = COLS.length * (C + gap);
  const rows = grey ? 2 : 1;
  const H = top + rows * WARDS.length * (C + gap) + (rows - 1) * 40 + 20;
  const W = left + sets.length * (gw + ggap);
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, grey ? 'Comparison at real size: colour, then greyscale' : 'Comparison: current art vs the three directions', 16, 32, { size: 22, bold: true, align: 'left' });
  text(ctx, 'each group: base, then tier 4 on path 1 / 2 / 3', 16, 54, { size: 12, color: '#8fa0b8', align: 'left' });
  sets.forEach((s, gi) => {
    const gx = left + gi * (gw + ggap);
    text(ctx, s.title, gx + gw / 2, top - 22, { size: 15, bold: true, color: gi ? '#ffd166' : '#ff8a8a' });
    COLS.forEach((c, ci) => text(ctx, c[3], gx + ci * (C + gap) + C / 2, top - 6, { size: 10, color: '#8fa0b8' }));
    for (let pass = 0; pass < rows; pass++) {
      const oy = top + pass * (WARDS.length * (C + gap) + 40);
      WARDS.forEach((w, r) => COLS.forEach((c, ci) => {
        let img = cellCanvas(s.draw, w.type, c.slice(0, 3), C, zoom, r * 10 + ci);
        if (pass === 1) img = greyscale(img);
        ctx.drawImage(img, gx + ci * (C + gap), oy + r * (C + gap));
      }));
    }
  });
  for (let pass = 0; pass < rows; pass++) {
    const oy = top + pass * (WARDS.length * (C + gap) + 40);
    WARDS.forEach((w, r) => text(ctx, w.name, 14, oy + r * (C + gap) + C / 2 + 5, { size: 13, bold: true, align: 'left' }));
  }
  save(cv, `${OUT}/${file}`);
}
comparison(1.25, 'comparison.png', false);
comparison(1, 'comparison-realsize.png', true);

// ---- tier ladders ----------------------------------------------------------------------------
const LADDER = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0], [0, 4, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [4, 2, 0], [0, 2, 4]];
const LAB = ['Base', '1-0-0', '2-0-0', '3-0-0', '4-0-0', '0-1-0', '0-2-0', '0-3-0', '0-4-0', '0-0-1', '0-0-2', '0-0-3', '0-0-4', '4-2-0', '0-2-4'];
for (const s of sets.slice(1)) {
  const C = 76, gap = 3, left = 150, top = 70;
  const W = left + LADDER.length * (C + gap) + 10, H = top + WARDS.length * (C + gap) + 20;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, `${s.title}: tier ladder at real size (every tier on every path, plus crosspaths)`, 16, 30, { size: 18, bold: true, align: 'left' });
  LAB.forEach((l, i) => text(ctx, l, left + i * (C + gap) + C / 2, top - 8, { size: 11, color: '#8fa0b8' }));
  WARDS.forEach((w, r) => {
    text(ctx, w.name, 14, top + r * (C + gap) + C / 2 + 5, { size: 13, bold: true, align: 'left' });
    LADDER.forEach((t, i) => ctx.drawImage(cellCanvas(s.draw, w.type, t, C, 1, r * 10 + i), left + i * (C + gap), top + r * (C + gap)));
  });
  save(cv, `${OUT}/${s.key}/tier-ladder.png`);
}

// ---- system sheet: palette + family primitives ----------------------------------------------
{
  const W = 1340, H = 740;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, 'Design system: one hue + glyph per damage type, one silhouette per role family', 20, 34, { size: 20, bold: true, align: 'left' });
  // palette
  const keys = Object.keys(DMG);
  keys.forEach((k, i) => {
    const x = 100 + i * 152, y = 110;
    const g = createCanvas(140, 120), c = g.getContext('2d');
    turf(c, 0, 0, 140, 120, i);
    c.translate(70, 50);
    circle(c, 0, 0, 26); c.fillStyle = DMG[k].core; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    glyph(c, DMG[k].glyph, 0, 0, 24, DMG[k].glow ? DMG[k].deep : INK);
    ctx.drawImage(g, x - 70, y - 50);
    text(ctx, DMG[k].name.replace(/ \(.*/, ''), x, y + 88, { size: 13, bold: true });
    text(ctx, (DMG[k].name.match(/\((.*)\)/) || [, DMG[k].glow ? 'glows' : 'unlit metal'])[1], x, y + 104, { size: 11, color: '#8fa0b8' });
    text(ctx, DMG[k].core, x, y + 119, { size: 11, color: '#6f7f98' });
  });
  // families
  const FAM = [
    ['Shooter', 'single target', 'medium upright + weapon on top', (c) => { rrect(c, -9, -16, 18, 30, 2); c.fill(); poly(c, [[-11, -16], [11, -16], [0, -26]]); c.fill(); rrect(c, -3, -36, 22, 5, 2); c.fill(); }],
    ['Lobber', 'splash', 'wide, squat, open mouth up', (c) => { c.beginPath(); c.ellipse(0, 4, 20, 12, 0, 0, TAU); c.fill(); poly(c, [[-8, -4], [8, -4], [10, -18], [-10, -18]]); c.fill(); }],
    ['Pulser', 'area / slow', 'round dome or globe', (c) => { circle(c, 0, -8, 17); c.fill(); rrect(c, -4, 6, 8, 8, 1); c.fill(); }],
    ['Arcer', 'chain / bounce', 'fork: two+ prongs', (c) => { rrect(c, -14, 0, 28, 14, 2); c.fill(); for (const x of [-12, 12]) { poly(c, [[x - 3.5, 2], [x + 3.5, 2], [x, -28]]); c.fill(); } }],
    ['Spotter', 'sniper / map-wide', 'tallest, thin needle', (c) => { poly(c, [[-6, 14], [6, 14], [2, -34], [-2, -34]]); c.fill(); rrect(c, -7, -40, 14, 9, 3); c.fill(); }],
    ['Sprayer', 'cone / stream', 'asymmetric, leans to a spout', (c) => { rrect(c, -16, -24, 5, 38, 1); c.fill(); rrect(c, -16, -26, 22, 5, 1); c.fill(); circle(c, 2, -6, 11); c.fill(); poly(c, [[10, -10], [24, -12], [24, -2], [10, -2]]); c.fill(); }],
    ['Focuser', 'beam / ramp', 'floating diamond', (c) => { poly(c, [[0, -34], [12, -14], [0, 0], [-12, -14]]); c.fill(); rrect(c, -8, 6, 16, 8, 1); c.fill(); }],
    ['Emitter', 'support aura', 'post + banner', (c) => { rrect(c, -3, -30, 6, 44, 1); c.fill(); poly(c, [[3, -26], [22, -22], [16, -16], [22, -10], [3, -8]]); c.fill(); circle(c, 0, -34, 6); c.fill(); }],
    ['Hoard', 'economy (future)', 'chest / hive: boxy, lidded', (c) => { rrect(c, -16, -10, 32, 24, 3); c.fill(); c.beginPath(); c.ellipse(0, -10, 16, 9, 0, Math.PI, TAU); c.fill(); }],
    ['Snare', 'trap (future)', 'flat on the ground, no height', (c) => { c.beginPath(); c.ellipse(0, 6, 22, 8, 0, 0, TAU); c.fill(); for (let i = -3; i <= 3; i++) { poly(c, [[i * 6 - 2.5, 4], [i * 6 + 2.5, 4], [i * 6, -4]]); c.fill(); } }],
    ['Garrison', 'blocker (future)', 'arch or gate', (c) => { c.beginPath(); c.moveTo(-18, 14); c.lineTo(-18, -12); c.arc(0, -12, 18, Math.PI, 0); c.lineTo(18, 14); c.lineTo(9, 14); c.lineTo(9, -10); c.arc(0, -10, 9, 0, Math.PI, true); c.lineTo(-9, 14); c.closePath(); c.fill(); }],
    ['Hanger', 'push (future)', 'hangs from a frame: bell, top-heavy', (c) => { rrect(c, -18, -30, 4, 44, 1); c.fill(); rrect(c, 14, -30, 4, 44, 1); c.fill(); rrect(c, -20, -34, 40, 6, 1); c.fill(); c.beginPath(); c.moveTo(-4, -26); c.quadraticCurveTo(-7, -10, -12, 2); c.lineTo(12, 2); c.quadraticCurveTo(7, -10, 4, -26); c.closePath(); c.fill(); }],
    ['Frame', 'modifier (future)', 'upright ring or disc on a stand', (c) => { c.beginPath(); c.arc(0, -16, 16, 0, TAU); c.arc(0, -16, 9, 0, TAU, true); c.fill(); rrect(c, -2.5, 0, 5, 10, 1); c.fill(); rrect(c, -10, 10, 20, 4, 1); c.fill(); }],
  ];
  text(ctx, 'Role families: silhouette primitives (filled black: if two families look alike here, they will look alike in play)', 20, 290, { size: 14, bold: true, align: 'left', color: '#ffd166' });
  FAM.forEach(([name, role, rule, fn], i) => {
    const col = i % 6, row = Math.floor(i / 6);
    const x = 30 + col * 218, y = 310 + row * 140;
    const g = createCanvas(100, 100), c = g.getContext('2d');
    c.fillStyle = '#e8e2d6'; c.fillRect(0, 0, 100, 100); c.translate(50, 58); c.fillStyle = '#16121f'; fn(c);
    ctx.drawImage(g, x, y);
    text(ctx, name, x + 110, y + 24, { size: 15, bold: true, align: 'left' });
    text(ctx, role, x + 110, y + 42, { size: 11, color: '#8fa0b8', align: 'left' });
    const words = rule.split(' '); let line = '', ly = y + 62;
    for (const wd of words) { if ((line + ' ' + wd).length > 15) { text(ctx, line.trim(), x + 110, ly, { size: 11, color: '#c9d4e2', align: 'left' }); ly += 14; line = wd; } else line += ' ' + wd; }
    text(ctx, line.trim(), x + 110, ly, { size: 11, color: '#c9d4e2', align: 'left' });
  });
  save(cv, `${OUT}/system-sheet.png`);
}
