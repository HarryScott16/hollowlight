// The upgrade tree: every path of a ward, every tier up to tier 5, each with its one-line description
// and cost, marked owned / next / later / locked by the path rules. Opened from the upgrade panel
// (for a placed ward: what it owns, and a click on a "next" tier buys it) or from the shop (right-click
// a ward, its "Upgrade tree" button, or U; nothing owned yet). The game holds while it's open.
import { TOWERS } from '../data/towers.js';
import { RULES } from '../data/rules.js';
import { DAMAGE_TYPES } from '../data/damage.js';
import { upgradeInfo } from '../sim/towers.js';
import { drawWardIcon } from '../render/wardArt.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

const LOCKED = {
  paths: 'Locked: two other paths are taken',
  cap: 'Locked: another path is past tier 2',
  unique: 'Locked: another {ward} has this tier 5',
};
const STATE_LABEL = { owned: 'Owned', next: 'Next', later: 'Later', locked: 'Locked' };

export class UpgradeTree {
  constructor(ui) {
    this.ui = ui;
    this.root = document.getElementById('tree');
    this.type = null;
    this.tower = null;
    this.root.addEventListener('pointerdown', (ev) => { if (ev.target === this.root) this.close(); });
  }

  get open() { return !this.root.hidden; }

  // Opens the tree of a placed ward (`tower`) or of a ward type from the shop.
  show(type, tower = null) {
    if (!type || !TOWERS[type]) return;
    if (!this.open) {
      this.wasPaused = this.ui.paused;
      if (!this.ui.paused && !this.ui.game.over) this.ui.togglePause();
    }
    this.type = type;
    this.tower = tower;
    this.build();
    this.root.hidden = false;
  }
  close() {
    if (!this.open) return;
    this.root.hidden = true;
    if (this.ui.paused && !this.wasPaused) this.ui.togglePause();
    this.tower = null;
  }

  // What a tier (0-based k on path pi) is to this ward right now, and why if it's locked.
  stateOf(pi, k) {
    const t = this.tower, game = this.ui.game;
    const others = (o) => o.type === this.type && o !== t && o.tiers[pi] >= RULES.maxTier;
    if (!t) {
      if (k === RULES.maxTier - 1 && RULES.uniqueTier5 && game.towers.some(others)) return { state: 'locked', reason: 'unique' };
      return { state: k === 0 ? 'next' : 'later' };
    }
    const cur = t.tiers[pi];
    if (k < cur) return { state: 'owned' };
    if (k === cur) {
      const info = upgradeInfo(t, pi);
      return info.ok ? { state: 'next', cost: info.cost } : { state: 'locked', reason: info.reason };
    }
    // A later tier: locked if a rule already stands in its way.
    if (cur === 0 && t.tiers.filter((n) => n > 0).length >= RULES.maxPaths) return { state: 'locked', reason: 'paths' };
    if (k + 1 > RULES.minorTierCap && t.tiers.some((n, i) => i !== pi && n > RULES.minorTierCap)) return { state: 'locked', reason: 'cap' };
    if (k === RULES.maxTier - 1 && RULES.uniqueTier5 && game.towers.some(others)) return { state: 'locked', reason: 'unique' };
    return { state: 'later' };
  }

  cost(pi, k) {
    const up = TOWERS[this.type].paths[pi].tiers[k], d = this.tower && this.tower.disc;
    return k < 4 && d ? Math.round((up.cost * (1 - d)) / 5) * 5 : up.cost;
  }

  build() {
    const def = TOWERS[this.type], t = this.tower, game = this.ui.game;
    const r = this.root;
    r.textContent = '';
    const card = el('div', 'tree-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', `${def.name} upgrade tree`);

    const head = el('div', 'tree-head');
    const icon = document.createElement('canvas');
    icon.width = icon.height = 96; icon.className = 'tree-icon';
    drawWardIcon(icon, this.type, t ? t.tiers : undefined);
    const titles = el('div', 'tree-titles');
    const dt = DAMAGE_TYPES[def.base.type];
    titles.append(el('h2', null, `${def.name}: upgrade tree`), el('div', 'tree-role', `${def.role}${dt ? ` · ${dt.name} damage` : ''} · ${t ? `this ward: tiers ${t.tiers.join(' / ')}` : `not placed yet · costs ${def.cost}`}`));
    const close = el('button', 'tree-close', '×');
    close.type = 'button'; close.title = 'Close (Esc or U)';
    close.addEventListener('click', () => this.close());
    head.append(icon, titles, close);

    const rules = el('p', 'tree-rules', `Rules: up to ${RULES.maxPaths} paths per ward · only one of them past tier ${RULES.minorTierCap} · each tier 5 only once on the map.${t ? ' Click a Next tier to buy it.' : ''}`);
    const legend = el('div', 'tree-legend');
    for (const s of ['owned', 'next', 'later', 'locked']) legend.append(el('span', `tree-key ${s}`, STATE_LABEL[s]));

    const cols = el('div', 'tree-cols');
    def.paths.forEach((path, pi) => {
      const col = el('section', `tree-path p${pi}`);
      const ph = el('div', 'tree-path-head');
      ph.append(el('span', 'tree-path-name', path.name), el('span', 'tree-path-key', t ? `[${'QWE'[pi]}]` : ''));
      col.append(ph, el('div', 'tree-path-blurb', path.blurb));
      path.tiers.forEach((up, k) => {
        const st = this.stateOf(pi, k), cost = st.cost ?? this.cost(pi, k);
        const tier = el(st.state === 'next' && t ? 'button' : 'div', `tree-tier ${st.state}${k === RULES.maxTier - 1 ? ' t5' : ''}`);
        if (tier.tagName === 'BUTTON') tier.type = 'button';
        tier.title = up.desc;
        const top = el('div', 'tree-tier-top');
        const costEl = el('span', 'tree-cost', st.state === 'owned' ? '✓' : String(cost));
        if (st.state !== 'owned' && game.gold < cost) costEl.classList.add('poor');
        top.append(el('span', 'tree-tier-name', `T${k + 1}  ${up.name}`), costEl);
        tier.append(top, el('div', 'tree-blurb', up.blurb));
        if (st.state === 'locked') tier.append(el('div', 'tree-lock', LOCKED[st.reason].replace('{ward}', def.name)));
        else if (st.state !== 'owned') tier.append(el('div', 'tree-note', st.state === 'next' ? 'Next' : 'Later'));
        if (tier.tagName === 'BUTTON') {
          tier.addEventListener('click', () => {
            if (!this.tower) return;
            this.ui.buyUpgrade(pi);
            this.build();
          });
        }
        col.append(tier);
      });
      cols.append(col);
    });
    card.append(head, rules, legend, cols);
    r.append(card);
  }
}
