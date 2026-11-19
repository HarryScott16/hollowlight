<!-- Raw notes from a web-research sub-agent (2026-11-19), kept for their source links. The reviewed synthesis is docs/visual-research.md. -->

# Tower-defence mechanics survey, for new Hollowlight wards

Scope: gameplay mechanics only, not visuals. I checked the sources with web search and fetches in Nov 2026. Fandom and bloonswiki pages blocked direct fetches, so some details come from search-result extracts of those pages. Claims that rely on my own knowledge and that I could not confirm in a source are marked **(unverified)**. The numbers are for flavour only. They change with patches.

Hollowlight baseline, for comparison: 8 wards. Between them they already cover single-target, splash, slow/freeze, chain, map-wide sniper, flame cone with anti-heal, ramping beam, support aura and gold income, mark/execute, stealth reveal, shield break, anti-air and burning ground. The game also has home-row active-ability keys (Step 12) and a proposed path-placed trap ward.

---

## 1. Mechanics by game

### Bloons TD 6 (Ninja Kiwi)
| Mechanic | What it does | Decision it creates | Source |
|---|---|---|---|
| Spike Factory | Drops spike piles onto track within its range. Each pile pops N bloons, then vanishes. Upgrades: *Smart Spikes* aims at the track nearest the exit, *Long Life / Perma-Spike* piles persist, *Carpet of Spikes* covers the whole track. | Where to put a "last line": the factory goes near the exit, beside a dense stretch of track. Smart Spikes turns it into a leak-catcher. | https://www.bloonswiki.com/Spike_Factory_(BTD6) ; https://www.bloonswiki.com/Smart_Spikes_(BTD6) |
| Spiked Mines | Spike piles explode when used up. | Pairs path placement with splash. | https://bloons.fandom.com/wiki/Spiked_Mines_(BTD6) |
| Banana Farm / Monkey Bank | The farm makes cash each round. Monkey Bank stores the cash and adds 15% interest per round, capped at $7,000. You withdraw it manually. | Economy versus defence. When to cash out: interest rewards *not* spending. | https://www.bloonswiki.com/Monkey_Bank_(BTD6) |
| Monkey Village | Aura with +10% range. *Radar Scanner* gives camo detection to every tower in range. *MIB* lets all towers in range damage any bloon type. | Cluster placement. One building removes a whole class of immunity in its radius. | https://bloons.fandom.com/wiki/Monkey_Village_(BTD6) ; https://www.bloonswiki.com/Radar_Scanner_(BTD6) |
| Engineer: sentries | Spawns short-lived sentry sub-towers nearby. *Sentry Expert* spawns sentries specialised against particular bloon types. | Temporary, self-replacing DPS. Placement decides where the sentries appear. | https://bloons.fandom.com/wiki/Sentry_Expert ; https://www.bloonswiki.com/Strategy:Engineer_Monkey_(BTD6) |
| Engineer: Bloon Trap | Places a trap on the track that captures bloons and kills them outright, until it is full. When full it is collected for cash **(collect-for-cash detail unverified)**. | Capacity management. Put it where it fills fastest, then empty it at the right moment. | https://www.bloonswiki.com/Bloon_Trap_(BTD6) |
| Engineer: Overclock / Ultraboost | Targets another tower and temporarily speeds up its attacks. Ultraboost stacks permanently **(mechanics unverified; the Ultraboost name is confirmed via the Master Builder page)**. | Picks *which* tower is your carry and invests a targeted buff in it. | https://www.bloonswiki.com/Master_Builder |
| Mortar Monkey "Set Target" | Shells land inside a reticle the player places anywhere. The only targeting mode is Set Target, and accuracy upgrades shrink the scatter. | Manual target zoning. Picking a bend or choke point is the whole skill. | https://www.bloonswiki.com/Stats:Mortar_Monkey_(BTD6) ; https://www.bloonswiki.com/Heavy_Shells_(BTD6) |
| Heli Pilot movement | The tower physically moves. Modes are Follow Touch (follows the cursor), Lock in Place and Patrol Points (flies between two points). *Pursuit* chases the lead bloon. | Live repositioning by the player, versus delegating with Pursuit. | https://www.bloonswiki.com/Stats:Heli_Pilot_(BTD6) ; https://www.bloonswiki.com/Pursuit_(BTD6) |
| Heli: Downdraft / MOAB Shove | Downdraft blows small bloons back along the track. MOAB Shove pushes MOAB-class bloons backwards or slows them **(exact effects unverified)**. | Buys time on the path, at the cost of letting bloons re-cross your defences. | https://www.bloonswiki.com/Downdraft_(BTD6) ; https://www.bloonswiki.com/MOAB_Shove_(BTD6) |
| Heli: Support Chinook | Ability that picks up a friendly tower and re-drops it elsewhere. It also drops lives and cash **(unverified detail)**. | Relocate a tower mid-game without selling it. | https://www.bloonswiki.com/Support_Chinook_(BTD6) |
| Water placement (Sub, Buccaneer, Mermonkey) | Sub and Buccaneer can only be placed on water. Mermonkey can go on land or water and gets a +35% range bonus on water. | Terrain-gated slots. Scarce slots become valuable real estate. | https://www.bloonswiki.com/Monkey_Sub_(BTD6) ; https://breezewiki.discard.no/bloons/wiki/Mermonkey |
| Ice Monkey: Embrittlement | Frozen bloons take extra damage and briefly lose their Lead immunity. | Crowd control becomes a vulnerability window. You sequence freeze, then burst. | https://www.bloonswiki.com/Embrittlement_(BTD6) |
| Glue Gunner | Glue slows, and *Corrosive Glue* adds damage over time. *MOAB Glue* extends this to big bloons. The *Glue Strike* ability glues every bloon on screen. | A persistent debuff that bloons carry along the whole path. | https://www.bloonswiki.com/Glue_Gunner_(BTD6) ; https://www.bloonswiki.com/MOAB_Glue_(BTD6) |
| Alchemist: Berserker Brew | Throws a buff at nearby towers: more damage, range and attack speed for 5 s or 25 attacks. Banana Farms cannot receive it. Other paths add acid DoT and "Rubber to Gold", where popped bloons give bonus cash **(Rubber to Gold unverified)**. | A buffer that has to sit beside the right carry. The buff runs out per attack, so it favours slow, heavy hitters. | https://www.bloonswiki.com/Berserker_Brew_(BTD6) ; https://bloons.fandom.com/wiki/Berserker_Brew |
| Beast Handler | Its attack is replaced by beast sub-towers: land, air (Gyrfalcon) and water (Piranha) beasts. A handler can absorb other handlers of the same beast to boost its own beast **(merge/absorb rule unverified)**. | Merge-or-spread. You consolidate cash into one larger unit. | https://www.bloonswiki.com/Beast_Handler_(BTD6) ; https://www.pocketgamer.com/bloons-td-6/beast-handler-guide |

