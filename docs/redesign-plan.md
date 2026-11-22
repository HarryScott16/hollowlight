# Update: endless leak cap, and `tier5` merged into `master`

- **Endless leaks cost less.** After wave 40 a leak costs at most **5 lives per enemy** (was 25) and
  a boss at most **40** (was everything it held). The campaign is unchanged. The boss bar's leak cost
  shows the capped figure.
- **Bot results** (seed 1, `--endless --cap=130`):
  - `strong12` now loses its lives over waves 98-105, out on **105** (was 98-103).
  - `endless12` loses them over waves 91-102, out on **102** (was 91-93).
  - Defences bleed over 8-12 waves instead of collapsing in 2-3.
- **`tier5` is merged into `master`** (fast-forward). Work continues on `master`.

---

# Morning summary: tier 5 performance and art (`tier5` branch, second night)

Everything is on **`tier5`** in four new commits (`b7409aa`, `edc426a`, `89a08cb`, and this doc).
Nothing is merged. The one-tier-5-per-path rule is unchanged.

## Performance

### What I found

**The simulation (6.5 ms a step in your browser).** I reproduced it headless: 690 enemies against 35
tier 5 wards at wave 250 took 6.1 ms a step. Profiling showed three hot spots, all fixed with
**identical results**. Bot runs match to the last gold coin and every boss kill time.

1. **Herald auras: the single biggest cost.**
   - Every Herald scanned every enemy near it, every step. The endless "escorts" modifier puts dozens
     of Heralds in a dense crowd.
   - Now each enemy checks only the Heralds near it and stops at the first one in reach. The result is
     the same.
2. **Target picking sorted everyone in range** for wards that take several targets (8-bolt volleys,
   12 beams, 5 lights).
   - Now it keeps a short best-first list.
   - Ties come out in the same order as the stable sort they replace.
3. **Hidden-class churn.**
   - Tier 5 code added fields to enemies, wards and bolts after they were created (`snareAt`,
     `magmaT`, `doomT`, `markSrc`, `phx`, and so on). Each kind of object ended up with many different
     shapes, which made property access slow everywhere.
   - Now every enemy, ward, bolt and shell is created with every field it will ever have.

**Result: 6.08 → 1.10 ms a step (5.5x).** `node tools/simbench.mjs` reproduces the scene, and
`node --cpu-prof` with `tools/cpuprof.mjs` profiles it.

**The untracked ~12 ms of "effects".** The overlay's effects figure also included the event pass,
the flame simulation, the Prism beams and the snow, without listing them.
- The overlay now **breaks effects down fully**: events, flame sim, beams, shots, flames, rings,
  tier 5 and snow. I also moved the tier 5 map effects (orbs, phoenix, Lightweb threads, Doomed eyes)
  out of the "enemies" figure.
- **I couldn't pin down that 12 ms headless.** A software canvas doesn't behave like a GPU one, and
  every one of those sections is small here (beams 1.4 ms, events 0.2 ms).
- I cut everything there that costs in a GPU canvas or creates garbage (your worst frame, 52 ms,
  looks like a garbage-collection pause):
  - **Beams and rings:** drawn in a few blend-mode passes. Before, each beam or additive ring switched
    `globalCompositeOperation` itself, which can force a flush on a GPU canvas.
  - **Snow:** batched.
  - **Ring objects and common particle options:** reused instead of allocated.
  - **Small hit sparks in crowds:** fewer.
- **If effects is still high, please send a screenshot of the new overlay line.** It will name the
  culprit.

**Enemy drawing.**
- **Status marks are cached frames.** A tier 5 defence leaves nearly every enemy burning, Scorched,
  marked and Charged at once, and each mark was drawn as paths and dashed rings. Now each is one of a
  few cached frames (one `drawImage`).
- **Huge crowds draw less.** They skip small enemies' health bars, flyer shadows and small-enemy hit
  flashes. Stun stars are cached.
- **Mortar shells are cached sprites.** A Grand Battery keeps dozens in the air.
- **Quality follows the whole load.** It now counts wards and shots as well as enemies. Before, a big
  tier 5 defence that had thinned a wave out drew everything at full detail.

### Before and after (`tools/perf.mjs`, software canvas, 2x speed, 35 tier 5 wards)

"Before" is last night's tip (`8b8a778`) with today's measuring tools.

| Scene | Before | After |
|---|---|---|
| Simulation, 690 enemies (`simbench.mjs`, ms per step) | 6.08 | **1.10** |
| Wave 250, crowd of ~765: simulation ms/frame | 11.6 | **2.5** |
| Wave 250, crowd: enemy canvas calls/frame | 4,543 | **2,499** |
| Wave 250, crowd: all canvas calls/frame | 10,043 | **7,369** |
| Wave 250, crowd: wall ms/frame (software) | 137.9 | **116.0** |
| Wave 100: all canvas calls/frame | 13,872 | **6,621** |
| Wave 100: ward canvas calls/frame | 5,056 | **1,669** |
| Wave 100: wall ms/frame (software) | 104.8 | **77.5** |

Commands:
- `perf.mjs wave=100 speed=2 defence=t5 wards=35`
- `perf.mjs wave=250 speed=2 defence=t5 wards=35 crowd=600` (waves overlap to hold a crowd)

Software-canvas milliseconds are dominated by pixel fill, which a GPU does for nearly free. Compare
the canvas calls, and the simulation, which is plain JavaScript.

**What I expect in your browser at wave 253** (you measured 40.5 ms):
- simulation 11.7 → about 2.5 ms;
- enemies 8.7 → about 5 ms;
- effects: unknown until the new overlay line shows what it is.

