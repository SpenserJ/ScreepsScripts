export default () => {
  Object.entries(Game.creeps).forEach(([creepName, creep]) => {
    const roomMem = Memory.rooms[creep.memory.originalRoom].cache;
    const creepRole = creep.memory.role;

    if (!roomMem.roles[creepRole]) { roomMem.roles[creepRole] = []; }
    if (!roomMem.roles[creepRole].includes(creep.id)) {
      roomMem.roles[creepRole].push(creep.id);
    }
  });
};
