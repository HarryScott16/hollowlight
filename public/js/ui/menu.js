// The menus: title, map select, difficulty select, settings, and the in-game pause menu. Plain DOM
// over the game (see #menu and #pause-menu in index.html, .menu-* in css/style.css). While a menu is
// open the game neither runs nor draws (ui.inMenu).
import { MAPS, MAP_ORDER } from '../data/maps.js';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../data/difficulty.js';
import { buildMap } from '../sim/path.js';
import { paintBackground } from '../render/background.js';
import { SKINS, getSkin, setSkin } from '../render/wardArt.js';
import { bestFor, lastChoice, saveChoice, saveSkin } from './records.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const button = (text, cls, onClick) => { const b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', onClick); return b; };

export class Menu {
  constructor(ui) {
    this.ui = ui;
    this.root = document.getElementById('menu');
    this.pauseRoot = document.getElementById('pause-menu');
    this.previews = new Map();
    this.mapChoice = null;
    this.back = null;
  }

  get open() { return !this.root.hidden; }

  // ---- screens ------------------------------------------------------------------------------------
  screen(title, ...children) {
    this.root.textContent = '';
    const card = el('div', 'menu-card');
    if (title) card.append(el('h2', 'menu-heading', title));
    card.append(...children);
    this.root.append(card);
    this.root.hidden = false;
    this.ui.inMenu = true;
    this.pauseRoot.hidden = true;
    return card;
  }

  // The title invites a choice: Play leads to the map select, then the difficulty, then the game.
  // A returning player also gets a smaller shortcut back into their last map and difficulty.
  showTitle() {
    const logo = el('div', 'menu-logo');
    logo.append(el('div', 'menu-flame'), el('h1', null, 'Hollowlight'), el('p', 'menu-tag', 'Keep the Heartfire burning through the night.'));
    const play = button('', 'primary menu-play', () => this.showMaps());
    play.append(el('span', 'menu-play-main', 'Play'), el('span', 'menu-play-sub', 'Choose a map and difficulty'));
    const actions = el('div', 'menu-actions');
    actions.append(play);
    const last = lastChoice();
    if (last.saved && MAPS[last.map] && DIFFICULTIES[last.difficulty]) {
      const map = MAPS[last.map], diff = DIFFICULTIES[last.difficulty], best = bestFor(map.id, diff.id);
      const cont = button('', 'menu-btn menu-continue', () => this.start(map.id, diff.id));
      cont.append(el('span', null, `Continue: ${map.name}, ${diff.name}`));
      if (best.wave) cont.append(el('span', 'menu-continue-best', `best wave ${best.wave}${best.won ? ' ✓' : ''}`));
      actions.append(cont);
    }
    actions.append(button('Settings', 'menu-btn', () => this.showSettings(() => this.showTitle())));
    if (this.ui.game.wave > 0 && !this.ui.game.over) actions.append(button('Back to the game', 'menu-btn', () => this.hide()));
    this.screen(null, logo, actions);
  }

  showMaps() {
    const grid = el('div', 'menu-maps'), last = lastChoice();
    for (const id of MAP_ORDER) {
      const m = MAPS[id], card = button('', `menu-map${last.saved && id === last.map ? ' last' : ''}`, () => this.showDifficulty(id));
      card.append(this.preview(id), el('span', 'menu-map-name', m.name), el('span', 'menu-map-desc', m.desc));
      const bests = el('span', 'menu-map-best');
      for (const d of DIFFICULTY_ORDER) {
        const b = bestFor(id, d);
        bests.append(el('span', `best ${b.won ? 'won' : ''}`, `${DIFFICULTIES[d].name}: ${b.wave ? `wave ${b.wave}${b.won ? ' ✓' : ''}` : '-'}`));
      }
      card.append(bests);
      grid.append(card);
    }
    this.screen('Choose a map', grid, button('Back', 'menu-btn menu-back', () => this.showTitle()));
  }

  showDifficulty(mapId) {
    const m = MAPS[mapId], last = lastChoice(), list = el('div', 'menu-diffs');
    for (const d of DIFFICULTY_ORDER) {
      const D = DIFFICULTIES[d], b = bestFor(mapId, d);
      const btn = button('', `menu-diff ${d}${d === last.difficulty ? ' last' : ''}`, () => this.start(mapId, d));
      btn.append(el('span', 'menu-diff-name', D.name), el('span', 'menu-diff-desc', D.desc), el('span', 'menu-diff-best', b.wave ? `Best: wave ${b.wave}${b.won ? ' (won)' : ''}` : 'Not played yet'));
      list.append(btn);
    }
    const head = el('div', 'menu-diff-head');
    head.append(this.preview(mapId), el('span', 'menu-map-name', m.name));
    this.screen('Difficulty', head, list, button('Back', 'menu-btn menu-back', () => this.showMaps()));
  }

