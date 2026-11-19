// A crude, repeatable "blend" metric. Each ward state (base, T2 and T4 on each path) is rendered at
// real size, blurred like a glance, and shrunk to a 16x16 colour thumbnail. Then:
//   nearest-neighbour accuracy: for each tier 2+ state, is the most similar OTHER state the same
//     ward (good) or a different ward (a blend)? Base states are excluded as queries.
//   ward/path ratio: mean distance between different wards on the same path and tier, divided by
//     mean distance between the same ward on different paths at the same tier. Below 1 means wards
//     look more alike than a ward's own paths do (column sameness).
// It is a proxy for glance-reading, not a substitute for playtesting.
import { createCanvas, turf } from './sheet.mjs';
import { STATES, ST } from './wardsheets.mjs';

const C = 76, T = 16;

function thumb(draw, type, tiers) {
  const cv = createCanvas(C, C), ctx = cv.getContext('2d');
  turf(ctx, 0, 0, C, C, 3);
  ctx.translate(C / 2, C / 2);
  draw(ctx, type, tiers, { ...ST });
  const small = createCanvas(T, T), s = small.getContext('2d');
  s.filter = 'blur(1.5px)';
  s.drawImage(cv, 0, 0, T, T);
  return s.getImageData(0, 0, T, T).data;
}

function dist(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i += 4) {
    const dr = a[i] - b[i], dg = a[i + 1] - b[i + 1], db = a[i + 2] - b[i + 2];
    d += dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
  }
  return Math.sqrt(d / (a.length / 4));
}

export function blendMetrics(draw, wards) {
  const items = [];
  for (const w of wards) for (const s of STATES) items.push({ ward: w.type, s, px: thumb(draw, w.type, s.tiers) });
  let hits = 0, n = 0;
  const confusions = [];
  for (const a of items) {
    if (a.s.key === 'base') continue;
    let best = null, bd = Infinity;
    for (const b of items) {
      if (a === b) continue;
      const d = dist(a.px, b.px);
      if (d < bd) { bd = d; best = b; }
    }
    n++;
    if (best.ward === a.ward) hits++;
    else confusions.push(`${a.ward} ${a.s.key} ~ ${best.ward} ${best.s.key}`);
  }
  let sameCol = 0, nc = 0, sameRow = 0, nr = 0;
  for (const a of items) for (const b of items) {
    if (a === b || a.s.key === 'base' || b.s.key === 'base') continue;
    const tierA = a.s.key.slice(2), tierB = b.s.key.slice(2);
    if (tierA !== tierB) continue;
    if (a.ward !== b.ward && a.s.key === b.s.key) { sameCol += dist(a.px, b.px); nc++; }
    if (a.ward === b.ward && a.s.key !== b.s.key) { sameRow += dist(a.px, b.px); nr++; }
  }
  return { nnAccuracy: hits / n, hits, n, ratio: (sameCol / nc) / (sameRow / nr), confusions };
}
