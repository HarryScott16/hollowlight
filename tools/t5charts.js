// Charts and the sortable summary table for docs/tier5-report.md, from the same runs as
// tools/t5report.js (averaged in tools/t5data.js).
//   node tools/t5charts.js <hollowmere.jsonl>
// Writes docs/tier5-charts/{ranking,vs-tier4,causes,wards}.svg and replaces the summary table
// between the <!-- t5charts:summary --> markers in docs/tier5-report.md.
// The SVGs are plain files (they open on their own and on GitHub) with light colours as attributes
// and dark ones in a prefers-color-scheme rule. Each mark's <title> is its tooltip; the docs page
// on :3002 inlines the SVGs and shows those titles as hover tooltips.
// "Waves" here are W1: the last wave cleared starting at wave 1, ward pre-built (mean of 3 seeds).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { TOWERS, TOWER_ORDER } from '../public/js/data/towers.js';
import { load, wardName } from './t5data.js';

const files = process.argv.slice(2);
if (!files.length) { console.log('usage: node tools/t5charts.js <hollowmere.jsonl>'); process.exit(1); }
const { paths } = load(files);
const DOC = new URL('../docs/tier5-report.md', import.meta.url);
const DIR = new URL('../docs/tier5-charts/', import.meta.url);
mkdirSync(DIR, { recursive: true });

// ---- data -------------------------------------------------------------------------------
for (const p of paths) {
  p.wA = p.c['5alone1'].waves; p.wR = p.c['5reveal1'].waves; p.wF = p.c['5full1'].waves;
  p.eA = p.c['5alone41'].waves; p.eF = p.c['5full41'].waves;
  p.w4A = p.c['4alone1'].waves; p.w4F = p.c['4full1'].waves;
  const causes = p.c['5alone1'].causes, tot = Object.values(causes).reduce((a, b) => a + b, 0) || 1;
  p.share = Object.fromEntries(Object.entries(causes).map(([k, v]) => [k, v / tot]));
  p.empty = p.wA <= 2;   // nothing it does stops wave 3: the same as an empty map
  p.top = Object.entries(p.share).sort((a, b) => b[1] - a[1])[0];
}
// Chart order: waves alone from wave 1, then alone from wave 41, then with every blind spot removed.
const order = paths.slice().sort((a, b) => b.wA - a.wA || b.eA - a.eA || b.wF - a.wF || a.name.localeCompare(b.name));
order.forEach((p, i) => { p.rank = i + 1; });

// ---- colours (validated: dataviz palette slots 1-7, against the page's light and dark surfaces) --
const COL = {
  surf: ['#f6f4fb', '#15131d'], ink: ['#1f1b2b', '#ebe7f5'], ink2: ['#4a4560', '#c4bfd6'], muted: ['#77718c', '#8f89a6'],
  grid: ['#e2ddef', '#2a2638'], base: ['#bdb6cf', '#4a4460'], band: ['#d3eee3', '#183a2e'], boss: ['#ece8f6', '#201c2c'],
  s1: ['#2a78d6', '#3987e5'], s2: ['#eb6834', '#d95926'], s3: ['#1baf7a', '#199e70'], s4: ['#eda100', '#c98500'],
  s5: ['#e87ba4', '#d55181'], s6: ['#008300', '#008300'], s7: ['#6250d6', '#9085e9'], gray: ['#b4aec4', '#5d5872'],
  onfill: ['#ffffff', '#ffffff'], ondark: ['#0b0b0b', '#0b0b0b'], ongray: ['#0b0b0b', '#ffffff'],
};
const fill = (c) => `class="t5f-${c}" fill="${COL[c][0]}"`;
const stroke = (c) => `class="t5s-${c}" stroke="${COL[c][0]}"`;
// A filled mark with a ring in the surface colour (one class attribute for both).
const ringed = (c) => `class="t5f-${c} t5s-surf" fill="${COL[c][0]}" stroke="${COL.surf[0]}"`;
const STYLE = `<style>
.t5c text{font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
@media (prefers-color-scheme:dark){${Object.entries(COL).map(([c, [, d]]) => `.t5f-${c}{fill:${d}}.t5s-${c}{stroke:${d}}`).join('')}}
</style>`;
const COND = { alone: 's1', reveal: 's2', full: 's3' };
// Causes of lost lives, in stack order; "numbers" (sheer numbers, no single weakness) is grey.
const CAUSE = [['veiled', 'Veiled', 's1'], ['flyers', 'flyers', 's2'], ['armour', 'armour', 's3'], ['shields', 'shields', 's4'],
  ['healers', 'healers', 's5'], ['hulks', 'hulks', 's6'], ['bosses', 'bosses', 's7'], ['numbers', 'numbers', 'gray']];
