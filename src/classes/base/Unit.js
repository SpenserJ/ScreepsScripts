import _ from 'lodash';

import { calculateCreepCost } from '../../utilities';
import { appendToTickStat } from '../../statistics';

const findContainersNearSpawn = room => {
  const spawn = Object.values(Game.spawns)
    .filter(s => s.roomName = room.name)[0];
  return room
    .find(FIND_STRUCTURES, {
      filter: structure => (
        structure.structureType == STRUCTURE_CONTAINER &&
        _.sum(structure.store) < (structure.storeCapacity - 200) &&
        Math.abs(structure.pos.x - spawn.pos.x) <= 1 &&
        Math.abs(structure.pos.y - spawn.pos.y) <= 1
      ),
    });
}

export default class BaseUnit {
    static determineMinimumUnits = 0;
    static autospawnPriority = 0;

    static decideCreepParts = (ClassType) => {
      return [WORK, CARRY, MOVE];
    }

    static autospawn = (ClassType) => {
      var newName = Game.spawns['Spawn1'].createCreep(
        ClassType.decideCreepParts(ClassType),
        undefined,
        { role: ClassType.name, originalRole: ClassType.name }
      );
      const creepCost = calculateCreepCost(ClassType.decideCreepParts(ClassType))
      appendToTickStat('energyConsumption', creepCost);
      console.log(`Spawning new ${ClassType.name} with ${creepCost} energy: ${newName}`);
    }

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
        creep.moveTo(target);
      } else {
        // TODO: This doesn't account for almost-full containers
        appendToTickStat('energyGeneration', energy);
      }
    }

    withdrawEnergy(target) {
      const creep = this.creep;
      const energy = creep.carryCapacity - _.sum(Object.values(creep.carry));
      if (target.transferEnergy(creep) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      } else {
        // TODO: This doesn't account for almost-empty containers
        appendToTickStat('energyConsumption', energy);
      }
    }

    run() {
      const creep = this.creep;
      if (creep.ticksToLive < 350) {
        const containers = findContainersNearSpawn(creep.room);
        if (creep.ticksToLive % 5 === 0) {
          console.log(`${creep.name} (${this.constructor.name}) is going to die in ${creep.ticksToLive} ticks`);
        }
        if (containers.length !== 0) {
          if (!creep.memory.deathTarget) {
            creep.memory.deathTarget = containers[Math.floor(Math.random() * containers.length)].id;
              console.log('Select death target', creep.memory.deathTarget);
          }
          let deathTarget = Game.getObjectById(creep.memory.deathTarget);
          if (deathTarget.pos.roomName === creep.pos.roomName &&
              deathTarget.pos.x === creep.pos.x &&
              deathTarget.pos.y === creep.pos.y) {
            console.log(`Recycling ${creep.name} (${this.constructor.name})`)
            Game.spawns['Spawn1'].recycleCreep(creep);
          } else {
            const atDeathTarget = creep.room.lookAt(deathTarget.pos.x, deathTarget.pos.y)
              .filter(el => el.type === 'creep');
            if (atDeathTarget.length > 0) {
              creep.memory.deathTarget = containers[Math.floor(Math.random() * containers.length)].id;
              console.log('Redirect to new death target', creep.memory.deathTarget, Math.floor(Math.random() * containers.length));
            } else {
              creep.moveTo(deathTarget);
            }
          }
          return false;
        }
      }
    }
}