  showSettings(back) {
    const ui = this.ui, s = ui.sound;
    const skins = el('div', 'menu-row');
    skins.append(el('span', 'menu-label', 'Ward skin'));
    for (const id of Object.keys(SKINS)) {
      skins.append(button(SKINS[id].name, `menu-choice${getSkin() === id ? ' on' : ''}`, () => { setSkin(id); saveSkin(id); ui.skinChanged(); this.showSettings(back); }));
    }
    const sound = el('div', 'menu-row');
    sound.append(el('span', 'menu-label', 'Sound'));
    if (s) {
      sound.append(button(s.muted ? 'Off' : 'On', `menu-choice${s.muted ? '' : ' on'}`, () => { s.setMuted(!s.muted); ui.syncMute(); this.showSettings(back); }));
      const vol = el('input', 'menu-volume');
      vol.type = 'range'; vol.min = '0'; vol.max = '100'; vol.value = String(Math.round(s.volume * 100));
      vol.setAttribute('aria-label', 'Volume');
      vol.addEventListener('input', () => s.setVolume(Number(vol.value) / 100));
      sound.append(vol);
    } else sound.append(el('span', 'menu-note', 'unavailable'));
    const keys = el('p', 'menu-note', 'Keys: wards 1-9 0 - =, upgrades Q W E, abilities A-K and Z C V B, Flare X, pause Space, menu Esc, speed in the top bar.');
    this.screen('Settings', skins, sound, keys, button('Back', 'menu-btn menu-back', back));
  }

  // A painted thumbnail of a map (the same painter as the game's background), made once.
  preview(id) {
    let src = this.previews.get(id);
    if (!src) {
      const m = buildMap(MAPS[id]);
      src = document.createElement('canvas');
      src.width = 448; src.height = 288;
      const g = src.getContext('2d');
      g.scale(448 / m.width, 288 / m.height);
      paintBackground(g, m);
      g.strokeStyle = 'rgba(224,168,255,0.9)'; g.lineWidth = 6;
      for (const r of m.routes) { g.beginPath(); g.ellipse(r.rift.x + 6, r.rift.y, 14, 28, 0, 0, Math.PI * 2); g.stroke(); }
      this.previews.set(id, src);
    }
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height; c.className = 'menu-preview';
    c.getContext('2d').drawImage(src, 0, 0);
    return c;
  }

  // ---- in and out of the game -----------------------------------------------------------------------
  start(mapId, diffId) {
    saveChoice(mapId, diffId);
    this.ui.newGame(mapId, diffId);
    this.hide();
  }
  hide() {
    this.root.hidden = true;
    this.pauseRoot.hidden = true;
    this.ui.inMenu = false;
  }

  // The pause menu (Esc, or the Pause button): the game holds while it's open.
  openPause() {
    const ui = this.ui;
    if (ui.game.over || this.open) return;
    if (!ui.paused) ui.togglePause();
    const r = this.pauseRoot;
    r.textContent = '';
    const card = el('div', 'menu-card pause');
    const g = ui.game;
    card.append(el('h2', 'menu-heading', 'Paused'), el('p', 'menu-note', `${g.map.data.name} · ${g.diff.name} · wave ${g.wave}`));
    const actions = el('div', 'menu-actions');
    actions.append(
      button('Resume', 'primary menu-btn', () => this.closePause()),
      button('Restart', 'menu-btn', () => { if (!window.confirm || window.confirm('Restart this run?')) { this.closePause(); ui.restart(); } }),
      button('Settings', 'menu-btn', () => { r.hidden = true; this.showSettings(() => { this.root.hidden = true; ui.inMenu = false; this.openPause(); }); }),
      button('Quit to menu', 'menu-btn', () => { r.hidden = true; this.showTitle(); }),
    );
    card.append(actions);
    r.append(card);
    r.hidden = false;
  }
  closePause() {
    this.pauseRoot.hidden = true;
    if (this.ui.paused) this.ui.togglePause();
  }
  togglePause() { if (!this.pauseRoot.hidden) this.closePause(); else this.openPause(); }
}
