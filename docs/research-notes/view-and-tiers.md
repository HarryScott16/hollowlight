<!-- Raw notes from a web-research sub-agent (2026-11-19), kept for their source links. The reviewed synthesis is docs/visual-research.md. -->

# Camera view and tier visuals in tower defense: evidence for an upright three-quarter view in Hollowlight

This research asks whether Hollowlight should move from strictly top-down, whole-body-rotating wards to upright three-quarter wards. In the upright version the body is fixed and only a small part aims.

**How claims are marked**
- **[observed]**: I looked at an official Steam store screenshot and describe what is visible. The image URL is given. These are still images, so I could not watch any animation.
- **(unverified)**: general knowledge or inference that I could not source.
- **(via search summary)**: I saw the claim only in a search-engine digest and could not fetch the page.

**Sources that could not be fetched.** Fandom wikis, the Kingdom Rush wiki.gg, cocmap/clasher.us, supercheats, the Epic Games Store article, web.archive.org and the gamedev.net thread were blocked (403 or bot walls).

**Earlier research.** The companion files `games.md` and `principles.md`, in the same folder, already cover BTD6, Kingdom Rush, PvZ, Clash Royale, Defense Grid, Valve, Riot and Blizzard. I cite them where I reuse their findings.

**Hollowlight facts used below**, from the repo:
- Placement is free, not grid-snapped. `RULES.towerSpacing = 38` px between centres (`public/js/data/rules.js`).
- `towerRadius = 18` is the footprint used for placement and clicking.
- `pathWidth = 44` (`public/js/data/map.js`).
- A ward may sit with its centre about 22 + 16 = 38 px from the path centreline (`public/js/sim/path.js`, `buildable`).
- Wards are drawn at 40-60 px. So the art already exceeds the 36 px footprint, and two wards at minimum spacing already overlap visually.

---

## 1. Camera and view conventions in notable TDs

### 1.1 Per-game table

