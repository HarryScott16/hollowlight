// Game state and rules. Pure simulation: no DOM, no rendering, so it also runs headless for bots.
// The renderer learns what happened through `game.fx`, a queue of small event objects.
import { mapById } from '../data/maps.js';
import { difficultyById } from '../data/difficulty.js';
import { RULES, vaultRate } from '../data/rules.js';
import { TOWERS } from '../data/towers.js';
import { WAVES, campaignWaves } from '../data/waves.js';
import { ENEMIES, pops } from '../data/enemies.js';
import { SHIELD_MULT } from '../data/damage.js';
import { FLARE, LAST_LIGHT, ABILITIES } from '../data/abilities.js';
import { buildMap, mulberry32 } from './path.js';
import { Grid } from './grid.js';
import { updateNew, newKill, useNewAbility, eclipseGlobals, placeWhirl, mainPathOf, lendStar, moveTaper } from './newwards.js';
import { createEnemy, updateEnemy, inherit, applySlow, regrow, strongScore } from './enemies.js';
import { createTower, computeStats, upgradeInfo, updateTower, snipeHit, ignite, startLure, castStar, updateOrbs } from './towers.js';
import { updateProjectiles, updateZones, launchShell, updateMines, isLow } from './projectiles.js';
import { endlessWave, endlessToughAfter } from './endless.js';

const scratch = [];
const buf = [];
const gridBuf = [];
// A ward's ability: one per type, or (round-2 wards) one per path, from its main path (tier 4+).
export function abilityPath(t) { const pi = mainPathOf(t); return pi < 0 ? 0 : pi; }
export function abilityFor(t) { const A = ABILITIES[t.type]; return A && A.paths ? A.paths[abilityPath(t)] : A; }

export class Game {
  constructor(opts = {}) {
    this.fxOn = opts.fx !== false;
    this.seed = opts.seed || 1;
    this.waves = WAVES;
    this.load(opts.map, opts.difficulty);
  }

  // Switches map and difficulty (ids from data/maps.js and data/difficulty.js) and starts afresh.
  load(mapId, diffId) {
    const data = mapById(mapId);
    if (!this.map || this.map.data !== data) {
      this.map = buildMap(data);
      this.grid = new Grid(data.width, data.height);
    }
    this.diff = difficultyById(diffId);
    this.waves = campaignWaves(this.diff.campaign || WAVES.length);   // 40 waves, or Hard's 60
    this.reset();
  }

  reset() {
    this.rand = mulberry32(this.seed);
    this.gold = this.diff.startGold;
    this.lives = this.startLives = this.diff.startLives;
    this.wave = 0;            // number of waves started so far
    this.rewarded = 0;        // number of waves whose clear reward has been paid
    this.time = 0;
    this.over = null;         // null | 'win' | 'lose'
    this.endless = false;     // continuing past the last campaign wave
    this.endlessWaves = new Map();
    this.nextId = 1;
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.zones = [];
    this.mines = [];          // Flashmines on the path
    this.wisps = [];          // Requiem wisps flying back up the road (Astral Choir)
    this.candles = [];        // Lampwright candles on the road (RULES.candleCap)
    this.spawned = 0;         // groups started so far (they take turns between a map's Rifts)
    this.orbs = [];           // Ball Lightning orbs rolling up the path
    this.vaults = [];
    this.spawners = [];
    this.pending = [];        // deferred shatter explosions
    this.fx = [];
    this.globalSlow = 0;
    this.earned = 0;
    this.leaked = 0;
    this.pushback = 0;        // px of road the Gloom were pushed back, in total (read by the test tools)
    this.kills = 0;
    this.pops = 0;            // layers broken (a Husk shell counts 6)
    this.goldMul = 1;         // gold per layer (drops in endless mode)
    this.streak = 0;          // kills chained less than RULES.streakWindow apart
    this.bestStreak = 0;
    this.lastKill = -99;
    this.income = [];         // gold earned per wave (index = wave - 1), for the bot and stats
    this.flareCd = 0;         // Heartfire Flare cooldown (s); ready at the start
    this.lastLight = true;    // the one free save per run
    this.barrages = [];       // queued Saturation shells
    this.strikes = [];        // queued Tempest thunderbolts
    this.rally = null;        // { src, t }: a Beacon's Rally, boosting every ward on the map
  }

  emit(type, data) {
    if (!this.fxOn) return;
    data.type = type;
    this.fx.push(data);
  }

  // ---- waves ---------------------------------------------------------------------------------
  get totalWaves() { return this.waves.length; }
  // Wave i (0-based): campaign waves, then generated endless waves once endless mode is on.
  waveAt(i) {
    if (i < this.waves.length) return this.waves[i];
    if (!this.endless) return null;
    let w = this.endlessWaves.get(i);
    if (!w) { w = endlessWave(i + 1, this.seed); this.endlessWaves.set(i, w); }
    return w;
  }

  // After winning the campaign: keep going.
  continueEndless() {
    if (this.over !== 'win') return false;
    this.over = null;
    this.endless = true;
    return true;
  }
  get canStartWave() { return !this.over && (this.endless || this.wave < this.waves.length) && this.spawners.length === 0; }
  get clear() { return this.spawners.length === 0 && this.enemies.length === 0; }
  get earlyBonus() { return this.enemies.length > 0 ? RULES.earlyBonus(this.wave + 1) : 0; }

