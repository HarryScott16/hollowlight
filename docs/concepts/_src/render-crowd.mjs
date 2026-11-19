// Crowd / occlusion test for the upright view (the main risk of switching from top-down).
// Wards are packed at the game's real minimum spacing (RULES.towerSpacing = 38 px between centres,
// and >= 38 px from the path centre) in two rows each side of a straight path, late-game tiers,
// with real enemy art walking the path. Everything is depth-sorted by footprint y.
// Reports (a) each direction's tallest drawn height above the footprint and (b) the share of enemy
// pixels hidden behind wards. Writes docs/concepts/crowd-test.png.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createCanvas, text, save, panel } from './sheet.mjs';
import { ST } from './wardsheets.mjs';
import { DIRECTIONS, WARDS } from './render-directions.mjs';
import { drawTower } from '../../../public/js/render/towerArt.js';
import { drawEnemy } from '../../../public/js/render/enemyArt.js';
import { ENEMIES } from '../../../public/js/data/enemies.js';
import { RULES } from '../../../public/js/data/rules.js';
import { MAP } from '../../../public/js/data/map.js';

const here = dirname(fileURLToPath(import.meta.url));
// Upright concepts put their ground contact (plinth centre) at y = +22 in draw space.
const FOOT = 22;
const sets = [{ key: 'current', title: 'Current (top-down)', draw: drawTower, foot: 0 }];
for (const [key, d] of Object.entries(DIRECTIONS)) sets.push({ key, title: d.title, draw: (await import(d.file)).draw, foot: FOOT });
// The Lanterns again with the proposed height cap applied (whole ward scaled 0.75 about its footprint).
{ const base = sets.find((s) => s.key === 'lanterns').draw;
  sets.push({ key: 'lanternsCapped', title: 'A · Lanterns, height-capped (x0.75)', foot: FOOT, draw: (ctx, type, tiers, st) => { ctx.save(); ctx.translate(0, FOOT); ctx.scale(0.75, 0.75); ctx.translate(0, -FOOT); base(ctx, type, tiers, st); ctx.restore(); } }); }

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---- (a) drawn height above the footprint, per direction ---------------------------------------
function bbox(draw, type, tiers, foot) {
  const S = 160, c = createCanvas(S, S), k = c.getContext('2d');
  k.translate(S / 2, S / 2 - foot);
  draw(k, type, tiers, { ...ST, tx: null, ty: null });
  const d = k.getImageData(0, 0, S, S).data;
  let top = S, bottom = 0, left = S, right = 0;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (d[(y * S + x) * 4 + 3] > 200) { top = Math.min(top, y); bottom = Math.max(bottom, y); left = Math.min(left, x); right = Math.max(right, x); }
  return { above: S / 2 - top, width: right - left };
}
const heights = {};
for (const s of sets) {
  let maxA = 0, maxAt = '', sumBase = 0, sumT4 = 0;
  for (const w of WARDS) {
    const b0 = bbox(s.draw, w.type, [0, 0, 0], s.foot); sumBase += b0.above;
    for (const t of [[4, 0, 0], [0, 4, 0], [0, 0, 4]]) { const b = bbox(s.draw, w.type, t, s.foot); sumT4 += b.above; if (b.above > maxA) { maxA = b.above; maxAt = `${w.type} ${t.join('-')}`; } }
  }
  heights[s.key] = { base: sumBase / WARDS.length, t4: sumT4 / (WARDS.length * 3), max: maxA, maxAt };
}

// ---- (b) the crowd scene ----------------------------------------------------------------------
const W = 460, H = 300, PY = 150, PW = MAP.pathWidth, sp = RULES.towerSpacing;
const rows = [PY - 2 * sp, PY - sp, PY + sp, PY + 2 * sp];
const placements = [];
for (const y of rows) for (let x = 30 + (y > PY ? sp / 2 : 0); x < W - 20; x += sp) {
  const w = WARDS[Math.floor(rnd() * WARDS.length)].type;
  const p = Math.floor(rnd() * 3), t = [0, 0, 0]; t[p] = rnd() < 0.6 ? 4 : 2;
  const q = (p + 1 + Math.floor(rnd() * 2)) % 3; if (rnd() < 0.5) t[q] = 2;
  placements.push({ x, y, type: w, tiers: t });
}
const enemyTypes = ['shambler', 'husk', 'brood', 'skitter', 'aegis', 'dreadhulk', 'herald', 'mender', 'shambler', 'husk', 'skitter', 'brood'];
const enemies = enemyTypes.map((type, i) => {
  const def = ENEMIES[type];
  return { type, def, x: 24 + i * 37, y: PY + (rnd() - 0.5) * 16, r: def.r, ang: 0, wob: i, hitT: 0, veiled: false, revealT: 0, hp: def.hp, maxHp: def.hp, shield: 0, maxShield: 1, hasteT: 0, freezeT: 0 };
});

