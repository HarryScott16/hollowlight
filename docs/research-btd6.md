# Research: Why Bloons TD 6 feels powerful (and what Hollowlight can borrow)

Researched 2026-11-17 for Hollowlight (1 map, 4 wards, 10 waves, 1 boss). The playtest problem: "too hard,
towers feel weak, not enough damage, not satisfying." This document collects BTD6's concrete numbers and the
design reasoning behind them.

## Source notes and confidence tags

- **[V]** means verified this session against a source (URL given in the section or in Sources).
- **[D]** means derived by arithmetic from [V] numbers (for example RBE = sum of children + own HP).
- **(unverified)** means from memory of the game or wiki. Probably close, but patches change prices often,
  so treat these as ballpark only.
- Access problems: bloons.fandom.com returned HTTP 402, and bloonswiki.com, breezewiki and the Epic Games
  Store feature returned 403 or bot walls. Reddit could not be fetched. Most [V] numbers come from
  search-result excerpts of those wikis, from sarahs-btd6-site.onrender.com (a community guide), and from
  topper64.co.uk (a long-standing community income calculator).
- BTD6 prices change from patch to patch. Exact dollar values matter less than the **ratios**, and the
  ratios have stayed stable across patches.

---

## 1. Early-game power curve

### Starting conditions

| Item | Value | Tag |
|---|---|---|
| Starting cash (Easy, Medium, Hard) | $650 | [V] |
| Impoppable and CHIMPS | $650, but the game **starts at round 6**, which skips the trivial rounds | (unverified) |
| Round 1 | 20 Red bloons = 20 RBE, pays $20 in pops + $101 end-of-round | [V] |
| Income after round 4 (cumulative, wiki table) | $1,221 | [V] |
| Win condition (Easy / Medium / Hard / Impoppable) | round 40 / 60 / 80 / 100 | Easy = 40 [V], others (unverified) |

### Basic tower stats (Medium prices)

| Tower | Cost | Damage | Pierce | Attack interval | Range | Potential pops/s | Tag |
|---|---|---|---|---|---|---|---|
| Dart Monkey | $200 | 1 | 2 | 0.95 s | 32 | ~2.1 | cost, damage, pierce, interval [V]; range [D] from "Long Range Darts +8 = +25%" |
| Tack Shooter | $280 | 1 per tack, 8 tacks | 1 per tack | 1.4 s | ~23 (unverified) | ~5.7 (if all tacks hit) | [V] except range |
| Ninja Monkey | $400 | 1 | 2 (unverified) | ~0.7 s (unverified) | ~40 (unverified) | ~2.9 | cost [V]; sees Camo by default |
| Sniper Monkey | ~$350 (unverified) | 2 (unverified) | 1 | ~1.6 s (unverified) | infinite | ~1.25 (but full map) | |
| Super Monkey | $2,500 | 1 | 1 | 0.06 s (guide) / ~0.045 s (unverified) | ~50 (unverified) | ~17-22 | [V] guide |

**Key ratio:** Super Monkey costs **12.5x** a Dart Monkey and attacks about **16-20x** as often, so the
expensive tower is *more* cost-efficient, not less. BTD6 rewards saving up.

### What it means

- **Overkill is the norm early.** Round 1 is 20 RBE. One $200 Dart can deal about 2 pops/s. Three Darts
  (your whole $650) clear rounds 1-5 without trouble. The player starts out feeling *stronger than the
  wave* and stays that way until about round 20-30 on Medium (camo appears at round 24 [V], lead at 28 [V]).
- **The first upgrades are cheap and immediate.** Dart tier 1 is $90-$140 (unverified for most, see §4),
  less than the tower itself. The player can afford an upgrade after nearly every round, so every round
  ends with a visible power gain.
- **Pierce is the hidden multiplier.** Damage 1 with pierce 2 means one dart pops 2 bloons. Because bloons
  come in tight lines, pierce scales with crowd density, so it *feels* like more power the bigger the wave.
- Players typically feel "safe" once they have one tier-3 tower, around rounds 15-25 on Medium (unverified;
  community consensus).

---

## 2. Enemy layers and "popping"

### The layer chain (RBE = Red Bloon Equivalent = total hits to fully clear, ignoring HP > 1)

Every bloon *contains* weaker bloons. One hit removes the outer layer and spawns its child (or children)
in the same spot, which then keep moving.

