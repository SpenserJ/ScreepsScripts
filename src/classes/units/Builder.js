import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

export default class Builder extends BaseUnit {
  static minimumUnits = () => {
    const needRepair = Utilities.structuresNeedingRepair().length;
    if (needRepair > 0) { return needRepair; }
    const needBuild = Utilities.findConstructionSites().length;
    return (needBuild > 0) ? Math.ceil(needBuild / 2) : 0;
  };
  static autospawnPriority = 0;

  run() {
    const creep = this.creep;
    if(creep.memory.building && creep.carry.energy == 0) {
      creep.memory.building = false;
    }
    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
      creep.memory.building = true;
    }

    if(creep.memory.building) {
      const needRepair = Utilities.structuresNeedingRepair();
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
      if (targets.length) {
        if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0]);
        }
      }
    } else {
      const targets = Utilities.findStorageWithExcess(creep.room.id, this.getCarryCapacity())
        .sort((a, b) => (a.structureType == STRUCTURE_EXTENSION) ? -1 : 0);
      if (targets.length > 0) { this.withdrawEnergy(targets[0]); }
    }
  }
};