  startWave() {
    if (!this.canStartWave) return false;
    const bonus = this.earlyBonus;
    if (bonus) {
      this.addGold(bonus);
      this.flareCd = Math.max(0, this.flareCd - FLARE.earlyCut);
      this.emit('bonus', { amount: bonus, label: 'Early call' });
    }
    const wave = this.waveAt(this.wave);
    this.wave++;
    this.goldMul = RULES.popGold(this.wave);
    const D = this.map.data, more = this.diff.count(this.wave);
    // A map's own ramp evens out a 40-wave campaign: it holds at its wave-40 value through Hard's
    // waves 41-60, and endless after them picks it up from there (on a 40-wave campaign: as is).
    const len = this.waves.length, mapWave = this.wave <= len ? Math.min(this.wave, 40) : this.wave - (len - 40);
    let tough = this.diff.tough(this.wave) * (D.tough ? D.tough(mapWave) : 1);
    if (this.wave > this.waves.length) tough *= endlessToughAfter(this.waves.length);   // (after Hard's 60)
    for (const g of wave.groups) {
      const mods = { hpMul: (g.hpMul || 1) * tough, speedMul: g.speedMul || 1, veiled: !!g.veiled, mending: !!g.mending };
      if (g.summonEvery) { mods.summonEvery = g.summonEvery; mods.summonCount = g.summonCount; }   // a calmer summoner on an early wave
      // A boss's own health multiplier doesn't pass to what it sheds or summons.
      if (g.kidHpMul) mods.kids = { ...mods, hpMul: g.kidHpMul * tough };
      // Difficulty: more or fewer of each group, over the same stretch of time.
      let count = g.count, gap = g.gap;
      if (more !== 1 && count > 1) { count = Math.max(1, Math.round(count * more)); gap = (g.gap * (g.count - 1)) / Math.max(1, count - 1); }
      // On a map with several Rifts, the Gloom take turns between them.
      this.spawners.push({ type: g.type, left: count, gap, t: g.delay || 0, mods, wave: this.wave, n: this.spawned++ });
    }
    this.emit('wave', { n: this.wave, banner: wave.banner || null, boss: wave.groups.some((g) => ENEMIES[g.type].boss) });
    return true;
  }

  addGold(n) {
    this.gold += n;
    this.earned += n;
    if (this.wave > 0) this.income[this.wave - 1] = (this.income[this.wave - 1] || 0) + n;
  }

  // ---- towers --------------------------------------------------------------------------------
  canPlace(type, x, y) {
    const def = TOWERS[type];
    if (def && def.onPath) return !!this.snapToPath(x, y);
    if (def && def.water ? !this.map.inWater(x, y, RULES.waterMargin) : !this.map.buildable(x, y)) return false;
    for (const t of this.towers) {
      if (t.def.onPath) continue;   // a Snare lies on the road, out of the way
      if ((t.hx - x) ** 2 + (t.hy - y) ** 2 < RULES.towerSpacing ** 2) return false;
    }
    return true;
  }

  // A Thornlight Snare goes on the road: the point on the path's centre line nearest (x, y), if
  // (x, y) is on the road, the spot isn't too close to the Rift or the Heartfire, and no other
  // Snare is within RULES.snareSpacing. Returns { x, y, dist } or null.
  // On a map with several roads, it goes on the nearest one (the shared stretch belongs to the first).
  snapToPath(x, y) {
    const D = this.map.data, near = this.map.nearestRoute(x, y), path = near.path, i = path.nearest(x, y);
    const px = path.xs[i], py = path.ys[i], dist = i * path.step;
    if ((px - x) ** 2 + (py - y) ** 2 > (D.pathWidth / 2 + 6) ** 2) return null;
    if (px < 24 || py < 24 || px > D.width - 24 || py > D.height - 24) return null;
    if (dist < RULES.snareFromRift || dist > path.length - RULES.snareFromGoal) return null;
    for (const t of this.towers) if (t.def.onPath && (t.x - px) ** 2 + (t.y - py) ** 2 < RULES.snareSpacing ** 2) return null;
    const out = this._snap || (this._snap = { x: 0, y: 0, dist: 0, route: 0 });
    out.x = px; out.y = py; out.dist = dist; out.route = near.route;
    return out;
  }

  place(type, x, y) {
    const def = TOWERS[type];
    if (!def || this.over || this.gold < def.cost || !this.canPlace(type, x, y)) return null;
    let pd = 0;
    let route = 0;
    if (def.onPath) { const p = this.snapToPath(x, y); x = p.x; y = p.y; pd = p.dist; route = p.route; }
    this.gold -= def.cost;
    const t = createTower(this, type, x, y);
    t.pathDist = pd; t.route = route;
    if (def.kind === 'undertow') placeWhirl(this, t);
    this.spend(t, def.cost);
    this.towers.push(t);
    this.refreshGlobals();
    this.emit('place', { x, y });
    return t;
  }

  upgrade(tower, pi) {
    const info = upgradeInfo(tower, pi);
    if (!info.ok || this.over || this.gold < info.cost) return false;
    this.gold -= info.cost;
    tower.spent += info.cost;
    this.spend(tower, info.cost);
    tower.tiers[pi]++;
    tower.stats = computeStats(tower.def, tower.tiers);
    // Reaching tier 4 unlocks the ward type's ability, one-third charged.
    const ab = abilityFor(tower);
    if (ab && tower.tiers[pi] === 4 && tower.abilityCd === null) tower.abilityCd = ab.cd * (2 / 3);
    this.refreshGlobals();
    this.emit('upgrade', { id: tower.id, x: tower.x, y: tower.y, path: pi, tier: tower.tiers[pi], name: info.up.name });
    return true;
  }

  // Gold spent on a ward since the current wave started refunds in full; older gold at sellRefund.
  spend(t, n) {
    if (t.freshWave !== this.wave) { t.freshWave = this.wave; t.fresh = 0; }
    t.fresh += n;
  }
  freshGold(t) { return t.freshWave === this.wave ? t.fresh : 0; }
  sellValue(tower) {
    const fresh = this.freshGold(tower);
    return Math.floor(fresh + (tower.spent - fresh) * RULES.sellRefund + (tower.bank || 0));   // a Vault's embers come too
  }

  // Ember Vault: empties its embers into your gold.
  cashOut(t) {
    if (!t || !t.bank || this.over) return 0;
    const n = Math.floor(t.bank);
    t.bank -= n;
    t.held = 0;   // the interest bonus for leaving it starts again
    // Dragon's Hoard: a big cash-out pays extra.
    const extra = t.stats.hoardBonus && n >= t.stats.hoardMin ? Math.floor(n * t.stats.hoardBonus) : 0;
    t.goldEarned = (t.goldEarned || 0) + n + extra;
    this.addGold(n + extra);
    if (t.warm && t.stats.warmRate) { t.warm = false; this.refreshGlobals(); }
    this.emit('cashout', { x: t.x, y: t.y, amount: n });
    return n;
  }