| Bloon | Children on pop | Own HP | RBE | Speed (Red = 1) | Tag |
|---|---|---|---|---|---|
| Red | none | 1 | 1 | 1.0 | [V] RBE |
| Blue | 1 Red | 1 | 2 | 1.4 (unverified) | [D] |
| Green | 1 Blue | 1 | 3 | 1.8 (unverified) | [V] |
| Yellow | 1 Green | 1 | 4 | 3.2 (unverified) | [D] |
| Pink | 1 Yellow | 1 | 5 | 3.5 (unverified) | [D] |
| Black | 2 Pink | 1 | 11 | 1.8 (unverified) | [V] |
| White | 2 Pink | 1 | 11 | 2.0 (unverified) | [D] |
| Purple | 2 Pink | 1 | 11 | 3.0 (unverified) | [D] |
| Lead | 2 Black | 1 | 23 | 1.0 (unverified) | [D] |
| Zebra | 1 Black + 1 White | 1 | 23 | 1.8 (unverified) | [D] |
| Rainbow | 2 Zebra | 1 | 47 | 2.2 (unverified) | [D] |
| Ceramic | 2 Rainbow | **10** | **104** | **2.5** | [V] |
| Super Ceramic (round 81+) | 1 Rainbow | 60 | 68 | 2.5 | [V] |

Speed reference: Red = 25 units/s (from the Ceramic page: 62.5 u/s = 2.5x Red) [V].

The speed column is the part that matters most for design: **inner layers are often FASTER than outer
ones** (Pink 3.5 inside Black 1.8; Ceramic children Rainbow 2.2). Popping a slow tough bloon releases a
burst of fast weak ones. That is a second test placed right behind the first, which is why a tower that can
"chip" a Ceramic still needs back-up.

### Why layering feels good

1. **Every hit is a visible event.** In most TDs a hit just moves a health bar. In BTD6 *every* point of
   damage on a non-Ceramic bloon produces a pop, a sound, a colour change, and often a split. A wave of
   20 Pinks is 100 visible pop events.
2. **Splitting multiplies targets for pierce.** One Black (11 RBE) becomes 2 Pinks, then 2 Yellows, and so
   on. High-pierce towers get *more* value as the wave splits, so AoE and pierce feel explosive.
3. **The colours are a legible health bar.** Ninja Kiwi describes the colours as an "accidental success":
   they "proved ideal for indicating hit points and special properties" in chaotic play (Epic Games Store
   feature; quoted via search result, page blocked direct fetch).
4. **Enemies get weaker as they near the exit.** By the time a bloon has been hit several times it is a
   fast but 1-HP Red or Blue. A leak often feels like "I almost had it", not "my towers did nothing".
5. **Only the heavy end has real HP.** Up to Rainbow, every bloon layer has 1 HP. Only Ceramics (10),
   Fortified layers (2x), and MOAB-class have meaningful HP. Up to round ~40, damage-per-hit barely matters
   and **pierce and attack rate dominate**. That keeps the early game simple and forgiving.

### Special properties (force tower variety, not raw stat checks)

| Property | Effect | First appears (Medium/normal roundset) | Counter | Tag |
|---|---|---|---|---|
| Camo | Untargetable unless tower has camo detection | Round 24 | Ninja (base), Dart/Sniper upgrades, support buffs | [V] round, [V] mechanic |
| Lead | Immune to sharp damage (darts, tacks, shurikens) | Round 28 | Explosives, fire, magic, "lead-popping" upgrades | [V] round; immunity list (unverified) |
| Purple | Immune to energy, fire, plasma, magic | Round 25 | Sharp and physical damage | [V] round; immunities (unverified) |
| Black | Immune to explosions | early 20s (unverified) | Non-explosive damage | (unverified) |
| White | Immune to freezing | early 20s (unverified) | Non-ice damage | (unverified) |
| Zebra | Black + White immunities | (unverified) | | (unverified) |
| Regrow | Regrows one layer about every 3 s after taking damage, up to its original type | ~round 15-20 (unverified) | Burst damage, kill zones | [V] (3 s) |
| Fortified | Double HP on Lead/Ceramic/MOAB-class (Lead goes to 4 HP) | Fortified MOAB on round 62 | Raw damage, "fortified damage" bonuses | [V] |

Design point: each property is a **binary gate**, not a stat. A single property says "you need ONE tower of
type X", not "you need 3x more damage". That turns difficulty into a *puzzle* (do I have camo coverage?)
instead of a *grind* (do I have enough DPS?). A missing counter is clearly the player's knowledge gap, and
feels fair. A 3x HP wall feels like the towers are weak.

