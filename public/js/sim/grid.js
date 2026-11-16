// Uniform spatial grid for fast "enemies near a point" queries. Rebuilt every step.
export class Grid {
  constructor(width, height, cell = 64, margin = 128) {
    this.cell = cell;
    this.margin = margin;
    this.cols = Math.ceil((width + margin * 2) / cell);
    this.rows = Math.ceil((height + margin * 2) / cell);
    this.cells = Array.from({ length: this.cols * this.rows }, () => []);
  }

  clear() {
    for (const c of this.cells) c.length = 0;
  }

  _cx(x) { return Math.max(0, Math.min(this.cols - 1, Math.floor((x + this.margin) / this.cell))); }
  _cy(y) { return Math.max(0, Math.min(this.rows - 1, Math.floor((y + this.margin) / this.cell))); }

  insert(e) {
    this.cells[this._cy(e.y) * this.cols + this._cx(e.x)].push(e);
  }

  // Fills `out` with every living enemy whose centre is within r of (x, y).
  query(x, y, r, out) {
    out.length = 0;
    const x0 = this._cx(x - r), x1 = this._cx(x + r), y0 = this._cy(y - r), y1 = this._cy(y + r);
    const r2 = r * r;
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const cell = this.cells[cy * this.cols + cx];
        for (let i = 0; i < cell.length; i++) {
          const e = cell[i];
          if (!e.alive) continue;
          const dx = e.x - x, dy = e.y - y;
          if (dx * dx + dy * dy <= r2) out.push(e);
        }
      }
    }
    return out;
  }
}
