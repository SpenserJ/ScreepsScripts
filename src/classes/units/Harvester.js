import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

const unitCalculation = (minUnits, maxUnits, x) => {
  const removeUnitsRaw = (-(maxUnits * 2) / (1 + Math.pow(Math.E, -2 * x))) + maxUnits;
  const removeUnits = Math.max(removeUnitsRaw, -(maxUnits - minUnits));
  return Math.ceil(maxUnits + removeUnits);
};

export default class Harvester extends BaseUnit {
  static minimumUnits = () => {
    const energyPercent = Utilities.getTotalEnergy() / Utilities.getEnergyCapacity();
    return unitCalculation(2, 5, energyPercent);
  };
  static autospawnPriority = 100;

  static decideCreepParts = (ClassType) => {
    const optimal = [WORK, WORK, WORK, CARRY, MOVE];
    if (Utilities.getTotalEnergyForSpawn() >= Utilities.calculateCreepCost(optimal)) {
      return optimal;
    }
    return [WORK, CARRY, MOVE];
  }

  run() {
    if (this.amIGoingToDie()) { return; }
    const creep = this.creep;

    // Determine which source to use
    if (!creep.memory.sourceId) {
      // TODO: Rewrite this to scan cached sources instead.
      const sources = creep.room.find(FIND_SOURCES)
        .reduce((acc, next) => { acc[next.id] = next; return acc; }, {});
      const sourceAssignments = creep.room
        .find(FIND_MY_CREEPS, {
          filter: creepFilter => (
            creepFilter.memory.role === this.constructor.name &&
            !!creepFilter.memory.sourceId
          ),
        })
        .reduce((acc, next) => {
          acc[next.memory.sourceId]++
          return acc;
        }, Object.keys(sources).reduce((acc, next) => { acc[next] = 0; return acc; }, {}));
      creep.memory.sourceId = Object.entries(sourceAssignments)
        .sort(([, countA], [, countB]) => countA - countB)[0][0];
    }

    if (creep.memory.task !== 'deposit' && creep.carry.energy === creep.carryCapacity) {
      creep.memory.task = 'deposit';
    } else if (creep.carry.energy === 0) {
      creep.memory.task = 'harvest';
    }

    if (creep.memory.task === 'harvest') {
      var source = Game.getObjectById(creep.memory.sourceId);
      const result = creep.harvest(source);
      if (result === ERR_NOT_IN_RANGE) { creep.moveTo(source, { reusePath: 5 }); }
      else if (result === ERR_NOT_ENOUGH_RESOURCES) { creep.memory.task = 'deposit'; }
    }
    else {
      var targets = Utilities.findStorageWithSpace(creep.room.id)
        .sort(a => a.structureType === STRUCTURE_CONTAINER ? 1 : 0);
      if(targets.length > 0) {
        const closest = creep.pos.findClosestByRange(targets);
        this.storeEnergy(closest);
      }
    }
  }
};
