/*
export const getSpawn = room => {
  const fullRoom = getRoom(room)
  return Object.values(Game.spawns).filter(s => s.pos.roomName === fullRoom.name)[0];
};


export const calculateCreepCost = body =>
  body.reduce((acc, part) => (acc + BODYPART_COST[part]), 0);

export const structuresNeedingRepair = room => getRoom(room)
  .find(FIND_STRUCTURES, {
    filter: structure => ((structure.hits / structure.hitsMax) < 0.9),
  })
  .sort((a, b) => {
    const percentA = a.hits / a.hitsMax;
    const percentB = b.hits / b.hitsMax;
    return percentA - percentB;
  });

export const findStructures = room => getRoom(room).find(FIND_STRUCTURES);
export const findStorage = room => getRoom(room)
  .find(FIND_STRUCTURES, { filter: s => storageStructures.includes(s.structureType) });
export const findStorageWithSpace = room => findStorage(room)
  .filter(s => s.store
    ? (Object.values(s.store).reduce((acc, next) => (acc + next), 0) < s.storeCapacity)
    : (s.energy < s.energyCapacity));


export const getTotalEnergy = room => findStorage(room)
  .reduce((acc, next) =>
    (acc + ((next.store ? next.store[RESOURCE_ENERGY] : next.energy) || 0)), 0);
export const getEnergyCapacity = room => findStorage(room)
  .reduce((acc, next) => (acc + (next.storeCapacity || next.energyCapacity || 0)), 0);

  */

export const getRoom = (id = Object.keys(Game.rooms)[0]) => Game.rooms[id];
export const getTotalEnergyForSpawn = room => getRoom(room).energyAvailable;
export const getEnergyCapacityForSpawn = room => getRoom(room).energyCapacityAvailable;

const storageStructures = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_CONTAINER, STRUCTURE_STORAGE];
// TODO: Rewrite this!
export const findStorageWithSpace = (room, storageType = storageStructures) => getStructures(room, storageType)
  .filter(s => s.store
    ? (Object.values(s.store).reduce((acc, next) => (acc + next), 0) < s.storeCapacity)
    : (s.energy < s.energyCapacity));

// NEW HELPERS!
export const getRoomMemory = room => Memory.rooms[room.name || room].cache;
export const getRoomStructureById = (room, id) => getRoomMemory(room).structures[id];
export const getStructures = (roomProvided, types) => {
  const room = getRoomMemory(roomProvided);
  return (typeof types === 'undefined' || types === null)
    ? Object.values(room.structures)
    : [].concat(types)
      .reduce((acc, next) => acc.concat((room.structureTypes[next] || []).map(id => room.structures[id])), []);
}
export const sortByRange = creep => (a, b) => creep.pos.getRangeTo(a.pos.x, a.pos.y) - creep.pos.getRangeTo(b.pos.x, b.pos.y);
export const findStorageWithExcess = (room, amount = CARRY_CAPACITY * 5, includeSpawnable = false) =>
  getStructures(room, includeSpawnable ? storageStructures : [STRUCTURE_CONTAINER, STRUCTURE_STORAGE])
    .filter(s => (s.store ? s.store[RESOURCE_ENERGY] : s.energy) >= amount);
;

export const sum = arr => arr.reduce((acc, next) => (acc + next), 0);

export const calculateDistance = (pos, pos2) => {
  const { x, y } = pos;
  const { x: x2, y: y2 } = pos2;
  return Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2));
}

export const debounceByInterval = (func, interval = 5) => {
  if (Game.time % interval === 0) { func(); }
}
export const uid = () =>
  (Memory.uid = (Memory.uid ? (Memory.uid >= 1000000 ? 1 : Memory.uid + 1) : 1));
