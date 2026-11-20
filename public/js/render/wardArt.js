// Ward art: picks the skin, caches each ward's static body as a sprite, and draws wards upright on
// the map (see render/wards/kit.js for the design system and units).
//
// Two complete skins are maintained side by side: Kindlings (active) and Lanterns. Every ward,
// tier, path, projectile and effect must exist in both (see CLAUDE.md). Switch with ?skin=lantern
// or ?skin=kindling in the URL, or the hidden L key.
//
// Wards not yet converted fall back to the old top-down art in towerArt.js.
import { KINDLINGS } from './wards/kindlings.js';
import { LANTERNS } from './wards/lanterns.js';
import { mainPath, WARD_DMG, DMG, setCanvasFactory, shadow } from './wards/kit.js';
import { drawTower as drawOld, towerScale as oldScale } from './towerArt.js';

export const SKINS = { kindling: { name: 'Kindlings', art: KINDLINGS }, lantern: { name: 'Lanterns', art: LANTERNS } };
let skin = 'kindling';

export function skinFromQuery(search) {
  const q = /[?&]skin=([a-z]+)/i.exec(search || '');
  if (!q) return null;
  const v = q[1].toLowerCase();
  return v.startsWith('lantern') ? 'lantern' : v.startsWith('kindl') ? 'kindling' : null;
}
export function getSkin() { return skin; }
export function skinName() { return SKINS[skin].name; }
export function setSkin(name) { if (SKINS[name] && name !== skin) { skin = name; sprites.clear(); } }
export function nextSkin() { const keys = Object.keys(SKINS); setSkin(keys[(keys.indexOf(skin) + 1) % keys.length]); return skin; }

// Ward units -> map pixels. Wards grow with every tier on their main path, so a tier 4 is clearly
// bigger than a tier 0 (about x1.35); tiers on the second path add a little. tools/wards.mjs
// checks the heights. Enemies behind a ward show through it (see Renderer.drawGhosts).
const K = 0.86;
const GROW = [1, 1.06, 1.13, 1.22, 1.35];
export function wardScale(tiers) { const P = mainPath(tiers); return K * (GROW[P.mt] + (P.lvl - P.mt) * 0.02); }
const PLINTH_Y = 11;   // ward units: the plinth centre sits on the ward's map position

const pcache = new Map();
function pathInfo(tiers) {
  const key = tiers[0] * 25 + tiers[1] * 5 + tiers[2];
  let P = pcache.get(key);
  if (!P) { P = mainPath(tiers); P.tiers = tiers.slice(); pcache.set(key, P); }
  return P;
}
function artFor(type) { return SKINS[skin].art[type] || null; }
export function isConverted(type) { return !!artFor(type); }

// ---- sprite cache ------------------------------------------------------------------------------
// Box (ward units) every body fits in: x -38..38, y -70..22.
const BX = -38, BY = -70, BW = 76, BH = 92;
const sprites = new Map();
let makeCanvas = () => null, pxScale = 1;
export function initWardArt(factory, scale) {
  makeCanvas = factory; pxScale = scale;
  setCanvasFactory(factory);
  sprites.clear();
}
function sprite(type, art, P) {
  const key = `${type}|${P.tiers[0]}${P.tiers[1]}${P.tiers[2]}`;
  let sp = sprites.get(key);
  if (sp) return sp;
  if (sprites.size > 300) sprites.clear();
  const S = wardScale(P.tiers), k = S * pxScale;
  const cv = makeCanvas();
  cv.width = Math.ceil(BW * k); cv.height = Math.ceil(BH * k);
  const ctx = cv.getContext('2d');
  ctx.setTransform(k, 0, 0, k, -BX * k, -BY * k);
  shadow(ctx, 15);
  const top = art.body(ctx, P, WARD_DMG[type]);
  sp = { cv, top: typeof top === 'number' ? top : -30 };
  sprites.set(key, sp);
  return sp;
}

