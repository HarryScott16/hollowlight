// DOM user interface: HUD, ward shop, upgrade panel, wave preview and canvas input.
import { MAP } from '../data/map.js';
import { TOWERS, TOWER_ORDER } from '../data/towers.js';
import { ENEMIES } from '../data/enemies.js';
import { DAMAGE_TYPES } from '../data/damage.js';
import { RULES, TARGET_MODES } from '../data/rules.js';
import { upgradeInfo, computeStats, estimateDps } from '../sim/towers.js';
import { drawTowerIcon } from '../render/towerArt.js';
import { drawEnemyIcon } from '../render/enemyArt.js';

const $ = (id) => document.getElementById(id);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function iconCanvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size * 2;   // 2x for crisp icons
  return c;
}

const fmt = (n) => (n >= 10000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)));
const num = (n) => (n >= 100 ? String(Math.round(n)) : n >= 10 ? n.toFixed(1).replace(/\.0$/, '') : n.toFixed(2).replace(/0$/, '').replace(/\.0$/, ''));
const pct = (n) => `${Math.round(n * 100)}%`;
const yes = (b) => (b ? 'yes' : 'no');

// Rows shown in the tower panel and in upgrade before/after comparisons: [label, value text].
function statRows(def, s) {
  const k = def.kind;
  const rows = [
    ['Layers/s, crowd', fmt(estimateDps(k, s, true) / 10)],
    ['Damage/s, one target', fmt(estimateDps(k, s, false))],
    ['Damage', num(s.damage)],
    [k === 'pulse' ? 'Pulses/s' : 'Attacks/s', num(s.rate)],
    ['Range', String(Math.round(s.range))],
  ];
  if (k === 'bolt') {
    rows.push(['Bolts per shot', String(s.shots)], ['Pierce', s.pierce >= 999 ? 'all' : String(s.pierce)]);
    if (s.bounces) rows.push(['Ricochets', String(s.bounces)]);
    if (s.armorPierce) rows.push(['Armour ignored', pct(s.armorPierce)]);
    if (s.knockback) rows.push(['Knockback', String(s.knockback)]);
    if (s.markPct) rows.push(['Mark bonus', `+${pct(s.markPct)}`]);
    if (s.markRadius) rows.push(['Mark spread', String(s.markRadius)]);
    if (s.execute) rows.push(['Execute below', pct(s.execute)]);
    if (s.lance) rows.push(['Lance', 'full map']);
  } else if (k === 'mortar') {
    rows.push(['Blast radius', String(Math.round(s.radius))], ['Enemies per blast', String(s.maxHits)], ['Shells per volley', String(s.shells)]);
    if (s.stun) rows.push(['Stun', `${s.stun}s`]);
    if (s.burnDps) rows.push(['Burn', `${s.burnDps}/s`]);
    if (s.poolDps) rows.push(['Fire pool', `${s.poolDps}/s for ${s.poolDur}s`]);
    if (s.cluster) rows.push(['Bomblets', String(s.cluster)]);
    if (s.scorch) rows.push(['Scorch', `+${pct(s.scorch)} dmg taken`]);
  } else if (k === 'pulse') {
    rows.push(['Enemies per pulse', String(s.maxHits)], ['Slow', pct(s.slow)], ['Slow lasts', `${s.slowDur}s`]);
    if (s.reveal) rows.push(['Reveals Veiled', 'yes']);
    if (s.freezeEvery) rows.push(['Freeze', `every ${s.freezeEvery} pulses, ${s.freezeDur}s`]);
    if (s.frozenAmp) rows.push(['Frozen take', `+${pct(s.frozenAmp)}`]);
    if (s.brittle) rows.push(['Brittle', `+${pct(s.brittle)}`]);
    if (s.shatterDmg) rows.push(['Shatter', `${s.shatterDmg} (max ${s.shatterRate}/s)`]);
    if (s.globalSlow) rows.push(['Map-wide slow', pct(s.globalSlow)]);
  } else if (k === 'chain') {
    rows.push(['Enemies per chain', String(s.chains)]);
    if (s.falloff < 1) rows.push(['Jump loss', pct(1 - s.falloff)]);
    if (s.forks > 1) rows.push(['Chains per strike', String(s.forks)]);
    if (s.heavyMul) rows.push(['vs hulks and bosses', `x${s.heavyMul}`]);
    if (s.stunChance) rows.push(['Stun chance', pct(s.stunChance)]);
    if (s.chargedPct) rows.push(['Charged', `+${pct(s.chargedPct)} arcane`]);
    if (s.smiteEvery) rows.push(['Thunderbolt', `every ${s.smiteEvery}, x${s.smiteMul}`]);
  }
  rows.push(['Sees Veiled', yes(s.detect)]);
  return rows;
}
const LOCK_TEXT = {
  paths: 'Locked: this ward already has two paths.',
  cap: 'Locked: only one path can go past tier 2.',
};