const causeOf = Object.fromEntries(CAUSE.map(([k, label, c]) => [k, { label, c }]));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f1 = (x) => String(Math.round(x * 10) / 10);
const k = (x) => (x >= 1e4 ? `${Math.round(x / 1e3)}k` : x >= 1e3 ? `${(x / 1e3).toFixed(1)}k` : String(Math.round(x)));
const R = (x) => Math.round(x * 10) / 10;
const svg = (w, h, title, desc, body) => `<svg xmlns="http://www.w3.org/2000/svg" class="t5c" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t5t-${title.id} t5d-${title.id}">
<title id="t5t-${title.id}">${esc(title.text)}</title><desc id="t5d-${title.id}">${esc(desc)}</desc>
${STYLE}
<rect width="${w}" height="${h}" ${fill('surf')}/>
${body}
</svg>
`;
const text = (x, y, s, o = {}) => `<text x="${R(x)}" y="${R(y)}" font-size="${o.size || 12}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.weight ? ` font-weight="${o.weight}"` : ''} ${fill(o.c || 'ink2')}>${s}</text>`;
const line = (x1, y1, x2, y2, c, w = 1, extra = '') => `<line x1="${R(x1)}" y1="${R(y1)}" x2="${R(x2)}" y2="${R(y2)}" ${stroke(c)} stroke-width="${w}"${extra}/>`;
// A bar with a 4px rounded data end, square at the baseline.
const bar = (x, y, w, h, c) => {
  if (w <= 0) return '';
  const r = Math.min(4, w, h / 2);
  return `<path d="M${R(x)},${R(y)}h${R(w - r)}a${r},${r} 0 0 1 ${r},${r}v${R(h - 2 * r)}a${r},${r} 0 0 1 -${r},${r}h-${R(w - r)}z" ${fill(c)}/>`;
};
const label = (x, y, p, o = {}) => text(x, y, `<tspan font-weight="600" ${fill('ink')}>${esc(p.name)}</tspan><tspan font-size="11" ${fill('muted')}> ${esc(o.short ? p.pname : `${p.ward}, ${p.pname}`)}</tspan>`, { anchor: 'end', c: 'ink2' });
const tipWaves = (p) => `${p.name} (${p.ward}, ${p.pname})\nAlone: wave ${f1(p.wA)} (from wave 41: +${f1(p.eA)})\nVeiled revealed: wave ${f1(p.wR)}\nVeiled revealed + flyers: wave ${f1(p.wF)} (from wave 41: +${f1(p.eF)})`;

