// The four chosen new wards in both skins (see dir-chosen.mjs and docs/tower-ideas.md, "Chosen wards").
//   docs/concepts/chosen/<key>.png              base, T2 and T4 on every path, Kindlings row + Lanterns row
//                                               (vaults also get an empty / half / full strip)
//   docs/concepts/chosen/wander-<a|b>-attack.png the Wandering Light attacking real enemies, every state, both skins
//   docs/concepts/chosen/lineup.png             the 8 current wards + the chosen designs at real size, both skins
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createCanvas, turf, text, save, panel } from './sheet.mjs';
import { STATES, ST } from './wardsheets.mjs';
import { CHOSEN, SKINS, drawAttack } from './dir-chosen.mjs';
import { WARDS } from './render-directions.mjs';
import { draw as kDraw8 } from './dir-kindlings.mjs';
import { draw as lDraw8 } from './dir-lanterns.mjs';
import { drawEnemy } from '../../../public/js/render/enemyArt.js';
import { ENEMIES } from '../../../public/js/data/enemies.js';
import { DMG } from './kit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../chosen');
const BG = '#0f1420', SUB = '#8fa0b8';
const dmgName = (d) => DMG[d].name.replace(/ \(.*/, '');
const stateLabel = (sp, s) => { const pi = s.tiers.findIndex((v) => v > 0); return pi < 0 ? 'Base' : `${sp.paths[pi]} T${s.tiers[pi]}`; };

function cell(draw, type, tiers, size, zoom, seed, extra = {}) {
  const c = createCanvas(size, size), k = c.getContext('2d');
  turf(k, 0, 0, size, size, seed);
  k.translate(size / 2, size / 2); k.scale(zoom, zoom);
  draw(k, type, tiers, { ...ST, ...extra });
  return c;
}

// ---- per-ward sheets ----------------------------------------------------------------------------
for (const [type, sp] of Object.entries(CHOSEN)) {
  const Z = 2, C = 76 * Z, gap = 8, left = 130, top = 74, rowH = C + 26 + 84;
  const isVault = type.startsWith('vault');
  const W = left + STATES.length * (C + gap) + 8, H = top + 2 * rowH + (isVault ? 60 + C + 30 : 0) + 6;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, sp.name, 16, 32, { size: 22, bold: true, align: 'left' });
  text(ctx, `${sp.family} family · ${dmgName(sp.dmg)} · base, then T2 and T4 on each path; real size underneath${isVault ? ' (shown about 60% full)' : ''}`, 16, 54, { size: 12, color: SUB, align: 'left' });
  Object.values(SKINS).forEach((skin, r) => {
    const y = top + r * rowH;
    text(ctx, skin.title, 14, y + C / 2, { size: 14, bold: true, align: 'left' });
    STATES.forEach((s, i) => {
      const x = left + i * (C + gap);
      ctx.drawImage(cell(skin.draw, type, s.tiers, C, Z, r * 10 + i), x, y);
      text(ctx, stateLabel(sp, s), x + C / 2, y + C + 16, { size: 11, color: '#c9d4e2' });
      ctx.drawImage(cell(skin.draw, type, s.tiers, 76, 1, r * 10 + i), x + C / 2 - 38, y + C + 24);
    });
  });
  if (isVault) {
    const y = top + 2 * rowH + 34;
    text(ctx, 'How full it is, at a glance (base tier): empty · half · full, in each skin', 16, y - 10, { size: 14, bold: true, align: 'left' });
    Object.values(SKINS).forEach((skin, r) => [0, 0.5, 1].forEach((f, i) => {
      const x = left + (r * 3 + i + (r ? 0.5 : 0)) * (C + gap);
      ctx.drawImage(cell(skin.draw, type, [0, 0, 0], C, Z, 40 + r * 3 + i, { fill: f }), x, y);
      text(ctx, `${skin.title.slice(4)} · ${['empty', 'half', 'full'][i]}`, x + C / 2, y + C + 16, { size: 11, color: '#c9d4e2' });
    }));
  }
  save(cv, `${OUT}/${type}.png`);
}

