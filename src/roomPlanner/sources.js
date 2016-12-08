import { findWorkSpots } from '../cache/utilities';
import { sum } from '../utilities';
import { createTask, taskExists } from '../unitCoordinator';

const calculateDistance = (pos, pos2) => {
  const { x, y } = pos;
  const { x: x2, y: y2 } = pos2;
  return Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2));
}

export default (roomName, roomMem) => {
  const room = Game.rooms[roomName];
  // Find all sources that don't have a container near them.
  Object.values(roomMem.sources)
    .forEach(source => {
      if (source.nearbyContainers.length !== 0) {
        // If the container exists, make sure we have a task for hauling from it.
        source.nearbyContainers.forEach(container => {
          const taskReference = { id: container, goal: 'empty' };
          if (taskExists(room, taskReference)) { return; }
          createTask(room, {
            reference: taskReference,
            task: {
              action: 'haul',
              role: 'Hauler',
              id: container,
            },
            required: 1,
          });
        });
        return;
      }
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
    });
};
