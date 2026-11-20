# Research: tier 5 capstones (and what they mean for endless)

Scope: how Bloons TD 6 and a handful of other tower defence games handle their top upgrade tier
(cost, power, limits, feel, look), and what endless/freeplay modes teach about scaling past it.
Written for adding a 5th tier to all twelve Hollowlight wards.

Builds on, and does not repeat:
- `docs/research-btd6.md` §4 (cost vs power by tier, crosspathing) and §5 (freeplay ramp table);
- `docs/research-other-td.md` §9 (endless scaling across games) and lesson 13;
- `docs/upgrade-visuals-research.md` §1 ("tier 5 is a trophy") and §2.5 (channels held back for tier 5).

Tags: numbers marked **[V]** were read from the wiki's data tables (Bloons Wiki, Medium difficulty,
fetched 20 Nov 2026). **(approx.)** means estimated or not verified at source.

---

## Summary: recommendations for Hollowlight

1. **Price tier 5 at about 4-5x the ward's tier 4 (about 16k-23k gold).** BTD6's median is 6.2x
   tier 4, but Hollowlight's tier 4 is already steep (4.8x tier 3, against BTD6's 3.4x), so 4-5x
   lands the whole ladder in the same place. The working-tree draft (4.4-4.5x, 16,000-22,500) sits
   inside this range.
2. **A tier 5 should cost about a third of all the gold the campaign pays.** In BTD6 the median
   tier 5 costs 34% of the cash a game has paid by round 80. Hollowlight pays ~61k by wave 40, so
   about 20k is the matching price. With that price, a strong player's first tier 5 lands in the Long
   Night (waves 35-40). After that, one more every 4-6 endless waves.
3. **Power: about 3-5x the tier 4's output on its main verb, plus one new verb.** BTD6 tier 5s
   are 3-7x their tier 4 (Tack Zone ~3.3x, Grandmaster Ninja ~6.4x, Cripple MOAB 4.7x damage).
   Keep power per gold at tier 5 about level with tier 4 (`report.js` eff ~1.6-2.4), not rising
   again. The one-per-path cap already makes it special.
4. **Keep BTD6's limit: one of each tier 5 (per ward type and path) on the map.** That allows up to
   three tier 5s per ward type and 36 in all. The crosspath stays at "one path to 5, a second to 2".
   This is what `uniqueTier5` in the draft does. It is verified BTD6 behaviour and the
   community understands it.
5. **No sacrifices, merges or Paragons for now.** BTD6's Sun Temple, Beast Handler and Paragon
   mechanics are late, complex additions. Leave room for a "tier 6 merge" later, as the visuals doc
   already leaves room above tier 4.
6. **Every tier 5 gets one signature mechanic from a small menu:** a new attack form, map-wide reach,
   a permanent version of a timed effect, an upgraded ward ability, an aura or buff to other wards,
   a last-stand save, or economy. Most BTD6 tier 5s pick exactly one (§2).
7. **Use the ward's tier 4 ability as the tier 5 lever on at least one path per ward.** Many BTD6
   tier 5s simply upgrade the tier 4 ability: Absolute Zero, Glue Storm, Homeland Defense, Grand
   Saboteur. Hollowlight already unlocks one ability per ward type at tier 4.
8. **Show the tier 5 before it can be bought.** Once tier 4 is owned, show the tier 5 button with
   its name, price and a "saved so far" fill, plus a silhouette on hover. A fifth pip should look
   different (a crown or star). If the tier 5 is blocked by the limit, say so and offer to jump to
   the ward that holds it.
9. **Buying a tier 5 should be the biggest moment in the game short of a boss.** Use a named banner
   ("Worldpiercer awakens"), the tier 4 light pillar made larger and whiter, a silhouette flash from
   the old form to the new, a unique sound, and a lingering ground sigil. Keep it all in the UI and
   render layers; it must never pause or slow the simulation.
10. **Visuals: a second form, not a bigger tier 4.** Use the channels reserved in
    `upgrade-visuals-research.md` §2.5: transformation, pure-white highlights and full saturation,
    up to ~76 px, a companion, and one motif borrowed from another path. Each tier 5 also needs a
    cheap crowd version of its effect (`Renderer.quality`).
11. **Endless today runs away at about 16% more health per wave, while gold grows about 5%.** Wave 41
    holds about 1.9x the health of wave 40 (the finale). By wave 50 it is 7.5x, by wave 60 31x. Gold
    paid so far grows only 1.6x and 2.6x over the same waves. Speed also jumps by a third at wave 55.
    That gap, not any one number, is why bots stall by waves 44-48 (§6).