// ---- drawing -----------------------------------------------------------------------------------
// t: { type, tiers, x, y, id }. st: { ang, recoil, time, pulse, fire, pop, tx, ty, id }.
export function drawWard(ctx, t, st) {
  const art = artFor(t.type);
  if (!art) { ctx.save(); ctx.translate(t.x, t.y); drawOld(ctx, t.type, t.tiers, st); ctx.restore(); return; }
  const P = pathInfo(t.tiers), d = WARD_DMG[t.type];
  const sp = sprite(t.type, art, P);
  const pop = st.pop || 0, S = wardScale(t.tiers) * (1 + pop * 0.3);
  ctx.save();
  ctx.translate(t.x, t.y); ctx.scale(S, S); ctx.translate(0, -PLINTH_Y);
  if (art.back) art.back(ctx, P, st, d);
  // Kindlings breathe: a slow, volume-keeping squash about the ground line.
  const b = art.breathe ? Math.sin(st.time * 2.4 + (st.id || 0)) * 0.025 : 0;
  if (b) { ctx.translate(0, 14); ctx.scale(1 - b * 0.5, 1 + b); ctx.translate(0, -14); }
  ctx.drawImage(sp.cv, BX, BY, BW, BH);
  art.front(ctx, P, st, d);
  if (pop > 0) { // white flash during the upgrade pop
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = pop * 0.5; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, -8, 20, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// Map position where a ward's shots leave (out = [x, y]).
const TMP = [0, 0];
export function wardMuzzle(t, ang, out) {
  const art = artFor(t.type);
  if (!art) { const r = 16 * oldScale(t.tiers); out[0] = t.x + Math.cos(ang) * r; out[1] = t.y + Math.sin(ang) * r; return out; }
  art.muzzle(pathInfo(t.tiers), ang, TMP);
  const S = wardScale(t.tiers);
  out[0] = t.x + TMP[0] * S; out[1] = t.y + (TMP[1] - PLINTH_Y) * S;
  return out;
}
// The heads a ward breathes or fires from (the Censer has one to three).
export function wardSpouts(t, ang) { const art = artFor(t.type); return art && art.spouts ? art.spouts(pathInfo(t.tiers), ang) : [ang]; }
// Map y of the top of a ward (for markers floating over it).
export function wardTop(t) {
  const art = artFor(t.type);
  if (!art) return t.y - 26 * oldScale(t.tiers);
  return t.y + (sprite(t.type, art, pathInfo(t.tiers)).top - PLINTH_Y) * wardScale(t.tiers);
}
// Screen box of a ward's body (map units): where enemies behind it need to show through.
export function wardBox(t, out) {
  const S = wardScale(t.tiers);
  out[0] = t.x - 17 * S; out[1] = wardTop(t); out[2] = t.x + 17 * S; out[3] = t.y + 3 * S;
  return out;
}
// Signature colour of a ward's damage type, for effects.
export function wardColor(type) { const D = DMG[WARD_DMG[type] || 'kinetic']; return D.core; }

// Static icon for shop buttons and the ward panel.
const ICON_ST = { ang: Math.PI * 0.15, recoil: 0, time: 0.4, pulse: 0, fire: 0, pop: 0, tx: null, ty: null, id: 0 };
export function drawWardIcon(canvas, type, tiers = [0, 0, 0]) {
  const art = artFor(type);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!art) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    const s = canvas.width / (52 * Math.max(1, oldScale(tiers) * (Math.max(...tiers) >= 3 ? 1.25 : 1)));
    ctx.scale(s, s);
    drawOld(ctx, type, tiers, ICON_ST);
    return;
  }
  const P = pathInfo(tiers), d = WARD_DMG[type];
  // Fit the ward (from its top down to the ground line at y = 14) into the icon.
  const s = Math.min(canvas.width / 42, canvas.height / (P.mt >= 3 ? 62 : 50));
  ctx.translate(canvas.width / 2, canvas.height - 17 * s);
  ctx.scale(s, s);
  shadow(ctx, 15);
  art.body(ctx, P, d);
  art.front(ctx, P, ICON_ST, d);
}