### Kingdom Rush series (Ironhide)
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Barracks and rally point | 3 soldiers stand at a player-set rally point on the path, within the barracks' rally range. They physically block and fight enemies, and respawn after a delay. They cannot stop flyers. | Where to hold enemies so other towers can hit them (blocking stacks with splash). The rally point can be moved at any time. | https://kingdomrushtd.fandom.com/wiki/Encyclopedia ; https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design |
| Hero | One controllable unit moved by mouse or touch, with its own levels and abilities. | Constant micro-positioning. One mobile plug for whatever leaks. | https://kingdomrushtd.fandom.com/wiki/Category:Heroes |
| Call Reinforcements | Spell that drops 2 temporary soldiers anywhere on the path, on a short cooldown. | An emergency blocker, placed and timed by the player. | https://kingdomrushtd.fandom.com/wiki/Call_Reinforcements |
| Rain of Fire | Targeted meteor strike on a long cooldown (60-80 s). | Save it for a boss or spend it on a cluster. | https://wikily.gg/kingdom-rush/spells/rain-of-fire |
| Fixed build slots and tower swaps | Towers only go on preset plots. You choose the type per plot. | Matching the tower to the plot geometry. | https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design |

### Plants vs. Zombies (PopCap)
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Sunflower | Produces sun (currency) over time. It takes up a lane slot and can be eaten. | Economy units occupy real defensive space and are vulnerable. | https://plantsvszombies.wiki.gg/wiki/Plants_(PvZ) |
| Wall-nut | High-HP blocker. Zombies stop to eat it. | Buy time in front of your damage. | https://plantsvszombies.wiki.gg/wiki/Plants_(PvZ) |
| Potato Mine | Path mine that needs ~15 s to arm, then destroys the first zombie to step on it. | Predictive placement: plant it ahead of where enemies *will* be. | https://plantsvszombies.fandom.com/wiki/Potato_Mine_(PvZ) |
| Chomper | Instantly eats one zombie in front of it, then chews for 42 s while defenceless. | A single-target delete on a long cooldown. Pair it with protection. | https://plantsvszombies.fandom.com/wiki/Chomper_(PvZ3) (table cites the PvZ1 42 s chew) |
| Squash / Jalapeno / Cherry Bomb | Single-use instants: Squash crushes the adjacent zombie, Jalapeno clears a whole lane, Cherry Bomb does 3x3 burst **(details unverified beyond the "instant kill" description)**. | Consumables with recharge timers. When to spend them. | https://plantsvszombies.fandom.com/wiki/Jalapeno_(PvZ) |
| Torchwood | Peas passing *through* it become fire peas: 2x damage (40), 14 splash in a 1x1 area, and they thaw ice effects. Snow peas passing through are turned back into normal peas. | **Projectile modifier.** Placement is about *other* towers' lines of fire, and some combinations work against each other. | https://plantsvszombies.wiki.gg/wiki/Torchwood_(PvZ) |
| Magnet-shroom | Pulls metal armour or items (buckets, helmets, ladders, pogo sticks) off zombies within 7x5 tiles, then recharges for ~15 s. | Strip defences instead of dealing damage. Timing against the most-armoured target. | https://plantsvszombies.wiki.gg/wiki/Magnet-shroom_(PvZ) |
| Garlic | A zombie that bites it is diverted into an adjacent lane. It has 400 HP. | **Redirection:** funnel enemies into your strongest lane. | https://plantsvszombies.wiki.gg/wiki/Garlic_(PvZ) |
| PvZ2 Plant Food | Glowing zombies drop a boost (3-5 can be stored). Dragging it onto a plant triggers a super-version of that plant's ability, or instantly recharges a seed packet. | Scarce banked "overcharge" that the player spends on any tower. | https://plantsvszombies.wiki.gg/wiki/Plant_Food |
| PvZ2 Chomper Plant Food | Swallows the first 3 zombies in the lane and pushes the rest back. | Example of a Plant Food effect that differs from the plant's base attack. | https://plantsvszombies.wiki.gg/wiki/Chomper_(PvZ2) |

