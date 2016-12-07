import { countWorkSpots, findNearbyContainers } from './utilities';

export default room => {
  const roomMem = Memory.rooms[room.name].cache;
  if (!roomMem.sources) {
    const sources = {};
    room.find(FIND_SOURCES).forEach(sourceRaw => {
      const source = {
        id: sourceRaw.id,
      };
      // Keeper Lairs are dangerous! Avoid them at all costs.
      source.lair = sourceRaw.pos.findInRange(FIND_STRUCTURES, 5, {
        filter: s => s.structureType === STRUCTURE_KEEPER_LAIR,
      }).length !== 0;

      source.pos = sourceRaw.pos;
      // Check for how many spots are walkable around the source.
      source.workSpots = countWorkSpots(room, source.pos);
      source.nearbyContainers = findNearbyContainers(room, source.pos, 2);

      sources[sourceRaw.id] = source;
    });
    roomMem.sources = sources;
  }
}
