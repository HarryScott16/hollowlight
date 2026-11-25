// Tables for docs/tier5-report.md from the runs tools/t5study.js wrote (JSON lines; averaged in
// tools/t5data.js, which also explains W1, E41 and late DPS). Charts: tools/t5charts.js.
//   node tools/t5report.js <hollowmere.jsonl> [other-map.jsonl ...]   (markdown on stdout)
import { TOWERS } from '../public/js/data/towers.js';
import { load, CAUSES, wardName, noAttack, mean } from './t5data.js';

const files = process.argv.slice(2);
if (!files.length) { console.log('usage: node tools/t5report.js <runs.jsonl> [more.jsonl ...]'); process.exit(1); }
const { runs, MAIN, cell, paths, ranked } = load(files);
const f1 = (x) => (Number.isNaN(x) ? '-' : (Math.round(x * 10) / 10).toString());
const k = (x) => (x >= 1e6 ? `${(x / 1e6).toFixed(1)}M` : x >= 1e4 ? `${Math.round(x / 1e3)}k` : x >= 1e3 ? `${(x / 1e3).toFixed(1)}k` : String(Math.round(x)));
const powerRank = new Map(paths.slice().sort((a, b) => b.full - a.full || b.late - a.late).map((p, i) => [p, i + 1]));
const W = (c) => (c ? `${f1(c.waves)}${c.capped ? '+' : ''}${c.timedOut ? '*' : ''}` : '-');

const out = [];
const P = (s = '') => out.push(s);
P(`### Ranking (${MAIN}, Medium)`);
P();
P('Ranked by the plain game (alone): W1 + E41. "Power" ranks the same 36 by the full condition (Veiled revealed and flyers targetable), i.e. raw damage with the blind spots removed. Late DPS and kills are from the full condition from wave 41 and the alone condition from wave 1. Cost is the ward plus tiers 1-5 and the secondary tier 2.');
P();
P('| # | Tier 5 | Ward (path) | Cost | Alone W1 | Alone E41 | Reveal W1 | Reveal E41 | Full W1 | Full E41 | Power # | Late DPS | Kills (alone W1) | 2nd path |');
P('|--:|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|---|');
ranked.forEach((p, i) => {
  const c = p.c, a1 = c['5alone1'];
  const minor = a1 ? TOWERS[p.type].paths[a1.minor].name : '-';
  P(`| ${i + 1} | **${p.name}** | ${wardName[p.type]} (${p.pname}) | ${k(a1 ? a1.cost : 0)} | ${W(c['5alone1'])} | ${W(c['5alone41'])} | ${W(c['5reveal1'])} | ${W(c['5reveal41'])} | ${W(c['5full1'])} | ${W(c['5full41'])} | ${powerRank.get(p)} | ${noAttack(p.type) ? '-' : k(p.late)} | ${a1 ? k(a1.kills) : '-'} | ${minor} |`);
});
P();
P('`+`: some seed reached the 150-wave cap. `*`: some seed stalled (a wave still running after 900 s counts as a loss).');
P();

P('### Tier 5 against its tier 4 (same placement and secondary path)');
P();
P('| Tier 5 | Tier 4 | Cost T4 -> T5 | Alone W1 T4 -> T5 | Alone E41 T4 -> T5 | Full W1 T4 -> T5 | Full E41 T4 -> T5 | Late DPS T4 -> T5 | DPS x |');
P('|---|---|--:|--:|--:|--:|--:|--:|--:|');
for (const p of ranked) {
  const c = p.c, a = (key) => W(c[key]);
  const cost4 = c['4alone1'] ? c['4alone1'].cost : 0, cost5 = c['5alone1'] ? c['5alone1'].cost : 0;
  const x = p.late4 > 0 ? (p.late / p.late4).toFixed(1) : '-';
  P(`| ${p.name} (${wardName[p.type]}, ${p.pname}) | ${p.t4} | ${k(cost4)} -> ${k(cost5)} | ${a('4alone1')} -> ${a('5alone1')} | ${a('4alone41')} -> ${a('5alone41')} | ${a('4full1')} -> ${a('5full1')} | ${a('4full41')} -> ${a('5full41')} | ${noAttack(p.type) ? '-' : `${k(p.late4)} -> ${k(p.late)}`} | ${noAttack(p.type) ? '-' : x} |`);
}
P();