### Defense Grid: The Awakening / Defense Grid 2 (Hidden Path)
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Towers as maze walls | Towers block a grid, and enemies reroute around them. | The layout *is* the path length. | https://techraptor.net/content/defense-grid-2-review-definition-genre |
| Command tower | Reveals stealthed enemies in its radius and gives a resource bonus for kills inside it. | Economy plus detection in one aura. Where kills happen matters. | https://ayumilove.net/defense-grid/ |
| Meteor tower | Huge range and large AoE, but cannot hit enemies close to itself. | Minimum-range placement: put it mid-map where the path loops past it at a distance. | https://ayumilove.net/defense-grid/ |
| Temporal tower | Slows enemies. Small range at level 1. | | https://ayumilove.net/defense-grid/ |
| Boost (DG2) | A cheap platform that raises any tower built on it, for extra upgrades and better line of sight. | Pay for a tile upgrade, then decide what goes on it. | https://arcadesushi.com/defense-grid-2-review-pc/ ; https://www.wikiwand.com/en/articles/Defense_Grid_2 |
| Power cores | Enemies grab cores and carry them back out. A core dropped on a kill drifts home and can be picked up by another enemy **(carry-back and drift details unverified)**. Lives are cores. | Kill zones must cover the *return* trip as well. | https://primagames.com/?p=30343 |
| Inferno / Tesla | Inferno is a flamethrower. Tesla charges up when idle **(unverified)**. | | https://www.alteredgamer.com/strategy/41948-defense-grid-the-awakening-tower-guide/ |

### Dungeon Warfare 1-3 / Orcs Must Die!
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Push trap into pits | Pushes enemies into pits for an instant kill, or slams them into walls for a stun. | Geometry: aim traps at hazards, so knockback becomes lethal. | https://gamerblurb.com/articles/dungeon-warfare-3-tips-guide-best-strategies |
| Barricade loops | Barricades redirect enemies. Removing one mid-wave sends them back through the traps again. | Timing a path *change* during a wave. | https://gamerblurb.com/articles/dungeon-warfare-3-tips-guide-best-strategies |
| OMD Push trap | Wall trap that resets after firing. It cannot push Ogres unless upgraded, and an upgrade adds a stun. | Weight classes: a heavy-immunity counterplay already exists. | https://breezewiki.discard.no/orcsmustdie/wiki/Push_Trap |
| OMD Tar trap | Floor slow that deals no damage. Upgrades make it take extra fire damage. | A slow that sets up an element combo. | https://commonsensegamer.com/?p=22480 |
| OMD Barricade | Blocks and reroutes enemies, which then attack the barricade. Rated top-tier because it lets you control crowds. | A cheap blocker that buys damage time. | https://steamcommunity.com/app/1522820/discussions/0/5532118063936798839 |
| OMD player hero | The player is a character on the field, fighting and placing traps in real time. | Hybrid action and positioning. | https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/OrcsMustDie2 |