export class UI {
  constructor(game, renderer, canvas) {
    this.game = game;
    this.renderer = renderer;
    this.canvas = canvas;
    this.placing = null;
    this.selected = null;
    this.mouse = { x: 0, y: 0, inside: false };
    this.speed = 1;
    this.previewRange = 0;
    this.paused = false;
    this.auto = false;
    this.cache = {};
    this.panelTick = 0;

    this.buildShop();
    this.bindHud();
    this.bindCanvas();
    this.bindKeys();
    this.refreshPreview();
    window.addEventListener('resize', () => this.renderer.resize());
  }

  // ---- shop ----------------------------------------------------------------------------------
  buildShop() {
    const list = $('shop-list');
    this.shopButtons = {};
    TOWER_ORDER.forEach((type, i) => {
      const def = TOWERS[type];
      const b = el('button', 'shop-btn');
      b.type = 'button';
      b.title = `${def.name} (${i + 1})`;
      const c = iconCanvas(48);
      drawTowerIcon(c, type);
      b.append(el('span', 'key', String(i + 1)), c, el('span', 'cost', String(def.cost)));
      b.addEventListener('click', () => this.setPlacing(this.placing === type ? null : type));
      b.addEventListener('pointerenter', () => this.showShopInfo(type));
      b.addEventListener('pointerleave', () => this.showShopInfo(this.placing));
      list.append(b);
      this.shopButtons[type] = b;
    });
    this.showShopInfo(null);
  }

  showShopInfo(type) {
    const info = $('shop-info');
    info.textContent = '';
    if (!type) {
      info.textContent = 'Hover a ward to see what it does. Keys 1-4 pick a ward, Esc cancels, F shows FPS.';
      return;
    }
    const def = TOWERS[type];
    const dt = DAMAGE_TYPES[def.base.type];
    info.append(el('b', null, `${def.name} - ${def.role}`), ` (${dt ? dt.name : 'no'} damage). ${def.desc}`);
  }

  setPlacing(type) {
    this.placing = type;
    if (type) this.select(null);
    for (const t in this.shopButtons) this.shopButtons[t].classList.toggle('active', t === type);
    this.canvas.classList.toggle('placing', !!type);
    this.showShopInfo(type);
  }

  // ---- HUD -----------------------------------------------------------------------------------
  bindHud() {
    $('btn-wave').addEventListener('click', () => this.game.startWave());
    $('btn-pause').addEventListener('click', () => this.togglePause());
    $('btn-restart').addEventListener('click', () => this.restart());
    $('overlay-restart').addEventListener('click', () => this.restart());
    $('chk-auto').addEventListener('change', (ev) => { this.auto = ev.target.checked; });
    this.speedButtons = [...document.querySelectorAll('[data-speed]')];
    for (const b of this.speedButtons) b.addEventListener('click', () => this.setSpeed(Number(b.dataset.speed)));
  }