Easy-mode difficulty in BTD6 is also purely cost and speed (15% cheaper, slower bloons). The *special
properties* are the same on every difficulty.

---

## 3. Economy

### Core formulas

| Item | Value | Tag |
|---|---|---|
| Cash per pop | $1 per layer popped (= $1 per RBE, ignoring Ceramic/MOAB HP) | [V] (topper64 calculator) |
| End-of-round bonus | **$100 + round number** (round 1 = $101) | [V] |
| Cash-per-pop rounds 1-50 | 100% | [V] |
| Rounds 51-60 | 50% | [V] |
| Rounds 61-85 | 20% | [V] |
| Rounds 86-100 | 10% | [V] |
| Rounds 101-120 | 5% | [V] (one source says 2% from 101; Chinese wiki says 4% at 121-140) |
| Rounds 121+ | 2% | [V] |
| Sell-back | 70% of total spent (unverified, standard across BTD games) | (unverified) |
| Impoppable/CHIMPS | CHIMPS disables all income except starting cash, pops, and end-of-round | [V] |

### Where the money comes from

End-of-round cash alone, from round 1 through round N = 100N + N(N+1)/2 [D]:

| By end of round | End-of-round bonus total [D] | Rough total cash incl. pops, no farms |
|---|---|---|
| 10 | $1,055 | ~$2,000-2,500 (unverified estimate) |
| 20 | $2,210 | ~$5,000-7,000 (unverified estimate) |
| 40 | $4,820 | ~$20,000-25,000 (unverified estimate) |
| 63 | $8,316 | ~$60,000-80,000 (unverified estimate) |
| 80 | $11,240 | ~$110,000-130,000 (unverified estimate) |
| 99/100 | $15,050 | **$177,374 by end of round 99** if you never buy anything (Steam forum claim) |

**Insight:** the round bonus is only ~8-10% of total income by round 100. **About 90% of money comes from
popping.** So in BTD6, killing things IS the economy. Strong towers pay for themselves and snowball. That
creates a positive feedback loop ("I pop more, so I get more, so I upgrade, so I pop more"). The
cash-per-pop tax after round 50 exists to cap that snowball in the late game.

### Farms (Banana Farm)

| Tier | Effect | Cost (Medium) | Tag |
|---|---|---|---|
| Base | 4 bananas x $20 = $80/round | ~$1,250 (unverified) | [V] for bananas |
| T1 Increased Production | 6 bananas = $120/round | ~$500 (unverified) | [V] for 6 |
| T2 Greater Production | 8 bananas = $160/round ($200 with Valuable Bananas) | $600 | [V] |
| T3 Banana Plantation | 16 bananas = $320/round | $3,000 | [V] |
| T4 Banana Research Facility | 5 crates x $300 = $1,500/round | ~$19,000 (unverified) | [V] for crates |

The payback period is about **13-17 rounds** for a base farm or a Plantation [D]. Farms are a deliberate
"invest now, be weaker now" decision. The pop tax after round 50 makes farms relatively stronger later.
The general lesson: **income towers create a risk-reward choice, but Hollowlight with 10 waves cannot
amortise a 15-round payback.** Any economy tower would need a 2-3 wave payback.

---

## 4. Upgrade pricing vs power

### The system

- Every tower has **3 paths x 5 tiers** = 15 upgrades. You may buy up to tier 5 in one path and up to
  tier 2 in a second; the third path stays locked ("crosspath"). For example 5-2-0, 2-0-4 [V] (Wikipedia).
- Prices are rounded to the nearest $5 from a Medium base price [D from listed prices].

| Difficulty | Price multiplier | Dart Monkey | Ninja Monkey | Lives | Tag |
|---|---|---|---|---|---|
| Easy | 0.85 | $170 | $340 | 200 | [V] prices, [V] lives |
| Medium | 1.00 | $200 | $400 | 150 | [V] prices, lives [V] (event ruleset) |
| Hard | 1.08 | $215 | $430 | 100 | [V] |
| Impoppable | 1.20 | $240 | $480 | 1 | [V] prices; lives (unverified) |

### Representative upgrade costs (Medium)

Dart Monkey ($200 base)

