# Hollowlight (tower defence)

Canvas game, no dependencies and no build step. `npm start` serves `public/` on :3001.

## Live site: never touch it without "ship it"

Hollowlight is public at https://snake.reasonwave.ai (for now, until it has its own domain),
served on :3000 from **`~/projects/td-live`**, a worktree of this repo on branch `live`, with
`HOLLOWLIGHT_PUBLIC=1` (test mode off). Development is here in `~/projects/td` on `master`, on :3001.
- **Never edit, commit in, or merge into `~/projects/td-live`** (or the `live` branch) unless Harry
  says **"ship it"**. If you're running inside `td-live`, stop and work in `~/projects/td` instead.
- "Ship it", the CSP rules, public mode and how to put the Snake game back: `docs/live-site.md`.
- The public site has a strict CSP (`server.js` sends the same kind): no inline scripts or styles,
  no `style=` attributes or `on...=` handlers, no eval, nothing from other sites.
Checks: `node tools/smoke.js` (browser code against a stub DOM; it also places every ward by click, drag
and key through the real UI handlers, takes every path to tier 5, checks the one-of-each limit, and
uses its R action and ability), `node tools/bot.js` (balance; `--endless --cap=120` keeps going into
endless; the `endless12` builds are for that), `node tools/tier5.js` (each tier 5 against its tier 4),
`node tools/endless.js` (the endless health curve), `node tools/report.js` (power per gold by tier).
Canvas state: the renderer can check, after every frame section, that the game canvas is back to its
plain state (no save() left open, no clip, alpha 1, normal blend, no line dash); it's on in test mode
(leaks are logged as `[Hollowlight] canvas state leak in ...` and repaired) and in `smoke.js` (which
fails on any). `tools/canvascheck.mjs` (real canvas, like frame.mjs) also flags calls a browser throws
on (a negative arc/ellipse radius, drawing a zero-sized canvas): one of those ends the frame early, so
everything drawn after it (the lower half of the map) stops updating. Art helpers clamp radii (`circle`),
and a ward whose drawing fails only loses that ward (`Renderer.artError`). The frame loop in `main.js` guards the simulation, interface and drawing
separately: an error is logged as `[Hollowlight] error in the ...` and counted in
`window.hollowlight.frameErrors`, and the loop keeps running (smoke.js fails on any).
Test mode for checking art: `?test=1` or Shift+T (unlimited gold and lives, wave jumping; `ui/testmode.js`).
It is off on the public site (`js/site.js` says `PUBLIC`; the live server serves its own copy).
Keys: wards 1-9, 0, -, = (shop order); Q W E upgrade; U the upgrade tree (`ui/tree.js`: of the selected
ward, or the one placed/hovered in the shop; right-click a shop ward too); R the selected ward's action (cash out an Ember
Vault, move a Wandering Light's post); abilities A S D F G H J K, then Z C V B; X the Flare.
It lives only in the UI layer and must never touch the simulation, the bots or balance.

## Maps, difficulties and menus