  setSpeed(n) {
    this.speed = n;
    for (const b of this.speedButtons) b.classList.toggle('active', Number(b.dataset.speed) === n);
  }

  togglePause() {
    if (this.game.over) return;
    this.paused = !this.paused;
    $('btn-pause').textContent = this.paused ? 'Resume' : 'Pause';
    $('btn-pause').classList.toggle('active', this.paused);
    $('paused-tag').hidden = !this.paused;
  }

  restart() {
    this.game.reset();
    this.renderer.clearFx();
    if (this.paused) this.togglePause();
    this.setPlacing(null);
    this.select(null);
    this.cache = {};
    $('overlay').hidden = true;
    this.refreshPreview();
  }

  // ---- canvas input --------------------------------------------------------------------------
  toMap(ev) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = ((ev.clientX - r.left) / r.width) * MAP.width;
    this.mouse.y = ((ev.clientY - r.top) / r.height) * MAP.height;
  }

  bindCanvas() {
    const c = this.canvas;
    c.addEventListener('pointermove', (ev) => {
      this.toMap(ev);
      this.mouse.inside = true;
      c.classList.toggle('hover-tower', !this.placing && !!this.game.towerAt(this.mouse.x, this.mouse.y));
    });
    c.addEventListener('pointerleave', () => { this.mouse.inside = false; });
    c.addEventListener('pointerdown', (ev) => {
      this.toMap(ev);
      this.mouse.inside = true;
      if (ev.button === 2) { this.setPlacing(null); return; }
      if (ev.button !== 0) return;
      if (this.placing) {
        const t = this.game.place(this.placing, this.mouse.x, this.mouse.y);
        // Hold Shift to keep placing the same ward.
        if (t && !ev.shiftKey) { this.setPlacing(null); this.select(t); }
        return;
      }
      this.select(this.game.towerAt(this.mouse.x, this.mouse.y));
    });
    c.addEventListener('contextmenu', (ev) => ev.preventDefault());
  }

  bindKeys() {
    window.addEventListener('keydown', (ev) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key;
      if (k >= '1' && k <= '9') {
        const type = TOWER_ORDER[Number(k) - 1];
        if (type) this.setPlacing(this.placing === type ? null : type);
      } else if (k === ' ') {
        ev.preventDefault();
        this.togglePause();
      } else if (k === 'Enter') {
        ev.preventDefault();
        this.game.startWave();
      } else if (k === 'Escape') {
        if (this.placing) this.setPlacing(null); else this.select(null);
      } else if (k === 'f' || k === 'F') {
        this.renderer.showFps = !this.renderer.showFps;
      } else if (k === 'r' || k === 'R') {
        this.restart();
      } else if (this.selected && (k === 'Backspace' || k === 'Delete')) {
        this.sellSelected();
      } else if (this.selected && 'qwe'.includes(k.toLowerCase()) && k.length === 1) {
        this.buyUpgrade('qwe'.indexOf(k.toLowerCase()));
      } else if (k === 'Tab' && this.game.towers.length) {
        ev.preventDefault();
        const i = this.game.towers.indexOf(this.selected);
        this.select(this.game.towers[(i + 1) % this.game.towers.length]);
      }
    });
  }

  // ---- tower panel ---------------------------------------------------------------------------
  select(tower) {
    this.selected = tower || null;
    this.previewRange = 0;
    this.buildPanel();
  }

  buyUpgrade(pi) {
    if (this.selected && this.game.upgrade(this.selected, pi)) {
      this.buildPanel();
      // Keep the range preview on the button now under the pointer.
      this.previewRange = 0;
    }
  }

  sellSelected() {
    if (this.selected && this.game.sell(this.selected)) this.select(null);
  }

  buildPanel() {
    const panel = $('tower-panel');
    const t = this.selected;
    panel.textContent = '';
    panel.hidden = !t;
    this.panelRefs = null;
    if (!t) return;
    const def = t.def;

    const head = el('div', 'tp-head');
    const icon = iconCanvas(48);
    drawTowerIcon(icon, t.type, t.tiers);
    const titles = el('div');
    titles.append(el('h3', null, def.name), el('div', 'tp-role', `${def.role}  ·  tiers ${t.tiers.join(' / ')}`));
    const close = el('button', 'tp-close', '×');
    close.type = 'button';
    close.title = 'Deselect (Esc)';
    close.addEventListener('click', () => this.select(null));
    head.append(icon, titles, close);

    const stats = el('div', 'tp-stats');
    const dmg = el('b', null, '0'), kills = el('b', null, '0');
    const s1 = el('span', null, 'Damage dealt '), s2 = el('span', null, 'Kills ');
    s1.append(dmg); s2.append(kills);
    stats.append(s1, s2);

    const grid = el('div', 'tp-grid');
    for (const [label, value] of statRows(def, t.stats).slice(0, 7)) grid.append(el('span', null, label), el('b', null, value));
    panel.append(head, stats, grid);

    if (def.kind !== 'pulse') {
      const row = el('div', 'tp-target', 'Target');
      for (const m of TARGET_MODES) {
        const b = el('button', t.targetMode === m.id ? 'active' : '', m.label);
        b.type = 'button';
        b.addEventListener('click', () => { t.targetMode = m.id; this.buildPanel(); });
        row.append(b);
      }
      panel.append(row);
    }

    const upButtons = [];
    def.paths.forEach((path, pi) => {
      const info = upgradeInfo(t, pi);
      const box = el('div', `path p${pi}`);
      const ph = el('div', 'path-head');
      const pips = el('span', 'pips');
      for (let i = 0; i < RULES.maxTier; i++) pips.append(el('span', i < t.tiers[pi] ? 'pip on' : 'pip'));
      ph.append(el('span', null, `${path.name}  [${'QWE'[pi]}]`), pips);
      const b = el('button', 'up-btn');
      b.type = 'button';
      const top = el('span', 'up-top');
      if (info.reason === 'max') {
        b.classList.add('maxed');
        top.append(el('span', null, path.tiers[RULES.maxTier - 1].name), el('span', 'up-cost', 'MAX'));
        b.append(top);
      } else {
        top.append(el('span', null, `T${t.tiers[pi] + 1}  ${info.up.name}`), el('span', 'up-cost', info.ok ? String(info.up.cost) : 'Locked'));
        b.append(top, el('span', 'up-desc', info.ok ? info.up.desc : LOCK_TEXT[info.reason]));
        if (info.ok) {
          // Before -> after for every stat this upgrade changes.
          const tiers = t.tiers.slice();
          tiers[pi]++;
          const next = computeStats(def, tiers);
          const before = new Map(statRows(def, t.stats));
          const diff = el('span', 'up-diff');
          for (const [label, value] of statRows(def, next)) {
            const old = before.get(label);
            if (old === value) continue;
            const row = el('span', 'up-row');
            row.append(el('span', 'up-label', label), el('span', 'up-old', old === undefined ? '-' : old), ' → ', el('b', null, value));
            diff.append(row);
          }
          b.append(diff);
          b.addEventListener('click', () => this.buyUpgrade(pi));
          b.addEventListener('pointerenter', () => { this.previewRange = next.range; });
          b.addEventListener('pointerleave', () => { this.previewRange = 0; });
          upButtons.push({ b, cost: info.up.cost });
        } else {
          b.classList.add('locked');
        }
      }
      box.append(ph, b);
      panel.append(box);
    });

    const sell = el('button', 'sell-btn');
    sell.type = 'button';
    const sellVal = el('b', null, String(this.game.sellValue(t)));
    sell.append('Sell for ', sellVal, `  (${Math.round(RULES.sellRefund * 100)}% refund)`);
    sell.addEventListener('click', () => this.sellSelected());
    panel.append(sell);

    this.panelRefs = { dmg, kills, upButtons };
    this.updatePanel();
  }

  updatePanel() {
    const refs = this.panelRefs, t = this.selected;
    if (!refs || !t) return;
    refs.dmg.textContent = fmt(t.dmg);
    refs.kills.textContent = String(t.kills);
    for (const u of refs.upButtons) u.b.classList.toggle('poor', this.game.gold < u.cost);
  }

  // ---- wave preview --------------------------------------------------------------------------
  refreshPreview() {
    const game = this.game;
    const list = $('preview-list');
    list.textContent = '';
    const wave = game.waves[game.wave];
    $('preview-title').textContent = wave ? `Next: wave ${game.wave + 1} of ${game.totalWaves}` : 'Final wave is out';
    if (!wave) {
      list.append(el('span', 'pv-done', 'Nothing more is coming. Hold the line.'));
      return;
    }
    const counts = new Map();
    for (const g of wave.groups) counts.set(g.type, (counts.get(g.type) || 0) + g.count);
    for (const [type, n] of counts) {
      const def = ENEMIES[type];
      const item = el('div', def.boss ? 'pv boss' : 'pv');
      item.title = `${def.name}: ${def.desc}`;
      const c = iconCanvas(36);
      drawEnemyIcon(c, type);
      const txt = el('div');
      txt.append(el('span', 'pv-n', `×${n} `), el('span', 'pv-tag', def.tags.join(' ')), el('span', 'pv-name', def.name));
      item.append(c, txt);
      list.append(item);
    }
  }

  // ---- per-frame sync ------------------------------------------------------------------------
  setText(id, value) {
    if (this.cache[id] === value) return;
    this.cache[id] = value;
    $(id).textContent = value;
  }

  update() {
    const g = this.game;
    if (this.auto && !this.paused && g.canStartWave && g.clear) g.startWave();

    this.setText('hud-lives', String(g.lives));
    this.setText('hud-gold', String(Math.floor(g.gold)));
    this.setText('hud-wave', `${g.wave} / ${g.totalWaves}`);

    let label;
    if (g.over) label = g.over === 'win' ? 'Victory' : 'Defeated';
    else if (g.wave >= g.totalWaves) label = 'Final wave in progress';
    else if (!g.canStartWave) label = `Wave ${g.wave} incoming...`;
    else if (g.earlyBonus) label = `Call wave ${g.wave + 1} early (+${g.earlyBonus})`;
    else label = `Start wave ${g.wave + 1}  [Enter]`;
    this.setText('btn-wave', label);
    const dis = !g.canStartWave;
    if (this.cache.waveDis !== dis) { this.cache.waveDis = dis; $('btn-wave').disabled = dis; }

    if (this.cache.wave !== g.wave) { this.cache.wave = g.wave; this.refreshPreview(); }

    const gold = Math.floor(g.gold);
    if (this.cache.shopGold !== gold) {
      this.cache.shopGold = gold;
      for (const type in this.shopButtons) this.shopButtons[type].classList.toggle('poor', gold < TOWERS[type].cost);
    }

    if (this.selected && !g.towers.includes(this.selected)) this.select(null);
    if (++this.panelTick % 8 === 0) this.updatePanel();

    if (g.over && this.cache.over !== g.over) {
      this.cache.over = g.over;
      const win = g.over === 'win';
      $('overlay-title').textContent = win ? 'The Heartfire holds!' : 'The Heartfire is out';
      $('overlay-text').textContent = win
        ? `All ${g.totalWaves} waves beaten with ${g.lives} lives left.\n${g.kills} Gloom destroyed.`
        : `The Gloom broke through on wave ${g.wave} of ${g.totalWaves}.\n${g.kills} Gloom destroyed.`;
      document.querySelector('.overlay-card').className = `overlay-card ${g.over}`;
      $('overlay').hidden = false;
      this.setPlacing(null);
    }
  }
}