  // Wandering Light: moves its post (it floats there). Anywhere on the map that isn't water.
  // R on a round-2 ward: what it can be pointed at. The Undertow moves its whirlpool (a road point
  // in reach), a Grand Orrery lends a star (a ward), an Undying Taper moves its giant candle.
  wardAimKind(t) {
    if (!t) return null;
    if (t.def.kind === 'undertow') return 'whirl';
    if (t.def.kind === 'avatar' && t.stats.lend) return 'lend';
    if (t.def.kind === 'lamp' && t.stats.taper) return 'taper';
    return null;
  }
  aimWard(t, x, y) {
    const k = this.wardAimKind(t);
    let ok = false;
    if (k === 'whirl') ok = placeWhirl(this, t, x, y);
    else if (k === 'lend') { const w = this.towerAt(x, y); ok = !!w && lendStar(this, t, w); }
    else if (k === 'taper') ok = moveTaper(this, t, x, y);
    if (ok) this.emit('post', { x, y, id: t.id });
    return ok;
  }

  canMovePost(t, x, y) {
    if (!t || t.def.kind !== 'wander') return false;
    const D = this.map.data;
    if (x < 22 || y < 22 || x > D.width - 22 || y > D.height - 22) return false;
    return !D.ponds.some((p) => ((x - p.x) / (p.rx + 4)) ** 2 + ((y - p.y) / (p.ry + 4)) ** 2 < 1);
  }
  movePost(t, x, y) {
    if (!this.canMovePost(t, x, y) || this.over) return false;
    t.hx = x; t.hy = y;
    this.refreshGlobals();
    this.emit('post', { x, y });
    return true;
  }

  sell(tower) {
    const i = this.towers.indexOf(tower);
    if (i < 0 || this.over) return false;
    const value = this.sellValue(tower);
    this.towers.splice(i, 1);
    tower.sold = true;   // a Moth Lantern's circling flyers fly on
    if (tower.def.kind === 'snare' && this.mines.length) this.mines = this.mines.filter((m) => m.src !== tower);
    this.gold += value;
    this.refreshGlobals();
    this.emit('sell', { x: tower.x, y: tower.y, amount: value });
    return true;
  }

  // Recomputes every ward's stats with the Beacon boosts it sits in (called whenever wards are
  // placed, upgraded or sold, and when a Rally starts or ends). Beacons don't stack: each kind of
  // boost comes from the best Beacon covering the ward.
  refreshGlobals() {
    const beacons = [], torches = [];
    for (const t of this.towers) if (t.def.kind === 'aura') { t.stats = computeStats(t.def, t.tiers); beacons.push(t); }
    // Wandering Light torches (around their post) and warm Ember Vaults boost like Beacons.
    for (const t of this.towers) if ((t.def.kind === 'wander' && t.stats.torchRate) || (t.def.kind === 'vault' && t.warm && t.stats.warmRate)) torches.push(t);
    this.vaults = this.towers.filter((t) => t.def.kind === 'vault');
    this.choirs = this.towers.filter((t) => t.def.kind === 'choir' && t.stats.hush);
    const rally = this.rally && this.towers.includes(this.rally.src) ? this.rally.src : null;
    for (const t of this.towers) {
      if (t.def.kind === 'aura') continue;
      const s = computeStats(t.def, t.tiers);
      let rate = 0, dmg = 0, range = 0, detect = false, air = false;
      for (const b of beacons) {
        const bs = b.stats;
        if (b !== rally && !bs.auraGlobal && (b.x - t.hx) ** 2 + (b.y - t.hy) ** 2 > bs.range * bs.range) continue;
        rate = Math.max(rate, bs.auraRate || 0);
        dmg = Math.max(dmg, bs.auraDmg || 0);
        range = Math.max(range, bs.auraRange || 0);
        detect = detect || !!bs.auraDetect;
        air = air || !!bs.auraAir;
      }
      for (const b of torches) {
        if (b === t) continue;
        const bs = b.stats, wv = b.def.kind === 'vault', r = wv ? bs.range : bs.torchRange;
        if ((b.hx - t.hx) ** 2 + (b.hy - t.hy) ** 2 > r * r) continue;
        rate = Math.max(rate, wv ? bs.warmRate : bs.torchRate);
        dmg = Math.max(dmg, (wv ? bs.warmDmg : bs.torchDmg) || 0);
      }
      if (rate || dmg || range || detect || air) {
        // A Prism has no attack rate: its share of the boost goes into damage.
        if (s.rate) s.rate *= 1 + rate; else dmg = (1 + dmg) * (1 + rate) - 1;
        s.damage *= 1 + dmg;
        if (s.range) s.range *= 1 + range;   // a map-wide ward has no range to extend
        if (detect) s.detect = true;
        if (air) s.hitsAir = true;
        t.aura = { rate, dmg, range, detect, air };
      } else {
        t.aura = null;
      }
      t.stats = s;
    }
    let slow = 0, disc = 0;
    for (const t of this.towers) {
      if (t.stats.globalSlow > slow) slow = t.stats.globalSlow;
      if (t.stats.discount > disc) disc = t.stats.discount;   // a Golden Age Beacon
    }
    this.globalSlow = slow;
    for (const t of this.towers) t.disc = disc;
    eclipseGlobals(this);
  }

  towerAt(x, y) {
    let best = null, bestD = (RULES.towerRadius + 4) ** 2;
    for (const t of this.towers) {
      const d = (t.x - x) ** 2 + (t.y - y) ** 2;
      if (d < bestD) { bestD = d; best = t; }
    }
    return best;
  }

  // ---- targeting -----------------------------------------------------------------------------
  // `area` attacks (pulses, explosions, fire) hit Veiled enemies without needing to see them.
  targetable(e, s, area) {
    if (!e.alive) return false;
    if (e.def.flying && !s.hitsAir && !isLow(e)) return false;
    if (e.veiled && !area && !s.detect && e.revealT <= 0) return false;
    return true;
  }

