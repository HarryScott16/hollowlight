# Visual readability research (2026-11-19)

Research for the ward redesign. **The problem:** at high tiers the wards blend together (Rime / Ember Censer / Prism; Longeye / Mortar). A player should be able to tell what every ward is, and roughly how far it is upgraded, at a glance, and the solution has to hold up for 20+ wards.

The research was done by five web-research sub-agents (game case studies; unifying gimmicks and scaling systems; art and UI principles; a mechanics survey for the new-ward brainstorm; camera view and upgrade visuals). This file is my synthesis of their reports. The diagnosis, design system and ward ideas built on it are in [visual-design-system.md](visual-design-system.md) and [tower-ideas.md](tower-ideas.md).

**How sources are marked.** Each claim keeps the agents' source link. Many fan wikis (Fandom, bloonswiki, the Kingdom Rush wiki) blocked automated fetches, so some claims rest on search snippets:
- **(snippet):** the agent saw only a search-result summary, not the page itself.
- **[observed]:** the agent looked at an official image and described what is visible.
- **(unverified):** the claim couldn't be confirmed and comes from general knowledge.

Nothing here should be copied as art. The ideas and principles are borrowed; everything drawn for Hollowlight is original.

---

## Contents

1. [The short version](#1-the-short-version)
2. [Case studies](#2-case-studies)
3. [Unifying gimmicks: why "every tower is a monkey" works](#3-unifying-gimmicks)
4. [Systems that keep 20-50+ units distinct](#4-systems-that-scale)
5. [Art and UI readability principles](#5-art-and-ui-readability-principles)
6. [Camera view and showing tiers](#6-camera-view-and-showing-tiers)
7. [A readability checklist for Hollowlight wards](#7-a-readability-checklist-for-hollowlight-wards)

---

## 1. The short version

1. **One visual channel per fact.** The games that keep many units readable give each piece of information its own channel and never let two facts share one:
   - silhouette = family or role
   - hue = element or damage type
   - small emblem = secondary path
   - count of marks = tier

   Defense Grid shows type as silhouette and level as a shared green/yellow/red ramp. BTD6 keeps the monkey body, shows path as colour, and shows the crosspath as a decal. Slay the Spire uses frame shape for card type, banner colour for rarity, and background for owner. **Hollowlight's current art breaks this rule:** glow, rings, stars and orbiting shards are used for ward identity *and* tier *and* path at the same time, and the global path colours (gold / cyan / violet) end up dominating.
2. **Silhouette first, and test it as a black shape.** The studios agree:
   - Valve validated TF2's classes in silhouette-only tests.
   - Riot: "Silhouettes are the single most important thing for champion recognition".
   - Blizzard on StarCraft II: "the top-down view… you really have to have a unique silhouette and distinct outline for each guy".
   - Thronefall: silhouette "communicates the most information".
3. **Hue alone cannot carry 20+ identities.** Healey (1996): about 5 colours are reliably fast to tell apart, and 7 is the ceiling. Hue also *masks* shape differences (Healey & Enns 2012), so multicoloured glows bury the silhouettes we are relying on. Hollowlight's cyan and violet are a listed confusion pair for the 8% of men with red-green colour blindness.
4. **Keep the ward's own feature and amplify it as it upgrades. Never cover it with a shared aura.** Riot's skin rule: "A champion's primary feature should never be removed or significantly altered". BTD6 tiers grow the tower's own gear, and Kingdom Rush specialists keep the base footprint and front emblem. Orbiting shards, halos and rings are radially symmetric clouds that turn every ward into the same disc in silhouette. That is exactly what happens to our T4s (see the diagnosis).
5. **Tier should be countable.** Use 1-4 marks in one consistent place, because people take in four or fewer items without counting. Add one shape change at milestone tiers. "More glow" saturates and stops reading.
6. **A unifying gimmick works when the template is also a mechanic, and when the variable part is big.** PvZ chose plants "because I needed units that would stay stationary", and BTD's gear is deliberately oversized. Charm comes from faces ("adding blinking really sold it"). Gimmicks strain at around 25 variants on a single axis (Kirby's director on copy abilities), so a 20+ roster needs a second axis (family silhouette, damage hue), not just more one-offs.
7. **Brightness is an attention budget.** Idle glows should be the quietest layer, and the brightest pixels belong to the moment of attack. Our current T4s glow permanently, so they compete with the enemies, which are the most important thing on screen.

---

## 2. Case studies

### Bloons TD 6 (Ninja Kiwi)

- **Scale.** Each tower has 3 paths × 5 tiers, and crosspaths get their own models. The Wizard has "52 unique models" ([bloonswiki: Upgrade](https://www.bloonswiki.com/Upgrade)).
- **Category colour lives in the shop, not on the map.** Primary, Military, Magic and Support each have a portrait background colour ([Primary](https://www.bloonswiki.com/Primary), [Magic](https://www.bloonswiki.com/Magic)). The on-map models use their own palettes.
- **Identity survives 52 models** [observed, [Wizard crosspath sheet](https://www.bloonswiki.com/File:BTD6_Wizard_Monkey_crosspaths.png)]:
  - The invariant is the monkey body plus the pointed hat.
  - The *main* path sets the dominant colour of hat and robe: blue for Arcane, red for Fire, black/purple for Necromancy.
  - The *secondary* path adds a badge-sized accessory, such as a gem or crescent.
  - Tiers 1-3 escalate trim and emblem size. Tier 5 is the only point where the silhouette breaks.
- **Bomb Shooter** [observed, [sheet](https://www.bloonswiki.com/File:BTD6_bomb_shooter_crosspaths.png)]:
  - Path 1 makes the barrel red and fatter, path 3 adds ring bands, and path 2 turns the cannon into a pointed missile launcher.
  - Crosspaths appear as small decals stamped on the barrel.
  - So colour carries the path, girth and outline carry power, and decals carry the crosspath.
- **Tier marks within the tower's own design.** Each Blade Shooter path-1 crosspath "add[s] another blade into its emblem" ([fandom](https://bloons.fandom.com/wiki/Blade_Shooter_(BTD6)), snippet).
- **Upgrade moments** get a one-shot cosmetic burst ("Upgrade FX") rather than a permanent aura ([bloonswiki](https://www.bloonswiki.com/Upgrade_FX)).

**Relevance:** BTD6 uses path colour, as we do, but only *on top of* a body that never changes. Our wards have no invariant body strong enough to survive the path colour.

### Kingdom Rush (Ironhide)

- **Structure.** KR1-3 have four base families (archers, barracks, mages, artillery), each upgraded 3 times before branching into two level-4 specialists. Vengeance and Alliance moved to 15-18 tower types with linear upgrades and a 5-tower loadout per stage ([Avocado retrospective](https://the-avocado.org/2019/02/01/franchise-festival-48-kingdom-rush/); [Game8](https://game8.co/articles/reviews/kingdom-rush-5-alliance-td-review), snippet).
- **On a battlefield** [observed, Steam screenshots [A](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/246420/ss_aaaf33cdb9106bd0801a36049516d95c6f2352b0.1920x1080.jpg), [B](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/246420/ss_15c7c9f1eb4150695f4c6fe0f081718cc13c886d.1920x1080.jpg)]:
  - Every tower sits on the same round plot.
  - Each base type has a **front emblem**: a shield for barracks, a rune glyph for mages, a bullseye for archers.
  - Specialists keep the base shape and emblem but swap material and palette. The blue sandstone mage becomes the black-slate-and-purple mage.
  - **Temporary state is shown as an overlay ring** around the tower, never baked into the tower art.
- **View.** An upright three-quarter view: the building never rotates, and soldiers or figures on top do the aiming.
- Ironhide on a Genesis element: "it starts off humble, but its final form resembles a roaring lion" ([Ironhide](https://www.ironhidegames.com/News/Details/467), snippet). That is a deliberate humble-to-grand arc.

### Plants vs. Zombies (PopCap)

- **The rule.** George Fan: "each character visually represented its function". The Peashooter "has a giant mouth for spitting projectiles" ([Game Developer, GDC 2012](https://www.gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan)).
- **Upgrades are built on top of the base plant.** Gatling Pea "looks like a Repeater with facepaint, a gatling gun, and an army helmet" ([wiki.gg](https://plantsvszombies.wiki.gg/wiki/Gatling_Pea_(PvZ))).
- **Element on the head, family on the body.** Snow Pea is a Peashooter body coloured blue on the head, with a green stem and leaves ([wiki.gg](https://plantsvszombies.wiki.gg/wiki/Snow_Pea_(PvZ))).
- **PvZ2 role colours.** 14 plant families each have a colour (red fire, sky-blue ice, cyan electric, purple poison, yellow sun…). The family colour sits in a **corner badge on the seed packet**; the plant itself is coloured by what it is ([wiki.gg](https://plantsvszombies.wiki.gg/wiki/Plant_Family_(PvZ2))).

### Clash Royale (Supercell)

- Readability comes from "strong contrast, bright colors and distinctive silhouettes". Each unit "has its own characteristic colour theme", and the team colour (red vs blue) is the first read ([The Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)).
- **Rarity is on the card frame, not the unit.**
- **One reserved hue means "upgraded".** Evolutions turn the card's diamonds purple, and the troop "appears magically charged" ([Supercell support](https://support.clashroyale.com/hc/en-us/articles/49484923993883-Card-Evolution)).

### Defense Grid: The Awakening (Hidden Path)

- **Tall towers with distinct silhouettes.** Art director Dave McCoy: "we wanted the towers to be tall structures", with "each design having a distinct silhouette" that is "appropriate for the type of weapon mounted on it" ([Game Developer](https://gamedeveloper.com/design/from-concept-to-execution---the-art-of-i-defense-grid-the-awakening-i-)).
- **Upgrade level is one global colour ramp**, green, yellow then red, shared by all towers (Wired, cited in [Wikipedia](https://en.wikipedia.org/wiki/Defense_Grid:_The_Awakening)).
- **Opposed shape languages.** Blocky, ancient towers against "smooth bio-tech" attackers ([Game Developer](https://www.gamedeveloper.com/game-platforms/feature-how-i-defense-grid-i-went-from-bleak-to-beautiful)).
- **Roster cut for clarity.** "whittled down that amount in order to not to confuse players" (same source). The game shipped 10 tower types.

### Briefer notes

- **Thronefall.** Paul Schnepf: "the silhouette of objects is the element that communicates the most information". The game also uses outlines and "a very limited color palette" ([Game Developer](https://gamedeveloper.com/design/mastering-minimalism-and-layering-complexity-with-strategy-game-thronefall)).
- **Arknights.** 8 classes and 72 branches. Each class and branch has an icon and a one-line shared trait, so players learn 8 class icons and the branch text does the rest ([arknights.wiki.gg](https://arknights.wiki.gg/wiki/Class)).
- **Legion TD 2.** Faction (the unit's look) and damage type (an icon) are separate axes ([legiontd2.wiki.gg](https://legiontd2.wiki.gg/wiki/Armor_Types)).
- **StarCraft.** Samwise Didier: Protoss are "elliptical and circular", Terran "angular and square", Zerg "erratic and organic and spiky". With family-level shape languages, players could classify a never-before-seen unit ([Engadget](https://www.engadget.com/2011/10/25/how-blizzard-makes-the-starcraft-2-races-so-iconic/)).

---

## 3. Unifying gimmicks

**The pattern.** The successful examples share three things:
- a fixed **template** (monkey, plant with a face, Pikmin body, Kirby, an Olympian god);
- one **variable** that carries the role (gear, species, colour, hat, domain);
- **borrowed knowledge**, so the variable explains itself (peas get shot, nuts block, fire burns).

| Game | Template | Variable = role | Note |
|---|---|---|---|
| Plants vs. Zombies | a plant with a face | species and mouth/shape | "I chose plants because I needed units that would stay stationary". The template is a mechanic ([Rosewater](https://magic.wizards.com/en/news/making-magic/piggybacking-2012-08-20)) |
| Bloons TD 6 | a monkey | oversized gear | 23-25 towers in 4 colour-coded categories ([Giant Bomb](https://giantbomb.com/wiki/Games/Bloons_TD_6)) |
| Kirby | round pink body | the hat | "he wears a unique 'hat' that indicates what power he has" ([gameranx](https://gameranx.com/updates/id/372692/article/kirby-super-star-origins-revealed-by-sakurai-in-newest-video/)) |
| Pikmin | one sprout-headed body | colour = ability | after ~5 colours, new types need shape changes too (Rock, Winged, Purple) |
| Hades | Olympian gods | the god's domain | new members must be "cool and distinct", not "too same-y" ([Game Developer](https://gamedeveloper.com/design/how-supergiant-added-new-goddess-demeter-to-i-hades-i-pantheon)) |
| Element TD | an elemental tower | element = attack *shape* | Light is long-range single-target, Fire has the largest splash; dual elements multiply the roster ([eletd forums](https://forums.eletd.com/topic/2681-characteristics-of-the-elemental-towers/)) |

**Why they work:**
- **Recognition is free.** The template says "one of mine", so the eye only has to parse the variable. Riot: a good silhouette has "a defining primary characteristic that's unique to that champion" ([Riot](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/)).
- **"Piggybacking".** The variable borrows meaning the player already has (Rosewater, above).
- **Charm comes from faces.** Fan says adding blinking "really sold it". The Wall-nut's lead artist: "you feel for the guy when he starts getting eaten" ([Escapist mirror](https://escapistmagazines.pages.dev/posts/the-sunny-side-of-the-zombiepocalypse)).
- **Teaching.** If the look explains the function, tooltips can stay under 8 words (Fan's cap).
- **Productive constraint.** "Placing restrictions on yourself, leads you to places you would never naturally go" (Rosewater, [summary](https://elitegamedevelopers.substack.com/p/magic-the-gathering-twenty-years-twenty-lessons-learned)).

**Where they break down:**
1. **Variant exhaustion at about 25 on one axis.** Kirby director Kumazaki: "once you go over 25 copy abilities, you start to see an effect…" ([Nintendo Life](https://www.nintendolife.com/news/2016/09/kirby_planet_robobot_director_discusses_how_copy_abilities_are_chosen)). PvZ2 players complain of "clones" ([EA forums](https://forums.ea.com/discussions/plants-vs-zombies-2-en/improving-plant-versatility-stop-the-clones-and-buff-classic-plants/13241276), snippet).
2. **The template eats the silhouette.** If every unit has the same body, the body stops telling them apart. Riot admits Lee Sin "doesn't really have a distinct character model silhouette" ([Riot](https://www.leagueoflegends.com/en-gb/news/dev/ask-riot-let-s-talk-clarity/), snippet). Same-body rosters need a *big* variable part.
3. **Production cost multiplies.** Every template feature has to be drawn for every variant (Sakurai on Kirby's hats in Smash).
4. **Category ambiguity.** BTD's Ninja is listed under different categories in different sources. Assign each ward's family once and keep it.

**For Hollowlight** (agent synthesis, which I agree with): the natural mechanical fact is that **every ward is a light source that pushes back the Gloom**. That suggests a light-based template: lanterns, spirits of the Heartfire, or stones the light wakes. Section 3 of the design system develops three such directions.

---

## 4. Systems that scale

| Channel | Encodes | Examples |
|---|---|---|
| Base silhouette / shape language | family or role | KR's 4 families; StarCraft's circles, squares and spikes; LoL's "source of power" |
| Hue | element, damage type or class | Pokémon types; Pikmin; MTG colour pie; Hearthstone class frames |
| Frame or border shape | card or unit type | Slay the Spire: Attack (tapered), Skill (rectangle), Power (oval) ([wiki.gg](https://slaythespire.wiki.gg/wiki/Card)) |
| Frame colour | rarity or tier | Slay the Spire grey, blue, gold; Clash Royale rarities |
| Value / brightness | importance, focal point | LoL VFX hierarchy; Dota's dark-feet-to-light-head |
| Ornament count | upgrade level | BTD Blade Shooter blades; Arknights stars |
| Silhouette break at the top tier | ultimate | BTD tier 5 and Paragons; KR level-4 specialists; Arknights Elite 2 art |
| Icon badge | class / branch / damage type | Arknights; Legion TD 2; PvZ2 seed-packet badges |

**None of these games uses one hue for two different facts.**

Lessons for a 20+ roster:
- **Plan the palette for the final roster, not today's.** When Demon Hunter arrived with its own green, Hearthstone had to lighten Hunter's green frames ([outof.games](https://outof.games/hearthstone/1648-hearthstone-hunters-receive-lighter-green-card-frames-to-better-differentiate-from-demon-hunters)). Reserve hue slots now.
- **A colour should mean "these verbs and not those".** In MTG's colour pie, red is the colour of direct damage, and green gets no counterspells ([Wizards](https://magic.wizards.com/en/news/making-magic/mechanical-color-pie-2021)). Players can then predict a new unit's role before reading its text.
- **A two-level taxonomy scales to hundreds of units.** Arknights: learn 8 class icons, then read one line of branch trait.
- **Family shape languages let players classify unseen units.** StarCraft (above).
- **Use a second axis past about 25 units.** Element TD's dual and triple elements, and Slime Rancher's Largos (one slime's body plus another's feature), build new units from known parts instead of more one-offs.
- **Riot's written clarity rules** ([Clarity in League](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/)):
  - "The amount of attention an ability grabs should match its level of importance".
  - "Projectiles should convey the direction they're traveling, even without motion".
  - Skins never remove the primary feature.
  - The 2017 VFX guide adds that one hue drives the theme with a desaturated accent, and peak brightness is kept for the moment of impact ([VFX Apprentice summary](https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips)).

---

## 5. Art and UI readability principles

### Silhouette

- **The test.** Fill each design as a flat black shape with no interior detail. If two designs are alike as blobs, colour or detail is doing work that shape should do.
- **TF2.** Valve validated the classes this way: "demonstrating the ability to visually read the characters even with no internal detail was used to validate the character design during the concept phase" ([SIGGRAPH 2007 notes](https://www.advances.realtimerendering.com/s2007/Mitchell-IllustrativeRenderingInTF2(Siggraph07%20Course%20Notes).pdf)).
- **TF2's read hierarchy** ([GDC 2008](https://cdn.steamstatic.com/apps/valve/2008/GDC2008_StylizationWithAPurpose_TF2.pdf)):
  1. team, via colour;
  2. class, via silhouette;
  3. weapon, via the "highest contrast at chest level, where weapon is held".
- **Top-down cameras.** Dota 2 (near top-down): "A hero's silhouette must be clearly identifiable at first glance. The silhouette should show a character's orientation" ([Dota 2 Character Art Guide](https://help.steampowered.com/faqs/view/0688-7692-4D5A-1935)). StarCraft II's Allen Dilling: "in RTS you have to be more crystal clear, because the top-down view… you really have to have a unique silhouette and distinct outline for each guy" ([NAG](https://www.nag.co.za/2011/11/17/blizzcon-2011-exclusive-starcraft-ii-interview/)).
- **What a pure top-down view does to silhouettes.** Seen from straight above, a silhouette is just the footprint plus whatever sticks out, so a tall spire and a squat dome both become the same circle. This is our biggest structural problem (section 6 and the diagnosis).

### Value

- **Value before colour.** Dota: value "is more important than color… it creates focal points". "Turn your character to greyscale… and recheck the values." Avoid absolute white and black, which become "flattened or overblown" ([Dota guide](https://help.steampowered.com/faqs/view/0688-7692-4D5A-1935)).
- **The squint test.** A sprite should still show "a few large clusters of light and dark" when you squint at it ([Derek Yu](https://derekyu.com/makegames/pixelart.html)).
- **The most important read gets the most contrast** (TF2's chest level; the Dota value gradient). For a ward, that is the light or weapon.
- **Detail.** "Details that are too small simply become noise. Larger areas with less or no detail read much clearer" (Dota). "High frequency detail is omitted where possible" (TF2).
- **Hollowlight consequence.** Additive glows push overlapping pixels toward white, so neighbouring T4 halos flatten into one bright mass. That is the "overblown" failure.

### Hierarchy and the noise budget

- **Riot's priorities:** gameplay clarity first, then minimising clutter, then theme, then delight. Avoid "near-permanent transformations" ([Riot](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/)).
- **Saturation budget:**
  - Environment lowest, UI controlled, VFX highest (Riot).
  - "Choose very small areas for the highest saturation" (Dota).
  - "muted colors dominating and small areas of saturation" (TF2).
- **Hollowlight's screen hierarchy should be:**
  1. **Primary:** enemies and attacks.
  2. **Secondary:** ward identity (silhouette and body value).
  3. **Tertiary:** tier and idle flavour.

  Today our idle T4 auras are pitched at the primary level.

### Shape language and Gestalt

- **Shape connotations.** Circle reads as friendly, square as sturdy, triangle as dangerous. This is a rule of thumb from character design. Experiments support sharp contours reading as threatening (Bar & Neta 2006, via summary).
- **Build distinct shapes from independent dimensions:**
  - outline class (round, polygonal, spiky, crescent, ring with a hole);
  - protrusion count (1-4, which people read without counting: [subitizing](https://en.wikipedia.org/wiki/Subitizing));
  - aspect ratio (compact or elongated);
  - edge character (smooth or hard).

  Five outline classes × four protrusion counts already gives 20 combinations before colour is used.
- **Gestalt similarity.** "the common color tends to stand out more prominently than other traits, such as shape" ([NN/g](https://www.nngroup.com/articles/gestalt-similarity/)). Wards that share cyan glows and orbiting shards are perceived as one group.
- **Hue masks shape.** Background colour variation slows the detection of shape. "The most important data attributes should be displayed with the most salient visual features" ([Healey & Enns 2012](https://healey.csc.ncsu.edu/publications/15783.pdf)).

### Colour

- **Never rely on hue alone.** "use colour as a back-up for another means of communicating the information". Red-green deficiency affects about 8-10% of men ([Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-colour-alone/)). Pair each colour with a symbol ([AbleGamers](https://accessible.games/accessible-player-experiences/access-patterns/distinguish-this-from-that/)).
- **Confusion pairs** for red-green deficiency include **cyan/grey** and **blue/purple** ([Wikipedia](https://en.wikipedia.org/wiki/Color_blindness)). Both are central to our current palette.
- **How many hues at once.** About 5 colours are fast and accurate, and "seven isoluminant colours is the maximum… while still allowing rapid and accurate identification" ([Healey 1996](https://www.cs.ubc.ca/sites/default/files/tr/1996/TR-96-10_0.pdf)). For 20+ wards, hue must be a *category* (5-8 families), never the individual identity.
- **Map colour.** "Avoid using colors which are dominant in the Dota map" (Dota guide). Our map is bright turf green (`#2f9a74`), so ward bodies and lights should avoid mid greens or be strongly separated in value.

### Showing level at small size

- **Marks.** Use 1-4 marks in a consistent place. Numerosity is reliable "if quantities don't exceed three" ([Few](https://www.perceptualedge.com/blog/?p=2957)), and subitizing covers four or fewer.
- **Shape changes.** Make silhouette changes at *milestone* tiers, not every tier. Clash of Clans' Archer Tower grows each level but changes design only at a few ([clasher.us](https://www.clasher.us/clash-of-clans/unit/Archer_Tower), via summary).
- **Growth.** Grow protrusions (a longer barrel, more prongs) rather than the whole body. The footprint caps size.
- **Motion.** Motion is a preattentive channel. Give families distinct, low-amplitude idle rhythms and a short pre-fire anticipation. Keep idle motion below attack motion.

### Small-scale specifics

- **Test at real size.** "Always design two versions of each icon" ([Primer Octicons](https://primer.style/octicons/design-guidelines)). "The smaller a sprite gets, the less your sprite looks like what it's supposed to represent" (Derek Yu).
- **Shapes and gradients.** Use "as few shapes with as few corners as possible", avoid extremes of thick and thin, and keep gradients to one or two steps ([Microsoft icon guidelines](https://learn.microsoft.com/en-us/windows/apps/design/style/iconography/app-icon-design)).
- **Strokes.** On canvas, prefer strokes of at least 1.5-2 px.
- **Light direction.** Use one fixed light from the top left, and don't rotate the bevel with an aiming turret, because rotating highlights read as flicker.
- **Separation from the map.** An outline separates a sprite from the background and its neighbours ([Lospec](https://lospec.com/articles/pixel-art-outlines)). We already ink everything, which is a strength worth keeping.

---

## 6. Camera view and showing tiers

### Which view do TDs use, and how do towers aim?

| Game | View | Aiming | What the view does to silhouettes |
|---|---|---|---|
| Bloons TD 6 | near top-down 3D | the whole monkey turns | identity lives on top-facing surfaces and protrusions (hats, barrels, wings); BTD escapes "blobs" because its towers are *characters with gear* |
| Defense Grid | 3D, looking down ~45° [observed] | weapon heads on tall bodies | towers made tall so the whole tower carries the silhouette |
| GemCraft | strict top-down | none (square sockets) | every tower is the same square; identity is gem colour only |
| Infinitode 2 | strict top-down grid | rotating turrets (unverified) | small squares told apart by hue and icon: the closest analogue to Hollowlight today |
| Fieldrunners 2 | high three-quarter | **fixed bases, turrets on top** [observed] | essentially the model this proposal recommends |
| Kingdom Rush 1-5 | oblique three-quarter | **buildings never rotate**; figures on top aim | unique *side* outlines; footprint constant; towers about as tall as they are wide [observed] |
| Clash of Clans | isometric | buildings fixed, weapon parts turn (unverified) | side profiles; levels visible |
| Plants vs. Zombies | side-on lanes | none; plants face their lane | full side profile: "the shape is the verb" |
| Arknights / Legion TD 2 / Thronefall | angled 3D | facing set at deploy / whole units / unchecked | Legion TD 2 gets busy when packed [observed] |

Sources are the Steam screenshots and pages linked in the agent report. **Pattern:**
- Upright and oblique TDs use a **fixed body with a small aiming part**.
- Strict top-down TDs tell towers apart by hue or icon, because their outlines collapse.
- BTD6 is the exception, because its towers are characters with gear that sticks out when seen from above.

**The strongest developer statement** is Defense Grid's art director Dave McCoy ([Game Developer](https://www.gamedeveloper.com/design/from-concept-to-execution---the-art-of-i-defense-grid-the-awakening-i-)):
- Their first build used a camera "looking down onto the playfield", with low weapons on generic pylons. That "made the weapons themselves small and hard to distinguish".
- The fix: "we wanted the towers to be tall structures… each design having a distinct silhouette", so players could "quickly scan the field and determine what weapons systems were deployed where".

**That is Hollowlight's current failure, and its fix.**

A small HTML5-canvas TD developer adds two warnings ([dev.to](https://dev.to/jasonguo/i-built-a-wwii-inspired-tower-defense-game-in-html5-the-hard-part-wasnt-the-towers-2b24)):
- Art that worked as icons felt "too upright… when placed on the map" and had to be redrawn "lower-profile and more grounded".
- "The weapon barrel, projectile origin, and muzzle flash all needed to point at the same target."

### The case against an upright view, and the mitigations

**Against:**
1. **Occlusion with free placement.** Hollowlight has no fixed build plots. Ward centres can be 38 px apart and 38 px from the path centre, so tall wards can hide wards behind them and enemies on the path. Kingdom Rush avoids this with fixed plots.
2. **Placement precision.** "Accurate tower placement is one of the most important things" in TD, and judging position is easier top-down ([gamedev.net](https://gamedev.net/forums/topic/668894-2d-game-aerial-view-or-view-from-angle/5232631/), snippet).
3. **Aim reads smaller.** Today the whole ward points at its target. Afterwards only a ~10-15 px part does.
4. **It is a full art rework,** plus depth sorting, muzzle offsets and hit-testing. The map's paths, trees and rocks are drawn top-down and may need small side faces to match.
5. **Tall wards packed together get cluttered** (Legion TD 2).

**Minimum mitigations:**
- **Height cap:** the body at most ~1.2× the footprint width, about 40-48 px, with the identity feature in the top half.
- **Sorting:** depth-sort wards and enemies by footprint y every frame. Health bars, status and selection go on top.
- **Occlusion fallback:** fade a ward, or draw an enemy outline through it, when an enemy is behind it. Make this a setting.
- **Plan-space simulation:** range stays a true circle on the ground, and shots start from the emitter at (x, y − h).
- **Click targets** are the footprint plus the body box, front-most first.
- **The aiming part** is asymmetric, at least 10-12 px, with a muzzle glow.
- **Cheaper first step:** prototype 3-4 squat upright wards in the real game and run the crowd test.

**Measured here.** `concepts/crowd-test.png` packs late-game wards at the minimum spacing on both sides of a path with real enemy art, depth-sorted, and measures what is hidden (details in the design system, section 2.1):

| | Current top-down | Upright (all three directions) |
|---|---|---|
| Enemy pixels hidden behind wards | 17% | 6-7% |
| Each ward's own pixels hidden by other wards (average) | 27% | 11-17% |

Today's wide T4 rune rings already overlap the path and each other. So occlusion is a real cost of going upright, but **no worse than the current art**, as long as heights are capped. My mock-ups are too tall: T4s average 57-64 px above the footprint, against a cap of about 48. The design system sets the cap.

### How games show tiers (distilled)

**What changes per tier:**
- Mass and material, in small steps.
- **One countable cue** (Clash of Clans adds a third archer; BTD adds a blade per upgrade).
- Projectile and effect escalation.
- **A silhouette break only at the top tier or specialisation** (BTD tier 5, KR level 4, Clash Royale Evolution).
- If paths exist: the main path sets colour family plus shape, and the secondary path adds a small decal (BTD6).

**What never changes:**
- The footprint.
- The type's signature feature and emblem.
- The proportions: KR towers stay squat at every level.
- Any tier colour means the same thing on every tower, and is never also a tower's identity colour.

**Where tier is shown.** Games where tier matters to decisions mid-wave (KR, BTD6, CoC, Defense Grid) show it in the world. Card games (Clash Royale levels, Arknights promotions, PvZ2 levels) show it only in the UI.

---

## 7. A readability checklist for Hollowlight wards

These are pass/fail checks, run on a contact sheet at real size over the real map. `docs/concepts/_src/` renders these sheets headlessly, so most checks can be run on every art change. The thresholds are starting values synthesised from the sources, not published standards. Tune them in playtests.

1. **Silhouette.** At tier 1, as solid black at 36 px, a tester names the right ward ≥90% of the time.
2. **Identity survives tiers.** In silhouette, each ward's T4 is matched to its own base rather than to another ward ≥90% of the time. The automated proxy is the nearest-neighbour blend metric in `_src/metrics.mjs`.
3. **Greyscale.** Every ward is identifiable desaturated, and its brightest region is its light or weapon.
4. **Value against the map.** Each ward's outline or body edge separates from both the lightest and darkest turf by ≥3:1 contrast.
5. **One focal point.** Blurred, each ward shows one brightest spot and at most 3 value blocks.
6. **No idle white-out.** Ten adjacent idle wards never push pixels between them to near-white. Near-white is reserved for firing and impact.
7. **Hue budget.** At most 8 hue families roster-wide, each mapped to a documented meaning (damage type). No ward's identity depends on hue alone.
8. **Colour-blind pass.** Run the sheet through deuteranopia and protanopia simulation, and check that wards and tiers remain distinct. `_src/render-palette.mjs` does this for the palette.
9. **Map-hue avoidance.** No dominant ward body colour sits in the map's green band without at least ~25 L* of value separation.
10. **Facing.** For aiming wards, the aim direction reads from shape alone.
11. **Tier at a glance.** 1-4 solid marks in one consistent place on every ward, plus a shape change at T3. A tester states a ward's tier at 36 px within 1 s, ≥90% correct.
12. **Tiers amplify identity.** At least half of each tier's change is to the ward's own unique feature. At most one shared tier motif roster-wide.
13. **Minimum feature size.** No meaningful stroke under 1.5 px, and no meaningful feature under 3 px, at real size.
14. **Motion budget.** Idle amplitude stays below attack amplitude. Each family has a distinct idle rhythm.
15. **Crowd test.** In a mid-wave screenshot with 25+ wards, a tester can point to every instance of a named ward within 3 s, and enemies stay the most salient thing on screen.
