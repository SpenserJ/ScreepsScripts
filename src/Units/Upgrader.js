import BaseDefinition from './Base';
import { findStorageWithExcess, sortByRange } from '../utilities';

const CreepDefinition = {
  ...BaseDefinition,

  name: 'Upgrader',

  requiredUnits: room => {
    return 1;
  },

  run: creep => {
    if (creep.carry.energy == 0) {
      if (!creep.memory.target) {
        const storage = findStorageWithExcess(creep.room, CARRY_CAPACITY * 5)
          .sort(sortByRange(creep));
        if (storage.length) {
          creep.memory.target = storage[0].id;
        } else {
          const targets = findStorageWithExcess(creep.room, CARRY_CAPACITY * 5, true)
            .sort(sortByRange(creep));
          creep.memory.target = targets[0].id;
        }
      }
      const closestTarget = Game.getObjectById(creep.memory.target);
      if (closestTarget) {
        creep.withdrawEnergy(closestTarget);
        delete creep.memory.target;
        return true;
      }
    } else {
      if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, { reusePath: 5 });
      }
      return true;
    }
  }
};

export default CreepDefinition;
