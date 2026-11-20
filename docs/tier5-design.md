# Tier 5: the capstones

The design for a fifth tier on all 12 wards (36 paths). The research behind it is in
`docs/tier5-research.md`. The numbers are in `public/js/data/towers.js` (`TIER5`, at the end of the
file), the mechanics in `public/js/sim/towers.js` / `projectiles.js` / `game.js`, and the art in
`public/js/render/wards/ascend.js`.

## The rules

| | Tier 5 |
|---|---|
| **Cost** | About 4.5x the path's tier 4: 16,000-22,500 gold. A strong player can afford their first one in the last waves of the campaign (35-40). In endless, roughly one every 4-6 waves after that. |
| **Power** | About 3-5x the tier 4 on its main attack, plus **one signature mechanic**: a new attack form, map-wide reach, a timed effect made permanent, a buff to other wards, a last-stand save, or economy. Never just bigger numbers. Power per gold stays about level with tier 4 (`node tools/report.js`, the T5 column). |
| **Limit** | **Only one of each tier 5 on the map** (per ward type and path), as in BTD6: one Worldpiercer, one Grand Battery, and so on. Up to three tier 5s per ward type (one per path) and 36 in all. The usual crosspath rule still applies: one path to 5, a second to 2. |
| **Requirements** | Tier 4 on that path. Nothing else: no sacrifices or merges. Those stay free for a possible later tier 6. |
| **Ability** | Unchanged. The ward keeps its tier 4 ability, and its tier 5 stats feed into it, so it gets stronger anyway. |
| **Executions and %-health damage** | Executions never hit bosses. Wild Hunt can execute hulks (under 15%), and Kingslayer's per-shot share of health hits hulks and bosses. These are the two boss and hulk capstones. |
| **Discounts** | Golden Age's discount covers tiers 1-4 only, never a tier 5, so it can't feed itself. |

### How it feels to unlock (UI and drawing only)

- **The panel:**
  - The fifth pip is a gold-rimmed diamond.
  - Once the ward is at tier 4, the tier 5 button gets a gold frame and a bar showing how much of
    its price you've saved.
  - If another ward of the same kind already holds that tier 5, the button says so. Clicking it
    selects the ward that holds it.
- **The purchase:**
  - a white pillar and a pillar in the ward's colour;
  - a wide white shockwave;
  - a burst of the ward's colour and white;
  - a 1.6 s stream of motes rising off the ward;
  - a strong shake and a rising fanfare;
  - its name across the screen: "WORLDPIERCER", "Tier 5 · Bolt Ward".

### How it looks (both skins)

Following the plan in `docs/upgrade-visuals-research.md` §2.5, tier 5 uses the channels that tier 4
left unused:

1. **A second form.** Each path gets a companion, a summoned shape or a great apparatus, standing
   beside or behind the ward. It is drawn on top of the skin's tier 4 form. Each skin passes its own
   materials: Kindlings get bronze, wood and wax; Lanterns get iron, brass and smoked glass.
2. **The brightest highlights.** A floating five-point diadem with a white-hot core sits on the
   crown. It is the only pure white on an idle ward.
3. **Height up to about 76 px** (tier 4: 68). Wards grow x1.4 at tier 5 (x1.35 at tier 4).
   `tools/wards.mjs` checks every path's tier 5 in both skins, including the body-and-face rule: big
   forms are drawn behind the body, and only small things go in front, beside or above it.
4. **A signature effect on the battlefield** for every tier 5: the hawk's dive, the falling mountain,
   ball lightning, the phoenix, the Lightweb threads, the seal, and so on.
5. **A bright tier 5 ground sigil:** two rings and five turning stars in the damage colour.

## The 36 tier 5s

Costs are in gold. "Numbers" gives the main changes; the full text is the `desc` in `towers.js`,
which the panel shows on hover or Shift.

### Bolt Ward (Kinetic, single target)

