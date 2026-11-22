// Difficulties. Medium is the game as it was tuned and must stay exactly as it is: every Medium
// lever below is the identity (x1, the rules' own gold and lives).
//
// The levers, and why these:
//   startGold / startLives  the first waves and the margin for mistakes (what a new player feels)
//   tough(wave)             health of the tough Gloom (shells, hulks, flyers, bosses; basic layers
//                           stay one-hit): the main dial for how hard the late campaign pushes, and
//                           it ramps, so Hard's early waves stay fair while its long night bites
//   count(wave)             how many Gloom a wave sends (the gaps shrink to keep each wave's length)
//   reward                  gold for clearing a wave (Easy pays a little more so a medium build
//                           can afford its tier 3s and 4s in time)
//   bossLeak                the most lives a boss that gets through can cost (on Medium: all it
//                           holds). On Easy a slipped boss hurts but doesn't end the run, so a
//                           light defence gets past the first boss and on into the teens
//   maxLeak                 the most lives any other enemy that gets through can cost (Medium: 25)
// Prices, the waves themselves and leak costs (but for Easy's caps) are the same on every
// difficulty, so what a player learns (what counters what, what a ward costs) carries over.
import { RULES } from './rules.js';

export const DIFFICULTIES = {
  easy: {
    id: 'easy', name: 'Easy',
    desc: 'More gold and lives, softer Gloom. For learning the wards.',
    startGold: 850, startLives: 250, count: () => 0.7, reward: 1.15, bossLeak: 40, maxLeak: 10,
    tough: (wave) => (wave <= 10 ? 0.65 : 0.75),
  },
  medium: {
    id: 'medium', name: 'Medium',
    desc: 'The game as it was meant to be played. A full defence wins.',
    startGold: RULES.startGold, startLives: RULES.startLives, count: () => 1, reward: 1,
    tough: () => 1,
  },
  hard: {
    id: 'hard', name: 'Hard',
    desc: 'Fewer lives, more and tougher Gloom. Every gold piece counts.',
    startGold: 600, startLives: 100, count: (wave) => (wave <= 10 ? 1 : 1.15), reward: 1,
    tough: (wave) => 1 + Math.max(0, wave - 10) * 0.045,   // x1 to wave 10, rising to x2.35 by wave 40 (the long night)
  },
};
export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];
export function difficultyById(id) { return DIFFICULTIES[id] || DIFFICULTIES.medium; }
