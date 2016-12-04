import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

export default class Upgrader extends BaseUnit {
  static minimumUnits = () => {
    const requested = (() => {
      if (Utilities.getTotalEnergyForSpawn() < 300) { return 0; }
      if (Utilities.getTotalEnergy() / Utilities.getEnergyCapacity() > 0.7 || Utilities.getTotalEnergy() > 10000) {
        return Math.ceil(Utilities.getTotalEnergy() / 100);
      }
      return 1;
    })();
    return Math.min(requested, 4);
  };
  static autospawnPriority = 1;

  run() {
    if (this.amIGoingToDie()) { return; }
    const creep = this.creep;
    if (creep.carry.energy == 0) {
      if (!creep.memory.target) {
        const targets = Utilities.findStorageWithExcess(creep.room.id, this.getCarryCapacity());
        const storage = targets.filter(s => s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE);
        creep.memory.target = creep.pos.findClosestByRange(storage.length ? storage : targets).id;
      }
      const closestTarget = Game.getObjectById(creep.memory.target);
      if (closestTarget) {
        this.withdrawEnergy(closestTarget);
        delete creep.memory.target;
        return true;
      }
    } else {
      if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
      }
      return true;
    }
    return false;
  }
};
