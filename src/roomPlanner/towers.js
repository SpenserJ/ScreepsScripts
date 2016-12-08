import { findWorkSpots } from '../cache/utilities';
import { getRoomStructureById, getStructures } from '../utilities';
import { createTask, deleteTask, taskExists } from '../unitCoordinator';

export default (roomName, roomMem) => {
  const room = Game.rooms[roomName];
  const taskReference = { structureType: STRUCTURE_TOWER, goal: 'fill' };
  const existingTask = taskExists(room, taskReference);
  const towersNeedingFill = getStructures(roomName, STRUCTURE_TOWER)
    .filter(tower => tower.energy < tower.energyCapacity);

  if (existingTask && towersNeedingFill.length === 0) {
    // If no towers need fill, delete the task.
    deleteTask(room, existingTask);
    return;
  }

  createTask(room, {
    reference: taskReference,
    task: {
      action: 'tower',
      role: 'Hauler',
    },
    required: 1,
  });
};
