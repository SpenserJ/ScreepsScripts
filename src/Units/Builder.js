import BaseDefinition from './Base';
import { findStorageWithExcess, sortByRange } from '../utilities';
import { getTask, countRequiredCreepsForTasks } from '../unitCoordinator';

const CreepDefinition = {
  ...BaseDefinition,

  name: 'Builder',

  requiredUnits: room => {
    // TODO: Improve this logic
    // This isn't perfect, as it will only return how many more are required.
    // When a creep dies, this number will go up until we've spawned another creep.
    return Math.min(4, countRequiredCreepsForTasks(room, 'build'));
  },

  run: creep => {
    let task = creep.memory.task && creep.room.memory.coordinator[creep.memory.task];
    if (!task) {
      if (getTask(creep) === false) { return; }
      task = creep.room.memory.coordinator[creep.memory.task];
    }

    if(creep.memory.building && creep.carry.energy == 0) {
      creep.memory.building = false;
    }
    if(!creep.memory.building && creep.carry.energy == creep.getCarryCapacity()) {
      creep.memory.building = true;
    }

    if (creep.memory.building) {
      const target = Game.getObjectById(task.task.id);
      if (!target) {
        // Construction must be complete.
        delete creep.memory.task;
        return;
      }
      if (creep.build(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { reusePath: 5 });
      }
      return true;
    } else {
      const targets = findStorageWithExcess(creep.room, creep.getCarryCapacity() * 5, true)
        .sort(sortByRange(creep));
      if (targets.length === 0) { console.log('No storage to pull from'); return; }

      creep.withdrawEnergy(Game.getObjectById(targets[0].id));
    }
  }
};

export default CreepDefinition;