function ground(ctx) {
  ctx.fillStyle = '#2f9a74'; ctx.fillRect(0, 0, W, H);
  ctx.lineCap = 'butt';
  for (const [w, c] of [[PW + 14, 'rgba(10,50,40,0.35)'], [PW + 4, '#7a4e34'], [PW - 2, '#d9b47a'], [PW - 16, '#ecd0a0']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(0, PY); ctx.lineTo(W, PY); ctx.stroke(); }
}
function scene(s, { withEnemies = true, withWards = true, enemyMask = false } = {}) {
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  if (!enemyMask) ground(ctx);
  const items = [];
  if (withWards) for (const p of placements) items.push({ y: p.y + (s.foot ? 0 : 0), kind: 'ward', p });
  if (withEnemies) for (const e of enemies) items.push({ y: e.y, kind: 'enemy', e });
  if (s.foot) items.sort((a, b) => a.y - b.y); // upright: depth sort by footprint y
  else items.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'enemy' ? -1 : 1) || a.y - b.y); // top-down: game draws towers above enemies? keep enemies under
  for (const it of items) {
    ctx.save();
    if (it.kind === 'enemy') {
      if (enemyMask) { ctx.fillStyle = '#ff00ff'; ctx.beginPath(); ctx.arc(it.e.x, it.e.y, it.e.r, 0, Math.PI * 2); ctx.fill(); }
      else drawEnemy(ctx, it.e, true);
    } else {
      ctx.translate(it.p.x, it.p.y - s.foot);
      if (enemyMask) { ctx.globalCompositeOperation = 'destination-out'; s.draw(opaqueOnly(ctx), it.p.type, it.p.tiers, { ...ST, tx: null, ty: null }); }
      else s.draw(ctx, it.p.type, it.p.tiers, { ...ST, tx: null, ty: null });
    }
    ctx.restore();
  }
  return c;
}
// In the mask pass, opaque drawing erases enemy pixels, and additive ('lighter') drawing is skipped:
// a glow brightens what is under it rather than hiding it.
function opaqueOnly(ctx) {
  let skip = false; const stack = [];
  const DRAW = new Set(['fill', 'stroke', 'fillRect', 'strokeRect', 'drawImage', 'fillText']);
  return new Proxy(ctx, {
    get(t, p) {
      if (p === 'globalCompositeOperation') return skip ? 'lighter' : 'source-over';
      if (p === 'save') return () => { stack.push(skip); t.save(); };
      if (p === 'restore') return () => { skip = stack.pop() ?? false; t.restore(); };
      const v = t[p];
      if (typeof v === 'function') return DRAW.has(p) ? (...a) => { if (!skip) v.apply(t, a); } : v.bind(t);
      return v;
    },
    set(t, p, v) { if (p === 'globalCompositeOperation') { skip = v === 'lighter'; t[p] = 'destination-out'; return true; } t[p] = v; return true; },
  });
}
// ID pass: every ward is drawn opaque in its own flat colour (additive glows skipped), so we can
// count how much of each ward survives in the full scene vs drawn alone.
function idOnly(ctx, color) {
  let skip = false; const stack = [];
  const DRAW = new Set(['fill', 'stroke', 'fillRect', 'strokeRect', 'drawImage', 'fillText']);
  return new Proxy(ctx, {
    get(t, p) {
      if (p === 'globalCompositeOperation') return skip ? 'lighter' : 'source-over';
      if (p === 'save') return () => { stack.push(skip); t.save(); };
      if (p === 'restore') return () => { skip = stack.pop() ?? false; t.restore(); };
      const v = t[p];
      if (typeof v === 'function') return DRAW.has(p) ? (...a) => { if (!skip) { t.fillStyle = color; t.strokeStyle = color; t.globalAlpha = 1; v.apply(t, a); } } : v.bind(t);
      return v;
    },
    set(t, p, v) { if (p === 'globalCompositeOperation') { skip = v === 'lighter'; return true; } if (p === 'fillStyle' || p === 'strokeStyle' || p === 'globalAlpha') return true; t[p] = v; return true; },
  });
}
function wardOcclusion(s) {
  const idc = (i) => `rgb(${(i * 37) % 256},${(i * 91 + 40) % 256},${200 + (i % 50)})`;
  const order = placements.map((p, i) => ({ p, i })).sort((a, b) => a.p.y - b.p.y);
  const count = (c, i) => { const d = c.getContext('2d').getImageData(0, 0, W, H).data; const [r, g, b] = idc(i).match(/\d+/g).map(Number); let n = 0; for (let k = 0; k < d.length; k += 4) if (d[k] === r && d[k + 1] === g && d[k + 2] === b) n++; return n; };
  const draw1 = (ctx, it) => { ctx.save(); ctx.translate(it.p.x, it.p.y - s.foot); ctx.imageSmoothingEnabled = false; s.draw(idOnly(ctx, idc(it.i)), it.p.type, it.p.tiers, { ...ST, tx: null, ty: null }); ctx.restore(); };
  const full = createCanvas(W, H), fctx = full.getContext('2d'); fctx.antialias = 'none';
  for (const it of order) draw1(fctx, it);
  let sum = 0, worst = 0;
  for (const it of order) {
    const solo = createCanvas(W, H), sctx = solo.getContext('2d'); draw1(sctx, it);
    const a = count(solo, it.i), v = count(full, it.i);
    const hid = a ? 1 - v / a : 0; sum += hid; worst = Math.max(worst, hid);
  }
  return { avg: sum / order.length, worst };
}
function maskCount(c) { const d = c.getContext('2d').getImageData(0, 0, W, H).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 60 && d[i + 2] > 200 && d[i + 3] > 200) n++; return n; }

