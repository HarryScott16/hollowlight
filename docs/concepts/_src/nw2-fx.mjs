// Attack and effect samples for the six new ward concepts (render-nw2.mjs): one panel per path at
// tier 4, a road with real enemies (the game's enemy art), the ward, and its effect. Effects are
// drawn here for the mock-up only, in the ward's damage colour (DMG), as the game's would be.
import { createCanvas, turf } from './sheet.mjs';
import { DMG, INK, TAU, circle, poly, star, flat, line, glow, rgba } from '../../../public/js/render/wards/kit.js';
import { drawEnemy, initSprites, setEnemyBase } from '../../../public/js/render/enemyArt.js';
import { ENEMIES } from '../../../public/js/data/enemies.js';
import { torchFlame, emberWisp, chainRing, runeCircle, beam } from '../../../public/js/render/wards/parts.js';

export const ROADY = 128;
const lit = (ctx, fn) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); };
let wob = 0;
function foe(type, x, y, extra = {}) { const def = ENEMIES[type]; return { type, def, x, y, r: def.r, ang: 0, wob: (wob += 0.9), hitT: 0, veiled: !!def.veiled, revealT: 0, hp: def.hp, maxHp: def.hp, shield: def.shield || 0, maxShield: def.shield || 1, hasteT: 0, freezeT: 0, root: 1, ...extra }; }
function enemies(ctx, list) {
  const m = ctx.getTransform(), Z = m.a;
  initSprites(() => createCanvas(1, 1), Z);
  setEnemyBase(Z, m.e, m.f);
  ctx.save();
  for (const e of list.sort((a, b) => a.y - b.y)) drawEnemy(ctx, e, false, 2);
  ctx.restore();
  ctx.setTransform(m);
}
function road(ctx, W, y = ROADY, curve = 0) {
  ctx.lineCap = 'butt';
  for (const [w, col] of [[58, 'rgba(10,50,40,0.35)'], [48, '#7a4e34'], [42, '#d9b47a'], [30, '#ecd0a0']]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-10, y); ctx.lineTo(W + 10, y + curve); ctx.stroke(); }
}
function pond(ctx, x, y, rx, ry) {
  ctx.fillStyle = '#16261e'; ctx.beginPath(); ctx.ellipse(x, y, rx + 5, ry + 5, 0, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 4, x, y, Math.max(rx, ry));
  g.addColorStop(0, '#3e6a6a'); g.addColorStop(0.6, '#1e4448'); g.addColorStop(1, '#122a2e');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}
