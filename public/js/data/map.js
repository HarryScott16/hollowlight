// Map layout. Coordinates are in logical canvas pixels (width x height).
export const MAP = {
  name: 'Hollowmere',
  width: 1120,
  height: 720,
  pathWidth: 44,
  cornerRadius: 46,
  // Ground route from the Rift (off-screen left) to the Heartfire.
  waypoints: [
    [-50, 140], [260, 140], [260, 360], [110, 360], [110, 580], [480, 580], [480, 250],
    [700, 250], [700, 90], [940, 90], [940, 420], [680, 420], [680, 600], [1010, 600],
  ],
  // Flyers cut the corners along this route (used from the flyer stage onward).
  flyPath: [[-50, 140], [260, 140], [480, 250], [700, 250], [940, 420], [1010, 600]],
  goal: { x: 1010, y: 600, r: 50 },
  rift: { x: 6, y: 140 },
  // Terrain that blocks building.
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
};
