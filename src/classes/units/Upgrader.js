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
    if(creep.carry.energy == 0) {
      var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
            structure.energy > 0;
        }
      }).sort((a, b) => {
        if (a.structureType == STRUCTURE_EXTENSION) { return -1; }
        return 0;
      });
      if(targets.length > 0) {
        this.withdrawEnergy(targets[0]);
      }
    } else {
      if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
      }
    }
  }
};