| Path | Tier 5 | Identity | Signature mechanic | Second form |
|---|---|---|---|---|
| Ballista | **Worldpiercer** (19,000) | A walking siege engine. | Every 3rd shot is a colossal lance: x3 damage, and it stuns everything it passes through for 0.6 s (hulks 0.25 s, never bosses). x1.8 damage, x1.2 rate. | An iron A-frame striding behind the archer, with a giant lance across its top. |
| Twin-shot | **Thousand Bolts** (17,500) | A storm that feeds on crowds. | A bolt that kills splits into 2 new bolts, for up to 3 generations, capped at 40 splits a second. x2.5 damage, x1.3 rate. | A turning wheel of bolts behind it. |
| Hunter's Mark | **Wild Hunt** (16,000) | The great spirit-hawk hunts the whole map. | Every second the hawk dives on the toughest enemy anywhere for x8 damage (armour ignored) and marks everything around it. Marked enemies under 33% health are executed, and hulks under 15%. x2 damage, x1.2 rate. | The spirit-hawk on its perch, pale wings spread behind the hunter. |

### Mortar Kiln (Blast, splash)

| Path | Tier 5 | Identity | Signature mechanic | Second form |
|---|---|---|---|---|
| Big Shells | **Worldbreaker** (21,000) | Every 4th shell is a falling mountain. | x3 damage, x1.6 radius, up to 160 enemies, stunning for 2 s (hulks 0.5 s, never bosses). x1.8 damage, x1.15 rate. | A mountain of rock hanging over the kiln, molten in its cracks, with rubble circling it. |
| Rapid Loader | **Grand Battery** (20,000) | A whole battery. | **Map-wide reach**, no blind spot, 10 shells per volley. x1.5 damage, x1.3 rate. | Two great guns on carriages flanking the kiln, and a rangefinder flag. |
| Cinder | **Magma Heart** (20,000) | Fire pools turn to magma. | Pools deal 140/s for 9 s and slow by 40%. Gloom that die in magma **erupt** for 80 within 55, up to 15 a second. | A molten core over the kiln, dripping into a magma ring. |

### Rime Spire (Frost, slow)

| Path | Tier 5 | Identity | Signature mechanic | Second form |
|---|---|---|---|---|
| Deep Freeze | **Permafrost** (17,500) | Cold deep enough to freeze hulks. | Every pulse freezes. Frozen enemies take +100%. **Hulks freeze** for 1 s and bosses slow by 50%. x2.5 damage, x1.25 rate. | A glacier of ice spears fanning out behind it. |
| Shatter | **Avalanche** (19,000) | Chain-reaction shatters. | Shatters deal 500 and **chill what they hit, so those shatter too**, up to 50 a second. x3 damage. | A storm of ice blades and snowballs circling it. |
| Blizzard | **Whiteout** (17,000) | A blizzard over the whole map. | Every enemy on the map is slowed by 35% and Veiled enemies are revealed. Every 4 s a frost wave hits every enemy on the map. x2 damage. | A whirling snow cloud over it, with snow spiralling down. |

### Storm Coil (Arcane, chain)

| Path | Tier 5 | Identity | Signature mechanic | Second form |
|---|---|---|---|---|
| Overcharge | **Stormlord** (22,000) | Every strike is a thunderbolt. | Every strike calls a thunderbolt (x5, blast within 110). Hulks and bosses take x3, and a thunderbolt **staggers a hulk** for 0.4 s. x1.4 damage, x1.2 rate. | A crown of storm cloud, with lightning forking down to two rods. |
| Forking | **Ball Lightning** (21,000) | Orbs roll back up the road. | Every 1.2 s an orb **rolls up the path** for 7 s, arcing into 6 enemies within 80 every 0.4 s. x2 damage, x1.2 rate. | Three crackling spheres circling it. |
| Static | **Eye of the Storm** (20,000) | A storm field. | Everything in range is shocked 4 times a second and Charged (+60% Arcane taken, 35% slower). Stun chance 40%. | A turning vortex disc with a storm-eye beside it. |

