// Renders every map's painted background (with its Rifts and Heartfire marked) to PNGs, and prints
// each map's road and flight lengths and buildable space (compare with Hollowmere).
//   CANVAS_MODULES=<dir>/node_modules node tools/maps.mjs [outdir]
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { MAPS, MAP_ORDER } from '../public/js/data/maps.js';
import { buildMap } from '../public/js/sim/path.js';
import { paintBackground } from '../public/js/render/background.js';

const req = createRequire(process.env.CANVAS_MODULES ? join(process.env.CANVAS_MODULES, 'x.js') : import.meta.url);
const { createCanvas } = req('@napi-rs/canvas');
const out = process.argv[2] || 'maps';
mkdirSync(out, { recursive: true });
for (const id of MAP_ORDER) {
  const m = buildMap(MAPS[id]);
  const c = createCanvas(m.width, m.height), g = c.getContext('2d');
  paintBackground(g, m);
  for (const r of m.routes) {   // flight lines, dashed
    g.strokeStyle = 'rgba(255,80,200,0.7)'; g.lineWidth = 2; g.setLineDash([8, 8]);
    g.beginPath(); for (let i = 0; i < r.flyPath.count; i += 3) g.lineTo(r.flyPath.xs[i], r.flyPath.ys[i]); g.stroke(); g.setLineDash([]);
  }
  writeFileSync(join(out, `${id}.png`), c.toBuffer('image/png'));
  let n = 0; for (let y = 30; y < m.height; y += 20) for (let x = 30; x < m.width; x += 20) if (m.buildable(x, y)) n++;
  console.log(`${id.padEnd(11)} roads ${m.routes.map((r) => Math.round(r.path.length)).join(' + ')}  flight ${m.routes.map((r) => Math.round(r.flyPath.length)).join(' + ')}  buildable cells ${n}`);
}
