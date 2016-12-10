import { lookAround, findWorkSpots } from '../cache/utilities';
import { sum, getStructures, calculateDistance } from '../utilities';
import { createTask, taskExists } from '../unitCoordinator';

export default (roomName, roomMem) => {
  const room = Game.rooms[roomName];

  // Find all sources that don't have a container near them.
  getStructures(room, STRUCTURE_SPAWN).forEach(spawn => {
    const taskReference = { id: spawn.id, goal: 'container' };
    if (taskExists(room, taskReference)) { return; }

    // Don't add containers if there is already one beside the spawn
    if (spawn.nearbyContainers.length !== 0) { return; }

    const possibleStorageSpots = findWorkSpots(room, spawn.pos);
    // If there is nowhere to build a container, abort.
    if (possibleStorageSpots.length === 0) { return; }

    const avoid = Object.values(roomMem.sources)
      .concat(getStructures(room, STRUCTURE_CONTROLLER))
      .map(s => s.pos);
    const farthestFromCommonUses = possibleStorageSpots
      .map(pos => ({
        x: pos.x, y: pos.y,
        dist: sum(avoid.map(avoidPos => calculateDistance(pos, avoidPos))) / avoid.length,
      }))
      .sort((a, b) => b.dist - a.dist);

    room.createConstructionSite(farthestFromCommonUses[0].x, farthestFromCommonUses[0].y, STRUCTURE_CONTAINER);
    createTask(room, {
      reference: taskReference,
      task: {
        action: 'build',
        role: 'Builder',
        pos: { x: farthestFromCommonUses[0].x, y: farthestFromCommonUses[0].y, roomName },
        id: room.lookForAt(LOOK_CONSTRUCTION_SITES, farthestFromCommonUses[0].x, farthestFromCommonUses[0].y)[0].id,
      },
      required: 2,
    });
  });
};