// The three conditions on one row: a bar for alone, an orange tick for Veiled revealed and an aqua
// dot for revealed + flyers hittable, joined to the bar's end by a thin line.
function condRow(p, y, X, h) {
  const xa = X(p.wA), xr = X(p.wR), xf = X(p.wF), far = Math.max(xr, xf);
  return `<g class="t5tip"><title>${esc(tipWaves(p))}</title>
<rect x="${X(0)}" y="${R(y - 9)}" width="${R(far - X(0) + 12)}" height="18" fill="#000" fill-opacity="0"/>
${bar(X(0), y - h / 2, xa - X(0), h, COND.alone)}
${far > xa + 1 ? line(xa, y, far, y, 'muted', 1) : ''}
${line(xr, y - 8, xr, y + 8, COND.reveal, 2.5)}
<circle cx="${R(xf)}" cy="${R(y)}" r="4.5" ${ringed(COND.full)} stroke-width="2"/></g>`;
}
const condLegend = (x, y) => {
  const items = [
    [(cx) => bar(cx, y - 5, 18, 10, COND.alone), 'Alone (the ward as it is)'],
    [(cx) => line(cx + 9, y - 8, cx + 9, y + 8, COND.reveal, 2.5), 'Veiled revealed'],
    [(cx) => `<circle cx="${cx + 9}" cy="${y}" r="4.5" ${ringed(COND.full)} stroke-width="2"/>`, 'Veiled revealed and flyers hittable'],
  ];
  let cx = x, out = '';
  for (const [mark, t] of items) { out += mark(cx) + text(cx + 24, y + 4, t, { c: 'ink' }); cx += 24 + t.length * 6.4 + 26; }
  return out;
};
// Boss waves as shaded columns behind the plot, named along the top.
const BOSSES = [[10, 'Gravemaw'], [20, 'Veilmother'], [30, 'Bastion'], [40, 'Hollow King']];
function waveAxis(X, top, bottom, max) {
  let out = '';
  for (const [w, name] of BOSSES) out += `<rect x="${R(X(w - 0.5))}" y="${top}" width="${R(X(1) - X(0))}" height="${bottom - top}" ${fill('boss')}/>` + text(X(w), top - 6, name, { anchor: 'middle', size: 11, c: 'muted' });
  for (let w = 0; w <= max; w += 10) out += line(X(w), top, X(w), bottom, 'grid', 1) + text(X(w), bottom + 16, w === 0 ? '0' : `wave ${w}`, { anchor: 'middle', size: 11, c: 'muted' });
  return out + line(X(0), top, X(0), bottom, 'base', 1);
}

// ---- 1. ranking -----------------------------------------------------------------------------
{
  const L = 300, RW = 640, max = 60, X = (w) => L + (RW * w) / max;
  const top = 74, row = 19, bottom = top + order.length * row + 4, H = bottom + 30;
  let body = text(10, 22, 'Waves cleared from wave 1, each tier 5 alone on Hollowmere (Medium)', { weight: 600, c: 'ink', size: 14 });
  body += condLegend(10, 46);
  body += waveAxis(X, top, bottom, max);
  order.forEach((p, i) => {
    const y = top + i * row + row / 2 + 2;
    body += label(L - 10, y + 4, p) + condRow(p, y, X, 11);
    const gv = p.wR - p.wA, gf = p.wF - p.wR, parts = [];
    if (gv >= 5) parts.push(`Veiled +${Math.round(gv)}`);
    if (gf >= 5) parts.push(`flyers +${Math.round(gf)}`);
    if (gv + gf >= 10) body += text(Math.max(X(p.wR), X(p.wF)) + 10, y + 4, `blind: ${parts.join(', ')}`, { size: 11, c: 'ink2' });
  });
  const empties = order.filter((p) => p.empty);
  if (empties.length) {
    const y0 = top + (empties[0].rank - 1) * row + 4, y1 = top + empties.at(-1).rank * row;
    body += line(X(2) + 22, y0 + 2, X(2) + 22, y1 - 2, 'muted', 1) + text(X(2) + 30, (y0 + y1) / 2 + 4, `${empties.length} that stop nothing on their own: wave 2, the same as an empty map`, { size: 11, c: 'ink2' });
  }
  writeFileSync(new URL('ranking.svg', DIR), svg(1100, H, { id: 'rank', text: 'Tier 5 ranking: waves cleared alone' },
    'All 36 tier 5s sorted by waves cleared alone from wave 1, with the waves they clear when Veiled are revealed and when flyers can be hit too.', body));
}

