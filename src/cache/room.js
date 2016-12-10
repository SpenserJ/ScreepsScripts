import { addHook } from '../hooks';

addHook('cache.before', () => {
  Object.values(Game.rooms).forEach(roomRaw => {
    const roomMem = roomRaw.memory;
    if (!roomMem.roads) { roomMem.roads = {}; }
    if (!roomMem.roadsFrom) { roomMem.roadsFrom = {}; }
  });
});

export default (room, resetCache) => {
  if (!Memory.rooms[room.name]) { Memory.rooms[room.name] = {}; }
  const roomMem = Memory.rooms[room.name];
  if (!roomMem.cache || resetCache) {
    roomMem.cache = {
      name: room.name,
      structuresNeedingRecheck: [],
      roles: {},
    };
  }
};