### GemCraft series (Game in a Bottle)
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Gem combining | Two gems of grade N become one gem of grade N+1. Mixed colours combine their specials. | Spend on many weak gems or merge into one strong one. Colour recipes. | https://ipfs.ssi.eecc.de/ipns/en.wikipedia-on-ipfs.org/wiki/GemCraft |
| Amplifiers | A gem in an amplifier does not fire. Instead it boosts the neighbouring towers and traps (a player reports colour-specific boosts to specials). | Give up a shooter to boost its neighbours. Adjacency puzzle. | https://gemcraft.fandom.com/wiki/File:Chronicle.Pages.14.jpg ; https://steamcommunity.com/app/296490/discussions/0/405691491120970113 |
| Traps | Gems socketed into path tiles apply their colour effect (poison, slow, mana-leech) to enemies walking over them. One amp can feed several traps. | The same gem, placed as a tower or as a trap. | https://steamcommunity.com/app/1106530/discussions/0/3855581440177768262 |
| Mana as lives and money | Enemies reaching the orb drain your mana, which is also your currency **(unverified framing)**. Mana-leech gems refill it. | Every purchase lowers your survival buffer. | https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/GemCraft |
| Gem bombs | Throw a gem as a one-off bomb **(unverified)**. | Sacrifice a built asset for burst. | https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/GemCraft |

### Arknights (Hypergryph)
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Block count | Each melee unit blocks N enemies. Further enemies walk past. Big enemies need 2-4 block. Some enemies cannot be blocked. | Pick a blocker with enough "weight" for the threat. | https://arknights.wiki.gg/wiki/Block_count |
| Redeploy timer and cost escalation | A retreated or dead unit can't return for ~70 s. Re-deploying costs 1.5x, then 2x DP. Retreating refunds half the cost. | Retreat-and-redeploy timing. Repositioning is costly but possible. | https://arknights.wiki.gg/wiki/Redeployment_time ; https://arknights.wiki.gg/wiki/Deployment_Point |
| DP trickle | Deploy points regenerate over time. Some units generate DP. | Economy units versus early defence. | https://progameguides.com/arknights/how-to-recover-deployment-points-dp-in-arknights/ |
| Medics, facing direction, high/low tiles | Healers keep blockers alive. Ranged units go on high-ground tiles, melee units on path tiles. You choose the facing when deploying **(general knowledge, unverified here)**. | Facing sets the attack cone. Terrain-typed slots. | https://arknights.wiki.gg/wiki/Advanced_strategies |
| Deployable devices | Placeable objects that can be redeployed after they break. | | https://arknights.wiki.gg/wiki/Deployable_device |

### Thronefall / Kingdom Two Crowns
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Day build / night defend | The build phase is strictly separate from the fight. A mounted king fights in person. | Build placements are fixed, and the number of buildings per map is limited. | https://www.siliconera.com/review-thronefall-is-a-beautifully-simplistic-rts-game/ ; https://www.startmenu.co.uk/home/review-thronefall |
| Branching tower upgrades | Each building has 2 upgrade levels with 4 options at each. | Specialise each slot. | https://gameluster.com/thronefall-review-holding-on-for-one-last-night/ |
| KTC walls | Walls slow enemies and can be destroyed and rebuilt. Floating enemies ignore them. Archer towers sit behind the walls. | Layered defence. Some walls get sacrificed. | https://www.magicgameworld.com/?p=27223 ; https://www.nerdsandscoundrels.com/kingdom-two-crowns-towers/ |
| KTC archers hunt by day | Defensive units double as income earners outside combat. | | https://gameplay.tips/guides/3594-kingdom-two-crowns.html |

