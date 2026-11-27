// Ward art: picks the skin, caches each ward's static body as a sprite, and draws wards upright on
// the map (see render/wards/kit.js for the design system and units).
//
// Two complete skins are maintained side by side: Kindlings (active) and Lanterns. Every ward,
// tier, path, projectile and effect must exist in both (see CLAUDE.md). Switch with ?skin=lantern
// or ?skin=kindling in the URL, or the hidden L key.
//
import { KINDLINGS } from './wards/kindlings.js';
import { LANTERNS } from './wards/lanterns.js';
import { mainPath, WARD_DMG, DMG, setCanvasFactory, shadow } from './wards/kit.js';
import { ascendBehind, ascendBack, ascendFront, clearAscendCache } from './wards/ascend.js';
import { NEW_KINDLINGS, NEW_LANTERNS } from './wards/newwards.js';

// The round-2 wards (both skins) join the skin tables.
Object.assign(KINDLINGS, NEW_KINDLINGS);
Object.assign(LANTERNS, NEW_LANTERNS);

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
export function setSkin(name) { if (SKINS[name] && name !== skin) { skin = name; sprites.clear(); clearAscendCache(); } }
export function nextSkin() { const keys = Object.keys(SKINS); setSkin(keys[(keys.indexOf(skin) + 1) % keys.length]); return skin; }

// Ward units -> map pixels. Wards grow with every tier on their main path, so a tier 4 is clearly
// bigger than a tier 0 (about x1.35); tiers on the second path add a little. tools/wards.mjs
// checks the heights. Enemies behind a ward show through it (see Renderer.drawGhosts).
const K = 0.86;
const GROW = [1, 1.06, 1.13, 1.22, 1.35, 1.5];
export function wardScale(tiers) { const P = mainPath(tiers); return K * (GROW[P.mt] + (P.lvl - P.mt) * 0.02); }
const PLINTH_Y = 11;   // ward units: the plinth centre sits on the ward's map position

const pcache = new Map();
function pathInfo(tiers) {
  const key = tiers[0] * 36 + tiers[1] * 6 + tiers[2];
  let P = pcache.get(key);
  if (!P) {
    P = mainPath(tiers); P.tiers = tiers.slice();
    if (P.mt >= 5) { P.mt = 4; P.t5 = true; }
    pcache.set(key, P);
  }
  return P;
}
// Water wards stand on the map's water: 'water', 'lava' (Ashfork: their lava variants) or 'ice'
// (Rimecoil: in a hole broken in the frozen lake). Set by the renderer when a map loads.
let waterKind = 'water';
export function setWaterKind(k) { if (k !== waterKind) { waterKind = k; sprites.clear(); live.clear(); } }
export function getWaterKind() { return waterKind; }
function artFor(type) { const A = SKINS[skin].art; return (waterKind === 'lava' && A[type + '_lava']) || A[type] || null; }
export function isConverted(type) { return !!artFor(type); }

// ---- sprite cache ------------------------------------------------------------------------------
// A tier 5 is drawn as its skin's tier 4 form (P.mt = 4, P.t5 set) plus the second form from
// wards/ascend.js, shared by both skins. artPath() is that view of a ward's tiers.
export function artPath(tiers) { return pathInfo(tiers); }

// Box (ward units) every body fits in: x -38..38, y -70..22.
const BX = -38, BY = -70, BW = 76, BH = 92;
const sprites = new Map();
let makeCanvas = () => null, pxScale = 1;
export function initWardArt(factory, scale) {
  makeCanvas = factory; pxScale = scale;
  setCanvasFactory(factory);
  sprites.clear(); live.clear(); clearAscendCache();
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
  if (!art.flat && !art.float) shadow(ctx, 15);   // a Snare lies on the road; a floating ward casts its own
  if (P.t5) ascendBehind(ctx, type, P, WARD_DMG[type], skin);
  const top = art.body(ctx, P, WARD_DMG[type]);
  sp = { cv, top: typeof top === 'number' ? top : -30 };
  sprites.set(key, sp);
  return sp;
}

// ---- drawing -----------------------------------------------------------------------------------
// The live layer (aim, flicker, idle animation) is costly to draw every frame for a full defence,
// so while the renderer has it switched on (setWardRefresh) each ward draws into its own small
// canvas, refreshed every `every` frames (staggered by ward id), and the frame pays one drawImage
// per ward. Upgrade pops and the placement preview (st.direct) always draw live.
// Redraws also share a time budget per frame: once it's spent, wards that are due keep their last
// image and go first next frame (a ward is never more than twice its interval out of date), so a
// huge defence costs no more than the budget.
const LIVE = { on: false, every: 2, frame: 0, budget: 3, spent: 0 };
export function setWardRefresh(every, frame, budgetMs = 3) { LIVE.on = true; LIVE.every = every; LIVE.frame = frame; LIVE.budget = budgetMs; LIVE.spent = 0; }
const live = new Map();   // ward id -> { cv, key }
const LX = -72, LY = -80, LW = 144, LH = 114;   // ward units: room for gear, beams and searchlights
export function pruneWardCache(ids) { for (const id of live.keys()) if (!ids.has(id)) live.delete(id); }

