// What this browser remembers: the best wave per map and difficulty, the last map and difficulty
// played (for the Play button), and the skin. All in localStorage; every read and write is guarded
// (private windows and blocked storage just remember nothing).
const KEY = 'hollowlight.records';

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ }
}

// { wave, won } for a map and difficulty (wave 0 if never played).
export function bestFor(map, diff) {
  const all = load(KEY, {});
  return all[`${map}|${diff}`] || { wave: 0, won: false };
}
// Records reaching `wave` (and a campaign win). Returns true if it's a new best.
export function recordWave(map, diff, wave, won = false) {
  const all = load(KEY, {}), k = `${map}|${diff}`, cur = all[k] || { wave: 0, won: false };
  if (wave <= cur.wave && (!won || cur.won)) return false;
  all[k] = { wave: Math.max(wave, cur.wave), won: cur.won || won };
  save(KEY, all);
  return wave > cur.wave;
}

export function lastChoice() { return load('hollowlight.last', { map: 'hollowmere', difficulty: 'medium' }); }
export function saveChoice(map, difficulty) { save('hollowlight.last', { map, difficulty }); }
export function savedSkin() { return load('hollowlight.skin', null); }
export function saveSkin(skin) { save('hollowlight.skin', skin); }
