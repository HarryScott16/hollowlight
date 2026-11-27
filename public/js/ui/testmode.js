// Test mode, for checking art and effects quickly: unlimited gold and lives, and a way to jump to
// any wave. It lives entirely in the UI layer: the simulation, the bots and balance never see it.
//
// Turn it on with ?test=1 in the URL, or Shift+T and confirm (never on the public site: site.js).
// It stays on until the page is reloaded without ?test=1. While it's on, a TEST MODE panel sits in
// the bottom-left corner, and the best endless wave isn't recorded.
//   [ / ]   previous / next wave        Shift+]   ten waves ahead
import { PUBLIC } from '../site.js';

const GOLD = 1000000, LIVES = 1000000;

// Test mode is for development only: the public site never allows it.
export const TEST_ALLOWED = !PUBLIC;
export function testFromQuery(search) { return TEST_ALLOWED && /[?&]test=(1|true|on)\b/i.test(search || ''); }

export class TestMode {
  constructor(ui) {
    this.ui = ui;
    this.on = false;
    this.input = null;
  }

  enable() {
    if (this.on || !TEST_ALLOWED) return;
    this.on = true;
    this.ui.renderer.enableStateCheck();   // canvas state leaks are logged to the console while testing
    this.topUp();
    this.buildPanel();
    this.ui.renderer.text(560, 70, 'TEST MODE: unlimited gold and lives', '#ffffff', 18, 2, 10);
  }

  // Gold and lives never run out (topped up every frame, so even a boss leak can't end the run).
  topUp() {
    const g = this.ui.game;
    if (g.gold < GOLD / 2) g.gold = GOLD;
    g.lives = LIVES;
    if (g.over === 'lose') g.over = null;
  }

  update() {
    if (!this.on) return;
    this.topUp();
    const n = this.ui.game.wave;
    if (this.input && document.activeElement !== this.input && this.input.value !== String(n || 1)) this.input.value = String(n || 1);
  }

  // Clears the field and starts wave n (1-based). Past the campaign, it switches to endless waves.
  jump(n) {
    const g = this.ui.game;
    n = Math.max(1, Math.min(999, Math.floor(Number(n)) || 1));
    g.enemies.length = 0; g.spawners.length = 0; g.projectiles.length = 0;
    g.zones.length = 0; g.pending.length = 0; g.barrages.length = 0; g.strikes.length = 0; g.wisps.length = 0; g.candles.length = 0;
    if (n > g.totalWaves) g.endless = true;
    g.over = null;
    g.wave = g.rewarded = n - 1;
    this.ui.renderer.clearFx();
    g.startWave();
    this.ui.refreshPreview();
  }

  // Keys while test mode is on. Returns true if it handled the key.
  key(k) {
    if (!this.on) return false;
    const w = this.ui.game.wave;
    if (k === ']') this.jump(w + 1);
    else if (k === '}') this.jump(w + 10);
    else if (k === '[') this.jump(w - 1);
    else return false;
    return true;
  }

  buildPanel() {
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
    const panel = el('div', 'test-panel');
    panel.append(el('b', 'test-label', 'TEST MODE'), el('span', 'test-note', '∞ gold · ∞ lives'));
    const input = el('input', 'test-wave');
    input.type = 'number'; input.min = '1'; input.max = '999'; input.value = String(this.ui.game.wave || 1);
    input.title = 'Wave to jump to';
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { this.jump(input.value); input.blur(); } });
    const btn = (label, title, fn) => { const b = el('button', 'test-btn', label); b.type = 'button'; b.title = title; b.addEventListener('click', fn); return b; };
    panel.append(
      el('span', 'test-note', 'Wave'), input,
      btn('Go', 'Start this wave now', () => this.jump(input.value)),
      btn('−1', 'Previous wave ( [ )', () => this.jump(this.ui.game.wave - 1)),
      btn('+1', 'Next wave ( ] )', () => this.jump(this.ui.game.wave + 1)),
      btn('+10', 'Ten waves ahead ( Shift+] )', () => this.jump(this.ui.game.wave + 10)),
    );
    document.body.append(panel);
    this.input = input;
  }
}