| Path | T1 | T2 | T3 | T4 | T5 |
|---|---|---|---|---|---|
| Top (pierce) | Sharp Shots $140 (+1 pierce) | Razor Sharp Shots $200 [V] (+2 pierce) | Spike-o-pult $300 [V] (big rolling spike, high pierce) | Juggernaut $1,800 [V] | Ultra-Juggernaut ~$15,000 (unverified) |
| Middle (speed) | Quick Shots ~$100 | Very Quick Shots ~$190 | Triple Shot ~$400 | Super Monkey Fan Club ~$8,000 (ability) | Plasma Monkey Fan Club ~$40,000-45,000 |
| Bottom (range/crit) | Long Range Darts ~$90 (+8 range) | Enhanced Eyesight ~$200 (camo) | Crossbow ~$625 | Sharp Shooter ~$2,000 | Crossbow Master ~$21,500 |

(Middle and bottom paths unverified except the +8 range for Long Range Darts. Sharp Shots was $140 in a
2019 snapshot [V].)

Tack Shooter ($280 base): paths roughly Faster Shooting $150 → Even Faster $300 → Hot Shots $600 →
Ring of Fire $3,500 → Inferno Ring ~$45,000; and More Tacks $100 (8→10 tacks [V]) → Even More Tacks →
Tack Sprayer (16 tacks per volley [V]) → Overdrive → The Tack Zone ~$24,000 (prices unverified).

Ninja Monkey ($400 base [V]): Ninja Discipline $350 [V] → Sharp Shurikens $350 [V] → Double Shot ~$850
(unverified) → Bloonjitsu $2,750 [V] → Grandmaster Ninja ~$35,000 (unverified).

Super Monkey ($2,500 base [V]): Laser Blasts $2,000 [V] → Plasma Blasts $2,500 [V, Fandom snippet;
older versions differ] → Sun Avatar $20,000 [V] → Sun Temple ~$100,000 (unverified) → True Sun God
(requires sacrifices) ~$500,000+ (unverified).

Wizard Monkey (~$375 base, unverified): Guided Magic ~$150 → Arcane Blast ~$600 → Arcane Mastery
~$1,300 → Arcane Spike ~$10,900 → Archmage ~$32,000 (all unverified).

Sniper Monkey (~$350 base, unverified): Full Metal Jacket ~$350 (pops lead, 4 dmg) → Large Calibre
~$1,300 (7 dmg) → Deadly Precision ~$2,500 (20 dmg, ceramics in one shot) → Maim MOAB ~$5,600 →
Cripple MOAB ~$32,000 (all unverified).

### Cost vs power curve (the important part)

| Tier | Typical cost as multiple of base tower | Typical power vs base | Feel |
|---|---|---|---|
| T1 | 0.5-0.75x | +25-50% (one stat bump) | "Small treat after a round" |
| T2 | 0.5-1x | +50-100% cumulative, often adds a capability (camo, lead) | "Fixes a problem" |
| **T3** | 1.5-3x | **~3-6x base**, new attack visuals | **"Power spike"** |
| T4 | 6-15x | ~10-30x base; often adds an ability | "Carries a phase" |
| T5 | 50-200x | ~100x+ base; transforms the tower | "Endgame fantasy" |

(Ratios [D] from the prices above; power multiples are community estimates, unverified.)

**Why tier 3 is the spike:** T1 and T2 are cheap stat bumps that a player can buy round by round. T3
costs about 1.5-3x the base tower, but it changes the *verb*: Spike-o-pult turns darts into a rolling
spike with ~18+ pierce (unverified), Bloonjitsu throws 5 shurikens, and Deadly Precision one-shots
Ceramics. The upgrade pays off visually as well as numerically: new projectile, new sound, new behaviour.
Players save up for it, so it lands as a reward. T4 and T5 escalate the same way. **Power per dollar
increases with tier**, which encourages committing to a few strong towers rather than spamming base
towers.

**Why the crosspath limit works:** it keeps the build space readable (each tower has about 30 legal builds)
while forcing a real choice. The tier-2 crosspath gives cheap utility (camo, lead, +range) without
competing with the main path. Players get to "solve" a gap without throwing away their investment.

Paragons (consume one tier-5 of each path plus other copies of that tower) are the ultimate "line goes
up" fantasy [V] (Wikipedia).

---

## 5. Round difficulty ramp

### Sample rounds (normal roundset, Medium)

