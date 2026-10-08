/** Shared, deliberately irregular site plan. Coordinates are the rule and render centres. */
export const LAYOUT_VERSION = 2;

export const BLOCK_LAYOUT = Object.freeze([
  { id: '101', x: -12, z: -10, rotation: -0.16, scaleX: 1.05, scaleZ: 0.95, h: 10.1, floors: 10, accent: '#d59a7e' },
  { id: '102', x: -1, z: -9.8, rotation: 0.12, scaleX: 1.15, scaleZ: 0.9, h: 12.7, floors: 12, accent: '#d4b479' },
  { id: '103', x: 10.4, z: -7.2, rotation: -0.32, scaleX: 0.95, scaleZ: 1.06, h: 10.9, floors: 11, accent: '#94aaa1' },
  { id: '104', x: -10.8, z: 3.4, rotation: 0.23, scaleX: 1.15, scaleZ: 0.95, h: 8.7, floors: 8, accent: '#c3a477' },
  { id: '105', x: 0.7, z: 1, rotation: -0.13, scaleX: 0.93, scaleZ: 1.03, h: 10.2, floors: 10, accent: '#d39b87' },
  { id: '106', x: 12.9, z: 6.2, rotation: 0.3, scaleX: 1.07, scaleZ: 0.95, h: 9.4, floors: 9, accent: '#9eafa1' },
].map(Object.freeze));

export const LOT_LAYOUT = Object.freeze([
  { id: 'p1', x: -7.4, z: 12, rotation: -0.18, label: '01' },
  { id: 'p2', x: 0.5, z: -18, rotation: 0.1, label: '02' },
  { id: 'p3', x: 4.8, z: 12.1, rotation: 0.2, label: '03' },
  { id: 'p4', x: -20, z: 2.8, rotation: 0.1, label: '04', parking: true },
].map(Object.freeze));

// Roads curve around the neighbourhood, leaving a pedestrian interior.
export const ROAD_LOOP = Object.freeze([
  [-25, -13], [-23.8, -21.9], [-12, -22.8], [5, -22.8], [21, -21.1],
  [24.3, -12], [24.4, 0.5], [23.3, 12], [17, 17.3], [1, 17.3],
  [-14, 17.3], [-23.7, 12], [-25, 0],
].map(Object.freeze));

export const WALK_ROUTES = Object.freeze([
  [[-19, -7], [-16, -4.8], [-8, -3.9], [-3.8, -3.6], [0, -4.9], [4.7, -3.6], [7.2, -0.2], [19.5, 0.1], [20.5, 8], [19.4, 12.5]],
  [[-19, 8.2], [-12, 8], [-7, 8], [-3.8, 6.8], [1.6, 7.2], [4, 8.3]],
  [[-4.8, 6.2], [-4.7, 2.7], [-4.2, -0.3], [-3.8, -3.6]],
].map((route) => Object.freeze(route.map(Object.freeze))));

/** Only the spatial part of a legacy save changes; game and historical values survive. */
export function migrateLayout(state) {
  if (!state || state.layoutVersion) return state;
  const next = structuredClone(state);
  const migrate = (records, definitions) => records?.map((record) => {
    const layout = definitions.find((item) => item.id === String(record.id));
    if (!layout) return record;
    const { x, z, rotation, scaleX, scaleZ } = layout;
    return { ...record, x, z, rotation, ...(scaleX ? { scaleX, scaleZ } : {}) };
  });
  next.buildings = migrate(next.buildings, BLOCK_LAYOUT);
  next.lots = migrate(next.lots, LOT_LAYOUT);
  next.layoutVersion = LAYOUT_VERSION;
  return next;
}
