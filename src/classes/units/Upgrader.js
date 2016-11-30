import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

export default class Upgrader extends BaseUnit {
  static minimumUnits = () => {
    if (Utilities.getTotalEnergy() / Utilities.getEnergyCapacity() > 0.8) { return 2; }
    return 1;
  };
  static autospawnPriority = 1;

  run() {
    const creep = this.creep;
    if (creep.carry.energy == 0) {
      const targets = Utilities.findStorageWithExcess(creep.room.id, this.getCarryCapacity())
        .sort((a, b) =>  (a.structureType == STRUCTURE_EXTENSION) ? -1 : 0);
      if (targets.length > 0) { this.withdrawEnergy(targets[0]); }
    } else {
      if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
      }
    }
  }
};
