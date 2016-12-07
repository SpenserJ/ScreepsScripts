export default (room, resetCache) => {
  if (!Memory.rooms[room.name]) { Memory.rooms[room.name] = {}; }
  if (!Memory.rooms[room.name].cache || resetCache) {
    Memory.rooms[room.name].cache = {
      name: room.name,
      structuresNeedingRecheck: [],
      roles: {},
    };
  }
};