P('### What broke it (lives lost by cause, % of all lives lost; from wave 1)');
P();
P('Each leak is put down to the first of: boss; Veiled (alone, and it can\'t see Veiled); flyer (it can\'t hit flyers, in the conditions that don\'t give it that); shielded (Aegis); healed (a Mender, or anything a Mender patched); armour (resists its damage type: Husks and the Bastion against Kinetic, Nullbacks against Arcane); hulk (Dreadhulk, Gloomcolossus); otherwise sheer numbers. "Top leaks" are the enemy types that cost it the most lives, alone from wave 1.');
P();
const pct = (c) => {
  if (!c) return '-';
  const tot = Object.values(c.causes).reduce((x, y) => x + y, 0) || 1;
  return CAUSES.filter((x) => c.causes[x] / tot >= 0.05).sort((a, b) => c.causes[b] - c.causes[a]).map((x) => `${x} ${Math.round((100 * c.causes[x]) / tot)}%`).join(', ') || '-';
};
P('| Tier 5 | Alone | Reveal | Full | Top leaks (alone) |');
P('|---|---|---|---|---|');
for (const p of ranked) {
  const c = p.c['5alone1'];
  const top = c ? Object.entries(c.leaks).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `${t} ${Math.round(n)}`).join(', ') : '-';
  P(`| ${p.name} (${wardName[p.type]}, ${p.pname}) | ${pct(p.c['5alone1'])} | ${pct(p.c['5reveal1'])} | ${pct(p.c['5full1'])} | ${top} |`);
}
P();

// Support wards beside a partner.
const sup = runs.filter((r) => r.kind === 'support' && r.map === MAIN);
if (sup.length) {
  P('### Beacon and Ember Vault beside a partner');
  P();
  P(`The partner is a Bolt Ward, Twin-shot tier 4 with Ballista 2 (hits flyers, can't see Veiled), on its best spot; the tier 5 stands right beside it. Best secondary path of the two shown. "Reveal" turns on the reveal switch for the partner.`);
  P();
  P('| Tier 5 | 2nd path | Alone W1 | Alone E41 | Reveal W1 | Reveal E41 | Partner late DPS (reveal, E41) |');
  P('|---|---|--:|--:|--:|--:|--:|');
  const rows = [['none', -1, 'partner alone'], ['beacon', 0], ['beacon', 1], ['beacon', 2], ['vault', 0], ['vault', 1], ['vault', 2]];
  for (const [type, path, label] of rows) {
    let best = null;
    for (const minor of path < 0 ? [0] : [0, 1, 2].filter((q) => q !== path)) {
      const get = (cond, start) => {
        const rs = sup.filter((r) => r.type === type && r.path === path && r.minor === minor && r.cond === cond && r.start === start);
        return rs.length ? { waves: mean(rs.map((r) => (start > 1 ? r.cleared - 40 : r.cleared))), late: mean(rs.map((r) => r.dpsLate)) } : null;
      };
      const row = { minor, a1: get('alone', 1), a41: get('alone', 41), r1: get('reveal', 1), r41: get('reveal', 41) };
      row.s = ['a1', 'a41', 'r1', 'r41'].reduce((s, key) => s + (row[key] ? row[key].waves : 0), 0);
      if (!best || row.s > best.s) best = row;
    }
    const name = label || `${TOWERS[type].paths[path].tiers[4].name} (${wardName[type]}, ${TOWERS[type].paths[path].name})`;
    const v = (x) => (x ? f1(x.waves) : '-');
    P(`| ${name} | ${path < 0 ? '-' : TOWERS[type].paths[best.minor].name} | ${v(best.a1)} | ${v(best.a41)} | ${v(best.r1)} | ${v(best.r41)} | ${best.r41 ? k(best.r41.late) : '-'} |`);
  }
  P();
}

// Other maps: whatever was run there.
for (const map of [...new Set(runs.map((r) => r.map))].filter((m) => m !== MAIN)) {
  P(`### Spot check on ${map} (Medium)`);
  P();
  P(`| Tier 5 | Alone W1 (${MAIN} -> ${map}) | Alone E41 | Full W1 | Full E41 |`);
  P('|---|--:|--:|--:|--:|');
  for (const p of ranked) {
    const o = (cond, start) => cell(map, p.type, p.path, 5, cond, start);
    if (!o('alone', 1) && !o('full', 1)) continue;
    const pair = (cond, start) => `${W(p.c[`5${cond}${start}`])} -> ${W(o(cond, start))}`;
    P(`| ${p.name} (${wardName[p.type]}, ${p.pname}) | ${pair('alone', 1)} | ${pair('alone', 41)} | ${pair('full', 1)} | ${pair('full', 41)} |`);
  }
  P();
}
console.log(out.join('\n'));