// ---- 2. tier 5 against tier 4 ----------------------------------------------------------------
{
  const rows = paths.filter((p) => p.x4).sort((a, b) => b.x4 - a.x4);
  const L = 300, RW = 600, lo = 0.5, hi = 20, X = (v) => L + (RW * Math.log(v / lo)) / Math.log(hi / lo);
  const top = 70, row = 21, bottom = top + rows.length * row + 4, H = bottom + 50;
  let body = text(10, 22, 'How many times its tier 4\'s damage each tier 5 deals (late DPS, every blind spot removed)', { weight: 600, c: 'ink', size: 14 });
  body += `<rect x="${R(X(3))}" y="${top}" width="${R(X(5) - X(3))}" height="${bottom - top}" ${fill('band')}/>`;
  body += text((X(3) + X(5)) / 2, top - 8, 'intended: 3-5x', { anchor: 'middle', size: 11, c: 'ink', weight: 600 });
  for (const v of [0.5, 1, 2, 3, 5, 10, 20]) body += line(X(v), top, X(v), bottom, v === 1 ? 'base' : 'grid', v === 1 ? 1.5 : 1) + text(X(v), bottom + 16, `${v}x`, { anchor: 'middle', size: 11, c: 'muted' });
  body += text(X(1), top - 8, 'same as tier 4', { anchor: 'middle', size: 11, c: 'muted' });
  rows.forEach((p, i) => {
    const y = top + i * row + row / 2 + 2, x = X(p.x4), x1 = X(1);
    const tip = `${p.name} (${p.ward}, ${p.pname}) against ${p.t4}\nLate DPS: ${k(p.late4)} -> ${k(p.late)} (${p.x4.toFixed(1)}x)\nWaves alone: ${f1(p.w4A)} -> ${f1(p.wA)}; blind spots removed: ${f1(p.w4F)} -> ${f1(p.wF)}`;
    const off = p.x4 < 3 || p.x4 > 5;
    body += label(L - 10, y + 4, p);
    body += `<g class="t5tip"><title>${esc(tip)}</title><rect x="${R(Math.min(x, x1) - 6)}" y="${R(y - 9)}" width="${R(Math.abs(x - x1) + 70)}" height="18" fill="#000" fill-opacity="0"/>`;
    body += line(x1, y, x, y, 's1', 2) + `<circle cx="${R(x)}" cy="${R(y)}" r="5" ${ringed('s1')} stroke-width="2"/>`;
    body += text(x + (p.x4 >= 1 ? 10 : -10), y + 4, `${p.x4.toFixed(1)}x${p.late4 < 500 ? `  (its tier 4 dealt only ${Math.round(p.late4)} DPS)` : ''}`, { size: 11.5, anchor: p.x4 >= 1 ? 'start' : 'end', c: off ? 'ink' : 'ink2', weight: p.x4 < 1.6 ? 600 : 400 });
    body += '</g>';
  });
  body += text(10, H - 12, 'Late DPS: damage per second over the last 3 waves it played, from wave 41 in endless, Veiled revealed and flyers hittable. The 3 Beacons and 3 Ember Vaults deal no damage, so have no ratio.', { size: 11, c: 'muted' });
  writeFileSync(new URL('vs-tier4.svg', DIR), svg(1100, H, { id: 'x4', text: 'Tier 5 against tier 4: late damage ratio' },
    'For the 30 tier 5s that deal damage, late DPS as a multiple of their tier 4 on a log scale, with the intended 3 to 5 times shaded.', body));
}

