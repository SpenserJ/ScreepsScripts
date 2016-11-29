var roleUpgrader = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if(creep.carry.energy == 0) {
      var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
            structure.energy > 0;
        }
      });
      if(targets.length > 0) {
        if (targets[0].transferEnergy(creep) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0]);
        }
      }
    }
    else {
      if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
      }
    }
	},

	autospawn: units => {
    if (units.length >= 1) { return; }
    var newName = Game.spawns['Spawn1'].createCreep([WORK,CARRY,MOVE], undefined, { role: 'upgrader' });
    console.log('Spawning new upgrader:', newName);
	},
};

module.exports = roleUpgrader;