| Round | RBE | Composition / note | Tag |
|---|---|---|---|
| 1 | 20 | 20 Red | [V] |
| 5 | ~60-80 | Reds and Blues in groups | (unverified) |
| 10 | ~100-150 | Many Blues, Greens | (unverified) |
| 20 | ~300-400 | Yellows, Pinks, first Blacks | (unverified) |
| 24 | | **First Camo** | [V] |
| 25 | | **First Purple** | [V] |
| 28 | | **First Lead** | [V] |
| 30 | ~800-1,000 | Leads, Zebras, Rainbows | (unverified) |
| 40 | **616** | **First MOAB** (a single MOAB), $381 pops + $140 bonus | [V] |
| 50 | ~3,000-4,000 | Mass Ceramics + MOABs | (unverified) |
| 60 | ~3,164 | **First BFB** (a single BFB) | [V] first BFB; RBE [D] |
| 63 | **14,413** | 75 Lead + 122 Ceramic: a famous "Ceramic rush" | [V] |
| 80 | ~17,000-20,000 | **First ZOMG** | [V] first; RBE (unverified) |
| 90 | ~1,000+ | **First DDT** (fast, camo, lead, black properties) | [V] first |
| 100 | 55,760 BAD base, but HP x1.4 by r100 | **First BAD** | [V] |

"Hard" rounds per community: 55, 63, 75, 78, 89, 95, 96, 98, 99 [V].

Composition ramps in this order: **quantity → speed (Yellow, Pink) → multi-child (Black, White) → special
properties (camo 24, purple 25, lead 28) → HP (Ceramic) → MOAB-class tanks (40, 60, 80) → combined
(fortified, camo regrow, DDT)**. Each new threat appears **alone first** (round 40 is a single MOAB,
round 60 a single BFB), as a teaching moment, before it appears in groups.

### Freeplay scaling (round 81+)

| Rule | Value | Tag |
|---|---|---|
| Super Ceramics | 60 HP (not 10), only 1 child; other non-MOAB bloons also release only 1 child | [V] |
| MOAB-class HP ramp, rounds 81-100 | +2% per round (x1.02 at 81 → x1.40 at 100) | [V] |
| Rounds 101-124 | +5% per round (x1.45 → x2.60) | [V] |
| Rounds 125-150 | +15% per round (x2.75 → x6.50) | [V] |
| Rounds 151-250 | +35% per round (x6.85 → x41.5) | [V] |
| Rounds 251-300 / 301-400 / 401-500 / 501+ | +15% / +150% / +250% / +500% per round | [V] |
| Speed | +2% per round from 81, plus one-time jumps of +18% (r101), +40% (r151), +50% (r201), +48% (r252) | [V] |
| Example | Bloons at 398% speed at r200, 450% at r201 | [V] |

The ramp is **additive (linear increments of base HP)**, not compound, up to round 250 [D from the
endpoints]. It is gentle for 20 rounds after the "win" round and then becomes a wall. Freeplay is designed to
end eventually.

---

## 6. MOAB-class (bosses within normal rounds)

| Blimp | HP | Children | RBE | Speed | Tag |
|---|---|---|---|---|---|
| MOAB | 200 | 4 Ceramic | 616 | 1.0 | [V] |
| BFB | 700 | 4 MOAB | 3,164 | 0.25 | [V] |
| ZOMG | 4,000 | 4 BFB | 16,656 | 0.18 | [V] |
| DDT | 400 | 4 camo-regrow Ceramic (unverified exact children) | 816 | 2.75 | [V]; camo, lead and black properties |
| BAD | 20,000 (28,000 at r100) | 2 ZOMG + 3 DDT | 55,760 | 0.18 | [V] |
| Fortified versions | 2x HP (f-MOAB 400, f-BFB 1,400, f-ZOMG 8,000, f-BAD 40,000) | same | | | [V] |

RBE check [D]: MOAB = 4x104 + 200 = 616. BFB = 4x616 + 700 = 3,164. ZOMG = 4x3,164 + 4,000 = 16,656.
BAD = 2x16,656 + 3x816 + 20,000 = 55,760. **Exactly recursive.**

**The cascade:** a ZOMG's own HP (4,000) is only **24%** of its RBE. The other 76% arrives as children.
Killing the blimp is not the end: it is a "piñata" that bursts into 4 BFBs, then 16 MOABs, then 64
Ceramics, then 128 Rainbows... thousands of pop events from one enemy. That makes the kill feel huge
(screen fills with debris and pops) and also tests AoE behind the single-target DPS. Blimps are slow
(0.18-0.25), so the player has time to watch the big health bar drop. Blimps also visibly **degrade**
(damage states and cracks as HP drops; unverified detail) so progress is legible.

### Boss events (Bloonarius, Lych, Vortex, Dreadbloon, Phayze, Blastapopoulos)