### Rogue Tower / Isle of Arrows / Infinitode 2 (tile and terrain games)
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Rogue Tower: expanding path | The path grows as you play, and you choose the direction it extends. Elevated tiles give bonus damage but are scarce. | Shaping the route. High ground is real estate. | https://rawg.io/games/rogue-tower ; https://dekudeals.com/items/rogue-tower |
| Isle of Arrows: tile draws | Each wave you get one random tile: a path extension, a tower, or a bonus tile (garden, statue). No upgrades and no manual targeting. | Positional puzzle under RNG. Adjacency bonuses. | https://www.pocketgamer.com/isle-of-arrows/tower-defence-tile-placement-roguelike-gameplay ; https://vaporlens.app/app/1946970/isle_of_arrows |
| Infinitode 2: Modifiers | Non-attacking tile buildings that boost up to 8 surrounding towers, often with a trade-off. | Grid-adjacency optimisation. | https://store.steampowered.com/app/937310/Infinitode_2__Infinite_Tower_Defense/ |
| Infinitode 2: Miners and tile bonuses | Miners on resource tiles extract materials for research. Some tiles give a tower passive bonuses. | Mid-run economy against defence slots. | https://infinitode-2.fandom.com/wiki/Miners |
| Infinitode 2: Abilities | Energy, gained 1 per 60 s, is spent on map spells such as Fireball. | | https://infinitode-2.fandom.com/wiki/Skills |

### Mindustry (Anuke)
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Ammo types | The same turret changes role with the ammo you feed it. Ripple and Salvo take 5 ammo types, and graphite, thorium and pyratite play differently. | Logistics: what to supply each turret. | https://game-platform-web-5a2.pages.dev/en/mindustry/block/salvo |
| Coolant | Piping water or cryofluid into a turret boosts its fire rate (Ripple goes to 160% or 235%). | Infrastructure feeds DPS. | https://game-platform-web-5a2.pages.dev/en/mindustry/block/ripple |
| Overdrive projector | Area speed-up for every block in range. It costs more power and ammo. | Buff zone with an upkeep cost. | https://game-platform-web-5a2.pages.dev/en/mindustry/guides/tips |
| Mend projector | Repairs damaged buildings in range. | Your structures can be attacked, so they need upkeep. | https://game-platform-web-5a2.pages.dev/en/mindustry/guides/tips |

### Sanctum 1/2 (Coffee Stain), FPS-TD
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Blocks then towers | Build maze blocks, then put towers on top. | Maze length versus firepower budget. | https://www.destructoid.com/reviews/review-sanctum/ |
| Amp Field | Enemies standing on it take +25% damage, more when upgraded. | A **vulnerability floor**: put it where every tower overlaps. | https://www.giantbomb.com/games/3030-34811/ |
| Slow Field | Floor slow (20% at level 1). | | https://www.giantbomb.com/games/3030-34811/ |
| Televator | Teleports the *player* between pads. | Mobility network for a hero. | https://www.gamespot.com/sanctum-2011/user-reviews/2200-518503/ |

### Anomaly: Warzone Earth (reverse TD)
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Route planning | You re-route the convoy at intersections. | Choose which defences to face. | https://www.pocketgamer.com/articles/032365/r |
| Repair zone | Field that heals convoy units passing through, about 3 units, then expires. | Same idea as Hollowlight's Menders, seen from the other side. | https://www.destructoid.com/reviews/review-anomaly-warzone-earth/ |
| Smoke | Towers firing into the smoke lose accuracy. | | https://www.destructoid.com/reviews/review-anomaly-warzone-earth/ |
| Decoy | Pulls tower aggro away from the convoy. | **Taunt or decoy**, which can be mirrored into a TD as a lure. | https://www.pcgamer.com/au/anomaly-warzone-earth-review |

### Merge TDs: Random Dice / Rush Royale
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Random Dice merge | Two dice of the same type and pip count merge into a pip+1 die of a *random* type. | Upgrade versus keep. Board-slot pressure. | https://skich.app/games/random-dice-tower-defense |
| Rush Royale merge | Two identical cards become rank+1, randomised from your deck. Merge only when the board is full. | Same as above, plus deck building. | https://www.touchtapplay.com/how-does-merging-work-in-rush-royale/ ; https://www.pocketgamer.com/rush-royale/guide/ |

### Element TD 2
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Element picks | Pick 1 element every 5 waves, 11 picks in total. Arrow and Cannon towers upgrade into elemental towers. There are 5 dual and 10 triple combinations. | A run-long build path, committed in stages. | https://steamcommunity.com/sharedfiles/filedetails/?id=2360427994 ; https://steamcommunity.com/sharedfiles/filedetails/changelog/626780182?p=11 |
| Interest | Banked gold earns interest **(rate unverified)**. | Hoard versus spend. | https://steamcommunity.com/sharedfiles/filedetails/?id=2360427994 |

