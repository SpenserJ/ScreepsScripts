import { debug } from './ScreepsCommander';

const countWorkSpots = (room, pos) => {
  let workSpots = 8;
  for (let checkIndex = 0; checkIndex < 9; checkIndex++) {
    // Dont check the source itself.
    if (checkIndex === 4) { continue; }
    const checkXMod = (checkIndex % 3);
    const checkX = (pos.x - 1 + checkXMod);
    const checkY = (pos.y - 1 + (checkIndex - checkXMod) / 3);
    const atPos = room.lookAt(checkX, checkY, room.roomName).filter(found => {
      if (found.type !== LOOK_TERRAIN && found.type !== LOOK_STRUCTURES) { return false; }
      const foundType = (found.type === LOOK_TERRAIN) ? found.terrain : found.structure.structureType;
      return OBSTACLE_OBJECT_TYPES.includes(foundType);
    });
    if (atPos.length !== 0) { workSpots--; }
  }
  return workSpots;
}

export const updateCache = () => {
  if (typeof Memory.lastCacheRebuild === 'undefined') { Memory.lastCacheRebuild = 1; }
  const resetCache = (Memory.lastCacheRebuild >= 100);
  if (resetCache) { debug('Resetting cache after', Memory.lastCacheRebuild, 'ticks'); }
  // Increase the stale cache counter.
  Memory.lastCacheRebuild = resetCache ? 1 : (Memory.lastCacheRebuild + 1);

  if (!Memory.rooms) { Memory.rooms = {}; }
  Object.values(Game.rooms).forEach(room => {
    if (!Memory.rooms[room.name]) { Memory.rooms[room.name] = {}; }
    if (!Memory.rooms[room.name].cache || resetCache) { Memory.rooms[room.name].cache = {}; }
    const roomMem = Memory.rooms[room.name].cache;

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
  });
};
