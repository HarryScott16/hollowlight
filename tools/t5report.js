// Tables for docs/tier5-report.md from the runs tools/t5study.js wrote (JSON lines).
//   node tools/t5report.js <hollowmere.jsonl> [other-map.jsonl ...]   (markdown on stdout)
// Waves: "W1" is the last wave cleared starting from wave 1 (the campaign is 40 waves, then
// endless); "E41" is waves cleared past 40 when starting at wave 41 in endless (0 = lost wave 41).
// Means over the seeds. Late DPS: damage per second over the last 3 waves it played.
import { readFileSync } from 'node:fs';
import { TOWERS, TOWER_ORDER } from '../public/js/data/towers.js';
import { ENEMIES } from '../public/js/data/enemies.js';

const files = process.argv.slice(2);
if (!files.length) { console.log('usage: node tools/t5report.js <runs.jsonl> [more.jsonl ...]'); process.exit(1); }
const runs = files.flatMap((f) => readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)));
const MAIN = runs[0].map;
const CONDS = ['alone', 'reveal', 'full'];
const CAUSES = ['veiled', 'flyers', 'armour', 'shields', 'healers', 'hulks', 'numbers', 'bosses'];
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const f1 = (x) => (Number.isNaN(x) ? '-' : (Math.round(x * 10) / 10).toString());
const k = (x) => (x >= 1e6 ? `${(x / 1e6).toFixed(1)}M` : x >= 1e4 ? `${Math.round(x / 1e3)}k` : x >= 1e3 ? `${(x / 1e3).toFixed(1)}k` : String(Math.round(x)));

// One cell: the final runs of a ward/path/tier/condition/start on a map.
function cell(map, type, path, tier, cond, start) {
  const same = (r) => r.kind === 'solo' && r.map === map && r.type === type && r.path === path && r.tier === tier && r.cond === cond && r.start === start;
  const fin = runs.find((r) => same(r) && r.role === 'final');
  if (!fin) return null;
  // The chosen setup's seed-1 run was made while choosing it (role "select"): count it too.
  const rs = runs.filter((r) => same(r) && r.minor === fin.minor && r.spot === fin.spot);
  const causes = {}, leaks = {}, last = {};
  for (const r of rs) {
    for (const c in r.causes) causes[c] = (causes[c] || 0) + r.causes[c] / rs.length;
    for (const c in r.leaks) leaks[c] = (leaks[c] || 0) + r.leaks[c] / rs.length;
    for (const c in r.lastCauses) last[c] = (last[c] || 0) + r.lastCauses[c] / rs.length;
  }
  // Runs from before solo.js put a Snare's flyer leaks under "flyers" in every condition.
  if (TOWERS[type].kind === 'snare' && cond === 'full' && !causes.flyers) {
    for (const [name, n] of Object.entries(leaks)) if (ENEMIES[name.replace('veiled ', '')].flying) { causes.flyers = (causes.flyers || 0) + n; causes.numbers -= n; }
  }
  const cl = rs.map((r) => (start > 1 ? r.cleared - (start - 1) : r.cleared));
  return {
    n: rs.length, waves: mean(cl), lo: Math.min(...cl), hi: Math.max(...cl), capped: rs.some((r) => r.capped), timedOut: rs.some((r) => r.timedOut),
    dps: mean(rs.map((r) => r.dps)), late: mean(rs.map((r) => r.dpsLate)), kills: mean(rs.map((r) => r.kills)), dmg: mean(rs.map((r) => r.dmg)),
    cost: rs[0].cost, minor: rs[0].minor, x: rs[0].x, y: rs[0].y, causes, leaks, last,
  };
}
const paths = TOWER_ORDER.flatMap((type) => [0, 1, 2].map((path) => ({ type, path, name: TOWERS[type].paths[path].tiers[4].name, t4: TOWERS[type].paths[path].tiers[3].name, pname: TOWERS[type].paths[path].name })));
const noAttack = (type) => TOWERS[type].kind === 'aura' || TOWERS[type].kind === 'vault';
const score = (a, b) => (a ? a.waves : 0) + (b ? b.waves : 0);   // W1 + E41
const wardName = { bolt: 'Bolt Ward', mortar: 'Mortar', rime: 'Rime Spire', coil: 'Storm Coil', longeye: 'Longeye', censer: 'Censer', prism: 'Prism', beacon: 'Beacon', snare: 'Thornlight Snare', moth: 'Moth Lantern', wander: 'Wandering Light', vault: 'Ember Vault' };

for (const p of paths) {
  p.c = {};
  for (const tier of [5, 4]) for (const cond of CONDS) for (const start of [1, 41]) p.c[`${tier}${cond}${start}`] = cell(MAIN, p.type, p.path, tier, cond, start);
  const g = (t, c) => score(p.c[`${t}${c}1`], p.c[`${t}${c}41`]);
  p.alone = g(5, 'alone'); p.reveal = g(5, 'reveal'); p.full = g(5, 'full');
  p.alone4 = g(4, 'alone'); p.full4 = g(4, 'full');
  p.late = p.c['5full41'] ? p.c['5full41'].late : 0;
  p.late4 = p.c['4full41'] ? p.c['4full41'].late : 0;
}
const ranked = paths.slice().sort((a, b) => b.alone - a.alone || b.full - a.full);
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
