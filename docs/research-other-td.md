# Research: What other tower defense games do well

Scope: design research for **Hollowlight** (1 map, 4 wards, 10 waves + boss, planned endless mode).
Playtester complaints: too hard, towers feel weak, not enough damage, not satisfying.
Bloons TD 6 is covered separately in `docs/research-btd6.md`. This file covers other TD games, with ideas that could improve on BTD6.

Conventions: numbers marked **(unverified)** come from memory or a single weak source. Everything else cites a source.
Several fandom wikis (kingdomrushtd, plantsvszombies, gemcraft, bloons) returned HTTP 402/403 to the fetcher, so
mirror wikis (wikily.gg, plantsvszombies.wiki.gg) and articles were used instead.

---

## 1. Kingdom Rush (Ironhide, 2011 onward)

The benchmark for "every tower feels useful and the player always has something to do".

### Core structure (KR1)
- **Lives: 20.** Normal enemies cost 1 to 6 lives when they leak. Bosses cost 20, so any boss leak is a loss.
  ([wikily KR enemies](https://wikily.gg/kingdom-rush/enemies))
- **Star rating from lives left:** 18-20 lives = 3 stars, 6-17 = 2 stars, 1-5 = 1 star. Stars buy permanent upgrades
  (tower trees, spell upgrades). ([supercheats](https://www.supercheats.com/kingdom-rush/walkthrough/gameplay), search summary)
- Earning 3 stars unlocks per-stage **Heroic** (6 waves, 1 life) and **Iron** (1 giant wave, 1 life, restricted towers)
  challenges. ([wikily game modes](https://wikily.gg/kingdom-rush/game-modes))
- Difficulty is a plain HP multiplier: **Casual = 80% enemy HP, Veteran = 120%**. Speed, armor, gold and lives cost
  do not change. Casual also gives your soldiers and heroes 120% HP. ([wikily KR](https://wikily.gg/kingdom-rush))
- **Gold is paid when an enemy dies, even if it has already leaked.** A leak hurts lives but not the economy.
  ([wikily KR enemies](https://wikily.gg/kingdom-rush/enemies))

### Example stage: Twin River Pass ([wikily](https://wikily.gg/kingdom-rush/stages/twin-river-pass))
- Campaign: 13 waves, **520 starting gold**, 20 lives. Late stages start at 1300 gold
  ([Game Developer](https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design)).
- Wave composition ramps by **variety more than count**:
  W1 20 Goblin + 6 Orc; W3 adds 2 Shamans (healers); W4 is **50 Goblins** (a pure "swarm" check);
  W6 is 9 Bandits (new, tougher type, alone so you can read it); W7 adds fast Wulves; W8 adds Ogres;
  W11 introduces 8 armored Brigands **alone**; W12-13 mix everything.
- Pattern: **a new enemy type appears alone or in a small group first, then gets mixed in later.**

### Towers, costs, damage
| Tower | Build | Notes |
|---|---|---|
| Archer | 70 | cheap, fast, physical |
| Militia Barracks | 70 | 3 soldiers that **block** enemies |
| Mage | 100 | magic damage, ignores armor |
| Dwarven Bombard (artillery) | 125 | AoE, explosive (half armor applies) |

Archer line ([wikily](https://wikily.gg/kingdom-rush/towers/archer-tower)):
| Level | Cost | Damage | Interval | Range | Approx DPS | DPS per gold spent |
|---|---|---|---|---|---|---|
| I Archer | 70 | 5-6 | 0.8 s | 140 | ~6.9 | 0.098 |
| II Marksman | +110 (180 total) | 8-11 | 0.6 s | 160 | ~15.8 | 0.088 |
| III Sharpshooter | +160 (340 total) | 11-16 | 0.5 s | 180 | ~27 | 0.079 |

(DPS columns are my arithmetic.) Lesson: a level-3 tower is **~4x the DPS of level 1 for ~5x the gold**, plus more
range. Upgrades are slightly worse value per gold but much better value per **build slot**, and the jump is big
and visible.

Level-4 specialisations ([wikily towers](https://wikily.gg/kingdom-rush/towers)): two per line, each with 2-3
purchasable abilities. Rangers Hideout / Musketeer Garrison 230; Holy Order / Barbarian Hall 230;
Arcane Wizard / Sorcerer Mage 300; Tesla x104 375; Big Bertha 400. Each one has a clear weakness
(for example, Rangers struggle against armor). Level-4 abilities are **named, flashy and bought one at a time**
(Death Ray, Teleport, Polymorph, Shrapnel Shot, Overcharge). That gives the player lots of small, exciting purchases
late in a level instead of a few big ones.

Selling: **100% refund before the first wave, 60% after.** ([wikily towers](https://wikily.gg/kingdom-rush/towers))
The full refund pre-wave lets players experiment with layout for free.

### Enemy stats and armor
| Enemy | HP (Normal) | Armor | Gold | Lives |
|---|---|---|---|---|
| Goblin | 20 | none | 3 | 1 |
| Dark Knight | 300 | high (80% physical, 40% explosive) | 25 | 1 |
| Brigand | (unverified) | 50% | | |
| Marauder | 600 (unverified) | 60% | | |
| Bosses | huge (e.g. Sarelgaz 21,600 on Veteran) | none | | 20 |

Sources: [goblin](https://wikily.gg/kingdom-rush/enemies/goblin), [dark knight](https://wikily.gg/kingdom-rush/enemies/dark-knight),
[Game Developer](https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design).

- Armor/magic resistance is a **percentage reduction** of one damage type. Explosive takes half the armor value;
  true damage ignores both. ([wikily KR6](https://wikily.gg/kingdom-rush-6-genesis/damage-and-armor))
- Armored enemies are paired with a clear counter (mage). Magic-resistant enemies (spiders) push you back to physical.
  This makes **no tower useless and no tower universal**, and it explains *why* a tower feels weak against a target.
  Icons on the enemy (blue shield = magic resist) make this readable.
  ([Ironhide support](https://support.ironhidegames.com/support/solutions/articles/4000223666-armor-types-breakdown-kingdom-rush-battles-guide))
- **Bosses have no armor but very high HP and spawn minions.** Everything chips them, so no single build is
  hard-countered at the climax.

### Active spells (always available, cooldown based)
([wikily spells](https://wikily.gg/kingdom-rush/spells))
- **Rain of Fire:** 3 meteors x 30-60 **true damage**, AoE, **80 s cooldown**. Star upgrades bring it to 5 meteors,
  90-120 damage, 60 s, and finally 5 + 5 random meteors at 150-180 damage.
- **Call Reinforcements:** 2 farmers (30 HP, 1-2 damage) for 20 s, **10 s cooldown**. Upgrades take them to
  110 HP with 30% armor and a spear throw.
- Two spells with very different rhythms: a big, rare "panic button" and a small, frequent "plug the gap" tool.
  The player is never just watching.

### Heroes
- One controllable unit that walks anywhere and levels up during the stage. It acts as a mobile blocker or DPS and
  **gives the player something to do between purchases.** Unlike towers, heroes grow stats as they level
  ([Ironhide news](https://www.ironhidegames.com/News/Details/420)).

### Early wave call
- Tapping the next-wave skull early gives **gold equal to the seconds left on the timer** and cuts spell cooldowns by
  the same number of seconds ([Game Developer](https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design)).
  On Twin River Pass the maximum bonus per wave is 17-47 gold (2-15% of a level-1 tower).
- It is opt-in risk for opt-in reward. Strong players speed the game up and get paid for it; struggling players
  lose nothing by waiting.

### Level design pacing (Harlow, Game Developer)
- Each level teaches **one idea** (resource management, terrain, split paths). Easier "breather" levels follow hard
  ones. Late levels combine earlier ideas.
- Waves have **named set-pieces**, such as "Dark Knight March" (18 Dark Knights + 12 Shadow Archers) as a level's
  climax wave.

**Takeaways for Hollowlight**
1. Show the counter system: give enemies 1-2 resist tags with clear icons, and give each ward a damage type that
   beats one tag. Towers then feel strong against their own target and weak for a *visible* reason.
2. Add at least one active ability (a "Rain of Fire" equivalent) and an early-call bonus (gold = seconds skipped).

---

## 2. Plants vs. Zombies (PopCap, 2009)

The benchmark for readability, gradual teaching and "it was my fault" fairness.

### Economy
- Sun is the only currency, collected by clicking. Sky sun falls periodically; **Sunflower (50 sun) produces 25 sun
  every 24 s** ([PvZ wiki.gg Sunflower](https://plantsvszombies.wiki.gg/wiki/Sunflower)).
  Start 50 sun, sky sun 25 roughly every 10 s, Peashooter 100 sun **(unverified)**.
- **Economy as a decision:** every early Sunflower is a plant that isn't shooting. It's the same "farm vs defend"
  tension as BTD6's banana farms, but it shows up on level 1 in its simplest form.
- Clicking sun is an **active collection loop**. Every few seconds you get a small "reward pickup" moment even during
  quiet periods.
- **Seed recharge times** stop the player from dumping all their money into one plant type instantly, which spreads
  out the decisions (and the little bursts of satisfaction).

### Teaching and gradual introduction (George Fan, GDC 2012)
([Game Developer summary](https://gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan))
- Blend the tutorial into play. Players learn by **doing**: level 1 is one lane, one plant, one zombie type.
- **Spread mechanics out.** Money is irrelevant until about level 10; the complex Zen Garden arrives near the end.
- **About 8 words on screen at most.** Messages are passive (no pause) and **adaptive**: a tip only appears for a
  player who is making that mistake.
- **Visual design teaches function:** the Peashooter's mouth says "shoots", the Screen Door zombie's door says
  "blocks straight shots". Players can read the counter from the silhouette.
- Roughly one new plant per level and one new zombie every couple of levels **(unverified)**. The pre-level
  screen shows the upcoming zombies standing on the street, so players **know what's coming and choose their seed
  loadout accordingly.**

### Wave structure and set pieces
- A **progress bar with flag markers** shows how far through the level you are. Each flag is a "huge wave".
  The **Flag Zombie** leads each huge wave ([wiki.gg Flag Zombie](https://plantsvszombies.wiki.gg/wiki/Flag_Zombie)).
- Huge waves are announced with red on-screen text ("A huge wave of zombies is approaching!") plus a sound
  sting, and later **"FINAL WAVE"**. The quiet build-up, then a warning, then a spike, then relief gives every level
  a dramatic shape.

### Why it feels fair
- **Lawnmowers:** one per lane, a one-time free save that clears the whole lane. A first mistake is forgiven, and the
  forgiveness is visible (you watch the mower go). Only a second leak in the same lane loses the level.
- Lanes make cause and effect obvious: if lane 3 broke, lane 3 needed more.
- Zombies are slow, so there is time to react. Pressure comes from many small decisions rather than speed.

**Takeaways for Hollowlight**
1. Add a **one-time "lawnmower" save**, such as a ward-shrine pulse that wipes the path near the core once per run.
   The first leak should feel like a warning, not a punishment.
2. Show the wave preview (enemy types plus a progress bar with marked "big waves") and give the boss wave a
   dramatic announcement.

---

## 3. Defense Grid: The Awakening (Hidden Path, 2008)

The benchmark for **recoverable losses** and readable mazing.

- Aliens don't damage you. They **steal power cores** and try to carry them back out. "Your towers are too tough to
  destroy, so their entire goal is to get in, steal your power cores, and get out." (Michael Austin, lead designer,
  [sknr.net interview](https://sknr.net/2009/01/13/interview-with-michael-austin-cto-and-lead-designer-for-defense-grid-the-awakening))
- **Kill a carrier and the core drops and slowly floats back home.** It can be picked up again by another alien on
  the way. You only lose when every core is gone off the map
  ([Wikipedia](https://en.wikipedia.org/wiki/Defense_Grid:_The_Awakening), guide summaries).
  - That makes a leak a **chase, not a loss**. The tension peaks *after* the mistake, and the player gets a
    second chance to fix it with the defense they have. That is one of the most satisfying moments in the genre.
- **Mazing:** many maps let you place towers on open ground to lengthen the path. You build the path that your
  towers then cover twice, on the way in and on the way out.
- **Interest on unspent resources**, at a rate that rises as your bank grows. You lose interest while cores are
  out of their housing. Score after a full-core win depends on **spending as little as possible**, which sets up a
  skill ceiling without making the base game harder.
- DG2 added **boost platforms**: cheap blocks that raise a tower's elevation and unlock extra upgrade options. It also
  added a pre-level **loadout ability** such as Orbital Laser or Tower Overcharge on a cooldown
  ([search summary of DG2 reviews](https://techraptor.net/content/defense-grid-2-review-definition-genre)).
- Towers have 3 upgrade levels and are colour- and shape-distinct. The temporal tower "doesn't do any damage, but is
  deadly in concert with other towers" (Austin), so supports make the damage dealers feel stronger.

**Takeaways for Hollowlight**
1. **Make leaks recoverable.** An enemy that reaches the core could grab a "light shard" and walk back out along
   the path; killing it returns the shard. Lives are only lost when a carrier escapes. This alone could fix much of
   the "too hard" feeling and gives great comeback moments.
2. Reward efficiency with score (interest or "unspent gold bonus") rather than raising baseline difficulty.

---

## 4. Rogue Tower (Die of Death Games, 2022)

The benchmark for roguelite TD: each run is different, and power grows visibly.

([Steam page](https://store.steampowered.com/app/1843760/Rogue_Tower), [gamepretty guide](https://gamepretty.com/rogue-tower-beginners-guide-game-mechanics-strategies/),
[gameplay.tips](https://gameplay.tips/guides/rogue-tower-tips-for-winning-the-level.html))
- **The path grows every level.** The player chooses which entrance to extend, and the new tiles "randomly twist,
  turn and split". The player shapes the level and decides whether enemies merge (good for AoE) or stay apart.
- **Elevation increases range and base damage.** High ground is scarce and valuable, which turns placement into a
  meaningful puzzle.
- **Three damage layers:** Health, Armor, Shields. Towers are rated good/decent/weak against each. Shielded
  enemies first appear around level 16 ([gameplay.tips](https://gameplay.tips/guides/rogue-tower-tips-for-winning-the-level.html)).
  This is a clean visual model (coloured bars on top of each other) for "why is my tower weak here".
- **Towers gain XP from what they target** and level up during the run. Players watch individual towers grow,
  which builds attachment.
- **Card draws (400+ cards)** unlock new towers or upgrade existing ones (damage, range, new abilities). Common advice
  is to stack levels of one card, which creates "build identity" within a run.
- **Meta progression:** XP after each run unlocks towers and cards and gives "a small boost" to future starts.
  A loss still pays out, so it feels like progress.
- Economy buildings (mana siphons ~100 g per mana/s; houses/haunted house that pay off in 5-20 levels) give a
  greed-vs-safety choice.
- **Criticisms:** "extremely tedious with waves lasting forever", "too much RNG", unclear targeting rules, and card-pool
  pollution (unwanted cards that can only be removed by resetting all XP). The Steam rating is Very Positive (~80%),
  but recent reviews are Mixed.

**Takeaways for Hollowlight**
1. For endless mode, offer **a pick-1-of-3 upgrade between waves** (e.g. "+25% Ember ward damage", "chain hits +1").
   It adds variety and a dopamine hit each wave without new art.
2. Avoid the Rogue Tower traps: keep waves short, let players reroll or skip bad picks, and show exact numbers.

---

## 5. GemCraft (Game in a Bottle, 2008 onward)

The benchmark for exponential scaling that stays legible, and for one resource serving as both money and health.

- **Mana is money and health.** Monsters that reach your orb are **banished** back to their spawn, which costs mana.
  Banishment cost rises with monster toughness **and goes up each time the same monster reaches the orb**. You lose
  only when mana is empty ([armorgames GC Labyrinth guide](https://armorgames.com/guide/gemcraft-labyrinth-strategy-guide), search summary).
  - A leak is **partial and proportional**: a strong monster costs more than a weak one, and you can recover by
    killing it on its second pass. (Hollowlight's "proportional leaks" are already on this track.)
- **Gem combining:** two grade-n gems make one grade-(n+1). Building a grade-n gem from scratch takes 2^(n-1) grade-1
  gems, so cost roughly doubles per grade, while damage grows slightly less than 2x per grade. Fire rate also rises
  up to a cap. DPS per mana stays about constant, so **total damage tracks total mana collected**
  ([wurb.com "Some Vague Math"](https://www.wurb.com/stack/?p=3088)).
- Specialist colours change the scaling curve: yellow crits scale about as the square of mana; orange (mana leech)
  gives compound growth. Players hunt for "scaling engines", which is the long-term fun of the game.
- **Monster HP grows exponentially per wave.** GemCraft Chapter 2 field pages list formulas such as
  **HP = 299 x 1.083^(wave-1)** and **HP = 90 x 1.082^(wave-1)** (search summary of gemcraft.fandom field pages;
  fandom blocked direct fetch). ~8% per wave means HP **doubles about every 9 waves**: x2.2 at +10 waves,
  x4.9 at +20, x54 at +50.
- **Calling waves early** (you can call several at once) earns extra mana and XP. Strong players stack many waves
  on top of an AoE gem plus traps. Score depends on the battle settings and difficulty
  ([cyberly walkthrough](https://www.cyberly.org/game-cheats/pc-walkthroughs/gemcraft.html), [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/YMMV/Gemcraft)).
- **Opt-in difficulty modifiers raise the score multiplier.** Chapter 0's Arcane mode: +80% monster count,
  +100% monster HP, +8 waves ([search summary of gameinabottle](https://gameinabottle.com/gemcraft0.php)).
  XP is your **best score per map**, so replays only pay if you raise difficulty
  ([killtenrats](https://www.killtenrats.com/2016/01/02/restricted-difficulty/)).
- **Endurance mode** extends a field with endless waves until HP reaches scientific notation. Later endurance waves add
  modifiers (healing on death, swarmlings on death, shields) ([TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/YMMV/Gemcraft)).

**Takeaways for Hollowlight**
1. Endless HP growth of about **6-8% per wave (exponential)** is proven. Pair it with exponential upgrade costs and
   near-exponential upgrade power so the player's curve runs alongside the enemy curve for a while before falling behind.
2. **Player-chosen difficulty = score multiplier** ("Hardened" modifiers in endless), rather than one fixed hard
   difficulty.

---

## 6. Briefer notes on other games

### Thronefall (Grizzly Games, 2023; 1.0 2024)
([thesixthaxis](https://www.thesixthaxis.com/2023/08/03/thronefall-review/), [games.gg](https://games.gg/thronefall/),
[galaxus](https://www.galaxus.ch/en/page/thronefall-a-fun-tactics-game-for-little-money-29122))
- **Day (build) / night (defend) loop.** Buildings must survive the night to pay income the next day, so defence and
  economy are tied together.
- The game **tells you in advance which direction and how many enemies** will attack. Planning is the skill, not
  memorising.
- The player is a hero on horseback who fights directly, so there's always something to do during a wave.
- **Perks and mutators** raise difficulty in exchange for score. Minimalist art stays readable in chaos.
- Takeaway: the build/defend split and the incoming-wave preview reduce "unfair" feelings.

### Arknights (Hypergryph)
([arknights.wiki.gg DP](https://arknights.wiki.gg/wiki/Deployment_Point), [gamepress](https://gamepress.gg/node/39291))
- Deployment Points regenerate at **1 DP/s**. You deploy units onto tiles mid-fight, and each unit **blocks** a set
  number of enemies.
- **Retreating refunds 50%** of cost; redeploying costs +50% the first time and +100% after; a dead operator refunds
  nothing. That makes **"retreat and redeploy elsewhere" a skill move**.
- Units have an active skill that charges over time (SP) and is triggered manually, which is the "big moment" button.
- Takeaway: wards could have a **charged active skill** (charges on hits/kills, tap to fire) to add agency and spectacle.

### Dungeon Warfare 1-3 (Valsar)
([vaporlens review summary](https://vaporlens.app/app/355980/dungeon_warfare), [gamerblurb DW3 guide](https://gamerblurb.com/articles/dungeon-warfare-3-tips-guide-best-strategies))
- Traps that **push** enemies into pits, lava or walls (wall slam = stun), plus barricades to loop enemies through the
  same kill corridor. Players single out "satisfying to watch enemies fall into traps" and "elaborate trap chains".
- The criticism is a grindy XP meta-progression.
- Takeaway: **synergy combos** (ward A sets up ward B, like slow + burst or knockback + pit) are a cheap source of
  "big brain" satisfaction.

### Element TD (WC3 mod / standalone)
- Players pick an element every few waves, and dual/triple-element towers unlock from the combinations
  **(unverified: about 60 waves, element pick every 5 waves; interest on banked gold)**. Late waves include
  element-resistant creeps.
- Takeaway: **choosing a direction** (element) mid-run gives build identity, a precursor to Rogue Tower cards.

### Infinitode 2 (Prineside)
- Endless-focused TD with a large research tree, tile-based tower placement and modifiers that boost adjacent towers,
  plus global abilities (fireball, blizzard, etc.) **(unverified details)**. No public HP formula found.
  Enemies are geometric shapes with distinct HP/speed/armor ([shapes.inc enemies](https://shapes.inc/fandom/infinitode-2-infinite-tower-defense/enemies)).
- Takeaway: **visible, readable numbers** and a "max wave reached" meta goal make endless mode compelling.

### Mindustry / They Are Billions (briefly)
- Mindustry shows a wave countdown and lets you **skip the countdown** for an earlier wave (unverified), which is
  the KR early-call idea in RTS form.
- They Are Billions shows the opposite lesson. One leak cascades (infected buildings spawn more zombies), so runs end
  abruptly after 1-2 hours. That is widely seen as harsh. **Avoid cascading failure.**

---

## 7. Cross-cutting: Feedback and juice

What works in TD specifically (projectiles are numerous and small, so juice must scale):
- **Hit feedback:** enemy **white flash for 1-2 frames** on hit, small knockback/squash, a hit spark at the impact point
  in the projectile's colour. Stagger flashes so 50 enemies don't all flash at once.
- **Death feedback:** pop/burst particles, a short "soul/coin" flying toward the gold counter (PvZ coins,
  KR gold pop), a **gold number that ticks up with a bounce**. The kill and the reward should land in the same 0.3 s.
- **Damage numbers:** show **big hits and crits** prominently (scale font by damage relative to target max HP).
  Merge small ticks into one rising number, or hide them, so chip damage doesn't create clutter. Colour by damage type.
- **Hit-stop:** 2-5 frames of freeze is standard for melee games
  ([bugnet hit pause](https://bugnet.io/blog/how-to-use-hit-pause-to-make-impacts-feel-powerful)). In TD, use it
  **only** for boss hits, ability impacts and multi-kills, never per shot.
- **Screen shake:** a trauma value (0-1) that decays, with randomised offset. Use it for explosions, ability casts, boss
  stomps and big multi-kills. Keep it sparing and offer a toggle. Shake and hit-stop work best together.
- **Upgrade feedback:** visibly change the tower model per tier (KR changes the whole building at each level), play a
  level-up burst, and show before/after stats. Hollowlight already has this, so keep the tier differences dramatic.
- **Spell feedback:** KR's Rain of Fire meteors are slow and visible, with a big flash and lingering scorch marks.
  Anticipation + impact + residue.
- **Combo/streak feedback:** "Double/Triple/Multi-kill" callouts, a streak counter with escalating pitch, and gold
  bonus popups. Pitch-shifting the kill sound upward on rapid kills is a cheap and strong effect.
- **Sound:** per-tower firing sounds with **random pitch +/-5-10%** so rapid fire doesn't drone, layered impacts
  (a low thump plus a high crack), a distinct sound per damage type, and stings for wave start, huge wave, boss and
  victory. Limit concurrent voices per sound so swarms don't clip.
- **Readable state:** health bars only after first damage, armor/resist icons above bars, and a projected "leak
  preview" (KR shows the enemy path; Thronefall shows the incoming direction and count).

## 8. Cross-cutting: Difficulty and avoiding "weak towers"

### How games ramp
| Lever | Example | Feel |
|---|---|---|
| Quantity | KR Twin River W4: 50 goblins | Fun for AoE, a check on DPS |
| Variety | KR new enemy alone first (W6 Bandits, W11 Brigands), PvZ new zombie per few levels | Feels like learning, fair |
| Stats | KR difficulty = HP x0.8/x1.2; GemCraft +8%/wave; BTD6 freeplay +2%/round | Invisible, feels like "towers got weak" |
| Modifiers | GemCraft endurance (shields, heal on death), Rogue Tower shields at L16 | Fresh, but must be readable |

**Rule of thumb from these games:** in a 10-wave campaign, ramp mostly by **variety and quantity**. Save raw stat
inflation for endless. A player whose tower one-shot goblins on wave 2 should still one-shot goblins on wave 9;
the challenge comes from the ogres beside them. If HP inflates on every wave, every tower feels like it is getting weaker.

### How games keep towers feeling strong
- **Overkill on fodder.** KR level-1 archers (5-6 damage) kill a 20 HP goblin in 4 hits, and a level-3 tower kills it in
  ~2. Fodder enemies make your power visible.
- **Counter clarity.** A Sharpshooter does only ~20% damage to an 80%-armor Dark Knight (~5 DPS against 300 HP),
  which feels bad *but is explained*: the armor icon says "use a mage". Weakness with a stated reason is acceptable;
  unexplained weakness is not.
- **Big upgrade jumps** (KR archer L1 to L3 is ~4x DPS), named level-4 abilities, and specialisation choices.
- **Support towers** that multiply others (DG temporal tower, DG2 boost platforms, slows) make the damage dealers look
  better.
- **Bosses with no armor** so every tower contributes to the climax.

### Comeback and forgiveness mechanics
- **Recoverable losses:** DG cores float back. GemCraft banishment costs mana instead of a life and the monster
  comes back around where you can kill it.
- **Partial / proportional leaks:** KR enemies cost 1-6 lives by size, and gold still pays out on a leaked enemy
  that dies. GemCraft banish cost scales with monster toughness.
- **One-time saves:** PvZ lawnmowers.
- **Buffer lives:** KR's 20 lives with 3 stars at 18+ means "win" and "perfect" are separate goals, so casual players
  win while skilled players chase stars.
- **Free experimentation:** KR full refund before wave 1; Arknights 50% retreat refund.
- **Difficulty selection with no shame:** KR Casual/Normal/Veteran is an HP multiplier only (0.8/1.0/1.2).

## 9. Cross-cutting: Endless / freeplay scaling

| Game | Formula / rule | Notes |
|---|---|---|
| GemCraft Ch.2 | HP = base x **1.082-1.083^(wave-1)** | ~2x every 9 waves. Pure exponential. Player power also near-exponential via gem grades |
| BTD6 freeplay | From r81: all bloons **+2% speed per round**; MOAB-class **+2% HP/round** to r100 (x1.4); then steeper brackets (r101-124 +5%/round, unverified) and a speed jump at r101 | Piecewise ramps. XP drops to 10% after r100. Lag at r100-200 is the top complaint ([bloonswiki](https://www.bloonswiki.com/Freeplay), [Steam](https://steamcommunity.com/app/960090/discussions/0/3417685271697215372)) |
| GemCraft Ch.0 Arcane | +80% count, +100% HP, +8 waves | Opt-in modifier for score |
| Brotato endless | "endless factor" from waves past 20, multiplier increases after wave 35 ([brotato wiki](https://brotato.wiki.spellsandguns.com/Endless_Mode)) | Piecewise multiplier, similar idea |

Guidance distilled:
- **Exponential per-wave HP growth of 5-8%** is standard. 5% = x2.65 per 20 waves, x11.5 per 50; 8% = x4.9 per 20,
  x47 per 50. Polynomial growth (e.g. HP ~ wave^2) is gentler later on and suits "how far can I get" sessions;
  exponential guarantees an eventual wall. The usual approach is polynomial/linear for the first ~10 endless waves,
  then exponential.
- **Grow count slowly, HP fast** to avoid the BTD6 lag problem: cap simultaneous enemies (e.g. ~150) and convert
  extra "count" into HP via elite/merged enemies ("a pack of 5 becomes 1 elite with 5x HP and a crown").
- **Add modifiers every N waves** (shielded, regenerating, fast, splits on death) so endless gets *different*, not just
  bigger. Telegraph each one with an icon in the wave preview.
- **Score multipliers** for calling waves early and for opt-in modifiers. Score = sum(bounty x multiplier). Show
  "best wave" and "best score" on the menu.
- **Keep economy relevant:** BTD6 cuts cash per pop in late rounds; GemCraft lets mana compound. Whatever the
  choice, the player needs something worth buying every few waves (new tiers, rerollable upgrade cards).
- **Short waves:** a Rogue Tower complaint is "waves lasting forever". Offer 2x/3x speed and keep endless waves under
  ~40 s at 1x.

## 10. Cross-cutting: Active abilities and early-wave calls

**Active abilities**
- KR: two global spells with very different cooldowns (80 s big AoE nuke, 10 s small reinforcements). Upgraded with
  meta currency.
- DG2: one pre-chosen loadout ability (Orbital Laser, Tower Overcharge).
- Arknights: per-unit charged skills, triggered manually.
- Thronefall / KR heroes: a controllable unit.
- Design notes: at least one ability should be **true damage AoE** that always feels powerful. Show cooldown
  radially on the button. Pause or slow-mo targeting on mobile/touch. Abilities are the best place to spend juice budget
  (screen shake, hit-stop, big sound).

**Early-wave calls**
- KR: gold = seconds remaining, and spell cooldowns drop by the same amount.
- GemCraft: call several waves at once; more mana/XP and score.
- Mindustry: skip the countdown **(unverified)**.
- BTD6 has fast-forward and no early-call reward (rounds can be sent early, but there's no bonus) **(unverified;
  see the BTD6 doc)**.
- Design notes: reward should be **meaningful but small**. In KR it's 2-15% of a cheap tower per wave. Also use it to
  shorten downtime, a fix for slow early rounds.

## 11. What could improve on BTD6

BTD6 weaknesses commonly cited, and fixes from these games:
1. **Slow early rounds** (rounds 1-30 feel like waiting).
   Fix: KR early-call bonus (pays you to skip downtime), and starting cash high enough to place 2-3 towers
   immediately (KR starts at 520-1300 gold, so 4-10 towers' worth).
2. **Late-game lag and tedium** (r100-200+ freeplay "nearly unplayable").
   Fix: cap entity counts and scale HP/elite tiers instead of count. Short waves. GemCraft-style exponential HP with a
   score chase. Endless modifiers for variety.
3. **Opaque numbers.** BTD6 hides most damage/pierce numbers in-game; the community relies on wikis.
   Fix: Rogue Tower/Infinitode-style visible stats, KR-style armor icons, before/after upgrade stats, a DPS meter per
   tower, and damage numbers.
4. **Leaks feel binary and sudden** (one MOAB-class leak can cost a whole run on CHIMPS-style modes).
   Fix: DG recoverable carriers, GemCraft banishment, PvZ lawnmower, proportional lives.
5. **Little to do mid-round once the defense is built.**
   Fix: KR spells and hero, Arknights charged skills, PvZ sun clicks, DG core chases.
6. **Freeplay rewards dwindle** (XP cut to 10% after r100).
   Fix: score multipliers, best-wave records, unlockable cosmetics/modifiers for milestones.
7. **Readability with huge projectile counts.**
   Fix: Thronefall-style minimalism, damage-type colour coding, culling of redundant effects.

---

## Design lessons for Hollowlight

1. **Ramp the 10-wave campaign by variety and quantity, not HP.** Fodder enemy HP should stay flat so wards keep
   one- or two-shotting it all game. Every 2 waves, introduce one new enemy type **alone first**, then mix it in (KR, PvZ).
2. **Make upgrades a dramatic jump.** Aim for roughly 4x DPS from tier 1 to tier 3 for ~5x gold (KR archer), with a
   new look per tier, and make the last tier a named special ability.
3. **Give "weak" a visible reason.** Add 1-2 resist tags (e.g. Armored, Warded) with icons above health bars, and
   give each ward a counter role. Bosses get no resists so every ward helps at the climax.
4. **Make leaks recoverable.** Use carriers that steal a light shard and walk back out (DG), or a GemCraft-style
   banish that costs gold or light proportional to enemy HP. Lose lives only when a carrier escapes.
5. **Add one free emergency save** per run (a PvZ lawnmower): a core pulse that wipes enemies near the core once.
6. **Separate "win" from "perfect".** 20 lives with stars or score for flawless play (KR 18+ = 3 stars) lets
   struggling players finish while good players chase mastery.
7. **Add an active ability** (KR Rain of Fire: big true-damage AoE on a ~60-80 s cooldown) and possibly a cheap
   short-cooldown one. Spend the screen shake and hit-stop budget here.
8. **Pay players to call waves early:** gold = seconds skipped, and it also reduces ability cooldowns. This fixes
   downtime and adds risk/reward.
9. **Preview every wave.** Show enemy icons/counts for the next wave, a progress bar with marked big waves, and a
   dramatic "BOSS APPROACHING" banner with a sound sting (PvZ, Thronefall).
10. **Layer juice by importance.** Every hit gets a flash and spark; every kill gets a burst plus a gold fly-to-counter
    and tick-up; only big events (crits, multi-kills, ability, boss hits) get large numbers, shake and hit-stop.
    Randomise SFX pitch and raise pitch on kill streaks.
11. **Free layout experimentation:** a full refund on sell before wave 1 (and maybe within 5 s of placing), 60-75%
    after (KR).
12. **Synergy over raw stats.** Give at least one pair of wards a visible combo (slow + burst, mark + detonate,
    knockback into a hazard), as in Dungeon Warfare and DG temporal towers. Combos make players feel clever.
13. **Endless mode:** HP x1.06-1.08 per wave after a gentle start; cap live enemy count and convert extra count into
    elites; add a new modifier every 5 waves; offer pick-1-of-3 upgrade cards between waves (Rogue Tower) with
    reroll/skip; score multiplier for early calls and opt-in modifiers (GemCraft); show best wave and score.
14. **Difficulty options as plain HP multipliers** (KR 0.8 / 1.0 / 1.2). Default new players to the easier setting
    while balance settles, since playtesters already find it too hard.
15. **Keep waves short and offer 2x speed.** Long waves are the most common complaint in Rogue Tower and BTD6
    freeplay.