12. **Make total enemy health grow about 6-9% per wave for the first 20 endless waves.** That is
    budget growth times toughness growth combined, so about 1-4% faster than the player's gold.
    Steepen it only after that. BTD6 gives 20 gentle rounds (+2% per round, added on, not
    compounded) after its "win" round before it ramps.
13. **Remove the wave 40→41 cliff.** Start endless at wave 40's actual health (×1.0-1.1), not at a
    budget built from the heaviest enemies.
14. **Cap the overall speed multiplier (about 1.6x) and add speed in small steps.** A +25% or +50%
    speed modifier cuts every ward's time on target at once, which reads as a wall.
15. **Alternate "different" and "harder" endless modifiers, and let tier 5s answer them.** Examples:
    Veiled hulks against a tier 5 that reveals the map, Mending against a tier 5 that scorches.
    Shrink punishment rather than adding health: BTD6 freeplay cuts lives lost per leak and turns
    extra bloons into health to stop lag.

---

## 1. Cost: how much the top tier costs, and when players can afford it

### 1.1 BTD6 tier 4 → tier 5 for ten towers [V]

Medium prices. "Total" is the 5-0-0 / 0-5-0 / 0-0-5 total including the tower. Data from each
tower's "Costs and sell values" table and the upgrade list (sources at the end).

| Tower (base) | Path 1 T4 → T5 (ratio) | Path 2 T4 → T5 (ratio) | Path 3 T4 → T5 (ratio) |
|---|---|---|---|
| Dart Monkey ($200) | Juggernaut 1,800 → Ultra-Juggernaut 15,000 (8.3x), total 17,660 | Super Monkey Fan Club 7,200 → Plasma Monkey Fan Club 45,000 (6.2x), 53,140 | Sharp Shooter 2,050 → Crossbow Master 21,500 (10.5x), 24,615 |
| Boomerang ($315) | M.O.A.R Glaives 2,000 → Glaive Lord 32,500 (16.2x) | Turbo Charge 4,200 → Perma Charge 35,000 (8.3x) | MOAB Press 2,700 → MOAB Domination 50,000 (18.5x) |
| Ice Monkey ($400) | Embrittlement 2,300 → Super Brittle 28,000 (12.2x) | Snowstorm 4,750 → Absolute Zero 21,000 (4.4x) | Icicles 2,750 → Icicle Impale 30,000 (10.9x) |
| Glue Gunner ($225) | Bloon Liquefier 5,000 → The Bloon Solver 22,500 (4.5x) | Glue Strike 4,500 → Glue Storm 16,000 (3.6x) | Relentless Glue 4,000 → Super Glue 24,000 (6.0x) |
| Sniper ($350) | Maim MOAB 6,300 → Cripple MOAB 32,000 (5.1x) | Supply Drop 7,600 → Elite Sniper 12,000 (1.6x) | Full Auto Rifle 4,100 → Elite Defender 14,900 (3.6x) |
| Ninja ($400) | Bloonjitsu 2,750 → Grandmaster Ninja 35,000 (12.7x) | Bloon Sabotage 5,200 → Grand Saboteur 22,000 (4.2x) | Sticky Bomb 5,000 → Master Bomber 40,000 (8.0x) |
| Alchemist ($550) | Stronger Stimulant 2,850 → Permanent Brew 48,000 (16.8x) | Transforming Tonic 4,200 → Total Transformation 45,000 (10.7x) | Rubber to Gold 2,750 → Bloon Master Alchemist 40,000 (14.5x) |
| Super Monkey ($2,500) | Sun Temple 100,000 → True Sun God 500,000 (5.0x), total 627,000 | Tech Terror 25,000 → The Anti-Bloon 70,000 (2.8x) | Dark Champion 55,555 → Legend of the Night 165,650 (3.0x) |
| Banana Farm ($1,250) | Banana Research Facility 19,000 → Banana Central 115,000 (6.1x) | IMF Loan 7,200 → Monkey-Nomics 100,000 (13.9x) | Central Market 15,000 → Monkey Wall Street 70,000 (4.7x) |
| Monkey Village ($1,200) | Primary Mentoring 2,500 → Primary Expertise 25,000 (10.0x) | Call to Arms 20,000 → Homeland Defense 40,000 (2.0x) | Monkey City 3,000 → Monkeyopolis 5,000 (needs farms in range) |