### Longeye (Kinetic, map-wide sniper)

| Path | Tier 5 | Identity | Signature mechanic | Second form |
|---|---|---|---|---|
| Deadeye | **Kingslayer** (20,500) | The boss killer. | Each shot also deals **3% of a hulk's full health, 1.2% of a boss's**. Hulks are staggered and bosses slowed. x2 damage, x1.3 rate. | A trophy standard with a broken gold crown. |
| Flak | **Shrapnel Storm** (19,500) | Flocks fall. | Every burst throws **shrapnel at 5 more enemies**, each bursting again. x2 damage, x1.3 rate. | Two spinning flak drums at its sides. |
| Spotter | **Eye of Fate** (18,000) | Dooms the toughest. | The 10 toughest enemies on the map are **Doomed**: +60% damage from everything, and they can't hide. Each is marked with a small eye. x2.5 damage, x1.2 rate. | A great open eye hanging beside it, with lashes of light. |

### Ember Censer (Fire, flamethrower)

| Path | Tier 5 | Identity | Signature mechanic | Second form |
|---|---|---|---|---|
| Pyre | **Phoenix** (19,000) | A phoenix rises from the pyre. | A **phoenix flies up and down the path** near it (within twice its reach), burning everything within 36, ground and air. Flames x2, burns x2. | Wings of fire spread behind the censer. The phoenix itself flies over the road. |
| Dragon's Breath | **Elder Wyrm** (20,000) | Rivers of dragonfire. | Every 6 s it breathes **a river of fire 280 long up the path**: 250 Fire/s for 5 s. x2 damage. | A horned dragon's head and neck rising behind it. |
| Ash | **Pall of Ash** (18,000) | Ash over the whole map. | **Every enemy on the map is Scorched and branded** (no healing or shields, no resistances) and takes +25%; inside its flame, +60%. x2.5 damage. | A column of ash smoke rising, with flakes drifting down. |

### Prism (Radiant, beam)

| Path | Tier 5 | Identity | Signature mechanic | Second form |
|---|---|---|---|---|
| Focus | **Dawnbreaker** (22,500) | A beam that burns through. | Charges to x30. At full charge the beam **runs on through everything in its line** at 40% power. x2 damage. | A sun-disc of spear-rays behind the lens. |
| Refraction | **Lightweb** (20,500) | Beams woven into a web. | 12 beams. Each target is **joined to the next by a thread of light** that burns whatever crosses it. x1.8 damage. | Six crystal nodes on a ring, joined by threads. |
| Afterglow | **Second Sun** (20,000) | A second sun. | Every 2.5 s its sun **flares** over everything in range (up to 40 enemies) for 60% of the full-charge beam. x2 damage. | A small sun beside the prism. |

### Beacon (support aura)

| Path | Tier 5 | Identity | Signature mechanic | Second form |
|---|---|---|---|---|
| War Drum | **Anthem of War** (20,000) | A war anthem. | +70% attack speed and +50% damage inside, and every 15 s a **battle cry**: x2 attack speed for 4 s. | A great drum behind it and two war banners. |
| Lighthouse | **Worldlight** (17,000) | A light over the whole world. | **Map-wide:** every ward gets +40% range, sees the Veiled and can hit flyers. Every Veiled enemy is revealed. | A great lens on a post, sweeping a beam across the ground. |
| Tithe | **Golden Age** (18,000) | A golden age. | +1,000 gold a wave and 8% interest (up to 2,000), and **upgrades to tier 4 cost 15% less**. | A laurel halo of gold, coins circling, and a chest at its feet. |

### Thornlight Snare (Kinetic, path trap)

