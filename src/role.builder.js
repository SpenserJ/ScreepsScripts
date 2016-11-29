var roleBuilder = {
  /** @param {Creep} creep **/
  run: function(creep) {
    if(creep.memory.building && creep.carry.energy == 0) {
        creep.memory.building = false;
        creep.say('harvesting');
    }
    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
      creep.memory.building = true;
      creep.say('building');
    }

    if(creep.memory.building) {
      var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
      if(targets.length) {
        if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0]);
        }
      }
    }
    else {
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
	},

	autospawn: units => {
    if (units.length >= 1) { return; }
    var newName = Game.spawns['Spawn1'].createCreep([WORK,CARRY,MOVE], undefined, { role: 'builder' });
    console.log('Spawning new builder:', newName);
	},
};

module.exports = roleBuilder;
