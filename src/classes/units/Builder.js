import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

const findConstructionSites = room => {
  return Object.values(room.constructionSites);
}

export default class Builder extends BaseUnit {
  static minimumUnits = () => {
    const requested = (() => {
      if (Utilities.getTotalEnergyForSpawn() < 300) { return 0; }
      const needRepair = Object.keys(Memory.rooms)
        .filter(room => Utilities.getStructures(room, STRUCTURE_TOWER).length === 0)
        .reduce((acc, next) => (acc + Utilities.structuresNeedingRepair(room)), 0);
      if (needRepair > 0) { return  Math.ceil(needRepair / 2); }
      const needBuild = Object.values(Memory.rooms)
        .reduce((acc, next) => (acc + findConstructionSites(next.cache).length), 0);
      if (needBuild > 0) { return needBuild * 2; }
      return 0;
    })();
    return Math.min(requested, 4);
  };
  static autospawnPriority = 0;

  run() {
    if (this.amIGoingToDie()) { return; }
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
          creep.moveTo(closest, { reusePath: 5 });
        }
        return true;
      }

      var targets = findConstructionSites(creep.room.memory.cache)
        .sort((a, b) => ((a.progress / a.progressTotal) > (b.progress / b.progressTotal)) ? -1 : 1);
      if (targets.length === 0) { return false; }
      if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(targets[0], { reusePath: 5 });
      }
      return true;
    } else {
      const targets = Utilities.findStorageWithExcess(creep.room, this.getCarryCapacity());
      // TODO: This doesn't pull from spawn properly when starting a new game
      const storage = targets.filter(s => s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE);
      const closestTarget = creep.pos.findClosestByRange(storage.length ? storage : targets);
      if (closestTarget) {
        this.withdrawEnergy(closestTarget);
        return true;
      }
    }

    return false;
  }
};
