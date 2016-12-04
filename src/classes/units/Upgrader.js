import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

export default class Upgrader extends BaseUnit {
  static minimumUnits = () => {
    const requested = (() => {
      if (Utilities.getTotalEnergyForSpawn() < 300) { return 0; }
      if (Utilities.getTotalEnergy() / Utilities.getEnergyCapacity() > 0.7 || Utilities.getTotalEnergy() > 10000) {
        return Math.ceil(Utilities.getTotalEnergy() / 1000);
      }
      return 1;
    })();
    return Math.min(requested, 6);
  };
  static autospawnPriority = 1;

  static decideCreepParts = (ClassType) => {
    const optimal = [WORK, WORK, WORK, CARRY, CARRY, MOVE];
    if (Utilities.getTotalEnergyForSpawn() >= Utilities.calculateCreepCost(optimal)) {
      return optimal;
    }
    return [WORK, CARRY, MOVE];
  }

  run() {
    if (this.amIGoingToDie()) { return; }
    const creep = this.creep;
    if (creep.carry.energy == 0) {
      if (!creep.memory.target) {
        const storage = Utilities
          .findStorageWithExcess(creep.room, this.getCarryCapacity())
          .sort(Utilities.sortByRange(creep));
        if (storage.length) {
          creep.memory.target = storage[0].id;
        } else {
          const targets = Utilities
            .findStorageWithExcess(creep.room, this.getCarryCapacity(), true)
            .sort(Utilities.sortByRange(creep));
          creep.memory.target = targets[0].id;
        }
      }
      const closestTarget = Game.getObjectById(creep.memory.target);
      if (closestTarget) {
        this.withdrawEnergy(closestTarget);
        delete creep.memory.target;
        return true;
      }
    } else {
      if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, { reusePath: 5 });
      }
      return true;
    }
    return false;
  }
};