- Bosses appear every 20 rounds starting at round 40 (tiers 1-5 at roughly 40/60/80/100/120); all 5 tiers
  must be beaten before round 140 [V].
- Normal and Elite versions. Elite unlocks after Normal tier 5 [V].
- **Skulls on the health bar:** reaching a skull threshold triggers a phase event (Bloonarius spawns a big
  wave of bloons in front of itself) [V]. Bloonarius also spills bloons every 1% HP lost [V].
- Normal Bloonarius tier 1: about 20,000 HP (guide, single source) [V-ish].
- Design point: **skulls turn one long HP bar into 3-4 short goals with dramatic moments**, and the boss
  "fights back" with spawns rather than just tanking.

---

## 7. Abilities and heroes

### Activated abilities

| Ability (example) | Cooldown | Effect | Tag |
|---|---|---|---|
| General rule | **Starts at 33% of its cooldown** when bought (so it's usable almost immediately) | | [V] |
| Absolute Zero (Ice T5) | 25 s | Freezes all bloons on screen for 10 s | [V] |
| MOAB Assassin (Bomb T4) | 30 s | One heavy missile at the strongest blimp | [V] |
| MOAB Eliminator (Bomb T5) | 40 s (per source; may be off by patch) | Instantly kills anything below ZOMG, 2,000 dmg to ZOMG/BAD | [V] snippet |
| Turbo Charge (Boomerang T4) | ~45 s cooldown, ~10 s duration (unverified) | Huge attack speed boost | (unverified) |
| Super Monkey Fan Club (Dart T4) | ~50 s cooldown, ~15 s duration (unverified) | Nearby Darts turn into Super Monkeys | (unverified) |

Abilities come at **tier 4** for most towers, so each big purchase adds a "button to press in an
emergency". Short cooldowns (25-60 s, about 1 round) mean the player uses them every round or two. They
give the player a skill expression lever and the fantasy of "saving the run with one click". The 33%
starting cooldown means a freshly bought ability can be used *right now*, so the purchase pays off at
once.

### Heroes

- One hero per game. Levels 1-20 automatically from XP earned each round. You can also spend cash to
  level up faster [V] (Wikipedia: "levels up over time or can be strengthened with in-game money").
- Each level adds a stat bump, and some levels (typically 3, 10, 20) add abilities or big transformations
  (unverified).
- Tower XP (meta-progression) per round: 40 XP for round 1, +20 per round to round 20, +40 per round
  21-50, +90 per round 51-80 [V]. Map difficulty bonus 0/10/20/30% [V].
- Design point: the hero gives **free power growth without spending**, so the player is never stuck
  feeling flat even on a tight round.

---

## 8. Pacing

| Item | Value | Tag |
|---|---|---|
| Lives | Easy 200, Medium 150, Hard 100, Impoppable/CHIMPS 1 | Easy [V], Medium [V via event ruleset], Hard [V], 1 life (unverified) |
| Leak cost | **Lives lost = RBE of what leaks** (usually). Super Ceramic leak = 65 lives (75 fortified) | [V] |
| MOAB leak | 616 lives = instant loss on any normal difficulty (unverified that it's exactly RBE in BTD6) | [D] |
| Lives regen (MK Restoration-type) | +10 per round if none lost, capped at start +150 | [V] |
| Round length | ~15-45 s early, up to ~1-2 min late (unverified) | (unverified) |
| Fast forward | One toggle, 3x speed (unverified) | (unverified) |
| Next round | Player starts each round manually; can start the next round while the current one is still on screen ("send early"), stacking waves. Auto-start option. | (unverified details) |
| Bloon speed by difficulty | Easy slower; Hard about 15% faster | [V] |

Pacing lessons:
- **Leaks cost lives proportional to what leaked.** A leaked Red costs 1 of 150 lives (0.7%). Early
  mistakes are *nearly free*. The player learns without losing the run.
- **The player controls when each round starts.** No timer pressure between rounds means time to plan
  upgrades, which makes the shop moment rewarding rather than stressful. Fast-forward and sending early
  let strong players skip "won" rounds, so overpowered moments are *shortened*, not wasted.

---

## 9. Feedback and juice

(Mostly (unverified) observation; few hard numbers available.)

- **Pop event per layer:** every layer removed plays a small pop sound and a burst sprite. Sounds are pooled
  and throttled so 100 pops in a frame sound like a satisfying "crackle", not noise.
- **On-screen counts:** early rounds have 20-60 bloons. Mid-game rounds push 100-300. Rounds like 63 send
  ~200 heavy bloons (75 Lead + 122 Ceramic [V]) that split into **thousands** of visible children
  (each Ceramic → 2 Rainbows → 4 Zebras → ...). Late towers fire tens of projectiles per second.
- **Overkill visuals:** high-tier towers have deliberately exaggerated projectiles (sun beams, flaming
  rings, huge rolling spikes). Projectiles are big, bright and slow enough to be seen.
- **Upgrade moment:** each upgrade changes the tower model at T3/T4/T5 and plays a sound; the player sees
  the purchase in the world.
- **Ceramic/MOAB damage states:** Ceramics show cracks, blimps show visible damage. Players can read
  "nearly dead" without a health bar.
- **Cash ticks with every pop:** the cash counter rises continuously during the round, so killing feels
  directly rewarding.
- Ninja Kiwi on the original appeal: what is most engrossing is "what happens after that initial shot",
  when you watch the other balloons react (Epic Games Store feature, via search excerpt).

Why mass popping feels good: many small, quick rewards (pops plus cash) rather than a few slow ones. Each
pop is a tiny "you did that" confirmation. Cascades make one shot produce many events. The density lets
pierce and AoE upgrades show off their value visibly.

---

## 10. Other observations (design commentary)

- "It's fun and friendly, so it's accessible, but under the surface it's quite complicated." Stephen
  Knightly, NZ Game Developers Association (Wikipedia) [V].
- **CHIMPS** mode (no Continues, Hearts lost, Income outside pops, Monkey Knowledge, Powers, Selling) is
  praised as the "real" strategy test [V]. Normal modes are generous by design and the hardcore challenge
  is opt-in.
- **Monkey Knowledge** (permanent meta-upgrades) means players get slightly stronger between runs [V].
  This is a safety net for difficulty.
- The game was announced with an "extensive balance and test period" emphasis [V].
- Community commentary (unverified paraphrase): "Every tower feels useless at tier 0 and godlike at
  tier 5." The fun is the *journey along the curve*. Building one "carry" tower and watching it solo a
  round is a commonly cited highlight.
- Difficulty is mostly expressed through **cost and lives**, not enemy HP: Easy (0.85x prices, 200 lives,
  slower bloons) vs Hard (1.08x, 100 lives, 15% faster) [V]. The bloon roster per round is the same.

---

## Design lessons for Hollowlight

1. **Start the player overpowered.** Make wave 1 trivially clearable with the starting cash (BTD6: 20 RBE
   vs ~3 towers' worth of cash). Players should feel strong *before* they are tested. For 10 waves,
   waves 1-2 should be victory laps, wave 3 the first real check.

2. **Make enemies layered: hits peel enemies into weaker forms.** Instead of a health bar, give enemies
   2-5 "shells" that each break in one hit and spawn a weaker child. Every hit becomes a visible event,
   the screen fills with targets for pierce/AoE, and enemies are *weaker* near the exit. This is the
   single biggest source of BTD6's "my towers are doing things" feeling.

3. **Inner layers can be faster.** Peeling a tough enemy should release fast, fragile children (BTD6:
   Pink 3.5x inside Black 1.8x). That rewards layered defence (one tower cracks, another cleans up)
   without raising raw HP.

4. **Pierce (multi-hit) before damage.** Early towers should hit 2+ enemies per shot. Wards with pierce
   scale with crowd size, so bigger waves *feel* like bigger power. Keep per-hit HP at 1 for most early
   enemies so pierce and rate matter more than damage.

5. **Make each upgrade a visible event, and make tier 3 a spike.** Cheap T1/T2 (≈0.5-1x base cost) give a
   small upgrade nearly every wave. T3 (≈1.5-3x base) should change the attack *verb* and visuals and give
   roughly 3-6x the base power. With 10 waves, the T3 spike should be reachable around wave 4-5.

6. **Power per dollar should rise with tier.** BTD6's $2,500 tower attacks ~16-20x as often as the $200
   one. If Hollowlight's upgrades give linear power for exponential cost, they will feel weak. Aim for
   each tier to multiply power by *more* than its cost multiplies.

7. **Gate with properties, not HP walls.** One hidden/armoured/fast enemy type per stage forces ward
   variety ("you need a ward that can see/crack this") without making every ward feel underpowered.
   Introduce each new property with a **single** instance first (BTD6: round 40 = one MOAB, round 60 = one
   BFB).

8. **Most income should come from kills.** About 90% of BTD6 cash comes from pops. Pay per layer
   destroyed, so strong defence snowballs into more upgrades. Add a small, growing end-of-wave bonus
   (BTD6: 100 + round) as a floor so weak players still progress.

9. **Leaks should cost lives proportional to what leaked.** A 1-shell enemy leaking should be a small
   cost. Only a big enemy leaking should be catastrophic. Generous lives (BTD6 Medium: 150 lives, a Red
   costs 1) make early mistakes recoverable.

10. **Bosses should be piñatas.** Give the boss a modest own-HP share (BTD6 ZOMG: 24% of total RBE) and
    have it burst into lots of smaller enemies at death and at HP thresholds ("skulls"). Splitting one
    long health bar into 3-4 phase goals with dramatic spawns turns a slog into a series of wins.

11. **Abilities on big upgrades, short cooldowns, ready on purchase.** A tier-4-style ward upgrade with an
    activated ability (cooldown ≈ one wave, starts at 33% charged) gives the player an "I saved it"
    moment and a buffer against difficulty spikes.

12. **Juice every pop.** Pooled and throttled pop sounds, a burst sprite per shell, a cash tick per kill,
    visibly cracking tough enemies, and big readable projectiles at higher tiers. The feedback rate (events
    per second) matters more than any single effect.

13. **Let the player start each wave and fast-forward.** No between-wave timer, plus a speed toggle,
    lets strong players skip won waves and gives everyone time to enjoy shopping.

14. **Express difficulty through price and lives, not enemy stats.** BTD6's Easy is 0.85x prices and more
    lives with the same roster. If Hollowlight is "too hard", lowering costs ~15% and adding lives keeps
    the same content while making wards feel stronger.

15. **Add a growth source that doesn't cost money.** A hero-like ward or passive per-wave XP that
    auto-upgrades gives guaranteed power growth even when the player is broke after a bad wave.

---

## Sources

- Search excerpts of bloonswiki.com (Blooncyclopedia) and bloons.fandom.com pages: Dart Monkey, Stats:Dart
  Monkey, Long Range Darts, Razor Sharp Shots, Ninja Monkey, Ninja Discipline, Bloonjitsu, Laser Blasts,
  Plasma Blasts, Sun Avatar, Banana Farm, Greater Production, Banana Plantation, Banana Research
  Facility, MOAB, BFB, ZOMG, DDT, BAD, Ceramic Bloon, Fortified Bloon, Camo Bloon, List of rounds in BTD6,
  Late Game and Freeplay (BTD6), Activated Abilities (BTD6), Absolute Zero, Bloonarius, Easy, Lives,
  CHIMPS. Main URLs:
  - https://www.bloonswiki.com/Dart_Monkey_(BTD6)
  - https://www.bloonswiki.com/List_of_rounds_in_BTD6
  - https://www.bloonswiki.com/Ceramic_(BTD6)
  - https://www.bloonswiki.com/Fortified_Bloon_(BTD6)
  - https://www.bloonswiki.com/Banana_Farm_(BTD6)
  - https://www.bloonswiki.com/Bloonarius_(BTD6)
  - https://www.bloonswiki.com/Activated_Abilities_(BTD6)
  - https://www.bloonswiki.com/CHIMPS
  - https://bloons.fandom.com/wiki/Late_Game_and_Freeplay_(BTD6)
  - https://bloons.fandom.com/wiki/Rounds_(BTD6)
- Community guide (fetched directly): https://sarahs-btd6-site.onrender.com/guides/prologue/knowledge
  (freeplay ramping, first-appearance rounds, blimp HP, XP), /docs/towers/dart, /docs/towers/super
- Income calculator (fetched directly): https://topper64.co.uk/nk/btd6/income (cash per pop and
  end-of-round formula)
- Wikipedia: https://en.wikipedia.org/wiki/Bloons_TD_6 (crosspath rule, heroes, boss cadence, reception
  quotes)
- Epic Games Store feature (via search excerpt; direct fetch blocked):
  https://store.epicgames.com/news/inside-bloons-the-multimillion-dollar-tower-defense-empire-built-on-monkeys
- Steam forum (cash by round 99, $177,374): surfaced via search excerpt from the BTD6 Steam discussions;
  the exact thread was one of https://steamcommunity.com/app/960090/discussions/0/4036979713114230302 or
  https://steamcommunity.com/app/960090/discussions/0/3275816362900140189 (not opened directly).
- Not reachable: reddit.com (blocked), fandom (HTTP 402), bloonswiki direct fetch (HTTP 403),
  breezewiki (bot wall).
