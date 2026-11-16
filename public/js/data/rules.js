// Global game rules. Tweak here for balance.
export const RULES = {
  startGold: 700,
  startLives: 100,
  sellRefund: 0.75,
  towerRadius: 18,       // footprint used for placement and clicking
  towerSpacing: 38,      // minimum distance between tower centres
  maxTier: 4,            // tiers per upgrade path
  maxPaths: 2,           // a tower may invest in this many paths
  minorTierCap: 2,       // only one path may go above this tier
  waveReward: (wave) => 100 + 30 * wave,  // paid when a wave is fully cleared (wave is 1-based)
  earlyBonus: (wave) => 40 + 16 * wave,   // paid for calling the next wave while enemies remain
  // Kill streaks: kills less than streakWindow seconds apart keep a streak alive.
  // Every streakStep kills pays streakGold(streak).
  streakWindow: 1.6,
  streakStep: 25,
  streakGold: (streak) => Math.round(streak * 0.5),
};

export const TARGET_MODES = [
  { id: 'first', label: 'First' },
  { id: 'last', label: 'Last' },
  { id: 'strong', label: 'Strong' },
  { id: 'close', label: 'Close' },
];