  // Fills `out` with up to n targets for the tower, best first, by its targeting mode.
  // A `global` ward (the Longeye) picks from every enemy on the map.
  pickTargets(t, n, out, minRange = 0) {
    out.length = 0;
    const s = t.stats;
    const buf = s.global ? this.enemies : this.grid.query(t.x, t.y, s.range, gridBuf);
    scratch.length = 0;
    const mode = t.targetMode;
    const min2 = minRange * minRange;
    for (let i = 0; i < buf.length; i++) {
      const e = buf[i];
      if (!this.targetable(e, s)) continue;
      const d2 = (e.x - t.x) ** 2 + (e.y - t.y) ** 2;
      if (d2 < min2) continue;
      let score;
      if (mode === 'first') score = e.dist * e.prog;
      else if (mode === 'last') score = -e.dist * e.prog;
      else if (mode === 'strong') score = strongScore(e);
      else score = -d2;
      e._score = score;
      scratch.push(e);
    }
    if (!scratch.length) return out;
    if (n === 1) {
      let best = scratch[0];
      for (let i = 1; i < scratch.length; i++) if (scratch[i]._score > best._score) best = scratch[i];
      out.push(best);
    } else {
      // The best n, best first, ties in the order found: the same as a stable sort of everything
      // and taking the first n, without sorting the whole crowd.
      for (let i = 0; i < scratch.length; i++) {
        const e = scratch[i], sc = e._score;
        if (out.length === n && sc <= out[n - 1]._score) continue;
        let k = out.length;
        while (k > 0 && out[k - 1]._score < sc) k--;
        out.splice(k, 0, e);
        if (out.length > n) out.length = n;
      }
    }
    return out;
  }

  // ---- damage --------------------------------------------------------------------------------
  // opts: armorPierce (0-1), shieldMul, dot (no hit flash), quiet (no hit spark)
  damage(e, amount, type, src, opts) {
    if (!e.alive) return 0;
    let mult = e.def.mult && e.def.mult[type] !== undefined ? e.def.mult[type] : 1;
    const seared = e.searT > 0;
    // Ashen Brand: Scorched enemies lose their resistances (immunities stay).
    if (mult < 1 && mult > 0 && seared && e.brand) mult = 1;
    if (mult < 1 && opts && opts.armorPierce) mult += (1 - mult) * opts.armorPierce;
    let amp = 1;
    if (e.markT > 0) amp += e.markPct;
    if (e.brittleT > 0 && (type === 'kinetic' || type === 'blast')) amp += e.brittlePct;
    if (e.chargedT > 0 && type === 'arcane') amp += e.chargedPct;
    if (e.scorchT > 0) amp += e.scorchPct;
    if (seared) amp += e.searAmp;
    if (e.freezeT > 0) amp += e.frozenAmp || 0;
    if (e.lureT > 0) amp += e.lureAmp;
    if (e.sunT > 0) amp += e.sunPct;          // Noonfire: sun-marked
    amp += e.zenithPct;                       // Zenith: a boss burned by flares
    if (e.dazzleT > 0) amp += e.dazzleAmp;    // Lighthouse: Dazzled
    if (e.whirlT > 0) amp += e.whirlAmp;      // Whirlpool
    if (e.vigilT > 0) amp += e.vigilAmp;      // Vigil candles
    const k = mult * amp;
    let dmg = amount * k;
    let dealt = 0;
    e.lastHit = this.time;

    if (e.maxShield > 0) e.shieldCd = e.def.shieldDelay;
    if (e.shield > 0) {
      const sm = (opts && opts.shieldMul) ? opts.shieldMul
        : SHIELD_MULT[type] !== undefined ? SHIELD_MULT[type] : 1;
      if (sm <= 0) return 0;
      const soak = Math.min(e.shield, dmg * sm);
      e.shield -= soak;
      dmg -= soak / sm;
      dealt += soak;
    }
    if (dmg > 0) {
      const d = Math.min(e.hp, dmg);
      e.hp -= dmg;
      dealt += d;
    }
    if (src) src.dmg += dealt;
    const dot = opts && opts.dot;
    if (!dot) {
      e.flash = 0.09;
      e.hitT = 0.12;
      if (!(opts && opts.quiet) || dealt >= 40) {
        this.emit('hit', { x: e.x, y: e.y, dtype: type, resisted: mult < 0.75, amt: dealt, maxHp: e.maxHp, big: !!(opts && opts.big), heavy: !!e.def.heavy });
      }
    }
    if (e.def.phases) this.checkPhases(e, src);
    if (e.hp <= 0) {
      // Overkill carries into the inner layers, converted back to raw damage so their own
      // resistances apply.
      const carry = k > 0 ? -e.hp / k : 0;
      this.kill(e, src, carry, type, opts);
    }
    return dealt;
  }

  // Bosses burst out extra enemies as their health crosses each phase threshold.
  checkPhases(e, src) {
    const ph = e.def.phases;
    while (e.phase < ph.length && e.hp / e.maxHp <= ph[e.phase].at) {
      const p = ph[e.phase++];
      if (e.noPhaseT > this.time) continue;   // Great Bell: this phase's adds are cancelled
      this.spawnShed(e, p.type, p.count, 0, null, null);
      this.emit('phase', { x: e.x, y: e.y, n: e.phase, r: e.r });
    }
  }

  // Spawns `count` inner enemies at e's position. The first one takes the carried damage.
  spawnShed(e, type, count, carry, dtype, opts, src) {
    // A flyer bursting out of a walker takes off from the nearest point of the flight route.
    const fly = ENEMIES[type].flying && !e.def.flying;
    // A Veiled hulk's veil tears when its shell breaks: what it sheds can be seen.
    let mods = e.mods.kids || e.mods;
    if (mods.veiled && e.def.heavy && !e.def.boss) mods = mods.torn || (mods.torn = { ...mods, veiled: false });
    const d0 = fly ? this.map.flyDistAt(e.dist, e.route) : e.dist;
    for (let i = 0; i < count; i++) {
      const child = createEnemy(this, type, Math.max(0, d0 - (fly ? i * 6 : i * 10)), e.wave, mods, e.root, e.route);
      child.off = fly ? (this.rand() - 0.5) * 30 : e.off + (count > 1 ? (i - (count - 1) / 2) * 7 : 0);
      inherit(child, e);
      if (i === 0 && e.unpaid > 1) child.unpaid = e.unpaid - 1;
      child.wob = e.wob + i;
      child.path.posAt(child.dist, child, child.off);
      this.enemies.push(child);
      if (i === 0 && carry > 0.01) this.damage(child, carry, dtype, src, opts && opts.dot ? opts : CARRY);
    }
  }

