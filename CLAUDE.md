# Hollowlight (tower defence)

Canvas game, no dependencies and no build step. `npm start` serves `public/` on :3001.
Checks: `node tools/smoke.js` (browser code against a stub DOM), `node tools/bot.js` (balance).
Test mode for checking art: `?test=1` or Shift+T (unlimited gold and lives, wave jumping; `ui/testmode.js`).
Keys: wards 1-9, 0, -, = (shop order); Q W E upgrade; R the selected ward's action (cash out an Ember
Vault, move a Wandering Light's post); abilities A S D F G H J K, then Z C V B; X the Flare.
It lives only in the UI layer and must never touch the simulation, the bots or balance.

## Performance

- The FPS overlay (`` ` ``) shows ms per frame for the simulation, enemies, wards, the see-through
  ghosts, effects, particles, ground and overlay, plus counts. `node tools/perf.mjs wave=80 speed=5
  mode=normal|test defence=few|full` profiles a stress scene headless (same breakdown, plus canvas
  calls per section; `CALLS=1` lists them by method). Its milliseconds come from a software canvas:
  compare runs and canvas-call counts, not milliseconds against a browser.
- In a browser the cost is mostly the number of canvas calls. Keep per-enemy and per-particle work
  to a few calls: cached sprites and overlays, one setTransform per enemy, batched health bars and
  particles, no per-frame gradients, shadowBlur or filters.
- Quality scales with the crowd (`Renderer.quality`: 2 full, 1 crowd, 0 huge crowd, with
  hysteresis): fewer small overlays, particles, rings, stains and flame, and no decorative ward
  idle details. Wards redraw their live layer into a per-ward canvas every 2nd frame (4th or 6th in
  crowds). In crowds an enemy's body, cracks and veil are baked into one image (`combo` in
  `enemyArt.js`), and burning zones and Coil arcs are batched. `perf.mjs` also takes `STATES=1`
  (enemy states) and `SECTION=enemies,ground,...` (calls by method per section). The simulation has an 8 ms per-frame budget at high speed (see `main.js`).

## Art rules

The ward design system is in `docs/visual-design-system.md`; the code is in
`public/js/render/wardArt.js` and `public/js/render/wards/` (`kindlings.js` and `lanterns.js` hold
every ward for each skin; `bolt-parts.js` and `parts.js` hold props both skins share).

- **Two complete skins, always.** Kindlings (`wards/kindlings.js`) is the active skin, and
  Lanterns (`wards/lanterns.js`) is a fully maintained second skin. Every ward, tier, path,
  projectile and effect must be drawn in **both** skins, now and for every future change. Never add
  or change art in only one skin. If something truly can't differ between skins (a shared
  projectile or effect), put it in shared code so both skins get it.
- The Longeye in the Kindlings skin is the Lantern body with a Kindling eye (`longeyeArt` in
  `lanterns.js`, reused by `kindlings.js`). The Thornlight Snare's grate is shared too (`snareArt`
  in `parts.js`): each skin supplies only what looks up out of it.
- Twelve wards. The Snare is `flat` (drawn with the ground, before enemies, no ghosts); the
  Wandering Light `float`s (no plinth: a hovering rune-disc carries its notches) and a Swarm's
  extra lights are drawn as wards of their own (`Renderer.lightWard`).
- Wards are upright (three-quarter view) and grow with every tier on their main path, so a tier 4
  is clearly bigger and more imposing than a tier 0 (about x1.35). Height caps (checked by
  `tools/wards.mjs`): about 46 px for a base ward, 68 px for a tier 4. Enemies behind a ward show
  through it as outlined ghosts (`Renderer.drawGhosts`), so size never hides them. Leave visual room
  above tier 4 for a future tier 5.
- Each ward is coloured and dressed for its role and damage type in both skins (e.g. the Censer is
  ember-orange and charred, the Rime frosted blue with icicles), with idle life (breathing,
  flicker, sparks), and must stay instantly distinguishable from every other ward.
- **A ward's body and face are never covered by its gear**, at any tier, path or aim angle. Big
  gear sits beside the body and swings behind it when pointing across it (`gearInFront` in
  `wards/kit.js`), and the face is drawn last. Every ward declares its body box (`self`), and
  `tools/wards.mjs` fails if live gear covers more than 30% of it. Upgrades follow the framework in
  `docs/upgrade-visuals-research.md` (distinct path forms by tier 3, an impressive tier 4).
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
