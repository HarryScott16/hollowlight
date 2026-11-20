// DOM user interface: HUD, ward shop, upgrade panel, wave preview and canvas input.
import { MAP } from '../data/map.js';
import { TOWERS, TOWER_ORDER } from '../data/towers.js';
import { ENEMIES, pops } from '../data/enemies.js';
import { DAMAGE_TYPES } from '../data/damage.js';
import { RULES, TARGET_MODES } from '../data/rules.js';
import { FLARE, LAST_LIGHT, ABILITIES } from '../data/abilities.js';
import { upgradeInfo, computeStats, estimateDps } from '../sim/towers.js';
import { drawWardIcon, nextSkin, skinName } from '../render/wardArt.js';
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
  if (k === 'aura') {
    const rows = [['Light radius', String(Math.round(s.range))]];
    if (s.auraRate) rows.push(['Attack speed inside', `+${pct(s.auraRate)}`]);
    if (s.auraDmg) rows.push(['Damage inside', `+${pct(s.auraDmg)}`]);
    if (s.auraRange) rows.push(['Range inside', `+${pct(s.auraRange)}`]);
    if (s.auraDetect) rows.push(['Wards inside see Veiled', 'yes']);
    if (s.auraAir) rows.push(['Wards inside hit flyers', 'yes']);
    if (s.reveal) rows.push(['Reveals Veiled', 'yes']);
    if (s.tithe) rows.push(['Gold per wave', `+${s.tithe}`]);
    if (s.interest) rows.push(['Interest', `${pct(s.interest)} (max ${s.interestCap})`]);
    return rows;
  }
  const rows = [
    ['Layers/s, crowd', fmt(estimateDps(k, s, true) / 10)],
    ['Damage/s, one target', fmt(estimateDps(k, s, false))],
    [k === 'beam' ? 'Damage/s at x1' : k === 'flame' ? 'Flame damage/s' : 'Damage', num(s.damage)],
  ];
  // A beam ramps and a flame pours: neither has an attack rate.
  if (k === 'beam') rows.push(['Max charge', `x${s.maxCharge} in ${num(s.ramp)}s`]);
  else if (k !== 'flame') rows.push([k === 'pulse' ? 'Pulses/s' : 'Attacks/s', num(s.rate)]);
  rows.push(['Range', s.global ? 'whole map' : String(Math.round(s.range))]);
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
  } else if (k === 'snipe') {
    if (s.shots > 1) rows.push(['Shots per volley', String(s.shots)]);
    rows.push(['vs flyers', `x${s.airMul}`]);
    if (s.heavyMul) rows.push(['vs hulks and bosses', `x${s.heavyMul}`]);
    if (s.armorPierce) rows.push(['Armour ignored', pct(s.armorPierce)]);
    if (s.flakRadius) rows.push(['Flak burst', `${s.flakRadius} wide, ${s.flakHits} enemies`]);
    if (s.spotRadius) rows.push(['Reveals around target', `${s.spotRadius} for ${s.spotDur}s`]);
    if (s.shieldMul) rows.push(['vs shields', `x${s.shieldMul}`]);
    if (s.reveal) rows.push(['Reveals Veiled in range', 'yes']);
  } else if (k === 'flame') {
    rows.push(['Cone', s.arc >= 6.28 ? 'all round' : `${Math.round((s.arc * 180) / Math.PI)}°`],
      ['Burn', `${num(s.burnDps)}/s for ${s.burnDur}s`], ['Scorched for', `${s.searDur}s`]);
    if (s.burnHeavy) rows.push(['Hulks burn', `x${s.burnHeavy}`]);
    if (s.spread) rows.push(['Wildfire', `${s.spread} enemies, ${s.spreadRate}/s`]);
    if (s.searAmp) rows.push(['Scorched take', `+${pct(s.searAmp)}`]);
    if (s.shieldMul) rows.push(['vs shields', `x${s.shieldMul}`]);
    if (s.brand) rows.push(['Scorched lose resistances', 'yes']);
  } else if (k === 'beam') {
    rows.push(['Beams', String(s.beams)]);
    if (s.keep) rows.push(['Charge kept on new target', pct(s.keep)]);
    if (s.burstMul) rows.push(['Kill bursts', `${pct(s.burstMul)} of beam, ${s.burstRadius} wide`]);
  }
  rows.push(['Sees Veiled', yes(s.detect)]);
  return rows;
}
const LOCK_TEXT = {
  paths: 'Locked: this ward already has two paths.',
  cap: 'Locked: only one path can go past tier 2.',
};

