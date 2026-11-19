<!-- Raw notes from a web-research sub-agent (2026-11-19), kept for their source links. The reviewed synthesis is docs/visual-research.md. -->

# Tower/unit readability in TD and strategy games: case studies

Research for Hollowlight. The goal is a system where every ward, and roughly how upgraded it is, reads at ~40 px and scales to 20+ wards.

Method notes:
- Most fan wikis (Fandom, TV Tropes, the Kingdom Rush wiki.gg) blocked automated fetches. Where text sources failed, I looked at primary images and described what is visible: official BTD6 crosspath renders hosted on bloonswiki.com, and official Kingdom Rush Steam screenshots. These observations are marked **[observed]**, with the image URL.
- **(unverified)** marks claims I could not source. They come from general knowledge or are inferred.

---

## 1. Bloons TD 6 (Ninja Kiwi)

**Scale of the problem BTD6 solves.** Every tower has 3 paths × 5 tiers, and crosspaths are allowed. The Wizard Monkey alone has "64 possible combinations, though their tier 5 upgrades don't change when crosspathed, so the Wizard Monkey only has 52 unique models" ([bloonswiki: Upgrade](https://www.bloonswiki.com/Upgrade)). Each crosspath really does get its own model. For example, the Super Monkey Fan Club gallery lists separate renders for 0-4-0, 0-4-1, 0-4-2, 1-4-0 and 2-4-0 ([bloonswiki: Super Monkey Fan Club](https://www.bloonswiki.com/Super_Monkey_Fan_Club_(BTD6))).

**Category colour, used in the UI and not on the map.** Tower portraits use one background colour per category: Primary is blue, Military green, Magic purple, Support orange ([Primary](https://www.bloonswiki.com/Primary), [Military](https://www.bloonswiki.com/Military), [Magic](https://www.bloonswiki.com/Magic), [Support](https://www.bloonswiki.com/Support)). Role colour therefore lives in the shop and selection UI. The on-map models are free to use their own palettes.

**How a tower keeps its identity across tiers: the Wizard Monkey crosspath sheet** [observed, [File:BTD6 Wizard Monkey crosspaths.png](https://www.bloonswiki.com/File:BTD6_Wizard_Monkey_crosspaths.png)]
- The invariant across all 52 models is the monkey body, the camera angle, the footprint, and a pointed hat or hood on top. The silhouette stays "small figure + cone on head", so the tower is always recognisable as a Wizard.
- **Path is encoded by the dominant colour of the hat and robe.** Path 1 (Arcane) uses blue hats with a gold crescent emblem. Path 2 (Fire) uses red/orange hats. Path 3 (Necromancy) uses black/purple hoods with a skull face and green eyes.
- **Secondary-path tiers become small accessories on the primary-path model.** Examples are a pink gem on a blue hat, or a gold crescent on a red hat. The main colour belongs to the highest path, and the minor path adds a badge-sized detail. This is how 52 models stay legible: one primary read (colour plus overall shape) and one secondary read (a small emblem).
- **Tier is encoded by escalating ornament, then a silhouette break at tier 4/5.** Tiers 1-3 change hat trim and emblem size. Higher tiers add beards, flame wings, skull masks and staffs. Tier 5s break the base silhouette completely. Archmage (5-x-x) turns into an all-white/cream robed wizard. Wizard Lord Phoenix (x-5-x) becomes a figure wrapped in flame wings. Prince of Darkness (x-x-5) is a black hood with floating green orbs. Tier 4 "Summon Phoenix" adds a large separate phoenix sprite.

**Bomb Shooter crosspath sheet** [observed, [File:BTD6 bomb shooter crosspaths.png](https://www.bloonswiki.com/File:BTD6_bomb_shooter_crosspaths.png)]
- The base tower is a navy-blue cannon barrel on brown wheels.
- Path 1 (bigger bombs) turns the barrel **red** and makes it **fatter**. Path 3 (cluster/recursive) adds **lime-green and yellow ring bands** that stack along the barrel. Path 2 (missiles) is the most dramatic change: from tier 3 the round cannon becomes a **pointed missile/shark-nose launcher with teeth decals**, first yellow and then grey, with fins.
- Secondary-path tiers show up as **small decals on the barrel**: a target reticle, a starburst, a down-arrow, red fins. The minor-path read is literally an icon stamped on the tower.
- Lesson: colour carries the path, girth and outline carry power, and decals carry the crosspath.

**Paragons (tier "6").** The design rule: "The designs of each Paragon merge visual elements from the three contributing Tier 5 towers, while still retaining a look that is largely independent from any of the sacrificial towers" ([Paragons summary via search](https://breezewiki.discard.no/bloons/wiki/Paragons)).

**Small developer note.** A Ninja Kiwi blog post says the Crossbow Master "wears its eyepiece for aiming and aesthetic purposes" ([bloonswiki trivia citing NK blog, archived](https://web.archive.org/web/20211006102408/https://ninjakiwi.com/blog/news/173440-what-s-up-at-ninja-kiwi-30th-july-2021?mobile=0)). Accessories are chosen to tell you what the tower does.

**Animation and role.** Towers rotate to face their target and throw projectiles that match their identity: darts, bombs, magic bolts, fire (general knowledge, unverified). Upgrade and placement have an optional cosmetic burst, "Upgrade FX" such as Ghosts, Fireworks or Butterflies ([bloonswiki: Upgrade FX](https://www.bloonswiki.com/Upgrade_FX)). So the moment of upgrading is marked by a one-shot effect rather than by a persistent aura.

No Ninja Kiwi statement specifically about readability was found. A Feb 2024 "Insider Session" Q&A thread got only a "2d and 3d" answer on art style ([r/NinjaKiwiOfficial via mirror](https://r.darklab.sh/r/NinjaKiwiOfficial/comments/1aqqz0e/nk_behind_the_scenes_insider_session_1)).

---

## 2. Kingdom Rush series (Ironhide)

**Structure.**
- KR1 and Frontiers: four base towers (archers, barracks, mages, artillery). Each has 3 generic levels, then branches into one of two level-4 specialists. Examples are Barbarian Mead Hall or Paladins for barracks, and Arcane Wizard or Sorcerer for mages ([summary of Kingdom Rush wiki/Wikipedia via search](https://www.Wikipedia.org/wiki/Kingdom_Rush)).
- Vengeance dropped branched level-4 upgrades ([same](https://www.Wikipedia.org/wiki/Kingdom_Rush)). It instead has 16-18 distinct tower types, of which "Four towers represent the series' classic structures – infantry, archers, mages, and artillery" ([The Avocado retrospective](https://the-avocado.org/2019/02/01/franchise-festival-48-kingdom-rush/)).
- Alliance (KR5) has 15 towers, each with 4 tiers and 2 purchasable abilities, with a 5-tower loadout per stage ([Game8 review, via search](https://game8.co/articles/reviews/kingdom-rush-5-alliance-td-review)).
- So the series moved from "4 silhouettes that fork" to "many types, one linear line each".

**What a KR1 battlefield looks like** [observed, official Steam screenshots [A](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/246420/ss_aaaf33cdb9106bd0801a36049516d95c6f2352b0.1920x1080.jpg) and [B](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/246420/ss_15c7c9f1eb4150695f4c6fe0f081718cc13c886d.1920x1080.jpg)]. I matched tower names to models from memory, so the names are unverified.
- **Same footprint for everything.** Every tower sits on an identical round build plot and fills about the same square. No tower dominates by size. Identity comes from silhouette, material and colour.
- **Material plus colour family per type:**
  - **Mage** towers are squat sandstone with **teal/blue trim, a blue swirl-rune glyph on the front** and a wizard figure on top. The level-4 dark-mage variant keeps the **same squat shape and rune-glyph motif** but recolours it to **black slate with purple crystals**.
  - **Barracks** is a stone keep with a **blue heraldic shield emblem** and, at higher level, blue conical roofs. The Barbarian variant swaps to **thatch with big horns and a round shield**.
  - **Archer** line: the Musketeer-style variant is **grey stone with an orange bullseye target emblem** and a figure on top. The Ranger-style variant is a **treehouse covered in green foliage**.
  - **Artillery** is a **round copper/grey drum or mortar with tiny dwarf crew** around it. A Tesla-style tower is **gold/orange with spires**, next to a "ZAP!" callout.
- **One emblem per base type** on the front face: shield for barracks, rune glyph for mages, bullseye for archers. This is a cheap, consistent icon-on-building read.
- **Specialists keep the base type's footprint and motif, but swap material and palette.** Examples are the blue mage becoming the black/purple mage, and the stone archer becoming the leafy treehouse. A specialist reads as "a mage, but the dark kind".
- **Comic onomatopoeia** ("KBOOM!", "CRIT!", "ZAP!", "SOK!") appear over hits and tell you what kind of damage happened.
- **Status on towers is shown as an overlay ring.** In screenshot B several towers are wrapped in **magenta rings and glow**, which reads as "this tower is affected" without redrawing the tower. Selection gets a **yellow ground glow** (screenshot A, right side).

**Developer and critic statements.**
- "an uncomplicated aesthetic actually serves to enhance the game's clarity when the battlefield grows crowded" ([The Avocado](https://the-avocado.org/2019/02/01/franchise-festival-48-kingdom-rush/)).
- Frontiers and Origins kept the tower roles but redesigned the appearance per setting ("towers are now based on a more primitive wilderness aesthetic"). Role stays constant while skin follows theme ([The Avocado](https://the-avocado.org/2019/02/01/franchise-festival-48-kingdom-rush/)).
- Ironhide co-founder Pablo Realini: "I think you can identify an Ironhide game just by looking at the art" ([pocketgamer.biz](https://www.pocketgamer.biz/ironhide-co-founder-pablo-realini-talks-kingdom-rush-5-and-premiums-place-in-2024)).
- Ironhide on a Genesis element: "it starts off humble, but its final form resembles a roaring lion" ([Ironhide news, via search](https://www.ironhidegames.com/News/Details/467)). This is an explicit humble-to-grand visual arc.
- Ironhide uses Flash for art/animation and Photoshop for concepts, and tower design "goes through a series of iterations" ([fan interview, via search excerpt](https://sites.google.com/view/brookspweaver/other-projects/interviews/kingdom-rush-by-ironhide-game-studio)).

**Per-level changes from 1 to 3 (unverified).** From memory, levels 1-3 mostly add building mass and better materials (wood → stone → reinforced stone, bigger roofs and banners), plus a more armoured figure on top. The wiki notes Frontiers' three archer tiers differ by a "cosmetic redesign" ([Kingdom Rush wiki via search](https://kingdomrushtd.fandom.com/wiki/Category:Ranged_Towers)).

---

## 3. Plants vs. Zombies (1 and 2)

**Design principle from the creator.** George Fan, GDC 2012: "each character visually represented its function". The Peashooter "has a giant mouth for spitting projectiles, and its name further suggests what it's capable of", and the same applies "from the shielded Screen-Door Zombie to the energizing Coffee Bean" ([Game Developer](https://www.gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan)). He also kept to a maximum of eight words on screen at once ([same](https://www.gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan)).

**Shape language per role (PvZ1).**
- The shape is the verb. Shooters have a mouth/barrel pointing right, the direction they fire ([same](https://www.gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan)).
- Walls are a big round nut, economy is a sunflower, mines are buried lumps (general knowledge, unverified).
- Every plant fills exactly one lawn tile, so size is constant and the grid is the scale reference (unverified, by observation).

**Variants by recolour plus count, keeping the body.**
- Snow Pea is a Peashooter body that is "mostly colored blue", while its "stem and leaves are green" ([PvZ wiki.gg: Snow Pea](https://plantsvszombies.wiki.gg/wiki/Snow_Pea_(PvZ))). The family read (green stem and leaves) stays and the element (blue = ice) goes on the head.
- Repeater and Threepeater show more output with more heads or leaves (unverified).

**Upgrade plants are physically built on top of the base plant.** Repeater → Gatling Pea, Sunflower → Twin Sunflower, Melon-pult → Winter Melon, Spikeweed → Spikerock ([wiki.gg: Upgradeable plants](https://plantsvszombies.wiki.gg/wiki/Category:Upgradeable_plants)). Gatling Pea "looks like a Repeater with facepaint, a gatling gun, and an army helmet" and "must be planted on top of one" ([wiki.gg: Gatling Pea](https://plantsvszombies.wiki.gg/wiki/Gatling_Pea_(PvZ))). The upgrade is the base silhouette plus a hat and a bigger weapon.

**PvZ2 role colour system.** 14 plant families ("Power Mints"), each with a colour and a role:
- Enforce-mint: green, melee
- Appease-mint: chartreuse, straight shooters
- Arma-mint: brown, lobbers
- Bombard-mint: orange, explosives
- Winter-mint: sky blue, ice
- Pepper-mint: red, fire
- Fila-mint: cyan, electric
- Ail-mint: purple, poison
- Enlighten-mint: yellow, sun
- Reinforce-mint: tan, defence
- Spear-mint: dark grey, piercing
- Conceal-mint: medium purple, shadow
- Enchant-mint: magenta, magic
- Contain-mint: grey, slow/weaken

"A colored circle with the appropriate family icon can be seen in the upper-left corner of seed packets" ([wiki.gg: Plant Family](https://plantsvszombies.wiki.gg/wiki/Plant_Family_(PvZ2))). The role colour sits in a **badge on the card**, not across the whole plant. The plants themselves are coloured by what they are, such as red peppers and blue ice.

---

## 4. Clash Royale (Supercell)

- A breakdown of the visuals: "strong contrast, bright colors and distinctive silhouettes" make the game readable on a phone. Units are distinguished by "icon, shape and color". Red vs blue separates the teams, and spell areas are drawn in the caster's team colour. Each unit also "has its own characteristic colour theme" ([The Rookies breakdown](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)).
- Feedback cues: damaged units "blink with a brighter colour", attacking units get an attack VFX, and freeze and poison have their own effects ([same](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)).
- **Rarity is colour on the card frame**, not on the unit: Common is grey/pale blue, Rare orange, Epic purple, Legendary a rainbow gradient, Champion gold/yellow. Sources disagree on exact shades ([Clash Royale wiki via search](https://clashroyale.fandom.com/wiki/Cards), [zathong](https://zathong.com/clash-royale-cards/)).
- **Evolutions are an in-battle visual upgrade with one reserved colour (purple).** The card must be cycled "until the diamond(s) at the top of the card turn purple", and when slotted the card "appears magically charged and the troop's appearance has changed to their evolved form" ([Supercell support: Card Evolution](https://support.clashroyale.com/hc/en-us/articles/49484923993883-Card-Evolution)). This is one dedicated hue that means "upgraded" across every card.
- Size: troops are placed on a tile grid and range is stated in tiles (e.g. Archer range 5) ([Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)). Tanks such as Giant or Golem are drawn much larger than swarm units such as Skeletons or Goblins, so size encodes HP class (general knowledge, unverified).
- The game was retargeted during development toward vertical phone screens ([Wikipedia mirror](https://wiki.krisyotam.com/content/wikipedia_en_all_nopic_2026-03/Clash_Royale)). Small-screen readability was a hard constraint.
- No Supercell art-director statement on readability was found. The GDC talks found were about design and balancing ([GDC session](https://schedule.gdconf.com/session/recent-bets-outcomes-from-supercells-clash-royale/917002)).

---

## 5. Defense Grid: The Awakening (Hidden Path, 2008)

- **Tall towers, each with its own silhouette.** Art director Dave McCoy: "Knowing that we wanted the towers to be tall structures". Low towers were "inconsistent with the rest of the highly vertical environment". The team made "the entire tower" unique per type, "each design having a distinct silhouette", and "distinctive and appropriate for the type of weapon mounted on it" ([Game Developer: From Concept to Execution](https://gamedeveloper.com/design/from-concept-to-execution---the-art-of-i-defense-grid-the-awakening-i-)).
- **Player and enemy shape languages are opposed.** The towers are blocky and ancient, which "would help emphasize the difference between the player's defensive structures and the smooth bio-tech appearance of our attackers". Enemies are "insectoid-machine hybrids, which contrasted from the blocky weapon towers" ([Game Developer: Bleak to Beautiful](https://www.gamedeveloper.com/game-platforms/feature-how-i-defense-grid-i-went-from-bleak-to-beautiful)).
- **The roster was cut for clarity.** They "whittled down that amount in order to not to confuse players" ([same](https://www.gamedeveloper.com/game-platforms/feature-how-i-defense-grid-i-went-from-bleak-to-beautiful)). The game shipped with 10 tower types ([Wikipedia](https://en.wikipedia.org/wiki/Defense_Grid:_The_Awakening)).
- **Upgrade level is a global colour ramp shared by all towers.** "We also needed to visually represent three variations of each tower type" ([McCoy](https://gamedeveloper.com/design/from-concept-to-execution---the-art-of-i-defense-grid-the-awakening-i-)). "Tower strength is denoted by the colours green, yellow and red" (Wired, cited in [Wikipedia](https://en.wikipedia.org/wiki/Defense_Grid:_The_Awakening)). One reviewer says the tower base changes along these colours, and another lists the ramp as green/orange/red (unverified, search snippets only). Defense Grid 2 reportedly uses blue → green → red → gold (unverified).
- Takeaway: **type = silhouette, level = one shared colour ramp.** The same three colours mean the same thing on every tower.

---

## 6. Briefer notes

**Thronefall (Grizzly Games).**
- Paul Schnepf: "the silhouette of objects is the element that communicates the most information to players". They made objects as distinct as possible and used "putting an outline around objects" to reinforce readability, with "a very limited color palette" and the aim of "high legibility while maintaining an appealing atmosphere" ([Game Developer](https://gamedeveloper.com/design/mastering-minimalism-and-layering-complexity-with-strategy-game-thronefall)).
- He admits "there is arguably some room for improvement when it comes to the different units" ([same](https://gamedeveloper.com/design/mastering-minimalism-and-layering-complexity-with-strategy-game-thronefall)).

**Arknights (Hypergryph).**
- Rarity is shown as 1-6 stars. Elite 2 promotion gives a new illustration and a separate E2 icon ([arknights.wiki.gg](https://arknights.wiki.gg/wiki/Operator/6-star), [icons](https://arknights.wiki.gg/wiki/Category:Operator_icons)).
- (Unverified) Eight classes each have a class icon. Melee units deploy on ground tiles and ranged units on high-ground tiles, so the tile type pre-sorts roles. The in-battle chibi sprite is small, so class is read mostly from the deploy-bar icon and range overlay rather than from the sprite.

**Legion TD 2 (AutoAttack).**
- Art director Jean Go (ex-Riot concept artist) handles all art. Go reshaped a unit's face to read "rabbit-like" rather than spider-like for identity ([ArtStation](https://jeango.artstation.com/projects/vJknJd), [Sketchfab spotlight](https://sketchfab.com/blogs/community/game-studio-spotlight-autoattack-games)).
- (Unverified) Units upgrade into distinct higher-tier creatures within a legion's theme. Each legion (faction) has a consistent palette.

**Infinitode 2, Dungeon Warfare.** I found no sourced design statements. (Unverified) Infinitode 2 uses flat, top-down geometric towers with one hue per tower type on a dark grid. It is the closest analogue to Hollowlight's abstract-glow look, and towers are told apart mainly by turret shape and hue.

**Valve: TF2 and Dota 2, the canonical readability references for strategy and action games.**
- TF2's "read hierarchy": players must identify others "by team, class and selected weapon at a variety of distances and viewpoints". The order is team colour first ("Friend or Foe?"), then class via "Distinctive silhouettes" and body proportions, then weapon. Value contrast is highest at chest level "where weapon is held", with a dark-feet-to-light-chest gradient ([Valve GDC 2008 slides](https://cdn.fastly.steamstatic.com/apps/valve/2008/GDC2008_StylizationWithAPurpose_TF2.pdf), [NPAR07 slides](https://cdn.fastly.steamstatic.com/apps/valve/2007/NPAR07_IllustrativeRenderingInTeamFortress2_Slides.pdf), [MIGS summary](https://www.gamedeveloper.com/game-platforms/migs-valve-s-mitchell-on-creating-i-left-4-dead-i-s-filmic-visual-style)). These quotes come from search snippets of the slides, not a full read.
- The Dota 2 Character Art Guide covers "informative silhouettes, value gradients, value patterning, color and saturation… areas of visual rest". Its goal is "an unmistakable look on the battlefield that quickly and clearly communicates its identity" ([Game Developer](https://gamedeveloper.com/design/take-a-gander-at-how-valve-designs-the-look-and-feel-of-i-dota-2-i-heroes); guide hosted at [Steam Support](https://help.steampowered.com/faqs/view/0688-7692-4D5A-1935)).
- Value test: "Take a screenshot, desaturate it, and see if you can immediately and easily understand the image". Also: "Contrast draws attention, and if everything is drawing attention, nothing will" ([Angstadt, Game Developer](https://gamedeveloper.com/design/how-to-reduce-visual-confusion-in-your-game)).

---

## Cross-game patterns: transferable principles

1. **Use one channel for type and a different one for tier.** Defense Grid: type is the silhouette, tier is a shared green/yellow/red ramp ([McCoy](https://gamedeveloper.com/design/from-concept-to-execution---the-art-of-i-defense-grid-the-awakening-i-), [Wikipedia](https://en.wikipedia.org/wiki/Defense_Grid:_The_Awakening)). BTD6: type is the base body, path is colour, crosspath is a decal ([Bomb Shooter sheet](https://www.bloonswiki.com/File:BTD6_bomb_shooter_crosspaths.png)). Hollowlight's failure mode (glow rings, shards and stars all used for both) comes from mixing channels.

2. **Silhouette is the primary identity channel. Test it as a black shape.** Thronefall: "the silhouette of objects is the element that communicates the most information" ([GD](https://gamedeveloper.com/design/mastering-minimalism-and-layering-complexity-with-strategy-game-thronefall)). Defense Grid: "each design having a distinct silhouette" ([GD](https://gamedeveloper.com/design/from-concept-to-execution---the-art-of-i-defense-grid-the-awakening-i-)). TF2 put class identity in silhouettes ([Valve](https://cdn.fastly.steamstatic.com/apps/valve/2008/GDC2008_StylizationWithAPurpose_TF2.pdf)). For 20+ wards, give each ward a unique *outer outline* (spire, dome, prism, fork, ring-with-gap, etc.), not a unique glow.

3. **Keep an invariant core through every tier, and let tiers decorate around it.** BTD6 Wizard: monkey body plus a cone hat in all 52 models ([sheet](https://www.bloonswiki.com/File:BTD6_Wizard_Monkey_crosspaths.png)). PvZ: Gatling Pea is "a Repeater with facepaint, a gatling gun, and an army helmet" ([wiki.gg](https://plantsvszombies.wiki.gg/wiki/Gatling_Pea_(PvZ))). KR specialists keep the base footprint and front emblem [observed]. The core shape must not be overwritten by higher-tier glow.

4. **Make tier progression monotonic and countable: more mass and ornament, with a big break only at the top.** BTD6 tiers 1-3 add trim, emblems and girth (a fatter red barrel), and tier 5 breaks the silhouette (Archmage, Prince of Darkness) [observed]. Ironhide: "starts off humble, but its final form resembles a roaring lion" ([Ironhide](https://www.ironhidegames.com/News/Details/467)). A countable cue (pips, rings, spires: 1/2/3) beats "more glow", which saturates.

5. **Reserve one hue to mean "upgraded/empowered", and never use it as a ward's identity colour.** Clash Royale reserves purple for Evolution ([Supercell support](https://support.clashroyale.com/hc/en-us/articles/49484923993883-Card-Evolution)). Defense Grid's green → yellow → red works because no tower *type* is identified by those colours.

6. **Pick one meaning for colour per layer.** BTD6 uses category colour only on portraits, and on-map colour encodes path ([Magic](https://www.bloonswiki.com/Magic)). PvZ2 puts role colour in a corner badge on the seed packet, and the plant's own colour is its element ([wiki.gg](https://plantsvszombies.wiki.gg/wiki/Plant_Family_(PvZ2))). Clash Royale keeps rarity on card frames and team colour on the field ([Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)). For Hollowlight, decide whether on-map hue means role, element, or nothing, and keep that consistent.

7. **The shape should show the verb.** Fan: "each character visually represented its function". The Peashooter's mouth spits ([GD](https://www.gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan)). Defense Grid: shape "appropriate for the type of weapon mounted on it" ([GD](https://gamedeveloper.com/design/from-concept-to-execution---the-art-of-i-defense-grid-the-awakening-i-)). A beam ward should have a lens or barrel, an aura ward a dish or bell, a slow ward something heavy or anchored.

8. **Give player and enemy shape languages opposite properties.** Defense Grid: blocky ancient towers vs "smooth bio-tech" attackers ([GD](https://www.gamedeveloper.com/game-platforms/feature-how-i-defense-grid-i-went-from-bleak-to-beautiful)). For light vs Gloom: wards could be crisp, faceted, geometric and bright-edged, while the Gloom is soft, blobby, smoky and dark-cored. That stops wards and enemies competing for the same read.

9. **Use a constant footprint so identity doesn't depend on size. Use size only for one meaning.** Kingdom Rush: every tower occupies the same round plot [observed, [screenshot](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/246420/ss_aaaf33cdb9106bd0801a36049516d95c6f2352b0.1920x1080.jpg)]. PvZ: one plant per tile. Clash Royale: grid-snapped placement ([Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)). At 40 px, let tier add at most ~10-20% of height (spires and crowns) rather than scaling the whole ward.

10. **Use a small per-type emblem as a back-up identity read.** KR puts a front-face emblem per base type (shield, rune glyph, bullseye) [observed]. BTD6 crosspath decals (reticle, starburst, arrow) [observed]. In Hollowlight, a 6-10 px glyph at the ward's centre can disambiguate wards whose outlines are similar.

11. **Separate temporary state from identity with an overlay layer.** KR wraps affected towers in a magenta ring and marks selection with a yellow ground glow, without altering the tower art [observed, [screenshot B](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/246420/ss_15c7c9f1eb4150695f4c6fe0f081718cc13c886d.1920x1080.jpg)]. Clash Royale damaged units "blink with a brighter colour" ([Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)). Keep rings and halos for state (selected, buffed, disabled) so they stop doubling as ward identity.

12. **Value before hue: a busy glow game must pass the greyscale test.** "Take a screenshot, desaturate it…" and "if everything is drawing attention, nothing will" ([Angstadt](https://gamedeveloper.com/design/how-to-reduce-visual-confusion-in-your-game)). TF2 placed the highest contrast where the important read is ([Valve slides](https://cdn.fastly.steamstatic.com/apps/valve/2008/GDC2008_StylizationWithAPurpose_TF2.pdf)). In a dark-background, everything-glows game, ration bloom: give each ward a single brightest point at its functional part (emitter or lens).

13. **Use outlines and a limited palette to keep many objects separable.** Thronefall uses "putting an outline around objects" plus "a very limited color palette" ([GD](https://gamedeveloper.com/design/mastering-minimalism-and-layering-complexity-with-strategy-game-thronefall)). Clash Royale relies on "strong contrast, bright colors and distinctive silhouettes" ([Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)). A dark rim around each ward on canvas separates it from both background and glow.

14. **Attack feedback should name the damage type.** KR shows comic callouts ("ZAP!", "KBOOM!", "CRIT!") [observed]. BTD6 projectiles match the tower's identity (unverified). Clash Royale has distinct freeze and poison VFX ([Rookies](https://www.therookies.co/blog/game-design-ux-best-practices-detailed-breakdown-of-clash-royale/)). A ward's projectile or beam shape and colour should repeat its identity shape and hue, so you can tell which ward is firing even when the tower itself is hidden.

15. **Cap the roster or group it, and use upgrades to deepen rather than multiply looks.** Defense Grid cut types "in order to not to confuse players" ([GD](https://www.gamedeveloper.com/game-platforms/feature-how-i-defense-grid-i-went-from-bleak-to-beautiful)). KR Vengeance and Alliance and BTD6 handle many types with a loadout of about 5 per level (KR) or category grouping (BTD6) ([Game8](https://game8.co/articles/reviews/kingdom-rush-5-alliance-td-review), [Avocado](https://the-avocado.org/2019/02/01/franchise-festival-48-kingdom-rush/)). With 20+ wards, group them into 4-5 families, each with a shared base shape or plinth and its own outline on top, like KR's four base types. Then the family reads first and the specific ward second.
