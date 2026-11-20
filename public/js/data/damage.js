// Damage types. Enemies carry per-type multipliers in data/enemies.js (`mult`).
// Colours are the colour-blind-checked signature hues from the ward design system
// (docs/visual-design-system.md), shared by wards, projectiles, effects and damage numbers.
export const DAMAGE_TYPES = {
  kinetic: { name: 'Kinetic', color: '#e9eef6' },
  blast: { name: 'Blast', color: '#ff9a1f' },
  arcane: { name: 'Arcane', color: '#b06bff' },
  frost: { name: 'Frost', color: '#52e6ff' },
  fire: { name: 'Fire', color: '#ff4433' },
  radiant: { name: 'Radiant', color: '#ffe03a' },
};

// Shields soak damage before health. Multiplier applied to damage dealt to shields.
export const SHIELD_MULT = { arcane: 2 };