That should land around **40-50 fps at wave 250**, short of or just at the 45 target, depending on
effects. Wave 100 should be much closer to 60: the simulation there is under 1 ms, and the frame now
has half the canvas calls. **I can't promise 60 / 45 without a real browser.** Please check the
overlay (`) at waves 100 and 250 with a full tier 5 defence.

## Tier 5 art

**Size.** Tier 5s now grow ×1.5 (tier 4: ×1.35), with the height cap raised from 76 to 104 px. Enemies
behind them show through as ghosts.

**Shape.** Every second form is now a large silhouette framing the ward from behind, the way your
benchmarks did (Starhost, Phoenix, Elder Wyrm, Eye of the Storm), in both skins. The body-and-face
rule holds for all 36 (`tools/wards.mjs`).

- **Rime Spire (reworked first):**
  - **Permafrost:** an ice cathedral of seven spires glowing from inside, snowflakes orbiting it,
    frost motes rising.
  - **Avalanche:** a turning ice mandala, with boulders and ice blades tumbling round the ward.
  - **Whiteout:** a blizzard vortex of spiralling snow under a great storm cloud, with a snowflake
    at its eye.
- **Prism:**
  - **Second Sun (reworked):** a whole second sun rising behind the prism, its corona flaring and
    small worlds circling it.
  - **Dawnbreaker:** a bigger sun-disc with long turning spear-rays.
  - **Lightweb:** a ring of eight crystal nodes woven with threads of light.
- **Bolt Ward:**
  - **Worldpiercer:** a towering siege gantry with turning winches, a colossal glowing lance on top.
  - **Thousand Bolts:** a great double wheel of crossbows.
  - **Wild Hunt:** a spirit-hawk with two pairs of spread wings, marks circling.
- **Mortar Kiln:**
  - **Worldbreaker:** a molten mountain with circling rubble.
  - **Grand Battery:** a fan of four great guns.
  - **Magma Heart:** a volcano with a lava fountain and a fire lake.
- **Storm Coil:**
  - **Stormlord:** a storm-cloud crown, lightning forking to tall rods.
  - **Ball Lightning:** big spheres with arcs between them.
  - **Eye of the Storm:** three counter-turning vortex rings.
- **Longeye:**
  - **Kingslayer:** a colossal spectral rifle and a crowned standard.
  - **Shrapnel Storm:** flak drums and a ring of shrapnel.
  - **Eye of Fate:** a great eye ringed with runes.
- **Ember Censer:**
  - **Phoenix:** double wings of fire.
  - **Elder Wyrm:** a bigger dragon with smoke.
  - **Pall of Ash:** a towering ash column with embers.
- **Beacon:**
  - **Anthem of War:** a great war drum with rolling sound rings and battle standards.
  - **Worldlight:** a lighthouse tower whose twin beams sweep the ground.
  - **Golden Age:** a golden sunburst and laurel, with coins circling.
- **Thornlight Snare:** wider rings of briars, constellation stars and seals (it still lies flat on
  the road).
- **Moth Lantern:**
  - **False Moon:** a great haloed moon.
  - **Amber Trap:** two amber drops on a crooked branch.
  - **Moth Queen:** a great eyed moth.
- **Wandering Light:**
  - **Falling Sky:** a crescent of stars and falling stars.
  - **Starhost:** a seven-star constellation ring.
  - **Dawnbringer:** a rose sunrise between two tall torches.
- **Ember Vault:**
  - **Dragon's Hoard:** a gold dragon with spread wings on the hoard.
  - **Ember Tide:** an ember whirlpool.
  - **Second Heartfire:** a great heart-flame crowned with fire.

**In crowds**, each second form is drawn as one cached still image, so the extra art costs almost
nothing when it matters.

## Please look at

- The **overlay at waves 100 and 250** with a full tier 5 defence, especially the new effects
  breakdown line.
- **The new tier 5s in play**, in both skins (`L` switches). The weakest now, I think:
  - Shrapnel Storm's drums;
  - the Worldlight beams, which sweep flat along the ground and read as a line.
- **Whether 104 px is too tall** when several tier 5s stand together. It's one number:
  `GROW[5]` in `render/wardArt.js`, plus the form sizes.

## Decisions I made

- **No behaviour changes in the performance work.** Every simulation change is exact, which the bot
  results confirm. The only visual losses are in huge crowds (quality 0): no health bars on small
  enemies, no flyer shadows, no small-enemy hit flashes, and fewer small hit sparks. Beams now
  flicker together rather than per Prism.
- **The quality level now counts the whole load:** enemies + 4 per ward + 1.5 per shot. So a big
  defence drops to "crowd" detail sooner.
- **Height cap 104 px** for tier 5, as you suggested.

---

# Morning summary: tier 5 and endless (`tier5` branch)

Everything is on the **`tier5`** branch, which comes off `master` in steps, for you to review before
merging. Nothing was merged or pushed (there's no remote). Port 3000 and `~/projects/test-game`
weren't touched.

Docs:
- `docs/tier5-research.md`: BTD6 and five other games; cost, power, limits, feel, look and endless.
- `docs/tier5-design.md`: all 36 tier 5s, plus the rules.
- `CLAUDE.md`: new "Tier 5" and "Endless" sections.

## Part 1: tier 5

**The rules** (research-backed, details in `tier5-design.md`):
- **Cost:** about 4.5x the path's tier 4, 16,000-22,500 gold.
- **Power:** about 3-5x the tier 4, plus one signature mechanic each. That is never just bigger
  numbers: new attack forms, map-wide reach, companions, buffs to other wards, a last-stand save,
  or economy.
- **Limit:** only one of each tier 5 on the map (per ward type and path), BTD6's rule. The UI says
  so, and clicking the locked button selects the ward that holds it.
- **Crosspath:** unchanged (one path to 5, a second to 2).
- **Abilities:** unchanged. Tier 5 stats feed into them.

**The 36:**

| Ward | Tier 5s |
|---|---|
| Bolt Ward | Worldpiercer, Thousand Bolts, Wild Hunt |
| Mortar Kiln | Worldbreaker, Grand Battery, Magma Heart |
| Rime Spire | Permafrost, Avalanche, Whiteout |
| Storm Coil | Stormlord, Ball Lightning, Eye of the Storm |
| Longeye | Kingslayer, Shrapnel Storm, Eye of Fate |
| Ember Censer | Phoenix, Elder Wyrm, Pall of Ash |
| Prism | Dawnbreaker, Lightweb, Second Sun |
| Beacon | Anthem of War, Worldlight, Golden Age |
| Thornlight Snare | Thornwall, Constellation, Seal of Dawn |
| Moth Lantern | False Moon, Amber Trap, Moth Queen |
| Wandering Light | Falling Sky, Starhost, Dawnbringer |
| Ember Vault | Dragon's Hoard, Ember Tide, Second Heartfire |

Each has:
- a one-line identity (the path blurb style);
- a qualitative blurb, with exact numbers on hover or Shift;
- full art in **both** skins;
- a signature effect on the map.

**Art:**
- A tier 5 is the skin's tier 4 form plus a **second form**. That's a companion, summon or apparatus
  beside or behind the ward: the siege-engine frame and lance, the spirit-hawk, the falling
  mountain, the glacier, storm crowns, the dragon's head, a second sun, a false moon, the Moth Queen,
  a hoard with a little gold dragon, and so on.
- It also gets a bright tier 5 ground sigil, and a five-point diadem with a white-hot core, the only
  pure white on an idle ward.
- Each skin passes its own materials (bronze, wood and wax vs iron, brass and glass). The code is in
  `render/wards/ascend.js`, shared like the other props.
- Wards grow x1.4 with a 76 px cap. `tools/wards.mjs` checks every tier 5 in both skins: **all
  pass**, heights and the body-and-face rule.

**Feel:**
- A fifth (gold diamond) pip.
- The tier 5 button gets a gold frame and a "gold saved" bar.
- On purchase:
  - a white pillar and a pillar in the ward's colour;
  - a wide shockwave;
  - rising motes;
  - a fanfare;
  - its name across the screen ("WORLDPIERCER · Tier 5 · Bolt Ward").

**Checks:**
- `smoke.js` takes every path of every ward to tier 5 through the real UI (click, drag, key, both
  skins) and checks the one-of-each limit. It passes.
- `tools/tier5.js` measures each tier 5 against its tier 4 on the same late wave. At wave 75 most are
  2.5-6x. I trimmed the outliers: Second Sun was 48x, Whiteout 15x.
- `report.js` has a tier 5 column.
- Test mode needed no changes. It's UI-only, so the limit applies there too.

## Part 2: endless

**The problem:**
- Wave 41 had **86% more health** than wave 40.
- Health then grew **17-20% a wave**.
- Speed went to x1.74 at 55 and x2.4 at 70.
- The old strong 12-ward bot hit a wall at **wave 57**: 150 lives to 0 in one wave, with 52k gold
  unspent.

**Now** (`sim/endless.js`; `node tools/endless.js` prints the curve):
- **Health budget.** Each wave has one that **picks up where wave 40 leaves off**. It grows **5.5% a
  wave to 60** (time to buy tier 5s), **7% to 80**, then **8%**, whatever the mix.
- **Toughness** grows only 2% a wave. Most of the growth is more enemies. Basic layers stay at 10 HP.
- **Speed** creeps up and is **capped at x1.7**.
- **Variety:**
  - Five **stretches** rotate every 5 waves (horde, black sky, iron and hide, swarm, siege), each
    with a banner.
  - A **modifier** switches on every 5 waves from 45 to 90. They alternate between ones that change
    the waves (Veiled hulks, shadows, escorts, a Veiled sky, swarms) and ones that make them harder
    (mending, swift +10%, armoured shells +50%, twin bosses, frenzy +10%).
- **Numbers.**
  - The spawn cap rises from 450 to 600.
  - Above it, groups are thinned evenly and the tough enemies carry the health that was thinned
    away. Before, everything was promoted into colossi: wave 75 was all Veiled colossi.

**Bot results, endless** (seed 1, `node tools/bot.js <build> --endless --cap=130 -v`):

| Build | Wards | Tier 5s at the end | First tier 5 | First endless leak | Lost on wave |
|---|---|---|---|---|---|
| strong12 (the old 57) | 18 | 12 | 63 | 98 | **103** |
| strong12B | 18 | 9 | 62 | 87 | **92** |
| endless12 (26 wards, second wards on other paths) | 26 | 9 | 73 | 91 | **93** |
| endless12B | 26 | 7 | 73 | 91 | **92** |
| strong12 **without tier 5s** (`--no-t5`) | 18 | 0 | - | 77 | **79** |

- **Strong defences now reach the low 90s to about 100.** Tier 5s are worth about 24 waves to the
  same build (79 vs 103).
- **Signs come first.** The furthest any enemy gets ("deepest") creeps from about 80% to 100% over
  5-8 waves before lives start to go.
- **The end is still quick.** The last 150 lives go over 2-6 waves. A leak costs up to 25 lives per
  enemy, so once the line breaks it breaks fast. That's much more gradual than one wave, but tell me
  if you'd like it slower (a lower leak cap in endless would do it).
- The bot builds its first tier 5 only around wave 62-73. It fills its wards to tier 4 first and saves
  for a tier 5 only when it's about a wave and a half away. A human who saves earlier would get
  further.

## Balance: the campaign (Medium)

**The Medium targets hold.** Full suite, seed 1, compared with `master`:
- **Every strong build wins with 150/150**: strong, strongAlt, strongThird, strongTithe, newA/B/C,
  strong12/B/C, endless12/B, original4.
- **Medium builds still struggle:**
  - mixed12 wins with 75/150 (unchanged);
  - mixed wins only with Last Light;
  - mixedAlt and focused lose at 38-39 (was 39).
- **Lazy builds lose at waves 9-10** (unchanged).
- **Ban-one probes all win**, as before.

In the campaign, the bots never reach a tier 5: they finish their tier 4s first. A player who saves
can afford one around waves 33-38. That matches "mostly late campaign and endless".

| Build | Group | Result | First leak |
|---|---|---|---|
| lazy / minimal / lazyTier1 | lazy | lost on wave 9 / 9 / 10 | 6 / 5 / 9 |
| mixed | reasonable | won, 150/150 (Last Light used) | never |
| mixedAlt / focused | reasonable | lost on wave 38 / 39 | 37 / 38 |
| mixed12 | reasonable | won, 75/150 (Last Light used) | 40 |
| plateau / plateauAlt | plateau | lost on wave 40 / won, 110/150 (was 150) | 40 / 37 |
| strong, strongAlt, strongThird, strongTithe | strong | won, 150/150 | never |
| newA, newB, newC, original4 | strong / probe | won, 150/150 | never |
| strong12, strong12B, strong12C | strong | won, 150/150 | never |
| endless12, endless12B | endless | won, 150/150 | never |
| spamNoUpgrades / noDetection / groundOnly / prismOnly | probe | lost on wave 31 / 20 / 12 / 4 | 30 / 20 / 9 / 3 |
| no-bolt / no-mortar / no-rime | ban | won, 106 / 146 / 124 (of 150) | 10 / 13 / 5 |
| other ban-one probes, noMortarCrowd | ban | won, 150/150 | never |

The two small changes come from merging overlapping fire pools: plateauAlt now loses 40 lives, and
mixedAlt loses one wave earlier. Both are within those builds' targets: plateau builds should lose
lives late.

## Performance (`tools/perf.mjs`, 5x speed, canvas calls per frame)

| Scene | Calls | Enemies on screen |
|---|---|---|
| Wave 80, full tier 4 defence (old endless) | 7,532 | 583 |
| Wave 80, full tier 4 defence (new endless) | 5,628 | 234 |
| Wave 100, full tier 4 defence (new endless) | 5,430 | 367 |
| Wave 80, tier 5 defence (new endless) | 9,474 | 58 (full quality) |
| Wave 100, tier 5 defence (new endless) | 10,889 | 196 |

- **The new endless waves are cheaper to draw:** fewer, more varied enemies.
- **A tier 5 defence costs more:** its effects, and Starhost's five lights each drawn as a ward.
- **Cuts made in crowds:**
  - a tier 5's second form is one cached image;
  - overlapping fire pools from one ward merge (they never stacked damage, so balance is unchanged);
  - lure threads are capped;
  - stun stars are cached;
  - the minor effect rings are skipped.
- **Please check the real frame rate** with a big tier 5 defence late in endless (the ` overlay). If
  it's heavy, the next step is redrawing wards less often when several tier 5s stand.

## Decisions I made (easy to reverse)

- **One of each tier 5 on the map**, as in BTD6. That allows three per ward type (one per path) and
  36 in all. No sacrifices or Paragons; room is left for a tier 6.
- **Two boss capstones break the "executions skip the Heavy" habit:**
  - Wild Hunt executes marked hulks under 15% (never bosses).
  - Kingslayer's shots take 3% of a hulk's and 1.2% of a boss's full health.
  - The research suggests keeping these off hulks and bosses. I kept them because each is that
    path's whole identity. Say if you'd rather cap them.
- **Golden Age** discounts tiers 1-4 only (15%), never a tier 5.
- **Second Heartfire** is the one last-stand save: 40 embers per life when something gets through.
- **Dragon's Hoard** was trimmed (cap 20,000, +20% on big cash-outs). Combined with Windfall it was
  paying out 57k at once.
- **Diadem rather than a bigger crown.** Every tier 5 gets the same small five-point diadem over its
  crown, so it reads as tier 5 at a glance.
- **The bot:**
  - Builds main path to tier 4, then the minor path, then tier 5. Before this, strict builds stopped
    buying their minor path while they waited on an unaffordable tier 5, and lost lives at wave 25.
  - Saves for a tier 5 only when it's close.
  - New `endless12` builds and a `--no-t5` flag.

## Needs your eye

- **The second forms in play, in both skins** (`L` to switch). They're all drawn on the contact
  sheets, but a few may want polish: Anthem of War's drum hides behind the body, and Worldlight's
  beam sweeps flat across the ground.
- **The purchase moment and the gold "saved" bar** on the tier 5 button.
- **How endless feels around waves 80-100**, and whether the last lives should go more slowly.
- **The frame rate** with a big tier 5 defence (see above).

---

# Morning summary (overnight 2026-11-20 → 21)

Everything is on `redesign` in four commits (`a3356ce`, `52df143`, `bcf11b6`, `76a74df`), plus this
doc and `CLAUDE.md`. Nothing was merged. Port 3000 and `~/projects/test-game` weren't touched, and the
gallery on 3002 is still running.

## Part 1: performance (`a3356ce`)

The biggest section at waves 80 and 100 was the enemy pass, as expected (5x speed, full tier-4
defence, measured with `tools/perf.mjs`).

| Canvas calls per frame | Before | After |
|---|---|---|
| Wave 80, total | 11,061 | 7,901 |
| Wave 80, enemies | 4,590 | 2,462 |
| Wave 80, enemy ms (software canvas) | 137 | 64 |
| Wave 80, ground (burning zones) | 1,115 | 523 |
| Wave 100, total | 6,167 | 4,606 |
| Wave 100, enemies | 2,177 | 1,146 |

What changed:
- **Enemies drawn as one image.** In crowds (quality below 2), an enemy's body, cracks (four stages)
  and veil ring are baked into one cached image, and the hit flash uses baked alpha levels. At
  wave 80 almost every enemy is a veiled, cracked Colossus: that drops from 9-12 calls to 2-3.
- **No transform reset after each enemy.** The renderer resets it before each ward instead.
- **Burning zones:** one cached additive glow per zone, plus one batched path for all the rims.
- **Coil arcs in crowds:** batched by kind and fade level.
- **Ward live layers in crowds:** refresh every 4th or 6th frame (was every 3rd or 4th).
- **At full quality (normal crowd sizes), both skins draw exactly as before.**
- **`perf.mjs` fixes and new options:**
  - Per-section call counts are now attributed correctly (flyers, health bars and ghosts were
    landing in the wrong bucket).
  - "Effects" is split into shots, flames and rings.
  - New `STATES=1` and `SECTION=enemies,ground,...` diagnostics.
  - The full defence now uses all 12 wards; `WARDS=8` gives the old set.
- With 12 wards the full defence costs about the same as with 8 (8,206 vs 7,901 calls at wave 80).
- What's left is mostly health-bar `rect` calls (two per damaged enemy, batched into one fill per
  colour) and particles. Both are cheap in a browser.