function drawLive(ctx, art, P, d, sp, st, pop, type) {   // ctx is already in ward units
  // A floating ward (the Wandering Light) bobs gently; its shadow is drawn in `back`, on the ground.
  st.water = waterKind;
  if (art.float) { if (art.shadow) art.shadow(ctx, P, st); ctx.translate(0, Math.sin(st.time * 2.2 + (st.id || 0)) * 1.6); }
  if (P.t5) ascendBack(ctx, type, P, st, d, skin);
  if (art.back) art.back(ctx, P, st, d);
  // Kindlings breathe: a slow, volume-keeping squash about the ground line.
  const b = art.breathe ? Math.sin(st.time * 2.4 + (st.id || 0)) * 0.025 : 0;
  if (b) { ctx.translate(0, 14); ctx.scale(1 - b * 0.5, 1 + b); ctx.translate(0, -14); }
  ctx.drawImage(sp.cv, BX, BY, BW, BH);
  art.front(ctx, P, st, d);
  if (P.t5) ascendFront(ctx, type, P, st, d, skin, sp.top);
  if (pop > 0) { // white flash during the upgrade pop
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = pop * 0.5; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, -8, 20, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
}

// t: { type, tiers, x, y, id }. st: { ang, recoil, time, pulse, fire, pop, tx, ty, id, direct }.
export function drawWard(ctx, t, st) {
  const art = artFor(t.type);
  if (!art) return;
  const P = pathInfo(t.tiers), d = WARD_DMG[t.type];
  const sp = sprite(t.type, art, P);
  const pop = st.pop || 0;
  if (!LIVE.on || pop > 0 || st.direct) {
    const S = wardScale(t.tiers) * (1 + pop * 0.3);
    ctx.save();
    try {
      ctx.translate(t.x, t.y); ctx.scale(S, S); ctx.translate(0, -PLINTH_Y);
      drawLive(ctx, art, P, d, sp, st, pop, t.type);
    } finally { ctx.restore(); }   // an error in the art never leaves its transform behind
    return;
  }
  const S = wardScale(t.tiers), k = S * pxScale;
  const key = `${skin}|${t.type}|${P.tiers[0]}${P.tiers[1]}${P.tiers[2]}|${k.toFixed(3)}`;
  let c = live.get(t.id), fresh = false;
  if (!c || c.key !== key) {
    const cv = (c && c.cv) || makeCanvas();
    cv.width = Math.ceil(LW * k); cv.height = Math.ceil(LH * k);
    c = { cv, key, last: -1e9 }; live.set(t.id, c); fresh = true;
  }
  const age = LIVE.frame - c.last;
  if (fresh || age >= LIVE.every * 2 || (age >= LIVE.every && LIVE.spent < LIVE.budget)) {
    const t0 = performance.now(), g = c.cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.cv.width, c.cv.height);
    g.setTransform(k, 0, 0, k, -LX * k, -LY * k);
    drawLive(g, art, P, d, sp, st, 0, t.type);
    c.last = LIVE.frame - ((LIVE.frame + t.id) % LIVE.every);   // keeps refreshes staggered across wards
    LIVE.spent += performance.now() - t0;
  }
  ctx.drawImage(c.cv, t.x + LX * S, t.y + (LY - PLINTH_Y) * S, LW * S, LH * S);
}

// Map position where a ward's shots leave (out = [x, y]).
const TMP = [0, 0];
export function wardMuzzle(t, ang, out) {
  const art = artFor(t.type);
  if (!art) { out[0] = t.x; out[1] = t.y; return out; }
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
  if (!art) return t.y - 30;
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
  if (!art) return;
  const P = pathInfo(tiers), d = WARD_DMG[type];
  // Fit the ward (from its top down to the ground line at y = 14) into the icon.
  const s = Math.min(canvas.width / 42, canvas.height / (P.mt >= 3 ? 62 : 50));
  ctx.translate(canvas.width / 2, canvas.height - 17 * s);
  ctx.scale(s, s);
  shadow(ctx, 15);
  if (P.t5) ascendBehind(ctx, type, P, d, skin);
  const top = art.body(ctx, P, d);
  art.front(ctx, P, ICON_ST, d);
  if (P.t5) ascendFront(ctx, type, P, ICON_ST, d, skin, typeof top === 'number' ? top : -30);
}