  kill(e, src, carry = 0, dtype = 'true', opts = null, goldShare = 1) {
    e.alive = false;
    this.kills++;
    this.pops += e.def.gold;
    if (src) src.kills++;
    newKill(this, e, src);
    const gold = e.unpaid > 0 ? 0 : e.def.gold * this.goldMul * goldShare;
    this.addGold(gold);
    if (this.vaults && this.vaults.length && gold > 0) this.glean(e);
    this.emit('death', { x: e.x, y: e.y, r: e.r, etype: e.type, gold, boss: !!e.def.boss, heavy: !!e.def.heavy, src: src ? src.id : 0 });
    this.streak = this.time - this.lastKill <= RULES.streakWindow ? this.streak + 1 : 1;
    this.lastKill = this.time;
    if (this.streak > this.bestStreak) this.bestStreak = this.streak;
    if (this.streak % RULES.streakChime === 0) this.emit('streak', { n: this.streak });
    // Shatter: a chilled enemy explodes, as often as the spire's shatter rate allows.
    if (e.shatterT > 0 && e.shatterSrc && e.shatterSrc.shatterTokens >= 1) {
      e.shatterSrc.shatterTokens--;
      this.pending.push({ x: e.x, y: e.y, r: e.shatterRadius, dmg: e.shatterDmg, src: e.shatterSrc, chain: !!e.shatterSrc.stats.shatterChain });
    }
    // Magma Heart: Gloom that die in magma erupt.
    const ms = e.magmaT > this.time ? e.magmaSrc : null;
    if (ms && ms.eruptTokens >= 1 && ms.stats.eruptDmg) {
      ms.eruptTokens--;
      this.pending.push({ x: e.x, y: e.y, r: ms.stats.eruptRadius, dmg: ms.stats.eruptDmg, src: ms, type: 'blast', fx: 'erupt' });
    }
    // Dawnbringer: marked Gloom that die mark everything around them.
    const mk = e.markT > 0 && e.markSrc && e.markSrc.stats.markBurst ? e.markSrc : null;
    if (mk && mk.markTokens >= 1) {
      mk.markTokens--;
      const ms2 = mk.stats;
      this.grid.query(e.x, e.y, ms2.markBurst, buf);
      for (const o of buf) if (o !== e && o.alive) { o.markT = Math.max(o.markT, ms2.markDur); o.markPct = Math.max(o.markPct, ms2.markPct); o.markSrc = mk; }
      this.emit('markburst', { x: e.x, y: e.y, r: ms2.markBurst });
    }
    // Wildfire: a burning enemy's fire leaps to the Gloom around it.
    const fs = e.burnT > 0 && e.burnType === 'fire' && e.burnSrc ? e.burnSrc : null;
    if (fs && fs.stats.spread && fs.spreadTokens >= 1 && this.towers.includes(fs)) {
      fs.spreadTokens--;
      this.grid.query(e.x, e.y, fs.stats.spreadRadius, buf);
      let n = 0;
      for (const o of buf) {
        if (o === e || !o.alive || o.root === e.root || o.burnT > 0.5 || (o.def.flying && !fs.stats.hitsAir)) continue;
        ignite(o, fs.stats, fs);
        if (++n >= fs.stats.spread) break;
      }
      if (n) this.emit('wildfire', { x: e.x, y: e.y, r: fs.stats.spreadRadius });
    }
    // Bosses that die before every phase has burst still release the rest.
    const ph = e.def.phases;
    if (ph) while (e.phase < ph.length) { const p = ph[e.phase++]; this.spawnShed(e, p.type, p.count, 0); }
    const shed = e.def.shed;
    if (shed) for (let i = 0; i < shed.length; i++) this.spawnShed(e, shed[i].type, shed[i].count, i === 0 ? carry : 0, dtype, opts, src);
  }

  // Ember Vaults bank a share of the bounty of Gloom that die in their light (a Harvest Moon: from
  // anywhere, at half rate outside it). Late-game bounties are tiny, so embers count at least 0.15
  // gold a layer. A full vault stops collecting.
  glean(e) {
    const base = e.def.gold * Math.max(this.goldMul, 0.15);
    for (const v of this.vaults) {
      const s = v.stats;
      if (v.bank >= s.cap) continue;
      const inside = (v.x - e.x) ** 2 + (v.y - e.y) ** 2 <= s.range * s.range;
      if (!inside && !s.gleanAll && !s.gleanFull) continue;
      v.bank = Math.min(s.cap, v.bank + base * s.glean * (inside || s.gleanFull ? 1 : 0.5));
      if (inside && this.fxOn && this.rand() < 0.35) this.emit('glean', { x: e.x, y: e.y, id: v.id });
    }
  }

  // A leak costs one life per layer the enemy still holds: its own remaining health (in layers)
  // plus everything inside it. At least 1.
  // Push an enemy back along its road (or its flight line) by up to px; returns how far it moved.
  // Every knockback, drag and current goes through here, so the test tools can count it.
  pushBack(e, px, src) {
    const d = Math.min(e.dist, px);
    if (d <= 0) return 0;
    e.dist -= d;
    this.pushback += d;
    if (src) src.pushback = (src.pushback || 0) + d;
    return d;
  }

  leakCost(e) {
    const d = e.def;
    let n = Math.ceil(d.gold * Math.max(0, e.hp) / e.maxHp);
    for (const s of d.shed || []) n += pops(s.type) * s.count;
    if (d.phases) for (let i = e.phase; i < d.phases.length; i++) n += pops(d.phases[i].type) * d.phases[i].count;
    return Math.max(1, n);
  }