- **Please check the real frame rate at wave 80** (` overlay): software-canvas milliseconds don't
  translate to a browser.

## Part 2: the four new wards (`52df143`, `bcf11b6`, `76a74df`)

All four are built as recorded in `tower-ideas.md` §0. Each has:
- 3 paths × 4 tiers, with one-line blurbs and exact numbers on hover or Shift;
- a tier 4 ability;
- full art in **both** skins, with projectiles and effects.

`tools/wards.mjs` passes for all 12 wards × 2 skins, with no height or body-and-face failures.
`tools/smoke.js` now places, upgrades and uses all 12 wards, their abilities, keys and R actions,
in both skins.

**Thornlight Snare** (200, Kinetic): the path trap.
- **Placement:** built **on the road**. It snaps to the road's centre line under the cursor. While
  you're placing it, the stretch of road it may go on lights up as a dashed lane, other Snares show
  the room they need, and "Snares go on the road" appears if the cursor is off the road.
- **Placement rules:** 60 px apart; not in the first 70 px from the Rift or the last 120 px before
  the Heartfire; other wards ignore it for spacing.
- **How it works:** it bites each enemy that steps on it once, spending a charge (20 charges,
  refilling 3/s, and fully at each wave clear). Flyers pass over it.
- **Paths:**
  - **Caltrops:** two layers per bite → armour pierce → Iron Thorns (slow) → Iron Briar.
  - **Flashmines:** mines are sown on the road upstream of it and burst underfoot → Starfield
    (16 mines that stun).
  - **Binding Light:** holds what it bites → Binding Circle (holds the crowd round it) → Lightbound
    (holds a Heavy for 1.5 s every 5 s: the game's first control answer to Heavy).
- **Ability:** Briar Bloom (Z): every Snare refills and bites for free for 8 s.
- **Drawing:** flat, with the ground, so it never hides anything.
  - **Kindlings:** a spirit peeking up through the grate.
  - **Lanterns:** a floor-lantern lens.

**Moth Lantern** (250, Radiant): lures flyers.
- **How it works:** flyers in range leave their route and circle it for a few seconds (5 at once,
  3 s). While circling, **every ward can hit them**, Mortars and Rimes included. Thin gold threads
  show who it's holding.
- **Paths:**
  - **Bright Lure:** holds more flyers → Moonlure (they take +25%) → Great Lure (40 at once).
  - **Flypaper:** released flyers are slowed → Flypaper (they stay low and hittable by everything
    for 6 s; a gold ring marks them) → Glue Trap.
  - **Moth-trap:** Radiant moths sting the flyers it holds → reveals Veiled → Thousand Moths.
- **Ability:** Lamplure (C): every flyer on the map is pulled to it.

**Wandering Light** (325, Arcane, Wandlight version): a floating caster.
- **How it works:**
  - It floats near its **post**, chasing targets within a leash (80 px).
  - It casts homing stars that burst on hit, from its wand.
  - **R** (or the panel button) lets you click a new post anywhere that isn't water.
  - When it's selected, the leash is shown as a dashed circle round a rune on the ground.
- **Paths:**
  - **Hunter:** wand → staff with a wizard's hat → comet.
  - **Swarm:** 2, then 3 lights, each casting at its own target; at tier 4 each light casts two
    stars at once.
  - **Torchbearer:** marks (+% damage taken) → a rose torch that speeds up wards near its post
    (like a Beacon; doesn't stack with Beacons).
- **Ability:** Starfall (V).

**Ember Vault** (400, Hearth, Gleaning Brazier version): economy.
- **How it works:**
  - Kills in its light add embers: half the bounty, counting at least 0.15 gold a layer so it
    still matters late.
  - Embers grow 10% each wave up to its cap (300 at base), and it stops collecting when full.
  - **R** or the panel button cashes out; selling it pays out its embers too.
  - The ember heap and the rose flame grow as it fills.
- **Paths:**
  - **Great Brazier:** cap and growth.
  - **Gleaners:** range, then Harvest Moon: embers from every kill, at half rate outside its light.
  - **Hearthwarm:** while over half full (from tier 3, a quarter full), wards in its light attack
    faster.
- **Ability:** Windfall (B): doubles its embers, up to twice the cap.

### Decisions I made (easy to reverse)

- **Keys:**
  - Wards: 1-9, 0, -, = in shop order.
  - Abilities: A S D F G H J K for the first eight wards (unchanged), Z C V B for the new four,
    X for the Flare.
  - **R** is the selected ward's action (cash out / move post). Shift+R is still restart.
  - The shop's help line lists all of this.
- **New wards come after the old eight** in the shop.
- **Snare bites are per enemy object.** A Brood that sheds on the Snare gets bitten again: "a
  layer per charge", as designed.
- **The Wandering Light's targets and leash are measured from its post.** So are Beacon and torch
  coverage, so moving a light updates the boosts.
- **Swarm's extra lights are full-size copies of the ward**, not smaller ones (simpler and clearer).
  Say if you'd like them smaller.
- **Stars stay Arcane violet on the Torchbearer path**, not rose. Only the torch is rose
  (support = Hearth), to keep one colour per damage type.
- **Mines, lure threads, stars and ember wisps are shared by both skins**, per the projectile rule.
- **No wave changes.** The new wards were already useful against the existing waves: flyers from
  wave 9, Heavies at the wave 10 boss. Light changes weren't needed, so I left the waves alone, and
  every old build's result is unchanged.

### Balance and bot results

- **Bot changes:**
  - Places Snares in the kill zone on the road, Moth Lanterns on the flight route near ground
    splash, and Vaults among the wards.
  - Values the new upgrades. A bigger Vault cap only counts once that Vault has actually filled.
  - Cashes out full Vaults.
- **New builds:** `strong12`, `strong12B`, `strong12C` (all 12 wards, three path sets),
  `mixed12` (medium), and two probes: `newWards` and `lazySnare`.
- **Tuning made along the way:**
  - **Snare damage was far too low** (1-10 dmg/gold against 50-170 for other wards). Its charges
    and refill went up, Flashmines are now sown upstream (they'd been landing where nothing was
    left alive), and the bot's estimate now matches what it actually delivers.
  - **Wandering Light was too efficient.** Hunter and Swarm reached 170-290 dmg/gold. I trimmed
    Star Staff, Comet, Wisp Swarm and Starswarm.

New builds, seeds 1 / 2 / 3:

| Build | Group | Seed 1 | Seed 2 | Seed 3 |
|---|---|---|---|---|
| strong12 | strong | won, 150/150 | won, 150/150 | won, 150/150 |
| strong12B | strong | won, 150/150 | won, 150/150 | won, 150/150 |
| strong12C | strong | won, 150/150 | won, 150/150 | won, 147/150 |
| mixed12 | medium | won, 75/150 | lost on 40 | lost on 40 |

The full suite on seed 1 (all builds, after the last change) is below. Every old build has exactly
the same result as before.

| Build | Group | Result | First leak | First / 3rd T4 |
|---|---|---|---|--- |
| lazy | lazy | lost on wave 9 | 6 | - |
| minimal | lazy | lost on wave 9 | 5 | - |
| lazyTier1 | lazy | lost on wave 10 | 9 | - |
| lazyNew | probe | lost on wave 5 | 3 | - |
| mixed | reasonable | **won**, 150/150 (Last Light used) | never | - |
| mixedAlt | reasonable | lost on wave 39 | 38 | - |
| focused | reasonable | lost on wave 39 | 38 | - |
| plateau | plateau | lost on wave 40 | 40 | 16 / 23 |
| plateauAlt | plateau | **won**, 150/150 | never | 16 / 22 |
| strong | strong | **won**, 150/150 (Last Light used) | never | 17 / 25 |
| strongAlt | strong | **won**, 150/150 | never | 17 / 24 |
| strongThird | strong | **won**, 150/150 | never | 15 / 24 |
| strongTithe | strong | **won**, 150/150 | never | 15 / 20 |
| newA | strong | **won**, 150/150 | never | 16 / 25 |
| newB | strong | **won**, 150/150 | never | 16 / 26 |
| newC | strong | **won**, 150/150 | never | 17 / 25 |
| original4 | probe | **won**, 150/150 | never | 15 / 23 |
| spamNoUpgrades | probe | lost on wave 31 | 30 | - |
| noDetection | probe | lost on wave 20 | 20 | 15 / - |
| groundOnly | probe | lost on wave 12 | 9 | - |
| prismOnly | probe | lost on wave 4 | 3 | - |
| strong12 | strong | **won**, 150/150 (Last Light used) | never | 15 / 24 |
| strong12B | strong | **won**, 150/150 | never | 15 / 25 |
| strong12C | strong | **won**, 150/150 | never | 16 / 25 |
| mixed12 | reasonable | **won**, 75/150 (Last Light used) | 40 | - |
| newWards | probe | lost on wave 10 | 10 | - |
| lazySnare | probe | lost on wave 5 | 4 | - |
| noMortarCrowd | ban | **won**, 150/150 (Last Light used) | never | 16 / 25 |
| no-bolt | ban | **won**, 99/150 (Last Light used) | 10 | 18 / 28 |
| no-mortar | ban | **won**, 146/150 (Last Light used) | 13 | 16 / 25 |
| no-rime | ban | **won**, 124/150 (Last Light used) | 5 | 14 / 24 |
| no-coil | ban | **won**, 150/150 | never | 15 / 25 |
| no-longeye | ban | **won**, 150/150 (Last Light used) | never | 15 / 24 |
| no-censer | ban | **won**, 150/150 | never | 15 / 24 |
| no-prism | ban | **won**, 150/150 | never | 15 / 24 |
| no-beacon | ban | **won**, 150/150 | never | 16 / 24 |

### Needs your eye

1. **The lazy Snare probe (2 Bolts + a Snare, never upgraded) loses on wave 5.** The real lazy
   builds still lose on 9-10.
   - A bare Snare is a supplement, not an opener, so I made this a probe rather than tuning for it.
   - A base buff (more refill) didn't rescue it and made `strong12` worse, so I reverted it.
2. **`newWards`** (the new wards favoured for every upgrade) loses at the wave 10 boss. That's
   expected for a build with no boss answer; it's a probe.
3. **Ember Vault income is modest.** Gleaners added about +2.5k gold over a 40-wave run for
   `strong12C`. If it should feel richer, raise `glean` or `cap`.
4. **Strong builds use the Last Light** in some runs (`strong12`, `strong12C`), like `strong` does.
   It's never lost lives.
5. **Art to review in both skins:**
   - the Vault keeper's apron and scarf;
   - the Moth Lantern's moth wings, and the net on Flypaper;
   - the Wandering Light's wizard hat at Hunter tier 3;
   - the Snare's tier 4 forms (Iron Briar spikes, Starfield seeds, Lightbound posts).

### What to try in test mode (`?test=1`, then `?skin=lantern` for the other skin)

1. **Placing a Snare (9):** check the dashed lane, the snap to the road, the red room circles and
   the off-road text. Take one to each tier 4 and watch the bite flash, the thorns, the Flashmines
   (and how far they reach when selected), and Lightbound holding a Dreadhulk (the chains overlay).
2. **Moth Lantern (0) by the flight route, with a Mortar next to it, from wave 9:**
   - check the circling, the threads, and the Mortar hitting flyers;
   - on Flypaper tier 3, check the gold ring on flyers it has let go;
   - use Lamplure (C).
3. **Wandering Light (-):**
   - R, then click to move its post, and watch it fly there;
   - Swarm tier 2-4 lights spreading to separate targets;
   - stars leaving the wand tip;
   - the Comet ring;
   - Starfall (V).
4. **Ember Vault (=):**
   - watch the heap and flame grow, then cash out with R (coins and gold text);
   - Hearthwarm's boost chevrons on nearby wards once it's half full;
   - Windfall (B).
5. **The FPS overlay at waves 80 and 100 with a full defence:** jump with `]`.

---

# Hollowlight redesign plan (approved 2026-11-17)

Decisions on approval:
- **One ability per ward** for now (plus Heartfire Flare), unlocked when that ward reaches tier 4 on
  any path. The per-path abilities in §3 are the target for later.
- **Damage numbers only on big hits.**
- **No difficulty settings yet** (they need a menu). The game runs at Normal: 150 lives, x1.0 prices.
  Later job: add the Easy/Hard selector described in §2.

Sources: `docs/research-btd6.md`, `docs/research-other-td.md`. Mechanics and principles are borrowed;
all names, enemies and upgrades stay Hollowlight's own.

Goal: every ward feels strong from the first shot. Lots of enemies die fast. Difficulty comes from
**more enemies and new kinds of enemies**, never from basic enemies turning into damage sponges.
After wave 10 the game can continue in an endless mode.

---

## 1. Core change: layered enemies ("shedding")

Today an enemy is one health bar that grows with every wave (wave 9's basic enemy takes ~20 Bolt hits).
New model:

- Most enemies are **stacks of thin layers**. Each layer has **10 HP**, so one base ward hit = one layer.
- When a layer breaks, the enemy **sheds** into its inner form at the same spot (some shed into 2).
  Every break pays **1 gold** and plays a pop. A hit that overkills **carries the leftover damage into
  the inner form**: a 30-damage bolt strips 3 layers at once. This makes damage upgrades visible.
- Inner forms are often **faster** than outer ones, so a wounded wave surges forward and rewards
  layered defences: one ward cracks, the next one cleans up.
- **The 10 HP per layer never scales**, not even in endless mode. Only the armoured shells, hulks
  and the boss grow tougher. Basic enemies keep dying in one hit forever.
- A **leak costs lives equal to the layers the enemy still has** (its remaining pop count). A leaked
  Mote costs 1 life, a full Dreadhulk 120.

### Enemy roster

"Pops" = total layers you break to clear it = total gold it pays = lives it costs if it leaks untouched.

| Enemy | Own HP | Speed | Sheds into | Pops | Notes |
|---|---|---|---|---|---|
| Mote | 10 | 80 | (nothing) | 1 | basic |
| Skitter | 10 | 135 | Mote | 2 | fast |
| Shambler | 10 | 70 | Skitter | 3 | slow outside, fast inside |
| Brood | 10 | 90 | 2 Shamblers | 7 | the first split; fills the screen |
| Husk (Plated) | 60 | 55 | 2 Broods | 20 | Kinetic x0.5, Blast x1.5; 1 gold per 10 HP of shell; cracks visibly as it takes damage |
| Dreadhulk | 400 | 42 | 4 Husks | 120 | mini-boss; stun/freeze immune, slows 50% effective |
| Gravemaw (boss) | 4,000 | 32 | 2 Dreadhulks | ~760 | phases: at 75 / 50 / 25% HP it bursts out 2 Husks |
| Gloomcolossus (endless only, from wave 15) | 2,000 | 36 | 2 Dreadhulks + 4 Husks | ~520 | |

**Veiled** is a modifier on any group, not a separate enemy. Veiled enemies can only be targeted by
wards that see stealth (Hunter's Mark T1, Blizzard T2, and anything inside a Blizzard spire's reveal
radius). Area damage (pulses, explosions, fire, the Flare) still hits them. Veiled is introduced at
wave 6, a small group on its own first.

The existing broodling/mite split chain is folded into Brood. Flyers stay out of the campaign; the
code hooks remain for later.

---

## 2. Economy

| | Now | Proposed |
|---|---|---|
| Start gold | 700 | **650** |
| Lives | 100 | **150** |
| Kill gold | 2-450 per enemy | **1 per layer broken** (~75% of all income) |
| Wave clear reward | 100 + 30w | **100 + 25w** (125 … 350; the floor that keeps weak players progressing) |
| Early call bonus | 40 + 16w | unchanged, and it also takes **10 s off the Flare cooldown** |
| Sell refund | 75% | **100% until the next wave starts**, 75% after |
| Streak gold | every 25 kills | unchanged, counts pops |

Projected income from the waves in §4 (perfect play):

| After wave | 1 | 3 | 5 | 7 | 9 | 10 |
|---|---|---|---|---|---|---|
| Cumulative gold | ~800 | ~1,400 | ~2,600 | ~4,900 | ~9,000 | ~11,700 |

That pays for 2 wards at the start, the first tier-3 around wave 4-5, and one or two tier-4s for the
boss.

**Difficulty settings** change prices and lives only; the enemies stay the same.
Easy: prices x0.85, 200 lives. Normal: x1.0, 150 lives. Hard: x1.1, 100 lives, no Last Light.

---

## 3. Wards

Every ward now **breaks a layer per hit at base** and hits several enemies:

| Ward | Cost | Damage | Rate | Range | Hits per attack | Base pops/s in a crowd |
|---|---|---|---|---|---|---|
| Bolt Ward | **150** (was 170) | 10 (was 12) | 1.5/s (was 1.2) | 155 | **pierce 2** (was 1) | ~3 |
| Mortar Kiln | **300** | 10 | 0.8/s | 200 (min 50) | up to **14** in a 55 radius | ~5-6 |
| Rime Spire | **225** (was 240) | **10** (was 3) | 0.8/s | 105 | **up to 30** in range, slow 35% | ~4 + slow |
| Storm Coil | **350** (was 380) | 10 | 1.0/s | 135 | **chain 5, no falloff** | ~5 |

Opening: 650 gold buys 2 Bolts + change, or Bolt + Mortar. That handles waves 1-2 with room to spare.

### Upgrade pricing and power targets

Three paths of four tiers, two paths per ward, only one above tier 2 (unchanged).

| Tier | Cost (x base ward) | Crowd power vs base | Feel |
|---|---|---|---|
| T1 | ~0.6x | ~1.7x | cheap, buyable almost every wave |
| T2 | ~1.3x | ~3x | fixes a problem (sees Veiled, cracks Plated, wider area) |
| T3 | ~5x | **~8-12x** | the spike: new attack and a new look, reachable around wave 4-5 |
| T4 | ~20x | **~40-70x** | screen-clearing, plus an **activated ability** |

Power per gold **rises** with tier: the base ward scores 1.0 by definition, T3 ~1.2-1.5, T4 ~1.6-2.2.
Today it is roughly flat or falling: Hunter's Mark and Static drop off.
`tools/report.js` gets a pops/s column, and each path must hit these targets.

### Path numbers (Normal prices)

Existing path and tier names are kept. Only the numbers and some effects change.

**Bolt Ward (150)**
| Path | T1 | T2 | T3 | T4 + ability |
|---|---|---|---|---|
| Ballista | 90: dmg 20 | 200: pierce 5, ignores 50% armour | 800: dmg 40, pierce 12, all armour, knockback | 3,200 Siege Lance: dmg 100, infinite pierce across the map, rate x1.3. **Broadside** (40 s): 12 lances in a fan |
| Twin-shot | 80: rate x1.5 | 200: 2 bolts | 750: 4 bolts, ricochet x2 | 3,000 Storm of Bolts: 8 bolts, rate x2, ricochet x3. **Overdraw** (35 s): rate x3 for 6 s |
| Hunter's Mark | 100: sees Veiled, +30 range, dmg 20 | 220: marks +30% damage taken | 650: marks spread 70 px, +45%, rate x1.3 | 2,800 Death Sentence: +75%, marked non-boss under 25% HP are executed. **Verdict** (45 s): every marked enemy sheds 5 layers |

**Mortar Kiln (300)**
| Path | T1 | T2 | T3 | T4 + ability |
|---|---|---|---|---|
| Big Shells | 120: dmg 20 | 250: radius x1.3, up to 25 hits | 900: dmg 40, stun 0.6 s, up to 40 hits | 3,600 Cataclysm: dmg 100, radius x1.45, stun 1.2 s, up to 80 hits. **Quake** (45 s): stun all ground non-boss 3 s, 300 dmg to hulks |
| Rapid Loader | 100: rate x1.5 | 220: +50 range, rate x1.3 | 850: 3 shells | 3,400 Barrage: 6 shells, rate x1.6. **Saturation** (40 s): 40 shells along the whole path |
| Cinder | 120: burn 10/s 3 s | 280: fire pool 20/s 3 s | 800: 5 bomblets, pool 40/s | 3,500 Inferno: pool 120/s 6 s, +25% damage taken inside. **Firestorm** (50 s): path in range burns 150/s for 8 s |

**Rime Spire (225)**
| Path | T1 | T2 | T3 | T4 + ability |
|---|---|---|---|---|
| Deep Freeze | 90: slow 45% | 200: slow lasts 2.5 s, +15 range | 750: every 3rd pulse freezes 1.2 s, frozen take +30% | 3,000 Absolute Zero: every 2nd pulse, 2 s, +60%. **Hoarfrost** (50 s): freeze every non-boss on the map 4 s |
| Shatter | 100: dmg 20 | 240: chilled take +25% Kinetic/Blast | 800: chilled deaths explode for 40 | 3,200 Winter's Verdict: pulse dmg 60, shatter 120 and chains. **Shardstorm** (40 s): every chilled enemy takes 100 |
| Blizzard | 80: +25 range | 200: **reveals Veiled in its range for all wards** (replaces "hits flyers") | 750: range x1.5, rate x1.4 | 2,900 Endless Winter: whole map slowed 20%. **Whiteout** (45 s): whole map slowed 60% for 6 s |

**Storm Coil (350)**
| Path | T1 | T2 | T3 | T4 + ability |
|---|---|---|---|---|
| Overcharge | 120: dmg 20 | 300: dmg 30, chain 6 | 950: dmg 60, x2 vs hulks and the boss | 3,800 Smite: dmg 120, every 3rd strike is a thunderbolt x5 with area and stun. **Tempest** (45 s): 12 thunderbolts on the strongest enemies |
| Forking | 110: chain 8 | 280: chain 12, +40 jump range | 900: 2 forks | 3,600 Maelstrom: 4 forks x 20 chain, rate x1.4. **Arc Storm** (45 s): for 8 s every strike hits everything in range |
| Static | 100: rate x1.4 | 280: 15% stun chance (0.4 s) | 850: struck take +30% Arcane, 20% slower | 3,400 Ion Storm: rate x2.5, dmg 30, stun 30%. **Discharge** (35 s): stun everything in range 3 s + 50 dmg |

Abilities appear as buttons in the HUD with hotkeys 1-9. They start **one-third charged** when bought,
and cooldowns are roughly one wave long.

### Player abilities (no ward needed)
- **Heartfire Flare** (hotkey F, 60 s cooldown, ready at wave 1): 30 damage to every enemy on screen
  (3 layers each, Veiled included) and 300 to hulks/boss, with a 0.5 s stun on non-boss enemies.
  The panic button and the biggest moment of juice: screen flash, shake, and a wall of pops.
- **Last Light** (once per run, automatic, not on Hard): the first time an enemy reaches the
  Heartfire, a nova destroys every non-boss enemy within 220 px of it.

---

## 4. The 10 waves

*Superseded by the 40-wave campaign in §9.*

Fodder HP never scales (`WAVE_HP` is removed). Each new threat **appears alone first**, then gets
mixed in. Targets: waves 1-2 are easy wins, wave 3 is the first check, and the T3 spike lands
around waves 4-5.

| Wave | Content (in spawn order) | Pops | New |
|---|---|---|---|
| 1 | 30 Mote | 30 | |
| 2 | 20 Mote, 25 Skitter | 70 | Skitter |
| 3 | 40 Shambler, 20 Skitter | 160 | Shambler |
| 4 | 6 Brood (alone), 50 Shambler, 10 Brood | 262 | Brood |
| 5 | 3 Husk (alone), 25 Brood, 60 Skitter stream, 5 Husk | 455 | Husk (Plated) |
| 6 | 12 Veiled Shambler (alone), 10 Husk, 40 Brood, 60 Shambler, 30 Veiled Skitter | 756 | Veiled |
| 7 | 20 Husk, 50 Brood, 120 Skitter rush, 10 Veiled Brood | 1,060 | (a quantity spike) |
| 8 | 1 Dreadhulk (alone), 30 Husk, 60 Brood, 100 Shambler | 1,440 | Dreadhulk |
| 9 | 3 Dreadhulk, 40 Husk, 80 Brood, 80 Veiled Shambler, 100 Skitter | 2,160 | everything at once |
| 10 | **Gravemaw**, 2 Dreadhulk, 30 Husk, 60 Brood, 150 Skitter | ~2,320 | boss |

For comparison, today's wave 10 is 69k HP spread over ~150 spawns that each take many hits. The new
wave 10 is ~23k HP split into ~2,300 one-hit layers. The screen is full and every ward is popping
something every shot.

A **next-wave preview** under the wave button shows enemy icons and counts, with a "NEW" tag on
first appearances. Wave 8 and wave 10 get a warning banner.

---

## 5. Endless mode (after wave 10)

*Endless now starts after wave 40; see §9.*

On victory, the screen offers **Continue into the endless night**. Waves are generated from a budget:

- **Pop budget:** `2,400 x 1.13^(n-10)`, so wave 20 ≈ 8,100 pops, wave 30 ≈ 27,600, wave 40 ≈ 94k.
  Groups are filled from the roster, favouring bigger enemies as the budget grows. Spawns are capped
  at ~250 per wave; anything over that is promoted into hulks/colossi to keep the frame rate up.
- **Toughness:** layer HP stays at 10 forever. Husk shells, hulks, colossi and the boss get
  `x1.05^(n-15)` HP from wave 16 (about x2.1 at wave 30, x3.4 at 40). Speed rises 1.5% per wave
  after wave 20, capped at +60%.
- **Modifiers** stack every 5 waves: wave 15 Veiled hulks, 20 Mending (layers regrow after 3 s
  untouched), 25 Swift (+25% speed), 30 Armoured shells (x2 shell HP), then the cycle repeats harder.
- **A Gravemaw every 10th wave**, with HP x1.6 per appearance.
- **Gold:** 1 per pop to wave 20, 0.5 to wave 30, 0.25 after. Wave reward continues at 100 + 25n.
  This stops endless money from trivialising T4 prices.
- **Records:** the best wave reached is shown on the start screen (stored in `localStorage`).

---

## 6. Feedback ("juice")

- **Every layer break:** a burst in that layer's colour, a small coin that flies to the gold counter,
  and a pop sound. Sound will be WebAudio-synthesised, since the game has no audio today: at most
  ~25 pops/s, randomised pitch, and the pitch rises with the kill streak.
- **Damage numbers** only for hits of 50+, hulk/boss damage and abilities. Today every hit shows a
  number, which would be noise at 2,000 pops a wave.
- **Husks and hulks visibly crack** as their shell HP drops, and burst on death.
- **Abilities and the Flare** get screen flash, shake and a short hit-stop. Ordinary hits never do.
- **HUD:** live pops/s next to gold, the best streak, and per-ward pops on the stats panel.

---

## 7. Implementation order and checks

1. **Layer system:** shed and carry-over damage, the new roster, leak cost = remaining pops,
   and enemy art for the new layer colours.
2. **Ward retune** (`data/towers.js`), max-hit caps for Mortar and Rime, Blizzard reveal,
   and pops/s in `tools/report.js`.
3. **Waves and economy:** remove `WAVE_HP`, add the new wave table, rules, sell-before-wave refund,
   and difficulty settings.
4. **Abilities:** T4 abilities, Heartfire Flare, Last Light, and the HUD buttons.
5. **Endless mode** generator, scaling, modifiers and the record.
6. **Feedback:** pops, sound, coins, cracks, wave preview and banners.
7. **Rebalance with the bot.** Update `tools/bot.js` (abilities, endless). Targets:
   - `mixed` and `focused` clear all 10 waves with **≥140/150 lives**.
   - `spamNoUpgrades` reaches **wave 8+**; `lazy` falls around waves 4-5.
   - Every single-path bot (`markOnly`, `cinderOnly`, …) clears the campaign.
   - A good build reaches endless **wave 25-35**.
   - Peak enemy counts stay where the browser holds 60 fps (check with the FPS overlay).

Each step gets a commit and a bot run, so balance can be checked as it goes.

**Risks:** entity count roughly doubles at peak (sheds create children), so the renderer and spatial
grid need checking at wave 9/10 and in endless. The cap and promotion in §5 are the safety valve.
The whole change touches most sim files and every data file. It's a big diff, but the structure
(data-driven stats, headless sim, bot) stays the same.

---

## 8. Implementation notes (where the build differs from the proposal)

Tuned during the bot passes (commits "Step 1" to "Step 7" on the `redesign` branch):

- **Waves 9 and 10 are thicker** than the table in §4: 2,620 and ~3,020 pops (more hulks, Husks,
  Broods; a Veiled Skitter stream on the boss wave). Cumulative gold by wave 10: ~12,900.
- **Streak gold is a flat 5 gold per 50 pops** (scaled by the endless gold cut). A version that grew
  with the streak paid thousands per pop in late endless, where streaks run for millions of pops.
- **Hunter's Mark** bolts ignore 50% of armour at T2 and all of it at T3, so the path can crack Husks.
- **Cinder** numbers are lower than §3: burn 4/8/15 per second, pools 10/20/50 per second.
  Cluster Charge gets x1.5 and Inferno x2 shell damage. **Fire pools don't stack**: an enemy burns in one
  pool per tick, and each pool burns at most 25 enemies per tick. Stacked uncapped pools out-damaged
  every other ward by 10x in endless.
- **Rime Shatter** is rate-limited (8/s at T3, 20/s at T4) so chain reactions can't run away.
- **Support paths** (Deep Freeze, Blizzard, Static) got small damage bumps so they don't fall off.
  Their real value (freeze, reveal, slow, stun) doesn't show in the layers/s estimate.
- **Endless:** shells, hulks and the boss gain **8%** health per wave from wave 16 (not 5%), and the
  spawn cap is **200**. Mending regrows a layer at most twice per enemy, and a regrown layer pays no
  gold (the layer inside it still pays once).
- **Abilities** are one per ward type, unlocked at tier 4 on any path (Overdraw, Saturation, Hoarfrost,
  Tempest). The per-path abilities in §3 are for later.
- **Not done yet:** difficulty settings (needs a menu).

### Bot results at commit time (`node tools/bot.js`, `--endless`)

| Build | Campaign | Endless reached |
|---|---|---|
| mixed | win, 150/150 lives | wave 40 |
| mixedAlt | win, 150/150 | wave 46 |
| focused | win, 150/150 | wave 26 |
| freezeMix | win, 150/150 (Last Light used) | wave 43 |
| spamNoUpgrades | win, 150/150 | (not run) |
| single-ward builds | all win (markOnly 91, cinderOnly 120, mortarOnly 143) | |
| lazy (3 wards, never spends) | loses at wave 7 | |

The bots leave a lot of gold unspent in endless, so players who spend everything should go further.
The campaign is deliberately generous: good play loses no lives, and the challenge lives in endless.

---

## 9. The 40-wave campaign (2026-11-17)

Why: with 10 waves, two wards and one upgrade carried a player through wave 6 without a leak. That's
60-70% of the game for almost no investment. The campaign is now 40 waves, and endless starts after
wave 40. The feel stays the same: wards are strong, Gloom peel in 10 HP layers, and difficulty comes
from quantity and variety.

### The rest of the Gloom (from the original design)

Each one appears alone first, with a banner, then mixes in.

| Enemy | First wave | HP | Speed | Pops | What it does | Answer among the 4 wards |
|---|---|---|---|---|---|---|
| Herald | 7 | 40 | 72 | 8 | Gloom within 95 px move 30% faster | focus it (Bolt "Strong" targeting, Hunter's Mark) |
| Gloomwing | 9 | 40 | 92 | 4 | flies the corner-cutting route (1,250 px vs 3,100 px on the ground) | Bolt Ward, Storm Coil (Mortar, Rime and fire can't hit it) |
| Aegis | 11 | 20 + 70 shield | 70 | 8 | the shield recharges 35/s after 2 s without a hit | Storm Coil (Arcane x2 on shields), steady area damage |
| Nullback | 13 | 80 | 58 | 22 | Arcane does x0.2 | anything but Storm Coil |
| Wisp | 14 | 30 | 112 | 3 | always Veiled | Hunter's Mark, Frost Sight, area damage |
| Mender | 15 | 50 | 62 | 11 | every 2.5 s regrows the outer layer of 12 nearby Gloom or patches 25% of a shell; regenerates 12/s | kill it fast: **no proper counter yet** (see below) |

Also new to the campaign: the Gloomcolossus (wave 23, was endless-only).

Mechanics added for them: a flight route with its own path (flyers bursting out of walkers take off
from the nearest point), recharging shields, haste and heal auras, always-Veiled types, and timed
summons for bosses.

### Bosses

| Wave | Boss | HP | Gimmick |
|---|---|---|---|
| 10 | Gravemaw | 4,000 | bursts Husks at 75/50/25%, splits into 2 Dreadhulks |
| 20 | Veilmother | 7,500 | always Veiled, trails 3 Wisps every 2.5 s, bursts Menders at 50%, then 20 Wisps |
| 30 | Bastion | 16,000 + 3,000 shield | plated (Kinetic x0.5), the shield recharges 500/s after 3 s; bursts Aegis and Nullbacks at 66/33%; splits into a colossus and 6 Nullbacks |
| 40 | The Hollow King | 85,000 | frost-immune (no Frost damage, no slow); calls a new host at every fifth of its health (flyers + Heralds, hulks + Menders, Aegis + Wisps, a big flock); bursts into 30 Wisps and 30 Gloomwings |

The King bursts into a swarm on purpose. A version that split into two colossi either won cleanly or
lost outright, because a colossus leak costs 520 lives. With the swarm, killing it late costs lives,
not the game.

### Shape of the campaign

- **1-5**: unchanged.
- **6-15**: one new kind per wave (Veiled, Herald, Dreadhulk, Gloomwing, Gravemaw, Aegis, Nullback,
  Wisp, Mender) at 550-2,000 pops. Lazy builds fall here.
- **16-30**: themed waves (armour 16/26, flyers 17/22, stealth 18/24, Heralds 25, wings and shadows
  27), with the Veilmother at 20, the Gloomcolossus at 23 and the Bastion at 30.
- **31-40**: everything at once, with themes (Black sky, Shadows, Heralds everywhere, the fortress,
  the colossi march, Veiled giants), and the Hollow King at 40.

On top of the hand-written counts (`data/waves.js`, printed by `node tools/waves.js`):
- **CROWD**: waves 16-30 thicken up to x1.225. From 31 the small and mid-sized groups are cut to
  x0.9, which keeps the peak enemy count where the browser holds its frame rate.
- **TOUGH**: from wave 21, shells, hulks and multi-layer Gloom gain 7.5% health per wave, and a
  further 4% per wave after 30 (x2.06 at 30, x6.3 at 40). **Basic 10 HP layers never change and
  bosses keep their own health.** Late waves demand heavy damage (tier 4s) on top of crowd control.
  The preview shows it ("shells x2.06 health").
- **PACE**: from wave 26, +1% speed per wave (+15% at 40).
- **Veiled hulks**: the veil tears when the shell breaks, so what they shed is visible. Small Veiled
  groups and Wisps stay Veiled.
- **Death Sentence** execute no longer works on hulks (the enemy data always said heavies were
  immune; the code only excluded bosses).

### Economy

- Gold per pop is 1 up to wave 8, then `(8 / wave)^2`: 0.25 at wave 16, 0.07 at 30, 0.04 at 40
  (floor 0.03). The preview shows it.
- The clear reward is `100 + 25w`, capped at 350.
- Cumulative gold: ~2.5k by wave 5, 7k by 10, 16k by 20, 27k by 30, 39k by 40. That buys a strong
  defence of ~7 tier 4s by the end, not a full set.

### Endless (41+)

A pop budget of `26,000 x 1.09^(n-40)` filled from the whole roster. Toughness carries on from wave 40
(x1.06 per wave) and speed from +15%. The four bosses rotate every 10th wave at
`70,000 x 1.6^((n-40)/10)` HP, and their spawn doesn't inherit the boss multiplier. The modifiers
(Veiled hulks, Mending, Swift, Armoured, Shadows, Frenzy) move to waves 45-70. The spawn cap is 450.

### Bot builds and results (`node tools/bot.js`)

Builds are grouped by the target they're held to:
- **lazy**: 2-3 wards, little or no upgrading. `minimal` is the reported case: a Rime Spire with one
  upgrade and an unupgraded Mortar.
- **reasonable**: mixed builds capped at tier 3.
- **strong**: mixed builds that save for tier 4s after wave 10.
- **probe**: one-trick builds.

Reasonable and strong builds buy one Frost Sight spire from wave 12, as a player who reads the
stealth banners would. New columns: first leak, lives at 20/25/30/35, wards (T3/T4), peak enemies.
`--trace=N` logs each leak on wave N, and verbose mode shows how deep the furthest enemy got.

| Build | Group | Result | First leak | Lives @20 | @25 | @30 | @35 | Wards (T3/T4) | Peak enemies |
|---|---|---|---|---|---|---|---|---|---|
| lazy | lazy | lost on wave 8 | 6 | - | - | - | - | 3 (0/0) | 131 |
| minimal | lazy | lost on wave 9 | 5 | - | - | - | - | 2 (0/0) | 152 |
| lazyTier1 | lazy | lost on wave 10 | 9 | - | - | - | - | 3 (0/0) | 151 |
| mixed | reasonable | lost on wave 33 | 33 | 150 | 150 | 150 | - | 14 (14/0) | 558 |
| mixedAlt | reasonable | lost on wave 28 | 28 | 150 | 150 | - | - | 14 (14/0) | 460 |
| focused | reasonable | lost on wave 28 | 26 | 150 | 150 | - | - | 9 (9/0) | 461 |
| strong | strong | lost on wave 39 | 38 | 150 | 150 | 150 | 150 | 16 (0/7) | 922 |
| strongAlt | strong | **won**, 150/150 (Last Light used) | never | 150 | 150 | 150 | 150 | 16 (1/7) | 453 |
| strongFreeze | strong | **won**, 43/150 (Last Light used) | 40 | 150 | 150 | 150 | 150 | 16 (1/7) | 703 |
| strongCinder | probe | lost on wave 22 | 11 | 67 | - | - | - | 14 (2/2) | 505 |
| spamNoUpgrades | probe | lost on wave 20 | 20 | - | - | - | - | 60 (0/0) | 315 |
| noDetection | probe | lost on wave 20 | 20 | - | - | - | - | 13 (8/0) | 383 |
| groundOnly | probe | lost on wave 12 | 9 | - | - | - | - | 8 (3/0) | 220 |
| boltOnly | probe | lost on wave 12 | 6 | - | - | - | - | 15 (6/0) | 188 |
| coilOnly | probe | lost on wave 10 | 6 | - | - | - | - | 8 (1/0) | 113 |

Endless: `strongAlt` reaches wave 44. Every build spends its Last Light on wave 10 (a Skitter or two
during the Gravemaw fight), which is why "Last Light used" appears on wins with full lives.

Caveats:
- **Losses come as cliffs.** A leaked hulk costs 120+ of 150 lives, so the bots mostly go from no
  leaks straight to a lost run. A player who reacts (Flare, rebuilding, selling) will bleed lives
  more gradually than the bots.
- **The peak of 922** belongs to a defence that is collapsing (`strong`, waves 38-39). Healthy
  defences peak at 450-700. The sim costs at most ~15 ms per simulated second.

### Counters the 4 wards don't provide

- **Mender**: the original design has it "regenerate unless blighted". Nothing in the current four
  wards applies Blight, so the only answer is to kill it fast. It's in the game as designed, not
  redesigned around the gap. **Add the Rot Censer first**: Blight stops Menders and the endless
  Mending modifier, and its damage-over-time grinds tough shells.
- Everything else has an answer. Flyers: Bolt and Coil. Shields: Coil. Nullbacks: everything but
  Coil. Stealth: Hunter's Mark, Frost Sight, area damage. Plate: Mortar, Ballista or Mark armour
  pierce. Flyers are the thinnest: only 2 of the 4 wards hit them, and `groundOnly` and
  `strongCinder` fall to them. If you want a second ward after the Rot Censer, the Longeye
  (map-wide sniper, sees stealth) eases both flyers and stealth.

---

## 10. Second playtest pass (2026-11-17)

Feedback: with 3 max-level wards by wave 20, nothing pushed back until wave 40, where the run
collapsed. Waves 21-39 were too easy and tier 4s came too soon.

### Waves 21-39: a steady climb in stretches

The hand-written waves 21-29 and 31-39 are replaced by `themed()` waves in `data/waves.js`. The pop
budget grows smoothly: 7.5% a wave from ~4.6k at wave 21 to ~8.9k at 30, then 9.6% a wave to ~20k at
39. Wave 40 is ~24k plus the boss. Each stretch mixes several threats, so a few strong wards in one
place can't cover it:

| Waves | Stretch | Mix |
|---|---|---|
| 21-24 | Veiled armour | half-Veiled Dreadhulks, Husks and Nullbacks behind Aegis, with Menders; Veiled Broods; a colossus intro at 23 |
| 25-29 | Air and hide | Gloomwing flocks (40% Veiled) over Arcane-proof Nullbacks, with Heralds and colossi |
| 31-34 | Shield wall | Aegis lines and Menders around colossi, Heralds pushing them on |
| 35-39 | The long night | everything; Veiled giants at 38 |

- Small and mid-sized Gloom are sized from 60% of wave 21's budget, plus 4% a wave. Hulks and
  colossi carry the rest of the budget, so spawns climb steadily from ~350 to ~540 a wave.
- TOUGH is now 6% a wave from 21 and 12% after 30 (x1.79 at wave 30, x5.74 at 40). PACE is
  unchanged. CROWD now only touches the hand-written waves 16-20.
- The Hollow King has 85,000 HP.

### Tier 4 pacing and gold

- Tier 4 prices are up 30% (Siege Lance 4,200, Cataclysm 4,700, Smite 4,900, ...). Tier 4 power per
  gold is now 1.65-2.4x the base ward (`node tools/report.js`), still above tier 3.
- The clear reward is uncapped again (`100 + 25w`: 600 at wave 20, 1,100 at 40), so late waves pay
  for continued building. Cumulative gold: 7k by wave 10, 12k by 15, 18k by 20, 32k by 30, 49k by 40.
- Streaks no longer pay gold (see below).
- Result: strong builds buy their first tier 4 on wave 15-16, have 2 by wave 20, 4-5 by 30 and 7 by
  40, and keep spending in between.

### UI

- **Upgrade text:** each path has a one-line identity and each tier a short line about what it
  does. The exact numbers (the old descriptions, the before/after stat diff, and the ward's stat
  grid) show only on hover or while Shift is held.
- **Gold is always a whole number.** Fractional texts are rounded or skipped, and the preview says
  "1 gold per N pops".
- **Streaks:** no centre-screen popup and no streak gold. The rising pop pitch, the corner counter
  and a chime every 250 stay.
- **Speed:** a 5x button, and the per-frame step cap rises from 12 to 20.

### Bot results

New `plateau` build: up to 8 wards. After the Gravemaw it saves hard for tier 4s, and stops investing
for good once it owns 3. New columns: the waves of the first and third tier 4, and the tier 4 count
at waves 20 and 30 and at the end.

| Build | Group | Result | First leak | Lives @25 | @30 | @35 | First / 3rd T4 | T4s @20 / @30 / end | Wards (T3/T4) | Peak enemies |
|---|---|---|---|---|---|---|---|---|---|---|
| lazy | lazy | lost on wave 8 | 6 | - | - | - | - | - / - / 0 | 3 (0/0) | 131 |
| minimal | lazy | lost on wave 9 | 5 | - | - | - | - | - / - / 0 | 2 (0/0) | 152 |
| lazyTier1 | lazy | lost on wave 10 | 9 | - | - | - | - | - / - / 0 | 3 (0/0) | 151 |
| mixed | reasonable | lost on wave 35 | 35 | 150 | 150 | - | - | 0 / 0 / 0 | 14 (14/0) | 399 |
| mixedAlt | reasonable | lost on wave 30 | 30 | 150 | - | - | - | 0 / 0 / 0 | 14 (14/0) | 400 |
| focused | reasonable | lost on wave 30 | 30 | 150 | - | - | - | 0 / 0 / 0 | 9 (9/0) | 424 |
| plateau | plateau | lost on wave 33 | 33 | 150 | 150 | - | 15 / 22 | 2 / 3 / 3 | 8 (0/3) | 413 |
| strong | strong | lost on wave 40 | 40 | 150 | 150 | 150 | 16 / 23 | 2 / 4 / 7 | 16 (1/7) | 857 |
| strongAlt | strong | **won**, 150/150 | never | 150 | 150 | 150 | 15 / 23 | 2 / 5 / 7 | 16 (1/7) | 392 |
| strongFreeze | strong | **won**, 122/150 (Last Light used) | 40 | 150 | 150 | 150 | 15 / 23 | 2 / 4 / 7 | 16 (1/7) | 607 |
| strongCinder | probe | lost on wave 21 | 11 | - | - | - | 17 / - | 1 / - / 2 | 13 (2/2) | 408 |
| spamNoUpgrades | probe | lost on wave 20 | 20 | - | - | - | - | 0 / - / 0 | 60 (0/0) | 312 |
| noDetection | probe | lost on wave 20 | 20 | - | - | - | - | 0 / - / 0 | 13 (8/0) | 384 |
| groundOnly | probe | lost on wave 12 | 9 | - | - | - | - | - / - / 0 | 8 (3/0) | 220 |
| boltOnly | probe | lost on wave 12 | 6 | - | - | - | - | - / - / 0 | 15 (6/0) | 205 |
| coilOnly | probe | lost on wave 10 | 5 | - | - | - | - | - / - / 0 | 8 (1/0) | 113 |

Endless: `strongAlt` reaches wave 48.

Caveats:
- **Plateau gets its 3rd tier 4 on wave 22, not 20.** With tier 4s 30% dearer, even a dedicated
  rusher can't afford three by wave 20; slowing tier 4s and "3 by 20" pull against each other.
- **Plateau doesn't bleed before it falls.** It holds without a leak until wave 32-33, then
  collapses. A leaked hulk costs 100+ lives, so the bots go from fine to lost in a wave or two. A
  player who uses the Flare and reacts will bleed more gradually.
- **Strong builds kept pace the whole way.** Their deepest point stays ~77-85% of the path from wave
  24 to 39, and wave 40 is the peak: one loses narrowly (the King leaks at 1-5%), one wins with 122
  lives, and one wins clean.


---

## 11. Four new wards (2026-11-18)

Four wards that each add a mechanic the first four don't have. Each has 3 paths of 4 tiers with a
one-line identity per path and per tier (numbers on hover or Shift), a distinct look at tier 3 and
tier 4 on every path, and a tier 4 ability.

| Ward | Cost | Role | Paths (tier 4) | Ability (key) |
|---|---|---|---|---|
| Longeye | 400 | Huge-range sniper (400). 4 layers a shot, sees Veiled, x2 to flyers | Deadeye: armour-piercing hulk breaker (Headhunter). Flak: air bursts that shred flocks (Flak Curtain). Spotter: tracers reveal Veiled and break shields for every ward (Eye in the Dark) | Killshot (G): the 12 toughest enemies on the map, x6, armour ignored |
| Ember Censer | 275 | Short cone of Fire, hits flyers and Veiled. Burning enemies are **Scorched**: no healing, regrowing or shield recharge | Pyre: burns that grind hulks (Wildfire: fire spreads on death). Dragon's Breath: a wider, longer jet (a full ring at tier 4). Ash: Scorched enemies take more from every ward (Ashen Brand: they lose their resistances) | Firestorm (H): every enemy burning and Scorched for 8s |
| Prism | 500 | One Radiant beam that ramps x1 to x5 over 4s on one enemy (and what it sheds), resets on a new target | Focus: higher, faster ramp (Sunspear). Refraction: several beams, each ramping on its own (Kaleidoscope). Afterglow: keeps its charge between targets, kills burst (Supernova) | Sunlance (J): every Prism at full charge, x2, for 5s |
| Beacon | 450 | Never attacks. Wards in its light attack 10% faster. Beacons don't stack: each kind of boost comes from the best Beacon a ward is in | War Drum: attack speed and damage (Warhorn). Lighthouse: range, sight, and at tier 3 **Mortars and Rimes inside can hit flyers** (Pharos reveals Veiled). Tithe: gold each wave plus interest, best Beacon only (Golden Hearth) | Rally (K): every ward on the map gets this Beacon's boost for 10s |

New damage types: **Fire** (Censer) and **Radiant** (Prism). No enemy resists either. Coil's
Overcharge path is now "the heavy-crowd breaker", leaving boss killing to the Prism.

### Other changes

- **Hotkeys:** wards 1-8 in build-bar order; abilities on the home row A S D F G H J K in the same
  order; Q W E upgrade the selected ward; X the Flare; Shift shows numbers; the FPS counter moved
  from F to backtick (`` ` ``); restart moved from R (next to the upgrade keys) to Shift+R with a
  confirmation.
