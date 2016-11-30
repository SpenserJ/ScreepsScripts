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
    if (Object.values(Game.creeps).length < 3) {
      return [WORK, CARRY, MOVE];
    }
    return [WORK, WORK, WORK, CARRY, MOVE, MOVE];
  }

  run() {
    if (super.run() === false) { return; }
    const creep = this.creep;

    // Determine which source to use
    if (!creep.memory.sourceId) {
      const sources = creep.room.find(FIND_SOURCES)
        .reduce((acc, next) => {
          acc[next.id] = next;
          return acc;
        }, {});
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

    if(creep.carry.energy < creep.carryCapacity) {
      var source = Game.getObjectById(creep.memory.sourceId);
      if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      }
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
