<!-- Raw notes from a research sub-agent (2026-11-20), kept as the source behind docs/upgrade-visuals-research.md.
     Several sources could not be read: Riot's VFX style guide redirected, the Dota 2 art guide returned empty,
     GDC Vault talks need a login, and the TF2 GDC PDF could not be read here. Unverified claims are marked. -->

# Art principles for upgrade progression at small sizes

Primary sources were thin. The strongest were Riot (League of Legends clarity and VFX posts), Valve (Team Fortress 2 and Dota 2 readability guidance) and VFX style-guide write-ups. No first-party upgrade-art commentary was found from Ninja Kiwi, Ironhide or Supercell, so points about their games are the agent's own observations, marked (unverified).

## 1. Visual power progression

- **Start modest so there is room to climb.** Starter gear should look plain (worn wood, leather, rusty iron), with plating, sigils and engravings at middle tiers (devtrackers.gg Last Epoch armour post; Path of Exile forum).
  - Apply: tier 1 is low saturation with no glow.
- **Give each tier a budget.** Riot scales the amount of change with skin price tier: one small tweak, then a recolour plus elements, then new VFX, then new VFX plus flourishes (leagueoflegends.com dev post on VFX updates). Its "bucket" image: model, animation, VFX and sound share one budget and must never overflow (leagueoflegends.com "Clarity in League").
- **Use one ladder of materials and colours for every ward.** For example wood, then iron, then bronze or gold, then enchanted. Tiered icon packs and Clash of Clans levels do this (unverified as a stated rule).
- **Grow upward and add parts rather than scaling the whole sprite.** Defense Grid made each tower distinct and tall, with three visual levels per type (gamedeveloper.com, "The Art of Defense Grid").
  - Rule of thumb: about 10-15% more height per tier, with the footprint fixed (unverified).
- **Symmetry and ornament rise with tier.** A calm, symmetrical, crowned shape reads as authority (unverified convention).
- **Keep headroom.** Write down a cap per tier (height, glow radius, particle count, top value) and keep tier 4 at about 80% of it (VFX Apprentice summary of Riot's guide).

## 2. Branches as siblings

- **One anchor never changes.** Riot requires every champion to keep one main identifying feature that no skin may remove (Clarity in League). Evolution lines keep one or two recurring traits.
- **Share the shape language and palette, but vary how they are applied** (rocketbrush.com; cg-wire.com on shape language).
- **Each path pushes one trait.** Overwatch pushed character traits further for stronger silhouettes (cookandbecker.com, "Designing Overwatch"). Useful traits: Heavy (wide, low, blocky, one big emitter), Many (repeated small elements), Arcane (tall, thin, a floating part, glow).
- **Silhouette-test paths against each other** at game size, filled black.
- **A path's identity must read without colour.** Valve ranks the reads as colour first, then silhouette, then detail (gamedeveloper.com on how Valve makes art).

## 3. Readability at 35-68 px

- **Check the silhouette first.** Test against dark, light and mid-grey ground (bugnet.io).
- **Use a value gradient with one focal point.** TF2 and Dota 2 keep the lower body dark and put the highest contrast at chest or weapon height (gamedeveloper.com; Steam Dota 2 art guide, seen only via search snippet).
- **Leave areas of rest.** Large calm areas; saturated colour only in small places. Features under about 3 px become noise at about 50 px (unverified rule of thumb).
- **Treat contrast as a budget.** Wards sit below enemies and attack effects in saturation (gamedeveloper.com, "How to reduce visual confusion").
- **Plan for crowds.** Kingdom Rush Battles made its towers more minimal because space was tight (ironhidegames.com news 420). Defense Grid capped itself at 10 tower types.

## 4. Effects and animation carry the "impressive" read

- **One focal layer plus soft supporting layers.** Save peak brightness for the impact (vfxapprentice.com, "10 League of Legends VFX design tips").
- **Time attacks as anticipation, impact, then fade.** Peak in the first quarter, then a quick fade. Higher tiers get a bigger wind-up, not longer-lasting effects.
- **Keep effects short.** Lingering effects clutter the field, hide enemies and cost overdraw. An effect's size should match the real area it affects.
- **Idle motion: subtle, scaled by tier, out of sync across wards** (garagefarm.net; Factorio forums).
- **Cheap tricks for Canvas 2D:** one pre-rendered glow sprite drawn additively, small particle pools, and no per-frame shadowBlur (realtimevfx.com; construct.net forum).

## 5. Reward at the moment of upgrade

- **Make feedback bigger than the click:**
  - a squash, then a white silhouette flash swapping old form for new, then an overshoot and settle;
  - a ring burst;
  - a rising chime pitched by tier;
  - screen shake only at tier 4 and up.

  Sources: Vlambeer's "Art of Screenshake" talk via gamedeveloper.com; eastondev.com.
- **A silhouette flicker between the old and new forms.** Gen I Pokémon showed evolution this way (bulbapedia).
- **Scale the celebration with the tier.**
- **The new form is the lasting reward.** An "upgrade affordable" cue helps (Kingdom Rush Battles, ironhidegames.com news 420).
- **Clarity beats cool when the two conflict** (Riot).

## Checklist the agent proposed

1. One fixed anchor per ward, the same in every path and tier.
2. Each path pushes one trait, and the tier 3-4 silhouettes look different when filled black.
3. Each tier adds a new shape plus a material step, mostly in the top third. The base and footprint stay constant.
4. A written budget per tier, with tier 4 at about 80% of the caps.
5. A dark base and a bright core: one focal point, no detail under about 3 px, large calm areas.
6. Wards sit below enemies and effects in saturation. Near-white is kept for impacts and the upgrade flash.
7. Effects run anticipation, peak, quick fade. Bigger tiers mean a bigger wind-up, not a longer effect.
8. Idle motion is subtle, scales with tier and is out of sync across wards.
9. The upgrade moment is a squash, flash swap, overshoot, ring and chime, scaled by tier, in about 0.5 s.
10. A crowd test of 8-10 mixed tier 4 wards, checked in greyscale, keeps enemies readable and the frame rate holds.