- **Leak cap:** a leaked enemy costs at most 25 lives (`RULES.maxLeak`). Bosses are uncapped.
- **Waves:** each stretch now points at a new ward without needing it. 21-24 has more Menders and
  Aegis (the Censer stops both), 25-29 has half its Gloomwings Veiled (Longeye or a Lighthouse
  covers both), 31-34 has more colossi (Prism), and 35-39 throws everything (Beacons multiply a
  crowded defence). Mender and Aegis banners mention fire.
- **Future 9th ward:** a trap ward placed on the path itself (thorns or mines), a new placement
  decision. Not built yet.

### Rebalance

- **Censer nerfed** after the first bot pass, where its Wildfire tier 4 did half of all damage at
  ~300 damage per gold: base 1.0 attacks/s, 8 targets, burn 4/s; smaller Pyre and Firehose steps;
  Wildfire spreads to 3 enemies, at most 15 times a second. After a small lift back, its tier 4s
  measure ~105-135 damage per gold, the lower half of the tier 4 range, because part of its worth
  is shutting down healers and shields.
- **Waves 21-40 climb harder**, because eight wards buy more power per gold than four.
  - BUDGET grows 8.5% a wave to wave 30, then 12% (~27k pops at 39).
  - TOUGH grows 6.5% a wave, plus another 7.5% after wave 30 (x1.88 at 30, x7.26 at 40).
  - Wave 40 has 16 colossi and 40 Dreadhulks (was 8 and 24), so it stays the peak: 30.6k pops plus
    the Hollow King, against 27.2k at wave 39.
