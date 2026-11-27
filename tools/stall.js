// Stall guard for the test tools only (bot.js, solo.js and the studies built on them). The game
// itself never times a wave out and has no pushback limit: knockbacks, drags and currents can hold
// a wave up as long as they like. A test run can't wait for ever, though, so a wave that hasn't
// cleared after max(600 s, 5x the time it took to spawn) of simulated time ends the run as
// "stalled" (its own outcome, neither a win nor a loss), and a whole run stops after RUN_CAP
// simulated seconds. The guard also reports how far the Gloom were pushed back (game.pushback).
export const WAVE_MIN = 600;      // s: no wave is called stalled before this (a slowed boss can take 300+)
export const SPAWN_MULT = 5;      // ...or before 5x its spawning time
export const SPAWN_CAP = 1800;    // s: a wave still spawning after this is stalled too
export const RUN_CAP = 30000;     // s of simulated time for a whole run (wave 150 takes ~10,000)

export function stallGuard(game) {
  let waveStart = 0, spawnEnd = null, push0 = 0;
  const g = {
    stalled: false, reason: '', pushWave: 0,
    // Call when a wave starts.
    wave() { waveStart = game.time; spawnEnd = null; push0 = game.pushback; },
    // Call after each step; true means stop: the wave (or the run) stalled.
    check() {
      const t = game.time - waveStart;
      if (spawnEnd === null && game.spawners.length === 0) spawnEnd = t;
      g.pushWave = game.pushback - push0;
      if (game.time > RUN_CAP) return g.stop(`run passed ${RUN_CAP} s of game time`);
      if (spawnEnd === null) return t > SPAWN_CAP ? g.stop(`still spawning after ${SPAWN_CAP} s`) : false;
      const limit = Math.max(WAVE_MIN, SPAWN_MULT * spawnEnd);
      return t > limit ? g.stop(`not cleared after ${Math.round(t)} s (limit ${Math.round(limit)} s); ${game.enemies.length} enemies left, pushed back ${Math.round(g.pushWave)} px this wave`) : false;
    },
    stop(reason) { g.stalled = true; g.reason = reason; return true; },
  };
  return g;
}
