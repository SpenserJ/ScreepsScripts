import _ from 'lodash';

import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

const getEnergyContainers = () => Utilities.findStructures()
  .filter(structure => (
    (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) &&
    structure.store[RESOURCE_ENERGY] > 50
  ));

const getStorageNearSources = (room) => {
  return Object.values(room.memory.cache.sources)
    .reduce((acc, next) => acc.concat(next.nearbyContainers), [])
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .map(id => room.memory.cache.structures[id])
    .filter(structure => structure.store[RESOURCE_ENERGY] > 50)
    .sort((a, b) => (b.store && b.store[RESOURCE_ENERGY] || 0) - (a.store && a.store[RESOURCE_ENERGY] || 0));
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
    const haulersNeeded = getStorageNearSources(Utilities.getRoom())
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

  static canReassign = false;

  run() {
    if (this.amIGoingToDie()) { return; }
    const creep = this.creep;

    const spawnStorage = Utilities
      .getStructures(creep.room, [STRUCTURE_EXTENSION, STRUCTURE_SPAWN])
      .filter(s => s.energy < s.energyCapacity)
      .sort((a, b) => creep.pos.getRangeTo(a.pos.x, a.pos.y) - creep.pos.getRangeTo(b.pos.x, b.pos.y));

    const towers = Utilities
      .getStructures(creep.room, STRUCTURE_TOWER)
      .filter(tower => tower.energy < tower.energyCapacity)
      .sort((a, b) => creep.pos.getRangeTo(a.pos.x, a.pos.y) - creep.pos.getRangeTo(b.pos.x, b.pos.y));

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
        this.storeEnergy(Game.getObjectById(spawnStorage[0].id));
      } else {
        if (containers.length === 0) { return false; }
        this.withdrawEnergy(creep.pos.findClosestByRange(containers));
      }

      return true;
    } else if (creep.memory.task === 'restockTower') {
      if (creep.carry[RESOURCE_ENERGY] > 0) {
        this.storeEnergy(Game.getObjectById(towers[0].id));
      } else {
        if (containers.length === 0) { return false; }
        this.withdrawEnergy(creep.pos.findClosestByRange(containers));
      }

      return true;
    } else {
      const storageWithSpace = Utilities.findStorageWithSpace();
      const trueStorage = Utilities.getSpawn().pos.findClosestByRange(
        storageWithSpace.filter(s => s.structureType === STRUCTURE_STORAGE));
      const target = trueStorage ? trueStorage : Utilities.getSpawn().pos.findClosestByRange(storageWithSpace)
      if (creep.carry[RESOURCE_ENERGY] > 0) {
        this.storeEnergy(target);
        return true;
      } else {
        const containersToEmpty = getStorageNearSources(creep.room).filter(c => c !== target);
        if (containersToEmpty.length === 0) { return false; }
        this.withdrawEnergy(containersToEmpty[0]);
        return true;
      }
    }
    return false;
  }
};