- **Bot changes** (`tools/bot.js`):
  - It values a share of single-target power, so Prisms and Longeyes get upgraded.
  - It values Beacons by the boost to the wards they light, and places them by the gold invested
    nearby.
  - After a leak it spends what it has instead of saving for a tier 4.
  - After flyers leak, its next upgrades go to wards that can hit them.
- **New builds:**
  - `newA`/`newB`/`newC` give the new wards first call on upgrades, to measure their tier 4s.
  - `original4` is the pre-expansion build, using only the first four wards.
  - The ban-one probes take `strongAlt` and never buy one ward. `noMortarCrowd` is the build a
    player without Mortars would make.

### Bot results

| Build | Group | Result | First leak | Lives @25 | @30 | @35 | First / 3rd T4 | T4s @20 / @30 / end | Wards (T3/T4) | Peak enemies |
|---|---|---|---|---|---|---|---|---|---|---|
| lazy | lazy | lost on wave 9 | 6 | - | - | - | - | - / - / 0 | 3 (0/0) | 131 |
| minimal | lazy | lost on wave 9 | 5 | - | - | - | - | - / - / 0 | 2 (0/0) | 152 |
| lazyTier1 | lazy | lost on wave 10 | 9 | - | - | - | - | - / - / 0 | 3 (0/0) | 151 |
| lazyNew | probe | lost on wave 4 | 3 | - | - | - | - | - / - / 0 | 3 (0/0) | 69 |
| mixed | reasonable | lost on wave 34 | 34 | 150 | 150 | - | - | 0 / 0 / 0 | 16 (16/0) | 409 |
| mixedAlt | reasonable | lost on wave 32 | 32 | 150 | 150 | - | - | 0 / 0 / 0 | 16 (16/0) | 433 |
| focused | reasonable | lost on wave 33 | 33 | 150 | 150 | - | - | 0 / 0 / 0 | 9 (9/0) | 403 |
| plateau | plateau | lost on wave 35 | 17 | 125 | 125 | - | 16 / 26 | 1 / 3 / 3 | 8 (3/3) | 368 |
| plateauAlt | plateau | lost on wave 35 | 35 | 150 | 150 | - | 14 / 23 | 2 / 3 / 3 | 8 (0/3) | 342 |
| strong | strong | lost on wave 38 | 17 | 145 | 145 | 145 | 17 / 27 | 1 / 3 / 5 | 18 (3/5) | 350 |
| strongAlt | strong | **won**, 150/150 | never | 150 | 150 | 150 | 17 / 25 | 1 / 4 / 6 | 18 (3/6) | 478 |
| strongThird | strong | **won**, 150/150 | never | 150 | 150 | 150 | 15 / 25 | 1 / 4 / 7 | 18 (2/7) | 660 |
| strongTithe | strong | **won**, 33/150 (Last Light used) | 17 | 121 | 121 | 121 | 15 / 22 | 2 / 5 / 9 | 18 (1/9) | 692 |
| newA | strong | lost on wave 37 | 37 | 150 | 150 | 150 | 16 / 28 | 1 / 3 / 5 | 18 (1/5) | 254 |
| newB | strong | **won**, 150/150 | never | 150 | 150 | 150 | 16 / 28 | 1 / 3 / 6 | 18 (2/6) | 499 |
| newC | strong | lost on wave 40 | 40 | 150 | 150 | 150 | 17 / 26 | 1 / 4 / 7 | 18 (1/7) | 720 |
| original4 | probe | **won**, 150/150 (Last Light used) | never | 150 | 150 | 150 | 15 / 23 | 2 / 4 / 8 | 18 (0/8) | 497 |
| spamNoUpgrades | probe | lost on wave 26 | 25 | 25 | - | - | - | 0 / - / 0 | 60 (0/0) | 359 |
| noDetection | probe | lost on wave 20 | 20 | - | - | - | 15 / - | 1 / - / 1 | 13 (2/1) | 377 |
| groundOnly | probe | lost on wave 12 | 9 | - | - | - | - | - / - / 0 | 8 (1/0) | 221 |
| prismOnly | probe | lost on wave 4 | 3 | - | - | - | - | - / - / 0 | 2 (0/0) | 67 |
| no-bolt | ban | **won**, 121/150 (Last Light used) | 10 | 142 | 142 | 142 | 20 / 30 | 1 / 3 / 6 | 18 (3/6) | 390 |
| no-mortar | ban | lost on wave 38 | 34 | 150 | 150 | 138 | 16 / 27 | 1 / 4 / 5 | 18 (4/5) | 534 |
| no-rime | ban | **won**, 143/150 (Last Light used) | 5 | 143 | 143 | 143 | 14 / 25 | 2 / 4 / 7 | 18 (2/7) | 366 |
| no-coil | ban | **won**, 150/150 | never | 150 | 150 | 150 | 15 / 26 | 1 / 4 / 7 | 18 (2/7) | 398 |
| no-longeye | ban | **won**, 150/150 | never | 150 | 150 | 150 | 15 / 27 | 1 / 4 / 7 | 18 (2/7) | 418 |
| no-censer | ban | **won**, 150/150 | never | 150 | 150 | 150 | 15 / 27 | 1 / 4 / 7 | 18 (2/7) | 426 |
| no-prism | ban | **won**, 150/150 | never | 150 | 150 | 150 | 15 / 26 | 1 / 4 / 7 | 18 (3/7) | 386 |
| no-beacon | ban | **won**, 113/150 (Last Light used) | 40 | 150 | 150 | 150 | 15 / 24 | 2 / 4 / 7 | 18 (1/7) | 376 |
| noMortarCrowd | ban | **won**, 119/150 (Last Light used) | 9 | 119 | 119 | 119 | 18 / 28 | 1 / 3 / 7 | 18 (1/7) | 613 |

