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