// ---- Wandering Light attack sheets --------------------------------------------------------------
const LW = 190, LH = 104, WX = 50, WY = 44, PY = 80;
function enemy(type, x, y, i) { const def = ENEMIES[type]; return { type, def, x, y, r: def.r, ang: Math.PI, wob: i + 0.4, hitT: 0, veiled: false, revealT: 0, hp: def.hp, maxHp: def.hp, shield: 0, maxShield: 1, hasteT: 0, freezeT: 0 }; }
function attackCell(skin, type, tiers, Z, seed) {
  const c = createCanvas(LW * Z, LH * Z), k = c.getContext('2d');
  turf(k, 0, 0, LW * Z, LH * Z, seed);
  k.save(); k.scale(Z, Z);
  k.lineCap = 'butt';
  for (const [w, col] of [[34, 'rgba(10,50,40,0.35)'], [30, '#7a4e34'], [26, '#d9b47a'], [16, '#ecd0a0']]) { k.strokeStyle = col; k.lineWidth = w; k.beginPath(); k.moveTo(0, PY); k.lineTo(LW, PY); k.stroke(); }
  const main = tiers.findIndex((v) => v > 0), swarm = main === 1 && tiers[1] >= 2;
  const foes = swarm ? (tiers[1] >= 4 ? [enemy('shambler', 120, 78, 0), enemy('skitter', 152, 86, 1), enemy('brood', 176, 74, 2)] : [enemy('shambler', 128, 80, 0), enemy('skitter', 166, 76, 1)])
    : [enemy(main === 0 ? 'husk' : 'shambler', 152, 79, 0)];
  for (const e of foes) drawEnemy(k, e, true);
  k.restore();
  const t0 = foes[0], st = { ...ST, ang: Math.atan2((t0.y - (WY - 6)) / 0.6, t0.x - WX), marks: {} };
  k.save(); k.translate(WX * Z, WY * Z); k.scale(Z, Z); skin.draw(k, type, tiers, st); k.restore();
  const muzzles = st.marks.muzzle || [];
  // each swarm light takes its own target (lights and foes are listed left to right / top to bottom)
  const targets = foes.map((e) => ({ x: e.x * Z, y: (e.y - e.r * 0.2) * Z, r: e.r * Z }));
  drawAttack(k, type === 'wanderA' ? 'a' : 'b', tiers, muzzles, swarm ? muzzles.map((m, i) => targets[i % targets.length]) : [targets[0]], Z);
  return c;
}
const NOTES = {
  wanderA: ['base: a thin, wavy stream of violet fairy light from its mouth, sparkles along it, a small sparkle burst on the target',
    'Hunter: the stream thickens (T2); T4 is a broad beam wrapped in a white spiral, a bigger burst and a shock ring',
    'Swarm: splits into 2 (T2) then 3 (T4) small lights, each with a thinner stream at its own target',
    'Torchbearer: a rose aura ring travels with it; the stream sheds motes that linger on the path (wider at T4)'],
  wanderB: ['base: a little wand; each cast is a five-point star-bolt with a sparkle tail and a flash at the tip; starburst on hit',
    'Hunter: bigger stars (T2); at T3 the wand becomes a staff with a crystal; T4 fires a comet with a long tail and a ground ring',
    'Swarm: 2 (T2) then 3 (T4) small lights with small wands; at T4 each casts a 2-star volley',
    'Torchbearer: rose aura ring; stars turn rose and leave a rune mark under the target (the marked enemy takes more damage)'],
};
for (const [type, tag] of [['wanderA', 'a'], ['wanderB', 'b']]) {
  const sp = CHOSEN[type], Z = 1.6, CW = LW * Z, CH = LH * Z, gap = 8, left = 130, top = 74 + 4 * 17, rowH = CH + 30;
  const W = left + STATES.length * (CW + gap) + 8, H = top + 2 * rowH + 10;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, `${sp.name}: the attack, projectile and hit effect at each tier`, 16, 32, { size: 22, bold: true, align: 'left' });
  NOTES[type].forEach((n, i) => text(ctx, n, 16, 58 + i * 17, { size: 12, color: SUB, align: 'left' }));
  Object.values(SKINS).forEach((skin, r) => {
    const y = top + r * rowH;
    text(ctx, skin.title, 14, y + CH / 2, { size: 14, bold: true, align: 'left' });
    STATES.forEach((s, i) => {
      const x = left + i * (CW + gap);
      ctx.drawImage(attackCell(skin, type, s.tiers, Z, r * 10 + i), x, y);
      text(ctx, stateLabel(sp, s), x + CW / 2, y + CH + 16, { size: 11, color: '#c9d4e2' });
    });
  });
  save(cv, `${OUT}/wander-${tag}-attack.png`);
}

// ---- lineup: the 8 current wards + the chosen designs, real size, both skins --------------------
{
  const chosen = Object.entries(CHOSEN);
  const C = 76, gap = 4, left = 20, top = 104;
  const rows = [['Base', [0, 0, 0]], ['P1 T4', [4, 0, 0]], ['P2 T4', [0, 4, 0]], ['P3 T4', [0, 0, 4]]];
  const cols = WARDS.length + chosen.length, blockH = rows.length * (C + gap) + 60;
  const W = left + 70 + cols * (C + gap) + 10, H = top + 2 * blockH + 10;
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  panel(ctx, 0, 0, W, H, BG);
  text(ctx, 'The 8 current wards + the chosen new designs (gold) at real size, in each skin', 16, 30, { size: 18, bold: true, align: 'left' });
  text(ctx, 'Wandering Light and Ember Vault appear once per version; only one of each would ship.', 16, 50, { size: 12, color: SUB, align: 'left' });
  [['B · Kindlings', kDraw8, SKINS.kindlings.draw], ['A · Lanterns', lDraw8, SKINS.lanterns.draw]].forEach(([title, d8, dN], b) => {
    const oy = top + b * blockH;
    text(ctx, title, left, oy - 24, { size: 13, bold: true, align: 'left' });
    WARDS.forEach((w, i) => text(ctx, w.name.replace(/ Ward$/, '').split(' ').pop(), left + 70 + i * (C + gap) + C / 2, oy - 6, { size: 10, color: '#c9d4e2' }));
    chosen.forEach(([, sp], i) => text(ctx, sp.short, left + 70 + (WARDS.length + i) * (C + gap) + C / 2, oy - 6, { size: 10, color: '#ffd166', bold: true }));
    rows.forEach(([label, tiers], r) => {
      const y = oy + r * (C + gap);
      text(ctx, label, left, y + C / 2 + 4, { size: 12, align: 'left', color: SUB });
      WARDS.forEach((w, i) => ctx.drawImage(cell(d8, w.type, tiers, C, 1, r * 20 + i), left + 70 + i * (C + gap), y));
      chosen.forEach(([type], i) => ctx.drawImage(cell(dN, type, tiers, C, 1, r * 20 + 8 + i), left + 70 + (WARDS.length + i) * (C + gap), y));
    });
  });
  save(cv, `${OUT}/lineup.png`);
}
