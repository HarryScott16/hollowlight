// Draws the game each frame and turns simulation events (game.fx) into visual effects.
import { MAP } from '../data/map.js';
import { TOWERS } from '../data/towers.js';
import { DAMAGE_TYPES } from '../data/damage.js';
import { RULES } from '../data/rules.js';
import { Particles } from './particles.js';
import { FlameFx } from './flames.js';
import { paintBackground } from './background.js';
import { drawWard, wardMuzzle, wardTop, wardBox, wardColor, initWardArt, setSkin, skinFromQuery, setWardRefresh, pruneWardCache } from './wardArt.js';
import { DMG, DETAIL } from './wards/kit.js';
import { drawEnemy, drawEnemyBody, flushEnemyBars, setEnemyBase, initSprites, ENEMY_COLORS } from './enemyArt.js';

const TAU = Math.PI * 2;
const W = MAP.width, H = MAP.height;
const INK = '#1d1030';
const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// Damage numbers use each damage type's signature colour (render/wards/kit.js).
const NUM_COLORS = { kinetic: DMG.kinetic.core, blast: DMG.blast.core, arcane: DMG.arcane.core, frost: DMG.frost.core, fire: DMG.fire.core, radiant: DMG.radiant.core, true: '#ffffff' };
const ARCANE = DMG.arcane.core, RADIANT = DMG.radiant.core, HEARTH = DMG.hearth.core;
const FROST = DMG.frost.core, KINETIC = DMG.kinetic.core;
const POP_TIME = 0.45;
const noop = () => {};
const byY = (a, b) => a.y - b.y;
const GHOST_TIERS = [0, 0, 0];
// Stand-in when no Sound is attached (and for unknown events).
const MUTE = { pop: noop, crack: noop, boom: noop, zap: noop, shot: noop, pulse: noop, coin: noop, flare: noop, frost: noop, ability: noop, upgrade: noop, place: noop, sell: noop, wave: noop, leak: noop, streak: noop, bossDown: noop, lastLight: noop, snipe: noop, flame: noop, burst: noop, roar: noop };

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.ctx = canvas.getContext('2d');
    this.bg = document.createElement('canvas');
    this.scale = 0;
    this.time = 0;
    this.parts = new Particles();
    this.arcs = [];
    this.rings = [];
    this.texts = [];
    this.stains = [];
    this.bolts = [];      // smite pillars
    this.tracers = [];    // Longeye shots
    this.wisps = [];      // Ember Vault: embers flying in from kills
    this.flameFx = new FlameFx(this);   // Ember Censer flamethrowers
    this.pops = new Map(); // tower id -> remaining pop time
    this.multi = new Map(); // tower id -> { n, t, x, y } for multi-kill callouts
    this.shake = 0;
    this.banner = null;
    this.callout = null;  // big centre text for streaks and capstones
    this.flash = null;    // full-screen colour flash for abilities
    this.coins = [];      // gold coins flying to the HUD counter
    this.coinTarget = { x: 60, y: -30 };
    this.onCoin = null;   // called when a coin lands (the UI bumps the gold counter)
    this.hitStop = 0;     // seconds the simulation pauses for a big moment (read by main.js)
    this.sound = null;    // optional Sound (audio/sound.js)
    this.popCount = 0;
    this.numBudget = 0;
    this.showFps = false;
    this.fps = { frames: 0, t: performance.now(), value: 0, worst: 0, last: performance.now() };
    // Per-frame cost breakdown for the FPS overlay (` key): ms per frame, averaged twice a second.
    this.perf = { acc: Object.create(null), sum: Object.create(null), shown: null, frames: 0, steps: 0, wardT: 0 };
    this.quality = 2;     // 2 full, 1 crowd, 0 huge crowd (set each frame from the enemy count)
    this._st = { ang: 0, recoil: 0, time: 0, pulse: 0, fire: 0, tx: null, ty: null, pop: 0, id: 0 };
    this._walk = [];      // walkers sorted by depth, drawn interleaved with the wards
    this._wards = [];
    this._at = new Map(); // map position -> ward, to find which ward an event came from
    this._m = [0, 0];
    this.snow = null;     // Endless Winter snowfall
    if (typeof location !== 'undefined') { const s = skinFromQuery(location.search); if (s) setSkin(s); }
    this.resize();
  }

  clearFx() {
    this.parts.clear();
    this.arcs.length = this.rings.length = this.texts.length = this.stains.length = this.bolts.length = 0;
    this.tracers.length = this.wisps.length = 0;
    this.flameFx.clear();
    this.pops.clear();
    this.multi.clear();
    this.shake = 0;
    this.banner = this.callout = this.flash = null;
    this.coins.length = 0;
    this.hitStop = 0;
    this.game.fx.length = 0;
  }

  // Fits the canvas to its container, then matches the backing store (capped) and repaints the map.
  resize() {
    const parent = this.canvas.parentElement;
    const fit = Math.max(0.25, Math.min((parent.clientWidth - 16) / W, (parent.clientHeight - 16) / H) || 1);
    // Sized from script (not CSS) so the backing-store size can never feed back into layout.
    this.canvas.style.width = `${Math.floor(W * fit)}px`;
    this.canvas.style.height = `${Math.floor(H * fit)}px`;
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.max(0.6, Math.min(2, fit * dpr));
    if (Math.abs(scale - this.scale) < 0.02) return;
    this.scale = scale;
    this.canvas.width = Math.round(W * scale);
    this.canvas.height = Math.round(H * scale);
    this.bg.width = this.canvas.width;
    this.bg.height = this.canvas.height;
    const b = this.bg.getContext('2d');
    b.setTransform(scale, 0, 0, scale, 0, 0);
    paintBackground(b, this.game.map);
    initSprites(() => document.createElement('canvas'), scale);
    initWardArt(() => document.createElement('canvas'), scale);
    this.aimCoins();
  }

  // Coins fly towards the HUD gold counter, which sits outside the canvas.
  aimCoins() {
    const gold = document.getElementById('hud-gold');
    if (!gold) return;
    const r = gold.getBoundingClientRect(), c = this.canvas.getBoundingClientRect();
    if (!c.width) return;
    this.coinTarget.x = ((r.left + r.width / 2 - c.left) / c.width) * W;
    this.coinTarget.y = ((r.top + r.height / 2 - c.top) / c.height) * H;
  }

  text(x, y, str, color, size = 12, life = 0.9, rise = 22) {
    if (this.texts.length > 40) this.texts.shift();
    this.texts.push({ x, y, str, color, size, life, max: life, rise });
  }

  ring(x, y, r0, r1, life, color, width, fill, add) {
    if (this.rings.length > (this.ringCap || 160)) this.rings.shift();
    this.rings.push({ x, y, r0, r1, life, max: life, color, width, fill, add });
  }

  // ---- simulation events -> effects -----------------------------------------------------------
  consume() {
    const fx = this.game.fx;
    const P = this.parts;
    const S = this.sound || MUTE;
    this.numBudget = 4;
    if (fx.length) {
      this._at.clear();
      for (const t of this.game.towers) {
        this._at.set(Math.round(t.x) * 4096 + Math.round(t.y), t);
        for (let i = 1; i < t.lights.length; i++) this._at.set(Math.round(t.lights[i].x) * 4096 + Math.round(t.lights[i].y), this.lightWard(t, i));
      }
    }
    for (let i = 0; i < fx.length; i++) {
      const f = fx[i];
      switch (f.type) {
        case 'hit': {
          const col = f.resisted ? '#aab4c4' : (DAMAGE_TYPES[f.dtype] || DAMAGE_TYPES.kinetic).color;
          P.burst(f.x, f.y, f.resisted ? 2 : 3, { color: col, speed: 120, life: 0.25, size: 2.4 });
          // Damage numbers only for big hits (most hits just break a layer, and the pop says so).
          const a = f.amt || 0;
          if (this.numBudget > 0 && (a >= 50 || f.big || (f.heavy && a >= 20))) {
            this.numBudget--;
            const size = Math.min(26, 11 + Math.log2(Math.max(1, a / 15)) * 3.2);
            this.text(f.x + (Math.random() - 0.5) * 10, f.y - 10, f.resisted ? `${Math.round(a)}` : `${Math.round(a)}${a >= 200 ? '!' : ''}`,
              f.resisted ? '#c9d0dc' : NUM_COLORS[f.dtype] || '#fff', size, 0.7, 26);
          }
          break;
        }
        case 'death': {
          const color = ENEMY_COLORS[f.etype] || '#fff';
          this.popCount++;
          if (f.src) this.countMulti(f);
          if (f.gold <= 1 && !f.heavy) {
            // A layer breaking: a quick pop. Most of a wave is these, so they stay light.
            P.burst(f.x, f.y, 7, { color, speed: 100 + f.r * 6, life: 0.45, size: 2.4 + f.r * 0.12 });
            P.burst(f.x, f.y, 2, { color: '#ffffff', speed: 80, life: 0.25, size: 2.2 });
            if (this.quality > 0) this.ring(f.x, f.y, f.r * 0.4, f.r * 1.9, 0.2, color, 2.5);
            if (Math.random() < (this.quality === 2 ? 0.2 : 0.05)) this.stain(f.x, f.y, f.r, color);
            if (f.gold > 0 && this.coins.length < 24 && this.popCount % 4 === 0) this.coins.push({ x: f.x, y: f.y, t: 0, dur: 0.5 + Math.random() * 0.2 });
            S.pop(this.game.streak);
            break;
          }
          // A shell, hulk or boss breaking open: a bigger burst, gold text and a crack or boom.
          P.burst(f.x, f.y, Math.min(46, 8 + f.r * 1.2), { color, speed: 110 + f.r * 6, life: 0.6, size: 2.6 + f.r * 0.14 });
          P.burst(f.x, f.y, 6, { color: '#ffffff', speed: 90, life: 0.3, size: 2.4 });
          this.ring(f.x, f.y, f.r * 0.5, f.r * 2.4, 0.28, color, 3);
          this.stain(f.x, f.y, f.r, color);
          if (f.gold > 0) {
            // Gold is shown in whole numbers only; a shell worth less than 1 just sends its coins.
            const g = Math.round(f.gold);
            if (g >= 1) this.text(f.x, f.y - f.r - 4, `+${g}`, '#ffd23a', f.boss ? 24 : f.heavy ? 16 : 12, f.boss ? 1.8 : 0.8);
            for (let k = 0; k < (f.heavy ? 5 : 2) && this.coins.length < 30; k++) this.coins.push({ x: f.x + (Math.random() - 0.5) * 20, y: f.y, t: -k * 0.05, dur: 0.55 + Math.random() * 0.2 });
          }
          if (f.heavy && !f.boss) {
            this.shake = Math.max(this.shake, 5);
            for (let k = 0; k < 2; k++) this.ring(f.x, f.y, 6, 60 + k * 40, 0.4 + k * 0.15, '#fff1b0', 4, null, true);
            S.boom(false);
          } else if (!f.boss) S.crack();
          if (f.boss) {
            S.bossDown();
            this.hitStop = Math.max(this.hitStop, 0.2);
            this.shake = Math.max(this.shake, 16);
            P.burst(f.x, f.y, 120, { color: '#ffb36b', speed: 380, life: 1.2, size: 4.5 });
            P.burst(f.x, f.y, 60, { color: '#ff2d55', speed: 260, life: 1.0, size: 4 });
            for (let k = 0; k < 4; k++) this.ring(f.x, f.y, 10, 90 + k * 60, 0.5 + k * 0.2, '#fff1b0', 5, null, true);
            this.callout = { text: 'BOSS SLAIN!', sub: Math.round(f.gold) >= 1 ? `+${Math.round(f.gold)} gold` : null, color: '#ffd23a', t: 2.4, max: 2.4 };
          }
          break;
        }
        case 'explosion': {
          if (f.kind === 'mine') { // a Flashmine: a white flash of thorny light, not a fireball
            S.boom(false);
            this.ring(f.x, f.y, f.r * 0.2, f.r, 0.3, '#ffffff', 3, 'rgba(233,238,246,0.3)', true);
            this.ring(f.x, f.y, 3, f.r * 0.5, 0.18, '#fff6d0', 2, null, true);
            P.burst(f.x, f.y, 14, { color: KINETIC, speed: f.r * 3.4, life: 0.4, size: 2.8 });
            P.burst(f.x, f.y, 6, { color: '#fff6d0', speed: f.r * 2, life: 0.3, size: 2.2 });
            this.shake = Math.max(this.shake, 1.5);
            break;
          }
          const big = f.r > 90;
          if (!f.sub) S.boom(big);
          this.ring(f.x, f.y, f.r * 0.25, f.r, 0.32, '#ffd27a', big ? 5 : 3, 'rgba(255,150,50,0.55)', true);
          if (!f.sub) this.ring(f.x, f.y, 4, f.r * 0.55, 0.16, '#ffffff', 2, 'rgba(255,255,220,0.8)', true);
          P.burst(f.x, f.y, f.sub ? 8 : big ? 30 : 18, { color: '#ffb347', speed: f.r * 3.6, life: 0.5, size: 3.6 });
          P.burst(f.x, f.y, f.sub ? 4 : 10, { color: '#ff5a2e', speed: f.r * 2.4, life: 0.45, size: 3 });
          P.burst(f.x, f.y, f.sub ? 2 : 6, { color: '#8a7f78', speed: f.r * 1.2, life: 0.9, size: 5, grav: -30 });
          if (!f.sub) this.shake = Math.max(this.shake, big ? 7 : f.r > 70 ? 4 : 1.8);
          break;
        }
        case 'arc': {
          S.zap();
          // the first jump leaves the Coil's drawn orb (or prong tip), not its footprint
          const w = this._at.get(Math.round(f.pts[0]) * 4096 + Math.round(f.pts[1]));
          if (w && f.pts.length >= 4) { const m = wardMuzzle(w, Math.atan2(f.pts[3] - f.pts[1], f.pts[2] - f.pts[0]), this._m); f.pts[0] = m[0]; f.pts[1] = m[1]; }
          this.arcs.push({ pts: f.pts, life: f.smite ? 0.3 : 0.16, max: f.smite ? 0.3 : 0.16, smite: f.smite });
          for (let k = 2; k < f.pts.length; k += 2) P.burst(f.pts[k], f.pts[k + 1], 3, { color: '#e0c8ff', speed: 140, life: 0.25, size: 2.4 });
          break;
        }
        case 'smite':
          S.boom(false);
          this.bolts.push({ x: f.x, y: f.y, life: 0.35, max: 0.35, color: DMG.arcane.core });
          this.ring(f.x, f.y, 6, f.r, 0.35, '#e8d4ff', 5, 'rgba(176,107,255,0.4)', true);
          P.burst(f.x, f.y, 30, { color: '#d8b8ff', speed: 260, life: 0.5, size: 3.2 });
          this.shake = Math.max(this.shake, 6);
          break;
        case 'pulse':
          S.pulse();
          this.ring(f.x, f.y, 12, f.r, 0.5, f.freeze ? '#ffffff' : FROST, f.freeze ? 5 : 2.5, f.freeze ? 'rgba(200,245,255,0.35)' : 'rgba(82,230,255,0.16)');
          P.burst(f.x, f.y - 8, f.freeze ? 22 : 8, { color: f.freeze ? '#ffffff' : '#bff3ff', speed: f.r * 2.4, life: 0.45, size: 2.6, drag: 3 });
          if (f.freeze) { // a freezing pulse: a second white shock ring and a spray of ice shards
            this.ring(f.x, f.y, 6, f.r * 0.7, 0.3, '#e8fbff', 3, null, true);
            P.burst(f.x, f.y - 10, 16, { color: FROST, speed: f.r * 1.6, life: 0.6, size: 3.6, drag: 2.5 });
          }
          break;
        case 'shatter':
          this.ring(f.x, f.y, 4, f.r, 0.28, '#ffffff', 3, 'rgba(82,230,255,0.4)', true);
          P.burst(f.x, f.y, 14, { color: FROST, speed: 220, life: 0.45, size: 3.4 });
          P.burst(f.x, f.y, 6, { color: '#ffffff', speed: 160, life: 0.35, size: 2.6 });
          break;
        case 'markburst':
          this.ring(f.x, f.y, 6, f.r, 0.3, KINETIC, 2.5, 'rgba(233,238,246,0.12)');
          break;
        case 'execute':
          this.text(f.x, f.y - 18, 'EXECUTED', '#ffffff', 14, 0.9);
          P.burst(f.x, f.y, 16, { color: KINETIC, speed: 180, life: 0.5, size: 3 });
          this.ring(f.x, f.y, 4, 30, 0.3, '#ffffff', 3, null, true);
          break;
        case 'fire': {
          S.shot();
          if (f.kind === 'wander') { // a cast: sparkles at the wand's star tip
            const w = this._at.get(Math.round(f.x) * 4096 + Math.round(f.y));
            const m = w ? wardMuzzle(w, f.ang, this._m) : [f.x, f.y - 20];
            P.burst(m[0], m[1], 4, { color: '#e8d4ff', speed: 90, life: 0.25, size: 2.2, ang: f.ang, spread: 1.2 });
            break;
          }
          const w = this._at.get(Math.round(f.x) * 4096 + Math.round(f.y));
          const m = w ? wardMuzzle(w, f.ang, this._m) : [f.x + Math.cos(f.ang) * 18, f.y + Math.sin(f.ang) * 18];
          if (f.kind === 'mortar') P.burst(m[0], m[1], 7, { color: '#e8e0d8', speed: 70, life: 0.5, size: 4.5, ang: f.ang, spread: 1 });
          else {
            const big = w && w.stats.lance;
            P.burst(m[0], m[1], big ? 10 : 3, { color: KINETIC, speed: big ? 200 : 100, life: big ? 0.35 : 0.18, size: big ? 3.2 : 2.2, ang: f.ang, spread: big ? 1 : 0.6 });
            if (big) { this.ring(m[0], m[1], 3, 26, 0.25, '#ffffff', 3, null, true); this.shake = Math.max(this.shake, 1.5); }
          }
          break;
        }
        case 'snipe': {
          S.snipe(f.big);
          const w = this._at.get(Math.round(f.x) * 4096 + Math.round(f.y));
          const ang = Math.atan2(f.ty - f.y, f.tx - f.x);
          const m = w ? wardMuzzle(w, ang, this._m) : [f.x, f.y];
          if (this.tracers.length < 60) this.tracers.push({ x: m[0], y: m[1], tx: f.tx, ty: f.ty, life: f.big ? 0.32 : 0.18, max: f.big ? 0.32 : 0.18, big: f.big, spot: f.spot > 0 });
          P.burst(m[0], m[1], f.big ? 8 : 3, { color: KINETIC, speed: 120, life: 0.2, size: 2.4, ang, spread: 0.8 });
          P.burst(f.tx, f.ty, f.big ? 14 : 4, { color: KINETIC, speed: f.big ? 220 : 160, life: 0.3, size: 2.6 });
          if (f.big) { // a Headhunter round: a shock ring where it lands and one at the muzzle
            this.ring(f.tx, f.ty, 4, 34, 0.3, '#ffffff', 3.5, 'rgba(233,238,246,0.25)', true);
            this.ring(m[0], m[1], 3, 18, 0.2, '#ffffff', 2.5, null, true);
          }
          if (f.flak) {
            this.ring(f.tx, f.ty, 4, f.flak, 0.25, KINETIC, 2.5, 'rgba(233,238,246,0.16)', true);
            P.burst(f.tx, f.ty, 8, { color: '#c9d0dc', speed: f.flak * 3, life: 0.35, size: 2.4 });
            P.burst(f.tx, f.ty, 4, { color: '#8a8f9c', speed: f.flak * 1.2, life: 0.8, size: 4.5, grav: -20 });
          }
          if (f.spot) this.ring(f.tx, f.ty, 6, f.spot, 0.45, '#ffffff', 1.8, 'rgba(255,255,255,0.08)');
          break;
        }
        case 'burst':
          S.burst();
          this.ring(f.x, f.y, 4, f.r, 0.3, '#fff3b0', 3, 'rgba(255,243,176,0.3)', true);
          P.burst(f.x, f.y, 10, { color: '#ffffff', speed: f.r * 3, life: 0.35, size: 2.6 });
          break;
        case 'starburst':
          this.ring(f.x, f.y, 3, f.r, f.comet ? 0.4 : 0.25, f.comet ? '#ffffff' : '#e8d4ff', f.comet ? 3.5 : 2, f.comet ? 'rgba(176,107,255,0.35)' : 'rgba(176,107,255,0.18)', true);
          P.burst(f.x, f.y, f.comet ? 14 : 5, { color: ARCANE, speed: f.r * 3, life: 0.35, size: 2.6 });
          if (f.comet) { this.ring(f.x, f.y, f.r * 0.6, f.r * 1.05, 0.7, ARCANE, 2, null); P.burst(f.x, f.y, 6, { color: '#ffffff', speed: f.r * 2, life: 0.3, size: 2.4 }); }
          break;
        case 'bind':
          this.ring(f.x, f.y, f.r, f.r * 0.4, 0.35, '#fff6d0', f.heavy ? 4 : 2.5, 'rgba(255,246,208,0.12)', true);
          P.burst(f.x, f.y, f.heavy ? 10 : 5, { color: '#fff6d0', speed: 90, life: 0.4, size: 2.2 });
          break;
        case 'mine':
          P.burst(f.x, f.y, 4, { color: '#fff6d0', speed: 50, life: 0.35, size: 2 });
          break;
        case 'glean': {
          const v = this.game.towers.find((t) => t.id === f.id);
          if (v && this.wisps.length < [12, 24, 40][this.quality]) this.wisps.push({ x: f.x, y: f.y, v, t: 0, dur: 0.6 + Math.random() * 0.3, bend: (Math.random() - 0.5) * 60 });
          break;
        }
        case 'cashout':
          S.sell();
          this.text(f.x, f.y - 40, `+${f.amount}`, '#ffd23a', 18, 1.3, 30);
          this.ring(f.x, f.y, 6, 50, 0.45, HEARTH, 3, 'rgba(255,126,182,0.2)', true);
          P.burst(f.x, f.y - 16, 26, { color: '#ffd23a', speed: 200, life: 0.7, size: 3.2, grav: 260, ang: -Math.PI / 2, spread: 1.2 });
          for (let k = 0; k < 8 && this.coins.length < 40; k++) this.coins.push({ x: f.x + (Math.random() - 0.5) * 24, y: f.y - 16, t: -k * 0.05, dur: 0.6 + Math.random() * 0.2 });
          break;
        case 'post':
          this.ring(f.x, f.y, 4, 30, 0.4, ARCANE, 2.5, null, true);
          break;
        case 'bloom':
          for (const t of this.game.towers) if (t.type === 'snare') { this.ring(t.x, t.y, 6, 70, 0.6, '#ffffff', 4, 'rgba(233,238,246,0.2)', true); P.burst(t.x, t.y, 24, { color: '#d8f0c0', speed: 180, life: 0.6, size: 3 }); }
          this.callout = { text: 'BRIAR BLOOM', sub: null, color: '#e9eef6', t: 1.3, max: 1.3 };
          break;
        case 'lamplure':
          this.flash = { color: '255,224,58', t: 0.35, max: 0.35, a: 0.35 };
          this.ring(f.x, f.y, 10, 1300, 1.1, RADIANT, 8, 'rgba(255,224,58,0.06)', true);
          this.callout = { text: 'LAMPLURE', sub: null, color: RADIANT, t: 1.3, max: 1.3 };
          break;
        case 'starfall':
          this.flash = { color: '176,107,255', t: 0.3, max: 0.3, a: 0.3 };
          this.callout = { text: 'STARFALL', sub: null, color: '#d8b8ff', t: 1.3, max: 1.3 };
          break;
        case 'windfall':
          this.ring(f.x, f.y, 8, 90, 0.6, '#ffd23a', 5, 'rgba(255,210,58,0.2)', true);
          P.burst(f.x, f.y - 16, 40, { color: '#ffd23a', speed: 260, life: 0.8, size: 3.4, grav: 240, ang: -Math.PI / 2, spread: 1.4 });
          break;
        case 'wildfire':
          this.ring(f.x, f.y, 4, f.r, 0.3, '#ff7a2a', 2.5, 'rgba(255,120,40,0.15)', true);
          break;
        case 'firestorm':
          S.flame();
          this.hitStop = Math.max(this.hitStop, 0.1);
          this.flash = { color: '255,120,40', t: 0.5, max: 0.5, a: 0.45 };
          this.shake = Math.max(this.shake, 8);
          this.callout = { text: 'FIRESTORM', sub: null, color: '#ff9a4a', t: 1.3, max: 1.3 };
          break;
        case 'tithe':
          this.text(W / 2, 122, `Tithe  +${Math.round(f.amount)}`, '#ffd23a', 16, 2, 16);
          break;
        case 'place':
          S.place();
          this.ring(f.x, f.y, 6, 40, 0.35, '#ffffff', 3);
          P.burst(f.x, f.y, 16, { color: '#ffffff', speed: 120, life: 0.45, size: 3 });
          break;
        case 'upgrade':
          S.upgrade(f.tier >= 3);
          this.upgradeFx(f);
          break;
        case 'sell':
          S.sell();
          this.text(f.x, f.y - 20, `+${f.amount}`, '#ffd23a', 15, 1);
          P.burst(f.x, f.y, 18, { color: '#ffd23a', speed: 140, life: 0.5, size: 3 });
          break;
        case 'bonus':
          this.text(W / 2, 96, `${f.label}  +${Math.round(f.amount)}`, '#ffd23a', 20, 2.2, 18);
          break;
        case 'streak':
          // Streaks are felt, not announced: a chime every 250, the rising pop pitch, and the
          // small counter in the corner. No centre-screen popup.
          S.streak();
          break;
        case 'leak':
          S.leak(f.boss || f.amount >= 20);
          this.shake = Math.max(this.shake, f.boss ? 14 : 4);
          this.text(MAP.goal.x, MAP.goal.y - 50, `-${f.amount} ♥`, '#ff3d3d', f.boss ? 26 : 17, 1.2);
          P.burst(MAP.goal.x, MAP.goal.y, f.boss ? 40 : 14, { color: '#ff3d3d', speed: 180, life: 0.6, size: 3.5 });
          this.ring(MAP.goal.x, MAP.goal.y, 20, f.boss ? 140 : 70, 0.4, '#ff3d3d', 4);
          break;
        case 'flare': {
          S.flare();
          this.hitStop = Math.max(this.hitStop, 0.12);
          this.flash = { color: '255,214,120', t: 0.35, max: 0.35, a: 0.55 };
          this.shake = Math.max(this.shake, 12);
          for (let k = 0; k < 3; k++) this.ring(f.x, f.y, 20, 1300, 0.9 + k * 0.25, k ? '#ffae2b' : '#fff6c0', 14 - k * 4, null, true);
          P.burst(f.x, f.y, 90, { color: '#ffd23a', speed: 520, life: 1.0, size: 4 });
          this.callout = { text: 'HEARTFIRE FLARE', sub: null, color: '#ffd23a', t: 1.3, max: 1.3 };
          break;
        }
        case 'hoarfrost':
          S.frost();
          this.hitStop = Math.max(this.hitStop, 0.1);
          this.flash = { color: '170,235,255', t: 0.5, max: 0.5, a: 0.5 };
          this.shake = Math.max(this.shake, 6);
          this.ring(f.x, f.y, 10, 1300, 1.0, '#e8fbff', 10, 'rgba(180,240,255,0.10)', true);
          this.callout = { text: 'HOARFROST', sub: null, color: '#aef0ff', t: 1.3, max: 1.3 };
          break;
        case 'ability':
          if (f.ward !== 'rime' && f.ward !== 'censer') S.ability();
          if (!['rime', 'censer', 'snare', 'moth', 'wander'].includes(f.ward)) this.text(f.x, f.y - 34, f.name.toUpperCase(), '#ffe45c', 18, 1.3, 24);
          this.ring(f.x, f.y, 8, 90, 0.5, '#ffe45c', 5, null, true);
          P.burst(f.x, f.y, 30, { color: '#ffe45c', speed: 240, life: 0.6, size: 3.2 });
          if (f.ward === 'mortar') this.shake = Math.max(this.shake, 5);
          break;
        case 'lastlight':
          S.lastLight();
          this.hitStop = Math.max(this.hitStop, 0.15);
          this.flash = { color: '255,240,190', t: 0.6, max: 0.6, a: 0.7 };
          this.shake = Math.max(this.shake, 14);
          for (let k = 0; k < 4; k++) this.ring(f.x, f.y, 10, f.r + k * 30, 0.6 + k * 0.15, '#fff1b0', 8 - k, k ? null : 'rgba(255,230,150,0.35)', true);
          P.burst(f.x, f.y, 120, { color: '#fff1b0', speed: 420, life: 1.0, size: 4 });
          this.callout = { text: 'LAST LIGHT!', sub: 'The Heartfire saved you, once', color: '#fff1b0', t: 2.6, max: 2.6 };
          break;
        case 'phase':
          S.crack();
          this.shake = Math.max(this.shake, 7);
          for (let k = 0; k < 3; k++) this.ring(f.x, f.y, 10, f.r * 2 + k * 40, 0.4 + k * 0.12, '#ff7a95', 5, null, true);
          P.burst(f.x, f.y, 50, { color: '#ff2d55', speed: 300, life: 0.8, size: 4 });
          this.text(f.x, f.y - 50, 'IT BURSTS!', '#ff7a95', 22, 1.4, 26);
          break;
        case 'healpulse':
          this.ring(f.x, f.y, 8, f.r, 0.5, '#5dff8a', 2.5, 'rgba(90,255,140,0.10)');
          break;
        case 'mend':
          P.burst(f.x, f.y, 6, { color: '#7dff9a', speed: 60, life: 0.5, size: 2.4, grav: -40 });
          break;
        case 'wave':
          S.wave(f.boss);
          this.banner = { text: `Wave ${f.n}`, sub: f.banner, boss: f.boss, t: f.banner ? 3 : 2, max: f.banner ? 3 : 2 };
          break;
        default:
      }
    }
    fx.length = 0;
  }

  stain(x, y, r, color) {
    if (this.stains.length > [20, 45, 90][this.quality]) this.stains.shift();
    this.stains.push({ x, y, r: r * (0.9 + Math.random() * 0.4), color, life: 7, rot: Math.random() * 6 });
  }

  // A soft blob per stain colour, drawn once (a stain is then two cheap calls).
  stainSprite(color) {
    const m = this._stainSprites || (this._stainSprites = new Map());
    let c = m.get(color);
    if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d');
    g.fillStyle = color; g.beginPath();
    for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU, r = k % 2 ? 9.5 : 15.5; g.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r * 0.8); }
    g.closePath(); g.fill();
    m.set(color, c);
    return c;
  }

  drawCoins(ctx, dt) {
    const cs = this.coins, tg = this.coinTarget;
    let w = 0;
    for (let i = 0; i < cs.length; i++) {
      const c = cs[i];
      c.t += dt;
      if (c.t >= c.dur) {
        if (this.onCoin) this.onCoin();
        if (this.sound) this.sound.coin();
        continue;
      }
      cs[w++] = c;
      if (c.t < 0) continue;
      const u = c.t / c.dur, e = u * u;
      // arc up first, then swoop to the counter
      const x = c.x + (tg.x - c.x) * e;
      const y = c.y + (tg.y - c.y) * e - Math.sin(u * Math.PI) * 60;
      const r = 4.5 - u * 1.5;
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(x, y, r + 1.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd23a';
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff6c0';
      ctx.fillRect(x - r * 0.45, y - r * 0.45, r * 0.5, r * 0.5);
    }
    cs.length = w;
  }

  countMulti(f) {
    const m = this.multi.get(f.src);
    if (m && m.t > 0) { m.n++; m.t = 0.3; m.x = f.x; m.y = f.y; }
    else this.multi.set(f.src, { n: 1, t: 0.3, x: f.x, y: f.y });
  }

  flushMulti(dt) {
    for (const [id, m] of this.multi) {
      m.t -= dt;
      if (m.t > 0) continue;
      // One attack breaking a pile of layers at once gets a shout-out.
      if (m.n >= 12) {
        this.text(m.x, m.y - 24, `${m.n} POPS!`, m.n >= 40 ? '#ff7ae0' : m.n >= 24 ? '#ffae2b' : '#ffe45c', Math.min(30, 12 + m.n * 0.35), 1.1, 30);
        if (m.n >= 40) this.shake = Math.max(this.shake, 3);
      }
      this.multi.delete(id);
    }
  }

  // Upgrades flash in the ward's own damage colour (path colours live only in the upgrade panel).
  upgradeFx(f) {
    const w = this.game.towers.find((t) => t.id === f.id);
    const col = w ? wardColor(w.type) : '#ffffff';
    const P = this.parts;
    this.pops.set(f.id, POP_TIME);
    const big = f.tier >= 3;
    this.ring(f.x, f.y, 8, big ? 80 : 46, big ? 0.6 : 0.4, col, big ? 5 : 3.5, null, true);
    this.ring(f.x, f.y, 4, big ? 50 : 30, 0.25, '#ffffff', 3, 'rgba(255,255,255,0.5)', true);
    P.burst(f.x, f.y, big ? 50 : 26, { color: col, speed: big ? 260 : 170, life: 0.7, size: 3.4 });
    P.burst(f.x, f.y, big ? 30 : 14, { color: '#ffffff', speed: big ? 160 : 110, life: 0.6, size: 2.6, grav: -80 });
    if (f.tier >= 4) {
      // capstone: a pillar of light and a callout
      this.bolts.push({ x: f.x, y: f.y, life: 0.6, max: 0.6, color: col });
      P.burst(f.x, f.y, 70, { color: col, speed: 340, life: 1.1, size: 4 });
      this.shake = Math.max(this.shake, 8);
      this.callout = { text: f.name.toUpperCase(), sub: 'Capstone unlocked', color: col, t: 2, max: 2 };
    } else if (f.tier === 3) {
      this.shake = Math.max(this.shake, 3);
      this.text(f.x, f.y - 34, f.name, col, 17, 1.4, 20);
    } else {
      this.text(f.x, f.y - 30, f.name, col, 13, 1.1, 18);
    }
  }

  // ---- frame ----------------------------------------------------------------------------------
  // dt is effect time (0 while paused). ui: { placing, selected, mouse: { x, y, inside }, previewRange }
  // Adds the time since t0 to a perf bucket and returns now (cheap enough to leave on).
  mark(name, t0) { const t = performance.now(); this.addPerf(name, t - t0); return t; }
  // perf.acc is the overlay's half-second window; perf.sum keeps running totals for tools/perf.mjs.
  addPerf(name, ms) { const P = this.perf; P.acc[name] = (P.acc[name] || 0) + ms; P.sum[name] = (P.sum[name] || 0) + ms; }

  draw(dt, ui) {
    let pt = performance.now();
    this.consume();
    this.time += dt;
    pt = this.mark('events', pt);
    this.parts.update(dt);
    pt = this.mark('particles', pt);
    this.flushMulti(dt);
    this.shake *= Math.exp(-dt * 9);
    if (this.shake < 0.15) this.shake = 0;

    const { ctx, game } = this;
    const s = this.scale;
    // Quality scales with the crowd so big waves stay smooth: 2 full, 1 crowd (no small status
    // overlays, fewer particles and rings), 0 huge crowd (lighter still). Hysteresis stops flicker.
    const n = game.enemies.length, q = this.quality;
    this.quality = q === 2 ? (n > 200 ? 1 : 2) : q === 1 ? (n < 150 ? 2 : n > 650 ? 0 : 1) : (n < 560 ? 1 : 0);
    const lite = this.quality < 2;
    DETAIL.q = this.quality;
    // Wards redraw their live layer every 2nd frame (every 4th or 6th in big crowds), staggered.
    this.frameN = (this.frameN || 0) + 1;
    setWardRefresh([6, 4, 2][this.quality], this.frameN, [1.2, 1.6, 3][this.quality]);
    if (this.frameN % 300 === 0) { const ids = new Set(); for (const t of game.towers) { ids.add(t.id); for (let i = 1; i < t.lights.length; i++) ids.add(-(t.id * 8 + i)); } pruneWardCache(ids); }
    this.parts.cap = [500, 800, 1400][this.quality];
    this.parts.share = [0.35, 0.6, 1][this.quality];
    this.ringCap = [40, 90, 160][this.quality];
    const roar = this.flameFx.update(dt, game.towers, lite, this.quality);
    if (this.sound) this.sound.roar(roar);
    const sx = this.shake ? (Math.random() - 0.5) * 2 * this.shake : 0;
    const sy = this.shake ? (Math.random() - 0.5) * 2 * this.shake : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.shake) { ctx.fillStyle = '#1f6f63'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }
    pt = this.mark('effects', pt);
    ctx.drawImage(this.bg, Math.round(sx * s), Math.round(sy * s));
    ctx.setTransform(s, 0, 0, s, sx * s, sy * s);
    setEnemyBase(s, sx * s, sy * s);

    this.flameFx.drawHaze(ctx, this.bg, s, game.enemies.length);
    this.drawStains(ctx, dt);
    this.flameFx.drawScorch(ctx);
    this.drawLandmarks(ctx);
    this.drawZones(ctx, dt);
    this.drawAuras(ctx);
    this.drawSnares(ctx, dt);

    this.flameFx.drawGlow(ctx);

    const sel = ui.selected;
    if (sel && sel.stats.global) this.mapWide(ctx);
    else if (sel && sel.def.kind === 'snare') this.snareReach(ctx, sel);
    else if (sel && sel.def.kind === 'wander') this.wanderReach(ctx, sel, sel.hx, sel.hy, sel.stats, true);
    else if (sel) {
      this.rangeCircle(ctx, sel.x, sel.y, sel.stats.range, true, sel.stats.minRange);
      if (ui.previewRange && Math.abs(ui.previewRange - sel.stats.range) > 1) {
        ctx.strokeStyle = '#ffe45c';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.arc(sel.x, sel.y, ui.previewRange, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (ui.moving) { // a Wandering Light's new post, under the cursor
      const t = ui.moving, ok = ui.mouse.inside && this.game.canMovePost(t, ui.mouse.x, ui.mouse.y);
      if (ui.mouse.inside) {
        ctx.strokeStyle = ok ? 'rgba(216,184,255,0.8)' : 'rgba(255,80,80,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(t.hx, t.hy); ctx.lineTo(ui.mouse.x, ui.mouse.y); ctx.stroke(); ctx.setLineDash([]);
        this.wanderReach(ctx, t, ui.mouse.x, ui.mouse.y, t.stats, ok);
      }
    }

    if (sel) { // the selection ring lies on the ground around the ward's footprint
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -this.time * 16;
      ctx.beginPath(); ctx.ellipse(sel.x, sel.y + 2, 24, 10, 0, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Upright wards and walking Gloom are drawn back to front, so whatever stands nearer the
    // bottom of the screen covers what's behind it. Flyers go over everything.
    pt = this.mark('ground', pt);
    const es = game.enemies, walk = this._walk, wards = this._wards;
    walk.length = 0;
    let flyers = 0;
    for (let i = 0; i < es.length; i++) {
      const e = es[i];
      if (e.x < -40 || e.x > W + 40 || e.y < -40 || e.y > H + 40) continue;   // not on screen yet
      if (e.def.flying) flyers++; else walk.push(e);
    }
    walk.sort(byY);
    wards.length = 0;
    for (const t of game.towers) {
      if (t.def.onPath) continue;   // Snares lie flat on the road (drawn with the ground)
      wards.push(t);
      for (let i = 1; i < t.lights.length; i++) wards.push(this.lightWard(t, i));   // a Swarm's other lights
    }
    wards.sort(byY);
    this.drawBeams(ctx);
    pt = this.mark('effects', pt);
    this.perf.wardT = 0;
    let wi = 0;
    for (let i = 0; i < walk.length; i++) {
      const e = walk[i];
      if (wi < wards.length && wards[wi].y + 3 <= e.y) {
        ctx.setTransform(s, 0, 0, s, sx * s, sy * s);   // drawEnemy leaves its own transform set
        while (wi < wards.length && wards[wi].y + 3 <= e.y) this.drawWardAt(ctx, wards[wi++], dt);
      }
      drawEnemy(ctx, e, lite, this.quality);
    }
    ctx.setTransform(s, 0, 0, s, sx * s, sy * s);
    while (wi < wards.length) this.drawWardAt(ctx, wards[wi++], dt);
    { const t = performance.now(); this.addPerf('enemies', t - pt - this.perf.wardT); this.addPerf('wards', this.perf.wardT); pt = t; }
    this.drawGhosts(ctx, lite);
    pt = this.mark('ghosts', pt);
    if (flyers) for (let i = 0; i < es.length; i++) { const e = es[i]; if (e.def.flying && e.x > -40 && e.x < W + 40 && e.y > -40 && e.y < H + 40) drawEnemy(ctx, e, lite, this.quality); }
    flushEnemyBars(ctx);
    ctx.setTransform(s, 0, 0, s, sx * s, sy * s);
    this.drawTethers(ctx);
    pt = this.mark('enemies', pt);

    for (const t of game.towers) {
      // A Beacon's boost: a small golden chevron over the ward
      if (t.aura) {
        const y = wardTop(t) - 5 + Math.sin(this.time * 4 + t.id) * 1.5;
        ctx.fillStyle = game.rally ? '#ffd0e6' : DMG.hearth.core;   // a Beacon's boost, in Hearth pink
        ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(t.x - 5, y + 3); ctx.lineTo(t.x, y - 2); ctx.lineTo(t.x + 5, y + 3); ctx.lineTo(t.x + 5, y + 6); ctx.lineTo(t.x, y + 1); ctx.lineTo(t.x - 5, y + 6); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      // Overdraw: a spinning ring on the ground in the ward's colour while the buff lasts
      if (t.buffT > 0) {
        ctx.strokeStyle = wardColor(t.type);
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -this.time * 60;
        ctx.beginPath(); ctx.ellipse(t.x, t.y + 2, 28 + Math.sin(this.time * 20) * 2, 12, 0, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
      }
      // tier 4 wards shed motes of light in their damage colour, rising off the body
      if (dt > 0 && (t.tiers[0] >= 4 || t.tiers[1] >= 4 || t.tiers[2] >= 4) && Math.random() < 0.35) {
        const an = Math.random() * TAU, d = 8 + Math.random() * 14;
        this.parts.burst(t.x + Math.cos(an) * d, t.y - 6 + Math.sin(an) * d * 0.6, 1, { color: wardColor(t.type), speed: 30, life: 0.9, size: 2.6, grav: -60, ang: -Math.PI / 2, spread: 1 });
      }
    }

    pt = this.mark('wards', pt);
    this.drawProjectiles(ctx);
    pt = this.mark('shots', pt);
    this.flameFx.draw(ctx, { s, e: sx * s, f: sy * s });
    pt = this.mark('flames', pt);
    this.drawTracers(ctx, dt);
    this.drawWisps(ctx, dt);
    this.drawRings(ctx, dt);
    this.drawArcs(ctx, dt);
    this.drawPillars(ctx, dt);
    pt = this.mark('rings', pt);
    this.parts.draw(ctx);
    pt = this.mark('particles', pt);
    this.drawSnow(ctx, dt);
    pt = this.mark('effects', pt);
    this.drawCoins(ctx, dt);
    this.drawTexts(ctx, dt);
    this.drawPlacement(ctx, ui);

    ctx.setTransform(s, 0, 0, s, 0, 0);
    this.drawFlash(ctx, dt);
    this.drawBossBar(ctx);
    this.drawStreak(ctx);
    this.drawBanner(ctx, dt);
    this.drawCallout(ctx, dt);
    this.mark('overlay', pt);
    this.drawFps(ctx);
  }

  // Endless Winter slows the whole map: light snow drifts across it while one stands.
  drawSnow(ctx, dt) {
    let on = false;
    for (const t of this.game.towers) if (t.stats.globalSlow) { on = true; break; }
    if (!on && !this.snow) return;
    if (!this.snow) { this.snow = []; for (let i = 0; i < 90; i++) this.snow.push({ x: Math.random() * W, y: Math.random() * H, s: 1.2 + Math.random() * 2.2, v: 18 + Math.random() * 26, ph: Math.random() * TAU }); this.snowA = 0; }
    this.snowA = Math.max(0, Math.min(1, this.snowA + (on ? dt : -dt) * 0.8));
    if (!on && this.snowA <= 0) { this.snow = null; return; }
    ctx.fillStyle = '#ffffff';
    for (const f of this.snow) {
      f.y += f.v * dt; f.x += Math.sin(this.time * 0.8 + f.ph) * 12 * dt - 6 * dt;
      if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
      if (f.x < -4) f.x = W + 4;
      ctx.globalAlpha = this.snowA * (0.35 + f.s * 0.12);
      ctx.fillRect(f.x - f.s / 2, f.y - f.s / 2, f.s, f.s);
    }
    ctx.globalAlpha = 1;
  }

  // Upright wards can stand in front of the Gloom. Rather than fading the ward (which would flicker
  // as crowds pass and blur the ward exactly when it matters), any walker behind a ward shows
  // through it as a faint ghost with a light outline, clipped to the ward's body. The ward stays
  // solid and readable, and nothing hides behind it.
  drawGhosts(ctx, lite) {
    const box = this._box || (this._box = [0, 0, 0, 0]), buf = this._gbuf || (this._gbuf = []);
    const grid = this.game.grid;
    for (const t of this.game.towers) {
      if (t.def.onPath) continue;   // flat on the road: hides nothing
      wardBox(t, box);
      const cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2;
      grid.query(cx, cy, Math.hypot(box[2] - box[0], box[3] - box[1]) / 2 + 16, buf);
      let open = false, n = 0;
      for (let i = 0; i < buf.length && n < 6; i++) {
        const e = buf[i];
        if (e.def.flying || e.y >= t.y + 3) continue;   // only walkers drawn behind this ward
        // ...whose middle the ward actually covers (one peeking out at the edge is visible anyway)
        if (e.x < box[0] || e.x > box[2] || e.y < box[1]) continue;
        n++;
        if (!open) { open = true; ctx.save(); ctx.beginPath(); ctx.rect(box[0], box[1], box[2] - box[0], box[3] - box[1]); ctx.clip(); }
        ctx.globalAlpha = 0.5;
        drawEnemyBody(ctx, e);
        ctx.globalAlpha = 0.75; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 1, 0, TAU); ctx.stroke();
      }
      if (open) { ctx.globalAlpha = 1; ctx.restore(); }
    }
  }

  // A Swarm's extra lights are drawn as wards of their own (each with its own live layer).
  lightWard(t, i) {
    const m = this._lights || (this._lights = new Map()), key = t.id * 8 + i;
    let w = m.get(key);
    if (!w || w.src !== t) { w = { src: t, type: t.type, def: t.def, tiers: t.tiers, stats: t.stats, id: -key, x: 0, y: 0, hx: 0, hy: 0, ang: 0, recoil: 0, pulseAnim: 0, target: null, lights: [], bank: 0, charges: 0, bloomT: 0 }; m.set(key, w); }
    const L = t.lights[i];
    w.tiers = t.tiers; w.stats = t.stats; w.x = L.x; w.y = L.y; w.hx = t.hx; w.hy = t.hy; w.ang = L.ang; w.recoil = L.recoil; w.target = L.tgt;
    if (m.size > 200) m.clear();
    return w;
  }

  // Thornlight Snares lie flat on the road, under everything that walks over them; Flashmines too.
  drawSnares(ctx, dt) {
    const g = this.game;
    for (const t of g.towers) if (t.def.onPath) this.drawWardAt(ctx, t, dt);
    if (!g.mines.length) return;
    const img = this.mineSprite();
    for (const m of g.mines) {
      const armed = m.arm <= 0, k = armed ? 0.75 + Math.sin(this.time * 6 + m.x) * 0.25 : 0.4;
      ctx.globalAlpha = k;
      ctx.drawImage(img, m.x - 8, m.y - 8, 16, 16);
    }
    ctx.globalAlpha = 1;
  }
  // A Flashmine: a little lamp-seed with a white core (shared by both skins: the projectile rule).
  mineSprite() {
    if (this._mine) return this._mine;
    const c = document.createElement('canvas'), N = 32, g = c.getContext('2d');
    c.width = c.height = N;
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.3, 'rgba(233,238,246,0.5)'); gr.addColorStop(1, 'rgba(233,238,246,0)');
    g.fillStyle = gr; g.fillRect(0, 0, N, N);
    g.fillStyle = '#3a4160'; g.strokeStyle = '#1a1428'; g.lineWidth = 2;
    g.beginPath(); g.arc(16, 17, 6, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(16, 16, 3, 0, TAU); g.fill();
    g.strokeStyle = '#b8c2d2'; g.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.6; g.beginPath(); g.moveTo(16 + Math.cos(a) * 6, 17 + Math.sin(a) * 6); g.lineTo(16 + Math.cos(a) * 9, 17 + Math.sin(a) * 9); g.stroke(); }
    return (this._mine = c);
  }

  // Moth Lanterns: a glowing thread from the paper lantern to every flyer circling it.
  drawTethers(ctx) {
    const es = this.game.enemies;
    let any = false;
    for (let i = 0; i < es.length; i++) { const e = es[i]; if (e.lureT > 0 && e.lure) { any = true; break; } }
    if (!any) return;
    const mm = this._mm || (this._mm = new Map());
    mm.clear();
    ctx.beginPath();
    for (let i = 0; i < es.length; i++) {
      const e = es[i];
      if (!(e.lureT > 0) || !e.lure || e.lure.sold) continue;
      let m = mm.get(e.lure.id);
      if (!m) { const o = wardMuzzle(e.lure, 0, [0, 0]); m = [o[0], o[1]]; mm.set(e.lure.id, m); }
      ctx.moveTo(m[0], m[1]); ctx.lineTo(e.x, e.y);
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,224,58,0.35)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,246,200,0.7)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }

  // Ember Vaults: rose wisps carrying embers from a kill into the brazier.
  drawWisps(ctx, dt) {
    const ws = this.wisps;
    if (!ws.length) return;
    let w = 0;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < ws.length; i++) {
      const p = ws[i];
      p.t += dt;
      if (p.t >= p.dur || p.v.sold) continue;
      ws[w++] = p;
      const u = p.t / p.dur, e = u * u * (3 - 2 * u);
      const m = wardMuzzle(p.v, 0, this._m), tx = m[0], ty = m[1];
      const x = p.x + (tx - p.x) * e, y = p.y + (ty - p.y) * e - Math.sin(u * Math.PI) * (30 + p.bend * 0.3);
      ctx.fillStyle = 'rgba(255,126,182,0.35)'; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd0e6'; ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill();
    }
    ws.length = w;
    ctx.globalCompositeOperation = 'source-over';
  }

  // A selected Snare: its bite ring, and the stretch of road its Flashmines are sown along.
  snareReach(ctx, t) {
    const s = t.stats;
    this.rangeCircle(ctx, t.x, t.y, Math.max(s.radius, 24), true);
    if (s.mineMax) {
      const path = this.game.map.path, a = Math.max(30, t.pathDist - 30), b = Math.min(path.length - 90, t.pathDist + s.mineRange);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = MAP.pathWidth - 10; ctx.lineCap = 'round';
      ctx.beginPath(); for (let d = a; d <= b; d += 8) { path.posAt(d, this._pos || (this._pos = {}), 0); if (d === a) ctx.moveTo(this._pos.x, this._pos.y); else ctx.lineTo(this._pos.x, this._pos.y); } ctx.stroke();
      ctx.lineCap = 'butt';
    }
    if (s.rootRadius) this.rangeCircle(ctx, t.x, t.y, s.rootRadius, true);
  }
  // A Wandering Light: where it roams (dashed, round its post) and what it can reach from there.
  wanderReach(ctx, t, hx, hy, s, ok) {
    this.rangeCircle(ctx, hx, hy, s.range + s.leash, ok);
    ctx.strokeStyle = ok ? 'rgba(216,184,255,0.9)' : 'rgba(255,90,90,0.9)'; ctx.lineWidth = 2; ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.arc(hx, hy, s.leash, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    // the post: a small rune on the ground
    ctx.save(); ctx.translate(hx, hy); ctx.scale(1, 0.5);
    ctx.strokeStyle = '#d8b8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke();
    ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * TAU) / 5; if (i) ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7); else ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7); } ctx.closePath(); ctx.stroke();
    ctx.restore();
    if (t.def.torchRange !== undefined || s.torchRate) { ctx.strokeStyle = 'rgba(255,126,182,0.5)'; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.arc(hx, hy, s.torchRange, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
  }

  drawWardAt(ctx, t, dt) {
    const t0 = performance.now();
    this.drawWardAt0(ctx, t, dt);
    this.perf.wardT += performance.now() - t0;
  }

  drawWardAt0(ctx, t, dt) {
    let pop = this.pops.get(t.id) || 0;
    if (pop > 0) {
      pop -= dt;
      if (pop <= 0) this.pops.delete(t.id); else this.pops.set(t.id, pop);
    }
    const st = this._st;
    st.ang = t.ang; st.recoil = t.recoil; st.time = this.time + t.id * 0.37; st.pulse = t.pulseAnim; st.id = t.id;
    st.fill = t.def.kind === 'vault' ? Math.min(1, t.bank / t.stats.cap) : t.def.kind === 'snare' ? t.charges / t.stats.charges : t.def.kind === 'lure' ? Math.min(1, (t.lured || 0) / 3) : 0;
    st.warm = !!t.warm; st.bloom = t.bloomT > 0;
    const fl = t.def.kind === 'flame' && this.flameFx.state.get(t.id);
    st.fire = fl ? fl.k : 0;
    const tg = t.target;
    if (tg && tg.alive) { st.tx = tg.x - t.x; st.ty = tg.y - t.y; } else { st.tx = null; st.ty = null; }
    // pop: quick overshoot then settle
    st.pop = pop > 0 ? Math.sin((1 - pop / POP_TIME) * Math.PI) * (pop / POP_TIME + 0.3) : 0;
    drawWard(ctx, t, st);
  }

  drawFlash(ctx, dt) {
    const f = this.flash;
    if (!f) return;
    f.t -= dt;
    if (f.t <= 0) { this.flash = null; return; }
    ctx.fillStyle = `rgba(${f.color},${(f.a * f.t) / f.max})`;
    ctx.fillRect(0, 0, W, H);
  }

  // Toggled with `: frames per second, worst frame time, a per-frame cost breakdown and counts.
  drawFps(ctx) {
    const f = this.fps, now = performance.now(), P = this.perf;
    f.worst = Math.max(f.worst, now - f.last);
    f.last = now;
    f.frames++; P.frames++;
    if (now - f.t >= 500) {
      f.value = Math.round((f.frames * 1000) / (now - f.t));
      f.shownWorst = Math.round(f.worst);
      const n = Math.max(1, P.frames), a = P.acc, sh = {};
      for (const k in a) sh[k] = a[k] / n;
      sh.steps = P.steps / n;
      P.shown = sh; P.acc = Object.create(null); P.frames = 0; P.steps = 0;
      f.frames = 0; f.t = now; f.worst = 0;
    }
    if (!this.showFps) return;
    const g = this.game, sh = P.shown || {}, ms = (k) => (sh[k] || 0).toFixed(1);
    sh.effects = ['events', 'shots', 'flames', 'rings', 'effects'].reduce((t, k) => t + (sh[k] || 0), 0);
    const total = ['sim', 'ui', 'effects', 'ground', 'enemies', 'wards', 'ghosts', 'particles', 'overlay'].reduce((t, k) => t + (sh[k] || 0), 0);
    const lines = [
      `${f.value} fps  (worst ${f.shownWorst || 0} ms)  ·  quality ${this.quality === 2 ? 'full' : this.quality === 1 ? 'crowd' : 'huge crowd'}`,
      `ms/frame  sim ${ms('sim')} (${(sh.steps || 0).toFixed(1)} steps)  ·  enemies ${ms('enemies')}  ·  wards ${ms('wards')}  ·  see-through ${ms('ghosts')}`,
      `effects ${ms('effects')} (shots ${ms('shots')}, flames ${ms('flames')}, rings ${ms('rings')})  ·  particles ${ms('particles')}  ·  ground ${ms('ground')}  ·  overlay ${ms('overlay')}  ·  ui ${ms('ui')}  ·  total ${total.toFixed(1)}`,
      `${g.enemies.length} enemies  ·  ${g.towers.length} wards  ·  ${g.projectiles.length} shots  ·  ${this.parts.list.length} particles  ·  ${this.flameFx.flame.length} flame  ·  ${this.rings.length} rings`,
    ];
    ctx.font = `700 12px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    let w = 0; for (const l of lines) w = Math.max(w, ctx.measureText(l).width);
    const y0 = H - 8 - lines.length * 16;
    ctx.fillStyle = 'rgba(29,16,48,0.8)';
    ctx.fillRect(6, y0 - 4, w + 12, lines.length * 16 + 6);
    lines.forEach((l, i) => { ctx.fillStyle = i ? '#e8eef5' : f.value >= 55 ? '#5dff8a' : f.value >= 40 ? '#ffd23a' : '#ff5a4a'; ctx.fillText(l, 12, y0 + 14 + i * 16); });
  }

  drawStains(ctx, dt) {
    const st = this.stains;
    let w = 0;
    for (let i = 0; i < st.length; i++) {
      const s = st[i];
      s.life -= dt;
      if (s.life <= 0) continue;
      st[w++] = s;
      ctx.globalAlpha = Math.min(0.4, s.life * 0.12);
      ctx.drawImage(this.stainSprite(s.color), s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    }
    st.length = w;
    ctx.globalAlpha = 1;
  }

  drawLandmarks(ctx) {
    const t = this.time;
    const rift = MAP.rift;
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.5 + i / 4) % 1;
      ctx.strokeStyle = `rgba(200,107,255,${0.8 * (1 - p)})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.ellipse(rift.x, rift.y, 10 + p * 22, 22 + p * 26, 0, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = '#2a0a45';
    ctx.beginPath(); ctx.ellipse(rift.x, rift.y, 11, 25, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#e0a8ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // the Heartfire
    const g = MAP.goal;
    const life = Math.max(0.15, Math.min(1, this.game.lives / RULES.startLives));
    const flick = Math.sin(t * 11) * 0.08 + Math.sin(t * 17.3) * 0.05;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,170,60,${0.18 + life * 0.12})`;
    ctx.beginPath(); ctx.arc(g.x, g.y, 50 + flick * 40, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const h = (18 + life * 24) * (1 + flick);
    for (const [w, hh, c] of [[14, h, '#ff5a1a'], [10, h * 0.75, '#ffae2b'], [5.5, h * 0.48, '#fff6c0']]) {
      const sway = Math.sin(t * 7 + w) * 3;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(g.x - w, g.y + 4);
      ctx.quadraticCurveTo(g.x - w, g.y - hh * 0.5, g.x + sway, g.y - hh);
      ctx.quadraticCurveTo(g.x + w, g.y - hh * 0.5, g.x + w, g.y + 4);
      ctx.quadraticCurveTo(g.x, g.y + 12, g.x - w, g.y + 4);
      ctx.fill();
    }
    if (Math.random() < 0.3) this.parts.burst(g.x + (Math.random() - 0.5) * 12, g.y - h * 0.6, 1, { color: '#ffd23a', speed: 40, life: 0.8, size: 2.4, grav: -70, ang: -Math.PI / 2, spread: 1 });
  }

  // Burning ground: the two glowing discs are one cached additive image (additive light adds up the
  // same baked or live), drawn at the zone's flicker; the settled rims are stroked as one path.
  zoneSprite() {
    if (this._zoneSprite) return this._zoneSprite;
    const c = document.createElement('canvas'), N = 128, g = c.getContext('2d');
    c.width = c.height = N;
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = 'rgba(255,90,20,0.3)'; g.beginPath(); g.arc(N / 2, N / 2, N / 2 - 1, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,200,60,0.28)'; g.beginPath(); g.arc(N / 2, N / 2, (N / 2 - 1) * 0.6, 0, TAU); g.fill();
    return (this._zoneSprite = c);
  }

  drawZones(ctx, dt) {
    const zs = this.game.zones;
    if (!zs.length) return;
    const img = this.zoneSprite();
    ctx.globalCompositeOperation = 'lighter';
    for (const z of zs) {
      ctx.globalAlpha = Math.min(1, z.t * 2) * (0.85 + Math.sin(this.time * 14 + z.x) * 0.15);
      ctx.drawImage(img, z.x - z.r, z.y - z.r, z.r * 2, z.r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,120,30,0.8)';
    ctx.beginPath();
    for (const z of zs) if (z.t >= 0.5) { ctx.moveTo(z.x + z.r, z.y); ctx.arc(z.x, z.y, z.r, 0, TAU); }
    ctx.stroke();
    for (const z of zs) {
      if (z.t < 0.5) {   // burning out: its rim fades
        ctx.strokeStyle = `rgba(255,120,30,${0.8 * Math.min(1, z.t * 2)})`;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.stroke();
      }
      if (dt > 0 && Math.random() < 0.6) {
        const an = Math.random() * TAU, d = Math.random() * z.r;
        this.parts.burst(z.x + Math.cos(an) * d, z.y + Math.sin(an) * d, 1, { color: Math.random() < 0.5 ? '#ffd23a' : '#ff5a1a', speed: 30, life: 0.6, size: 3, grav: -90, ang: -Math.PI / 2, spread: 0.8 });
      }
    }
  }

  // Beacons: a soft pool of light over the wards they boost.
  drawAuras(ctx) {
    for (const t of this.game.towers) {
      if (t.def.kind !== 'aura') continue;
      const r = t.stats.range;
      const p = (this.time * 0.35 + t.id * 0.13) % 1;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,126,182,0.05)';   // Hearth: the support colour
      ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = `rgba(255,126,182,${0.4 * (1 - p)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(t.x, t.y, r * (0.3 + p * 0.7), 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,126,182,0.35)';
      ctx.setLineDash([5, 7]);
      ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Prism beams: thicker and brighter as they charge; gold during Sunlance.
  drawBeams(ctx) {
    ctx.lineCap = 'round';
    for (const t of this.game.towers) {
      if (t.def.kind !== 'beam') continue;
      const s = t.stats, sun = t.sunT > 0;
      for (const b of t.beams) {
        const e = b.e;
        if (!e || !e.alive) continue;
        const k = (b.charge - 1) / Math.max(1, s.maxCharge - 1);
        const flick = 0.85 + Math.sin(this.time * 40 + t.id) * 0.15;
        const m = wardMuzzle(t, Math.atan2(e.y - t.y, e.x - t.x), this._m), sx = m[0], sy = m[1];   // from the drawn lens or crystal
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = sun ? `rgba(255,190,60,${0.5 * flick})` : `rgba(255,224,58,${(0.25 + k * 0.35) * flick})`;
        ctx.lineWidth = (4 + k * 9) * (sun ? 1.4 : 1);
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(e.x, e.y); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = sun ? '#ffffff' : k > 0.6 ? '#fffbe0' : '#fff3b0';
        ctx.lineWidth = 1.5 + k * 2.5;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(e.x, e.y); ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255,240,200,${0.3 + k * 0.4})`;
        ctx.beginPath(); ctx.arc(e.x, e.y, 5 + k * 7 * flick, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.lineCap = 'butt';
  }

  drawTracers(ctx, dt) {
    const list = this.tracers;
    let w = 0;
    ctx.lineCap = 'round';
    for (let i = 0; i < list.length; i++) {
      const tr = list[i];
      tr.life -= dt;
      if (tr.life <= 0) continue;
      list[w++] = tr;
      const a = tr.life / tr.max;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(233,238,246,${(tr.spot ? 0.4 : 0.5) * a})`;
      ctx.lineWidth = tr.big ? 9 : 4;
      ctx.beginPath(); ctx.moveTo(tr.x, tr.y); ctx.lineTo(tr.tx, tr.ty); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = tr.big ? 2.5 : 1.4;
      ctx.beginPath(); ctx.moveTo(tr.x, tr.y); ctx.lineTo(tr.tx, tr.ty); ctx.stroke();
    }
    list.length = w;
    ctx.lineCap = 'butt';
  }

  // A map-wide ward (the Longeye) has no range circle: a faint frame around the whole map instead.
  mapWide(ctx) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 12]);
    ctx.lineDashOffset = -this.time * 24;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    ctx.setLineDash([]);
  }

  rangeCircle(ctx, x, y, r, ok, minRange) {
    ctx.fillStyle = ok ? 'rgba(255,255,255,0.13)' : 'rgba(255,60,60,0.18)';
    ctx.strokeStyle = ok ? 'rgba(255,255,255,0.9)' : 'rgba(255,70,60,0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    if (minRange) {
      ctx.strokeStyle = 'rgba(255,170,60,0.9)';
      ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.arc(x, y, minRange, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // A Wandering Light's star: a spinning five-point star in Arcane violet with a sparkle tail; a
  // comet (Hunter tier 4, Starfall) is bigger with a long tail. Shared by both skins.
  drawStar(ctx, p, x, y) {
    const g = Math.hypot(p.vx, p.vy) || 1, ux = p.vx / g, uy = p.vy / g;
    const big = p.comet, r = big ? 6.5 : 4 + (p.s.starRadius >= 45 ? 1.2 : 0), tail = big ? 34 : 14;
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = big ? 'rgba(176,107,255,0.5)' : 'rgba(176,107,255,0.35)'; ctx.lineWidth = r * 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - ux * tail, y - uy * tail); ctx.lineTo(x, y); ctx.stroke();
    if (big) { ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = r * 0.6; ctx.stroke(); }
    ctx.fillStyle = 'rgba(216,184,255,0.8)';
    for (let i = 1; i <= (big ? 3 : 2); i++) { const d = tail * (0.35 * i), o = Math.sin(this.time * 30 + i * 2 + p.x) * 3; ctx.fillRect(x - ux * d - uy * o - 1, y - uy * d + ux * o - 1, 2, 2); }
    ctx.globalCompositeOperation = 'source-over';
    const a = this.time * 9 + (p.x + p.y) * 0.01;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const q = a + (i / 10) * TAU, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr); }
    ctx.closePath();
    ctx.fillStyle = ARCANE; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, TAU); ctx.fill();
  }

  drawProjectiles(ctx) {
    const ps = this.game.projectiles;
    ctx.lineCap = 'round';
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      if (p.kind === 'bolt') {
        const sz = p.s.boltSize || 1;
        // Bolts leave the crossbow up on the ward and drop to the target's height as they fly: the
        // offset from the footprint to the muzzle fades out over the first flight.
        if (p._ox === undefined && p.star) {
          // A star leaves the wand of the light that cast it (that light's spot when it cast).
          const w = p.src, A = this._starAt || (this._starAt = { type: 'wander', tiers: null, x: 0, y: 0 });
          A.tiers = w.tiers; A.x = p.ox; A.y = p.oy;
          const m = wardMuzzle(A, Math.atan2(p.vy, p.vx), this._m), g = Math.hypot(p.vx, p.vy) || 1;
          p._ox = m[0] - (p.ox + (p.vx / g) * 8); p._oy = m[1] - (p.oy + (p.vy / g) * 8);
          p._sx = p.x; p._sy = p.y;
          p._D = p.target ? Math.max(50, Math.hypot(p.target.x - p.x, p.target.y - p.y)) : 80;
        }
        if (p._ox === undefined) {
          const w = p.src, m = w ? wardMuzzle(w, Math.atan2(p.vy, p.vx), this._m) : null;
          const g = w ? Math.hypot(p.vx, p.vy) || 1 : 1;
          p._ox = m ? m[0] - (w.x + (p.vx / g) * 16) : 0; p._oy = m ? m[1] - (w.y + (p.vy / g) * 16) : 0;
          p._sx = p.x; p._sy = p.y;
          const tg = p.target;
          p._D = tg ? Math.max(50, Math.hypot(tg.x - p.x, tg.y - p.y)) : 80;
        }
        const fade = p.hit.length ? 0 : Math.max(0, 1 - Math.hypot(p.x - p._sx, p.y - p._sy) / p._D);
        const x = p.x + p._ox * fade, y = p.y + p._oy * fade;
        if (p.star) { this.drawStar(ctx, p, x, y); continue; }
        if (p.s.lance) {
          // Siege Lance: a long white-hot streak of silver light
          const k = 0.1;
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(233,238,246,0.35)';
          ctx.lineWidth = 18;
          ctx.beginPath(); ctx.moveTo(x - p.vx * k, y - p.vy * k); ctx.lineTo(x, y); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 9;
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(x - p.vx * k * 0.7, y - p.vy * k * 0.7); ctx.lineTo(x, y); ctx.stroke();
          continue;
        }
        const k = 0.022 + sz * 0.006;
        if (sz >= 2 || p.s.shots >= 8) { // heavy bolts and the Storm of Bolts leave a faint streak
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(233,238,246,0.22)';
          ctx.lineWidth = 2 + sz * 1.6;
          ctx.beginPath(); ctx.moveTo(x - p.vx * k * 1.6, y - p.vy * k * 1.6); ctx.lineTo(x, y); ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2 + sz * 1.6;
        ctx.beginPath(); ctx.moveTo(x - p.vx * k, y - p.vy * k); ctx.lineTo(x, y); ctx.stroke();
        ctx.strokeStyle = KINETIC;
        ctx.lineWidth = 0.8 + sz * 1.2;
        ctx.stroke();
      } else {
        const u = Math.min(1, p.t / p.flight);
        const lift = Math.sin(u * Math.PI) * (p.sub ? 22 : 64);
        // shells leave the mortar's drawn mouth; that offset fades out over the flight
        if (p._ox === undefined) { const w = p.src, m = w && !p.sub ? wardMuzzle(w, Math.atan2(p.ty - p.sy, p.tx - p.sx), this._m) : null; p._ox = m ? m[0] - p.sx : 0; p._oy = m ? m[1] - p.sy : 0; }
        const ox = p._ox * (1 - u), oy = p._oy * (1 - u);
        ctx.fillStyle = 'rgba(10,40,30,0.35)';
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 5, 3, 0, 0, TAU); ctx.fill();
        const r = (p.sub ? 3.2 : 5) + lift * 0.035;
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(p.x + ox, p.y - lift + oy, r + 1.2, 0, TAU); ctx.fill();
        ctx.fillStyle = p.s.poolDps ? '#ff5a1a' : '#4a4050';
        ctx.beginPath(); ctx.arc(p.x + ox, p.y - lift + oy, r, 0, TAU); ctx.fill();
        ctx.fillStyle = DMG.blast.core;   // the Blast colour: a lit fuse
        ctx.beginPath(); ctx.arc(p.x + ox - r * 0.3, p.y - lift + oy - r * 0.3, r * 0.4, 0, TAU); ctx.fill();
        if (!p.sub) {
          ctx.strokeStyle = `rgba(255,80,40,${0.3 + u * 0.6})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(p.tx, p.ty, 4 + (1 - u) * 12, 0, TAU); ctx.stroke();
        }
      }
    }
    ctx.lineCap = 'butt';
  }

  drawRings(ctx, dt) {
    const rings = this.rings;
    let w = 0;
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      r.life -= dt;
      if (r.life <= 0) continue;
      rings[w++] = r;
      const u = 1 - r.life / r.max;
      const rad = r.r0 + (r.r1 - r.r0) * (1 - (1 - u) * (1 - u));
      ctx.globalAlpha = 1 - u;
      if (r.add) ctx.globalCompositeOperation = 'lighter';
      if (r.fill) { ctx.fillStyle = r.fill; ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width;
      ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, TAU); ctx.stroke();
      if (r.add) ctx.globalCompositeOperation = 'source-over';
    }
    rings.length = w;
    ctx.globalAlpha = 1;
  }

  drawArcs(ctx, dt) {
    if (this.quality < 2) { this.drawArcsBatched(ctx, dt); return; }
    const arcs = this.arcs;
    let w = 0;
    ctx.lineJoin = 'round';
    for (let i = 0; i < arcs.length; i++) {
      const a = arcs[i];
      a.life -= dt;
      if (a.life <= 0) continue;
      arcs[w++] = a;
      const pts = a.pts;
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let k = 2; k < pts.length; k += 2) {
        const x0 = pts[k - 2], y0 = pts[k - 1], x1 = pts[k], y1 = pts[k + 1];
        const len = Math.hypot(x1 - x0, y1 - y0) || 1;
        const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
        const segs = Math.max(2, Math.min(6, Math.round(len / 20)));
        for (let j = 1; j < segs; j++) {
          const t = j / segs, off = (Math.random() - 0.5) * (a.smite ? 24 : 15);
          ctx.lineTo(x0 + (x1 - x0) * t + nx * off, y0 + (y1 - y0) * t + ny * off);
        }
        ctx.lineTo(x1, y1);
      }
      ctx.globalAlpha = Math.min(1, (a.life / a.max) * 1.6);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = a.smite ? 'rgba(220,180,255,0.85)' : 'rgba(176,107,255,0.75)';
      ctx.lineWidth = a.smite ? 10 : 7;
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = a.smite ? 3.5 : 2;
      ctx.stroke();
    }
    arcs.length = w;
    ctx.globalAlpha = 1;
    ctx.lineJoin = 'miter';
  }

  // The crowd version: arcs grouped by kind and by three fade levels, two strokes per group.
  drawArcsBatched(ctx, dt) {
    const arcs = this.arcs;
    let w = 0;
    for (let i = 0; i < arcs.length; i++) { const a = arcs[i]; a.life -= dt; if (a.life > 0) arcs[w++] = a; }
    arcs.length = w;
    if (!w) return;
    ctx.lineJoin = 'round';
    for (let smite = 0; smite < 2; smite++) {
      for (let lv = 1; lv <= 3; lv++) {
        ctx.beginPath(); let any = false;
        for (let i = 0; i < w; i++) {
          const a = arcs[i];
          if ((a.smite ? 1 : 0) !== smite || Math.min(3, Math.max(1, Math.ceil(Math.min(1, (a.life / a.max) * 1.6) * 3))) !== lv) continue;
          any = true;
          const pts = a.pts;
          ctx.moveTo(pts[0], pts[1]);
          for (let k = 2; k < pts.length; k += 2) {
            const x0 = pts[k - 2], y0 = pts[k - 1], x1 = pts[k], y1 = pts[k + 1];
            const len = Math.hypot(x1 - x0, y1 - y0) || 1;
            const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
            const segs = Math.max(2, Math.min(4, Math.round(len / 24)));
            for (let j = 1; j < segs; j++) {
              const t = j / segs, off = (Math.random() - 0.5) * (smite ? 24 : 15);
              ctx.lineTo(x0 + (x1 - x0) * t + nx * off, y0 + (y1 - y0) * t + ny * off);
            }
            ctx.lineTo(x1, y1);
          }
        }
        if (!any) continue;
        ctx.globalAlpha = lv / 3;
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = smite ? 'rgba(220,180,255,0.85)' : 'rgba(176,107,255,0.75)';
        ctx.lineWidth = smite ? 10 : 7;
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = smite ? 3.5 : 2;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.lineJoin = 'miter';
  }

  // Vertical light pillars for thunderbolts and capstone upgrades.
  drawPillars(ctx, dt) {
    const bs = this.bolts;
    let w = 0;
    for (let i = 0; i < bs.length; i++) {
      const b = bs[i];
      b.life -= dt;
      if (b.life <= 0) continue;
      bs[w++] = b;
      const a = b.life / b.max;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.fillStyle = b.color || '#ffe9a8';
      ctx.fillRect(b.x - 14 * a, 0, 28 * a, b.y);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x - 5 * a, 0, 10 * a, b.y);
      ctx.globalCompositeOperation = 'source-over';
    }
    bs.length = w;
    ctx.globalAlpha = 1;
  }

  drawTexts(ctx, dt) {
    const texts = this.texts;
    let w = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      t.life -= dt;
      if (t.life <= 0) continue;
      texts[w++] = t;
      const u = 1 - t.life / t.max;
      ctx.globalAlpha = Math.min(1, t.life * 3);
      // pop in, then drift up
      const sc = u < 0.12 ? 0.6 + (u / 0.12) * 0.6 : 1.2 - Math.min(0.2, (u - 0.12) * 1.5);
      ctx.font = `800 ${Math.round(t.size * sc)}px ${FONT}`;
      const y = t.y - u * t.rise;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.5;
      ctx.strokeText(t.str, t.x, y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, y);
    }
    texts.length = w;
    ctx.globalAlpha = 1;
    ctx.lineJoin = 'miter';
  }

  drawPlacement(ctx, ui) {
    if (!ui.placing || !ui.mouse.inside) return;
    const def = TOWERS[ui.placing];
    const { x, y } = ui.mouse;
    if (def.onPath) { this.drawSnarePlacement(ctx, ui, def); return; }
    const ok = this.game.canPlace(ui.placing, x, y) && this.game.gold >= def.cost;
    if (def.kind === 'wander') this.wanderReach(ctx, def, x, y, def.base, ok);
    else if (def.base.global) {
      this.mapWide(ctx);
      this.rangeCircle(ctx, x, y, 26, ok);   // just the footprint
    } else this.rangeCircle(ctx, x, y, def.base.range, ok, def.base.minRange);
    ctx.globalAlpha = ok ? 0.9 : 0.5;
    drawWard(ctx, { type: ui.placing, tiers: GHOST_TIERS, x, y, id: 0 }, { ang: Math.PI * 0.15, recoil: 0, time: this.time, pulse: 0, fire: 0, tx: null, ty: null, pop: 0, id: 0, direct: true });
    ctx.globalAlpha = 1;
    if (!ok) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = INK; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9); ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9); ctx.stroke();
      ctx.strokeStyle = '#ff3d3d'; ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.lineCap = 'butt';
    }
  }

  // Placing a Snare: the road it can go on lights up, other Snares show the room they need, and
  // the Snare snaps onto the road's centre under the cursor.
  drawSnarePlacement(ctx, ui, def) {
    const g = this.game, path = g.map.path, p = this._pos || (this._pos = {});
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = MAP.pathWidth - 6; ctx.lineCap = 'round';
    ctx.setLineDash([14, 10]); ctx.lineDashOffset = -this.time * 20;
    ctx.beginPath();
    for (let d = RULES.snareFromRift; d <= path.length - RULES.snareFromGoal; d += 8) { path.posAt(d, p, 0); if (d === RULES.snareFromRift) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }
    ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
    for (const t of g.towers) if (t.def.onPath) { ctx.strokeStyle = 'rgba(255,80,80,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(t.x, t.y, RULES.snareSpacing, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    const snap = g.snapToPath(ui.mouse.x, ui.mouse.y), ok = !!snap && g.gold >= def.cost;
    const x = snap ? snap.x : ui.mouse.x, y = snap ? snap.y : ui.mouse.y;
    this.rangeCircle(ctx, x, y, Math.max(def.base.radius, 24), ok);
    ctx.globalAlpha = ok ? 0.9 : 0.5;
    drawWard(ctx, { type: ui.placing, tiers: GHOST_TIERS, x, y, id: 0 }, { ang: 0, recoil: 0, time: this.time, pulse: 0, fire: 0, tx: null, ty: null, pop: 0, id: 0, direct: true, fill: 1 });
    ctx.globalAlpha = 1;
    if (!snap) {
      ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeText('Snares go on the road', x, y - 20); ctx.fillStyle = '#ffffff'; ctx.fillText('Snares go on the road', x, y - 20);
    }
  }

  drawBossBar(ctx) {
    let boss = null;
    for (const e of this.game.enemies) if (e.def.boss && (!boss || e.dist > boss.dist)) boss = e;
    if (!boss) return;
    const w = 440, x = (W - w) / 2, y = 20;
    ctx.fillStyle = INK;
    ctx.fillRect(x - 4, y - 4, w + 8, 24);
    ctx.fillStyle = '#5a0820';
    ctx.fillRect(x, y, w, 16);
    const f = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = '#ff2d55';
    ctx.fillRect(x, y, w * f, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x, y, w * f, 5);
    if (boss.maxShield > 0 && boss.shield > 0) {
      ctx.fillStyle = '#5fe0ff';
      ctx.fillRect(x, y + 12, w * (boss.shield / boss.maxShield), 4);
    }
    ctx.font = `800 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    const cost = this.game.leakCost(boss);
    const sh = boss.shield > 0 ? `  +${Math.ceil(boss.shield)} shield` : '';
    ctx.fillText(`${boss.def.name}  ${Math.ceil(boss.hp)} / ${Math.ceil(boss.maxHp)}${sh}   (leak: -${cost} ♥)`, W / 2, y + 8.5);
  }

  // Live streak counter in the top-left corner while a streak is running.
  drawStreak(ctx) {
    const g = this.game;
    const left = RULES.streakWindow - (g.time - g.lastKill);
    if (g.streak < 10 || left <= 0) return;
    const pulse = 1 + Math.max(0, 0.25 - (g.time - g.lastKill)) * 1.2;
    ctx.save();
    ctx.translate(18, 30);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(24 * pulse)}px ${FONT}`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 5;
    const col = g.streak >= 100 ? '#ff7ae0' : g.streak >= 50 ? '#ffae2b' : '#ffe45c';
    const label = `${g.streak} STREAK`;
    ctx.strokeText(label, 0, 0);
    ctx.fillStyle = col;
    ctx.fillText(label, 0, 0);
    ctx.fillStyle = INK;
    ctx.fillRect(0, 17, 124, 7);
    ctx.fillStyle = col;
    ctx.fillRect(1.5, 18.5, 121 * (left / RULES.streakWindow), 4);
    ctx.restore();
  }

  drawBanner(ctx, dt) {
    const b = this.banner;
    if (!b) return;
    b.t -= dt;
    if (b.t <= 0) { this.banner = null; return; }
    const a = Math.min(1, b.t * 2, (b.max - b.t) * 5);
    ctx.globalAlpha = a;
    ctx.font = `900 46px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 7;
    ctx.strokeText(b.text, W / 2, 150);
    ctx.fillStyle = b.boss ? '#ff7a95' : '#fff6d8';
    ctx.fillText(b.text, W / 2, 150);
    if (b.sub) {
      ctx.font = `800 20px ${FONT}`;
      ctx.lineWidth = 5;
      ctx.strokeText(b.sub, W / 2, 190);
      ctx.fillStyle = b.boss ? '#ffd0da' : '#ffe45c';
      ctx.fillText(b.sub, W / 2, 190);
    }
    ctx.globalAlpha = 1;
  }

  drawCallout(ctx, dt) {
    const c = this.callout;
    if (!c) return;
    c.t -= dt;
    if (c.t <= 0) { this.callout = null; return; }
    const u = 1 - c.t / c.max;
    const sc = u < 0.1 ? 0.5 + u * 7 : 1.2 - Math.min(0.2, (u - 0.1) * 2);
    ctx.save();
    ctx.globalAlpha = Math.min(1, c.t * 2.5);
    ctx.translate(W / 2, 220);
    ctx.scale(sc, sc);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = `900 40px ${FONT}`;
    ctx.strokeStyle = INK; ctx.lineWidth = 8;
    ctx.strokeText(c.text, 0, 0);
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, 0, 0);
    if (c.sub) {
      ctx.font = `800 18px ${FONT}`;
      ctx.lineWidth = 5;
      ctx.strokeText(c.sub, 0, 34);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(c.sub, 0, 34);
    }
    ctx.restore();
  }
}
