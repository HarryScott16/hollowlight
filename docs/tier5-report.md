# Tier 5 report: every capstone tested on its own

Report only: nothing in the game, its balance or its art was changed for this. The numbers come from `tools/t5study.js` (built on `tools/solo.js`) and the tables from `tools/t5report.js`; how to rerun them is at the end. Hollowmere, Medium, 3 seeds per test, run on 2026-11-24 at `c9df88e`.

## Summary

- **The spread is huge.** On its own, the best tier 5, Shrapnel Storm (Longeye, Flak), gets to about wave 50. The weakest ones that attack, the three Snares and Pall of Ash (Censer, Ash), can't get past wave 9. Eight more, all three Beacons, all three Ember Vaults, False Moon (Moth Lantern, Bright Lure) and Amber Trap (Moth Lantern, Flypaper), can't kill anything on the road, so alone they do exactly as well as an empty map and lose on wave 3.
- **Most of the "weak" tier 5s are blind, not weak.** Starhost (Wandering Light, Swarm), Dawnbreaker (Prism, Focus), Lightweb (Prism, Refraction), Falling Sky (Wandering Light, Hunter), Second Sun (Prism, Afterglow), Stormlord (Storm Coil, Overcharge) and Ball Lightning (Storm Coil, Forking) all die to Veiled enemies alone: 100% of the lives they lose are Veiled Gloom they can't target. With the Veiled revealed (and no other help), **Starhost becomes the strongest tier 5 of all** (wave 59 from wave 1, 19 waves past 40 in endless), with Dawnbreaker and Lightweb right behind it. Grand Battery (Mortar, Rapid Loader) and Worldbreaker (Mortar, Big Shells) are the same story with flyers: Gloomwings take 80-100% of their lives, and once they can hit flyers Grand Battery is the 4th strongest.
- **A few are weak in raw power too**, even with every blind spot removed:
  - the three Snares, Thornwall (Thornlight Snare, Caltrops), Constellation (Thornlight Snare, Flashmines) and Seal of Dawn (Thornlight Snare, Binding Light), and Pall of Ash (Censer, Ash) all fall to the first boss, the Gravemaw on wave 10.
  - Dawnbringer (Wandering Light, Torchbearer) reaches wave 12 and Moth Queen (Moth Lantern, Moth-trap) wave 13, killed by Gloomwings, which are its speciality. Both barely fight.
  - Kingslayer (Longeye, Deadeye) and Eye of Fate (Longeye, Spotter) reach wave 18-20. They see everything and hit flyers, but single shots can't keep up with crowds of Skitters and Gloomwings.
  - Elder Wyrm (Censer, Dragon's Breath), Phoenix (Censer, Pyre), Magma Heart (Mortar, Cinder), Worldpiercer (Bolt Ward, Ballista) and Kingslayer (Longeye, Deadeye) are only 0.9-1.3x their tier 4's damage late on, far short of the 3-5x the tier 5 design aims for.
- **The strongest on their own** are Wild Hunt (Bolt Ward, Hunter's Mark), Thousand Bolts (Bolt Ward, Twin-shot) and Shrapnel Storm (Longeye, Flak): they see Veiled (the Longeye always does; the Bolt Wards through the Hunter's Mark path, as their main path or as the second path), hit flyers and deal with crowds. Avalanche (Rime Spire, Shatter), Eye of the Storm (Storm Coil, Static) and Whiteout (Rime Spire, Blizzard) follow.
- **Boss walls**: the Gravemaw (wave 10), the Bastion (wave 30) and the Hollow King (wave 40) end many runs outright. A campaign boss that gets through costs all of its leak (150 lives here), so Whiteout (Rime Spire, Blizzard) goes from full lives to nothing on wave 30, and the Bastion ends Phoenix (Censer, Pyre) there too.
- **A bug turned up** (not fixed): Second Heartfire (Ember Vault, Hearthwarm) is meant to be always warm (`warmAt: 0`), but `vault()` in `sim/towers.js` reads `s.warmAt || 0.5`, so 0 falls back to "warm from half full". Its +50% speed and +35% damage only switch on once it's half full.

## Method

- **The harness** (`tools/solo.js`) starts a real game (the same simulation the game runs) with one ward on the map, already built: tier 5 (or tier 4) on one path and tier 2 on a secondary path. Each wave is called when the last one clears, and it plays until it loses (or wave 150). Lives, leak caps and the one free Last Light save are as in a game. The ward's own ability is used the way `tools/bot.js` uses abilities (when 40+ Gloom are out or a hulk is). The Heartfire Flare is never used, because it isn't the ward's power.
- **Two starts.** **W1** is the last wave cleared starting at wave 1, ward pre-built (the campaign is 40 waves, then it carries on into endless). **E41** is how many waves it clears past wave 40 when dropped straight into endless at wave 41 with fresh lives (0 means it lost wave 41).
- **Three conditions**, all test-only switches set on the one game object in the harness:
  1. **Alone**: the ward as it is.
  2. **Reveal**: every Veiled enemy counts as seen by it. The harness asks `Game.targetable` to skip the Veiled check, as it already does for area attacks. Nothing else changes: no range, rate or damage, unlike a Beacon.
  3. **Full**: reveal, and flyers are targetable and hittable by it (its stats get `hitsAir`, and `targetable` skips the flyer check). Effects that only exist on the ground still miss flyers: a Snare's thorns and mines, burning pools.
- **Placement and secondary path.** For each tier 5 and condition, four candidate spots were tried: the best by road in reach, kept apart from each other, and for wards that can hit flyers, two of the four by road plus flight line. Each spot was tried with both other paths at tier 2, seed 1, from both starts. The best (W1 + E41, then damage) was kept for the other seeds and for the tier 4. This matters a lot: the same ward can swing by up to 37 waves between spots (Thousand Bolts, on the Bolt Ward's Twin-shot path, went from wave 10 to 47 depending on the spot), and Eye of the Storm (Storm Coil, Static) only did well once flight-line spots were included.
- **Seeds.** Three seeds per test. The campaign waves are fixed, so seeds barely matter from wave 1. In endless they change the waves; only 13 of 216 tier 5 cells differ by 3+ waves between seeds.
- **Damage per second.** The whole-run rate mostly measures how much there is to hit (early waves run out of targets), so the tables use **late DPS**: damage per second over the last three waves it played, in the full condition from wave 41, when there's always more Gloom than it can kill.
- **Leaks.** Every life lost is put down to one cause, the first that fits: boss, Veiled (alone, and it can't see Veiled), flyer (it can't hit flyers in that condition; always, for a Snare), shielded, healed by a Mender, armour (resists its damage type), hulk, otherwise sheer numbers.
- **Other map.** The extremes were rerun on Ashfork (Medium, alone and full, 3 seeds, with its own placement search). See the spot check below.
- **Beacon and Ember Vault** have no attack, so alone they measure nothing. As an extra (not part of the ranking), each was also tested beside a fixed partner: a Bolt Ward at tier 4 on the Twin-shot path with Ballista at tier 2, which hits flyers but can't see Veiled.

## The outliers

**Strongest alone: Shrapnel Storm (Longeye, Flak), Wild Hunt (Bolt Ward, Hunter's Mark), Thousand Bolts (Bolt Ward, Twin-shot)**: W1 about 50, E41 8-14. All three have no blind spot: the Longeye sees Veiled and hits flyers everywhere, and the two Bolt Wards hit flyers and see Veiled through the Hunter's Mark path (as their main path, or as the chosen second path). They lose to sheer numbers and, for the Bolts, to Husks (Kinetic does half damage to them). Their reveal and full results are identical to alone.

**Strongest in raw power: Starhost (Wandering Light, Swarm), Dawnbreaker (Prism, Focus), Lightweb (Prism, Refraction), Grand Battery (Mortar, Rapid Loader)**: full W1 55-59, E41 15-19, late DPS 7-12k against 5-11k for the alone leaders. In the plain game they rank 14th, 16th, 22nd and 23rd, because each has one blind spot that ends it early:
- Starhost (Wandering Light, Swarm), Dawnbreaker (Prism, Focus) and Lightweb (Prism, Refraction) can't see Veiled (Veiled Gloom start on wave 6).
- Grand Battery (Mortar, Rapid Loader) can't hit flyers (wave 9 on).

Starhost's jump from its tier 4 is the biggest of any (late DPS x7.9) but invisible alone (wave 13 at both tiers). In a real defence, where something else sees Veiled, these are probably the best tier 5s in the game.

**Weak from blind spots** (alone far below full):
- Veiled: Starhost (Wandering Light, Swarm), Dawnbreaker (Prism, Focus), Lightweb (Prism, Refraction), Falling Sky (Wandering Light, Hunter), Second Sun (Prism, Afterglow), Stormlord (Storm Coil, Overcharge), Ball Lightning (Storm Coil, Forking).
- Flyers: Grand Battery (Mortar, Rapid Loader), Worldbreaker (Mortar, Big Shells), Magma Heart (Mortar, Cinder), Permafrost (Rime Spire, Deep Freeze).
- Some of each: Eye of the Storm (Storm Coil, Static).

Worldpiercer (Bolt Ward, Ballista) is a case of its own: alone the search gave it the Hunter's Mark path as its second path just to see Veiled; with Veiled revealed it took Twin-shot instead, and went from wave 15 to 31.

**Weak from raw power** (low even in full):
- **Thornwall (Thornlight Snare, Caltrops), Constellation (Thornlight Snare, Flashmines), Seal of Dawn (Thornlight Snare, Binding Light)**: W1 9-10, E41 0. Every Snare dies on wave 10. The Gravemaw walks over them, and Gloomwings fly over them. They are road tools for a defence, not a defence.
- **Pall of Ash (Censer, Ash)**: W1 9. Also stopped by the Gravemaw. Its damage is mostly a debuff for other wards (Ash strips resistances), so alone it has little to show.
- **Dawnbringer (Wandering Light, Torchbearer)**: W1 12, late DPS about 400, the lowest of any attacking tier 5. A support tier 5 (the torch boosts other wards) on a weak attack.
- **Moth Queen (Moth Lantern, Moth-trap)**: W1 13. All its lost lives are Gloomwings, the flyers it's built to lure and burn. It goes from nearly nothing at tier 4 (wave 2) to wave 13, but that's still low.
- **Kingslayer (Longeye, Deadeye) and Eye of Fate (Longeye, Spotter)**: W1 18-20, E41 0. No blind spots, but neither handles a crowd. Kingslayer is a single-target boss and hulk killer. Eye of Fate mostly Dooms the 10 toughest enemies (+60% damage from everything) for other wards. Alone, a crowd of small Gloom gets past them.
- **Elder Wyrm (Censer, Dragon's Breath)**: W1 19. Alone its losses are all Veiled Wisps, but revealing them changes nothing (still 19), so the real limit is damage. Its late DPS is slightly *below* its tier 4, Dragon's Breath (0.9x): the only tier 5 that doesn't beat its own tier 4. Worth a closer look at whether its river of fire and its x2 flame reach the enemies as intended (not traced for this report).

**Small jumps from tier 4** (late DPS, tier 5 against tier 4): Elder Wyrm (Censer, Dragon's Breath) 0.9x, Magma Heart (Mortar, Cinder) 1.1x, Kingslayer (Longeye, Deadeye) 1.2x, Worldpiercer (Bolt Ward, Ballista) 1.2x, Phoenix (Censer, Pyre) 1.3x, Whiteout (Rime Spire, Blizzard) 1.5x, Permafrost (Rime Spire, Deep Freeze) 1.5x, Worldbreaker (Mortar, Big Shells) 1.5x. The design says 3-5x power for about 4.5x the cost. The big jumps are Moth Queen (Moth Lantern, Moth-trap) 15.7x (from almost nothing), Starhost (Wandering Light, Swarm) 7.9x, Lightweb (Prism, Refraction) 6.4x, Dawnbreaker (Prism, Focus) 4.8x and Thornwall (Thornlight Snare, Caltrops) 4.0x.

**No attack** (W1 2, the same as an empty map): Anthem of War (Beacon, War Drum), Worldlight (Beacon, Lighthouse), Golden Age (Beacon, Tithe), Dragon's Hoard (Ember Vault, Great Brazier), Ember Tide (Ember Vault, Gleaners), Second Heartfire (Ember Vault, Hearthwarm), False Moon (Moth Lantern, Bright Lure), Amber Trap (Moth Lantern, Flypaper). False Moon and Amber Trap only lure or glue flyers for other wards (a few hundred damage a second to flyers, and nothing on the road). Beside the partner Bolt Ward:
- **Anthem of War (Beacon, War Drum)** helps the most: the partner goes from wave 10 to 38 (25 with the reveal switch alone, so most of that is its second path, the Beacon's Lighthouse, giving sight). Its late DPS is 3.2x.
- **Worldlight (Beacon, Lighthouse)**: 10 to 29, through sight and range.
- **Golden Age (Beacon, Tithe), Dragon's Hoard (Ember Vault, Great Brazier) and Ember Tide (Ember Vault, Gleaners)** only make gold, which a fixed defence can't spend: 0 by construction.
- **Second Heartfire (Ember Vault, Hearthwarm)**: a small gain (25.7 to 30 with reveal), held back by the bug above.

## What might explain the gaps (observations only)

- **Veiled is the biggest divider.** From wave 6, a ward that can't see Veiled has a hard ceiling around wave 10-17 on its own, whatever its damage. The tier 5s that rank high alone are exactly the ones with sight built in (the Longeye itself, the Bolt Ward's Hunter's Mark path, the Rime Spire's Blizzard path through Frost Sight) or that pick a sight path as their tier 2 second path. The harness was free to choose the second path, and it chose a sight path wherever one was offered (Hunter's Mark for both other Bolt Ward paths, Blizzard for Avalanche, the Rime Spire's Shatter tier 5).
- **Flyers are the second.** Mortars, Rime Spires and Snares can't hit Gloomwings from wave 9. Grand Battery (Mortar, Rapid Loader) is a top-4 damage dealer that loses 80% of its lives to flyers.
- **Boss leaks are all-or-nothing in the campaign.** A boss that gets through costs everything left in it (the Bastion cost 150 lives, the whole bar), so a ward that is fine against the waves around it still loses on 10, 30 or 40. Whiteout (Rime Spire, Blizzard) loses every life on wave 30 to the Bastion, and everything else it leaked is nothing.
- **Single-target capstones look bad alone by nature.** Kingslayer (Longeye, Deadeye) and Eye of Fate (Longeye, Spotter) are made for bosses and hulks next to other wards. This test punishes them more than a real defence would.
- **Support capstones can't be measured alone**: the 3 Beacons, 3 Vaults, False Moon (Moth Lantern, Bright Lure) and Amber Trap (Moth Lantern, Flypaper). The partner table gives a first idea, but comparing them fairly needs a defence test, like `bot.js` with and without each one.
- **Some tier 5s add a mechanic more than power.** Elder Wyrm (Censer, Dragon's Breath), Magma Heart (Mortar, Cinder), Worldpiercer (Bolt Ward, Ballista), Phoenix (Censer, Pyre) and Kingslayer (Longeye, Deadeye) gain 0.9-1.3x late DPS. Their signature (the wyrm's river of fire, magma eruptions, the every-third colossal lance, the phoenix, a share of a hulk's health per shot) either doesn't fire often enough alone or doesn't add much damage. These are guesses from the numbers; the code wasn't traced.

## Caveats

- One ward alone is an unusual situation: support, debuff and single-target capstones are undervalued, and wards that cover everything are overvalued. The ranking answers "how much can this tier 5 do by itself", not "how good is it in a defence".
- Four candidate spots per ward, chosen by road coverage. A cleverer spot could do better for short-range wards. The Wandering Light's post is a spot like any other.
- Each ward keeps its default targeting (Longeyes on Strong); the bot's switching of Longeyes to First when flyers close in isn't used.
- Late DPS counts damage actually dealt. A huge hit on a 10-health Mote counts as 10, which is fair to how the game plays but is hard on single-target wards.

## Spot check on Ashfork

Ashfork is harder late on (its ramp is x1.4 by wave 40) and has two roads, so everything does a little worse. The picture holds:
- The weakest, the Snares, Pall of Ash (Censer, Ash), Dawnbringer (Wandering Light, Torchbearer) and Moth Queen (Moth Lantern, Moth-trap), land on the same waves.
- The blind-spot group, Starhost (Wandering Light, Swarm), Dawnbreaker (Prism, Focus), Lightweb (Prism, Refraction) and Grand Battery (Mortar, Rapid Loader), is still near the bottom alone and near the top in the full condition.
- The alone leaders stay the alone leaders.

The one change at the top: Shrapnel Storm (Longeye, Flak) drops the most (wave 50 to 35) and falls behind the two Bolt Wards (43), maybe because a map-wide ward on Strong spreads its fire over two roads. The table is at the end.

## Tables

### Ranking (hollowmere, Medium)

Ranked by the plain game (alone): W1 + E41. "Power" ranks the same 36 by the full condition (Veiled revealed and flyers targetable), i.e. raw damage with the blind spots removed. Late DPS and kills are from the full condition from wave 41 and the alone condition from wave 1. Cost is the ward plus tiers 1-5 and the secondary tier 2.

| # | Tier 5 | Ward (path) | Cost | Alone W1 | Alone E41 | Reveal W1 | Reveal E41 | Full W1 | Full E41 | Power # | Late DPS | Kills (alone W1) | 2nd path |
|--:|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|---|
| 1 | **Shrapnel Storm** | Longeye (Flak) | 26k | 49.7 | 14 | 49.7 | 14 | 49.7 | 14 | 5 | 11k | 150k | Deadeye |
| 2 | **Wild Hunt** | Bolt Ward (Hunter's Mark) | 21k | 50.7 | 10.3 | 50.7 | 10.3 | 50.7 | 10.3 | 7 | 6.9k | 150k | Twin-shot |
| 3 | **Thousand Bolts** | Bolt Ward (Twin-shot) | 23k | 49.7 | 8.3 | 49.7 | 8.3 | 49.7 | 8.3 | 8 | 5.3k | 146k | Hunter's Mark |
| 4 | **Avalanche** | Rime Spire (Shatter) | 25k | 39 | 7.7 | 39 | 7.7 | 39 | 9 | 11 | 6.6k | 110k | Blizzard |
| 5 | **Eye of the Storm** | Storm Coil (Static) | 26k | 39 | 5 | 45.3 | 6.7 | 45.3 | 6.7 | 10 | 4.4k | 111k | Overcharge |
| 6 | **Whiteout** | Rime Spire (Blizzard) | 22k | 29 | 7 | 29 | 7 | 29 | 8.7 | 17 | 3.8k | 54k | Shatter |
| 7 | **Phoenix** | Censer (Pyre) | 25k | 30.7 | 0 | 30.7 | 0 | 30.7 | 0 | 19 | 2.5k | 62k | Dragon's Breath |
| 8 | **Falling Sky** | Wandering Light (Hunter) | 26k | 17 | 7.7 | 51.7 | 10.7 | 51.7 | 10.7 | 6 | 5.5k | 14k | Swarm |
| 9 | **Second Sun** | Prism (Afterglow) | 27k | 17 | 6.7 | 47 | 6 | 47 | 6 | 9 | 4.2k | 14k | Refraction |
| 10 | **Stormlord** | Storm Coil (Overcharge) | 29k | 17 | 3 | 43.7 | 4 | 43.7 | 4 | 13 | 3.8k | 14k | Static |
| 11 | **Eye of Fate** | Longeye (Spotter) | 24k | 20 | 0 | 20 | 0 | 20 | 0 | 20 | 2.5k | 22k | Flak |
| 12 | **Elder Wyrm** | Censer (Dragon's Breath) | 26k | 19 | 1 | 19 | 1 | 19 | 1 | 21 | 2.1k | 20k | Pyre |
| 13 | **Kingslayer** | Longeye (Deadeye) | 27k | 18 | 0 | 18 | 0 | 18 | 0 | 22 | 5.6k | 18k | Flak |
| 14 | **Starhost** | Wandering Light (Swarm) | 24k | 13 | 4.7 | 59.3 | 19.3 | 59.3 | 19.3 | 1 | 10k | 8.0k | Hunter |
| 15 | **Magma Heart** | Mortar (Cinder) | 26k | 16 | 1.3 | 24.7 | 1 | 41.3 | 2.3 | 14 | 2.5k | 13k | Big Shells |
| 16 | **Dawnbreaker** | Prism (Focus) | 30k | 11.7 | 5 | 55 | 15.7 | 55 | 15.7 | 2 | 12k | 6.2k | Afterglow |
| 17 | **Permafrost** | Rime Spire (Deep Freeze) | 23k | 16 | 0 | 16 | 0 | 29 | 9 | 16 | 4.0k | 12k | Blizzard |
| 18 | **Worldpiercer** | Bolt Ward (Ballista) | 25k | 15 | 0 | 31.3 | 3.7 | 31.3 | 3.7 | 18 | 3.4k | 11k | Hunter's Mark |
| 19 | **Ball Lightning** | Storm Coil (Forking) | 28k | 10 | 4.7 | 29 | 9 | 29 | 9 | 15 | 4.7k | 4.2k | Overcharge |
| 20 | **Moth Queen** | Moth Lantern (Moth-trap) | 24k | 13 | 0 | 13 | 0 | 13 | 0 | 23 | 2.0k | 7.2k | Bright Lure |
| 21 | **Dawnbringer** | Wandering Light (Torchbearer) | 24k | 12 | 0 | 12 | 0 | 12 | 0 | 24 | 420 | 6.6k | Swarm |
| 22 | **Lightweb** | Prism (Refraction) | 28k | 10 | 1.7 | 55.3 | 15 | 55.3 | 15 | 3 | 7.1k | 4.6k | Focus |
| 23 | **Grand Battery** | Mortar (Rapid Loader) | 26k | 11 | 0 | 11 | 0 | 55 | 15 | 4 | 7.5k | 5.8k | Big Shells |
| 24 | **Worldbreaker** | Mortar (Big Shells) | 28k | 11 | 0 | 11 | 0 | 39 | 9 | 12 | 4.3k | 5.8k | Rapid Loader |
| 25 | **Constellation** | Thornlight Snare (Flashmines) | 25k | 9.7 | 0 | 9.7 | 0 | 9.7 | 0 | 25 | 2.1k | 4.2k | Binding Light |
| 26 | **Pall of Ash** | Censer (Ash) | 24k | 9 | 0 | 9 | 0 | 9 | 0 | 27 | 2.1k | 3.5k | Dragon's Breath |
| 27 | **Thornwall** | Thornlight Snare (Caltrops) | 23k | 9 | 0 | 9 | 0 | 9 | 0 | 26 | 2.2k | 3.5k | Flashmines |
| 28 | **Seal of Dawn** | Thornlight Snare (Binding Light) | 24k | 9 | 0 | 9 | 0 | 9 | 0 | 28 | 830 | 3.4k | Caltrops |
| 29 | **Anthem of War** | Beacon (War Drum) | 27k | 2 | 0 | 2 | 0 | 2 | 0 | 31 | - | 0 | Lighthouse |
| 30 | **Worldlight** | Beacon (Lighthouse) | 23k | 2 | 0 | 2 | 0 | 2 | 0 | 32 | - | 0 | Tithe |
| 31 | **Golden Age** | Beacon (Tithe) | 25k | 2 | 0 | 2 | 0 | 2 | 0 | 33 | - | 0 | War Drum |
| 32 | **False Moon** | Moth Lantern (Bright Lure) | 23k | 2 | 0 | 2 | 0 | 2 | 0 | 29 | 655 | 0 | Moth-trap |
| 33 | **Amber Trap** | Moth Lantern (Flypaper) | 21k | 2 | 0 | 2 | 0 | 2 | 0 | 30 | 640 | 0 | Moth-trap |
| 34 | **Dragon's Hoard** | Ember Vault (Great Brazier) | 24k | 2 | 0 | 2 | 0 | 2 | 0 | 34 | - | 0 | Gleaners |
| 35 | **Ember Tide** | Ember Vault (Gleaners) | 23k | 2 | 0 | 2 | 0 | 2 | 0 | 35 | - | 0 | Hearthwarm |
| 36 | **Second Heartfire** | Ember Vault (Hearthwarm) | 26k | 2 | 0 | 2 | 0 | 2 | 0 | 36 | - | 0 | Great Brazier |

`+`: some seed reached the 150-wave cap. `*`: some seed stalled (a wave still running after 900 s counts as a loss).

### Tier 5 against its tier 4 (same placement and secondary path)

| Tier 5 | Tier 4 | Cost T4 -> T5 | Alone W1 T4 -> T5 | Alone E41 T4 -> T5 | Full W1 T4 -> T5 | Full E41 T4 -> T5 | Late DPS T4 -> T5 | DPS x |
|---|---|--:|--:|--:|--:|--:|--:|--:|
| Shrapnel Storm (Longeye, Flak) | Flak Curtain | 6.6k -> 26k | 27 -> 49.7 | 0 -> 14 | 27 -> 49.7 | 0 -> 14 | 3.5k -> 11k | 3.1 |
| Wild Hunt (Bolt Ward, Hunter's Mark) | Death Sentence | 5.0k -> 21k | 29.3 -> 50.7 | 1.7 -> 10.3 | 29.3 -> 50.7 | 1.7 -> 10.3 | 2.6k -> 6.9k | 2.7 |
| Thousand Bolts (Bolt Ward, Twin-shot) | Storm of Bolts | 5.4k -> 23k | 29 -> 49.7 | 1.3 -> 8.3 | 29 -> 49.7 | 1.3 -> 8.3 | 2.3k -> 5.3k | 2.4 |
| Avalanche (Rime Spire, Shatter) | Winter's Verdict | 5.8k -> 25k | 20 -> 39 | 4.7 -> 7.7 | 19 -> 39 | 4.7 -> 9 | 2.7k -> 6.6k | 2.4 |
| Eye of the Storm (Storm Coil, Static) | Ion Storm | 6.4k -> 26k | 9 -> 39 | 0 -> 5 | 23.3 -> 45.3 | 0 -> 6.7 | 2.1k -> 4.4k | 2.1 |
| Whiteout (Rime Spire, Blizzard) | Endless Winter | 5.4k -> 22k | 14 -> 29 | 0 -> 7 | 19 -> 29 | 1.3 -> 8.7 | 2.6k -> 3.8k | 1.5 |
| Phoenix (Censer, Pyre) | Wildfire | 6.1k -> 25k | 19 -> 30.7 | 0 -> 0 | 19 -> 30.7 | 0 -> 0 | 2.0k -> 2.5k | 1.3 |
| Falling Sky (Wandering Light, Hunter) | Comet | 6.2k -> 26k | 17 -> 17 | 0.7 -> 7.7 | 33.7 -> 51.7 | 1 -> 10.7 | 2.2k -> 5.5k | 2.5 |
| Second Sun (Prism, Afterglow) | Supernova | 7.0k -> 27k | 17 -> 17 | 0 -> 6.7 | 39 -> 47 | 0.3 -> 6 | 2.2k -> 4.2k | 1.9 |
| Stormlord (Storm Coil, Overcharge) | Smite | 7.0k -> 29k | 16 -> 17 | 0 -> 3 | 21.7 -> 43.7 | 0 -> 4 | 1.7k -> 3.8k | 2.2 |
| Eye of Fate (Longeye, Spotter) | Eye in the Dark | 6.2k -> 24k | 16 -> 20 | 0 -> 0 | 16 -> 20 | 0 -> 0 | 801 -> 2.5k | 3.1 |
| Elder Wyrm (Censer, Dragon's Breath) | Dragon's Breath | 6.3k -> 26k | 9 -> 19 | 0 -> 1 | 9 -> 19 | 0 -> 1 | 2.3k -> 2.1k | 0.9 |
| Kingslayer (Longeye, Deadeye) | Headhunter | 7.0k -> 27k | 16 -> 18 | 0 -> 0 | 16 -> 18 | 0 -> 0 | 4.6k -> 5.6k | 1.2 |
| Starhost (Wandering Light, Swarm) | Starswarm | 5.9k -> 24k | 13.3 -> 13 | 0 -> 4.7 | 29 -> 59.3 | 0 -> 19.3 | 1.3k -> 10k | 7.9 |
| Magma Heart (Mortar, Cinder) | Inferno | 6.4k -> 26k | 11 -> 16 | 0 -> 1.3 | 27 -> 41.3 | 0 -> 2.3 | 2.3k -> 2.5k | 1.1 |
| Dawnbreaker (Prism, Focus) | Sunspear | 7.7k -> 30k | 10 -> 11.7 | 0 -> 5 | 24 -> 55 | 0 -> 15.7 | 2.6k -> 12k | 4.8 |
| Permafrost (Rime Spire, Deep Freeze) | Absolute Zero | 5.4k -> 23k | 9 -> 16 | 0 -> 0 | 9 -> 29 | 0 -> 9 | 2.6k -> 4.0k | 1.5 |
| Worldpiercer (Bolt Ward, Ballista) | Siege Lance | 5.8k -> 25k | 10.7 -> 15 | 0 -> 0 | 25.7 -> 31.3 | 3 -> 3.7 | 3.0k -> 3.4k | 1.2 |
| Ball Lightning (Storm Coil, Forking) | Maelstrom | 6.8k -> 28k | 9 -> 10 | 0 -> 4.7 | 9 -> 29 | 0 -> 9 | 2.9k -> 4.7k | 1.6 |
| Moth Queen (Moth Lantern, Moth-trap) | Thousand Moths | 5.9k -> 24k | 2 -> 13 | 0 -> 0 | 2 -> 13 | 0 -> 0 | 130 -> 2.0k | 15.7 |
| Dawnbringer (Wandering Light, Torchbearer) | Lamplighter | 6.0k -> 24k | 9.7 -> 12 | 0 -> 0 | 9.7 -> 12 | 0 -> 0 | 253 -> 420 | 1.7 |
| Lightweb (Prism, Refraction) | Kaleidoscope | 7.2k -> 28k | 10 -> 10 | 0 -> 1.7 | 18 -> 55.3 | 0 -> 15 | 1.1k -> 7.1k | 6.4 |
| Grand Battery (Mortar, Rapid Loader) | Barrage Battery | 6.2k -> 26k | 10 -> 11 | 0 -> 0 | 19 -> 55 | 1.3 -> 15 | 2.1k -> 7.5k | 3.6 |
| Worldbreaker (Mortar, Big Shells) | Cataclysm | 6.6k -> 28k | 10.7 -> 11 | 0 -> 0 | 25.7 -> 39 | 2.7 -> 9 | 2.9k -> 4.3k | 1.5 |
| Constellation (Thornlight Snare, Flashmines) | Starfield | 5.9k -> 25k | 9 -> 9.7 | 0 -> 0 | 9 -> 9.7 | 0 -> 0 | 1.3k -> 2.1k | 1.6 |
| Pall of Ash (Censer, Ash) | Ashen Brand | 5.9k -> 24k | 8.7 -> 9 | 0 -> 0 | 8.7 -> 9 | 0 -> 0 | 1.2k -> 2.1k | 1.7 |
| Thornwall (Thornlight Snare, Caltrops) | Iron Briar | 5.6k -> 23k | 9 -> 9 | 0 -> 0 | 9 -> 9 | 0 -> 0 | 559 -> 2.2k | 4.0 |
| Seal of Dawn (Thornlight Snare, Binding Light) | Lightbound | 5.7k -> 24k | 9 -> 9 | 0 -> 0 | 9 -> 9 | 0 -> 0 | 507 -> 830 | 1.6 |
| Anthem of War (Beacon, War Drum) | Warhorn | 7.0k -> 27k | 2 -> 2 | 0 -> 0 | 2 -> 2 | 0 -> 0 | - | - |
| Worldlight (Beacon, Lighthouse) | Pharos | 6.2k -> 23k | 2 -> 2 | 0 -> 0 | 2 -> 2 | 0 -> 0 | - | - |
| Golden Age (Beacon, Tithe) | Golden Hearth | 6.8k -> 25k | 2 -> 2 | 0 -> 0 | 2 -> 2 | 0 -> 0 | - | - |
| False Moon (Moth Lantern, Bright Lure) | Great Lure | 5.5k -> 23k | 2 -> 2 | 0 -> 0 | 2 -> 2 | 0 -> 0 | 74 -> 655 | 8.9 |
| Amber Trap (Moth Lantern, Flypaper) | Glue Trap | 5.3k -> 21k | 2 -> 2 | 0 -> 0 | 2 -> 2 | 0 -> 0 | 317 -> 640 | 2.0 |
| Dragon's Hoard (Ember Vault, Great Brazier) | Everburning Hearth | 6.3k -> 24k | 2 -> 2 | 0 -> 0 | 2 -> 2 | 0 -> 0 | - | - |
| Ember Tide (Ember Vault, Gleaners) | Harvest Moon | 6.0k -> 23k | 2 -> 2 | 0 -> 0 | 2 -> 2 | 0 -> 0 | - | - |
| Second Heartfire (Ember Vault, Hearthwarm) | Heart of the Hearth | 6.5k -> 26k | 2 -> 2 | 0 -> 0 | 2 -> 2 | 0 -> 0 | - | - |

### What broke it (lives lost by cause, % of all lives lost; from wave 1)

Each leak is put down to the first of: boss; Veiled (alone, and it can't see Veiled); flyer (it can't hit flyers, in the conditions that don't give it that); shielded (Aegis); healed (a Mender, or anything a Mender patched); armour (resists its damage type: Husks and the Bastion against Kinetic, Nullbacks against Arcane); hulk (Dreadhulk, Gloomcolossus); otherwise sheer numbers. "Top leaks" are the enemy types that cost it the most lives, alone from wave 1.

| Tier 5 | Alone | Reveal | Full | Top leaks (alone) |
|---|---|---|---|---|
| Shrapnel Storm (Longeye, Flak) | numbers 100% | numbers 100% | numbers 100% | gloomwing 73, veiled wisp 35, brood 29 |
| Wild Hunt (Bolt Ward, Hunter's Mark) | numbers 73%, armour 26% | numbers 73%, armour 26% | numbers 73%, armour 26% | brood 57, shambler 50, husk 38 |
| Thousand Bolts (Bolt Ward, Twin-shot) | armour 54%, numbers 26%, bosses 9%, hulks 8% | armour 54%, numbers 26%, bosses 9%, hulks 8% | armour 54%, numbers 26%, bosses 9%, hulks 8% | husk 81, shambler 17, brood 15 |
| Avalanche (Rime Spire, Shatter) | flyers 100% | flyers 100% | bosses 100% | gloomwing 137, veiled gloomwing 13 |
| Eye of the Storm (Storm Coil, Static) | numbers 39%, bosses 38%, veiled 13%, hulks 6% | hulks 59%, numbers 41% | hulks 59%, numbers 41% | hollowking 58, husk 27, brood 19 |
| Whiteout (Rime Spire, Blizzard) | bosses 100% | bosses 100% | bosses 100% | bastion 150 |
| Phoenix (Censer, Pyre) | bosses 67%, numbers 33% | bosses 67%, numbers 33% | bosses 67%, numbers 33% | bastion 100, husk 50 |
| Falling Sky (Wandering Light, Hunter) | veiled 100% | numbers 46%, hulks 36%, bosses 18% | numbers 46%, hulks 36%, bosses 18% | veiled wisp 81, veiled shambler 49, veiled skitter 20 |
| Second Sun (Prism, Afterglow) | veiled 100% | numbers 97% | numbers 97% | veiled wisp 128, veiled shambler 22 |
| Stormlord (Storm Coil, Overcharge) | veiled 100% | numbers 88%, hulks 11% | numbers 88%, hulks 11% | veiled wisp 129, veiled shambler 21 |
| Eye of Fate (Longeye, Spotter) | numbers 100% | numbers 100% | numbers 100% | veiled wisp 57, gloomwing 47, skitter 46 |
| Elder Wyrm (Censer, Dragon's Breath) | veiled 100% | numbers 100% | numbers 100% | veiled wisp 150 |
| Kingslayer (Longeye, Deadeye) | numbers 100% | numbers 100% | numbers 100% | gloomwing 79, skitter 48, shambler 13 |
| Starhost (Wandering Light, Swarm) | veiled 100% | numbers 62%, hulks 23%, bosses 14% | numbers 62%, hulks 23%, bosses 14% | veiled shambler 82, veiled wisp 39, veiled skitter 29 |
| Magma Heart (Mortar, Cinder) | flyers 93%, veiled 7% | flyers 100% | numbers 50%, bosses 33%, hulks 16% | gloomwing 139, veiled wisp 9, veiled shambler 2 |
| Dawnbreaker (Prism, Focus) | veiled 100% | numbers 100% | numbers 100% | veiled shambler 111, veiled skitter 38, veiled wisp 1 |
| Permafrost (Rime Spire, Deep Freeze) | flyers 73%, numbers 27% | flyers 73%, numbers 27% | bosses 85%, numbers 10%, shields 5% | gloomwing 110, husk 20, brood 14 |
| Worldpiercer (Bolt Ward, Ballista) | numbers 100% | numbers 69%, armour 31% | numbers 69%, armour 31% | shambler 79, brood 65, skitter 5 |
| Ball Lightning (Storm Coil, Forking) | veiled 100% | bosses 52%, numbers 44% | bosses 52%, numbers 44% | veiled shambler 81, veiled skitter 69 |
| Moth Queen (Moth Lantern, Moth-trap) | numbers 100% | numbers 100% | numbers 100% | gloomwing 150 |
| Dawnbringer (Wandering Light, Torchbearer) | numbers 90%, shields 10% | numbers 90%, shields 10% | numbers 90%, shields 10% | brood 63, shambler 60, aegis 16 |
| Lightweb (Prism, Refraction) | veiled 100% | numbers 95% | numbers 95% | veiled shambler 81, veiled skitter 69 |
| Grand Battery (Mortar, Rapid Loader) | flyers 81%, veiled 19% | flyers 100% | numbers 83%, shields 9% | gloomwing 122, veiled shambler 14, veiled skitter 14 |
| Worldbreaker (Mortar, Big Shells) | flyers 96% | flyers 100% | bosses 64%, numbers 25%, hulks 11% | gloomwing 144, veiled skitter 5, veiled shambler 1 |
| Constellation (Thornlight Snare, Flashmines) | flyers 59%, hulks 22%, bosses 19% | flyers 59%, hulks 22%, bosses 19% | flyers 59%, hulks 22%, bosses 19% | gloomwing 88, dreadhulk 33, gravemaw 29 |
| Pall of Ash (Censer, Ash) | bosses 76%, numbers 24% | bosses 76%, numbers 24% | bosses 76%, numbers 24% | gravemaw 114, skitter 30, brood 5 |
| Thornwall (Thornlight Snare, Caltrops) | bosses 57%, flyers 43% | bosses 57%, flyers 43% | bosses 57%, flyers 43% | gravemaw 86, gloomwing 64 |
| Seal of Dawn (Thornlight Snare, Binding Light) | bosses 52%, flyers 48% | bosses 52%, flyers 48% | bosses 52%, flyers 48% | gravemaw 78, gloomwing 72 |
| Anthem of War (Beacon, War Drum) | numbers 100% | numbers 100% | numbers 100% | skitter 90, mote 42, shambler 18 |
| Worldlight (Beacon, Lighthouse) | numbers 100% | numbers 100% | numbers 100% | skitter 90, mote 42, shambler 18 |
| Golden Age (Beacon, Tithe) | numbers 100% | numbers 100% | numbers 100% | skitter 90, mote 42, shambler 18 |
| False Moon (Moth Lantern, Bright Lure) | numbers 100% | numbers 100% | numbers 100% | skitter 90, mote 42, shambler 18 |
| Amber Trap (Moth Lantern, Flypaper) | numbers 100% | numbers 100% | numbers 100% | skitter 90, mote 42, shambler 18 |
| Dragon's Hoard (Ember Vault, Great Brazier) | numbers 100% | numbers 100% | numbers 100% | skitter 90, mote 42, shambler 18 |
| Ember Tide (Ember Vault, Gleaners) | numbers 100% | numbers 100% | numbers 100% | skitter 90, mote 42, shambler 18 |
| Second Heartfire (Ember Vault, Hearthwarm) | numbers 100% | numbers 100% | numbers 100% | skitter 90, mote 42, shambler 18 |

### Beacon and Ember Vault beside a partner

The partner is a Bolt Ward, Twin-shot tier 4 with Ballista 2 (hits flyers, can't see Veiled), on its best spot; the tier 5 stands right beside it. Best secondary path of the two shown. "Reveal" turns on the reveal switch for the partner.

| Tier 5 | 2nd path | Alone W1 | Alone E41 | Reveal W1 | Reveal E41 | Partner late DPS (reveal, E41) |
|---|---|--:|--:|--:|--:|--:|
| partner alone | - | 10 | 0 | 25.3 | 0 | 1.1k |
| Anthem of War (Beacon, War Drum) | Lighthouse | 38.3 | 4.7 | 38.3 | 4.7 | 3.5k |
| Worldlight (Beacon, Lighthouse) | War Drum | 29 | 0 | 29 | 0 | 2.2k |
| Golden Age (Beacon, Tithe) | Lighthouse | 26 | 0 | 26 | 0 | 1.4k |
| Dragon's Hoard (Ember Vault, Great Brazier) | Hearthwarm | 10 | 0 | 25.7 | 0 | 1.1k |
| Ember Tide (Ember Vault, Gleaners) | Hearthwarm | 10 | 0 | 25.7 | 0 | 1.1k |
| Second Heartfire (Ember Vault, Hearthwarm) | Gleaners | 11 | 0 | 30 | 0 | 1.1k |

### Spot check on ashfork (Medium)

| Tier 5 | Alone W1 (hollowmere -> ashfork) | Alone E41 | Full W1 | Full E41 |
|---|--:|--:|--:|--:|
| Shrapnel Storm (Longeye, Flak) | 49.7 -> 35 | 14 -> 4.3 | 49.7 -> 35 | 14 -> 4.3 |
| Wild Hunt (Bolt Ward, Hunter's Mark) | 50.7 -> 42.7 | 10.3 -> 4.3 | 50.7 -> 42.7 | 10.3 -> 4.3 |
| Thousand Bolts (Bolt Ward, Twin-shot) | 49.7 -> 43.3 | 8.3 -> 4.7 | 49.7 -> 43.3 | 8.3 -> 4.7 |
| Elder Wyrm (Censer, Dragon's Breath) | 19 -> 16 | 1 -> 0 | 19 -> 16 | 1 -> 0 |
| Starhost (Wandering Light, Swarm) | 13 -> 13 | 4.7 -> 4 | 59.3 -> 47.7 | 19.3 -> 6.7 |
| Dawnbreaker (Prism, Focus) | 11.7 -> 11 | 5 -> 4.3 | 55 -> 42.3 | 15.7 -> 5.7 |
| Moth Queen (Moth Lantern, Moth-trap) | 13 -> 14 | 0 -> 0.3 | 13 -> 14 | 0 -> 0.3 |
| Dawnbringer (Wandering Light, Torchbearer) | 12 -> 12.3 | 0 -> 0 | 12 -> 12.3 | 0 -> 0 |
| Lightweb (Prism, Refraction) | 10 -> 10 | 1.7 -> 1 | 55.3 -> 46.7 | 15 -> 6.7 |
| Grand Battery (Mortar, Rapid Loader) | 11 -> 10 | 0 -> 0 | 55 -> 46 | 15 -> 5.7 |
| Pall of Ash (Censer, Ash) | 9 -> 9 | 0 -> 0 | 9 -> 9 | 0 -> 0 |
| Thornwall (Thornlight Snare, Caltrops) | 9 -> 9 | 0 -> 0 | 9 -> 9 | 0 -> 0 |
| Seal of Dawn (Thornlight Snare, Binding Light) | 9 -> 9 | 0 -> 0 | 9 -> 9 | 0 -> 0 |


## Rerunning it

```
node tools/solo.js wander 1 cond=reveal start=1 seed=1   # one run, JSON out
node tools/t5study.js out=hollowmere.jsonl support=1            # everything above (~70 min here)
node tools/t5study.js out=ashfork.jsonl map=ashfork conds=alone,full tiers=5 paths=bolt:2,wander:1,...
node tools/t5report.js hollowmere.jsonl ashfork.jsonl           # the tables
```

`t5study.js` skips runs already in its output file, so it can be stopped and resumed. The raw
results (about 3,000 runs) aren't committed.
