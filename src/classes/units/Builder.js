import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

export default class Builder extends BaseUnit {
  static minimumUnits = () => {
    const requested = (() => {
      if (Utilities.getTotalEnergyForSpawn() < 300) { return 0; }
      const needRepair = Utilities.structuresNeedingRepair().length;
      if (needRepair > 0) { return  Math.ceil(needRepair / 2); }
      const needBuild = Utilities.findConstructionSites().length;
      if (needBuild > 0) { return Math.ceil(needBuild / 2); }
      return 0;
    })();
    return Math.min(requested, 4);
  };
  static autospawnPriority = 0;

  run() {
    if (super.run() === false) { return; }
    const creep = this.creep;
    if(creep.memory.building && creep.carry.energy == 0) {
      creep.memory.building = false;
    }
    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
      creep.memory.building = true;
    }

    if(creep.memory.building) {
      const needRepair = Utilities.structuresNeedingRepair().slice(0, 5);
      if (needRepair.length > 0) {
        const closest = creep.pos.findClosestByRange(needRepair);
        if(creep.repair(closest) == ERR_NOT_IN_RANGE) {
          creep.moveTo(closest);
        }
        return;
      }

      var targets = Utilities.findConstructionSites()
        .sort((a, b) => {
          return ((a.progress / a.progressTotal) > (b.progress / b.progressTotal))
            ? -1
            : 1;
        });
      if (targets.length === 0) { return false; }
      if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(targets[0]);
      }
    } else {
      const targets = Utilities.findStorageWithExcess(creep.room.id, this.getCarryCapacity())
        .sort((a, b) => (a.structureType == STRUCTURE_EXTENSION) ? -1 : 0);
      if (targets.length > 0) { this.withdrawEnergy(targets[0]); }
    }
  }
};
