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

  const deleting = [4151, 4152, 4153, 4154];
  deleting.forEach(id => delete roomMem.roads[id]);
  Object.values(roomMem.roadsFrom).forEach(from => {
    Object.entries(from).forEach(([to, id]) => {
      if (deleting.includes(id)) { delete from[to]; }
    })
  })

  if (!roomMem.roads) { roomMem.roads = {}; }
  if (!roomMem.roadsFrom) { roomMem.roadsFrom = {}; }
};
