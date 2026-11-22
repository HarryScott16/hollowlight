// The maps. Coordinates are logical canvas pixels (every map is 1120 x 720).
//
// A map has one or more routes, each a ground road from its own Rift to the Heartfire plus the line
// its flyers take (they cut corners). With several routes, the Gloom take turns between them (see
// Game.startWave). Terrain blocks building: `ponds` (water, lava or ice, by theme), `rocks`, and a
// scatter of `treeCount` trees. `theme` picks the look in render/background.js. Every map uses the
// same 40-wave campaign and endless mode. A map can also set `tough(wave)`: a health multiplier for
// the tough Gloom on top of the difficulty's, to even out a map whose late game is easier than
// Hollowmere's (tools/bot.js --map= is how they were set).
export const MAPS = {
  hollowmere: {
    id: 'hollowmere',
    name: 'Hollowmere',
    desc: 'A winding road through a dusk meadow. The classic: one Rift, one long road.',
    theme: 'meadow',
    width: 1120,
    height: 720,
    pathWidth: 44,
    cornerRadius: 46,
    routes: [{
      // Ground route from the Rift (off-screen left) to the Heartfire.
      waypoints: [
        [-50, 140], [260, 140], [260, 360], [110, 360], [110, 580], [480, 580], [480, 250],
        [700, 250], [700, 90], [940, 90], [940, 420], [680, 420], [680, 600], [1010, 600],
      ],
      // Flyers cut the corners along this route.
      fly: [[-50, 140], [260, 140], [480, 250], [700, 250], [940, 420], [1010, 600]],
      rift: { x: 6, y: 140 },
    }],
    goal: { x: 1010, y: 600, r: 50 },
    ponds: [
      { x: 300, y: 472, rx: 62, ry: 36 },
      { x: 822, y: 300, rx: 44, ry: 38 },
      { x: 568, y: 120, rx: 56, ry: 30 },
      { x: 1040, y: 250, rx: 40, ry: 52 },
    ],
    rocks: [
      { x: 150, y: 250, r: 22 }, { x: 590, y: 505, r: 26 }, { x: 400, y: 100, r: 20 },
      { x: 860, y: 530, r: 18 }, { x: 60, y: 665, r: 24 }, { x: 790, y: 690, r: 20 },
      { x: 385, y: 310, r: 17 },
    ],
    treeCount: 24,
    seed: 7,
  },

  ashfork: {
    id: 'ashfork',
    name: 'Ashfork',
    desc: 'Two Rifts, two roads through the cinders that merge halfway. Split your defence, then hold the fork.',
    theme: 'ash',
    width: 1120,
    height: 720,
    pathWidth: 44,
    cornerRadius: 46,
    routes: [
      { waypoints: [[-50, 100], [300, 100], [300, 290], [520, 290], [760, 290], [760, 90], [1020, 90], [1020, 400], [640, 400], [640, 620], [1040, 620]],
        fly: [[-50, 100], [760, 290], [1020, 400], [1040, 620]], rift: { x: 6, y: 100 } },
      { waypoints: [[-50, 620], [280, 620], [280, 460], [520, 460], [520, 290], [760, 290], [760, 90], [1020, 90], [1020, 400], [640, 400], [640, 620], [1040, 620]],
        fly: [[-50, 620], [520, 460], [640, 560], [1040, 620]], rift: { x: 6, y: 620 } },
    ],
    goal: { x: 1040, y: 620, r: 50 },
    ponds: [   // lava pools
      { x: 140, y: 360, rx: 58, ry: 66 },
      { x: 890, y: 245, rx: 56, ry: 48 },
      { x: 420, y: 556, rx: 52, ry: 26 },
      { x: 840, y: 512, rx: 70, ry: 36 },
    ],
    rocks: [
      { x: 420, y: 190, r: 22 }, { x: 600, y: 160, r: 18 }, { x: 70, y: 210, r: 20 }, { x: 1080, y: 230, r: 22 },
      { x: 380, y: 380, r: 18 }, { x: 560, y: 690, r: 20 }, { x: 960, y: 690, r: 18 },
    ],
    treeCount: 20,
    seed: 23,
    // The merged road is one long killing ground: the late waves need more to them here.
    tough: (wave) => 1 + 0.015 * Math.max(0, wave - 20),
  },

  rimecoil: {
    id: 'rimecoil',
    name: 'Rimecoil',
    desc: 'A frozen road spirals in to a Heartfire near the middle. A long walk for the Gloom, but the flocks fly straight in.',
    theme: 'snow',
    width: 1120,
    height: 720,
    pathWidth: 44,
    cornerRadius: 46,
    routes: [{
      waypoints: [[-50, 140], [900, 140], [900, 580], [200, 580], [200, 290], [720, 290], [720, 450], [420, 450]],
      fly: [[-50, 140], [420, 150], [760, 260], [640, 420], [420, 450]],
      rift: { x: 6, y: 140 },
    }],
    goal: { x: 420, y: 450, r: 50 },
    ponds: [   // frozen lakes
      { x: 1012, y: 360, rx: 52, ry: 96 },
      { x: 92, y: 440, rx: 56, ry: 84 },
      { x: 560, y: 664, rx: 130, ry: 30 },
      { x: 590, y: 372, rx: 40, ry: 26 },
    ],
    rocks: [
      { x: 330, y: 214, r: 20 }, { x: 800, y: 214, r: 18 }, { x: 1060, y: 80, r: 22 }, { x: 60, y: 660, r: 22 },
      { x: 990, y: 650, r: 20 }, { x: 300, y: 372, r: 16 },
    ],
    treeCount: 26,
    seed: 41,
    // The long spiral gives every ward a lot of road: the late waves need more to them here.
    tough: (wave) => 1 + 0.02 * Math.max(0, wave - 20),
  },

  mirefen: {
    id: 'mirefen',
    name: 'Mirefen',
    desc: 'A plank causeway crosses a black lake in three long straights. Little dry land, tight hairpins at each end.',
    theme: 'marsh',
    width: 1120,
    height: 720,
    pathWidth: 44,
    cornerRadius: 46,
    routes: [{
      waypoints: [[-50, 120], [1000, 120], [1000, 330], [130, 330], [130, 560], [1030, 560]],
      fly: [[-50, 120], [880, 130], [240, 350], [880, 545], [1030, 560]],   // the flocks follow the causeway's light, cutting across at the hairpins
      rift: { x: 6, y: 120 },
    }],
    goal: { x: 1030, y: 560, r: 50 },
    ponds: [   // the lake, in pieces between the straights
      { x: 560, y: 225, rx: 270, ry: 34 },
      { x: 560, y: 445, rx: 260, ry: 44 },
      { x: 470, y: 674, rx: 280, ry: 30 },
      { x: 640, y: 34, rx: 220, ry: 26 },
    ],
    rocks: [
      { x: 1080, y: 40, r: 18 }, { x: 40, y: 460, r: 20 }, { x: 1080, y: 440, r: 20 }, { x: 260, y: 236, r: 16 },
    ],
    treeCount: 22,
    seed: 59,
  },
};
export const MAP_ORDER = ['hollowmere', 'ashfork', 'rimecoil', 'mirefen'];
export function mapById(id) { return MAPS[id] || MAPS.hollowmere; }