| Path | Tier 5 | Identity | Signature mechanic | Second form (kept low: it lies on the road) |
|---|---|---|---|---|
| Caltrops | **Thornwall** (17,500) | A wall of briars. | Enemies standing on it are **bitten again every 0.5 s** and slowed by 80%. x2 damage, x2 charges, x2 refill. | A ring of iron briars standing round the grate. |
| Flashmines | **Constellation** (19,000) | Linked mines. | When a mine bursts, **every mine within 150 bursts too**. Up to 30 mines, 5 a second, 160 damage each. | Five lamp-stars round it, joined by lines of light. |
| Binding Light | **Seal of Dawn** (18,000) | A seal that binds even bosses. | Every 8 s it **binds the strongest enemy within 240** for 3 s (bosses 1.5 s), and that enemy takes +50%. Holds a Heavy every 3 s. x2 damage. | A great turning seal of runes and a ring of chains. |

### Moth Lantern (Radiant, flyer lure)

| Path | Tier 5 | Identity | Signature mechanic | Second form |
|---|---|---|---|---|
| Bright Lure | **False Moon** (17,000) | A false moon. | **Lures flyers from anywhere on the map**, up to 80 at once, and they take +80%. | A pale moon rising behind the lantern. |
| Flypaper | **Amber Trap** (16,000) | Flyers set in amber. | Released flyers are held still for 2.5 s and **never fly high again**. Circling flyers take +35%. | A great drop of amber with a moth caught inside. |
| Moth-trap | **Moth Queen** (18,500) | The queen leads the swarm. | 900/s to circling flyers, and **its moths sting ground enemies in its light too** (up to 30, at 30%). | A great moth with eyed wings spread behind the lantern. |

### Wandering Light (Arcane, roaming caster)

| Path | Tier 5 | Identity | Signature mechanic | Second form |
|---|---|---|---|---|
| Hunter | **Falling Sky** (19,500) | Stars pulled from the sky. | Every 4th cast is a **falling star**: x4 damage that bursts on up to 30 within 130 and stuns for 1 s (not hulks). x1.6 damage. | Stars falling round it, leaving trails. |
| Swarm | **Starhost** (18,000) | A host of lights. | 5 lights, and every **star leaps on to a second enemy**. x2.2 damage, x1.2 rate. | A ring of five stars wheeling round it. |
| Torchbearer | **Dawnbringer** (18,000) | A great torch at dawn. | Wards within 180 of its post get +45% speed and +30% damage. **Marked Gloom that die mark everything around them**. x2 damage. | A rose sunrise behind it and a great torch beside it. |

### Ember Vault (economy)

| Path | Tier 5 | Identity | Signature mechanic | Second form |
|---|---|---|---|---|
| Great Brazier | **Dragon's Hoard** (18,000) | A dragon's hoard. | Cap 20,000, grows 30% a wave, and **cash-outs of 5,000 or more pay 20% extra**. | Heaps of gold, a chest and a small gold dragon curled on the brazier. |
| Gleaners | **Ember Tide** (17,000) | Embers from everywhere. | 250% of bounties from every kill on the map at full rate. **Empties itself into your gold at every wave clear.** | Streams of embers spiralling in. |
| Hearthwarm | **Second Heartfire** (19,000) | A second heart. | Always warm: wards in range get +50% speed and +35% damage. **When an enemy gets through, it pays 40 embers per life** instead of you (a last-stand save). | A rose heart-flame floating beside it. |

## Checks

- `node tools/smoke.js`:
  - takes every path of every ward to tier 5 through the real UI, in both skins;
  - uses each R action and ability;
  - checks that a second copy of a tier 5 is refused.
- `node tools/tier5.js [wave=35]`: each tier 5 against its tier 4 on the same late wave, alone (damage
  dealt and the ratio), and which tier 5 effects fired.
- `node tools/report.js`: estimated power and power per gold, with a T5 column.
- `node tools/wards.mjs`: every tier 5 in both skins, 76 px cap, body-and-face rule. Run it in groups
  of four wards on this machine (memory).
- `node tools/perf.mjs defence=t5`: the full defence with tier 5s where the limit allows.
