import { findWorkSpots } from '../cache/utilities';
import { getRoomStructureById, getStructures, uid } from '../utilities';
import { createTask, taskExists } from '../unitCoordinator';

const createRoad = (room, from, to) => {
  const { roads, roadsFrom } = room.memory;
  const path = room.findPath(
    from.pos,
    to.pos,
    {
      ignoreCreeps: true,
      ignoreDestructibleStructures: false,
      ignoreRoads: true,
      avoid: Object.values(getStructures(room.name, [
        STRUCTURE_CONTAINER,
        STRUCTURE_SPAWN,
        STRUCTURE_TOWER,
        STRUCTURE_EXTENSION,
        STRUCTURE_STORAGE,
        STRUCTURE_CONTROLLER,
      ])).map(cachedObj => Game.getObjectById(cachedObj.id).pos),
      maxRooms: 1,
    }
  );
  path.forEach(pos => {
    room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
  });
  createTask(room, {
    reference: { from: from.id, to: to.id, goal: 'road' },
    task: {
      action: 'road',
      role: 'Builder',
      from: from.id,
      to: to.id,
    },
    required: 2,
  });
  const roadID = uid();
  const roadIDReversed = uid();
  roads[roadID] = Room.serializePath(path);
  roads[roadIDReversed] = Room.serializePath(path.reverse());
  if (!roadsFrom[from.id]) { roadsFrom[from.id] = {}; }
  if (!roadsFrom[to.id]) { roadsFrom[to.id] = {}; }
  roadsFrom[from.id][to.id] = roadID;
  roadsFrom[to.id][from.id] = roadIDReversed;
};

export default (roomName, roomMem) => {
  const room = Game.rooms[roomName];
  const { roads, roadsFrom } = room.memory;

  // Find all source containers that don't have a road to them.
  Object.values(roomMem.sources).forEach(source => {
    Object.values(source.nearbyContainers).forEach(containerId => {
      const container = getRoomStructureById(roomName, containerId);
      const containerRaw = Game.getObjectById(containerId);
      getStructures(roomName, STRUCTURE_SPAWN).forEach(spawn => {
        // Don't build roads that already exist.
        if (roadsFrom[spawn.id] && roadsFrom[spawn.id][container.id]) { return; }
        createRoad(room, Game.getObjectById(spawn.id), containerRaw);
      });
    });
  });

  getStructures(roomName, STRUCTURE_SPAWN).forEach(spawn => {
    const spawnRaw = Game.getObjectById(spawn.id);
    getStructures(roomName, STRUCTURE_EXTENSION).forEach(extension => {
      const extensionRaw = Game.getObjectById(extension.id);
      // Don't build roads that already exist.
      if (roadsFrom[spawn.id] && roadsFrom[spawn.id][extension.id]) { return; }
      createRoad(room, spawnRaw, extensionRaw);
    });
  });
};