### Legion TD 2 (AutoAttack Games)
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Workers and mythium | Workers (50 gold) generate mythium. Mythium buys sends (mercenaries attacking your opponent), which raise your income, or King upgrades. | Long-term income versus present strength. | https://legiontd2.wiki.gg/wiki/Worker ; https://www.switchbladegaming.com/strategy-games/legion-td-2/beginners-guide-12/ |
| Legion Spell | At wave 10 you pick one of 3 shared spells, some of which trade economy (+100 mythium, -20 income). | | https://legiontd2.wiki.gg/wiki/Legion_Spell |
| Fixed fighters per wave | Units reset to their positions every wave, and the build phase is separate from combat. | | https://www.switchbladegaming.com/strategy-games/legion-td-2/beginners-guide-12/ |

### Cursed Treasure (Iriy Soft)
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Terrain-gated towers | Den, Crypt and Temple each match a terrain **(the strict terrain pairing, grass/snow/rock, is unverified; sources conflict)**. | Each slot's terrain limits what can go there. | https://www.engineering.com/GamesPuzzles/CursedTreasure/CursedTreasureWalkthroughTowers.aspx |
| Mana pools | A tower built on a mana pool speeds up mana regeneration. Mana is capped and pays for spells (Meteor, Cut Out, Frenzy). | Hotspot tiles that combine economy and DPS. | https://www.engineering.com/GamesPuzzles/CursedTreasureLevelPack/CursedTreasureLPWalkthroughTheBasics.aspx |
| Enemies steal gems | Enemies carry gems back out, so you can still kill them on the way out **(well known; the series description does not explicitly confirm it)**. | Defend the exit route as well as the entry. | https://tvtropes.org/pmwiki/pmwiki.php/Videogame/CursedTreasure |

### Fieldrunners
| Mechanic | What it does | Decision | Source |
|---|---|---|---|
| Open-field mazing | Towers can go anywhere, but you can't fully block the path. Enemies take the shortest route. | Each tower is both DPS and route length. Re-check the path after every build. | https://www.wikiwand.com/en/articles/Fieldrunners ; https://www.cloudspress.com/fieldrunners-2-tower-upgrades-and-difficult-map-strategy-how-to-win-more-levels/ |
| Glue slows don't stack | Two glue towers on one runner do not compound. | Diminishing returns push you to diversify. | https://www.cloudspress.com/fieldrunners-2-tower-upgrades-and-difficult-map-strategy-how-to-win-more-levels/ |

---

## 2. Mechanics grouped by category

**A. Path-placed traps** (Hollowlight has a trap ward proposed)
BTD6 Spike Factory, Spiked Mines and Smart Spikes (exit-biased) · PvZ Potato Mine (arming delay) · GemCraft gem traps (tower effects applied on the path) · Sanctum Amp and Slow Fields · OMD tar and floor traps · Bloon Trap (captures enemies, has a capacity).
*Distinct ideas the proposed trap could borrow:* an arming delay, exit-biased auto-placement, finite charges, capture with a payout, and traps that inherit an adjacent ward's effect.

**B. Blockers and summoners**
Kingdom Rush barracks (rally point, respawn) · Call Reinforcements · Arknights block count and multi-block weights · PvZ Wall-nut · OMD and KTC barricades and walls · BTD6 Engineer sentries · Beast Handler beasts.
*Decision:* where to physically stop enemies so that splash and slows stack. A weight or block system answers "heavy" and "boss" enemies naturally.

**C. Movable or repositionable towers**
Heli Pilot (follow cursor, patrol, pursuit) · Kingdom Rush rally points and hero · Support Chinook tower lift · Arknights retreat/redeploy (timer plus cost escalation) · Sanctum Televator.

**D. Projectile modifiers**
PvZ Torchwood (shots passing through change element, damage and splash, and can cancel frost). Mindustry ammo types and coolant are logistic versions of the same idea.
*Decision:* placement is about other towers' firing lines, and conflicts are possible.

**E. Synergy and adjacency**
GemCraft amplifiers · Infinitode 2 Modifiers (8-neighbour) · BTD6 Village (Radar, MIB) · Alchemist Brew · Engineer Overclock · DG2 Boost platform · Mindustry Overdrive · Isle of Arrows bonus tiles · Ice Embrittlement and Tar plus fire (setup-then-payoff combos).

**F. Economy**
Sunflower (takes up a defensive slot) · Banana Farm and Monkey Bank (interest, cap, manual withdrawal) · Defense Grid Command kill-zone bonus · Legion TD workers versus sends · Element TD interest · Arknights DP generators · KTC archers hunting · Infinitode miners · Cursed Treasure mana pools · Rubber to Gold (kills pay more).

