import BaseDefinition from './Base';
import { findStorageWithSpace, sortByRange, getStructures } from '../utilities';

const CreepDefinition = {
  ...BaseDefinition,

  name: 'Harvester',

  requiredUnits: room =>
    Object.values(room.sources).reduce((acc, next) => (acc + next.workSpots), 0),

  run: creep => {
    if (!creep.memory.sourceId) {
      // TODO: Rewrite to assign based on current assignments and max spots
      const sources = creep.room.memory.cache.sources;
      const sourceAssignments = creep.room
        .find(FIND_MY_CREEPS, {
          filter: creepFilter => (
            creepFilter.memory.role === CreepDefinition.name &&
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
      const rangeSort = sortByRange(creep);
      var targets = findStorageWithSpace(creep.room.name)
        .sort((a, b) => a.structureType === STRUCTURE_CONTAINER ? 1 : rangeSort(a, b));
      if(targets.length > 0) {
        creep.storeEnergy(Game.getObjectById(targets[0].id));
      }
    }
  }
};

export default CreepDefinition;
