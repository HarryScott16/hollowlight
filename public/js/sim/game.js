// Game state and rules. Pure simulation: no DOM, no rendering, so it also runs headless for bots.
// The renderer learns what happened through `game.fx`, a queue of small event objects.
import { MAP } from '../data/map.js';
import { RULES } from '../data/rules.js';
import { TOWERS } from '../data/towers.js';
import { WAVES, WAVE_HP } from '../data/waves.js';
import { ENEMIES } from '../data/enemies.js';
import { SHIELD_MULT } from '../data/damage.js';
import { buildMap, mulberry32 } from './path.js';
import { Grid } from './grid.js';
import { createEnemy, updateEnemy } from './enemies.js';
import { createTower, computeStats, upgradeInfo, updateTower } from './towers.js';
import { updateProjectiles, updateZones } from './projectiles.js';

const scratch = [];
const buf = [];

export class Game {
  constructor(opts = {}) {
    this.fxOn = opts.fx !== false;
    this.seed = opts.seed || 1;
    this.map = buildMap(MAP);
    this.grid = new Grid(MAP.width, MAP.height);
    this.waves = WAVES;
    this.reset();
  }

  reset() {
    this.rand = mulberry32(this.seed);
    this.gold = RULES.startGold;
    this.lives = RULES.startLives;
    this.wave = 0;            // number of waves started so far
    this.rewarded = 0;        // number of waves whose clear reward has been paid
    this.time = 0;
    this.over = null;         // null | 'win' | 'lose'
    this.nextId = 1;
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.zones = [];
    this.spawners = [];
    this.pending = [];        // deferred shatter explosions
    this.fx = [];
    this.globalSlow = 0;
    this.earned = 0;
    this.leaked = 0;
    this.kills = 0;
    this.streak = 0;          // kills chained less than RULES.streakWindow apart
    this.bestStreak = 0;
    this.lastKill = -99;
    this.income = [];         // gold earned per wave (index = wave - 1), for the bot and stats
  }

  emit(type, data) {
    if (!this.fxOn) return;
    data.type = type;
    this.fx.push(data);
  }

  // ---- waves ---------------------------------------------------------------------------------
  get totalWaves() { return this.waves.length; }
  get canStartWave() { return !this.over && this.wave < this.waves.length && this.spawners.length === 0; }
  get clear() { return this.spawners.length === 0 && this.enemies.length === 0; }
  get earlyBonus() { return this.enemies.length > 0 ? RULES.earlyBonus(this.wave + 1) : 0; }

  startWave() {
    if (!this.canStartWave) return false;
    const bonus = this.earlyBonus;
    if (bonus) {
      this.addGold(bonus);
      this.emit('bonus', { amount: bonus, label: 'Early call' });
    }
    const wave = this.waves[this.wave];
    this.wave++;
    for (const g of wave.groups) {
      this.spawners.push({ type: g.type, left: g.count, gap: g.gap, t: g.delay || 0, hp: (g.hp || 1) * (ENEMIES[g.type].boss ? 1 : WAVE_HP(this.wave)), wave: this.wave });
    }
    this.emit('wave', { n: this.wave });
    return true;
  }

  addGold(n) {
    this.gold += n;
    this.earned += n;
    if (this.wave > 0) this.income[this.wave - 1] = (this.income[this.wave - 1] || 0) + n;
  }

  // ---- towers --------------------------------------------------------------------------------
  canPlace(type, x, y) {
    if (!this.map.buildable(x, y)) return false;
    for (const t of this.towers) {
      if ((t.x - x) ** 2 + (t.y - y) ** 2 < RULES.towerSpacing ** 2) return false;
    }
    return true;
  }

  place(type, x, y) {
    const def = TOWERS[type];
    if (!def || this.over || this.gold < def.cost || !this.canPlace(type, x, y)) return null;
    this.gold -= def.cost;
    const t = createTower(this, type, x, y);
    this.towers.push(t);
    this.refreshGlobals();
    this.emit('place', { x, y });
    return t;
  }

  upgrade(tower, pi) {
    const info = upgradeInfo(tower, pi);
    if (!info.ok || this.over || this.gold < info.up.cost) return false;
    this.gold -= info.up.cost;
    tower.spent += info.up.cost;
    tower.tiers[pi]++;
    tower.stats = computeStats(tower.def, tower.tiers);
    this.refreshGlobals();
    this.emit('upgrade', { id: tower.id, x: tower.x, y: tower.y, path: pi, tier: tower.tiers[pi], name: info.up.name });
    return true;
  }

  sellValue(tower) { return Math.floor(tower.spent * RULES.sellRefund); }

  sell(tower) {
    const i = this.towers.indexOf(tower);
    if (i < 0 || this.over) return false;
    const value = this.sellValue(tower);
    this.towers.splice(i, 1);
    this.gold += value;
    this.refreshGlobals();
    this.emit('sell', { x: tower.x, y: tower.y, amount: value });
    return true;
  }