- Maps live in `data/maps.js` (Hollowmere, Ashfork, Rimecoil, Mirefen; `MAP_ORDER`). A map has one or
  more `routes` (a road from its own Rift plus the flyers' line); with several, the Gloom take turns
  and what they shed stays on its road (`e.route`). Anything that works along the road (Snares,
  Flashmines, Ball Lightning, Phoenix, Elder Wyrm) uses the nearest road (`map.nearestRoute`). A map
  may add `tough(wave)` to even out its late game. Looks: `theme` in `render/background.js`.
  `tools/maps.mjs` renders every map and prints its road and flight lengths and build space.
- Difficulties live in `data/difficulty.js`. **Medium must stay exactly as it is**: every Medium lever
  is the identity, and bot results on Hollowmere Medium must not change. Easy and Hard use start gold,
  lives, enemy toughness, wave size and the clear reward. Hard's campaign is **60 waves** (`campaign`):
  waves 41-60 are `HARD_WAVES` in `data/waves.js` (themed stretches, the Bastion and Veilmother at 50,
  The Last Dark at 60); endless starts after a difficulty's last wave (`game.waves`, `totalWaves`).
- `Game.load(map, difficulty)`; the bot takes `--map=` and `--diff=`, and perf.mjs / canvascheck.mjs
  take `map=`.
- Menus: `ui/menu.js` (title -> Play -> map select -> difficulty -> game; a returning player also
  gets a smaller "Continue: map, difficulty" shortcut; settings, pause), records in `ui/records.js`
  (best wave per map and difficulty, last choice, skin; test runs never count). `?map=`,
  `?difficulty=` and `?test=1` skip the menus; `?skin=` wins over the saved skin.

## Targeting and economy

- "Strong" ranks enemies by kind (`rank` = total layers, `pops()`: boss > colossus > hulk > shells...),
  then by how far along the road they are (`strongScore` in `sim/enemies.js`), never by health left.
- Ember Vault interest (`RULES.vaultHold`, `vaultHoldMax`, `vaultCeiling`; `vaultRate`): its `growth`
  plus 2% per wave left uncashed (max +10%), paid at each wave clear, and it can grow the bank to 2x
  the cap (kills only fill to the cap). Cashing out resets the bonus.
- A Wandering Light has an anchor stone at its post (`Renderer.drawAnchors`, shared by both skins);
  clicking it selects the ward (`UI.wardAt` checks anchors first, then the lights).

## Tier 5

Every path has a fifth tier, a capstone: about 4.5x its tier 4's cost, 3-5x its power, and one
signature mechanic each (`docs/tier5-design.md`; research in `docs/tier5-research.md`). Only one of
each tier 5 may stand on the map (`RULES.uniqueTier5`, checked in `upgradeInfo`). The data is the
`TIER5` block at the end of `data/towers.js`. Art: a tier 5 is drawn as its skin's tier 4 form
(`artPath`: `P.mt` 4, `P.t5` set), grown x1.5, plus the shared second form in `render/wards/ascend.js`
(both skins get it, with their own materials); height cap 104 px. Tier 5 effects on the map are in
`Renderer.drawTier5` and the fx cases marked "tier 5 signatures".

## Endless

`sim/endless.js`: a health budget per wave that picks up from wave 40 and grows 5.5% a wave to 60,
7% to 80 and 8% after (speed capped at x1.7). The mix rotates through five stretches every 5 waves,
and a modifier switches on every 5 waves from 45 to 90. Above the spawn cap, groups are thinned
evenly and tough enemies carry the lost health. Leaks cost at most 5 lives per enemy in endless (40 per
boss; the campaign keeps 25 and uncapped bosses: `RULES.endlessMaxLeak`), so a breaking defence bleeds
lives over several waves. `node tools/endless.js` prints the curve.

## Layout

- The selected ward's upgrade panel replaces the shop and wave preview in the side column
  (`#side.ward-open`), so it never gets squeezed; deselect (Esc or ×) brings the shop back. Only
  usable abilities take room. The side column widens into the width a short (laptop) screen
  leaves beside the height-limited map. Compact rules: `max-width` 1240/980 (top bar) and
  `max-height` 760/600/520 (side column) in `css/style.css`. Target sizes: 1366x768, 1280x720,
  1536x864, and 125%/150% Windows scaling (CSS viewport = screen / scale, minus ~135 px of
  taskbar and browser bars).

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
  `tools/wards.mjs`): about 46 px for a base ward, 68 px for a tier 4, 104 px for a tier 5 (x1.5).
  Enemies behind a ward show through it as outlined ghosts (`Renderer.drawGhosts`), so size never
  hides them. A tier 5's second form is a big silhouette framing the ward from behind (wings, a vortex,
  a sunburst, a glacier, a dragon: `wards/ascend.js`; the benchmarks are Starhost, Phoenix, Elder Wyrm
  and Eye of the Storm), and its diadem is the only pure white on an idle ward. On this machine run `tools/wards.mjs` in groups of
  four wards (`node tools/wards.mjs out.png bolt mortar rime coil`): all twelve at once runs out of
  memory.
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