**G. Active or manual fire**
BTD6 Mortar reticle · Kingdom Rush Rain of Fire and Reinforcements · Glue Strike · PvZ2 Plant Food (banked, spend on any tower) · Infinitode energy abilities · Cursed Treasure spells.

**H. Conditional or terrain placement**
Water-only Sub and Buccaneer, plus the Mermonkey water bonus · Rogue Tower high ground · DG Meteor minimum range · Arknights high/low tiles and facing · Cursed Treasure terrain plus mana pools · Kingdom Rush fixed plots · Thronefall fixed slots.

**I. Sacrifice and consumables**
PvZ Squash, Jalapeno and Cherry Bomb · Chomper (kill, then long vulnerable downtime) · GemCraft gem bombs · PvZ2 Ultomato self-destructing Plant Food · KTC walls as sacrificial buffers.

**J. Time manipulation**
DG Temporal tower (slow field) · Plant Food instant recharge · Engineer Overclock (tower haste). No surveyed game has a true "rewind enemy along the path" tower beyond the knockback effects in K, and that gap is an opening.

**K. Enemy redirection**
Garlic (lane switch) · Barricades (reroute, and removing them mid-wave loops enemies back through traps) · Push traps into pits · Downdraft and MOAB Shove (blow-back) · Chomper Plant Food (push-back) · Fieldrunners and DG mazing · Anomaly decoy (aggro redirection).

**L. Debuffs and vulnerability**
Sanctum Amp Field · Embrittlement · Corrosive Glue DoT · Tar (takes extra fire damage) · Magnet-shroom (strip armour) · Anomaly smoke (accuracy down; a possible future enemy trick).

**M. Merge and combine**
GemCraft gem grades · Random Dice and Rush Royale (random-outcome merges) · Element TD dual and triple combinations · Beast Handler absorb.

**N. Counter-specific**
- *Anti-stealth:* Village Radar Scanner, DG Command tower.
- *Anti-armour:* Magnet-shroom, Embrittlement removing lead immunity, MIB.
- *Anti-air:* water and air beasts. Barracks cannot block flyers, which is the classic gap.
- *Anti-heal:* turn the Anomaly repair zone around: deny or overwrite a healing field.
- *Anti-heavy:* OMD push-trap upgrade needed for Ogres; Arknights multi-block.

---

## 3. Mechanics Hollowlight doesn't have yet (18)