// ---- 3. what killed them ----------------------------------------------------------------------
{
  const L = 300, RW = 680, X = (f) => L + RW * f;
  const top = 80, row = 19, h = 13, bottom = top + order.length * row + 4, H = bottom + 30;
  let body = text(10, 22, 'What their lives were lost to, alone from wave 1 (share of all 150 lives)', { weight: 600, c: 'ink', size: 14 });
  let lx = 10;
  for (const [, labelText, c] of CAUSE) { body += `<rect x="${lx}" y="38" width="14" height="12" rx="2" ${fill(c)}/>` + text(lx + 20, 48, labelText, { c: 'ink' }); lx += 20 + labelText.length * 6.6 + 22; }
  body += text(10, 68, 'Each lost life goes to the first that fits: boss, Veiled it can\'t see, flyer it can\'t hit, shielded, healed, armoured against its damage, hulk, otherwise sheer numbers (grey).', { size: 11, c: 'muted' });
  for (const f of [0, 0.25, 0.5, 0.75, 1]) body += text(X(f), bottom + 16, `${f * 100}%`, { anchor: 'middle', size: 11, c: 'muted' });
  order.forEach((p, i) => {
    const y = top + i * row + row / 2 + 2;
    body += label(L - 10, y + 4, p);
    const parts = CAUSE.filter(([key]) => p.share[key] > 0.001);
    const tip = `${p.name} (${p.ward}, ${p.pname}), alone from wave 1, lost wave ${Math.floor(p.wA) + 1}\n` + parts.map(([key, l]) => `${l}: ${Math.round(p.share[key] * 100)}%`).join('\n') + (p.empty ? '\n(it stops nothing on its own: wave 2 is an empty map)' : '');
    body += `<g class="t5tip"><title>${esc(tip)}</title>`;
    let x = X(0);
    parts.forEach(([key, , c], j) => {
      const w = RW * p.share[key], gap = j < parts.length - 1 ? 2 : 0;
      body += `<rect x="${R(x)}" y="${R(y - h / 2)}" width="${R(Math.max(0.5, w - gap))}" height="${h}" rx="2" ${fill(c)}/>`;
      const pc = `${Math.round(p.share[key] * 100)}%`;
      // Only where the label fits inside its segment (a generous width per character); the rest is in the tooltip and legend.
      const t = `${causeOf[key].label} ${pc}`;
      if (w - gap >= t.length * 6.6 + 12) body += text(x + 6, y + 4, t, { size: 10.5, c: c === 's4' ? 'ondark' : c === 'gray' ? 'ongray' : 'onfill', weight: key === 'numbers' ? 400 : 600 });
      x += w;
    });
    body += '</g>';
    if (p.empty) body += text(X(1) + 8, y + 4, 'stops nothing', { size: 11, c: 'muted' });
  });
  writeFileSync(new URL('causes.svg', DIR), svg(1100, H, { id: 'causes', text: 'What killed each tier 5' },
    'For each tier 5 alone from wave 1, the share of lost lives put down to Veiled, flyers, armour, shields, healers, hulks, bosses or sheer numbers.', body));
}

// ---- 4. grouped by ward ------------------------------------------------------------------------
{
  const colW = 545, L = 215, RW = 250, max = 60, rowH = 21, panelH = 30 + 3 * rowH + 14, top = 66;
  const H = top + Math.ceil(TOWER_ORDER.length / 2) * panelH + 24;
  let body = text(10, 22, 'Each ward\'s three tier 5s side by side: waves cleared from wave 1', { weight: 600, c: 'ink', size: 14 });
  body += condLegend(10, 46);
  TOWER_ORDER.forEach((type, i) => {
    const ox = 10 + (i % 2) * colW, oy = top + Math.floor(i / 2) * panelH;
    const X = (w) => ox + L + (RW * w) / max;
    const mine = paths.filter((p) => p.type === type);
    const best = Math.max(...mine.map((p) => p.wF)), worst = Math.min(...mine.map((p) => p.wF));
    body += text(ox, oy + 16, esc(wardName[type]), { weight: 600, c: 'ink', size: 13 });
    if (best - worst >= 15) body += text(X(max), oy + 16, `${Math.round(best - worst)} waves apart with blind spots removed`, { anchor: 'end', size: 11, c: 'ink2' });
    const y0 = oy + 26, y1 = y0 + 3 * rowH;
    for (let w = 0; w <= max; w += 10) body += line(X(w), y0, X(w), y1, w === 0 ? 'base' : 'grid', 1);
    mine.forEach((p, j) => {
      const y = y0 + j * rowH + rowH / 2;
      body += text(ox + L - 10, y + 4, `<tspan font-weight="600" ${fill('ink')}>${esc(p.name)}</tspan><tspan font-size="11" ${fill('muted')}> ${esc(p.pname)}</tspan>`, { anchor: 'end' });
      body += condRow(p, y, X, 11);
      body += text(X(max) + 12, y + 4, p.wF - p.wA >= 1 ? `${f1(p.wA)} / ${f1(p.wF)}` : f1(p.wA), { size: 11, c: 'ink2' });
    });
  });
  body += text(10, H - 8, 'Gridlines every 10 waves, 0 to 60. Numbers on the right: waves alone / with every blind spot removed (one number when they are the same).', { size: 11, c: 'muted' });
  writeFileSync(new URL('wards.svg', DIR), svg(1100, H, { id: 'wards', text: 'Tier 5s grouped by ward' },
    'Small multiples, one per ward, comparing its three tier 5s on waves cleared alone, with Veiled revealed, and with flyers hittable too.', body));
}

