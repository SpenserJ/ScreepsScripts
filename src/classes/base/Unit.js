import _ from 'lodash';

import { calculateCreepCost, findStorageWithSpace, getSpawn, getStructures, getRoomStructureById, getRoomMemory } from '../../utilities';
import { appendToTickStat } from '../../statistics';

// TODO: Make this handle diagonally adjacent containers
const findContainersNearSpawn = roomRaw => {
  const room = getRoomMemory(roomRaw);
  return Object.values(getStructures(roomRaw, STRUCTURE_SPAWN))
    .reduce((acc, next) => acc.concat(next.nearbyContainers.map(id => getRoomStructureById(room, id))), [])
    .filter(structure => _.sum(structure.store) < (structure.storeCapacity - 200));
}

export default class BaseUnit {
  static determineMinimumUnits = 0;
  static autospawnPriority = 0;

  static decideCreepParts = (ClassType) => {
    return [WORK, CARRY, MOVE];
  }

  static autospawn = (ClassType) => {
    var newName = getSpawn().createCreep(
      ClassType.decideCreepParts(ClassType),
      undefined,
      { role: ClassType.name, originalRole: ClassType.name }
    );
    const creepCost = calculateCreepCost(ClassType.decideCreepParts(ClassType))
    appendToTickStat('energyUsage', creepCost);
    console.log(`Spawning new ${ClassType.name} with ${creepCost} energy: ${newName}`);
  }

  static canReassign = true;

  constructor(creep) {
    this.creep = creep;
  }

  getCarryCapacity() {
    return this.creep.body.filter(part => part.type === CARRY).length * CARRY_CAPACITY;
  }

  storeEnergy(target) {
    const creep = this.creep;
    const energy = creep.carry[RESOURCE_ENERGY];
    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { reusePath: 5 });
    } else {
      // TODO: This doesn't account for almost-full containers
      appendToTickStat('energyUsage', energy);
      if (target) {
        creep.room.memory.cache.structuresNeedingRecheck.push(target.id);
      } else {
        console.log('Missing target for storeEnergy');
      }
    }
  }

  withdrawEnergy(targetCache) {
    const creep = this.creep;
    const energy = creep.carryCapacity - _.sum(Object.values(creep.carry));
    const target = Game.getObjectById(targetCache.id);
    const moveCloser = target.transferEnergy
      ? target.transferEnergy(creep)
      : creep.withdraw(target, RESOURCE_ENERGY);
    if (moveCloser == ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { reusePath: 5 });
    } else {
      // TODO: This doesn't account for almost-empty containers
      appendToTickStat('energyUsage', -energy);
      if (target) {
        creep.room.memory.cache.structuresNeedingRecheck.push(target.id);
      } else {
        console.log('Missing target for storeEnergy');
      }
    }
  }

  amIGoingToDie() {
    return this.creep.ticksToLive < 350;
  }

  goDie() {
    const creep = this.creep;
    if (!this.amIGoingToDie() && creep.memory.idleTicks < 25) { return; }

    const containers = findContainersNearSpawn(creep.room);
    if (containers.length === 0) {
      if (creep.carry[RESOURCE_ENERGY] !== 0) {
        this.storeEnergy(creep.pos.findClosestByRange(findStorageWithSpace(creep.room.id)));
        return false;
      }
      return;
    }
    if (creep.ticksToLive % 5 === 0) {
      console.log(`${creep.name} (${this.constructor.name}) is going to die in ${creep.ticksToLive} ticks`);
    }

    if (!creep.memory.deathTarget) {
      creep.memory.deathTarget = containers[Math.floor(Math.random() * containers.length)].id;
    }
    let deathTarget = Game.getObjectById(creep.memory.deathTarget);

    // If the target is null, it has been destroyed since we selected it.
    if (deathTarget === null) {
      creep.memory.deathTarget = containers[Math.floor(Math.random() * containers.length)].id;
      return false;
    }

    if (deathTarget.pos.roomName === creep.pos.roomName &&
        deathTarget.pos.x === creep.pos.x &&
        deathTarget.pos.y === creep.pos.y) {
      // TODO: This should deposit all resources!
      if (creep.carry[RESOURCE_ENERGY] > 0) {
        this.storeEnergy(deathTarget);
      } else {
        console.log(`Recycling ${creep.name} (${this.constructor.name})`)
        getSpawn().recycleCreep(creep);
      }
    } else {
      const atDeathTarget = creep.room.lookAt(deathTarget.pos.x, deathTarget.pos.y)
        .filter(el => el.type === 'creep');
      if (atDeathTarget.length > 0) {
        creep.memory.deathTarget = containers[Math.floor(Math.random() * containers.length)].id;
      } else {
        creep.moveTo(deathTarget, { reusePath: 5 });
      }
    }
    return false;
  }
}
