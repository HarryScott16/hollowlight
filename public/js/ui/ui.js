// DOM user interface: HUD, ward shop, upgrade panel, wave preview and canvas input.
import { MAP } from '../data/map.js';
import { TOWERS, TOWER_ORDER, WARD_KEYS } from '../data/towers.js';
import { ENEMIES, pops } from '../data/enemies.js';
import { DAMAGE_TYPES } from '../data/damage.js';
import { RULES, TARGET_MODES, vaultRate } from '../data/rules.js';
import { FLARE, LAST_LIGHT, ABILITIES } from '../data/abilities.js';
import { upgradeInfo, computeStats, estimateDps } from '../sim/towers.js';
import { drawWardIcon, nextSkin, skinName } from '../render/wardArt.js';
import { drawEnemyIcon } from '../render/enemyArt.js';
import { TestMode, testFromQuery, TEST_ALLOWED } from './testmode.js';
import { bestFor, recordWave } from './records.js';
import { UpgradeTree } from './tree.js';

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
  if (k === 'vault') {
    const rows = [['Gathers from', s.gleanAll ? 'every kill (half outside)' : `range ${Math.round(s.range)}`], ['Share of bounty', pct(s.glean)], ['Cap', String(s.cap)], ['Interest per wave', `${pct(s.growth)} (+2%/wave held)`], ['Interest grows it to', String(s.cap * RULES.vaultCeiling)]];
    if (s.warmRate) rows.push(['Warm boost', `+${pct(s.warmRate)} speed${s.warmDmg ? `, +${pct(s.warmDmg)} dmg` : ''}`], ['Warm from', `${pct(s.warmAt || 0.5)} full`]);
    return rows;
  }
  if (k === 'lure') {
    const rows = [['Lure radius', String(Math.round(s.range))], ['Flyers at once', String(s.lureMax)], ['Lure lasts', `${num(s.lureDur)}s`]];
    if (s.lureAmp) rows.push(['Lured take', `+${pct(s.lureAmp)}`]);
    if (s.lureDps) rows.push(['Moth damage/s', num(s.lureDps)]);
    if (s.releaseSlow) rows.push(['Release slow', `${pct(s.releaseSlow)} for ${s.releaseSlowDur}s`]);
    if (s.groundDur) rows.push(['Grounded for', `${s.groundDur}s`]);
    if (s.reveal || s.lureReveal) rows.push(['Reveals Veiled', s.reveal ? 'in range' : 'lured flyers']);
    return rows;
  }
  if (k === 'snare') {
    const rows = [['Layers/s, crowd', fmt(estimateDps(k, s, true) / 10)], ['Damage per bite', num(s.damage)], ['Charges', String(Math.round(s.charges))], ['Refill', `${num(s.refill)}/s`]];
    if (s.armorPierce) rows.push(['Armour ignored', pct(s.armorPierce)]);
    if (s.slow) rows.push(['Slow', `${pct(s.slow)} for ${s.slowDur}s`]);
    if (s.rootDur) rows.push(['Holds for', `${s.rootDur}s${s.rootHits ? `, ${s.rootHits} around` : ''}`]);
    if (s.heavyRoot) rows.push(['Holds a Heavy', `${s.heavyRoot}s every ${s.heavyRootEvery}s`]);
    if (s.mineMax) rows.push(['Mines', `${s.mineMax}, one per ${num(s.mineEvery)}s`], ['Mine burst', `${s.mineDmg} on ${s.mineHits}, ${s.mineRadius} wide`]);
    return rows;
  }
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
  } else if (k === 'wander') {
    if (s.lights > 1) rows.push(['Lights', String(s.lights)]);
    if (s.shots > 1) rows.push(['Stars per cast', String(s.shots)]);
    rows.push(['Roams', String(Math.round(s.leash))], ['Star burst', `${pct(s.starMul)} on ${s.starHits}, ${s.starRadius} wide`]);
    if (s.markPct) rows.push(['Mark bonus', `+${pct(s.markPct)}`]);
    if (s.torchRate) rows.push(['Torch boost', `+${pct(s.torchRate)} speed${s.torchDmg ? `, +${pct(s.torchDmg)} dmg` : ''}`]);
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
  unique: 'Only one of each tier 5 at a time: another ward of this kind holds it. Click to show it.',
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
    this.inMenu = false;      // a menu is open (ui/menu.js): the game holds and isn't drawn
    this.menu = null;         // set by main.js
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
    this.test = new TestMode(this);
    this.tree = new UpgradeTree(this);
    if (typeof location !== 'undefined' && testFromQuery(location.search)) this.test.enable();
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
      b.title = `${def.name} (${WARD_KEYS[i]}). Right-click: its upgrade tree`;
      const c = iconCanvas(48);
      drawWardIcon(c, type);
      this.shopIcons[type] = c;
      b.append(el('span', 'key', WARD_KEYS[i]), c, el('span', 'cost', String(def.cost)));
      // Click a ward, then click the map (Shift keeps placing); or drag it from here onto the map.
      b.addEventListener('pointerdown', (ev) => {
        if (ev.button !== undefined && ev.button !== 0) return;
        this.dragFrom = type;
        if (this.placing !== type) { this.setPlacing(type); this.justPicked = true; } else this.justPicked = false;
      });
      b.addEventListener('click', (ev) => {
        // a keyboard press on the button (no pointer) toggles; a pointer click was handled on pointerdown
        if (ev && ev.detail === 0) { this.setPlacing(this.placing === type ? null : type); return; }
        if (!this.justPicked && this.placing === type) this.setPlacing(null);
        this.justPicked = false;
      });
      b.addEventListener('pointerenter', () => { this.shopHover = type; this.showShopInfo(type); });
      b.addEventListener('pointerleave', () => { this.shopHover = null; this.showShopInfo(this.placing); });
      b.addEventListener('contextmenu', (ev) => { ev.preventDefault(); this.dragFrom = null; this.tree.show(type); });
      list.append(b);
      this.shopButtons[type] = b;
    });
    this.showShopInfo(null);
  }

  showShopInfo(type) {
    const info = $('shop-info');
    info.textContent = '';
    if (!type) {
      info.textContent = 'Hover a ward to see what it does. Keys: 1-9, 0, - and = pick a ward (in shop order). Q W E upgrade the selected ward, U shows its upgrade tree (right-click a ward here for its tree), R is its special action (cash out a Vault, move a Wandering Light). Abilities: A S D F G H J K for the first eight wards, Z C V B for the last four, X the Flare. Space pauses, Enter calls the next wave, Esc cancels, Shift shows numbers, ` shows FPS.';
      return;
    }
    const def = TOWERS[type];
    const dt = DAMAGE_TYPES[def.base.type];
    info.append(el('b', null, `${def.name} - ${def.role}`), dt ? ` (${dt.name} damage). ${def.desc}` : `. ${def.desc}`);
    const tree = el('button', 'tree-open', 'Upgrade tree  [U]');
    tree.type = 'button';
    tree.title = 'Every path and tier of this ward (also: right-click it in the shop)';
    tree.addEventListener('click', () => this.tree.show(type));
    info.append(' ', tree);
  }

  setPlacing(type) {
    this.placing = type;
    this.moving = null;
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
    let open = 0;
    for (const a of this.abButtons) {
      let left, max, locked = false;
      if (a.id === 'flare') { left = g.flareCd; max = FLARE.cd; } else {
        const t = g.abilityTower(a.id);
        if (!t) locked = true; else { left = t.abilityCd; max = ABILITIES[a.id].cd; }
      }
      const state = locked ? 'locked' : left <= 0 ? 'ready' : 'cd';
      if (!locked && a.id !== 'flare') open++;
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
    // Locked abilities take no room (they appear once a ward of their type reaches tier 4).
    if (this.cache.abOpen !== open) { this.cache.abOpen = open; $('ability-list').classList.toggle('none-open', open === 0); }
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
    $('btn-pause').addEventListener('click', () => (this.menu ? this.menu.togglePause() : this.togglePause()));
    $('overlay-menu').addEventListener('click', () => { if (this.menu) this.menu.showTitle(); });
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

  // A new run on another map or difficulty (from the menus).
  newGame(mapId, diffId) {
    this.game.load(mapId, diffId);
    this.renderer.mapChanged();
    this.restart();
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

  // Best wave reached on this map and difficulty, kept in this browser (ui/records.js).
  get bestWave() { return bestFor(this.game.map.data.id, this.game.diff.id).wave; }

  recordWave(n, won = false) {
    if (this.test.on) return;   // test runs never count
    recordWave(this.game.map.data.id, this.game.diff.id, n, won);
  }

  // ---- canvas input --------------------------------------------------------------------------
  toMap(ev) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = ((ev.clientX - r.left) / r.width) * MAP.width;
    this.mouse.y = ((ev.clientY - r.top) / r.height) * MAP.height;
  }

  // Wards stand upright, so a click on a ward's body (above its footprint) selects it too.
  // The ward under the pointer. A Wandering Light roams, so it can also be picked by its anchor
  // (the rune-stone at its post, checked first: it's small and never moves) or any of its lights.
  wardAt(x, y) {
    for (const t of this.game.towers) {
      if (t.def.kind !== 'wander') continue;
      if ((t.hx - x) ** 2 + ((t.hy - 6) - y) ** 2 < 15 * 15) return t;
    }
    const hit = this.game.towerAt(x, y) || this.game.towerAt(x, y + 18) || this.game.towerAt(x, y + 34);
    if (hit) return hit;
    for (const t of this.game.towers) {
      if (t.def.kind !== 'wander') continue;
      for (let i = 1; i < t.lights.length; i++) {
        const L = t.lights[i];
        if ((L.x - x) ** 2 + (L.y - 16 - y) ** 2 < 22 * 22) return t;
      }
    }
    return null;
  }

  // Hidden test switch between the two ward skins (also ?skin=lantern / ?skin=kindling).
  toggleSkin() {
    nextSkin();
    this.skinChanged();
    this.renderer.text(MAP.width / 2, 70, `Skin: ${skinName()}`, '#ffffff', 18, 1.6, 10);
  }
  // Redraw everything that shows a ward's picture after the skin changes.
  skinChanged() {
    for (const type in this.shopIcons) drawWardIcon(this.shopIcons[type], type);
    if (this.selected) this.select(this.selected);
  }

  bindCanvas() {
    const c = this.canvas;
    c.addEventListener('pointermove', (ev) => {
      this.toMap(ev);
      this.mouse.inside = true;
      c.classList.toggle('hover-tower', !this.placing && !!this.wardAt(this.mouse.x, this.mouse.y));
    });
    c.addEventListener('pointerleave', () => { this.mouse.inside = false; });
    // Dropping a ward dragged from the shop: place it where the pointer is released.
    c.addEventListener('pointerup', (ev) => {
      const type = this.dragFrom;
      this.dragFrom = null;
      if (!type || this.placing !== type) return;
      this.toMap(ev);
      const t = this.game.place(type, this.mouse.x, this.mouse.y);
      if (t && !ev.shiftKey) { this.setPlacing(null); this.select(t); }
    });
    c.addEventListener('pointerdown', (ev) => {
      this.toMap(ev);
      this.mouse.inside = true;
      if (ev.button === 2) { this.setPlacing(null); this.moving = null; return; }
      if (ev.button !== 0) return;
      if (this.moving) {   // a Wandering Light's new post
        const t = this.moving;
        if (this.game.movePost(t, this.mouse.x, this.mouse.y)) { this.moving = null; this.canvas.classList.remove('placing'); }
        return;
      }
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
    window.addEventListener('pointerup', () => { this.dragFrom = null; });   // released anywhere else: stay in click-to-place
    window.addEventListener('keydown', (ev) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.target && ev.target.type === 'number') return;   // typing in test mode's wave box
      const k = ev.key;
      // The upgrade tree holds the game while it's open: Esc or U closes it, other keys wait.
      if (this.tree.open) {
        if (k === 'Escape' || k === 'u' || k === 'U') this.tree.close();
        return;
      }
      if (this.test.key(k)) return;
      if (k === 'T' && ev.shiftKey && !this.test.on && TEST_ALLOWED) {
        // Test mode sits behind Shift+T and a confirmation, so it can't start by accident.
        if (window.confirm && window.confirm('Turn on test mode? Unlimited gold and lives, and wave skipping. This run won\'t count. Reload the page to leave it.')) this.test.enable();
        return;
      }
      const low = k.length === 1 ? k.toLowerCase() : k;
      const abType = TOWER_ORDER.find((t) => ABILITIES[t].key.toLowerCase() === low);
      if (k === 'R' && ev.shiftKey) {
        // Restart sits behind Shift and a confirmation, well away from the upgrade keys.
        if (window.confirm ? window.confirm('Restart the run?') : true) this.restart();
      } else if (abType) {
        this.game.useAbility(abType);
      } else if (k === 'x' || k === 'X') {
        this.game.useFlare();
      } else if (WARD_KEYS.includes(k)) {
        const type = TOWER_ORDER[WARD_KEYS.indexOf(k)];
        if (type) this.setPlacing(this.placing === type ? null : type);
      } else if (this.selected && (k === 'r' || k === 'R') && !ev.shiftKey) {
        this.wardAction();
      } else if (k === ' ') {
        ev.preventDefault();
        this.togglePause();
      } else if (k === 'Enter') {
        ev.preventDefault();
        this.game.startWave();
      } else if (k === 'Escape') {
        if (this.moving) { this.moving = null; this.canvas.classList.remove('placing'); } else if (this.placing) this.setPlacing(null); else if (this.selected) this.select(null);
        else if (this.menu && !this.menu.open) this.menu.togglePause();   // nothing to cancel: the pause menu
      } else if ((k === 'u' || k === 'U') && !(this.menu && this.menu.open)) {
        // The upgrade tree: of the selected ward, else the ward being placed or hovered in the shop.
        if (this.selected) this.tree.show(this.selected.type, this.selected);
        else if (this.placing || this.shopHover) this.tree.show(this.placing || this.shopHover);
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
  // R: the selected ward's own action. Ember Vault: cash out. Wandering Light: pick a new post.
  wardAction() {
    const t = this.selected;
    if (!t) return;
    if (t.def.kind === 'vault') { this.game.cashOut(t); this.updatePanel(); }
    else if (t.def.kind === 'wander') { this.moving = this.moving === t ? null : t; this.canvas.classList.toggle('placing', !!this.moving); }
  }

  select(tower) {
    this.selected = tower || null;
    this.moving = null;
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
    // A selected ward's upgrades take the shop's place in the side column, so on a small screen
    // they get the whole column instead of being squeezed (deselect to get the shop back).
    $('side').classList.toggle('ward-open', !!t);
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
    close.title = 'Back to the shop (Esc)';
    close.addEventListener('click', () => this.select(null));
    head.append(icon, titles, close);

    const stats = el('div', 'tp-stats');
    const dmg = el('b', null, '0'), kills = el('b', null, '0');
    const aura = def.kind === 'aura' || def.kind === 'vault';
    const s1 = el('span', null, def.kind === 'vault' ? 'Embers ' : aura ? 'Wards boosted ' : 'Damage dealt '), s2 = el('span', null, aura ? 'Gold earned ' : 'Layers broken ');
    s1.append(dmg); s2.append(kills);
    stats.append(s1, s2);
    // A Vault's interest at the next wave clear (it climbs while the Vault is left alone).
    let interest = null;
    if (def.kind === 'vault') {
      interest = el('b', null, '');
      const s3 = el('span', null, 'Interest next wave ');
      s3.title = 'Paid on its embers at each wave clear: +2% for every wave you leave it (up to +10%), and it can grow to twice the cap. Cashing out starts the bonus again.';
      s3.append(interest);
      stats.append(s3);
    }

    // The numbers stay out of the way: hover the hint (or hold Shift) to see them.
    const numbers = el('div', 'tp-numbers');
    const grid = el('div', 'tp-grid');
    for (const [label, value] of statRows(def, t.stats).slice(0, 7)) grid.append(el('span', null, label), el('b', null, value));
    numbers.append(el('span', 'tp-hint', 'Numbers: hover here or hold Shift'), grid);
    const treeBtn = el('button', 'tree-open wide', 'Upgrade tree: every path and tier  [U]');
    treeBtn.type = 'button';
    treeBtn.addEventListener('click', () => this.tree.show(t.type, t));
    panel.append(head, stats, numbers, treeBtn);

    // A Vault's cash-out and a Wandering Light's move, also on R.
    // (it shares a row with the Sell button, at the bottom of the panel)
    let action = null;
    if (def.kind === 'vault' || def.kind === 'wander') {
      action = el('button', 'action-btn');
      action.type = 'button';
      action.addEventListener('click', () => this.wardAction());
    }

    if (def.kind !== 'pulse' && def.kind !== 'aura' && def.kind !== 'vault' && def.kind !== 'lure' && def.kind !== 'snare') {
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
      ph.title = path.blurb;   // the identity line is dropped on very short screens: it's here on hover
      const pips = el('span', 'pips');
      for (let i = 0; i < RULES.maxTier; i++) pips.append(el('span', `pip${i === 4 ? ' t5' : ''}${i < t.tiers[pi] ? ' on' : ''}`));
      ph.append(el('span', null, `${path.name}  [${'QWE'[pi]}]`), pips);
      const identity = el('div', 'path-blurb', path.blurb);
      const b = el('button', 'up-btn');
      b.type = 'button';
      const top = el('span', 'up-top');
      if (t.tiers[pi] >= 4) b.classList.add('capstone');   // tier 5: the capstone (bought or not)
      if (info.reason === 'max') {
        b.classList.add('maxed');
        top.append(el('span', null, path.tiers[RULES.maxTier - 1].name), el('span', 'up-cost', 'MAX'));
        b.append(top, el('span', 'up-desc', path.tiers[RULES.maxTier - 1].blurb));
      } else {
        top.append(el('span', null, `T${t.tiers[pi] + 1}  ${info.up.name}`), el('span', 'up-cost', info.ok ? String(info.cost) : 'Locked'));
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
          upButtons.push({ b, cost: info.cost, t5: t.tiers[pi] === 4 });
        } else {
          b.classList.add('locked');
          // The tier 5 is held by another ward of this kind: the button takes you to it.
          if (info.reason === 'unique') {
            const holder = this.game.towers.find((o) => o !== t && o.type === t.type && o.tiers[pi] >= 5);
            if (holder) { b.classList.add('holder'); b.addEventListener('click', () => this.select(holder)); }
          }
        }
      }
      box.append(ph, identity, b);
      panel.append(box);
    });

    const sell = el('button', 'sell-btn');
    sell.type = 'button';
    const sellVal = el('b', null, String(this.game.sellValue(t)));
    const full = this.game.freshGold(t) >= t.spent;
    sell.append('Sell ', sellVal);
    sell.title = full ? 'Full refund: bought this wave' : `${Math.round(RULES.sellRefund * 100)}% refund`;
    if (full) sell.append(el('span', 'sell-note', ' full refund'));
    sell.addEventListener('click', () => this.sellSelected());
    const foot = el('div', 'tp-foot');
    if (action) foot.append(action);
    foot.append(sell);
    panel.append(foot);

    this.panelRefs = { dmg, kills, upButtons, action, interest };
    this.updatePanel();
  }

  updatePanel() {
    const refs = this.panelRefs, t = this.selected;
    if (!refs || !t) return;
    if (t.def.kind === 'vault') {
      refs.dmg.textContent = `${Math.floor(t.bank)} / ${t.stats.cap}${t.bank > t.stats.cap ? ` (to ${t.stats.cap * RULES.vaultCeiling})` : ''}`;
      const it = `+${Math.round(vaultRate(t) * 100)}%`;
      if (refs.interest.textContent !== it) refs.interest.textContent = it;
      refs.kills.textContent = fmt(t.goldEarned || 0);
      const txt = `Cash out ${Math.floor(t.bank)}  [R]`;
      if (refs.action.textContent !== txt) refs.action.textContent = txt;
      refs.action.disabled = t.bank < 1;
    } else if (t.def.kind === 'wander') {
      const txt = this.moving === t ? 'Click the map for its new post' : 'Move its post  [R]';
      if (refs.action.textContent !== txt) refs.action.textContent = txt;
      refs.dmg.textContent = fmt(t.dmg);
      refs.kills.textContent = String(t.kills);
    } else if (t.def.kind === 'aura') {
      const r2 = t.stats.range ** 2;
      refs.dmg.textContent = String(this.game.towers.filter((o) => o !== t && o.aura && (o.x - t.x) ** 2 + (o.y - t.y) ** 2 <= r2).length);
      refs.kills.textContent = fmt(t.goldEarned || 0);
    } else {
      refs.dmg.textContent = fmt(t.dmg);
      refs.kills.textContent = String(t.kills);
    }
    for (const u of refs.upButtons) {
      u.b.classList.toggle('poor', this.game.gold < u.cost);
      // A tier 5 shows how much of its price you've saved.
      if (u.t5) { const f = Math.min(1, this.game.gold / u.cost); if (u.f !== f) { u.f = f; u.b.style.setProperty('--save', `${(f * 100).toFixed(1)}%`); } }
    }
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

    this.test.update();
    this.setText('hud-lives', this.test.on ? '∞' : String(g.lives));
    this.setText('hud-gold', String(Math.floor(g.gold)));
    // Pops per second, sampled twice a second and smoothed.
    const now = performance.now(), pr = this.popRate;
    if (now - pr.t >= 500) {
      const rate = ((g.pops - pr.pops) * 1000) / (now - pr.t);
      pr.value = g.pops < pr.pops ? 0 : pr.value * 0.4 + rate * 0.6;
      pr.t = now; pr.pops = g.pops;
      this.setText('hud-pops', String(Math.round(pr.value)));
    }
    this.setText('hud-where', `${g.map.data.name} · ${g.diff.name}`);
    this.setText('hud-wave', g.endless ? `${g.wave}  (endless, best ${Math.max(this.bestWave, g.wave)})` : `${g.wave} / ${g.totalWaves}`);
    if (g.wave > 0 && this.cache.recorded !== g.wave) { this.cache.recorded = g.wave; this.recordWave(g.wave); }

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
      if (win) this.recordWave(g.wave, true);
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
