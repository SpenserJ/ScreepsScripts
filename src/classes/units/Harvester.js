import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

export default class Harvester extends BaseUnit {
  static minimumUnits = () => {
    const energyPercent = 1 - (Utilities.getTotalEnergy() / Utilities.getEnergyCapacity()) + .01;
    return 5;
    return Math.ceil(5 * energyPercent);
  };
  static autospawnPriority = 100;

  static decideCreepParts = (ClassType) => {
    if (Object.values(Game.creeps).length > 3) {
      return [WORK, CARRY, MOVE];
    }
    return [WORK, WORK, WORK, CARRY, MOVE, MOVE];
  }

  run() {
    if (super.run() === false) { return; }
    const creep = this.creep;
    if(creep.carry.energy < creep.carryCapacity) {
      var sources = creep.room.find(FIND_SOURCES);
      if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[0]);
      }
    }
    else {
      var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType === STRUCTURE_CONTAINER) &&
            structure.energy < structure.energyCapacity;
        }
      }).sort(a => a.structureType === STRUCTURE_CONTAINER ? 1 : 0);
      if(targets.length > 0) {
        const closest = creep.pos.findClosestByRange(targets);
        this.storeEnergy(closest);
      }
    }
  }
};
