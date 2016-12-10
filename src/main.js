const profilerEnabled = true;

console.log('Initialize');

// Set up the screeps profiler.
const profiler = require('screeps-profiler');
if (profilerEnabled) { profiler.enable(); }

import { log, logBatched } from './ScreepsCommander';
import { updateCache } from './cache/';
import { debounceByInterval, getStructures, uid, calculateCreepCost } from './utilities';
import { report as reportStatistics, appendToTickStat } from './statistics';
import { initializeCoordinator } from './unitCoordinator';
import roomPlanner from './roomPlanner/';
import { runHook } from './hooks';

// Helper scripts that I may want to use/modify/improve
import './potentialHelpers/roomStatus';
// End helpers

const Roles = {
  Harvester: require('./Units/Harvester').default,
  Upgrader: require('./Units/Upgrader').default,
  Builder: require('./Units/Builder').default,
  Hauler: require('./Units/Hauler').default,
};

const Structures = {
  Tower: require('./Structures/Tower').default,
};

runHook('script.initialize');

const trueLoop = () => {
  runHook('cache.before');
  updateCache();
  runHook('cache.after');

  // TODO: Disable this once I trust it
  PathFinder.use(false);

  // Logic goes here

  runHook('loop.initialize');

  runHook('spawnCheck.before');
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
  runHook('spawnCheck.after');

  runHook('spawn.before');
  Object.entries(unitTypeToSpawn).forEach(([roomName, spawnClass]) => {
    if (spawnClass === false) { return; }
    getStructures(roomName, 'spawn').forEach(spawn => {
      // TODO: This is going to spawn multiple of the same creep if there are multiple spawns in the room.
      const spawnRaw = Game.getObjectById(spawn.id);
      if (spawnRaw.spawning) { return; }

      const creepParts = Roles[spawnClass].getSpawningCreepParts(roomName);
      const newName = spawnRaw.createCreep(
        //ClassType.decideCreepParts(ClassType),
        creepParts,
        uid(),
        { role: spawnClass, originalRole: spawnClass, originalRoom: roomName }
      );
      const creepCost = calculateCreepCost(creepParts);
      if (newName < 0) {
        console.log('Spawning creep with', creepCost, 'energy failed:', newName);
        return;
      }
      appendToTickStat('energyUsage', creepCost);
      console.log(`Spawning new ${spawnClass} with ${creepCost} energy: ${newName}`);
    });
  });
  runHook('spawn.after');

  roomPlanner();

  // Remove old creeps.
  for (var name in Memory.creeps) {
    if(!Game.creeps[name]) {
      const creepMem = Memory.creeps[name];
      const roomMem = Memory.rooms[creepMem.originalRoom];
      runHook('creep.garbageCollect', creepMem, roomMem, name);
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name);
    }
  }

  runHook('structures.before');
  Object.entries(Game.rooms).forEach(([roomName, room]) => {
    const towers = getStructures(roomName, STRUCTURE_TOWER)
      .forEach(tower => {
        Structures.Tower.run(Game.getObjectById(tower.id));
      });
  });
  runHook('structures.after');

  runHook('creeps.before');
  Object.values(Game.creeps).forEach(creep => {
    const role = Roles[creep.memory.role];
    role.checkTask(creep);
    role.run(creep);
  });
  runHook('creeps.after');

  runHook('loop.end');
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
