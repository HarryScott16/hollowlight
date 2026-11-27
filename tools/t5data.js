// The tier 5 study's results, shared by tools/t5report.js (tables) and tools/t5charts.js (charts):
// the runs tools/t5study.js wrote (JSON lines), averaged per tier 5, tier, condition and start.
// Waves: "W1" is the last wave cleared starting from wave 1 (the campaign is 40 waves, then
// endless); "E41" is waves cleared past 40 when starting at wave 41 in endless (0 = lost wave 41).
// Means over the seeds. Late DPS: damage per second over the last 3 waves it played.
import { readFileSync } from 'node:fs';
import { TOWERS, TOWER_ORDER } from '../public/js/data/towers.js';
import { ENEMIES } from '../public/js/data/enemies.js';

export const CONDS = ['alone', 'reveal', 'full'];
export const CAUSES = ['veiled', 'flyers', 'armour', 'shields', 'healers', 'hulks', 'numbers', 'bosses'];
export const wardName = { bolt: 'Bolt Ward', mortar: 'Mortar', rime: 'Rime Spire', coil: 'Storm Coil', longeye: 'Longeye', censer: 'Censer', prism: 'Prism', beacon: 'Beacon', snare: 'Thornlight Snare', moth: 'Moth Lantern', wander: 'Wandering Light', vault: 'Ember Vault',
  avatar: 'Heartfire Avatar', choir: 'Astral Choir', ferry: 'Ferrylight', undertow: 'The Undertow', lamp: 'Lampwright' };
export const noAttack = (type) => TOWERS[type].kind === 'aura' || TOWERS[type].kind === 'vault';
export const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);

export function load(files) {
  const runs = files.flatMap((f) => readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)));
  const MAIN = runs[0].map;

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
      for (const [name, n] of Object.entries(leaks)) if (ENEMIES[name.replace('veiled ', '')] && ENEMIES[name.replace('veiled ', '')].flying) { causes.flyers = (causes.flyers || 0) + n; causes.numbers -= n; }
    }
    const cl = rs.map((r) => (start > 1 ? r.cleared - (start - 1) : r.cleared));
    return {
      n: rs.length, waves: mean(cl), lo: Math.min(...cl), hi: Math.max(...cl), capped: rs.some((r) => r.capped), timedOut: rs.some((r) => r.timedOut),
      dps: mean(rs.map((r) => r.dps)), late: mean(rs.map((r) => r.dpsLate)), kills: mean(rs.map((r) => r.kills)), dmg: mean(rs.map((r) => r.dmg)),
      cost: rs[0].cost, minor: rs[0].minor, x: rs[0].x, y: rs[0].y, causes, leaks, last,
    };
  }

  const paths = TOWER_ORDER.flatMap((type) => [0, 1, 2].map((path) => ({ type, path, name: TOWERS[type].paths[path].tiers[4].name, t4: TOWERS[type].paths[path].tiers[3].name, pname: TOWERS[type].paths[path].name, ward: wardName[type] })));
  const score = (a, b) => (a ? a.waves : 0) + (b ? b.waves : 0);   // W1 + E41
  for (const p of paths) {
    p.c = {};
    for (const tier of [5, 4]) for (const cond of CONDS) for (const start of [1, 41]) p.c[`${tier}${cond}${start}`] = cell(MAIN, p.type, p.path, tier, cond, start);
    const g = (t, c) => score(p.c[`${t}${c}1`], p.c[`${t}${c}41`]);
    p.alone = g(5, 'alone'); p.reveal = g(5, 'reveal'); p.full = g(5, 'full');
    p.alone4 = g(4, 'alone'); p.full4 = g(4, 'full');
    p.late = p.c['5full41'] ? p.c['5full41'].late : 0;
    p.late4 = p.c['4full41'] ? p.c['4full41'].late : 0;
    p.attacks = !noAttack(p.type);
    p.x4 = p.attacks && p.late4 > 0 ? p.late / p.late4 : null;   // late DPS, tier 5 / tier 4
    p.cost = p.c['5alone1'] ? p.c['5alone1'].cost : 0;
  }
  const ranked = paths.slice().sort((a, b) => b.alone - a.alone || b.full - a.full);
  return { runs, MAIN, cell, paths, ranked };
}