const results = {};
const Z = 1.5, gap = 24, left = 16, top = 70;
const out = createCanvas(left * 2 + 2 * (W * Z) + gap, top + Math.ceil(sets.length / 2) * (H * Z + 60) + 10), octx = out.getContext('2d');
panel(octx, 0, 0, out.width, out.height, '#0f1420');
text(octx, `Crowd test: wards at the minimum spacing (${sp} px) on both sides of a path, late-game tiers, real enemy art`, 16, 30, { size: 17, bold: true, align: 'left' });
text(octx, 'upright directions are depth-sorted by footprint; % = share of enemy pixels hidden behind wards', 16, 52, { size: 12, color: '#8fa0b8', align: 'left' });
sets.forEach((s, i) => {
  // the game draws towers in a layer above enemies today, so for "current" a tower hides what's under it
  const all = maskCount(scene(s, { withWards: false, enemyMask: true }));
  const vis = maskCount(scene(s, { enemyMask: true }));
  results[s.key] = 1 - vis / all;
  const wo = wardOcclusion(s); s.wardHidden = wo;
  const img = scene(s);
  const x = left + (i % 2) * (W * Z + gap), y = top + Math.floor(i / 2) * (H * Z + 60);
  octx.save(); octx.translate(x, y + 38); octx.scale(Z, Z); octx.drawImage(img, 0, 0); octx.restore();
  text(octx, s.title, x, y + 12, { size: 14, bold: true, align: 'left', color: i ? '#ffd166' : '#ff8a8a' });
  text(octx, `enemies hidden ${Math.round(results[s.key] * 100)}%  ·  wards hidden by wards ${Math.round(s.wardHidden.avg * 100)}% avg (worst ${Math.round(s.wardHidden.worst * 100)}%)  ·  tallest ${Math.round(heights[s.key].max)} px`, x, y + 29, { size: 12, color: '#c9d4e2', align: 'left' });
});
save(out, resolve(here, '../crowd-test.png'));
console.log('heights (px above footprint centre; avg base / avg T4 / max):');
for (const [k, h] of Object.entries(heights)) console.log(`  ${k}: ${h.base.toFixed(0)} / ${h.t4.toFixed(0)} / ${h.max.toFixed(0)} (${h.maxAt})`);
console.log('ward pixels hidden by other wards:', Object.fromEntries(sets.map((s) => [s.key, `avg ${(s.wardHidden.avg * 100).toFixed(1)}%, worst ${(s.wardHidden.worst * 100).toFixed(0)}%`])));
console.log('enemy pixels hidden:', Object.fromEntries(Object.entries(results).map(([k, v]) => [k, `${(v * 100).toFixed(1)}%`])));