| Game | View | How towers aim | Effect of the view on silhouettes | Sources |
|---|---|---|---|---|
| **Bloons TD 6** (Ninja Kiwi) | Near-top-down 3D with a slight perspective tilt. Tall props show a little side face. | The whole monkey turns to face its target. In screenshots the monkeys face different directions (rotation itself unverified). | From above, a monkey reads as head plus gear: hats, hoods, barrels, wings. Identity has to live on top-facing surfaces and on things that stick out. Tier 5s break the outline with wings, robes or floating orbs (games.md). | "first Bloons TD game to feature 3D graphics", and it introduced "line of sight" ([bloonswiki: BTD6](https://www.bloonswiki.com/Bloons_TD_6)). Screenshot [observed](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/960090/ss_a20e85177d96408281e0672927f8e9137c1f423a.1920x1080.jpg) |
| **Defense Grid: The Awakening** (Hidden Path) | 3D, camera angled down at roughly 45° [observed]. Not strictly top-down. | Weapon heads sit on top of tall tower bodies. Turret rotation is not described in the art article (unverified). | Towers were made tall so the *whole tower* could carry a silhouette (see 1.2). | [Game Developer: art of DG](https://www.gamedeveloper.com/design/from-concept-to-execution---the-art-of-i-defense-grid-the-awakening-i-). Screenshot [observed](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/18500/0000005944.1920x1080.jpg) |
| **GemCraft: Frostborn Wrath** | Strict top-down [observed]. | No visible aim. Towers are square sockets holding a gem, and shots leave from the centre [observed]. | Every tower has the same square silhouette, so identity is carried entirely by gem colour. This is the extreme version of Hollowlight's "every ward is a blob" problem, made workable because there is only one tower shape. | Screenshot [observed](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1106530/ss_ef7a61c13a9f0f2b81e14d13ca734f93040ef02d.1920x1080.jpg) |
| **Infinitode 2** | Strict top-down tile grid on a dark background [observed]. | Rotating turrets (unverified; the screenshot is too small to see). | Towers are small squares told apart by hue and icon [observed]. This is the closest analogue to Hollowlight's abstract look. | Screenshot [observed](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/937310/ss_f2e97128f8ecfe3450c40715f0798a41291b3cc0.1920x1080.jpg) |
| **Desktop Tower Defense** | Top-down Flash game. | Rotating turrets (unverified, no source fetched). | Small square turrets (unverified). | none |
| **Fieldrunners 2** (Subatomic) | High-angle three-quarter view: building fronts show, the ground is foreshortened [observed]. | **A hybrid.** Fixed round domes or bases with turrets on top, and the barrels point in different directions [observed]. This is essentially the model being proposed for Hollowlight. | The base gives a consistent upright body. Turret heads and barrels carry the type. | Screenshot [observed](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/215710/ss_26409c9ba64a409ce9b719f0a72b7175de995e72.1920x1080.jpg) |
| **Kingdom Rush 1-5** (Ironhide) | Top-down oblique "three-quarter" view, not true isometric. Paths and ground are drawn almost plan-like. Buildings show a front face and a roof [observed]. | **Buildings never rotate.** Small figures on top (archers, wizard) and dwarf artillery crews provide the "aim". Projectiles arc to the target. Figures turning to face targets is unverified. | Each type has a unique *side* outline: sandstone mage hut with a rune glyph, keep with conical roofs, treehouse, copper mortar drum, gold Tesla spires. Footprint is constant. Towers are about as tall as they are wide [observed]. | KR1 screenshots [observed: A](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/246420/ss_aaaf33cdb9106bd0801a36049516d95c6f2352b0.1920x1080.jpg), [B](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/246420/ss_15c7c9f1eb4150695f4c6fe0f081718cc13c886d.1920x1080.jpg). KR5 [observed](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2849080/ss_2a8c46a4e35c870b7b9eab8afefbd91f78ebee57.1920x1080.jpg) |
| **Iron Marines** (Ironhide) | Same oblique style as KR (unverified; the screenshot I pulled was the world map). | Units turn (unverified). | none | none |
| **Arknights** (Hypergryph) | Tilted 3D grid with 2D chibi operators (unverified). | **No aiming.** The player gives each operator a facing when deploying, and that facing fixes its attack range: "Rangers' Attack Range… is determined by the direction assigned to him when deployed". Facing changes only by redeploying. Ranged units have a blind spot behind them. | Melee units use ground tiles and ranged units use high-ground tiles, so the tile type pre-sorts roles. Class is read mostly from UI rather than from the small sprite (games.md, unverified). | [arknights.wiki.gg TR-2 guide](https://arknights.wiki.gg/wiki/TR-2/Guide) (via search summary) |
| **Legion TD 2** (AutoAttack) | 3D, camera angled down the lane [observed]. | Units are whole characters that face the incoming lane (whole-unit turning is unverified). | Character silhouettes are seen from about 45°. The read is busy when many units are packed together [observed]. | Screenshot [observed](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/469600/ss_e279d036f93bdab230950f04b1144c2d6871621b.1920x1080.jpg) |
| **Thronefall** (Grizzly Games) | 3D low-poly, angled about 45° with long shadows [observed]. | Not checked (unverified). | Schnepf: "the silhouette of objects is the element that communicates the most information". The game uses outlines and a very limited palette ([Game Developer](https://gamedeveloper.com/design/mastering-minimalism-and-layering-complexity-with-strategy-game-thronefall), games.md). Upright buildings read as distinct shapes even at small size [observed]. | Screenshot [observed](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2239150/ss_7755da74d905e510998b08d36eb9758869e2f768.1920x1080.jpg) |
| **Dungeon Warfare** | Mostly top-down pixel art. Wall blocks show a front face [observed]. | Traps fire along fixed directions (dart traps on walls, floor spikes), with no rotating aim [observed in part, otherwise unverified]. | Traps are small tile-sized icons. Arrows on the traps show direction [observed]. | Screenshot [observed](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/355980/ss_16df0f149e63faf905162551fbd28e0932c3b6da.1920x1080.jpg) |
| **Plants vs. Zombies 1/2** | Side-on lanes, slightly from the front. | **No aim.** Plants face right and fire along their lane. Peashooter's range is "Whole Lane to the Right". | You get the full side profile, so the shape shows the verb: the mouth or barrel points the way it fires ([George Fan, GDC 2012](https://www.gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan)). | [PvZ wiki.gg Peashooter (PvZ2), raw text](https://plantsvszombies.wiki.gg/wiki/Peashooter_(PvZ2)) |
| **Clash of Clans** | Isometric diamond grid. | Buildings are fixed. Only the weapon part turns: the cannon barrel, the archers on the Archer Tower (unverified). | Buildings show their side profile. Level changes are visible (§3). | none |

**Pattern.** The "fixed body, small aiming part" model is the norm in upright and oblique TDs: Kingdom Rush, Fieldrunners and Clash of Clans. Strict top-down TDs, such as Infinitode, GemCraft and Desktop TD, use rotating turrets or no aim at all. They tell towers apart by hue or an icon rather than by outline. The most-played top-down TD, BTD6, sidesteps the blob problem because its towers are *characters with gear*. From above, hats, hoods and barrels stick out from the body.

### 1.2 Developer statements about the view

- **Hidden Path (Defense Grid), art director Dave McCoy.** This is the strongest evidence on the question ([Game Developer](https://www.gamedeveloper.com/design/from-concept-to-execution---the-art-of-i-defense-grid-the-awakening-i-)).
  - The camera: "The viewpoint of the player would be looking down onto the playfield."
  - An early version mounted low weapons on generic pylons. This "made the weapons themselves small and hard to distinguish", and low towers "created problems with towers having line of sight to their intended targets".
  - The fix: "Knowing that we wanted the towers to be tall structures", they made the whole tower unique, "with each design having a distinct silhouette", so players could "quickly scan the field and determine what weapons systems were deployed where".
  - **Lesson: when only the weapon differs and the body is generic, a high camera makes towers hard to tell apart. Give the body the silhouette.** This is the same failure Hollowlight has now.
- **Ironhide (Kingdom Rush).** I found no statement on why they chose the perspective. Available interviews cover tools (Flash for art and animation, Photoshop for concepts) and team roles ([fan interview](https://sites.google.com/view/brookspweaver/other-projects/interviews/kingdom-rush-by-ironhide-game-studio), [Kodeco interview](https://www.kodeco.com/?p=30636)). A critic credits the "uncomplicated aesthetic" with clarity when the battlefield is crowded ([The Avocado](https://the-avocado.org/2019/02/01/franchise-festival-48-kingdom-rush/)).
- **Ninja Kiwi (BTD6).** I found no statement on why BTD6 went 3D. The wiki records that BTD6 was the first BTD in 3D and that 3D terrain became a mechanic: line-of-sight blockers, with range overlays coloured differently where line of sight is blocked ([bloonswiki: Line of sight](https://www.bloonswiki.com/Line_of_sight), [BTD6](https://www.bloonswiki.com/Bloons_TD_6)). Ninja Kiwi moved to Unity in 2017 for cross-platform reasons ([Scoop press release](https://scoop.co.nz/stories/BU1711/S00125/ninja-kiwi-goes-up-and-away-with-unity.htm), via search summary). They kept the top-down view, so the move to 3D added depth without changing the camera.
- **Valve (Dota 2).** Dota 2 uses a high-angle camera.
  - "A hero's silhouette must be clearly identifiable at first glance. The silhouette should show a character's orientation" ([Dota 2 Character Art Guide](https://help.steampowered.com/faqs/view/0688-7692-4D5A-1935); quoted in principles.md from an archived copy, and I could not re-fetch it this session).
  - A Dota artist notes that "with a top down camera, Dota 2 items have quite heavy restrictions" in polycount and texture ([80.lv](https://80.lv/articles/creating-characters-for-dota-2/), via search summary).
- **Blizzard (StarCraft II).** Allen Dilling: "in RTS you have to be more crystal clear, because the top-down view… you really have to have a unique silhouette and distinct outline for each guy" ([NAG](https://www.nag.co.za/2011/11/17/blizzcon-2011-exclusive-starcraft-ii-interview/), via principles.md).
- **An indie HTML5-canvas TD (Allied Frontline Defense).** This is a close match for Hollowlight's tech.
  - Tower art that worked as square icons felt "too upright or too side-on when placed on the map", so the battlefield versions were redrawn "lower-profile and more grounded".
  - "The weapon barrel, projectile origin, and muzzle flash all needed to point at the same target."
  - The developer's biggest lesson was "about readability".
  - Source: [dev.to](https://dev.to/jasonguo/i-built-a-wwii-inspired-tower-defense-game-in-html5-the-hard-part-wasnt-the-towers-2b24).
- **Practitioner notes on perspective cost and readability.**
  - "Games with a perfectly vertical perspective are the cheapest to create sprites for… you can let your rendering software rotate the sprites". But top-down is "not a very flattering perspective", because you see only the tops of heads. A 3/4 oblique view needs "at the very least 3 sets of sprites" ([cxong](https://cxong.github.io/2022/03/how-many-sprites-do-different-perspectives-need)).
  - A developer rendering from directly overhead found "you can hardly tell what the character is really supposed to be" and tilted the camera to show the front ([OpenGameArt](https://lpc.opengameart.org/node/39638), via search summary).
  - Top-down "fails to fully display three sides of a box", and height and depth "occupy the same space" ([Significant Bits](https://www.significant-bits.com/a-laymans-guide-to-projection-in-videogames/)).
  - **Counterpoint for top-down:** in TD, "accurate tower placement is one of the most important things", and judging grid position "is generally easier with a top-down view" ([gamedev.net thread](https://gamedev.net/forums/topic/668894-2d-game-aerial-view-or-view-from-angle/5232631/), via search summary). Civ IV reportedly moved away from Civ II's isometric map because distances were harder to judge (same thread, via search summary).

---

## 2. Practical problems of an upright view in TD, and mitigations

### 2.1 Overlap and depth sorting
- **Standard technique.** Sort by the sprite's ground point. "sprites that are higher up the y-axis are sorted behind sprites that are lower, to make them appear further away" ([Unity manual: sorting](https://docs.unity3d.com/2021.3/Documentation/Manual/sprites-sort.html)). The sort key must be the *foot or base* point, not the sprite centre. A Defold user found occlusion broke until pivots were moved to the bottom centre ([Defold forum](https://forum.defold.com/t/puzzling-3d-sprite-tile-depth-sorting-behavior-solved/19151), via search summary). On canvas, sort wards and enemies together by footprint y every frame.
- **What KR does** [observed, KR1 screenshot B]:
  - Enemies lower on screen are drawn over towers above them. The boss at the centre-left overlaps the towers behind it.
  - Health bars and comic callouts sit on top of everything.
  - Towers sit on fixed plots with about half a tower-width of empty ground between neighbours, so tower bodies rarely overlap each other.
- **The Hollowlight-specific risk.** With free placement at 38 px minimum spacing, a ward drawn H px tall whose base sits on its footprint hides about **H − 38 px** of the ward directly above it. At H = 56 that is the bottom 18 px. In a dense cluster, every ward except the bottom row would lose its base. So either increase spacing for upright art, or keep the identifying shape in the top half of each ward. KR's answer is spacing: plots, not free packing.

### 2.2 Footprint vs drawn height
- The footprint stays the logical object: range centre, placement and spacing. In KR every tower stands on a darker ground patch, a ground-plane ellipse wider than it is tall, that marks the footprint [observed, KR1 screenshot B]. The same holds in KR5, where towers sit on round stone plinths [observed].
- **Click and hit targets.** The visible body now extends upward, past the footprint. Players will click the body. So hit-test the union of the footprint circle and the body's bounding box. When targets overlap, choose the front-most one (largest base y). Placement checks keep using the footprint. This is a synthesis, not sourced.
- Add a ground shadow or base ellipse under every ward. It shows where the ward actually stands and keeps it from looking like it floats. Lospec notes that outlines can make objects look like they float ([Lospec](https://lospec.com/articles/pixel-art-outlines), via principles.md).

### 2.3 Range circles and projectile origins
- **Range.** If Hollowlight keeps a plan-like ground (as KR and BTD6 do) and draws only the wards upright, range can stay a true circle centred on the **footprint**, not on the drawn body. KR draws ground-plane effects as ellipses: the magenta status rings and the plot patches [observed]. That implies a slightly foreshortened ground. For Hollowlight, mixing a circle sim with an ellipse render would mislead players, so keep the sim and the indicator both circular in plan space.
  - A developer of an isometric TD computed "the range intersection in the top-down view of the tiles" and converted afterwards ([gamedev.net, via search summary](https://gamedev.net/forums/topic/668894-2d-game-aerial-view-or-view-from-angle/5232631/)).
  - BTD6 shows that range overlays must stay legible in 3D. It has a "Tower Range Circle" setting with default, high-contrast and colour-blind palettes, plus a second colour where line of sight is blocked ([bloonswiki: BTD6](https://www.bloonswiki.com/Bloons_TD_6)).
- **Projectile origin.** The emitter is now h px above the footprint, so shots should leave from (x, y − h) and arrive at the enemy's body centre. "The weapon barrel, projectile origin, and muzzle flash all needed to point at the same target" ([dev.to](https://dev.to/jasonguo/i-built-a-wwii-inspired-tower-defense-game-in-html5-the-hard-part-wasnt-the-towers-2b24)).
  - Keep hit detection in plan coordinates and apply the height offset only in the renderer.
  - Beams and Hollowlight's continuous flamethrower Censer will visibly start from the emitter, not the footprint. The offset is constant per ward and tier.

### 2.4 Path occlusion: tall wards hiding enemies
- **The geometry.** An upright ward's body extends *upward* on screen. A ward placed just **below** (south of) a path therefore draws its body over the path. A ward just **above** a path is drawn behind the enemies, so it is safe. With Hollowlight's current clearance (ward centre as close as about 38 px from the path centre), a 56 px-tall ward south of a path would cover most of the 44 px path width for the length of its body.
- **Evidence that players notice.**
  - An itch.io player said the "only bad thing is that enemies behind the tower are not visible" ([itch.io](https://itch.io/post/14483405), via search summary).
  - Another said a fixed camera angle caused spike traps to be "hidden behind other scenery" (itch.io, via search summary).
  - In AoE II, units hidden behind buildings without outlines draw bug reports ([AoE forum](https://forums.ageofempires.com/t/bug-units-completely-hidden-behind-castle-no-unit-outline/73253)).
- **Common mitigations:**
  1. **Height cap.** KR towers are roughly as tall as they are wide, about 1.0-1.2× the footprint width [observed]. They are squat keeps and huts, not spires. This keeps occlusion small.
  2. **Asymmetric placement clearance.** Require more clearance on the south side of a path than on the north side, about H − footprint radius extra. KR achieves the same thing with pre-placed plots [observed]. This is a synthesis.
  3. **Fade or dither the occluder.** When an enemy's footprint is inside a ward's body rectangle and behind it (smaller y), draw that ward at about 40-60% alpha, or dithered. This is the standard "x-ray"/dither approach ([GDevelop forum](https://forum.gdevelop.io/t/how-to-make-objects-invisible-when-player-goes-behind-them/50499/7); [dithering devlog](https://onekit.itch.io/gardener/devlog/1478338/dithering), via search summary). Shardpunk made top walls more transparent after testers "cannot see enough of the floor hidden behind the wall" ([devlog](https://bryqu.itch.io/shardpunk/devlog/148489/devlog-71-making-top-walls-more-transparent)).
  4. **Silhouettes through occluders.**
     - AoE II shows outlines of units behind buildings, and patch notes keep extending this, e.g. outlines behind Mule Carts ([AoE II DE update 99311](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-99311/), via search summary).
     - AoE IV has "Obscured Unit Alpha", which shows "coloured silhouettes of units behind buildings". Some players dislike how it looks and want it toggleable ([AoE forum](https://forums.ageofempires.com/t/please-add-option-to-disable-obscured-unit-alpha/194981)).
     - On canvas this is cheap: draw a flat-colour enemy silhouette in a final pass, clipped to wherever a ward overlaps it.
  5. **UI on top.** Health bars and status icons always go on the top layer, as in KR [observed].
- **Readability benefit to weigh against this.** KR's crowded mid-wave screenshot stays readable because towers are squat, sit on separated plots, and enemies are small and drawn in front when lower [observed].

### 2.5 Art and engineering cost
- Top-down vector art rotates for free. An upright body needs no rotation at all, which is cheaper still. The small aiming part does need care:
  - Either draw it as a top-down disc and barrel that rotates in the screen plane, the way Fieldrunners' turret heads read [observed]. This is the cheapest option for canvas vector art.
  - Or fake 3D by squashing the barrel's y-length by about 0.6-0.7 so pointing "up" and "down" look foreshortened (synthesis).
- cxong estimates a 3/4 oblique view costs about 3-3.5× the sprite sets of a top-down one for characters ([cxong](https://cxong.github.io/2022/03/how-many-sprites-do-different-perspectives-need)). That applies to hand-drawn sprites. For procedural vector wards the cost is mostly redesigning 20+ ward bodies, not frame counts.
- Direction must still read. Dota says "the silhouette should show a character's orientation" (principles.md). At 40-60 px, the aiming part needs a clearly asymmetric shape of at least about 10-12 px, such as a barrel, beak or eye with a slit. Otherwise aim reads only through projectiles (synthesis).

---

## 3. How games show upgrade tiers at small sizes

### Kingdom Rush
- **Levels 1-3 are the same type with linear growth.** The archer line is Archer Tower, then Marksmen, then Sharpshooter (70/110/160 gold), and then it forks into Rangers Hideout or Musketeer Garrison ([wikily.gg](https://wikily.gg/kingdom-rush/towers/archer-tower)). The wiki says the three levels differ only in "basic statistics and the appearance", and Frontiers' versions differ by a "cosmetic redesign" ([KR wiki via search](https://kingdomrushtd.fandom.com/wiki/Category:Ranged_Towers)).
- **Observed growth.** Two barracks in the same KR1 screenshot share the same stone keep and blue shield emblem. One has three blue conical roofs, the other flat battlements. This is consistent with levels adding roofs and mass [observed, [A](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/246420/ss_aaaf33cdb9106bd0801a36049516d95c6f2352b0.1920x1080.jpg)]. A wood → stone → reinforced stone progression with more armoured figures is from memory (unverified).
- **Level-4 specialists keep the footprint, the front emblem and the proportions, but swap material and palette.** The blue sandstone mage becomes a black and purple Sorcerer. The stone archer becomes a leafy treehouse (Rangers) or grey stone with an orange bullseye (Musketeers) (games.md [observed]).
- **Preserved at every level:** the plot footprint, overall height (squat), the type emblem on the front face (shield, rune glyph, bullseye), and the "figures on top" idea.
- Later games went from 4 forking types to many types on linear 4-tier tracks. Alliance has 15 towers with 4 tiers each ([Game8](https://game8.co/articles/reviews/kingdom-rush-5-alliance-td-review), via games.md).

### Bloons TD 6
These are from my reading of the official crosspath sheets ([Wizard](https://www.bloonswiki.com/File:BTD6_Wizard_Monkey_crosspaths.png), [Bomb Shooter](https://www.bloonswiki.com/File:BTD6_bomb_shooter_crosspaths.png)) [observed, games.md].
- **Main path = dominant colour plus silhouette growth.** Wizard path 1 has blue hats, path 2 red and orange, path 3 black and purple hoods. Bomb Shooter path 1 has a red, fatter barrel. Path 2 turns into a pointed missile launcher from tier 3.
- **Secondary path = a small accessory or decal on the main-path model.** Examples are a gem on the hat, or a reticle or starburst decal on the barrel.
- **Tier ladder.** Tiers 1-3 change trim, emblem and girth. Tier 4 adds big props (Summon Phoenix). Tier 5 breaks the base silhouette (Archmage robes, flame wings, Prince of Darkness orbs). Tier 5s "don't change when crosspathed", so the Wizard has "52 unique models" ([bloonswiki: Upgrade](https://www.bloonswiki.com/Upgrade)).
- **Never changes:** the monkey body, the camera, the footprint and the category's signature item (the Wizard's pointed hat).

### Defense Grid
- The team had to "visually represent three variations of each tower type" ([McCoy](https://www.gamedeveloper.com/design/from-concept-to-execution---the-art-of-i-defense-grid-the-awakening-i-)). "Tower strength is denoted by the colours green, yellow and red" (Wired, cited in [Wikipedia](https://en.wikipedia.org/wiki/Defense_Grid:_The_Awakening)).
- This is one global colour ramp shared by all towers, while type is carried by the tall silhouette. Other reviewers give green/orange/red, and DG2's blue → green → red → gold is unverified.

### Clash of Clans
- Buildings change appearance at most levels, with bigger changes at milestones. A fan wiki lists significant Archer Tower changes at levels 6, 11, 13 and 16. It adds a third archer at level 7 and changes arrow effects at higher levels (flaming, purple, then exploding).
- Sources disagree on exact levels ([clasher.us Archer Tower](https://www.clasher.us/clash-of-clans/unit/Archer_Tower), via search summary). A low-reliability blog describes a solid stone base at level 5 and dark iron at level 11 ([blog](https://clash-of-clan28.blogspot.com/2015/02/archer-tower.html), via search summary).
- **Preserved:** the footprint (grid tiles) and the type's basic form, a tower with archers on top (unverified beyond the archer count).

### Clash Royale
- Card levels are stats-only, at about +10% HP and damage per level ([Clash Royale wiki via search](https://clashroyale.fandom.com/wiki/Cards)). No source mentions a model change by level, and I believe troops look identical at every level (unverified).
- **Evolution is the one visual upgrade.** The card "appears magically charged and the troop's appearance has changed to their evolved form", with purple reserved as the evolved colour ([Supercell support](https://support.clashroyale.com/hc/en-us/articles/49484923993883-Card-Evolution)).

### Arknights
- Elite 2 unlocks a new outfit illustration: "An outfit that has been improved after the Operator's Promotion" ([Exusiai gallery](https://arknights.wiki.gg/wiki/Exusiai/Gallery)).
- The wiki galleries list only a "Base Sprite" plus paid outfit sprites, with no separate Elite 2 battle sprite ([Exusiai](https://arknights.wiki.gg/wiki/Exusiai/Gallery), [Frost](https://arknights.wiki.gg/wiki/Frost/Gallery)). So **promotion is visible in menus, not on the battlefield**. That is inferred from the gallery listings (unverified in-game).
- In battle, promotion shows up only through larger attack ranges and new skills (unverified).

### Plants vs. Zombies 2
- **Plant levels** (max 10, 15 or 20 since update 6.6.1) raise toughness, damage, recharge and so on. Some levels unlock special effects ([wiki.gg: Plant upgrade system](https://plantsvszombies.wiki.gg/wiki/Plant_upgrade_system)). The page describes no change to the plant model, so level is effectively invisible on the lawn (inferred, unverified).
- **Costumes** are separate cosmetics and not tied to level in the international version ([wiki.gg: Costumes](https://plantsvszombies.wiki.gg/wiki/Costumes)).
- In PvZ1, "upgrade plants" are planted on top of the base plant and keep its body. The Gatling Pea "looks like a Repeater with facepaint, a gatling gun, and an army helmet" ([wiki.gg](https://plantsvszombies.wiki.gg/wiki/Gatling_Pea_(PvZ)), via games.md).

### General rules distilled
**What changes per tier:**
1. Mass and material climb in small steps: trim, roofs, girth, then a better material.
2. One countable cue: more figures on top (CoC adds a third archer), more spires or emblems.
3. Projectile and effect escalation: CoC arrows become flaming, then purple, then exploding.
4. **A silhouette break is reserved for the top tier or the specialisation**: BTD6 tier 5, KR level 4, CR Evolution.
5. If paths exist, main path = colour family plus shape, secondary path = a small decal (BTD6).

**What never changes:**
1. The footprint or plot size (KR, CoC grid, PvZ tile, BTD6).
2. The type's signature feature and emblem: the Wizard hat, KR's front emblem, the Peashooter body under the Gatling helmet.
3. The camera and proportions: KR towers stay squat at every level.
4. A tier colour, if one is used, means the same thing on every tower (DG's ramp, CR's purple). It is never also a tower's identity colour.

**Games split into two camps.** Some show tier in the world: KR, BTD6, CoC, DG. Others show it only in UI: Clash Royale levels, Arknights promotions, PvZ2 levels. TDs where tier affects placement decisions mid-wave all show it in the world.

---

## Recommendation inputs

### Strongest arguments FOR switching to an upright three-quarter view
1. **It directly fixes the observed failure.** Defense Grid hit Hollowlight's problem with a looking-down camera: generic bases with small weapons were "small and hard to distinguish". They fixed it by making the *whole* tower a tall, distinct silhouette ([McCoy](https://www.gamedeveloper.com/design/from-concept-to-execution---the-art-of-i-defense-grid-the-awakening-i-)). From straight above, height "occupies the same space" as depth ([Significant Bits](https://www.significant-bits.com/a-laymans-guide-to-projection-in-videogames/)), so spires, domes and prisms all collapse to discs. A side outline restores roughly a whole extra dimension of shape vocabulary for 20+ wards.
2. **It is genre-proven at small sizes.** KR's crowded battles stay readable with squat, fixed, emblem-fronted buildings and small aiming figures. Fieldrunners uses exactly the "fixed body, rotating turret" model [observed].
3. **Fixed bodies make tiers easier.** Tier additions (roofs, spires, figures, emblems) have a stable "up" and a stable front face to attach to, as in KR and CoC. Today, rotating bodies spin those additions around, and radial halos and shards turn every high-tier ward into a disc (principles.md).
4. **Lower render cost and less noise.** Rotating whole bodies is replaced by a small rotating part. A fixed light direction becomes trivial, whereas principles.md warns against rotating bevels.
5. **It is a strong genre signal.** Players of KR-style games expect towers to look like buildings. Thronefall and KR show strong visual identity built on side silhouettes.

### Strongest arguments AGAINST
1. **Occlusion and overlap with Hollowlight's free placement.** At 38 px spacing and 40-60 px art, upright wards will hide each other's bases (about H − 38 px) and hide enemies on paths just north of them. KR avoids this with *fixed plots*, and Hollowlight has none. Players do complain about enemies hidden behind towers (itch.io, AoE).
2. **Placement precision.** Top-down is easier for judging positions and distances ([gamedev.net](https://gamedev.net/forums/topic/668894-2d-game-aerial-view-or-view-from-angle/5232631/), via search summary). With free placement and range-sensitive play, the mismatch between body and footprint and the offset of the emitter from the range centre add small errors.
3. **Aim readability shrinks.** Today the whole 40-60 px ward points at its target. Afterwards only a part of perhaps 10-15 px does. Dota and League rules say orientation must read from the silhouette. Continuous effects (Censer flamethrower, beams, the map-wide Longeye) must visibly originate from the small emitter.
4. **It is a full art rework, not a tweak.** Every ward body, tier dressing and muzzle offset has to be redesigned, along with hit-testing and sort order. The map's paths, trees and ponds are drawn top-down, so they may also need side faces, or the mix will look inconsistent (the dev.to developer redrew art that felt "too upright… on the map").
5. **It risks Legion TD 2-style clutter if wards are tall.** Many tall bodies packed together read worse than discs. The benefit depends on keeping wards squat.

### Mitigations needed if adopted (minimum set)
1. **Height cap.** The body should be at most about 1.2× the footprint width, around 40-44 px for a 36 px footprint, plus thin spires that are allowed to overlap. Put the identity silhouette and emblem in the **top half**.
2. **Spacing and clearance.** Raise `towerSpacing` toward the art width, or allow overlaps but sort by base y. Add asymmetric path clearance: larger on the south side of a path, about H − 18 px extra. Alternatively, adopt plots.
3. **Depth sort** wards and enemies together by footprint y every frame. Draw health bars, status icons and selection on the top layer.
4. **Occlusion fallback.** When an enemy is behind a ward body, either fade that ward to about 50% or draw a flat enemy-coloured silhouette over it. Make it a setting, because AoE IV players asked for one.
5. **Keep simulation in plan space.** Range circles stay true circles centred on the footprint, drawn on the ground. Shots and beams render from the emitter at (x, y − h). Barrel, origin and muzzle flash must agree.
6. **Anchors.** Draw a ground shadow or base ellipse under every ward. Hit-test the union of the footprint and the body box, with front-most first.
7. **Aiming part.** It needs an asymmetric shape of at least about 10-12 px that rotates in the screen plane, Fieldrunners-style. It also needs a muzzle flash or emitter glow at the tip, so direction still reads at 36 px.
8. **Tier system on the fixed body.** Follow the rules in §3: constant footprint, monotonic mass and ornament, one countable cue, a silhouette break only at the top tier, and a type emblem on the front face that never changes.

### Cheaper middle options to prototype first
- **Option A: "lifted top-down", the BTD6 approach.** Keep plan view and rotating aim, but redesign bodies so they have distinct *plan* outlines (protrusions, notches, symmetry order) plus a fixed short side face, i.e. a few px of extrusion drawn below the top shape. This gets part of the silhouette gain with no occlusion problem (synthesis).
- **Option B: a squat upright test.** Build 3-4 wards in upright form with the height cap, and run the silhouette and crowd tests from principles.md at 36 px on the real map against current top-down versions. Hollowlight's map is grassy green, which is close to KR5's palette [observed], so KR5 is a direct visual reference.

---

### Source caveats
- No first-party statement was found from Ironhide or Ninja Kiwi explaining their camera choice. The view descriptions for KR, BTD6, Fieldrunners, Thronefall, Legion TD 2, GemCraft, Infinitode 2 and Dungeon Warfare are from still screenshots [observed]. Whether towers or figures turn is mostly unverified.
- Per-level descriptions for Kingdom Rush levels 1-3 and Clash of Clans could not be fetched from the fan wikis. Treat the details as indicative.