function arrow(ctx, x0, y0, x1, y1, col = '#ffffff') {
  line(ctx, [[x0, y0], [x1, y1]], col, 1.6);
  const a = Math.atan2(y1 - y0, x1 - x0);
  poly(ctx, [[x1 + Math.cos(a) * 5, y1 + Math.sin(a) * 5], [x1 + Math.cos(a + 2.4) * 5, y1 + Math.sin(a + 2.4) * 5], [x1 + Math.cos(a - 2.4) * 5, y1 + Math.sin(a - 2.4) * 5]]); flat(ctx, col, 1);
}
function mote(ctx, x, y, r = 2, col = DMG.radiant.core) { glow(ctx, x, y, r * 4, col, 0.7); star(ctx, x, y, r * 1.4, r * 0.6, 5); flat(ctx, '#fff8c0', 0.8); }
function trail(ctx, pts, col, w, a = 0.7) { lit(ctx, () => { ctx.strokeStyle = rgba(col, a); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }); }
function note(ctx, x, y, s, col) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.ellipse(0, 0, 2.4, 1.7, -0.4, 0, TAU); flat(ctx, col, 1); line(ctx, [[2, -0.6], [2, -7]], col, 0.9); ctx.restore(); }
function candleOnRoad(ctx, x, y, s, t, col = DMG.fire.core) {
  lit(ctx, () => { ctx.fillStyle = rgba(col, 0.28); ctx.beginPath(); ctx.ellipse(x, y + 1, 9 * s, 3.4 * s, 0, 0, TAU); ctx.fill(); });
  ctx.fillStyle = 'rgba(240,228,200,0.8)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 4 * s, 1.6 * s, 0, 0, TAU); ctx.fill();   // a puddle of wax
  ctx.beginPath(); ctx.rect(x - 1.6 * s, y - 6 * s, 3.2 * s, 6 * s); flat(ctx, '#f3e4c6', 1);
  glow(ctx, x, y - 8 * s, 7 * s, col, 0.6); torchFlame(ctx, x, y - 6.5 * s, 0.45 * s, t + x);
}
function runeOnRoad(ctx, x, y, col, s = 1, a = 0.85) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.42);
  lit(ctx, () => { ctx.strokeStyle = rgba(col, a); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 11 * s, 0, TAU); ctx.stroke();
    ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, -8 * s); ctx.lineTo(0, 8 * s); ctx.moveTo(0, -8 * s); ctx.lineTo(5 * s, -2 * s); ctx.moveTo(0, 0); ctx.lineTo(-5 * s, 5 * s); ctx.stroke(); });
  glow(ctx, 0, 0, 12 * s, col, 0.45);
  ctx.restore();
}
function burst(ctx, x, y, R, col) { glow(ctx, x, y, R * 1.4, col, 0.8); star(ctx, x, y, R, R * 0.45, 8); ctx.fillStyle = rgba(col, 0.75); ctx.fill(); lit(ctx, () => { ctx.strokeStyle = rgba('#ffffff', 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 4, R * 1.3, R * 0.5, 0, 0, TAU); ctx.stroke(); }); }

