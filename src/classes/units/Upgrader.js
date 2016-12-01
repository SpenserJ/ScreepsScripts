import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

export default class Upgrader extends BaseUnit {
  static minimumUnits = () => {
    if (Utilities.getTotalEnergyForSpawn() < 300) { return 0; }
    if (Utilities.getTotalEnergy() / Utilities.getEnergyCapacity() > 0.7) {
      return 5;
    }
    return 1;
  };
  static autospawnPriority = 1;

  run() {
    if (super.run() === false) { return; }
    const creep = this.creep;
    if (creep.carry.energy == 0) {
      const targets = Utilities.findStorageWithExcess(creep.room.id, this.getCarryCapacity());
      const storage = targets.filter(s => s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE);
      const closestTarget = creep.pos.findClosestByRange(storage.length ? storage : targets);
      if (closestTarget) {
        this.withdrawEnergy(closestTarget);
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
