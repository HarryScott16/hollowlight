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
- Wards are upright (three-quarter view) and grow with every tier on their main path, so a tier 4
  is clearly bigger and more imposing than a tier 0 (about x1.35). Height caps (checked by
  `tools/wards.mjs`): about 46 px for a base ward, 68 px for a tier 4. Enemies behind a ward show
  through it as outlined ghosts (`Renderer.drawGhosts`), so size never hides them. Leave visual room
  above tier 4 for a future tier 5.
- Each ward is coloured and dressed for its role and damage type in both skins (e.g. the Censer is
  ember-orange and charred, the Rime frosted blue with icicles), with idle life (breathing,
  flicker, sparks), and must stay instantly distinguishable from every other ward.
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
