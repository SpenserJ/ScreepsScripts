export const getRoom = (id = Object.keys(Game.rooms)[0]) => Game.rooms[id];

export const getTotalEnergy = room => getRoom(room).energyAvailable;
export const getEnergyCapacity = room => getRoom(room).energyCapacityAvailable;

export const calculateCreepCost = body =>
  body.reduce((acc, part) => (acc + BODYPART_COST[part]), 0);

export const structuresNeedingRepair = room => getRoom(room)
  .find(FIND_MY_STRUCTURES, {
    filter: structure => ((structure.hits / structure.hitsMax) < 1),
  });

export const findConstructionSites = room => getRoom(room).find(FIND_MY_CONSTRUCTION_SITES);
export const findStructures = room => getRoom(room).find(FIND_MY_STRUCTURES);

export const debounceByInterval = (func, interval = 5) => {
  if (Game.time % interval === 0) { func(); }
}
