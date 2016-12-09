//import BaseDefinition from './Base';
const StructureDefinition = {
  /*
  ...BaseDefinition,

*/  name: 'Tower',
/*
  requiredUnits: room => {
    const stillNeeded = countRequiredCreepsForTasks(room, 'build');
    return Math.min(4, (stillNeeded + (room.roles[StructureDefinition.name] || []).length));
  },
*/
  run: structure => {
    const tower = Game.getObjectById(structure.id);

    const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (closestHostile) {
      console.log('Attack enemy!');
      tower.attack(closestHostile);
      return true;
    }

    const repairTargets = tower.pos
      .findInRange(FIND_STRUCTURES, 40, {
        filter: structure => ((structure.hits / structure.hitsMax) < 0.9),
      })
      .sort((a, b) => {
        const percentA = a.hits / a.hitsMax;
        const percentB = b.hits / b.hitsMax;
        return percentA - percentB;
      });
    if (repairTargets.length) {
      tower.repair(repairTargets[0]);
      return true;
    }
  }
};

export default StructureDefinition;
