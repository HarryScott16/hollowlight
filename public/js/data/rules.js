// Global game rules. Tweak here for balance.
export const RULES = {
  startGold: 650,
  startLives: 150,
  sellRefund: 0.75,      // gold spent on a ward during the current wave (or before wave 1) refunds in full
  towerRadius: 18,       // footprint used for placement and clicking
  towerSpacing: 38,      // minimum distance between tower centres
  snareSpacing: 60,      // Thornlight Snares: between two on the road,
  snareFromRift: 70,     // ...and how far along the path from the Rift
  snareFromGoal: 120,    // ...and before the Heartfire
  maxTier: 5,            // tiers per upgrade path (tier 5: the capstones)
  uniqueTier5: true,     // only one of each tier 5 (per ward type and path) on the map at a time
  maxPaths: 2,           // a tower may invest in this many paths
  minorTierCap: 2,       // only one path may go above this tier
  waveReward: (wave) => 100 + 25 * wave + 40 * Math.max(0, wave - 15),  // paid when a wave is fully cleared (wave is 1-based): 2,100 by wave 40
  earlyBonus: (wave) => 40 + 16 * wave,   // paid for calling the next wave while enemies remain
  // Gold per layer broken. Full until wave 8, then it tapers as the crowds grow (0.25 at wave 16,
  // 0.07 at 30, 0.04 at 40), so 40 waves of ever bigger hordes don't flood the player with money
  // (BTD6 does the same in its late rounds). From wave 16 the clear reward grows faster instead, so
  // a player who keeps spending keeps growing. Cumulative gold: ~7k by wave 10, ~18k by 20, ~37k by
  // 30, ~62k by 40.
  popGold: (wave) => (wave <= 8 ? 1 : Math.max(0.03, (8 / wave) ** 2)),
  // Kill streaks: layers broken less than streakWindow seconds apart keep a streak alive. Streaks
  // pay no gold; they drive the pop pitch, the corner counter and a chime every streakChime pops.
  streakWindow: 1.6,
  streakChime: 250,
  // A leaked enemy costs a life per layer it still holds, but never more than this (bosses excepted:
  // a leaked boss costs everything it holds).
  maxLeak: 25,
  // Endless mode (after the campaign's last wave): leaks cost far less, so a defence that starts to
  // break bleeds lives over several waves instead of collapsing in one; a boss costs at most this.
  endlessMaxLeak: 5,
  endlessBossLeak: 40,
  // Ember Vault interest, paid on its embers at each wave clear: the vault's own rate (`growth`),
  // plus vaultHold for every wave it has been left uncashed (up to vaultHoldMax). Kills only fill a
  // vault to its cap, but interest keeps growing it up to vaultCeiling x the cap, so leaving it to
  // build is a real choice: compounding interest against the kills it no longer collects.
  vaultHold: 0.02,
  vaultHoldMax: 0.1,
  vaultCeiling: 2,
};
// A Vault's interest rate for the next wave clear (its embers grow by this much).
export function vaultRate(t) { return t.stats.growth + Math.min(RULES.vaultHoldMax, RULES.vaultHold * (t.held || 0)); }

export const TARGET_MODES = [
  { id: 'first', label: 'First' },
  { id: 'last', label: 'Last' },
  { id: 'strong', label: 'Strong' },
  { id: 'close', label: 'Close' },
];