// ---- summary table (HTML in the markdown; sortable and coloured on the :3002 page) --------------
{
  const wq = (w) => (w <= 2 ? 'q0' : w < 15 ? 'q1' : w < 30 ? 'q2' : w < 45 ? 'q3' : 'q4');
  const xq = (x) => (x == null ? 'qna' : x < 1.5 ? 'q0' : x < 3 ? 'q1' : x <= 5 ? 'q4' : 'qhi');
  const td = (v, shown, cls = '') => `<td data-v="${esc(typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)}"${cls ? ` class="${cls}"` : ''}>${shown}</td>`;
  const killer = (p) => {
    if (p.empty) return td('zzz', '<span class="t5sw t5sw-none"></span>stops nothing alone', 'kill');
    const [key, share] = p.top;
    return td(`${causeOf[key].label} ${(1 - share).toFixed(3)}`, `<span class="t5sw t5sw-${causeOf[key].c}"></span>${causeOf[key].label} ${Math.round(share * 100)}%`, 'kill');
  };
  const head = [['#', 'num'], ['Tier 5', 'text'], ['Ward', 'text'], ['Path', 'text'], ['Alone', 'num'], ['Veiled revealed', 'num'], ['Veiled + flyers', 'num'], ['vs tier 4', 'num'], ['Cost', 'num'], ['Main killer (alone)', 'text']];
  const rows = order.map((p) => `<tr>${td(p.rank, p.rank, 'r')}${td(p.name, `<strong>${esc(p.name)}</strong>`)}${td(p.ward, esc(p.ward))}${td(p.pname, esc(p.pname))}`
    + `${td(p.wA, f1(p.wA), `r ${wq(p.wA)}`)}${td(p.wR, f1(p.wR), `r ${wq(p.wR)}`)}${td(p.wF, f1(p.wF), `r ${wq(p.wF)}`)}`
    + `${td(p.x4 == null ? -1 : p.x4, p.x4 == null ? 'no damage' : `${p.x4.toFixed(1)}x`, `r ${xq(p.x4)}`)}${td(p.cost, k(p.cost), 'r')}${killer(p)}</tr>`);
  const table = [
    '<div class="t5sum">',
    `<table class="sortable"><thead><tr>${head.map(([h, t]) => `<th data-sort="${t}"${t === 'num' ? ' class="r"' : ''}>${h}</th>`).join('')}</tr></thead>`,
    `<tbody>${rows.join('\n')}</tbody></table>`,
    '</div>',
  ].join('\n');
  const doc = readFileSync(DOC, 'utf8');
  const re = /(<!-- t5charts:summary -->)[\s\S]*?(<!-- \/t5charts:summary -->)/;
  if (!re.test(doc)) { console.log('no <!-- t5charts:summary --> markers in docs/tier5-report.md: table not written'); process.exit(1); }
  writeFileSync(DOC, doc.replace(re, (_, a, b) => `${a}\n${table}\n${b}`));
}
console.log('wrote docs/tier5-charts/{ranking,vs-tier4,causes,wards}.svg and the summary table');
