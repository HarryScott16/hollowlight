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
  waveReward: (wave) => 100 + 25 * wave,  // paid when a wave is fully cleared (wave is 1-based)
  earlyBonus: (wave) => 40 + 16 * wave,   // paid for calling the next wave while enemies remain
  // Kill streaks: layers broken less than streakWindow seconds apart keep a streak alive.
  // Every streakStep pops pays streakGold(streak): about +10% income for a defence that never lets up.
  streakWindow: 1.6,
  streakStep: 50,
  streakGold: (streak) => 5 + Math.floor(streak / 500),
};

export const TARGET_MODES = [
  { id: 'first', label: 'First' },
  { id: 'last', label: 'Last' },
  { id: 'strong', label: 'Strong' },
  { id: 'close', label: 'Close' },
];
