import BaseDefinition from './Base';
import { findStorageWithSpace, sortByRange } from '../utilities';
import { getTask, countRequiredCreepsForTasks } from '../unitCoordinator';

const CreepDefinition = {
  ...BaseDefinition,

  name: 'Hauler',

  requiredUnits: room => {
    const stillNeeded = countRequiredCreepsForTasks(room, 'haul');
    return Math.min(4, (stillNeeded + (room.roles[CreepDefinition.name] || []).length));
  },

  run: creep => {
    let task = creep.memory.task && creep.room.memory.coordinator[creep.memory.task];
    if (!task) {
      if (getTask(creep) === false) { return; }
      task = creep.room.memory.coordinator[creep.memory.task];
    }

    if (task.task.action === 'haul') {
      return CreepDefinition.runHaulFromSources(creep);
    }
    console.log('Do what now?');
    return;

    if (creep.memory.building) {
      const target = Game.getObjectById(task.task.id);
      if (!target) {
        // Construction must be complete.
        delete creep.memory.task;
        return;
      }
      if (creep.build(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { reusePath: 5 });
      }
      return true;
    } else {
      const targets = findStorageWithExcess(creep.room, creep.getCarryCapacity() * 5, true)
        .sort(sortByRange(creep));
      if (targets.length === 0) { console.log('No storage to pull from'); return; }

      creep.withdrawEnergy(Game.getObjectById(targets[0].id));
    }
  },

  runHaulFromSources: creep => {
    const creepMem = creep.memory;
    const task = creep.room.memory.coordinator[creepMem.task];

    if (creep.carry[RESOURCE_ENERGY] === creep.getCarryCapacity() && creepMem.action === 'pickup') {
      creepMem.action = 'deposit';
    } else if (creep.carry[RESOURCE_ENERGY] === 0) {
      creepMem.action = 'pickup';
    }

    if (creepMem.action === 'deposit') {
      // Move back to base
      const spawnStorage = findStorageWithSpace(creep.room, [STRUCTURE_EXTENSION, STRUCTURE_SPAWN])
        .sort(sortByRange(creep));
      if (spawnStorage.length !== 0) {
        creep.storeEnergy(Game.getObjectById(spawnStorage[0].id));
        return;
      }

      const storage = findStorageWithSpace(creep.room)
        .filter(s => s.id !== task.task.id)
        .sort(sortByRange(creep));
      if (storage.length === 0) {
        console.log('Nowhere to store these resources');
        return;
      }
      creep.storeEnergy(Game.getObjectById(storage[0].id));
    } else {
      // Go pick up a load
      creep.withdrawEnergy(Game.getObjectById(task.task.id));
    }
  },
};

export default CreepDefinition;

/*
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

const getSpawnStorage = room => Utilities
  .getStructures(room, [STRUCTURE_EXTENSION, STRUCTURE_SPAWN])
  .filter(s => s.energy < s.energyCapacity);

const getTowersNeedingFill = room => Utilities.getStructures(room, STRUCTURE_TOWER)
  .filter(tower => tower.energy < tower.energyCapacity);

export default class Hauler extends BaseUnit {
  static minimumUnits = () => {
    const usableEnergy = Object.keys(Memory.rooms)
      .reduce((acc, next) => (acc + Utilities.findStorageWithExcess(next, CARRY_CAPACITY).length), 0);

    // Get spawn refills
    const spawnRefills = Object.keys(Memory.rooms)
      .reduce((acc, next) => (acc + getSpawnStorage(next).length), 0);

    // Get tower refills
    const towersNeedingFill = Object.keys(Memory.rooms)
      .reduce((acc, next) => (acc + getTowersNeedingFill(next).length), 0);

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

    const spawnStorage = getSpawnStorage(creep.room)
      .sort((a, b) => creep.pos.getRangeTo(a.pos.x, a.pos.y) - creep.pos.getRangeTo(b.pos.x, b.pos.y));

    const towers = getTowersNeedingFill(creep.room)
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
*/