  refreshGlobals() {
    let slow = 0;
    for (const t of this.towers) if (t.stats.globalSlow > slow) slow = t.stats.globalSlow;
    this.globalSlow = slow;
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
  targetable(e, s) {
    if (!e.alive) return false;
    if (e.def.flying && !s.hitsAir) return false;
    if (e.def.stealth && !s.detect) return false;
    return true;
  }

  // Fills `out` with up to n targets for the tower, best first, by its targeting mode.
  pickTargets(t, n, out, minRange = 0) {
    out.length = 0;
    const s = t.stats;
    this.grid.query(t.x, t.y, s.range, buf);
    scratch.length = 0;
    const mode = t.targetMode;
    const min2 = minRange * minRange;
    for (let i = 0; i < buf.length; i++) {
      const e = buf[i];
      if (!this.targetable(e, s)) continue;
      const d2 = (e.x - t.x) ** 2 + (e.y - t.y) ** 2;
      if (d2 < min2) continue;
      let score;
      if (mode === 'first') score = e.dist;
      else if (mode === 'last') score = -e.dist;
      else if (mode === 'strong') score = (e.hp + e.shield) * 10000 + e.dist;
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
      scratch.sort((a, b) => b._score - a._score);
      for (let i = 0; i < n && i < scratch.length; i++) out.push(scratch[i]);
    }
    return out;
  }

  // ---- damage --------------------------------------------------------------------------------
  // opts: armorPierce (0-1), shieldMul, dot (no hit flash), quiet (no hit spark)
  damage(e, amount, type, src, opts) {
    if (!e.alive) return 0;
    let mult = e.def.mult && e.def.mult[type] !== undefined ? e.def.mult[type] : 1;
    if (mult < 1 && opts && opts.armorPierce) mult += (1 - mult) * opts.armorPierce;
    let amp = 1;
    if (e.markT > 0) amp += e.markPct;
    if (e.brittleT > 0 && (type === 'kinetic' || type === 'blast')) amp += e.brittlePct;
    if (e.chargedT > 0 && type === 'arcane') amp += e.chargedPct;
    if (e.scorchT > 0) amp += e.scorchPct;
    if (e.freezeT > 0) amp += e.frozenAmp || 0;
    let dmg = amount * mult * amp;
    let dealt = 0;

    if (e.shield > 0) {
      const sm = (opts && opts.shieldMul && type === 'arcane') ? opts.shieldMul
        : SHIELD_MULT[type] !== undefined ? SHIELD_MULT[type] : 1;
      if (sm <= 0) return 0;
      const soak = Math.min(e.shield, dmg * sm);
      e.shield -= soak;
      e.shieldCd = 3;
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
        this.emit('hit', { x: e.x, y: e.y, dtype: type, resisted: mult < 0.75, amt: dealt, maxHp: e.maxHp, big: !!(opts && opts.big) });
      }
    }
    if (e.hp <= 0) this.kill(e, src);
    return dealt;
  }

  kill(e, src) {
    e.alive = false;
    this.kills++;
    if (src) src.kills++;
    this.addGold(e.def.gold);
    this.emit('death', { x: e.x, y: e.y, r: e.r, etype: e.type, gold: e.def.gold, boss: !!e.def.boss, src: src ? src.id : 0 });
    this.streak = this.time - this.lastKill <= RULES.streakWindow ? this.streak + 1 : 1;
    this.lastKill = this.time;
    if (this.streak > this.bestStreak) this.bestStreak = this.streak;
    if (this.streak % RULES.streakStep === 0) {
      const bonus = RULES.streakGold(this.streak);
      this.addGold(bonus);
      this.emit('streak', { n: this.streak, gold: bonus });
    }
    if (e.shatterT > 0) {
      this.pending.push({ x: e.x, y: e.y, r: e.shatterRadius, dmg: e.shatterDmg, src: e.shatterSrc });
    }
    const split = e.def.split;
    if (split) {
      for (let i = 0; i < split.count; i++) {
        const child = createEnemy(this, split.type, Math.max(0, e.dist - i * 9), e.wave, e.hpMul);
        this.enemies.push(child);
      }
    }
  }

  // Leaks cost lives in proportion to the health the enemy still has (at least 1).
  leakCost(e) {
    return Math.max(1, Math.ceil(e.def.lives * Math.max(0, e.hp) / e.maxHp));
  }

  leak(e) {
    const cost = this.leakCost(e);
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
        this.enemies.push(createEnemy(this, s.type, 0, s.wave, s.hp));
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

    for (let i = 0; i < this.towers.length; i++) updateTower(this, this.towers[i], dt);
    updateProjectiles(this, dt);
    updateZones(this, dt);

    // shatter explosions (may chain: the list can grow while we walk it)
    for (let i = 0; i < this.pending.length; i++) {
      const p = this.pending[i];
      this.grid.query(p.x, p.y, p.r + 20, buf);
      const list = buf.slice();
      for (const e of list) this.damage(e, p.dmg, 'frost', p.src, QUIET);
      this.emit('shatter', { x: p.x, y: p.y, r: p.r });
    }
    this.pending.length = 0;

    // remove the dead
    let w = 0;
    for (let i = 0; i < es.length; i++) if (es[i].alive) es[w++] = es[i];
    es.length = w;

    // wave clear rewards and victory
    if (this.rewarded < this.wave && this.clear) {
      let total = 0;
      while (this.rewarded < this.wave) total += RULES.waveReward(++this.rewarded);
      this.addGold(total);
      this.emit('bonus', { amount: total, label: `Wave ${this.wave} cleared` });
      if (this.wave >= this.waves.length) {
        this.over = 'win';
        this.emit('over', { result: 'win' });
      }
    }
  }
}

const QUIET = { quiet: true };
