// Global game rules. Tweak here for balance.
export const RULES = {
  startGold: 650,
  startLives: 150,
  sellRefund: 0.75,      // gold spent on a ward during the current wave (or before wave 1) refunds in full
  towerRadius: 18,       // footprint used for placement and clicking
  towerSpacing: 38,      // minimum distance between tower centres
  maxTier: 4,            // tiers per upgrade path
  maxPaths: 2,           // a tower may invest in this many paths
  minorTierCap: 2,       // only one path may go above this tier
  waveReward: (wave) => Math.min(350, 100 + 25 * wave),  // paid when a wave is fully cleared (wave is 1-based)
  earlyBonus: (wave) => 40 + 16 * wave,   // paid for calling the next wave while enemies remain
  // Gold per layer broken. Full until wave 8, then it tapers as the crowds grow (0.25 at wave 16,
  // 0.07 at 30, 0.04 at 40), so 40 waves of ever bigger hordes don't flood the player with money
  // (BTD6 does the same in its late rounds). Cumulative gold: ~7k by wave 10, ~16k by 20,
  // ~26k by 30, ~38k by 40: a few tier 4s for a strong defence, not a full set.
  popGold: (wave) => (wave <= 8 ? 1 : Math.max(0.03, (8 / wave) ** 2)),
  // Kill streaks: layers broken less than streakWindow seconds apart keep a streak alive. Streaks
  // pay no gold; they drive the pop pitch, the corner counter and a chime every streakChime pops.
  streakWindow: 1.6,
  streakChime: 250,
};

export const TARGET_MODES = [
  { id: 'first', label: 'First' },
  { id: 'last', label: 'Last' },
  { id: 'strong', label: 'Strong' },
  { id: 'close', label: 'Close' },
];