Endless: `strongAlt` reaches wave 45.

What it shows:
- **Lazy** builds lose on waves 9-10, and **reasonable** tier-3 builds on 32-34.
- **Plateau** builds (three tier 4s, then nothing) lose on wave 35.
- **Investing builds only just win.** Four win (one with 33 lives) and three lose on waves 37-40.
  The full-life winners still reach 86-94% of the path on wave 40.
- **No ward is required.** Seven of the eight ban-one builds win. The eighth, `no-mortar`, keeps
  `strongAlt`'s hulk-focused paths, runs short of crowd damage, and loses on 38.
  `noMortarCrowd`, which takes the crowd paths instead (Twin-shot, Forking, Dragon's Breath, Flak,
  Focus Prisms), wins with 119 lives.
- **New tier 4s, measured:**

  | Tier 4 | Damage per gold |
  |---|---|
  | Prism Supernova | ~265 |
  | Longeye Flak Curtain | ~225 |
  | Prism Kaleidoscope | ~185 |
  | Censer Wildfire | ~135 |
  | Censer Dragon's Breath | ~105 |

  For comparison, the original wards' tier 4s measure 92-265 (quartiles, median 175). Every new
  tier 4 lands inside that range. A Beacon's worth only shows in the wards around it.

Caveats:
- **The plateau builds still don't bleed.** They hold until wave 34, then lose everything over one
  or two waves, even with the 25-life cap: by then dozens of enemies leak at once. A player who
  watches and reacts will bleed more slowly.
