import * as Utilities from './utilities';
import * as Statistics from './statistics';
import { getRoleUsage } from './roleManagement';

const Roles = {
  Harvester: require('../src/classes/units/Harvester').default,
  Builder: require('../src/classes/units/Builder').default,
  Upgrader: require('../src/classes/units/Upgrader').default,
  Hauler: require('../src/classes/units/Hauler').default,
}

const Structures = {
  Tower: require('../src/classes/structures/Tower').default,
};

// Remove old creeps.
for (var name in Memory.creeps) {
  if(!Game.creeps[name]) {
    delete Memory.creeps[name];
    console.log('Clearing non-existing creep memory:', name);
  }
}

let RoleUsage = getRoleUsage();

// Reassign builders and upgraders
const reassignableRoles = RoleUsage.excessRoles.filter(r => r[0].canReassign);
if (reassignableRoles.length > 0 && RoleUsage.requiredRoles.length > 0) {
  const { requiredRoles } = RoleUsage;
  const extra = Object.values(Game.creeps)
    .filter(creep => creep.memory.role === reassignableRoles[0][0])
    .sort(creep => creep.memory.originalRole === requiredRoles[0][0] ? -1 : 0)
    [0];
  if (extra) {
    console.log(`Reassigning ${extra.name} (${extra.memory.role}) to ${requiredRoles[0][0]}`);
    extra.memory.role = requiredRoles[0][0];
    RoleUsage = getRoleUsage();
  }
} else if (RoleUsage.requiredRoles.length > 0) {
  /*const extra = Object.values(Game.creeps)
    .filter(creep => creep.memory.role === leastEssential[0][0])
    .filter(creep => creep.memory.role !== requiredRoles[0][0])
    .sort(creep => creep.memory.originalRole === requiredRoles[0][0] ? -1 : 0)
    [0];
  if (extra) {
    console.log(`Reassigning ${extra.name} (${extra.memory.role}) to ${requiredRoles[0][0]} due to least essential`);
    extra.memory.role = requiredRoles[0][0];
  }*/
}

const creeps = Object.values(Game.creeps).map(creep => {
  if (typeof Roles[creep.memory.role] === 'undefined') { return null; }
  return new Roles[creep.memory.role](creep);
}).filter(creep => creep !== null);


creeps.forEach(creep => {
  const creepMemory = creep.creep.memory;
  if (creep.run() === false) {
    creepMemory.idleTicks = (creepMemory.idleTicks || 0) + 1;
  } else {
    creepMemory.idleTicks = (creepMemory.idleTicks - 1) || 0;
  }
});

if (Game.spawns['Spawn1'].spawning === null && Object.keys(reassignableRoles).length === 0) {
  const { unitsByRole } = RoleUsage;
  const needsAutospawn = Object.entries(Roles)
    .filter(role => {
      const currentUnits = unitsByRole[role[0]];
      const minimumUnits = (typeof role[1].minimumUnits === 'function')
        ? role[1].minimumUnits()
        : role[1].minimumUnits;
      return minimumUnits > (unitsByRole[role[0]] || 0);
    })
    .sort((a, b) => {
      const priorityA = (typeof a.autospawnPriority === 'function') ? a.autospawnPriority() : a.autospawnPriority;
      const priorityB = (typeof b.autospawnPriority === 'function') ? b.autospawnPriority() : b.autospawnPriority;
      return priorityB - priorityA;
    });
  if (needsAutospawn.length > 0) {
    const creepCost = Utilities.calculateCreepCost(needsAutospawn[0][1].decideCreepParts(needsAutospawn[0][1]));
    const currentEnergy = Utilities.getTotalEnergy();
    if (creepCost > currentEnergy) {
      Utilities.debounceByInterval(() => {
        console.log(`Waiting to spawn ${needsAutospawn[0][1].name}: ${currentEnergy}/${creepCost} energy`);
      });
    } else {
      needsAutospawn[0][1].autospawn(needsAutospawn[0][1]);
    }
  }
}

Object.values(Game.structures).forEach(structure => {
  if (structure.structureType === STRUCTURE_TOWER) {
    new Structures.Tower(structure).run();
  }
});

Statistics.track();

Utilities.debounceByInterval(() => {
  console.log("\n\n");
  console.log('Unit totals:',
    Object.entries(RoleUsage.unitsByRole)
      .sort((a, b) => b[1] - a[1])
      .map(r => `${r[0]}=${r[1]}`)
      .join(', '));
  if (RoleUsage.requiredRoles.length > 0) {
    console.log('Required units:',
    RoleUsage.requiredRoles
      .sort((a, b) => b[1] - a[1])
      .map(r => `${r[0]}=${r[1] - (RoleUsage.unitsByRole[r[0]] || 0)}`)
      .join(', '));
  }
  if (RoleUsage.excessRoles.length > 0) {
    console.log('Excess units:',
      RoleUsage.excessRoles
        .sort((a, b) => b[1] - a[1])
        .map(r => `${r[0]}=${r[1]}`)
        .join(', '));
  }
  if (RoleUsage.idleCreeps.length > 0) {
    console.log('Idle creeps:',RoleUsage.idleCreeps.length,
      Object.entries(RoleUsage.idleCreeps.reduce((acc, next) => {
        acc[next.memory.role] = (acc[next.memory.role] || 0) + 1;
        return acc;
      }, {}))
      .sort((a, b) => b[1] - a[1])
      .map(r => `${r[0]}=${r[1]}`)
      .join(', '));
  }
  Statistics.report();
});
