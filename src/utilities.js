export const getTotalEnergy = () => Object.values(Game.rooms)[0].energyAvailable;
export const getEnergyCapacity = () => Object.values(Game.rooms)[0].energyCapacityAvailable;

const creepBodyPartCosts = { [MOVE]: 50, [WORK]: 100, [CARRY]: 50, [ATTACK]: 80, [RANGED_ATTACK]: 150, [HEAL]: 250, [CLAIM]: 600, [TOUGH]: 10 };
export const calculateCreepCost = body =>
  body.reduce((acc, part) => (acc + creepBodyPartCosts[part]), 0);

export const structuresNeedingRepair = () => findStructures()
  .filter(structure => ((structure.hits / structure.hitsMax) < 1));

export const findConstructionSites = () => Object.values(Game.rooms)[0]
  .find(FIND_CONSTRUCTION_SITES);

export const findStructures = () => Object.values(Game.rooms)[0]
  .find(FIND_STRUCTURES);

export const debounceByInterval = (func, interval = 5) => {
  if (Game.time % interval === 0) { func(); }
}
