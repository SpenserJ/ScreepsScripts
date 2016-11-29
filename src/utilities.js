export const getTotalEnergy = () => Object.values(Game.rooms)[0].energyAvailable;
export const getEnergyCapacity = () => Object.values(Game.rooms)[0].energyCapacityAvailable;

export const calculateCreepCost = body =>
  body.reduce((acc, part) => (acc + BODYPART_COST[part]), 0);

export const structuresNeedingRepair = () => findStructures()
  .filter(structure => ((structure.hits / structure.hitsMax) < 1));

export const findConstructionSites = () => Object.values(Game.rooms)[0]
  .find(FIND_CONSTRUCTION_SITES);

export const findStructures = () => Object.values(Game.rooms)[0]
  .find(FIND_STRUCTURES);

export const debounceByInterval = (func, interval = 5) => {
  if (Game.time % interval === 0) { func(); }
}
