const profilerEnabled = true;

console.log('Initialize');

// Set up the screeps profiler.
const profiler = require('screeps-profiler');
if (profilerEnabled) { profiler.enable(); }

import { log, logBatched } from './ScreepsCommander';
import { updateCache } from './cache/';
import { debounceByInterval, getStructures, uid } from './utilities';
import { report as reportStatistics } from './statistics';
import { initializeCoordinator } from './unitCoordinator';
import roomPlanner from './roomPlanner/';

// Helper scripts that I may want to use/modify/improve
import './potentialHelpers/roomStatus';
// End helpers

const Roles = {
  Harvester: require('./Units/Harvester').default,
  Upgrader: require('./Units/Upgrader').default,
  Builder: require('./Units/Builder').default,
}

const trueLoop = () => {
  updateCache();

  // Logic goes here

  let unitTypeToSpawn = {};
  Object.entries(Memory.rooms).forEach(([roomName, room]) => {
    const roomMem = room.cache;
    unitTypeToSpawn[roomName] = false;
    Object.entries(Roles).forEach(([name, definition]) => {
      if (unitTypeToSpawn[roomName] !== false) { return; }
      const needsSpawn = definition.requiredUnits(roomMem);
      // TODO: This should add spawnable units to a list, and sort by priority.
      if (needsSpawn > 0 && needsSpawn > (roomMem.roles[name] || []).length) {
        unitTypeToSpawn[roomName] = name;
      }
    });
  });

  Object.entries(unitTypeToSpawn).forEach(([roomName, spawnClass]) => {
    if (spawnClass === false) { return; }
    const spawns = getStructures(roomName, 'spawn');
    if (spawns.length === 0) { return; }

    const newName = Game.getObjectById(spawns[0].id).createCreep(
      //ClassType.decideCreepParts(ClassType),
      [WORK, CARRY, MOVE],
      uid(),
      { role: spawnClass, originalRole: spawnClass, originalRoom: roomName }
    );
    //const creepCost = calculateCreepCost(ClassType.decideCreepParts(ClassType))
    //appendToTickStat('energyUsage', creepCost);
    console.log(`Spawning new ${spawnClass} with ??? energy: ${newName}`);
  });

  initializeCoordinator();
  roomPlanner();

  // Remove old creeps.
  for (var name in Memory.creeps) {
    if(!Game.creeps[name]) {
      const creepMem = Memory.creeps[name];
      const roomMem = Memory.rooms[creepMem.originalRoom];
      // Remove any task assignments that the creeps had.
      if (roomMem) {
        if (creepMem.task && roomMem.coordinator[creepMem.task]) {
          roomMem.coordinator[creepMem.task].allocated--;
        }
      }
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name);
    }
  }

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
