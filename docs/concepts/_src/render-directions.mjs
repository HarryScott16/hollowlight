// Renders the concept directions into docs/concepts/<direction>/ and prints the blend metric for
// each (plus the current art, for comparison).
//   node render-directions.mjs [lanterns|kindlings|waystones ...]   (default: all)
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderSet } from './wardsheets.mjs';
import { blendMetrics } from './metrics.mjs';
import { TOWERS, TOWER_ORDER } from '../../../public/js/data/towers.js';
import { WARD_SPEC, DMG } from './kit.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const WARDS = TOWER_ORDER.map((type) => ({
  type, name: TOWERS[type].name, paths: TOWERS[type].paths.map((p) => p.name),
  sub: `${WARD_SPEC[type].family} · ${DMG[WARD_SPEC[type].dmg].name.replace(/ \(.*/, '')}`,
}));

export const DIRECTIONS = {
  lanterns: { title: 'A · Lanterns', file: './dir-lanterns.mjs' },
  kindlings: { title: 'B · Kindlings', file: './dir-kindlings.mjs' },
  waystones: { title: 'C · Waystones', file: './dir-waystones.mjs' },
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const which = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(DIRECTIONS);
  for (const key of which) {
    const { draw } = await import(DIRECTIONS[key].file);
    renderSet({ draw, wards: WARDS, out: resolve(here, '..', key), title: DIRECTIONS[key].title });
    const m = blendMetrics(draw, WARDS);
    console.log(`${key}: nearest-neighbour same-ward ${m.hits}/${m.n} (${Math.round(m.nnAccuracy * 100)}%), ward/path distance ratio ${m.ratio.toFixed(2)}`);
    if (m.confusions.length) console.log('  confusions:', m.confusions.join('; '));
    if (key === 'lanterns') { // with the proposed height cap: scaled 0.75 about the footprint (y = +22)
      const capped = (ctx, t, tiers, st) => { ctx.save(); ctx.translate(0, 22); ctx.scale(0.75, 0.75); ctx.translate(0, -22); draw(ctx, t, tiers, st); ctx.restore(); };
      const c = blendMetrics(capped, WARDS);
      console.log(`lanterns (height-capped x0.75): nearest-neighbour same-ward ${c.hits}/${c.n} (${Math.round(c.nnAccuracy * 100)}%), ratio ${c.ratio.toFixed(2)}`);
    }
  }
}