  // Lives a leak actually costs: capped at RULES.maxLeak, except for bosses.
  // In endless mode the caps are much lower (RULES.endlessMaxLeak / endlessBossLeak).
  leakLives(e) {
    const n = this.leakCost(e);
    if (this.endless && this.wave > this.waves.length) return Math.min(e.def.boss ? RULES.endlessBossLeak : RULES.endlessMaxLeak, n);
    // Early campaign: Veiled and flying Gloom cost a life each (RULES.earlyLeak), so missing sight or
    // anti-air bleeds a few lives instead of ending the run before wave 21.
    if (e.wave <= RULES.earlyLeakWave && (e.veiled || e.def.flying)) return Math.min(e.def.boss ? RULES.earlyBossLeak : RULES.earlyLeak, n);
    if (e.def.boss) return this.diff.bossLeak ? Math.min(this.diff.bossLeak, n) : n;   // (Easy caps a boss's leak)
    return Math.min(this.diff.maxLeak || RULES.maxLeak, n);
  }

  leak(e) {
    if (this.lastLight && !e.def.boss) { this.triggerLastLight(e); return; }
    let cost = this.leakLives(e);
    // Second Heartfire: a Vault pays embers for the lives instead.
    for (const v of this.vaults) {
      const g = v.stats.guard;
      if (!g || cost <= 0) continue;
      const n = Math.min(cost, Math.floor(v.bank / g));
      if (n <= 0) continue;
      v.bank -= n * g; cost -= n;
      this.emit('guard', { x: v.x, y: v.y, n, gx: this.map.data.goal.x, gy: this.map.data.goal.y });
    }
    if (cost <= 0) { this.leaked++; return; }
    this.lives -= cost;
    this.leaked++;
    this.streak = 0;
    this.emit('leak', { amount: cost, boss: !!e.def.boss });
    if (this.lives <= 0) {
      this.lives = 0;
      this.over = 'lose';
      this.emit('over', { result: 'lose' });
    }
  }

  // ---- abilities -----------------------------------------------------------------------------
  get flareReady() { return !this.over && this.flareCd <= 0; }

  useFlare() {
    if (!this.flareReady) return false;
    this.flareCd = FLARE.cd;
    const list = this.enemies.slice();
    for (const e of list) {
      if (!e.alive) continue;
      if (!e.def.heavy) e.stunT = Math.max(e.stunT, FLARE.stun);
      this.damage(e, e.def.heavy ? FLARE.heavyDmg : FLARE.dmg, 'true', null, FLARE_HIT);
    }
    this.emit('flare', { x: this.map.data.goal.x, y: this.map.data.goal.y });
    return true;
  }

  // Ward abilities, grouped by ward type: the ward whose ability is closest to ready.
  abilityTower(type) {
    let best = null;
    for (const t of this.towers) {
      if (t.type !== type || t.abilityCd === null) continue;
      if (!best || t.abilityCd < best.abilityCd) best = t;
    }
    return best;
  }

  useAbility(type) {
    const t = this.abilityTower(type);
    if (!t || t.abilityCd > 0 || this.over) return false;
    const ab = abilityFor(t);
    t.abilityCd = ab.cd;
    const s = t.stats;
    if (ABILITIES[type].paths) {
      useNewAbility(this, t, type, ab, abilityPath(t));
    } else if (type === 'bolt') {
      t.buffT = ab.dur;
      t.buffRate = ab.rateMul;
    } else if (type === 'mortar') {
      this.barrages.push({ src: t, left: ab.shells, gap: ab.over / ab.shells, t: 0 });
    } else if (type === 'rime') {
      const list = this.enemies.slice();
      for (const e of list) {
        if (!e.alive) continue;
        if (e.def.heavy) applySlow(e, ab.heavySlow, ab.dur);
        else { e.freezeT = ab.dur; e.freezeImm = ab.dur + 0.5; e.frozenAmp = Math.max(e.frozenAmp, s.frozenAmp || 0.3); }
        if (s.brittle) { e.brittleT = ab.dur; e.brittlePct = Math.max(e.brittlePct, s.brittle); }
        if (s.shatterDmg) { e.shatterT = ab.dur; e.shatterDmg = s.shatterDmg; e.shatterRadius = s.shatterRadius; e.shatterSrc = t; }
        this.damage(e, s.damage * ab.dmgMul, s.type, t, QUIET);
      }
      this.emit('hoarfrost', { x: t.x, y: t.y });
    } else if (type === 'coil') {
      // The strongest enemies by what they still hold, each struck once.
      const list = this.enemies.filter((e) => e.alive).sort((a, b) => this.leakCost(b) - this.leakCost(a)).slice(0, ab.strikes);
      list.forEach((e, i) => this.strikes.push({ e, t: (i * ab.over) / ab.strikes, src: t }));
    } else if (type === 'longeye') {
      // Killshot: the toughest enemies on the map, Veiled or not, armour ignored.
      const list = this.enemies.filter((e) => e.alive).sort((a, b) => this.leakCost(b) - this.leakCost(a)).slice(0, ab.targets);
      const ks = { ...s, armorPierce: 1, flakRadius: 0 };
      for (const e of list) {
        const x = e.x, y = e.y;
        snipeHit(this, t, ks, e, Math.max(ab.minDmg, s.damage * ab.mul), true);
        this.emit('snipe', { x: t.x, y: t.y, tx: x, ty: y, flak: 0, spot: 0, big: true });
      }
    } else if (type === 'censer') {
      const fs = { ...s, burnDps: Math.max(ab.minBurn, s.burnDps * 2), burnDur: ab.dur, searDur: ab.dur };
      for (const e of this.enemies) if (e.alive) ignite(e, fs, t);
      this.emit('firestorm', { x: t.x, y: t.y });
    } else if (type === 'prism') {
      for (const p of this.towers) {
        if (p.type !== 'prism') continue;
        p.sunT = ab.dur;
        for (const b of p.beams) b.charge = p.stats.maxCharge;
      }
    } else if (type === 'beacon') {
      this.rally = { src: t, t: ab.dur };
      this.refreshGlobals();
    } else if (type === 'snare') {
      for (const p of this.towers) if (p.type === 'snare') { p.charges = p.stats.charges; p.bloomT = ab.dur; }
      this.emit('bloom', { x: t.x, y: t.y });
    } else if (type === 'moth') {
      t.groundBonus = ab.ground;
      for (const e of this.enemies) if (e.alive && e.def.flying) { startLure(e, t, ab.dur); e.groundT = Math.max(e.groundT, ab.ground + ab.dur); }
      this.emit('lamplure', { x: t.x, y: t.y });
    } else if (type === 'wander') {
      const list = this.enemies.filter((e) => e.alive).sort((a, b) => this.leakCost(b) - this.leakCost(a)).slice(0, ab.stars);
      for (const w of this.towers) {
        if (w.type !== 'wander' || !list.length) continue;
        const ws = w.stats, dmg = Math.max(ab.minDmg, ws.damage * ab.mul);
        list.forEach((e, i) => castStar(this, w, ws, w.lights[i % Math.max(1, w.lights.length)] || w, e, 0, dmg, true));
      }
      this.emit('starfall', { x: t.x, y: t.y });
    } else if (type === 'vault') {
      t.bank = Math.min(t.stats.cap * 2, Math.max(t.bank * ab.mul, t.bank + 1));
      this.emit('windfall', { x: t.x, y: t.y });
    }
    this.emit('ability', { ward: type, name: ab.name, x: t.x, y: t.y });
    return true;
  }