- **The new wards aren't openers.** `lazyNew` (a tier-1 Longeye, Censer and Prism) loses on wave 4,
  and `prismOnly` on wave 4. The slow sniper and the single beam can't keep up with wave 1-3
  swarms; start with Bolts, Mortars or Rime.

---

## 12. A map-wide Longeye and a real flamethrower (2026-11-18)

Feedback from a first look at the new wards: the Longeye should reach the whole map, and the Ember
Censer should look and play like a flamethrower rather than a ward firing shots.

### Longeye: map-wide

- **No range stat.** `global: true` replaces `range`: it targets any enemy anywhere, wherever it
  stands. No range circle; while placing or selected, a faint dashed frame runs round the whole map
  instead, and the stat grid says "Range: whole map". (Its paths never had range upgrades, so
  nothing needed replacing; a Lighthouse's range boost does nothing for it.)
- **Eye in the Dark** (Spotter tier 4) now reveals every Veiled enemy on the map to every ward.
- **Balance: its strength is reach, not damage.** 30 damage a shot (was 40), cost 350 (was 400),
  Deadeye x2.3 (was x2.5), Headhunter x2.8 (was x3), Flak Curtain x1.9 (was x2).
- **Targeting:** still "Strong" by default, which suits Deadeye and Killshot. Map-wide, though, Strong
  means the toughest enemy anywhere, so a Veiled flock it alone can see may fly past while it shoots
  a hulk. Switching to First (whatever is closest to the Heartfire) is now a real choice. A default
  of First was tried and rejected: it spends Deadeye shots on 10-HP motes (0.54-0.8x the old power).

### Ember Censer: a continuous flamethrower

- **Sim:** no attack rate. `damage` is Fire damage per second to *everything* in the cone (a safety
  cap of the 80 nearest), ticked every 0.1s. The nozzle sweeps towards its target at 5 rad/s and the
  cone follows the nozzle, so fast or scattered targets can slip out of it. Every tick sets what it
  touches burning and Scorched. `maxHits` is gone, and the old rate multipliers are folded into damage
  (Firehose x2.1, Dragon's Breath x2.6, Choking Ash x1.5, Ashen Brand x2.2). A Beacon's attack-speed
  boost goes into its damage, as for the Prism. Dragon's Breath's ring spins its three heads.
- **Numbers:** 8 damage/s and 3 burn/s base (was 10 per gout at 1/s, burn 4). Re-aiming every tick
  sets far more of a crowd burning than one gout a second did, so the per-second numbers came down.
  Wildfire burns x2.4 (was x2), flames x1.9; Pyre flames x1.4.
- **Look** (`render/flames.js`):
  - **Flame:** pooled flame particles leave the nozzle white-hot and cool through orange to red as
    they billow and rise. They're drawn as a solid body plus an additive glowing core, stretched
    along their heading into flame tongues.
  - **Around it:** smoke (thick and dark on the Ash path), embers, scorch marks that smoulder and
    fade, a ground glow, a nozzle flare, and a cheap heat haze (shifted strips of a cached background
    patch, at most two Censers, off above 300 enemies).
  - **Growth:** Dragon's Breath makes the flame longer and wider. Every upgrade makes it hotter:
    orange, then white-hot (Pyre 3, Dragon's Breath 4), blue for Wildfire, crimson for Ash, magenta
    for Ashen Brand.
  - **Dragon's Breath tier 4:** a pinwheel of three curling jets with a burning crest round the
    ring's edge, rolling out a wave of fire every 0.9s.
- **Sound:** one looping, fluttering roar whose volume follows how many Censers are firing.
- **Cost:** at most 1,500 flame particles. Past 5 firing Censers each pours thinner, and huge crowds
  halve it. In a 14-Censer stress scene on a software canvas (`@napi-rs/canvas`), the flame effects
  took about as long as everything else in the frame put together (69 of 150 ms); the old cones were
  nearly free. GPU canvases should do much better, but this wasn't measured in a real browser.

### Calibration

The bots' damage-per-gold swings with placement and with when a ward is bought, so both wards were
calibrated alone. One ward stands at a fixed spot with infinite lives, sampled waves 8-36 are played,
and old code (commit 4e20124) is compared with new, tier by tier:

| Censer | base | 2-0-0 | 3-2-0 | Wildfire 4-2-0 | 0-2-0 | 0-3-0 | Dragon's Breath 0-4-2 | 2-0-3 | Ashen Brand 0-2-4 |
|---|---|---|---|---|---|---|---|---|---|
| new / old | 1.02 | 1.10 | 0.94 | 1.03 | 0.91 | 0.88 | 0.99 | 0.93 | 0.99 |

| Longeye | base | 2-0-0 | Deadeye 3-2-0 | Headhunter 4-2-0 | Flak 0-3-0 | Flak Curtain 0-4-2 | Eye 2-0-4 |
|---|---|---|---|---|---|---|---|
| best spot | 0.93 | 0.96 | 1.01 | 0.98 | 0.95 | 0.99 | 0.98 |
| far corner | 1.14 | 1.32 | 1.29 | 1.22 | 1.34 | 1.15 | 1.34 |

So the Longeye matches its old power from the best spot and is no longer weak away from the path.

### Bot changes

- A map-wide ward is placed where it takes the least path coverage from others (the spot doesn't
  matter to it).
- `aimLongeyes`: while flyers are more than 55% of the way to the Heartfire, Longeyes switch to
  First, then back to Strong; during a boss fight they stay on Strong. Without this, `noMortarCrowd`
  lost 115 lives at once to Veiled Gloomwings on wave 25.

### Bot results

| Build | Group | Result | First leak | Lives @25 | @30 | @35 | First / 3rd T4 | T4s @20 / @30 / end | Wards (T3/T4) | Peak enemies |
|---|---|---|---|---|---|---|---|---|---|---|
| lazy | lazy | lost on wave 9 | 6 | - | - | - | - | - / - / 0 | 3 (0/0) | 131 |
| minimal | lazy | lost on wave 9 | 5 | - | - | - | - | - / - / 0 | 2 (0/0) | 152 |
| lazyTier1 | lazy | lost on wave 10 | 9 | - | - | - | - | - / - / 0 | 3 (0/0) | 151 |
| lazyNew | probe | lost on wave 5 | 3 | - | - | - | - | - / - / 0 | 3 (0/0) | 99 |
| mixed | reasonable | lost on wave 35 | 35 | 150 | 150 | - | - | 0 / 0 / 0 | 16 (16/0) | 424 |
| mixedAlt | reasonable | lost on wave 32 | 32 | 150 | 150 | - | - | 0 / 0 / 0 | 16 (16/0) | 395 |
| focused | reasonable | lost on wave 33 | 32 | 150 | 150 | - | - | 0 / 0 / 0 | 9 (9/0) | 409 |
| plateau | plateau | lost on wave 35 | 20 | 146 | 146 | - | 16 / 24 | 2 / 3 / 3 | 8 (1/3) | 377 |
| plateauAlt | plateau | lost on wave 35 | 35 | 150 | 150 | - | 16 / 23 | 2 / 3 / 3 | 8 (0/3) | 460 |
| strong | strong | lost on wave 38 | 20 | 140 | 140 | 140 | 17 / 30 | 1 / 3 / 5 | 18 (3/5) | 403 |
| strongAlt | strong | lost on wave 40 | 40 | 150 | 150 | 150 | 17 / 25 | 1 / 4 / 6 | 18 (3/6) | 527 |
| strongThird | strong | **won**, 150/150 | never | 150 | 150 | 150 | 15 / 25 | 1 / 4 / 7 | 18 (2/7) | 600 |
| strongTithe | strong | **won**, 114/150 (Last Light used) | 40 | 150 | 150 | 150 | 15 / 22 | 2 / 5 / 9 | 18 (1/9) | 574 |
| newA | strong | lost on wave 36 | 36 | 150 | 150 | 150 | 16 / 26 | 2 / 3 / 5 | 18 (1/5) | 366 |
| newB | strong | **won**, 150/150 | never | 150 | 150 | 150 | 16 / 27 | 1 / 3 / 6 | 18 (2/6) | 544 |
| newC | strong | **won**, 150/150 | never | 150 | 150 | 150 | 17 / 26 | 1 / 4 / 7 | 18 (1/7) | 749 |
| original4 | probe | **won**, 150/150 (Last Light used) | never | 150 | 150 | 150 | 15 / 23 | 2 / 4 / 8 | 18 (0/8) | 497 |
| spamNoUpgrades | probe | lost on wave 31 | 30 | 150 | 7 | - | - | 0 / 0 / 0 | 60 (0/0) | 347 |
| noDetection | probe | lost on wave 20 | 20 | - | - | - | 15 / - | 1 / - / 1 | 13 (2/1) | 413 |
| groundOnly | probe | lost on wave 12 | 9 | - | - | - | - | - / - / 0 | 8 (1/0) | 221 |
| prismOnly | probe | lost on wave 4 | 3 | - | - | - | - | - / - / 0 | 2 (0/0) | 67 |
| noMortarCrowd | ban | **won**, 150/150 (Last Light used) | never | 150 | 150 | 150 | 16 / 26 | 2 / 4 / 7 | 18 (1/7) | 542 |
| no-bolt | ban | lost on wave 40 | 10 | 49 | 49 | 49 | 18 / 30 | 1 / 3 / 5 | 18 (4/5) | 481 |
| no-mortar | ban | lost on wave 36 | 13 | 146 | 146 | 146 | 16 / 26 | 2 / 4 / 5 | 18 (3/5) | 462 |
| no-rime | ban | **won**, 124/150 (Last Light used) | 5 | 124 | 124 | 124 | 14 / 25 | 2 / 4 / 7 | 18 (2/7) | 358 |
| no-coil | ban | **won**, 150/150 | never | 150 | 150 | 150 | 15 / 26 | 1 / 4 / 7 | 18 (2/7) | 439 |
| no-longeye | ban | **won**, 150/150 (Last Light used) | never | 150 | 150 | 150 | 15 / 27 | 1 / 4 / 7 | 18 (2/7) | 376 |
| no-censer | ban | **won**, 150/150 | never | 150 | 150 | 150 | 15 / 27 | 1 / 4 / 7 | 18 (2/7) | 431 |
| no-prism | ban | **won**, 150/150 | never | 150 | 150 | 150 | 15 / 26 | 1 / 4 / 7 | 18 (3/7) | 359 |
| no-beacon | ban | **won**, 150/150 | never | 150 | 150 | 150 | 16 / 25 | 1 / 4 / 7 | 18 (1/7) | 472 |

Against the targets from section 11:
- **Lazy** (9-10), **reasonable** (32-35) and **plateau** (35) builds land where they did.
- **Strong group:** the same 4-win / 3-loss split. Which builds fall on the edge moved:
  `strongAlt` now loses wave 40 narrowly and `newC` wins. These builds win or lose wave 40 by a few
  percent of the path, and small changes flip them either way between runs.
- **Ban-one:** 6 of 8 win (was 7). `no-bolt` loses the Hollow King fight on wave 40;
  `noMortarCrowd` now wins with 150 lives (was 119).

Caveats:
- **`spamNoUpgrades` reaches wave 31** (was 26), carried by 8 unupgraded Censers at ~190 damage per
  gold. A flame that hits everything in its cone rewards stacking Censers on a dense stretch more
  than the old 8-target gouts did. It still falls before every reasonable build.
- **Longeye targeting is now the player's job.** Strong ignores a flock while a hulk is alive
  anywhere; the bot's switching stands in for a player who notices.

---

## 13. Medium difficulty retune (2026-11-18)

The campaign is the Medium difficulty, so it shouldn't be brutal. Only waves and scaling changed; the
bot strategies and their groups are untouched.

Targets: strong builds win wave 40 comfortably with no lives lost; medium builds (`mixed`,
`mixedAlt`, `focused`, `plateau`, `plateauAlt`) struggle late and about half win narrowly; lazy
builds still lose around 8-12.

### Changes

| Knob | Before | Now |
|---|---|---|
| TOUGH (waves 21+) | 6.5%/wave, +7.5% more after 30 (x1.88 at 30, x7.26 at 40) | 5%/wave (x1.63 at 30, x2.65 at 40) |
| BUDGET after wave 30 | +12%/wave (~27k pops at 39) | +4.5%/wave (~14k at 39) |
| Wave-clear reward | 100 + 25w | 100 + 25w + 40 per wave past 15 (2,100 at 40); ~61k gold by 40 (was ~49k) |
| Wave 17 / 20 flocks | 40 + 80 / 40 Gloomwings | 26 + 52 / 30 |
| Waves 31-39 Gloomwing share | 10% / 13% | 22% / 25%, plus a "Black sky" flock spike on 33 (240) and 37 (300) |
| Wave 38 "Veiled giants" | every hulk Veiled | half of them |
| Wave 40 escort | 16 colossi, 40 Dreadhulks, 150 Husks, ... (~30k pops) | 8 colossi, 18 Dreadhulks, 90 Husks, ... (~15k pops, plus the King) |
| The Hollow King | 85,000 HP, bursts into 30 Wisps + 30 Gloomwings | 28,000 HP, bursts into 18 + 18 |

Why each:
- **Income** is the lever that separates the groups. Medium builds hit their own caps (tier 3, or
  three tier 4s) and bank the rest: `mixed` sat on 13-26k unspent by wave 39. Strong builds spend
  everything. More late gold lifts only the builds that keep investing.
- **Late scaling** was a wall for everyone. With 6.5% + 7.5% toughness, `newA` (a strong build)
  died on 39 alongside the medium ones.
- **Wave 40** was a cliff: ~60% more than wave 39 plus an 85k King. Builds that held 39 at
  60-85% of the path collapsed there.
- **The King's death swarm** could take 210 lives on its own (more than a full 150) when he died
  late. Now a late kill costs at most ~126.
- **Wave 17's flock** made `strong` spend its Last Light while it was saving for its first tier 4.

### Results (full suite, seeds 1, 2 and 3)

`+LL` means the Last Light was spent (an enemy reached the Heartfire, but no lives were lost).

| Build | Seed 1 | Seed 2 | Seed 3 | First leak (1/2/3) |
|---|---|---|---|---|
| **Strong (target: win, no lives lost)** | | | | |
| strong | won, 150/150+LL | won, 150/150+LL | won, 150/150 | never / never / never |
| strongAlt | won, 150/150 | won, 150/150 | won, 150/150 | never / never / never |
| strongThird | won, 150/150 | won, 150/150 | won, 150/150 | never / never / never |
| strongTithe | won, 150/150 | won, 150/150 | won, 150/150 | never / never / never |
| newA | won, 150/150 | won, 150/150 | won, 150/150 | never / never / never |
| newB | won, 150/150 | won, 150/150 | won, 150/150 | never / never / never |
| newC | won, 150/150 | won, 150/150 | won, 150/150 | never / never / never |
| original4 | won, 150/150 | won, 150/150+LL | won, 150/150 | never / never / never |
| **Medium (target: about half win narrowly, the rest lose on 35-40)** | | | | |
| mixed | won, 150/150+LL | won, 150/150+LL | won, 150/150+LL | never / never / never |
| mixedAlt | lost on wave 39 | lost on wave 39 | lost on wave 38 | 38 / 39 / 37 |
| focused | lost on wave 39 | lost on wave 39 | lost on wave 39 | 38 / 39 / 39 |
| plateau | lost on wave 40 | lost on wave 40 | lost on wave 40 | 40 / 40 / 19 |
| plateauAlt | won, 150/150 | won, 150/150 | won, 150/150+LL | never / never / never |
| **Lazy (target: lose on 8-12)** | | | | |
| lazy | lost on wave 9 | lost on wave 9 | lost on wave 9 | 6 / 5 / 6 |
| minimal | lost on wave 9 | lost on wave 9 | lost on wave 9 | 5 / 5 / 5 |
| lazyTier1 | lost on wave 10 | lost on wave 10 | lost on wave 10 | 9 / 8 / 9 |
| **Other probes (no target)** | | | | |
| lazyNew | lost on wave 5 | lost on wave 5 | lost on wave 5 | 3 / 3 / 3 |
| spamNoUpgrades | lost on wave 31 | lost on wave 31 | lost on wave 31 | 30 / 30 / 30 |
| noDetection | lost on wave 20 | lost on wave 20 | lost on wave 20 | 20 / 20 / 20 |
| groundOnly | lost on wave 12 | lost on wave 12 | lost on wave 12 | 9 / 9 / 9 |
| prismOnly | lost on wave 4 | lost on wave 4 | lost on wave 4 | 3 / 3 / 3 |
| noMortarCrowd | won, 150/150+LL | won, 148/150+LL | won, 147/150+LL | never / 15 / 17 |
| no-bolt | won, 99/150+LL | won, 92/150+LL | won, 110/150+LL | 10 / 10 / 10 |
| no-mortar | won, 146/150+LL | won, 150/150+LL | won, 150/150+LL | 13 / never / never |
| no-rime | won, 124/150+LL | won, 146/150+LL | won, 149/150+LL | 5 / 5 / 5 |
| no-coil | won, 150/150 | won, 150/150 | won, 150/150 | never / never / never |
| no-longeye | won, 150/150+LL | won, 150/150+LL | won, 150/150+LL | never / never / never |
| no-censer | won, 150/150 | won, 150/150 | won, 150/150 | never / never / never |
| no-prism | won, 150/150 | won, 150/150 | won, 150/150 | never / never / never |
| no-beacon | won, 150/150 | won, 150/150 | won, 150/150 | never / never / never |

The outcome is the same on all three seeds for every build:
- **Strong:** 24 of 24 runs win with 150 lives. `strong` and `original4` spend the Last Light in
  3 runs.
- **Medium:** `mixed` and `plateauAlt` win every time, `mixed` always on the Last Light. `focused`
  and `mixedAlt` lose on 38-39 (`focused` bleeds 17 and 52 lives over 38-39 first); `plateau` loses
  on 40 because it lacks the single-target damage for the King.
- **Lazy:** unchanged, losing on 9-10.
- **Ban-one:** all 8 now win, and `noMortarCrowd` too.

Caveats:
- **Medium builds don't bleed in the 20s.** They reach 60-85% of the path through waves 20-36 with
  no leaks, then hit their limit in the late 30s. Bots go from holding to lost within a wave or two,
  because a Dreadhulk that cracks near the Heartfire spills everything inside it. The narrow margin
  shows as the Last Light rather than lost lives. Spikes of cheap, fast enemies (the flocks) were
  tried to make them bleed; their defences handle flyers too well for that to show.
- **Endless** carries on from wave 40's toughness (x2.65, was x7.26), so endless starts easier than
  before. Pinning it to the old value would make wave 41 a x2.7 jump; it's left for its own pass.