| # | Mechanic (possible ward) | Player decision it adds | Hollowlight threat it answers |
|---|---|---|---|
| 1 | **Blocker post with a rally point.** Wardens or wisps stand on the path and hold N enemies. You drag the rally point. They respawn after a delay. Based on Kingdom Rush and Arknights. | Where to *hold* Gloom so Mortar Kiln and Censer can overlap. Moving the rally point mid-wave. | Fast (stops them), Hasters (holding them breaks the aura's benefit). Flyers ignore it, a deliberate gap. |
| 2 | **Block "weight".** Heavy and boss enemies need 2-3 block slots, and some Gloom can't be blocked. Based on Arknights. | Upgrade the blocker or stack two. | Heavy (a non-CC answer to an enemy immune to stun, freeze and knockback). |
| 3 | **Projectile modifier: an "Ember Gate" or lens that bolts pass through.** Shots passing through gain fire, split, or change damage type (kinetic becomes arcane). Can conflict, e.g. fire thaws Rime. Based on Torchwood. | Placement relative to *other* wards' firing lines. Choosing which shots to convert. | Plated (convert kinetic so it ignores half-damage) and arcane-immune hide (convert arcane to kinetic). |
| 4 | **Armour stripper.** Periodically pulls plating or shields off the strongest target, then recharges for a long time. Based on Magnet-shroom. | Timing and target priority on a long cooldown. | Plated, shielded. |
| 5 | **Lane or route diverter at forks.** A ward placed at a fork sends Gloom down the longer branch. It is eaten or worn down by enemies over time. Based on Garlic and barricades. Needs maps with forks. | Route control. Which branch becomes the kill zone. | Fast and Hasters (longer route), splitting (keeps children in the kill zone). |
| 6 | **Knock-back / rewind ward.** Pushes Gloom *back* along the path by a distance, rather than slowing it. Based on Downdraft, MOAB Shove and push traps. | Trading a pass back through your defences against bunching enemies up. Heavy is immune, so you have to pick targets. | Fast, Hasters, leaks near the Heartfire. |
| 7 | **Movable ward (patrol or follow-cursor).** A floating lantern that follows the cursor, patrols between two points, or chases the leader. Based on Heli Pilot. | Live micro versus automation. Placement can change every wave. | Flying (it can meet them on the corner-cutting route), leak plugging. |
| 8 | **Relocate or redeploy rules.** Pick up a ward and move it, with a cooldown and a cost markup, instead of selling at a loss. Based on Support Chinook and Arknights. | Reposition between waves for different threats. | General (flyer waves versus ground waves). |
| 9 | **Capture trap with a payout.** Absorbs N layers of Gloom into a vessel. When full you "harvest" it for gold, or it stops working. Based on Bloon Trap. | Capacity and timing. Economy against safety. | Splitting (captures parents before they split), Menders (removes layers outright). |
| 10 | **Banked interest economy.** A "Hearth Vault" stores income and grows a % each wave, capped. You withdraw manually. Based on Monkey Bank and Element TD. | Spend now or compound later. Risk of over-hoarding. | Not a threat answer. It adds an economy decision that Beacon's flat income lacks. |
| 11 | **Kill-zone economy.** Kills inside a ward's radius pay bonus gold (Defense Grid Command) or kills by buffed wards pay more (Rubber to Gold). | Where to make kills, not only whether you make them. | None directly. It rewards concentrating Gloom. |
| 12 | **Amp / vulnerability floor.** A path tile zone where Gloom takes +X% damage from everything, or where layers break into fewer children. Based on Sanctum Amp Field and Embrittlement. | Overlap planning: the zone must sit inside many wards' ranges. | Bosses, plated. |
| 13 | **Adjacency amplifier (non-firing).** A gem-like ward that doesn't attack but boosts the specials of its 8 neighbours, possibly per-path ("boosts burns" or "boosts chains"). Based on GemCraft amps and Infinitode Modifiers. | A grid-packing puzzle. Giving up a shooter. | Indirect. Beacon is a radius aura; this is a strict-neighbour, effect-specific boost. |
| 14 | **Targeted single-ward buff.** Overclock or Brew one chosen ward for a burst or for N shots. Stacks permanently on a top tier. Based on Engineer Overclock and Berserker Brew. | Picking a carry and re-casting on timing. | Bosses (pair with Prism or Longeye). |
| 15 | **Banked "overcharge" pickups.** Certain Gloom (e.g. glowing ones) drop a charge. You spend it on any ward to trigger a super-version of its path, or to refresh an ability. Based on PvZ2 Plant Food. | Saving versus spending. Which ward to empower. Ties into the home-row ability keys. | Spikes in any threat (boss waves). |
| 16 | **Single-use / cooldown devourer.** Eats one non-boss Gloom whole (all layers), then is vulnerable or offline for a long time. Based on Chomper and Squash. | Spend it on the right target. The downtime is the cost. | Menders and Hasters (delete the support enemy), shielded. |
| 17 | **Terrain-gated or hotspot slots.** Wards that only go on special tiles (embers, high ground, water), or tiles that boost whatever is built there. Based on Rogue Tower, the BTD water towers, Cursed Treasure mana pools and DG2 Boost. | Real-estate scarcity. Which ward earns the best tile. | Map design rather than a threat answer. Could give Longeye a high-ground bonus. |
| 18 | **Minimum-range or arming constraints.** A ward that can't hit near itself (Meteor), or a trap that arms after X seconds (Potato Mine). | Predictive placement, away from the wards' natural cluster. | Splitting and fast (wide AoE at range). |
| 19 | **Decoy / lure.** Pulls Gloom towards it or makes them attack it. Could make flyers dive back onto the path, or make Veiled briefly visible as they "smell" it. Based on the Anomaly decoy. | A positional bait you have to keep alive. | Flying (forces them back onto the ground route), Veiled. |
| 20 | **Merge wards.** Two identical wards of the same tier fuse into one higher-tier ward, freeing a slot. A random-result variant is possible. Based on GemCraft, Random Dice and the Beast Handler. | Consolidate versus spread coverage. | None directly. A space and economy decision. |

**Highest-novelty picks for Hollowlight** (largest gap against the current 8 wards and the proposed trap): #1/#2 blocker with block weight, #3 projectile modifier, #6 knock-back/rewind, #9 capture-for-gold, #12 vulnerability floor, #15 banked overcharge. Each adds a decision axis the game doesn't currently have: path holding, firing-line geometry, path position, capacity timing, overlap zoning, and resource banking.
