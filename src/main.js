const profilerEnabled = true;

console.log('Initialize');

// Set up the screeps profiler.
const profiler = require('screeps-profiler');
if (profilerEnabled) { profiler.enable(); }

import { log, logBatched } from './ScreepsCommander';
import { updateCache } from './cache/';
import { debounceByInterval, getStructures, uid } from './utilities';
import { report as reportStatistics } from './statistics';

// Helper scripts that I may want to use/modify/improve
import './potentialHelpers/roomStatus';
// End helpers

const Roles = {
  Harvester: require('./Units/Harvester').default,
  Upgrader: require('./Units/Upgrader').default,
}

const trueLoop = () => {
  console.log('Script running loop');
  updateCache();

  // Logic goes here

  // Count the unit types in each room
  const unitsPerRoom = {};
  Object.entries(Memory.rooms).forEach(([roomName, room]) => {
    if (typeof unitsPerRoom[roomName] === 'undefined') {
      unitsPerRoom[roomName] = {};
    }
  });
  Object.values(Game.creeps).forEach(creep => {
    const roomUnits = unitsPerRoom[creep.pos.roomName];
    const role = creep.memory.role;
    roomUnits[role] = (roomUnits[role] + 1) || 1;
  });

  let unitTypeToSpawn = {};
  Object.entries(Memory.rooms).forEach(([roomName, room]) => {
    unitTypeToSpawn[roomName] = false;
    Object.entries(Roles).forEach(([name, definition]) => {
      if (unitTypeToSpawn[roomName] !== false) { return; }
      const needsSpawn = definition.requiredUnits(room);
      // TODO: This should compare to the current unit count.
      if (needsSpawn > 0 && needsSpawn > (unitsPerRoom[roomName][name] || 0)) {
        unitTypeToSpawn[roomName] = name;
      }
    });
  });
  console.log('Units to spawn', JSON.stringify(unitTypeToSpawn));

  Object.entries(unitTypeToSpawn).forEach(([roomName, spawnClass]) => {
    if (spawnClass === false) { return; }
    const spawns = getStructures(roomName, 'spawn');
    if (spawns.length === 0) { return; }

    var newName = Game.getObjectById(spawns[0].id).createCreep(
      //ClassType.decideCreepParts(ClassType),
      [WORK, CARRY, MOVE],
      uid(),
      { role: spawnClass, originalRole: spawnClass, originalRoom: roomName }
    );
    //const creepCost = calculateCreepCost(ClassType.decideCreepParts(ClassType))
    //appendToTickStat('energyUsage', creepCost);
    console.log(`Spawning new ${spawnClass} with ??? energy: ${newName}`);
  });

  Object.values(Game.creeps).forEach(creep => {
    Roles[creep.memory.role].run(creep);
  })

  debounceByInterval(() => {
    /*
    log('roles.usage', RoleUsage.unitsByRole);

    if (RoleUsage.requiredRoles.length > 0) {
      log('roles.required', RoleUsage.requiredRoles.reduce((acc, next) => {
        acc[next[0]] = next[1];
        return acc;
      }, {}));
    }
    if (RoleUsage.excessRoles.length > 0) {
      log('roles.excess', RoleUsage.excessRoles.reduce((acc, next) => {
        acc[next[0]] = next[1];
        return acc;
      }, {}));
    }
    if (RoleUsage.idleCreeps.length > 0) {
      log('roles.idle', RoleUsage.idleCreeps.reduce((acc, next) => {
        acc[next.memory.role] = (acc[next.memory.role] || 0) + 1;
        return acc;
      }, {}));
    }
    */

    reportStatistics();
  });

  logBatched();
}

export const loop = (!profilerEnabled)
  ? trueLoop
  : () => {
    profiler.wrap(trueLoop);
    if (Memory.profiler && Game.time === Memory.profiler.disableTick) {
      log('profiler', { lines: profiler.output() });
    }
  };