export class UI {
  constructor(game, renderer, canvas, sound) {
    this.game = game;
    this.sound = sound || null;
    this.popRate = { t: performance.now(), pops: 0, value: 0 };
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
    this.buildAbilities();
    this.bindHud();
    this.bindCanvas();
    this.bindKeys();
    this.refreshPreview();
    this.renderer.onCoin = () => this.bumpGold();
    this.syncMute();
    window.addEventListener('resize', () => this.renderer.resize());
  }

  // ---- shop ----------------------------------------------------------------------------------
  buildShop() {
    const list = $('shop-list');
    this.shopButtons = {};
    this.shopIcons = {};
    TOWER_ORDER.forEach((type, i) => {
      const def = TOWERS[type];
      const b = el('button', 'shop-btn');
      b.type = 'button';
      b.title = `${def.name} (${i + 1})`;
      const c = iconCanvas(48);
      drawWardIcon(c, type);
      this.shopIcons[type] = c;
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
      info.textContent = 'Hover a ward to see what it does. Keys: 1-8 pick a ward, Q W E upgrade the selected one, A S D F G H J K fire ward abilities, X the Flare, Esc cancels, Shift shows numbers, ` shows FPS.';
      return;
    }
    const def = TOWERS[type];
    const dt = DAMAGE_TYPES[def.base.type];
    info.append(el('b', null, `${def.name} - ${def.role}`), dt ? ` (${dt.name} damage). ${def.desc}` : `. ${def.desc}`);
  }

  setPlacing(type) {
    this.placing = type;
    if (type) this.select(null);
    for (const t in this.shopButtons) this.shopButtons[t].classList.toggle('active', t === type);
    this.canvas.classList.toggle('placing', !!type);
    this.showShopInfo(type);
  }

  // ---- abilities -----------------------------------------------------------------------------
  buildAbilities() {
    const list = $('ability-list');
    this.abButtons = [];
    const add = (id, name, key, desc, cls, use) => {
      const b = el('button', `ab-btn ${cls}`);
      b.type = 'button';
      b.title = `${name} [${key}]: ${desc}`;
      const cd = el('span', 'ab-cd'), time = el('span', 'ab-time');
      b.append(cd, el('span', 'ab-name', name), el('span', 'ab-key', key), time);
      b.addEventListener('click', use);
      list.append(b);
      this.abButtons.push({ id, b, cd, time, state: '' });
    };
    add('flare', 'Flare', FLARE.key, FLARE.desc, 'flare', () => this.game.useFlare());
    for (const type of TOWER_ORDER) {
      const ab = ABILITIES[type];
      add(type, ab.name, ab.key, `${ab.desc} Unlocks when a ${TOWERS[type].name} reaches tier 4.`, '', () => this.game.useAbility(type));
    }
    $('last-light').title = LAST_LIGHT.desc;
  }

  updateAbilities() {
    const g = this.game;
    for (const a of this.abButtons) {
      let left, max, locked = false;
      if (a.id === 'flare') { left = g.flareCd; max = FLARE.cd; } else {
        const t = g.abilityTower(a.id);
        if (!t) locked = true; else { left = t.abilityCd; max = ABILITIES[a.id].cd; }
      }
      const state = locked ? 'locked' : left <= 0 ? 'ready' : 'cd';
      if (state !== a.state) {
        a.state = state;
        a.b.classList.toggle('locked', state === 'locked');
        a.b.classList.toggle('ready', state === 'ready');
        a.b.disabled = state !== 'ready';
        if (state !== 'cd') { a.cd.style.height = '0%'; a.time.textContent = state === 'locked' ? 'tier 4' : 'ready'; }
      }
      if (state === 'cd') {
        a.cd.style.height = `${Math.round((left / max) * 100)}%`;
        a.time.textContent = `${Math.ceil(left)}s`;
      }
    }
    const spent = !g.lastLight;
    if (this.cache.lastLight !== spent) {
      this.cache.lastLight = spent;
      $('last-light').textContent = spent ? 'Last Light spent' : 'Last Light ready';
      $('last-light').classList.toggle('spent', spent);
    }
  }

  // ---- HUD -----------------------------------------------------------------------------------
  bindHud() {
    $('btn-wave').addEventListener('click', () => this.game.startWave());
    $('btn-pause').addEventListener('click', () => this.togglePause());
    $('btn-restart').addEventListener('click', () => this.restart());
    $('overlay-restart').addEventListener('click', () => this.restart());
    $('overlay-continue').addEventListener('click', () => this.continueEndless());
    $('btn-mute').addEventListener('click', () => this.toggleMute());
    $('chk-auto').addEventListener('change', (ev) => { this.auto = ev.target.checked; });
    this.speedButtons = [...document.querySelectorAll('[data-speed]')];
    for (const b of this.speedButtons) b.addEventListener('click', () => this.setSpeed(Number(b.dataset.speed)));
  }

  toggleMute() {
    if (!this.sound) return;
    this.sound.setMuted(!this.sound.muted);
    this.syncMute();
  }

  syncMute() {
    const b = $('btn-mute');
    if (!this.sound) { b.hidden = true; return; }
    b.textContent = this.sound.muted ? 'Sound off' : 'Sound on';
    b.classList.toggle('active', !this.sound.muted);
  }

  // A small bump on the gold counter each time a coin lands.
  bumpGold() {
    const g = $('hud-gold').parentElement;
    g.classList.remove('bump');
    void g.offsetWidth;
    g.classList.add('bump');
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

  continueEndless() {
    if (!this.game.continueEndless()) return;
    this.cache.over = null;
    $('overlay').hidden = true;
    this.refreshPreview();
  }

  // Best endless wave reached, kept in this browser only.
  get bestWave() {
    try { return Number(localStorage.getItem('hollowlight.bestWave')) || 0; } catch { return 0; }
  }

  recordWave(n) {
    if (n <= this.bestWave) return;
    try { localStorage.setItem('hollowlight.bestWave', String(n)); } catch { /* storage unavailable */ }
  }

  // ---- canvas input --------------------------------------------------------------------------
  toMap(ev) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = ((ev.clientX - r.left) / r.width) * MAP.width;
    this.mouse.y = ((ev.clientY - r.top) / r.height) * MAP.height;
  }

  // Wards stand upright, so a click on a ward's body (above its footprint) selects it too.
  wardAt(x, y) { return this.game.towerAt(x, y) || this.game.towerAt(x, y + 18); }

  // Hidden test switch between the two ward skins (also ?skin=lantern / ?skin=kindling).
  toggleSkin() {
    nextSkin();
    for (const type in this.shopIcons) drawWardIcon(this.shopIcons[type], type);
    if (this.selected) this.select(this.selected);
    this.renderer.text(MAP.width / 2, 70, `Skin: ${skinName()}`, '#ffffff', 18, 1.6, 10);
  }

  bindCanvas() {
    const c = this.canvas;
    c.addEventListener('pointermove', (ev) => {
      this.toMap(ev);
      this.mouse.inside = true;
      c.classList.toggle('hover-tower', !this.placing && !!this.wardAt(this.mouse.x, this.mouse.y));
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
      this.select(this.wardAt(this.mouse.x, this.mouse.y));
    });
    c.addEventListener('contextmenu', (ev) => ev.preventDefault());
  }

  bindKeys() {
    // Holding Shift shows every number in the ward panel.
    const details = (on) => document.body.classList.toggle('details', on);
    window.addEventListener('keydown', (ev) => { if (ev.key === 'Shift') details(true); });
    window.addEventListener('keyup', (ev) => { if (ev.key === 'Shift') details(false); });
    window.addEventListener('blur', () => details(false));
    window.addEventListener('keydown', (ev) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key;
      const low = k.length === 1 ? k.toLowerCase() : k;
      const abType = TOWER_ORDER.find((t) => ABILITIES[t].key.toLowerCase() === low);
      if (k === 'R' && ev.shiftKey) {
        // Restart sits behind Shift and a confirmation, well away from the upgrade keys.
        if (window.confirm ? window.confirm('Restart the run?') : true) this.restart();
      } else if (abType) {
        this.game.useAbility(abType);
      } else if (k === 'x' || k === 'X') {
        this.game.useFlare();
      } else if (k >= '1' && k <= '9') {
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
      } else if (k === '`') {
        this.renderer.showFps = !this.renderer.showFps;
      } else if (k === 'm' || k === 'M') {
        this.toggleMute();
      } else if (k === 'l' || k === 'L') {
        this.toggleSkin();
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
    drawWardIcon(icon, t.type, t.tiers);
    const titles = el('div');
    titles.append(el('h3', null, def.name), el('div', 'tp-role', `${def.role}  ·  tiers ${t.tiers.join(' / ')}${t.aura ? '  ·  boosted by a Beacon' : ''}`));
    const close = el('button', 'tp-close', '×');
    close.type = 'button';
    close.title = 'Deselect (Esc)';
    close.addEventListener('click', () => this.select(null));
    head.append(icon, titles, close);

    const stats = el('div', 'tp-stats');
    const dmg = el('b', null, '0'), kills = el('b', null, '0');
    const aura = def.kind === 'aura';
    const s1 = el('span', null, aura ? 'Wards boosted ' : 'Damage dealt '), s2 = el('span', null, aura ? 'Gold earned ' : 'Layers broken ');
    s1.append(dmg); s2.append(kills);
    stats.append(s1, s2);

    // The numbers stay out of the way: hover the hint (or hold Shift) to see them.
    const numbers = el('div', 'tp-numbers');
    const grid = el('div', 'tp-grid');
    for (const [label, value] of statRows(def, t.stats).slice(0, 7)) grid.append(el('span', null, label), el('b', null, value));
    numbers.append(el('span', 'tp-hint', 'Numbers: hover here or hold Shift'), grid);
    panel.append(head, stats, numbers);

    if (def.kind !== 'pulse' && def.kind !== 'aura') {
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
      const identity = el('div', 'path-blurb', path.blurb);
      const b = el('button', 'up-btn');
      b.type = 'button';
      const top = el('span', 'up-top');
      if (info.reason === 'max') {
        b.classList.add('maxed');
        top.append(el('span', null, path.tiers[RULES.maxTier - 1].name), el('span', 'up-cost', 'MAX'));
        b.append(top, el('span', 'up-desc', path.tiers[RULES.maxTier - 1].blurb));
      } else {
        top.append(el('span', null, `T${t.tiers[pi] + 1}  ${info.up.name}`), el('span', 'up-cost', info.ok ? String(info.up.cost) : 'Locked'));
        b.append(top, el('span', 'up-desc', info.ok ? info.up.blurb : LOCK_TEXT[info.reason]));
        if (info.ok) {
          // The exact numbers, shown on hover or while Shift is held: the full description and
          // before -> after for every stat this upgrade changes.
          const detail = el('span', 'up-detail');
          detail.append(el('span', 'up-exact', info.up.desc));
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
          detail.append(diff);
          b.append(detail);
          b.addEventListener('click', () => this.buyUpgrade(pi));
          b.addEventListener('pointerenter', () => { this.previewRange = next.range || 0; });
          b.addEventListener('pointerleave', () => { this.previewRange = 0; });
          upButtons.push({ b, cost: info.up.cost });
        } else {
          b.classList.add('locked');
        }
      }
      box.append(ph, identity, b);
      panel.append(box);
    });

    const sell = el('button', 'sell-btn');
    sell.type = 'button';
    const sellVal = el('b', null, String(this.game.sellValue(t)));
    const full = this.game.freshGold(t) >= t.spent;
    sell.append('Sell for ', sellVal, full ? '  (full refund this wave)' : `  (${Math.round(RULES.sellRefund * 100)}% refund)`);
    sell.addEventListener('click', () => this.sellSelected());
    panel.append(sell);

    this.panelRefs = { dmg, kills, upButtons };
    this.updatePanel();
  }

  updatePanel() {
    const refs = this.panelRefs, t = this.selected;
    if (!refs || !t) return;
    if (t.def.kind === 'aura') {
      const r2 = t.stats.range ** 2;
      refs.dmg.textContent = String(this.game.towers.filter((o) => o !== t && o.aura && (o.x - t.x) ** 2 + (o.y - t.y) ** 2 <= r2).length);
      refs.kills.textContent = fmt(t.goldEarned || 0);
    } else {
      refs.dmg.textContent = fmt(t.dmg);
      refs.kills.textContent = String(t.kills);
    }
    for (const u of refs.upButtons) u.b.classList.toggle('poor', this.game.gold < u.cost);
  }

  // ---- wave preview --------------------------------------------------------------------------
  refreshPreview() {
    const game = this.game;
    const list = $('preview-list');
    list.textContent = '';
    const wave = game.waveAt(game.wave);
    if (!wave) {
      $('preview-title').textContent = 'Final wave is out';
      list.append(el('span', 'pv-done', 'Nothing more is coming. Hold the line.'));
      return;
    }
    // Kinds of enemy (and Veiled) the player hasn't met yet in the campaign get a NEW tag.
    const seen = new Set();
    for (let i = 0; i < Math.min(game.wave, game.waves.length); i++) {
      for (const g of game.waves[i].groups) { seen.add(g.type); if (g.veiled) seen.add('veiled'); }
    }
    const counts = new Map();
    let total = 0;
    for (const g of wave.groups) {
      const key = g.veiled ? `${g.type}:v` : g.type;
      counts.set(key, (counts.get(key) || 0) + g.count);
      total += pops(g.type) * g.count;
    }
    const gp = RULES.popGold(game.wave + 1);
    const tough = Math.max(1, ...wave.groups.filter((g) => !ENEMIES[g.type].boss).map((g) => g.hpMul || 1));
    const toughNote = tough > 1.005 ? `  ·  shells x${tough.toFixed(2)} health` : '';
    // Whole numbers only: "1 gold per 14 pops" rather than "0.07 gold per pop".
    const goldNote = gp < 1 ? `  ·  1 gold per ${Math.round(1 / gp)} pops` : '';
    $('preview-title').textContent = `Next: wave ${game.wave + 1}${game.endless ? ' (endless)' : ` of ${game.totalWaves}`}  ·  ${fmt(total)} pops${toughNote}${goldNote}`;
    for (const [key, n] of counts) {
      const [type, v] = key.split(':');
      const def = ENEMIES[type];
      const item = el('div', def.boss ? 'pv boss' : 'pv');
      item.title = `${def.name}: ${def.desc}${v ? ' Veiled: only wards that see Veiled can target it, but area attacks hit it.' : ''}`;
      const c = iconCanvas(36);
      drawEnemyIcon(c, type);
      if (v) c.classList.add('veiled');
      const txt = el('div');
      const tags = v ? [...def.tags, 'Veiled'] : def.tags;
      const isNew = !seen.has(type) || (v && !seen.has('veiled'));
      if (isNew) txt.append(el('span', 'pv-new', 'NEW '));
      txt.append(el('span', 'pv-n', `×${n} `), el('span', 'pv-tag', tags.join(' ')), el('span', 'pv-name', def.name));
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
    // Pops per second, sampled twice a second and smoothed.
    const now = performance.now(), pr = this.popRate;
    if (now - pr.t >= 500) {
      const rate = ((g.pops - pr.pops) * 1000) / (now - pr.t);
      pr.value = g.pops < pr.pops ? 0 : pr.value * 0.4 + rate * 0.6;
      pr.t = now; pr.pops = g.pops;
      this.setText('hud-pops', String(Math.round(pr.value)));
    }
    this.setText('hud-wave', g.endless ? `${g.wave}  (endless, best ${Math.max(this.bestWave, g.wave)})` : `${g.wave} / ${g.totalWaves}`);
    if (g.endless && this.cache.recorded !== g.wave) { this.cache.recorded = g.wave; this.recordWave(g.wave); }

    let label;
    if (g.over) label = g.over === 'win' ? 'Victory' : 'Defeated';
    else if (g.wave >= g.totalWaves && !g.endless) label = 'Final wave in progress';
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
    this.updateAbilities();

    if (g.over && this.cache.over !== g.over) {
      this.cache.over = g.over;
      const win = g.over === 'win';
      const best = this.bestWave;
      $('overlay-title').textContent = win ? 'The Heartfire holds!' : 'The Heartfire is out';
      let text;
      if (win) text = `All ${g.totalWaves} waves beaten with ${g.lives} lives left.\n${fmt(g.pops)} layers broken.\nThe night isn't over: keep going for as long as you can hold.${best ? `\nYour best: wave ${best}.` : ''}`;
      else if (g.endless) text = `The Gloom broke through on endless wave ${g.wave}.\n${fmt(g.pops)} layers broken.\nBest: wave ${Math.max(best, g.wave)}.`;
      else text = `The Gloom broke through on wave ${g.wave} of ${g.totalWaves}.\n${fmt(g.pops)} layers broken.`;
      $('overlay-text').textContent = text;
      $('overlay-continue').hidden = !win;
      document.querySelector('.overlay-card').className = `overlay-card ${g.over}`;
      $('overlay').hidden = false;
      this.setPlacing(null);
    }
  }
}
