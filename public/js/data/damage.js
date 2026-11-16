// Damage types. Enemies carry per-type multipliers in data/enemies.js (`mult`).
export const DAMAGE_TYPES = {
  kinetic: { name: 'Kinetic', color: '#ffe9a8' },
  blast: { name: 'Blast', color: '#ff9a4a' },
  arcane: { name: 'Arcane', color: '#9fd8ff' },
  frost: { name: 'Frost', color: '#aef0ff' },
  blight: { name: 'Blight', color: '#b6e34f' },
};

// Shields soak damage before health. Multiplier applied to damage dealt to shields.
export const SHIELD_MULT = { arcane: 2, blight: 0 };
