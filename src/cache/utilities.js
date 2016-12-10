const calculateRangeAround = (pos, range) => {
  const perRow = range * 2 + 1
  const indexSize = perRow * perRow;
  const centerIndex = Math.floor(indexSize / 2);
  return {
    perRow,
    indexSize,
    centerIndex,
  };
}

const translateIndexToCoord = (center, index, perRow) => {
  const xMod = (index % perRow);
  const x = (center.x - 1 + xMod);
  const y = (center.y - 1 + (index - xMod) / perRow);
  return { x, y };
}

export const lookAround = (room, pos, lookTypes = null, range = 1) => {
  const around = {};
  const { perRow, indexSize, centerIndex } = calculateRangeAround(pos, range);
  for (let checkIndex = 0; checkIndex < indexSize; checkIndex++) {
    // Dont check the source itself.
    if (checkIndex === centerIndex) { continue; }
    const { x: checkX, y: checkY } = translateIndexToCoord(pos, checkIndex, perRow);
    const atPos = room.lookAt(checkX, checkY, room.roomName);
    const filteredAtPos = (lookTypes && lookTypes.length)
      ? atPos.filter(found => lookTypes.includes(found.type))
      : atPos;
    around[`${checkX},${checkY}`] = filteredAtPos;
  }
  return around;
}

export const findWorkSpots = (room, pos, range = 1, ignoreInner = 1) => {
  const workSpots = [];
  const { perRow, indexSize, centerIndex } = calculateRangeAround(pos, range);
  for (let checkIndex = 0; checkIndex < indexSize; checkIndex++) {
    const { x, y } = translateIndexToCoord(pos, checkIndex, perRow);
    // Don't check within (ignoreInner - 1) of the centerpoint.
    if (Math.abs(x - pos.x) <= (ignoreInner - 1) && Math.abs(y - pos.y) <= (ignoreInner - 1)) {
      continue;
    }
    if (checkIndex === centerIndex) { continue; }
    const atPos = room.lookAt(x, y, room.roomName)
      .filter(found => {
        if (found.type !== LOOK_TERRAIN && found.type !== LOOK_STRUCTURES) { return false; }
        const foundType = (found.type === LOOK_TERRAIN) ? found.terrain : found.structure.structureType;
        return OBSTACLE_OBJECT_TYPES.includes(foundType);
      });
    if (atPos.length === 0) {
      workSpots.push({ x, y });
    }
  }
  return workSpots;
};

export const countWorkSpots = (room, pos) => findWorkSpots(room, pos).length;

export const findNearbyContainers = (room, pos, range = 1) => {
  return Object.values(lookAround(room, pos, [LOOK_STRUCTURES], range))
    .reduce((acc, next) => acc.concat(next), [])
    .filter(s => s.structure.structureType === STRUCTURE_CONTAINER)
    .map(s => s.structure.id);
}

export const updateStructureStats = structureRaw => {
  const structure = {
    isActive: structureRaw.isActive(),
  };
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
