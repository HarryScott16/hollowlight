# Concept render scripts

Headless renders for the ward readability study ([../../visual-design-system.md](../../visual-design-system.md)). These are documentation tools, not game code: nothing here is imported by the game, and the game's `package.json` is unchanged. The scripts import the game's real art (`public/js/render/towerArt.js`, `enemyArt.js`) and data, read-only.

## Run

You need [`@napi-rs/canvas`](https://www.npmjs.com/package/@napi-rs/canvas), a prebuilt Skia canvas for Node that is far lighter than a headless browser, and a TTF font for labels. Install both outside the game:

```sh
mkdir -p ~/scratch/rnd && (cd ~/scratch/rnd && npm init -y >/dev/null && npm i @napi-rs/canvas@0.1.65)
mkdir -p ~/scratch/fonts && curl -sSLf -o ~/scratch/fonts/DejaVuSans.ttf https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf \
  && curl -sSLf -o ~/scratch/fonts/DejaVuSans-Bold.ttf https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf
CANVAS_MODULES=~/scratch/rnd/node_modules FONT_DIR=~/scratch/fonts sh docs/concepts/_src/render-all.sh
```

A full run takes a minute or two and uses well under 200 MB.

## Files

| Script | Writes |
|---|---|
| `render-current.mjs` | `current/*.png`: the game's art as it is today, plus `blend-pairs.png` |
| `render-directions.mjs` | `{lanterns,kindlings,waystones}/*.png`, and prints the blend metric for each |
| `render-compare.mjs` | `comparison*.png`, `system-sheet.png`, `*/tier-ladder.png` |
| `render-new.mjs` | `lanterns/new-wards.png`, `lanterns/lineup-12.png` |
| `render-palette.mjs` | `palette-cvd.png`, and prints colour-blind ΔE tables |
| `render-crowd.mjs` | `crowd-test.png`, and prints heights and occlusion numbers |
| `render-ideas.mjs` | `kindlings/ideas/*.png`: all 13 new-ward ideas in the Kindlings style |
| `render-chosen.mjs` | `chosen/*.png`: the four chosen wards in both skins, the Wandering Light attack sheets and the lineup |
| `render-progression.mjs` | `progression/*.png`: the proposed upgrade progression on the Bolt Ward, both skins (`dir-bolt-progression.mjs`) |

Library files:
- `sheet.mjs`: canvas, labels, turf, greyscale, silhouette and blur
- `wardsheets.mjs`: the standard sheets
- `metrics.mjs`: the blend metric
- `kit.mjs`: the design system's palette, glyphs and helpers
- `dir-kindlings-ideas.mjs`, `dir-lanterns-new.mjs`, `dir-chosen.mjs`: the new-ward mock-ups (`dir-chosen.mjs` also draws the Wandering Light attacks)
- `dir-*.mjs`: one draw function per direction, with the same signature as the game's `drawTower(ctx, type, tiers, st)`
