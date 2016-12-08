import { findWorkSpots } from '../cache/utilities';
import { getRoomStructureById, getStructures, uid } from '../utilities';
import { createTask, taskExists } from '../unitCoordinator';

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
        const path = room.findPath(
          Game.getObjectById(spawn.id).pos,
          containerRaw.pos,
          {
            ignoreCreeps: true,
            ignoreDestructibleStructures: false,
            ignoreRoads: true,
            avoid: Object.values(getStructures(roomName, [
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
          reference: { from: spawn.id, to: containerId, goal: 'road' },
          task: {
            action: 'road',
            role: 'Builder',
            from: spawn.id,
            to: containerId,
          },
          required: 2,
        });
        const roadID = uid();
        const roadIDReversed = uid();
        roads[roadID] = Room.serializePath(path);
        roads[roadIDReversed] = Room.serializePath(path.reverse());
        if (!roadsFrom[spawn.id]) { roadsFrom[spawn.id] = {}; }
        if (!roadsFrom[containerId]) { roadsFrom[containerId] = {}; }
        roadsFrom[spawn.id][containerId] = roadID;
        roadsFrom[containerId][spawn.id] = roadIDReversed;
      });
    });
    /*
    if (source.nearbyContainers.length === 0) { return; }
      const taskReference = { id: source.id, goal: 'container' };
      if (taskExists(room, taskReference)) { return; }

      console.log('Trying to build container for source', source.id);
      const workSpots = findWorkSpots(room, source.pos, 1);
      const storageSpots = findWorkSpots(room, source.pos, 2, 2);
      const closestSpots = storageSpots
        .map(pos => {
          const { x, y } = pos;
          const { x: x2, y: y2 } = source.pos;
          const dist = Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2));
          return {
            x: pos.x, y: pos.y,
            dist: sum(workSpots.map(workPos => calculateDistance(pos, workPos))) / workSpots.length,
          };
        })
        .sort((a, b) => a.dist - b.dist);
      if (closestSpots.length === 0) {
        console.log('ERROR: Could not find spot to build container close to source');
        return;
      }
      room.createConstructionSite(closestSpots[0].x, closestSpots[0].y, STRUCTURE_CONTAINER);
      createTask(room, {
        reference: taskReference,
        task: {
          action: 'build',
          role: 'Builder',
          pos: { x: closestSpots[0].x, y: closestSpots[0].y, roomName },
          id: room.lookForAt(LOOK_CONSTRUCTION_SITES, closestSpots[0].x, closestSpots[0].y)[0].id,
        },
        required: 2,
      });
      // TODO: This should push the new construction site into memory.
    });*/
  });
};
