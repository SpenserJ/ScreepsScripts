import { debug } from './ScreepsCommander';

// How many ticks should the cached data exist before it is reset?
const cacheLifetime = 100;
// How many ticks should structure stats exist before they are updated?
const structureStatLifetime = 25;
// How many ticks should construction stats exist before they are updated?
const constructionStatLifetime = 5;

const lookAround = (room, pos, lookTypes = null, range = 1) => {
  const around = {};
  const perRow = range * 2 + 1
  const indexSize = perRow * perRow;
  const centerIndex = Math.floor(indexSize / 2);
  for (let checkIndex = 0; checkIndex < indexSize; checkIndex++) {
    // Dont check the source itself.
    if (checkIndex === centerIndex) { continue; }
    const checkXMod = (checkIndex % perRow);
    const checkX = (pos.x - 1 + checkXMod);
    const checkY = (pos.y - 1 + (checkIndex - checkXMod) / perRow);
    const atPos = room.lookAt(checkX, checkY, room.roomName);
    const filteredAtPos = (lookTypes && lookTypes.length)
      ? atPos.filter(found => lookTypes.includes(found.type))
      : atPos;
    around[`${checkX},${checkY}`] = filteredAtPos;
  }
  return around;
}

const countWorkSpots = (room, pos) => {
  return 8 - Object.values(lookAround(room, pos, [LOOK_TERRAIN, LOOK_STRUCTURES]))
      .filter(atPos => {
      return atPos.filter(found => {
        const foundType = (found.type === LOOK_TERRAIN) ? found.terrain : found.structure.structureType;
        return OBSTACLE_OBJECT_TYPES.includes(foundType);
      }).length;
    }).length;
};

const findNearbyContainers = (room, pos, range = 1) => {
  return Object.values(lookAround(room, pos, [LOOK_STRUCTURES], range))
    .reduce((acc, next) => acc.concat(next), [])
    .filter(s => s.structure.structureType === STRUCTURE_CONTAINER)
    .map(s => s.structure.id);
}

const updateStructureStats = structureRaw => {
  const structure = {};
  if (typeof structureRaw.energy !== 'undefined') {
    structure.energy = structureRaw.energy;
    structure.energyCapacity = structureRaw.energyCapacity;
  }
  if (typeof structureRaw.store !== 'undefined') {
    structure.store = structureRaw.store;
    structure.storeCapacity = structureRaw.storeCapacity;
  }
  if (typeof structureRaw.hits !== 'undefined') {
    structure.hits = structureRaw.hits;
    structure.hitsMax = structureRaw.hitsMax;
  }
  if (typeof structureRaw.ticksToDecay !== 'undefined') {
    structure.ticksToDecay = structureRaw.ticksToDecay;
  }
  return structure;
};

const updateConstructionStats = siteRaw => ({
  progress: siteRaw.progress,
  progressTotal: siteRaw.progressTotal,
});

export const updateCache = () => {
  if (typeof Memory.lastCacheRebuild === 'undefined') { Memory.lastCacheRebuild = 1; }
  const resetCache = (Memory.lastCacheRebuild >= cacheLifetime);
  if (resetCache) { debug('Resetting cache after', Memory.lastCacheRebuild, 'ticks'); }
  // Increase the stale cache counter.
  Memory.lastCacheRebuild = resetCache ? 1 : (Memory.lastCacheRebuild + 1);

  if (!Memory.rooms) { Memory.rooms = {}; }
  // TODO: Figure out why there is an undefined room appearing
  delete Memory.rooms[undefined];
  Object.values(Game.rooms).forEach(room => {
    if (!Memory.rooms[room.name]) { Memory.rooms[room.name] = {}; }
    if (!Memory.rooms[room.name].cache || resetCache) {
      Memory.rooms[room.name].cache = {
        name: room.name,
        structuresNeedingRecheck: [],
      };
    }
    const roomMem = Memory.rooms[room.name].cache;

    if (!roomMem.structures) {
      const structures = {};
      const structureTypes = {};
      room.find(FIND_STRUCTURES).forEach(structureRaw => {
        const structureType = structureRaw.structureType;
        const structure = {
          id: structureRaw.id,
          structureType: structureType,
          pos: structureRaw.pos,
          ...updateStructureStats(structureRaw),
        };
        structures[structureRaw.id] = structure;
        if (!structureTypes[structureType]) { structureTypes[structureType] = []; }
        structureTypes[structureType].push(structureRaw.id);
      });
      roomMem.structures = structures;
      roomMem.structureTypes = structureTypes;
    } else {
      const rescan = (Memory.lastCacheRebuild % structureStatLifetime === 0)
        ? Object.keys(roomMem.structures)
        : roomMem.structuresNeedingRecheck.filter((id, i) => roomMem.structuresNeedingRecheck.indexOf(id) === i);
      if (rescan.length !== 0) {
        console.log('Rescanning', rescan.length, 'stale structures');
        rescan.forEach(id => {
          Object.assign(
            roomMem.structures[id],
            updateStructureStats(Game.getObjectById(id))
          );
        });
        roomMem.structuresNeedingRecheck = [];
      }
    }

    if (!roomMem.constructionSites) {
      const constructionSites = {};
      room.find(FIND_CONSTRUCTION_SITES).forEach(siteRaw => {
        constructionSites[siteRaw.id] = {
          id: siteRaw.id,
          my: siteRaw.my,
          structureType: siteRaw.structureType,
          pos: siteRaw.pos,
          ...updateConstructionStats(siteRaw),
        };
      });
      roomMem.constructionSites = constructionSites;
    } else if (Memory.lastCacheRebuild % constructionStatLifetime === 0) {
      Object.keys(roomMem.constructionSites).forEach(id => {
        const site = Game.getObjectById(id);
        if (site) {
          Object.assign(roomMem.constructionSites[id], updateConstructionStats(site));
        } else {
          delete roomMem.constructionSites[id];
        }
      });
    }

    // Check for all sources.
    if (!roomMem.sources) {
      const sources = {};
      room.find(FIND_SOURCES).forEach(sourceRaw => {
        const source = {};
        // Keeper Lairs are dangerous! Avoid them at all costs.
        source.lair = sourceRaw.pos.findInRange(FIND_STRUCTURES, 5, {
          filter: s => s.structureType === STRUCTURE_KEEPER_LAIR,
        }).length !== 0;

        source.pos = sourceRaw.pos;
        // Check for how many spots are walkable around the source.
        source.workSpots = countWorkSpots(room, source.pos);
        source.nearbyContainers = findNearbyContainers(room, source.pos, 2);

        sources[sourceRaw.id] = source;
      });
      roomMem.sources = sources;
    }

    if (!roomMem.controller && room.controller) {
      const controllerRaw = room.controller;
      roomMem.controller = {
        pos: controllerRaw.pos,
        workSpots: countWorkSpots(room, controllerRaw.pos),
        safeModeAvailable: controllerRaw.safeModeAvailable,
        safeModeCooldown: controllerRaw.safeModeCooldown || 0,
        upgradeBlocked: controllerRaw.upgradeBlocked || 0,
      };
    }

    const spawns = roomMem.structureTypes[STRUCTURE_SPAWN];
    spawns.forEach(spawnId => {
      const spawn = roomMem.structures[spawnId];
      if (!spawn.nearbyContainers) {
        spawn.nearbyContainers = findNearbyContainers(room, spawn.pos);
      }
    })
  });
};
