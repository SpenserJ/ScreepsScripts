import { findNearbyContainers } from './utilities';

export default room => {
  const roomMem = Memory.rooms[room.name].cache;
  const spawns = roomMem.structureTypes[STRUCTURE_SPAWN];
  spawns.forEach(spawnId => {
    const spawn = roomMem.structures[spawnId];
    if (!spawn.nearbyContainers) {
      spawn.nearbyContainers = findNearbyContainers(room, spawn.pos);
    }
  });
};
