import _ from 'lodash';

import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

const getEnergyContainers = () => Utilities.findStructures()
  .filter(structure => (
    structure.structureType === STRUCTURE_CONTAINER &&
    structure.store[RESOURCE_ENERGY] > 50
  ));

const getStorageNearSources = (room) => {
  const sources = room.find(FIND_SOURCES);
  const containers = getEnergyContainers();
  if (containers.length === 0) { return []; }
  const containersToEmpty = sources
    .map(source => source.pos.findClosestByRange(containers))
    .sort((a, b) => (b.energy || (b.store && b.store[RESOURCE_ENERGY] || 0)) - (a.energy || (a.store && a.store[RESOURCE_ENERGY] || 0)));
  // Return deduped.
  return containersToEmpty
    .filter((container, i) => containersToEmpty.indexOf(container) === i);
}

export default class Hauler extends BaseUnit {
  static minimumUnits = () => {
    const usableEnergy = Utilities.findNonSpawnStorage()
      .filter(s => s.store[RESOURCE_ENERGY] > 0)
      .reduce((acc, next) => (acc + next.store[RESOURCE_ENERGY]), 0);
    // Get spawn refills
    const spawnRefills = Utilities.findSpawnStorage()
      .filter(s => s.energy < s.energyCapacity).length;

    // Get tower refills
    const towersNeedingFill = Utilities.findTowers()
      .filter(tower => tower.energy < tower.energyCapacity).length;

    // Get haulers that are needed.
    const haulersNeeded = getStorageNearSources(Game.rooms.W7N3)
      .map(s => Math.ceil(s.store[RESOURCE_ENERGY] * 2 / s.storeCapacity))
      .reduce((acc, next) => (acc + next), 0);

    return Math.min((spawnRefills + towersNeedingFill + haulersNeeded), 4, Math.floor(usableEnergy / CARRY_CAPACITY));
  };
  static autospawnPriority = 10;

  static decideCreepParts = (ClassType) => {
    const optimal = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
    if (Utilities.getTotalEnergyForSpawn() >= Utilities.calculateCreepCost(optimal)) {
      return optimal;
    }
    return [CARRY, CARRY, MOVE];
  }

  run() {
    if (super.run() === false) { return; }
    const creep = this.creep;

    var spawnStorage = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
          structure.energy < structure.energyCapacity;
      }
    });

    const towers = Utilities.findTowers(creep.room.id)
      .filter(tower => tower.energy < tower.energyCapacity);

    const containers = getEnergyContainers();

    if (spawnStorage.length !== 0) {
      creep.memory.task = 'restockSpawn';
    } else if (towers.length !== 0) {
      creep.memory.task = 'restockTower';
    } else {
      creep.memory.task = 'haul';
    }

    if (creep.memory.task === 'restockSpawn') {
      if (creep.carry[RESOURCE_ENERGY] > 0) {
        const closest = creep.pos.findClosestByRange(spawnStorage);
        if(creep.transfer(closest, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(closest);
        }
        return true;
      } else {
        if (containers.length === 0) { return false; }
        const closest = creep.pos.findClosestByRange(containers);
        if(creep.withdraw(closest, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(closest);
        }
      }

      const towers = Utilities.findTowers(creep.room.id)
        .filter(tower => tower.energy < tower.energyCapacity);

      if (towers.length) {
        const closest = creep.pos.findClosestByRange(towers);
        if(creep.transfer(closest, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(closest);
        }
        return true;
      }

      return false;
    } else {
      if (creep.carry[RESOURCE_ENERGY] > 0) {
        const storageWithSpace = Game.spawns['Spawn1'].pos.findClosestByRange(Utilities.findStorageWithSpace());
        this.storeEnergy(storageWithSpace);
        return true;
      } else {
        const containersToEmpty = getStorageNearSources(creep.room);
        console.log(containersToEmpty);
        if (containersToEmpty.length === 0) { return false; }
        this.withdrawEnergy(containersToEmpty[0]);
        return true;
      }
    }
    return false;
  }
};