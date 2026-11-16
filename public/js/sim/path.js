// Path geometry and the runtime map (path samples + build-blocking terrain). No DOM access.
import { RULES } from '../data/rules.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Rounds the corners of a waypoint polyline, then resamples it at a fixed step so that
// "distance along the path" -> position is an O(1) lookup.
export function buildPath(waypoints, cornerRadius, step = 4) {
  const raw = [];
  const n = waypoints.length;
  for (let i = 0; i < n; i++) {
    const p1 = waypoints[i];
    if (i === 0 || i === n - 1 || cornerRadius <= 0) { raw.push(p1); continue; }
    const p0 = waypoints[i - 1], p2 = waypoints[i + 1];
    const d1 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]);
    const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const r = Math.min(cornerRadius, d1 / 2, d2 / 2);
    const ax = p1[0] + ((p0[0] - p1[0]) / d1) * r, ay = p1[1] + ((p0[1] - p1[1]) / d1) * r;
    const bx = p1[0] + ((p2[0] - p1[0]) / d2) * r, by = p1[1] + ((p2[1] - p1[1]) / d2) * r;
    for (let k = 0; k <= 10; k++) {
      const t = k / 10, u = 1 - t;
      raw.push([u * u * ax + 2 * u * t * p1[0] + t * t * bx, u * u * ay + 2 * u * t * p1[1] + t * t * by]);
    }
  }

  const xs = [raw[0][0]], ys = [raw[0][1]];
  let need = step;
  for (let i = 1; i < raw.length; i++) {
    let x0 = raw[i - 1][0], y0 = raw[i - 1][1];
    const x1 = raw[i][0], y1 = raw[i][1];
    let seg = Math.hypot(x1 - x0, y1 - y0);
    while (seg >= need) {
      const t = need / seg;
      x0 += (x1 - x0) * t; y0 += (y1 - y0) * t;
      xs.push(x0); ys.push(y0);
      seg -= need;
      need = step;
    }
    need -= seg;
  }

  const count = xs.length;
  const length = (count - 1) * step;
  return {
    xs: Float32Array.from(xs), ys: Float32Array.from(ys), count, step, length,
    // Writes x, y, ang onto `out`. `off` shifts sideways from the centre line.
    posAt(d, out, off = 0) {
      const f = Math.max(0, Math.min(length - 0.001, d)) / step;
      const i = Math.floor(f), t = f - i;
      const x0 = this.xs[i], y0 = this.ys[i], x1 = this.xs[i + 1], y1 = this.ys[i + 1];
      const ang = Math.atan2(y1 - y0, x1 - x0);
      out.x = x0 + (x1 - x0) * t - Math.sin(ang) * off;
      out.y = y0 + (y1 - y0) * t + Math.cos(ang) * off;
      out.ang = ang;
      return out;
    },
    distTo(x, y) {
      let best = Infinity;
      for (let i = 0; i < count; i++) {
        const dx = this.xs[i] - x, dy = this.ys[i] - y, d = dx * dx + dy * dy;
        if (d < best) best = d;
      }
      return Math.sqrt(best);
    },
  };
}

export function buildMap(data) {
  const path = buildPath(data.waypoints, data.cornerRadius);
  const rand = mulberry32(data.seed);
  const inPond = (x, y, pad) => data.ponds.some((p) => ((x - p.x) / (p.rx + pad)) ** 2 + ((y - p.y) / (p.ry + pad)) ** 2 < 1);
  const nearRock = (x, y, pad) => data.rocks.some((r) => Math.hypot(x - r.x, y - r.y) < r.r + pad);

  // Deterministic scatter of trees (block building) kept clear of the path's edge.
  const trees = [];
  for (let tries = 0; tries < 4000 && trees.length < data.treeCount; tries++) {
    const x = 20 + rand() * (data.width - 40), y = 20 + rand() * (data.height - 40);
    const r = 13 + rand() * 7;
    if (path.distTo(x, y) < 72) continue;
    if (inPond(x, y, 24) || nearRock(x, y, 26)) continue;
    if (Math.hypot(x - data.goal.x, y - data.goal.y) < data.goal.r + 40) continue;
    if (trees.some((t) => Math.hypot(t.x - x, t.y - y) < 46)) continue;
    trees.push({ x, y, r, rot: rand() * 6.28 });
  }

  const pad = RULES.towerRadius - 2;
  return {
    data, path, trees,
    width: data.width, height: data.height,
    // Terrain-only check (other towers are checked by the game).
    buildable(x, y) {
      if (x < 22 || y < 22 || x > data.width - 22 || y > data.height - 22) return false;
      if (path.distTo(x, y) < data.pathWidth / 2 + pad) return false;
      if (inPond(x, y, pad - 2) || nearRock(x, y, pad)) return false;
      if (Math.hypot(x - data.goal.x, y - data.goal.y) < data.goal.r + pad) return false;
      if (trees.some((t) => Math.hypot(t.x - x, t.y - y) < t.r * 0.7 + pad)) return false;
      return true;
    },
  };
}
