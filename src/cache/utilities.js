export const lookAround = (room, pos, lookTypes = null, range = 1) => {
  const around = {};
  const perRow = range * 2 + 1
  const indexSize = perRow * perRow;
  const centerIndex = Math.floor(indexSize / 2);
  for (let checkIndex = 0; checkIndex < indexSize; checkIndex++) {
    // Dont check the source itself.
    if (checkIndex === centerIndex) { continue; }
    const checkXMod = (checkIndex % perRow);
    const checkX = (pos.x - 1 + checkXMod);
    const checkY = (pos.y - 1 + (checkIndex - checkXMod) / perRow);
    const atPos = room.lookAt(checkX, checkY, room.roomName);
    const filteredAtPos = (lookTypes && lookTypes.length)
      ? atPos.filter(found => lookTypes.includes(found.type))
      : atPos;
    around[`${checkX},${checkY}`] = filteredAtPos;
  }
  return around;
}

export const countWorkSpots = (room, pos) => {
  return 8 - Object.values(lookAround(room, pos, [LOOK_TERRAIN, LOOK_STRUCTURES]))
      .filter(atPos => {
      return atPos.filter(found => {
        const foundType = (found.type === LOOK_TERRAIN) ? found.terrain : found.structure.structureType;
        return OBSTACLE_OBJECT_TYPES.includes(foundType);
      }).length;
    }).length;
};

export const findNearbyContainers = (room, pos, range = 1) => {
  return Object.values(lookAround(room, pos, [LOOK_STRUCTURES], range))
    .reduce((acc, next) => acc.concat(next), [])
    .filter(s => s.structure.structureType === STRUCTURE_CONTAINER)
    .map(s => s.structure.id);
}

export const updateStructureStats = structureRaw => {
  const structure = {};
  if (typeof structureRaw.energy !== 'undefined') {
    structure.energy = structureRaw.energy;
    structure.energyCapacity = structureRaw.energyCapacity;
  }
  if (typeof structureRaw.store !== 'undefined') {
    structure.store = structureRaw.store;
    structure.storeCapacity = structureRaw.storeCapacity;
  }
  if (typeof structureRaw.hits !== 'undefined') {
    structure.hits = structureRaw.hits;
    structure.hitsMax = structureRaw.hitsMax;
  }
  if (typeof structureRaw.ticksToDecay !== 'undefined') {
    structure.ticksToDecay = structureRaw.ticksToDecay;
  }
  return structure;
};

export const updateConstructionStats = siteRaw => ({
  progress: siteRaw.progress,
  progressTotal: siteRaw.progressTotal,
});