Across **all 78 BTD6 paths** (the wiki's upgrade data table) [V]:

| Ratio | Lower quartile | **Median** | Upper quartile | Range |
|---|---|---|---|---|
| T4 / T3 | 2.3x | **3.4x** | 4.9x | |
| T5 / T4 | 4.1x | **6.2x** | 10.8x | 1.6x (Elite Sniper) to 19.6x (Bloon Crush) |
| T5 / (T1+T2+T3+T4) | 2.8x | **4.7x** | 6.1x | |
| T5 price | $25,000 | **$33,750** | $46,125 | $5,000 (Monkeyopolis) to $500,000 (True Sun God) |

Patterns:
- **Tier 5 is where the money goes.** The median tier 5 costs nearly five times everything before
  it. One purchase is the whole decision; the earlier tiers are the run-up.
- **Low tier 5 ratios follow expensive tier 4s,** usually ability or support tier 4s that are already
  priced as late-game buys: Call to Arms ($20k → 2.0x), Tech Terror (2.8x), Supply Drop (1.6x).
  High ratios follow cheap, early-game tier 4s (Juggernaut, M.O.A.R Glaives, Stronger Stimulant).
  The tier 5 price follows the **late-game value** of the result, not a fixed multiplier.
- **Economy tier 5s are the dearest** (Banana Central $115k, Monkey-Nomics $100k, Wall Street
  $70k) and pay back over many rounds: Banana Central yields $7,000 a round, about 16 rounds to
  repay [V for income, payback derived].
- **Meta gate as well as cash:** in BTD6 a tier 5 must first be unlocked with tower XP from earlier
  games. The median is 35,000 XP, against 11,500 for tier 4 and 2,500 for tier 3; Paragons need about
  750,000 [V]. Hollowlight has no meta-progression, so it only needs the in-game gold gate.

### 1.2 When BTD6 players can afford one

Cumulative cash from pops plus end-of-round bonuses, Medium, not counting the $650 start, farms or
other income [V, from the wiki round table]:

| Round | 30 | 40 | 50 | 60 | 70 | 80 | 100 | 140 |
|---|---|---|---|---|---|---|---|---|
| Cash so far | $8.3k | $17.5k | $38.3k | $55.1k | $71.3k | $98.3k | $179.6k | $349.5k |

- A median tier 5 ($33.75k, ~$40k with its earlier tiers) equals all the money paid by about
  round 50. In practice, while also building a defence, the first tier 5 without farming lands
  around **rounds 60-80** (approx.). With farms it comes much earlier, and community advice is
  that several tier 5s by round 100 is normal (approx.).
- Medium's "win" is round 60 and Hard's is round 80. **A tier 5 is a late-campaign and
  freeplay purchase**, rarely needed to win a normal game.

### 1.3 Hollowlight today

| | Base | T1 | T2 | T3 | T4 | T4/T3 | Base+T1-T4 |
|---|---|---|---|---|---|---|---|
| Range | 150-500 | 80-200 | 200-400 | 650-1,200 | 3,600-5,000 | 3.3-5.6x (median 4.8x) | 4.7k-7.2k (median 5.7k) |

Gold paid (pops plus clear rewards, all waves cleared; my model of `RULES` and `sim/endless.js`):
~37k by wave 30, ~48k by 35, **~61k by 40**, ~100k by 50, ~161k by 60.

Applying BTD6's ratios:
- At BTD6's T5/T4 median (6.2x), tier 5 would cost ~28k. At its T5/(T1..T4) median (4.7x) it
  would be ~27k. That is ~45% of the whole campaign's gold, which makes it endless-only.
- At "34% of the gold paid by the end of the campaign" (BTD6's median T5 against round 80) it
  would cost **~20k**.
- **Recommendation: 4-5x tier 4, so 16k-23k.** Price support and economy tier 5s at the top of
  that range, and tier 5s that only finish crowds faster at the bottom. A 20k tier 5 is affordable
  around waves 33-38 for a player who saves for it. That makes it a Long Night decision, not a
  wave-25 rush. Let `tools/bot.js` check that no campaign build needs one.

---

## 2. Power: how much stronger, and what kind of stronger

### 2.1 Tier 4 → tier 5 power in BTD6

Worked from the wiki's upgrade descriptions [V for the stat changes; the multipliers are mine]:

| Tier 5 | Change from its tier 4 | Rough main-attack multiplier |
|---|---|---|
| Grandmaster Ninja | 5 → 8 shurikens, damage 1 → 2, attack cooldown halved | ~6.4x |
| The Tack Zone | 16 → 32 tacks, ~+67% attack speed, +range | ~3.3x |
| Inferno Ring | 3.15x attack speed, more damage and pierce, plus a seeking meteor attack | ~3-5x, plus a new attack |
| Cripple MOAB | bullet damage 30 → 140, a 10-target explosion, crippled MOABs take +5 from everything | ~4.7x, plus a team debuff |
| Crossbow Master | 2 bolts per shot, damage 6 → 8, pierce 5 → 8, crit 80 every 5th shot | ~3-4x (approx.) |
| Ultra-Juggernaut | pierce 60 → 210, splits twice into 6 balls, much higher Ceramic, Fortified and Lead damage | 5x+ against its targets (approx.) |
| Perma Charge | permanent 5x attack speed and +3 damage (tier 4 had a 10 s ability) | ~10x+ sustained (approx.) |
| Absolute Zero | every attack freezes all bloons on screen; the ability freezes all types and speeds up all Ice Monkeys | a change in kind |
| Elite Sniper | x2.5 attack speed, and +33% speed for **every** Sniper on the map | ~2.5x itself, plus a team buff |

**Ballpark: a tier 5 is 3-7x its tier 4 on the main verb,** for a median 6x the price. So BTD6's
power per dollar is roughly flat from tier 4 to tier 5, sometimes worse. A tier 5 earns its price
three ways. It packs a lot of power into one map slot. It adds a capability the tier 4 lacks
(stunning MOABs, map-wide reach, permanence). And there is the fantasy. `research-btd6.md` §4
estimates "~100x+ base", consistent with 3-7x a 10-30x tier 4.

Hollowlight's tier 4s run at ~40-70x the base ward in crowds (`node tools/report.js`), about 5x
tier 3. **Target tier 5 at ~3-5x tier 4 (~150-300x base) for 4-5x the price.** That keeps report.js
"eff" level with tier 4 or slightly above. Beyond that, a tier 5 should *solve* things, not only
multiply them.

### 2.2 Signature mechanic categories (BTD6 examples, all [V] from the upgrade text)

| Category | What it does | BTD6 examples |
|---|---|---|
| **New attack form** | replaces or adds an attack | Glaive Lord (3 orbiting glaives shred anything close), Inferno Ring (meteors), Wizard Lord Phoenix (a permanent phoenix sub-tower; the ability turns the wizard into a Lava Phoenix) |
| **Map-wide reach** | infinite range, or affects everything on screen | Bloon Master Alchemist (infinite-range shrink potion turns bloons into Reds), Primary Expertise (infinite-range Mega Ballista), Master Bomber (infinite-range sticky bombs), Absolute Zero |
| **Permanence** | a timed tier 4 effect becomes permanent | Perma Charge, Permanent Brew (Berserker Brew lasts for ever) |
| **Ability upgrade** | the tier 4 ability gets bigger, longer or more frequent | Glue Storm (glues the whole screen every second for 20 s), Grand Saboteur (30 s, MOABs spawn with 25% less health), Homeland Defense (+100% speed and pierce for all monkeys, 20 s), MOAB Eliminator (ability cooldown 30 → 10 s), Plasma Monkey Fan Club (19 Dart Monkeys become Plasma Monkeys) |
| **Team aura or buff** | makes other towers better | Elite Sniper (all snipers faster), Prince of Darkness (buffs all Necromancers), Total Transformation (turns 5 nearby towers into monsters), Cripple MOAB (+5 damage taken from all sources) |
| **Last-stand save** | triggers when lives would be lost | Bomb Blitz (Bomb Storm clears all but the biggest bloons), Legend of the Night (black hole: no lives lost for 8 s, twice a round), Elite Defender (4x attack speed on losing lives) |
| **Economy** | cash or lives | Banana Central ($7,000 a round), Monkey Wall Street (+$4,000 and 15 lives a round), Monkey-Nomics (debt-free $9,000 ability) |
| **Borrowed motifs** | gains the other paths' signatures | Archmage gains Dragon's Breath and Shimmer from the other two paths |

Lessons:
- **One headline mechanic per tier 5,** stated in one sentence (BTD6's in-game blurbs are one line).
- **Many of BTD6's best-loved tier 5s change the rules,** not only the numbers: "freezes all bloons
  everywhere", "no lives lost for 8 s", "permanent". Choose at least one rule-changer per ward.
- **Guard the scalers.** Execution and percentage damage make the endless health ramp meaningless.
  Hollowlight already excludes hulks and bosses from Death Sentence; keep that rule for every tier
  5. BTD6 does the same: shrink potions cost extra pierce on MOABs, freezes skip BADs and bosses.
- **Last-stand tier 5s suit Hollowlight's lives.** They turn a sudden loss into a recoverable
  moment, which `research-other-td.md` §11.4 already wants.

---

## 3. Limits: uniqueness, sacrifices and merges

### 3.1 BTD6 [V]
- **One of each tier 5 at a time:** "Only one of each tier 5 upgrade can exist at the same time".
  There are exceptions (Crossbow Master with the Master Double Cross knowledge, Ice Monkeys with
  the hero Silas). In Co-op each player may have one of each. When one exists, the other tower of
  that type shows a "max upgrades" box in place of the tier 5 (approx.; the wiki notes a screenshot
  of this is still wanted).
- **Crosspath** stays 5-2-0: the second path still caps at tier 2.
- **Requirement tier 5s:** Monkeyopolis needs a Banana Farm in range, and it absorbs farms. The
  Beast Handler's top beasts (Megalodon, Giganotosaurus, Pouākai) need three more tier 4 beast
  handlers merged in.
- **Sacrifice (Sun Temple → True Sun God):** upgrading sacrifices every tower in range (not
  Paragons or heroes), and the sacrificed categories add attacks. The **Vengeful True Sun God**
  needs $50,000 of sacrifices in each of the four categories, plus a separate Anti-Bloon and Legend
  of the Night elsewhere on the map, which it then absorbs. It is a whole-game project costing
  well over $1M.
- **Paragon (a "tier 6"):** needs all three tier 5s of the tower on the map at once, and absorbs
  every tower of that type. A Degree (1-100) comes from the cash, tier 5s, damage dealt and totems
  absorbed. Prices run from $150k (Apex Plasma Master) to $900k (Goliath Doomship), with one of each
  Paragon at a time. Introduced in version 27, years after launch.
- **Achievements** mark the milestones: "Big Monkey" (deploy a tier 4) and "Mega Monkey" (deploy
  a tier 5).

### 3.2 Other games

| Game | Top tier | Limit or gate | Takeaway |
|---|---|---|---|
| **Bloons TD 5** [V] | 2 paths × 4 tiers (one path to 4, the other to 2). T4 / T3 median 4.2x, T4 / (T1-T3) 2.6x. E.g. Temple of the Monkey God $100,000 after Sun God $16,500; Super Monkey Fan Club $8,000 after Triple Darts $330 | tier 4 locked behind player rank; freeplay from round 86 | BTD6's tier 5 is BTD5's tier 4 with one more step. The steep last-tier price is a series constant |
| **Kingdom Rush** (1) | level 4 is a choice between two specialised towers, then **abilities bought in battle in 2-3 ranks** | the first ability rank is dearest (Arcane Wizard: Death Ray 350/200/200, Teleport 300/100/100); abilities 1,250 on top of an 800-gold tower | the capstone is bought **in pieces**, and the abilities cost more than the tower |
| **KR Vengeance / Alliance** | special abilities only on the final tier | tower types picked before a stage | the top tier is where the *verbs* live |
| **KR Genesis** (2026) | a new "ultimate" ability per tower, unlocked through a meta Level System | Ironhide calls it "aspirational by design ... something to aim for, not a tax you have to pay" | **design the capstone as optional mastery**, never a requirement |
| **Infinitode 2** | XP levels: ability picks at 4 and 7, a fourth at 10. At level 20 choose **the unique ultimate or ×1.1 power** | the ultimate is earned by the tower fighting (XP), not bought; research raises the caps | a "veterancy" gate. The ×1.1 alternative shows the ultimate is about identity, not raw numbers |
| **Arknights** (approx., not re-verified) | Elite 2 promotion: new full illustration, higher level cap; 6-star operators unlock a third skill | material grind outside battle | the top promotion's reward is largely **art and a new verb** |

**For Hollowlight:** the BTD6 rule (one per ward type and path) is the right default. It keeps
36 capstones in play, forces a varied endgame, and players already know it from BTD6. Skip
sacrifice and merge mechanics for now; they belong to a later "tier 6" if one is ever wanted. An
optional idea from Infinitode 2: require a ward to have broken N layers before its tier 5 unlocks
("battle-hardened"). That rewards keeping wards alive, but adds UI and bot work; not recommended
for the first pass.

---

## 4. Feel: anticipation, purchase and identity

What the sources show:
- **Anticipation comes from visibility plus a long save.** BTD6's panel always shows each path's
  *next* upgrade with its name, icon and price, and greys out what can't be bought. A tier 5 becomes
  visible only once its tier 4 is owned, and the long save then becomes a goal (approx. for the
  exact UI states). KR shows locked ability ranks with prices on the tower ring.
- **The purchase moment in BTD6 is mostly the model swap and the first attack.** I could not
  verify a tier-5-specific sound in BTD6; upgrade sounds and effects appear to be shared, with
  cosmetic "Upgrade FX" sold separately. The Paragon creation (towers merging into one) is the
  game's true ceremony. **So there is room to do better than BTD6.**
- **Identity:** BTD6 tier 5s are named characters (True Sun God, Legend of the Night) with their own
  portraits, mentioned in the victory notation ("5-2-0") and achievements. Players plan runs around
  "which tier 5 this game".

Recommendations (UI and render layers only; the simulation never waits):
1. **Panel:** with tier 4 owned, the tier 5 button shows its name, price, a one-line blurb and a
   fill bar of gold saved. Its frame looks different: gilded, with a slow shimmer. Hover or Shift
   shows the numbers (as now) **and a small silhouette of the tier 5 form**. The fifth pip is a
   crown or star, not a dot.
2. **Blocked by the limit:** "Only one Worldpiercer at a time" plus a "Show" link that selects
   the holder. Blocked by the crosspath: reuse the existing 'cap' message.
3. **Purchase:**
   - **Light:** the tier 4 pillar, made wider, whiter and longer.
   - **The change:** a quick white silhouette flash from the old form to the new.
   - **Ground:** a ring of light runs out across the ground.
   - **Banner:** the tier 5 name in the boss-banner style.
   - **Sound:** a distinct low-then-bright sting.
   - **Afterwards:** a permanent small ground sigil under the ward, so tier 5s can be found at a glance.
4. **Stay readable:** at most one tier 5 fanfare plays at a time (queue them), and none in
   `Renderer.quality` 0 beyond the flash and the banner.
5. **Record it:** count tier 5s bought in the run summary and endless record ("Best wave 58 · 3
   capstones"); show them in the wave-end and defeat screens.

---

## 5. Look: how tier 5 differs from tier 4

BTD6 examples [V from the upgrade text and model descriptions; visual detail approx.]:
- **Transformation, a second form:** Sun Temple becomes a building that replaces the monkey; True
  Sun God becomes a floating god; Wizard Lord Phoenix turns the wizard into a Lava Phoenix (on its
  ability); the Vengeful True Sun God gets a darker model with "Vengeful" sub-avatars.
- **A signature effect around the body:** Glaive Lord's three orbiting glaives; Inferno Ring's ring
  of fire and meteors; Absolute Zero's screen-wide freeze.
- **A companion with its own behaviour:** Wizard Lord Phoenix's permanent phoenix; Prince of
  Darkness's Undead MOABs and BFBs.
- **Borrowed motifs:** Archmage casts Dragon's Breath and Shimmer from the other paths. Paragons
  merge all three tier 5s into one model.
- **Colour and light:** tier 5s and Paragons use the strongest glow, glowing eyes and a new
  palette (see `upgrade-visuals-research.md` §1).

Hollowlight already reserved these channels (`upgrade-visuals-research.md` §2.5). Apply them as a
checklist for each tier 5:
1. **Second form:** the ward itself changes, not just its weapon. The path shape (Might / Many /
   Craft) must still read in silhouette.
2. **Top values:** pure-white highlights and full saturation in the ward's *damage colour* (no path
   colours on the battlefield).
3. **Height:** up to ~76 px (the base is ~46, tier 4 ~68). `tools/wards.mjs` needs a tier 5 cap,
   and the 30% gear-over-body rule still applies.
4. **One signature effect** that is visible when idle (orbiters, a halo, a sigil) and a bigger one
   when it attacks. Both need a crowd version (baked sprite, fewer particles) for quality 1 and 0.
5. **Optionally, one borrowed cue** from another path (Archmage-style), kept small.
6. **Both skins, always:** each tier 5 drawn in Kindlings and Lanterns, and the solid-black
   silhouette check (§2.6 of the visuals doc) run across tiers 4 and 5.

---

## 6. Late game and endless

### 6.1 BTD6 freeplay [V, from the wiki's Freeplay page]

| From round | MOAB-class health (multiplier added each round, not compounded) | Speed (all bloons) | Cash per pop |
|---|---|---|---|
| 51 | – | – | 50% |
| 61 | – | – | 20% |
| 81 | +2% per round (x1.02 → x1.40 at 100) | +2% per round (x1.40 at 100) | (86+) 10% |
| 101 | +5% per round (x1.45 → x2.75) | jumps to x1.60, then +2% per round | 5%, then 4% at 121 |
| 126 | +15% per round (→ x6.50 at 150) | | 2% from 141 |
| 151 | +35% per round (→ x41.5 at 250) | jumps to x3.00 | |
| 251 / 301 / 401 / 501 | +100% / +150% / +250% / +500% per round | jumps at 201 (x4.50) and 252 (x6.00) | |

Other freeplay rules:
- From round 81, ordinary bloons release only one child, and Ceramics become 60-health Super
  Ceramics. This **turns numbers into health** to limit lag.
- **Leaks cost fewer lives** in freeplay: a ZOMG costs 14,160 instead of 16,656, a Ceramic 65
  instead of 104.
- From round 150, stun, slow and knockback durations shrink (-10% per 50 rounds, down to -50%).
- XP falls to 10% after round 100. From round 141, rounds are random (bar 163, 200 and 263).
- **BTD5** used the same shape: MOAB health +2% per round from 86 to 115, then +5%. Speed began at
  103.

How it feels:
- **The gentle stretch: rounds 81-100.** Health grows by only 40% over 20 rounds, *added on, not
  compounded*. Players build their tier 5s and Paragons here, so they feel they are pulling ahead.
- **The wall: the steps.** Speed jumps at 101, 151, 201 and 252, and the health increments get
  steeper at 101, 126 and 151. Players describe those rounds as the end, not the gradual ramp.
  Late freeplay is also notorious for lag (`research-other-td.md` §11).
- **Income runs out by design:** cash per pop falls to 2%. In late freeplay power comes from what
  was already built and from abilities, and health and speed outgrow it.

### 6.2 Lessons from other games and devlogs
- **Walls come from steps, hard caps and multipliers stacking, more than from a smooth curve.**
  Examples: a sudden difficulty jump players noticed around waves 25-30 in Tower Dominion; a level
  cap that became an endless-mode bottleneck; The Perfect Tower II's Era Shield, which divides
  damage by ~50-60x and which critics call a "hard wall".
- **Health keeps scaling; other threats should not scale with it.** The Core Defense developer
  let enemy health grow forever but held enemy damage back, and tuned the health ramp both ways
  over several patches.
- **Exponential health of 5-8% a wave is standard** (GemCraft ~8.2%). Polynomial for the first ~10
  endless waves, then exponential, avoids an early wall (`research-other-td.md` §9).
- **Variety beats raw health** for interest: modifiers every few waves, themed waves, elites
  instead of more bodies (Brotato, GemCraft, Rogue Tower in the other doc).

### 6.3 Hollowlight endless, measured

My model of today's code (`data/waves.js` TOUGH/PACE, `sim/endless.js`, `RULES.popGold`). Health
is only scaled on tough types, as `sim/enemies.js` does; shields are not counted:

| Wave | 30 | 35 | **40** | **41** | 45 | 50 | 55 | 60 | 70 |
|---|---|---|---|---|---|---|---|---|---|
| Wave health ÷ wave 40 | 0.40 | 0.77 | **1.0** | **1.9** | 3.3 | 7.5 | 15 | 31 | 128 |
| Gold paid so far (k) | 37 | 48 | **61** | 65 | 78 | 100 | 126 | 161 | 272 |
| Speed multiplier | 1.05 | 1.10 | 1.15 | 1.17 | 1.23 | 1.30 | **1.72** | 1.81 | **2.40** |

Why it runs away:
- **Two compounding ramps stack:** the endless budget grows **9%** a wave *and* tough enemies gain
  **6%** health a wave. Together that is ~1.155x a wave, doubling every ~4.8 waves.
- **The player's power follows the gold they have spent,** which grows ~5% a wave in waves 41-60.
  The gap of ~10% a wave compounds to ~1.6x every 5 waves. That matches bots going from holding to
  losing within 4-8 endless waves (bots reach 44-48).
- **A cliff at wave 41:** the endless budget (26k pops, weighted to colossi and dreadhulks) is
  ~1.9x the health of the finale wave 40, and of wave 39.
- **Speed steps:** 'Swift' (+25%) at 55 and 'Frenzy' (+50%, replacing Swift) at 70 stack on the
  +1.5% a wave. Each step cuts every ward's time on target at once.
- **Modifiers only ever add difficulty, and they stack for ever.** Armoured shells double the
  health of two types at wave 60, on top of everything else.

### 6.4 Endless principles for Hollowlight (with tier 5 in mind)

1. **Budget the squeeze, not the health.** Choose a target for "threat ÷ the player's power". For
   example: +2-4% a wave for waves 41-60, +6% for 61-80, then steeper. Pick budget and toughness
   growth to hit it, given income. Concretely, total health about +6-9% a wave in 41-60 (budget
   ~+4%, toughness ~+3%, or apply only one of the two), instead of +16%.
2. **Start at wave 40, not above it.** Wave 41 should hold about 1.0-1.1x wave 40's health; ease
   the enemy mix towards the endless shares over ~5 waves.
3. **Give 15-20 gentle waves in which tier 5s arrive,** as BTD6 does with rounds 81-100. With the
   gold above, a player buys tier 5s at roughly waves 38, 45, 50 and 55. Each one should *visibly*
   push the defence ahead before the squeeze returns.
4. **Increments that grow, not steps.** If the ramp has to steepen, raise the increment, as BTD6's
   health brackets do. Avoid one-wave jumps in health, speed or count. Spread 'Swift' and 'Frenzy'
   over 5 waves each, and cap the total speed multiplier at about 1.6x, so it can't erase every
   ward's time on target.
5. **Alternate "different" and "harder" modifiers,** and let some lapse or rotate. Examples:
   Veiled hulks, then a rest wave; Mending, then a tithe bonus wave. Make sure each tier-5 rule-changer
   has a modifier it shines against (reveal against Shadows, scorch against Mending, stun against
   Frenzy). Each modifier should ask for a different tier 5.
6. **Keep the scalers bounded** so tier 5s don't trivialise late endless. Execution, percentage
   health and permanent stuns must exclude hulks and bosses, or be capped per second.
   BTD6 shortens stun, slow and knockback durations from round 150; a milder version (say -2% per
   endless wave past 60, floor -40%) keeps control wards useful without stalling the game for ever.
7. **Keep income meaningful through the tier 5 window.** The 0.03 pop-gold floor plus the 9%
   budget means income already grows; if the budget slows, raise the clear reward so the gold for
   the 2nd-4th tier 5s still arrives by waves ~45-55.
8. **Convert numbers into health, never the reverse** (BTD6 Super Ceramics; Hollowlight already
   promotes at 450 spawns). That protects the frame rate as tier 5 effects add their own load.
9. **Soften punishment as health climbs:** consider BTD6's lower lives per leak in freeplay, and a
   last-stand tier 5 (§2.2), so one cracked Dreadhulk doesn't end a long run in a single frame.
10. **Measure it:** add an endless gap readout to `tools/bot.js`: health per wave ÷ cumulative gold,
    and the wave reached with 0, 1 and 3 tier 5s. Aim for a strong bot that reaches ~wave 60 and a
    gradual slide in path progress, not hold-then-collapse.

---

## Sources

Bloons TD 6 and 5 (Bloons Wiki; data read through the MediaWiki API, Medium difficulty):
- Tower pages, including "Costs and sell values" and the upgrade lists:
  https://www.bloonswiki.com/Dart_Monkey_(BTD6), https://www.bloonswiki.com/Boomerang_Monkey_(BTD6),
  https://www.bloonswiki.com/Ice_Monkey_(BTD6), https://www.bloonswiki.com/Glue_Gunner_(BTD6),
  https://www.bloonswiki.com/Sniper_Monkey_(BTD6), https://www.bloonswiki.com/Ninja_Monkey_(BTD6),
  https://www.bloonswiki.com/Alchemist_(BTD6), https://www.bloonswiki.com/Super_Monkey_(BTD6),
  https://www.bloonswiki.com/Banana_Farm_(BTD6), https://www.bloonswiki.com/Monkey_Village_(BTD6),
  https://www.bloonswiki.com/Tack_Shooter_(BTD6), https://www.bloonswiki.com/Wizard_Monkey_(BTD6),
  https://www.bloonswiki.com/Bomb_Shooter_(BTD6)
- All 78 paths (the `btd6_upgrades` data table behind): https://www.bloonswiki.com/List_of_upgrades_in_BTD6
- Tier 5 uniqueness, requirement upgrades, Paragons in brief: https://www.bloonswiki.com/Upgrade
- Paragons: https://www.bloonswiki.com/Paragon
- Vengeful True Sun God and temple sacrifices: https://www.bloonswiki.com/Vengeful_True_Sun_God
- Freeplay rules (BTD5 and BTD6): https://www.bloonswiki.com/Freeplay
- Round RBE and cash table: https://www.bloonswiki.com/List_of_rounds_in_BTD6
- Achievements "Big Monkey" and "Mega Monkey" (`btd6_achievements` table): https://www.bloonswiki.com/Achievements_(BTD6)
- BTD5 upgrade prices (`btd5_upgrades` table): https://www.bloonswiki.com/List_of_upgrades_in_BTD5
- Upgrade FX cosmetics: https://www.bloonswiki.com/Upgrade_FX

Kingdom Rush, Infinitode 2 and others:
- Arcane Wizard prices: https://wikily.gg/kingdom-rush/towers/arcane-wizard
- Kingdom Rush Genesis Level System and ultimates (Ironhide, 18 June 2026): https://www.ironhidegames.com/News/Details/487
- KR Genesis upgrade trees: https://wikily.gg/kingdom-rush-6-genesis/tower-upgrades
- Final-stage abilities in Vengeance and Alliance: https://kingdomrushtd.fandom.com/wiki/Category:Ranged_Towers
- Infinitode 2 levels and ultimates: https://infinitode-2.fandom.com/wiki/Towers
- Arknights promotion materials (Elite 2 detail not verified): https://arknights.wiki.gg/wiki/Elite_material

Endless scaling commentary:
- Core Defense, "Endless Finetuning": https://ehmprah.itch.io/core-defense/devlog/171713/endless-finetuning-181
- Tower Dominion difficulty jump (Steam): https://steamcommunity.com/app/3226530/discussions/0/567001570938471463
- Max tower level as the endless bottleneck (patch notes): https://steamdb.info/patchnotes/12156071
- The Perfect Tower II Era Shield: https://shapes.inc/fandom/the-perfect-tower-ii/deep-dive

Hollowlight figures: `public/js/data/towers.js`, `data/rules.js`, `data/waves.js`, `sim/endless.js`,
`node tools/report.js`, and a small read-only script modelling wave health and gold.
