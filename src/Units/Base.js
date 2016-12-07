import { sum } from '../utilities';

const CreepDefinition = {
  name: 'BaseUnit',

  requiredUnits: room => {
    return 0;
  },

  run: creep => {
    console.log('Running for creep!');
  }
};

export default CreepDefinition;

Creep.prototype.storeEnergy = function storeEnergy(target) {
  const creep = this;
  const energy = creep.carry[RESOURCE_ENERGY];
  if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
    creep.moveTo(target, { reusePath: 5 });
  } else {
    // TODO: This doesn't account for almost-full containers
    //appendToTickStat('energyUsage', energy);
    console.log(target);
    if (target) {
      creep.room.memory.cache.structuresNeedingRecheck.push(target.id);
    } else {
      console.log('Missing target for storeEnergy');
    }
  }
};

Creep.prototype.withdrawEnergy = function withdrawEnergy(targetCache) {
  const creep = this;
  const energy = creep.carryCapacity - sum(Object.values(creep.carry));
  const target = Game.getObjectById(targetCache.id);
  const moveCloser = target.transferEnergy
    ? target.transferEnergy(creep)
    : creep.withdraw(target, RESOURCE_ENERGY);
  if (moveCloser == ERR_NOT_IN_RANGE) {
    creep.moveTo(target, { reusePath: 5 });
  } else {
    // TODO: This doesn't account for almost-empty containers
    //appendToTickStat('energyUsage', -energy);
    if (target) {
      creep.room.memory.cache.structuresNeedingRecheck.push(target.id);
    } else {
      console.log('Missing target for storeEnergy');
    }
  }
};

Creep.prototype.changeRole = function changeRole(newRole) {
  const creep = this;
  const creepMem = creep.memory;
  const roomMem = Memory.rooms[creepMem.originalRoom].cache;
  // Remove the creep from the old room role.
  roomMem.roles[creepMem.role] = roomMem.roles[creepMem.role].filter(id => !creep.id);
  // Set the creep's new role.
  creepMem.role = newRole;
  roomMem.roles[newRole].push(creep.id);
};
