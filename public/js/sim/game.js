// Game state and rules. Pure simulation: no DOM, no rendering, so it also runs headless for bots.
// The renderer learns what happened through `game.fx`, a queue of small event objects.
import { MAP } from '../data/map.js';
import { RULES } from '../data/rules.js';
import { TOWERS } from '../data/towers.js';
import { WAVES } from '../data/waves.js';
import { ENEMIES, pops } from '../data/enemies.js';
import { SHIELD_MULT } from '../data/damage.js';
import { FLARE, LAST_LIGHT, ABILITIES } from '../data/abilities.js';
import { buildMap, mulberry32 } from './path.js';
import { Grid } from './grid.js';
import { createEnemy, updateEnemy, inherit, applySlow } from './enemies.js';
import { createTower, computeStats, upgradeInfo, updateTower } from './towers.js';
import { updateProjectiles, updateZones, launchShell } from './projectiles.js';
import { endlessWave, ENDLESS } from './endless.js';

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
    this.endless = false;     // continuing past the last campaign wave
    this.endlessWaves = new Map();
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
    if (this.endless) this.goldMul = ENDLESS.goldMul(this.wave);
    for (const g of wave.groups) {
      const mods = { hpMul: g.hpMul || 1, speedMul: g.speedMul || 1, veiled: !!g.veiled, mending: !!g.mending };
      this.spawners.push({ type: g.type, left: g.count, gap: g.gap, t: g.delay || 0, mods, wave: this.wave });
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
    this.spend(t, def.cost);
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
    this.spend(tower, info.up.cost);
    tower.tiers[pi]++;
    tower.stats = computeStats(tower.def, tower.tiers);
    // Reaching tier 4 unlocks the ward type's ability, one-third charged.
    const ab = ABILITIES[tower.type];
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
    return Math.floor(fresh + (tower.spent - fresh) * RULES.sellRefund);
  }

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
  // `area` attacks (pulses, explosions, fire) hit Veiled enemies without needing to see them.
  targetable(e, s, area) {
    if (!e.alive) return false;
    if (e.def.flying && !s.hitsAir) return false;
    if (e.veiled && !area && !s.detect && e.revealT <= 0) return false;
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
    const k = mult * amp;
    let dmg = amount * k;
    let dealt = 0;
    e.lastHit = this.time;

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
      this.spawnShed(e, p.type, p.count, 0, null, null);
      this.emit('phase', { x: e.x, y: e.y, n: e.phase, r: e.r });
    }
  }

  // Spawns `count` inner enemies at e's position. The first one takes the carried damage.
  spawnShed(e, type, count, carry, dtype, opts, src) {
    for (let i = 0; i < count; i++) {
      const child = createEnemy(this, type, Math.max(0, e.dist - i * 10), e.wave, e.mods, e.root);
      child.off = e.off + (count > 1 ? (i - (count - 1) / 2) * 7 : 0);
      inherit(child, e);
      child.wob = e.wob + i;
      this.map.path.posAt(child.dist, child, child.off);
      this.enemies.push(child);
      if (i === 0 && carry > 0.01) this.damage(child, carry, dtype, src, opts && opts.dot ? opts : CARRY);
    }
  }

  kill(e, src, carry = 0, dtype = 'true', opts = null) {
    e.alive = false;
    this.kills++;
    this.pops += e.def.gold;
    if (src) src.kills++;
    const gold = e.def.gold * this.goldMul;
    this.addGold(gold);
    this.emit('death', { x: e.x, y: e.y, r: e.r, etype: e.type, gold, boss: !!e.def.boss, heavy: !!e.def.heavy, src: src ? src.id : 0 });
    this.streak = this.time - this.lastKill <= RULES.streakWindow ? this.streak + 1 : 1;
    this.lastKill = this.time;
    if (this.streak > this.bestStreak) this.bestStreak = this.streak;
    if (this.streak % RULES.streakStep === 0) {
      const bonus = RULES.streakGold(this.streak);
      this.addGold(bonus);
      this.emit('streak', { n: this.streak, gold: bonus });
    }
    // Shatter: a chilled enemy explodes, as often as the spire's shatter rate allows.
    if (e.shatterT > 0 && e.shatterSrc && e.shatterSrc.shatterTokens >= 1) {
      e.shatterSrc.shatterTokens--;
      this.pending.push({ x: e.x, y: e.y, r: e.shatterRadius, dmg: e.shatterDmg, src: e.shatterSrc });
    }
    // Bosses that die before every phase has burst still release the rest.
    const ph = e.def.phases;
    if (ph) while (e.phase < ph.length) { const p = ph[e.phase++]; this.spawnShed(e, p.type, p.count, 0); }
    const shed = e.def.shed;
    if (shed) for (let i = 0; i < shed.length; i++) this.spawnShed(e, shed[i].type, shed[i].count, i === 0 ? carry : 0, dtype, opts, src);
  }

  // A leak costs one life per layer the enemy still holds: its own remaining health (in layers)
  // plus everything inside it. At least 1.
  leakCost(e) {
    const d = e.def;
    let n = Math.ceil(d.gold * Math.max(0, e.hp) / e.maxHp);
    for (const s of d.shed || []) n += pops(s.type) * s.count;
    if (d.phases) for (let i = e.phase; i < d.phases.length; i++) n += pops(d.phases[i].type) * d.phases[i].count;
    return Math.max(1, n);
  }

  leak(e) {
    if (this.lastLight && !e.def.boss) { this.triggerLastLight(e); return; }
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
    this.emit('flare', { x: MAP.goal.x, y: MAP.goal.y });
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
    const ab = ABILITIES[type];
    t.abilityCd = ab.cd;
    const s = t.stats;
    if (type === 'bolt') {
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
        else { this.map.path.posAt(60 + this.rand() * (this.map.path.length - 80), aim, 0); tx = aim.x; ty = aim.y; }
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
  }

  // The one free save: a nova at the Heartfire destroys every non-boss enemy near it, including
  // the one that got through. Nothing inside them escapes and they pay no gold.
  triggerLastLight(leaker) {
    this.lastLight = false;
    const g = MAP.goal, r2 = LAST_LIGHT.radius ** 2;
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
        this.enemies.push(createEnemy(this, s.type, 0, s.wave, s.mods));
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

    // Frost Sight spires reveal Veiled enemies in range to every ward.
    for (let i = 0; i < this.towers.length; i++) {
      const t = this.towers[i];
      if (!t.stats.reveal) continue;
      this.grid.query(t.x, t.y, t.stats.range, buf);
      for (const e of buf) if (e.veiled) e.revealT = 0.25;
    }
    for (let i = 0; i < this.towers.length; i++) updateTower(this, this.towers[i], dt);
    this.updateAbilities(dt);
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
