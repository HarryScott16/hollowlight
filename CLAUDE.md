# Hollowlight (tower defence)

Canvas game, no dependencies and no build step. `npm start` serves `public/` on :3001.
Checks: `node tools/smoke.js` (browser code against a stub DOM), `node tools/bot.js` (balance).
Test mode for checking art: `?test=1` or Shift+T (unlimited gold and lives, wave jumping; `ui/testmode.js`).
It lives only in the UI layer and must never touch the simulation, the bots or balance.

## Art rules

The ward design system is in `docs/visual-design-system.md`; the code is in
`public/js/render/wardArt.js` and `public/js/render/wards/`.

- **Two complete skins, always.** Kindlings (`wards/kindlings.js`) is the active skin, and
  Lanterns (`wards/lanterns.js`) is a fully maintained second skin. Every ward, tier, path,
  projectile and effect must be drawn in **both** skins, now and for every future change. Never add
  or change art in only one skin. If something truly can't differ between skins (a shared
  projectile or effect), put it in shared code so both skins get it.
- The Longeye in the Kindlings skin is the Lantern body with a Kindling eye (`longeyeArt` in
  `lanterns.js`, reused by `kindlings.js`).
- Wards are upright (three-quarter view) and stay within the height cap: about 32 px for a base
  ward and at most 48 px for a tier 4, so they never hide the enemies behind them. Leave visual
  room above tier 4 for a future tier 5: put tier 4 drama in effects (projectiles, flames, beams,
  auras), not height.
- One channel per fact: role = silhouette, damage type = signature colour + glyph
  (`DMG` in `wards/kit.js`, also used for projectiles, effects and damage numbers), tier = notches
  on the plinth, path = shape (Might / Many / Craft). **No path colours on the battlefield:** they
  appear only in the upgrade panel.
- Switch skins for testing with `?skin=lantern` / `?skin=kindling` or the hidden `L` key.
- Before committing ward art, run `node tools/wards.mjs`: it renders every ward in both skins and
  fails if a skin is missing a ward or a ward breaks the height cap. `node tools/frame.mjs` renders
  real game frames in both skins. Both need `@napi-rs/canvas` from outside the game (see the
  header of `tools/wards.mjs`); never add it to `package.json`.
- Art changes must not change balance or gameplay: the renderer reads the simulation, never the
  other way round.