// wardAt(x, y, tiers, stExtra) draws the ward (the game's drawWard).
export function drawFx(ctx, type, p, skin, W, H, wardAt) {
  const t = 1.3 + p * 0.7, tiers = [0, 0, 0]; tiers[p] = 4;
  turf(ctx, 0, 0, W, H, 7 + p);
  const water = type === 'ferry' || type === 'undertow';
  if (water) pond(ctx, 82, 64, 70, 38);
  road(ctx, W);
  const angTo = (wx, wy, x, y) => Math.atan2(((y - (wy - 20)) / 0.6), x - wx);
  const fx = FX[type](ctx, p, t, W, wardAt, tiers, angTo);
  return fx;
}
const FX = {
  avatar(ctx, p, t, W, wardAt, tiers, angTo) {
    const wx = 70, wy = 78;
    if (p === 0) { // Solar: the beam melting a boss
      const boss = foe('gravemaw', 236, ROADY - 4, { hp: 2400, maxHp: 4000 });
      wardAt(wx, wy, tiers, { ang: angTo(wx, wy, boss.x, boss.y) });
      enemies(ctx, [boss, foe('shambler', 300, ROADY + 6)]);
      const sx = wx + 12 * 1.16, sy = wy - 11 * 1.16 - 36 * 1.16 + 11 * 1.16;
      lit(ctx, () => { for (const [w, a] of [[16, 0.25], [9, 0.55], [4, 0.9]]) { ctx.strokeStyle = rgba(w > 5 ? DMG.radiant.core : '#ffffff', a); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(boss.x - 4, boss.y - 6); ctx.stroke(); } });
      glow(ctx, boss.x - 4, boss.y - 6, 30, DMG.radiant.core, 0.8); burst(ctx, boss.x - 4, boss.y - 4, 12, DMG.radiant.core);
    } else if (p === 1) { // Orrery: stars, each firing at its own target
      const list = [foe('shambler', 150, ROADY - 8), foe('skitter', 200, ROADY + 8), foe('gloomwing', 250, ROADY - 40), foe('brood', 300, ROADY + 2)];
      wardAt(wx, wy, tiers, { ang: 0.3 });
      enemies(ctx, list);
      for (let i = 0; i < list.length; i++) { const a = t * 1.1 + (i / 6) * TAU, sx = wx + Math.cos(a) * 26, sy = wy - 18 + Math.sin(a) * 8, e = list[i]; trail(ctx, [[sx, sy], [e.x, e.y - 4]], DMG.radiant.core, 1.6, 0.45); mote(ctx, (sx + e.x) / 2, (sy + e.y) / 2, 1.6); mote(ctx, e.x, e.y - 4, 2.2); }
    } else { // Eclipse: tethers to the wards around it, a dark-cored torrent
      const near = [['bolt', 30, 168], ['mortar', 128, 60], ['rime', 150, 180]];
      wardAt(wx, wy, tiers, { ang: angTo(wx, wy, 260, ROADY) });
      lit(ctx, () => { for (const [, x, y] of near) { ctx.strokeStyle = rgba('#fff0a0', 0.55); ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(wx, wy - 30); ctx.quadraticCurveTo((wx + x) / 2, Math.min(wy, y) - 40, x, y - 24); ctx.stroke(); ctx.setLineDash([]); } });
      for (const [k, x, y] of near) wardAt(x, y, [2, 0, 0], { ang: 0.2, _type: k });
      const e = foe('husk', 262, ROADY);
      enemies(ctx, [e, foe('shambler', 300, ROADY - 8)]);
      for (let i = 0; i < 6; i++) { const u = i / 6, x = wx + 14 + (e.x - wx - 14) * u, y = wy - 22 + (e.y - wy + 18) * u + Math.sin(i * 2) * 3; glow(ctx, x, y, 10, '#fff0a0', 0.8); circle(ctx, x, y, 3); flat(ctx, '#fff0a0', 1); circle(ctx, x, y, 1.6); ctx.fillStyle = '#2a1e3e'; ctx.fill(); }
    }
  },
  choir(ctx, p, t, W, wardAt, tiers) {
    const wx = 64, wy = 82;
    if (p === 0) { // Hymn: the crescendo on one target
      const h = foe('dreadhulk', 236, ROADY - 2, { hp: 220, maxHp: 400 });
      wardAt(wx, wy, tiers, {});
      enemies(ctx, [h, foe('shambler', 180, ROADY + 8), foe('skitter', 300, ROADY - 6)]);
      lit(ctx, () => { for (let i = 0; i < 4; i++) { ctx.strokeStyle = rgba(DMG.arcane.core, 0.6 - i * 0.12); ctx.lineWidth = 3 - i * 0.5; ctx.beginPath(); ctx.ellipse(h.x, h.y - 8, 12 + i * 9, 5 + i * 4, 0, 0, TAU); ctx.stroke(); } });
      ctx.save(); ctx.translate(h.x, h.y - 46); ctx.beginPath(); ctx.moveTo(-14, 18); ctx.quadraticCurveTo(-13, -6, 0, -8); ctx.quadraticCurveTo(13, -6, 14, 18); ctx.closePath(); ctx.fillStyle = rgba('#d8c8ff', 0.6); ctx.fill(); ctx.restore();
      glow(ctx, h.x, h.y - 10, 34, DMG.arcane.core, 0.8);
      for (let i = 0; i < 5; i++) note(ctx, wx + 20 + i * 30, wy - 30 - Math.sin(i) * 10, 0.9, DMG.arcane.core);
    } else if (p === 1) { // Chorus: every note strikes everything in a huge radius
      const list = [foe('shambler', 130, ROADY - 6), foe('skitter', 170, ROADY + 8), foe('brood', 215, ROADY - 2), foe('aegis', 262, ROADY + 6), foe('herald', 305, ROADY - 6)];
      wardAt(wx, wy, tiers, {});
      lit(ctx, () => { for (const R of [120, 175, 230]) { ctx.strokeStyle = rgba(DMG.arcane.core, R === 175 ? 0.7 : 0.35); ctx.lineWidth = R === 175 ? 3 : 1.6; ctx.beginPath(); ctx.ellipse(wx, wy + 8, R, R * 0.42, 0, 0, TAU); ctx.stroke(); } });
      enemies(ctx, list);
      for (const e of list) { glow(ctx, e.x, e.y - 6, 12, DMG.arcane.core, 0.6); note(ctx, e.x + 4, e.y - 18, 0.8, '#e0c8ff'); }
      ctx.font = '10px Sans'; ctx.fillStyle = '#fff0c0'; ctx.fillText('Hush: no haste in the song', 196, ROADY + 40);
    } else { // Requiem: redeemed wisps fly back down the road
      const list = [foe('shambler', 110, ROADY - 4), foe('skitter', 150, ROADY + 6), foe('brood', 196, ROADY)];
      wardAt(wx, wy, tiers, {});
      enemies(ctx, list);
      for (let i = 0; i < 6; i++) { const x = 300 - i * 26, y = ROADY - 10 + Math.sin(i * 1.7) * 7; trail(ctx, [[x + 26, y + 3], [x + 10, y - 1], [x, y]], '#e8d8ff', 3.4, 0.6); glow(ctx, x, y, 14, '#f0e4ff', 0.85); emberWisp(ctx, x, y, t + i, 1.1); }
      arrow(ctx, 330, ROADY + 30, 250, ROADY + 30, '#e8d8ff');
      ctx.font = '10px Sans'; ctx.fillStyle = '#fff0c0'; ctx.fillText('freed wisps fly back', 228, ROADY + 46);
    }
  },
  ferry(ctx, p, t, W, wardAt, tiers, angTo) {
    const wx = 82, wy = 70;
    if (p === 0) { // Harpooner: a harpoon dragging a husk back up the road
      const h = foe('husk', 214, ROADY - 2);
      const ang = angTo(wx, wy, h.x, h.y);
      wardAt(wx, wy, tiers, { ang });
      enemies(ctx, [h, foe('shambler', 280, ROADY + 6)]);
      const gx = wx + 14 * 1.16, gy = wy - 13 * 1.16;
      line(ctx, [[gx, gy], [(gx + h.x) / 2, (gy + h.y) / 2 + 8], [h.x - 4, h.y - 4]], '#c8ccd8', 1.2);
      poly(ctx, [[h.x + 2, h.y - 2], [h.x - 6, h.y - 7], [h.x - 6, h.y]]); flat(ctx, '#e9eef6', 1);
      arrow(ctx, h.x + 30, ROADY + 30, h.x - 26, ROADY + 30);
    } else if (p === 1) { // Flotilla: light-rafts patrol and fire
      const list = [foe('shambler', 160, ROADY - 6), foe('skitter', 220, ROADY + 6), foe('gloomwing', 280, ROADY - 36)];
      wardAt(wx, wy, tiers, {});
      enemies(ctx, list);
      for (const [x, y, e] of [[40, 82, list[0]], [128, 86, list[1]], [140, 48, list[2]]]) { trail(ctx, [[x, y - 8], [e.x, e.y - 4]], '#e9eef6', 1.2, 0.8); poly(ctx, [[e.x - 2, e.y - 4], [e.x - 9, e.y - 7], [e.x - 9, e.y - 1]]); flat(ctx, '#e9eef6', 1); }
    } else { // Lighthouse Barge: the beam reveals Veiled, and boosts wards on the shore
      const w = foe('wisp', 210, ROADY - 4, { revealT: 1 }), s = foe('shambler', 270, ROADY + 6);
      wardAt(wx, wy, tiers, {});
      const bx = wx + 11 * 1.16, by = wy - 42 * 1.16; beam(ctx, bx, by, Math.atan2(w.y - by, w.x - bx), 190, 22, 0.55);
      enemies(ctx, [w, s]);
      lit(ctx, () => { ctx.strokeStyle = rgba('#fff3c0', 0.8); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(w.x, w.y + 6, 14, 5, 0, 0, TAU); ctx.stroke(); });
      ctx.font = '10px Sans'; ctx.fillStyle = '#fff0c0'; ctx.fillText('revealed', w.x - 18, w.y - 22);
      wardAt(300, 186, [2, 0, 0], { ang: -1.6, _type: 'bolt' });
      lit(ctx, () => { ctx.strokeStyle = rgba(DMG.hearth.core, 0.8); ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.ellipse(300, 188, 18, 6, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); });
      ctx.fillText('shore ward boosted', 212, 184);
    }
  },
  undertow(ctx, p, t, W, wardAt, tiers) {
    const wx = 82, wy = 70;
    if (p === 0) { // Maelstrom: a whirlpool on the road, dragging back
      const cx = 220, cy = ROADY;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.42);
      for (let i = 0; i < 4; i++) { ctx.beginPath(); for (let k = 0; k <= 40; k++) { const u = k / 40, a = t * 2 + u * TAU * 1.4 + i * 1.57, r = 44 * (1 - u * 0.85); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.strokeStyle = rgba(i % 2 ? '#bfefff' : DMG.frost.core, 0.8); ctx.lineWidth = 3; ctx.stroke(); }
      ctx.fillStyle = 'rgba(10,40,70,0.5)'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
      ctx.restore();
      wardAt(wx, wy, tiers, {});
      enemies(ctx, [foe('shambler', cx - 26, cy - 4, { ang: 2.5 }), foe('skitter', cx + 18, cy + 8, { ang: -1 }), foe('husk', cx + 4, cy - 12, { ang: 1.6 })]);
      arrow(ctx, cx + 34, ROADY + 34, cx - 30, ROADY + 34, '#bfefff');
    } else if (p === 1) { // Tidecaller: a wave surges across the road, knocking the crowd back
      wardAt(wx, wy, tiers, {});
      const list = [foe('shambler', 196, ROADY - 8, { ang: Math.PI }), foe('skitter', 214, ROADY + 6, { ang: Math.PI }), foe('brood', 236, ROADY - 2, { ang: Math.PI })];
      enemies(ctx, list);
      ctx.beginPath(); ctx.moveTo(250, ROADY + 26); ctx.quadraticCurveTo(252, ROADY - 18, 272, ROADY - 36); ctx.quadraticCurveTo(290, ROADY - 40, 296, ROADY - 28); ctx.quadraticCurveTo(284, ROADY - 30, 280, ROADY - 22); ctx.quadraticCurveTo(292, ROADY, 300, ROADY + 26); ctx.closePath(); flat(ctx, 'rgba(90,190,230,0.85)', 1.6);
      for (let i = 0; i < 6; i++) { circle(ctx, 258 + i * 7, ROADY - 30 + Math.sin(i) * 6, 2.4); flat(ctx, '#eafaff', 0.8); }
      arrow(ctx, 246, ROADY + 34, 180, ROADY + 34, '#bfefff');
    } else { // Abyss: small Gloom pulled under, big ones stripped of layers
      const cx = 220;
      ctx.save(); ctx.translate(cx, ROADY); ctx.scale(1, 0.42); const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 40); g.addColorStop(0, '#050a14'); g.addColorStop(0.7, '#0e1828'); g.addColorStop(1, 'rgba(14,24,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 40, 0, TAU); ctx.fill(); ctx.restore();
      wardAt(wx, wy, tiers, {});
      const h = foe('dreadhulk', cx + 76, ROADY - 4, { hp: 250, maxHp: 400 });
      enemies(ctx, [h, foe('skitter', cx - 6, ROADY + 2)]);
      ctx.fillStyle = 'rgba(5,10,20,0.85)'; ctx.beginPath(); ctx.ellipse(cx - 6, ROADY + 4, 14, 6, 0, 0, Math.PI); ctx.fill();   // sinking
      for (const [x, s] of [[cx - 34, 1], [cx + 26, -1]]) line(ctx, [[x, ROADY + 6], [x + s * 6, ROADY - 10], [x + s * 2, ROADY - 22]], '#2a3a5a', 2.4);
      for (let i = 0; i < 4; i++) { const a = i * 1.6; poly(ctx, [[h.x + Math.cos(a) * 26, h.y - 10 + Math.sin(a) * 10], [h.x + Math.cos(a) * 30 + 3, h.y - 12 + Math.sin(a) * 10], [h.x + Math.cos(a) * 28, h.y - 6 + Math.sin(a) * 10]]); flat(ctx, '#6a5a7a', 0.8); }
      ctx.font = '10px Sans'; ctx.fillStyle = '#fff0c0'; ctx.fillText('layers stripped', h.x - 30, ROADY + 42); ctx.fillText('pulled under', cx - 48, ROADY + 42);
    }
  },
  lampwright(ctx, p, t, W, wardAt, tiers) {
    const wx = 70, wy = 82;
    wardAt(wx, wy, tiers, { ang: 0.4 });
    const spots = p === 0 ? [[150, ROADY - 6, 2.3], [214, ROADY + 8, 2.3], [284, ROADY - 4, 2.3]] : p === 1 ? Array.from({ length: 12 }, (_, i) => [118 + i * 17, ROADY + ((i * 7) % 5 - 2) * 5, 1.15]) : [[156, ROADY - 4, 1.7], [226, ROADY + 6, 1.7], [292, ROADY - 2, 1.7]];
    for (const [x, y, s] of spots) {
      if (p === 2) lit(ctx, () => { ctx.strokeStyle = rgba('#ffe03a', 0.55); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, y + 1, 30, 11, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = rgba('#ffe03a', 0.08); ctx.fill(); });
      candleOnRoad(ctx, x, y, s, t, p === 2 ? '#ffe03a' : DMG.fire.core);
    }
    enemies(ctx, [foe('shambler', 205, ROADY - 2, { burnT: 1 }), foe('mender', 262, ROADY + 2, { burnT: 1 }), foe(p === 2 ? 'wisp' : 'skitter', 238, ROADY - 10, { revealT: p === 2 ? 1 : 0 })]);
    const [mx, my] = [wx - 12 * 1.16, wy - 37 * 1.16]; const [tx, ty] = spots[1];
    trail(ctx, [[mx, my], [(mx + tx) / 2, my - 30], [tx, ty - 10]].map(([x, y]) => [x, y]), '#ffb070', 1.2, 0.5);
    ctx.font = '10px Sans'; ctx.fillStyle = '#fff0c0'; ctx.fillText(p === 2 ? 'reveals and slows' : 'Scorched: no healing', 222, ROADY + 40);
  },
  runewright(ctx, p, t, W, wardAt, tiers) {
    const wx = 70, wy = 82;
    wardAt(wx, wy, tiers, { ang: 0.4 });
    if (p === 0) { // Ember Rune: a rune goes off under a crowd
      runeOnRoad(ctx, 150, ROADY, DMG.blast.core, 1.2); runeOnRoad(ctx, 290, ROADY, DMG.blast.core, 1.2);
      enemies(ctx, [foe('shambler', 206, ROADY - 8), foe('brood', 230, ROADY + 6), foe('skitter', 252, ROADY - 2)]);
      burst(ctx, 228, ROADY - 4, 22, DMG.blast.core);
    } else if (p === 1) { // Frost Rune: the crowd freezes in place
      for (const x of [140, 200, 260, 310]) runeOnRoad(ctx, x, ROADY + ((x / 10) % 2 ? 4 : -4), DMG.frost.core, 0.8);
      enemies(ctx, [foe('shambler', 192, ROADY - 6, { freezeT: 1 }), foe('skitter', 212, ROADY + 6, { freezeT: 1 }), foe('brood', 236, ROADY, { freezeT: 1 })]);
    } else { // Seal Rune: even a Dreadhulk stops
      const h = foe('dreadhulk', 226, ROADY - 2, { stunT: 1 });
      runeOnRoad(ctx, h.x, h.y + 4, '#fff6d0', 2);
      enemies(ctx, [h, foe('mender', 290, ROADY + 4)]);
      chainRing(ctx, h.x, h.y - 6, 26, 10, 12, '#e8e8f0', t);
      ctx.font = '10px Sans'; ctx.fillStyle = '#fff0c0'; ctx.fillText('sealed: held, its aura silenced', 172, ROADY + 44);
    }
  },
};