  updateAbilities(dt) {
    if (this.flareCd > 0) this.flareCd = Math.max(0, this.flareCd - dt);
    for (const t of this.towers) if (t.abilityCd > 0) t.abilityCd = Math.max(0, t.abilityCd - dt);

    // Saturation: shells fall on random enemies (or random stretches of path).
    for (const b of this.barrages) {
      b.t -= dt;
      while (b.t <= 0 && b.left > 0) {
        b.t += b.gap;
        b.left--;
        let tx, ty;
        const live = this.enemies.length ? this.enemies[Math.floor(this.rand() * this.enemies.length)] : null;
        if (live && live.alive) { tx = live.x + (this.rand() - 0.5) * 30; ty = live.y + (this.rand() - 0.5) * 30; }
        else { const p = this.map.routes[0].path; p.posAt(60 + this.rand() * (p.length - 80), aim, 0); tx = aim.x; ty = aim.y; }
        launchShell(this, b.src, tx, ty, 0.55 + this.rand() * 0.35);
      }
    }
    if (this.barrages.length) this.barrages = this.barrages.filter((b) => b.left > 0 && this.towers.includes(b.src));

    // Tempest: thunderbolts land one after another.
    const ab = ABILITIES.coil;
    for (const st of this.strikes) {
      st.t -= dt;
      if (st.t > 0 || st.done) continue;
      st.done = true;
      const e = st.e;
      if (!e.alive) continue;
      const s = st.src.stats;
      const dmg = Math.max(ab.minDmg, s.damage * ab.mul);
      this.grid.query(e.x, e.y, ab.radius, buf);
      const around = buf.slice();
      const x = e.x, y = e.y;
      if (!e.def.heavy) e.stunT = Math.max(e.stunT, ab.stun);
      this.damage(e, dmg, s.type, st.src, BIG);
      for (const o of around) if (o !== e && o.alive) this.damage(o, dmg * 0.5, s.type, st.src, QUIET);
      this.emit('smite', { x, y, r: ab.radius });
    }
    if (this.strikes.length) this.strikes = this.strikes.filter((st) => !st.done);

    // Rally ends (or its Beacon was sold).
    if (this.rally && ((this.rally.t -= dt) <= 0 || !this.towers.includes(this.rally.src))) {
      this.rally = null;
      this.refreshGlobals();
    }
  }

  // The one free save: a nova at the Heartfire destroys every non-boss enemy near it, including
  // the one that got through. Nothing inside them escapes and they pay no gold.
  triggerLastLight(leaker) {
    this.lastLight = false;
    const g = this.map.data.goal, r2 = LAST_LIGHT.radius ** 2;
    let n = 0;
    for (const e of this.enemies) {
      if (!e.alive || e.def.boss) continue;
      if (e !== leaker && (e.x - g.x) ** 2 + (e.y - g.y) ** 2 > r2) continue;
      e.alive = false;
      n++;
      this.emit('death', { x: e.x, y: e.y, r: e.r, etype: e.type, gold: 0, boss: false, heavy: !!e.def.heavy, src: 0 });
    }
    this.emit('lastlight', { x: g.x, y: g.y, r: LAST_LIGHT.radius, n });
  }

  // Herald auras: every enemy within a Herald's radius (other than that Herald) runs faster. Done
  // from the enemies' side (each checks only the Heralds near it, stopping at the first in reach):
  // the same result as each Herald scanning everyone near it, far cheaper in a dense crowd.
  hasteAuras(es) {
    const H = this._heralds || (this._heralds = { cells: new Map(), list: [], r: 0 });
    H.list.length = 0;
    let r = 0;
    for (let i = 0; i < es.length; i++) { const e = es[i]; if (e.alive && e.def.haste && !(e.hushT > 0)) { H.list.push(e); if (e.def.haste.radius > r) r = e.def.haste.radius; } }
    const C = this.choirs || [];
    if (!H.list.length) return;
    const cells = H.cells;
    for (const c of cells.values()) c.length = 0;
    const key = (cx, cy) => cx * 4096 + cy;
    for (const h of H.list) {
      const k = key(Math.floor(h.x / r), Math.floor(h.y / r));
      let c = cells.get(k);
      if (!c) { c = []; cells.set(k, c); }
      c.push(h);
    }
    for (let i = 0; i < es.length; i++) {
      const o = es[i];
      if (!o.alive) continue;
      let hushed = false;
      for (let k = 0; k < C.length; k++) if ((o.x - C[k].x) ** 2 + (o.y - C[k].y) ** 2 <= C[k].stats.range ** 2) { hushed = true; break; }
      if (hushed) continue;
      const cx = Math.floor(o.x / r), cy = Math.floor(o.y / r);
      let pct = -1;
      for (let dx = -1; dx <= 1 && pct < 0; dx++) {
        for (let dy = -1; dy <= 1 && pct < 0; dy++) {
          const c = cells.get(key(cx + dx, cy + dy));
          if (!c) continue;
          for (let j = 0; j < c.length; j++) {
            const h = c[j];
            if (h === o) continue;
            const R = h.def.haste.radius, ex = o.x - h.x, ey = o.y - h.y;
            if (ex * ex + ey * ey <= R * R) { pct = h.def.haste.pct; break; }
          }
        }
      }
      if (pct >= 0) { o.hasteT = 0.25; o.hasteF = pct; }
    }
    if (cells.size > 4000) cells.clear();
  }

