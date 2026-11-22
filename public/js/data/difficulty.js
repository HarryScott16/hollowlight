// Difficulties. Medium is the game as it was tuned and must stay exactly as it is: every Medium
// lever below is the identity (x1, the rules' own gold and lives).
//
// The levers, and why these:
//   startGold / startLives  the first waves and the margin for mistakes (what a new player feels)
//   tough(wave)             health of the tough Gloom (shells, hulks, flyers, bosses; basic layers
//                           stay one-hit): the main dial for how hard the late campaign pushes, and
//                           it ramps, so Hard's early waves stay fair while its long night bites
//   count                   how many Gloom a wave sends (the gaps shrink to keep each wave's length)
//   reward                  gold for clearing a wave (Easy pays a little more so a medium build
//                           can afford its tier 3s and 4s in time)
// Prices, the waves themselves and leak costs are the same on every difficulty, so what a player
// learns (what counters what, what a ward costs) carries over.
import { RULES } from './rules.js';

export const DIFFICULTIES = {
  easy: {
    id: 'easy', name: 'Easy',
    desc: 'More gold and lives, softer Gloom. For learning the wards.',
    startGold: 850, startLives: 200, count: 0.9, reward: 1.15,
    tough: (wave) => (wave <= 10 ? 0.9 : 0.8),
  },
  medium: {
    id: 'medium', name: 'Medium',
    desc: 'The game as it was meant to be played. A full defence wins.',
    startGold: RULES.startGold, startLives: RULES.startLives, count: 1, reward: 1,
    tough: () => 1,
  },
  hard: {
    id: 'hard', name: 'Hard',
    desc: 'Fewer lives, more and tougher Gloom. Every gold piece counts.',
    startGold: 600, startLives: 100, count: 1.1, reward: 1,
    tough: (wave) => 1.1 + Math.min(0.3, Math.max(0, wave - 10) * 0.01),   // x1.1, rising to x1.4 by wave 40
  },
};
export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];
export function difficultyById(id) { return DIFFICULTIES[id] || DIFFICULTIES.medium; }
