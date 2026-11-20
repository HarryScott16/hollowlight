// Ward art check: renders every converted ward in BOTH skins (base, T2 and T4 on each path, and a
// mixed build) into a contact sheet, and checks the height caps: wards grow with tier, but a base
// ward stays under ~46 px and a tier 4 under ~68 px above its footprint. (Enemies behind a ward
// show through it, see Renderer.drawGhosts, so growth never hides them.)
//
//   CANVAS_MODULES=<dir>/node_modules node tools/wards.mjs [out.png]
//
// Needs @napi-rs/canvas, which is NOT a game dependency: install it anywhere outside the game,
// e.g. mkdir -p ~/scratch/rnd && cd ~/scratch/rnd && npm i @napi-rs/canvas@0.1.65
// Exits non-zero if a ward breaks the cap or a skin is missing a ward the other skin has.
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { initWardArt, setSkin, drawWard, SKINS, wardScale } from '../public/js/render/wardArt.js';
import { FACE, mainPath, WARD_DMG } from '../public/js/render/wards/kit.js';

const req = createRequire(process.env.CANVAS_MODULES ? join(process.env.CANVAS_MODULES, 'x.js') : import.meta.url);
const { createCanvas, GlobalFonts } = req('@napi-rs/canvas');
if (process.env.FONT_DIR) GlobalFonts.registerFromPath(join(process.env.FONT_DIR, 'DejaVuSans.ttf'), 'Sans');
const out = process.argv[2] || 'wards.png';
const CAPS = [46, 50, 56, 62, 68];   // by main-path tier (the Longeye is the tall one)

const STATES = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0], [0, 4, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [4, 2, 0], [0, 2, 4], [2, 0, 4]];
const skins = Object.keys(SKINS);
const types = [...new Set(skins.flatMap((s) => Object.keys(SKINS[s].art)))];
let bad = 0;
for (const s of skins) for (const t of types) if (!SKINS[s].art[t]) { console.log(`MISSING: ${t} has no ${SKINS[s].name} art`); bad++; }

// Height above the footprint: render at 1x on a clear canvas and find the topmost opaque pixel.
// Body-and-face rule: draw only the live gear (face parts skip themselves via FACE.skip) and measure
// how much of the ward's body box (art.self) it covers, worst case over eight aim directions.
const COVER = 0.3;
function coverage(art, type, tiers) {
  const P = { ...mainPath(tiers), tiers }, d = WARD_DMG[type], box = art.self(P), Z = 3, N = 160;
  let worst = 0;
  FACE.skip = true;
  for (let k = 0; k < 8; k++) {
    const c = createCanvas(N, N), ctx = c.getContext('2d');
    ctx.translate(N / 2, N * 0.72); ctx.scale(Z, Z); ctx.translate(0, -11);
    art.front(ctx, P, { ang: (k / 8) * Math.PI * 2, recoil: 0, time: 0.3 + k * 0.4, pulse: 0, fire: 0, pop: 0, id: 1 }, d);
    const px = ctx.getImageData(0, 0, N, N).data;
    const x0 = Math.round(N / 2 + box[0] * Z), x1 = Math.round(N / 2 + box[2] * Z), y0 = Math.round(N * 0.72 + (box[1] - 11) * Z), y1 = Math.round(N * 0.72 + (box[3] - 11) * Z);
    let hit = 0, all = 0;
    for (let y = Math.max(0, y0); y < Math.min(N, y1); y++) for (let x = Math.max(0, x0); x < Math.min(N, x1); x++) { all++; if (px[(y * N + x) * 4 + 3] > 110) hit++; }
    worst = Math.max(worst, all ? hit / all : 0);
  }
  FACE.skip = false;
  return worst;
}

// Worst case over eight aim directions (an aimed part pointing up the screen stands tallest).
function height(type, tiers) {
  let worst = 0;
  initWardArt(() => createCanvas(1, 1), 1);
  for (let k = 0; k < 8; k++) {
    const c = createCanvas(120, 120), ctx = c.getContext('2d');
    drawWard(ctx, { type, tiers, x: 60, y: 90, id: 1 }, { ang: (k / 8) * Math.PI * 2, recoil: 0, time: 0.3, pulse: 0, fire: 0, pop: 0, id: 1 });
    const px = ctx.getImageData(0, 0, 120, 120).data;
    let top = 120;
    for (let y = 0; y < 120 && top === 120; y++) for (let x = 0; x < 120; x++) if (px[(y * 120 + x) * 4 + 3] > 60) { top = y; break; }
    worst = Math.max(worst, 90 + (14 - 11) * wardScale(tiers) - top);
  }
  return worst;
}

const Z = 2, CW = 70 * Z, CH = 80 * Z, LBL = 18;
const W = 90 + STATES.length * CW, H = types.length * skins.length * (CH + LBL) + 30;
const sheet = createCanvas(W, H), g = sheet.getContext('2d');
g.fillStyle = '#2f9a74'; g.fillRect(0, 0, W, H);
g.font = '12px Sans, sans-serif'; g.fillStyle = '#fff';
STATES.forEach((s, i) => g.fillText(s.join('/'), 90 + i * CW + CW / 2 - 14, 18));
let row = 0;
for (const t of types) for (const s of skins) {
  setSkin(s);
  const y0 = 30 + row * (CH + LBL);
  g.fillStyle = '#fff'; g.fillText(`${t}`, 6, y0 + CH / 2); g.fillText(SKINS[s].name, 6, y0 + CH / 2 + 15);
  STATES.forEach((tiers, i) => {
    const art = SKINS[s].art[t];
    if (!art.self) { if (!i) { console.log(`NO BODY BOX: ${t} (${SKINS[s].name}) has no self(); can't check the body-and-face rule`); bad++; } }
    else { const cv = coverage(art, t, tiers); if (cv > COVER) { console.log(`GEAR COVERS BODY: ${t} ${tiers.join('/')} (${SKINS[s].name}) covers ${(cv * 100).toFixed(0)}% of its body box (max ${COVER * 100}%)`); bad++; } }
    const h = height(t, tiers), cap = CAPS[Math.max(...tiers)];
    const over = h > cap;
    if (over) { console.log(`TOO TALL: ${t} ${tiers.join('/')} (${SKINS[s].name}) stands ${h.toFixed(1)} px (cap ${cap})`); bad++; }
    initWardArt(() => createCanvas(1, 1), Z);
    g.save(); g.translate(90 + i * CW, y0); g.scale(Z, Z);
    drawWard(g, { type: t, tiers, x: 35, y: 62, id: i }, { ang: 0.6, recoil: 0, time: 0.3 + i, pulse: 0, fire: 0, pop: 0, id: i });
    g.restore();
    g.fillStyle = over ? '#ff6060' : '#d8ffe8'; g.fillText(`${h.toFixed(0)}px`, 90 + i * CW + 4, y0 + CH + 12);
  });
  row++;
}
writeFileSync(out, sheet.toBuffer('image/png'));
console.log(`wrote ${out}: ${types.length} wards x ${skins.length} skins${bad ? `, ${bad} problem(s)` : ', all within the cap'}`);
process.exit(bad ? 1 : 0);