  updateSpecial(e, dt) {
    const d = e.def;
    // A Scorched Mender can't heal, and Scorched Gloom can't be healed.
    if (d.heal && (e.healCd -= dt) <= 0 && e.searT <= 0) {
      e.healCd = d.heal.every;
      this.grid.query(e.x, e.y, d.heal.radius, buf);
      let n = 0;
      for (const o of buf) {
        if (o === e || o.def.boss || !o.alive || o.searT > 0) continue;
        if (regrow(this, o)) n++;
        else if (o.def.hp > 10 && o.hp < o.maxHp) { o.hp = Math.min(o.maxHp, o.hp + o.maxHp * d.heal.pct); n++; }
        if (n >= d.heal.max) break;
      }
      if (n) this.emit('healpulse', { x: e.x, y: e.y, r: d.heal.radius });
    }
    if (d.summon && (e.summonCd -= dt) <= 0) {
      e.summonCd = e.mods.summonEvery || d.summon.every;
      this.spawnShed(e, d.summon.type, e.mods.summonCount || d.summon.count, 0);
    }
  }

  // ---- main step -----------------------------------------------------------------------------
  step(dt) {
    if (this.over) return;
    this.time += dt;

    // spawning
    const sp = this.spawners;
    for (let i = 0; i < sp.length; i++) {
      const s = sp[i];
      s.t -= dt;
      while (s.t <= 0 && s.left > 0) {
        this.enemies.push(createEnemy(this, s.type, 0, s.wave, s.mods, 0, this.map.routes.length > 1 ? (s.n + s.left) % this.map.routes.length : 0));
        s.left--;
        s.t += s.gap;
      }
    }
    if (sp.length) {
      let w = 0;
      for (let i = 0; i < sp.length; i++) if (sp[i].left > 0) sp[w++] = sp[i];
      sp.length = w;
    }

    // enemies move, then get indexed for this step's queries
    const es = this.enemies;
    for (let i = 0; i < es.length; i++) if (es[i].alive) updateEnemy(this, es[i], dt);
    if (this.over) return;
    this.grid.clear();
    for (let i = 0; i < es.length; i++) if (es[i].alive) this.grid.insert(es[i]);

    // Frost Sight spires reveal Veiled enemies in range to every ward (an Eye in the Dark: the
    // whole map).
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      if (!t.stats.reveal && !t.stats.globalReveal) continue;
      const list = t.stats.global || t.stats.globalReveal ? es : this.grid.query(t.x, t.y, t.stats.range, buf);
      for (const e of list) if (e.veiled && e.alive) e.revealT = 0.25;
    }
    // Heralds, Menders and summoning bosses act on the Gloom around them.
    this.hasteAuras(es);
    for (let i = 0, n = es.length; i < n; i++) if (es[i].def.special && es[i].alive) this.updateSpecial(es[i], dt);
    for (let i = 0; i < this.towers.length; i++) updateTower(this, this.towers[i], dt);
    updateNew(this, dt);
    if (this.orbs.length) updateOrbs(this, dt);
    this.updateAbilities(dt);
    updateProjectiles(this, dt);
    updateZones(this, dt);
    updateMines(this, dt);

    // shatter explosions and magma eruptions (may chain: the list can grow while we walk it)
    for (let i = 0; i < this.pending.length; i++) {
      const p = this.pending[i];
      this.grid.query(p.x, p.y, p.r + 20, buf);
      const list = buf.slice();
      for (const e of list) {
        this.damage(e, p.dmg, p.type || 'frost', p.src, QUIET);
        // Avalanche: a shatter chills what it hits, so it can shatter in turn.
        if (p.chain && e.alive) { e.shatterT = 1; e.shatterDmg = p.dmg; e.shatterRadius = p.r; e.shatterSrc = p.src; applySlow(e, 0.35, 1); }
      }
      this.emit(p.fx || 'shatter', { x: p.x, y: p.y, r: p.r });
    }
    this.pending.length = 0;

    // remove the dead
    let w = 0;
    for (let i = 0; i < es.length; i++) if (es[i].alive) es[w++] = es[i];
    es.length = w;

    // wave clear rewards and victory
    if (this.rewarded < this.wave && this.clear) {
      // Tithe Beacons: the best per-wave bonus and the best interest (they don't stack).
      let tithe = 0, interest = 0, payer = null;
      for (const t of this.towers) {
        const s = t.stats;
        if (!s.tithe) continue;
        const i = s.interest ? Math.min(s.interestCap, Math.floor(this.gold * s.interest)) : 0;
        if (s.tithe + i > tithe + interest) { tithe = s.tithe; interest = i; payer = t; }
      }
      if (payer) payer.goldEarned = (payer.goldEarned || 0) + tithe + interest;
      for (const t of this.towers) {
        if (t.def.kind === 'snare') t.charges = t.stats.charges;
        else if (t.def.kind === 'vault' && t.bank > 0) {
          // Interest: grows past the cap (up to the ceiling), and more the longer it's left.
          const top = t.stats.cap * RULES.vaultCeiling;
          if (t.bank < top) t.bank = Math.min(top, t.bank * (1 + vaultRate(t)));
          t.held = (t.held || 0) + 1;
        }
      }
      // Ember Tide: pays out by itself at each wave clear.
      for (const t of this.towers) if (t.stats.autoCash && t.bank >= 1) this.cashOut(t);
      let total = 0;
      while (this.rewarded < this.wave) total += RULES.waveReward(++this.rewarded) * this.diff.reward;
      this.addGold(total);
      this.emit('bonus', { amount: total, label: `Wave ${this.wave} cleared` });
      if (tithe + interest > 0) {
        this.addGold(tithe + interest);
        this.emit('tithe', { amount: tithe + interest });
      }
      if (this.wave >= this.waves.length && !this.endless) {
        this.over = 'win';
        this.emit('over', { result: 'win' });
      }
    }
  }
}

const QUIET = { quiet: true };
const CARRY = { quiet: true };
const BIG = { big: true };
const FLARE_HIT = { quiet: true };
const aim = { x: 0, y: 0, ang: 0 };
