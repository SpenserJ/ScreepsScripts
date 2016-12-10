import BaseDefinition from './Base';
import { findStorageWithExcess, sortByRange } from '../utilities';
import { deleteTask, countRequiredCreepsForTasks } from '../unitCoordinator';

const CreepDefinition = {
  ...BaseDefinition,

  name: 'Builder',

  requiredUnits: room => {
    const stillNeeded = countRequiredCreepsForTasks(room, 'build');
    return Math.min(4, (stillNeeded + (room.roles[CreepDefinition.name] || []).length));
  },

  run: creep => {
    const task = creep.memory.task && creep.room.memory.coordinator[creep.memory.task];
    if (!task) { return false; }

    if (task.task.action === 'build') {
      return CreepDefinition.runBuild(creep);
    } else if (task.task.action === 'road') {
      return CreepDefinition.runRoad(creep);
    }
  },

  runBuild: creep => {
    const task = creep.memory.task && creep.room.memory.coordinator[creep.memory.task];
    if(creep.memory.building && creep.carry.energy == 0) {
      creep.memory.building = false;
    }
    if(!creep.memory.building && creep.carry.energy == creep.getCarryCapacity()) {
      creep.memory.building = true;
    }

    if (creep.memory.building) {
      const target = Game.getObjectById(task.task.id);
      if (creep.build(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { reusePath: 5 });
      }
      return true;
    } else {
      const targets = findStorageWithExcess(creep.room, creep.getCarryCapacity() * 5, true)
        .sort(sortByRange(creep));
      if (targets.length === 0) { console.log('No storage to pull from'); return; }

      creep.withdrawEnergy(Game.getObjectById(targets[0].id));
    }
  },

  runRoad: creep => {
    const task = creep.memory.task && creep.room.memory.coordinator[creep.memory.task];
    const { roadsFrom, roads } = creep.room.memory;

    if(creep.memory.building && creep.carry.energy == 0) {
      creep.memory.building = false;
    }
    if(!creep.memory.building && creep.carry.energy == creep.getCarryCapacity()) {
      creep.memory.building = true;
    }

    if (creep.memory.building) {
      const path = Room.deserializePath(roads[roadsFrom[task.task.from][task.task.to]]);
      let target;
      for (let i = 0; i < path.length; i++) {
        const looking = creep.room.lookForAt(LOOK_CONSTRUCTION_SITES, path[i].x, path[i].y)
          .filter(found => found.structureType === STRUCTURE_ROAD);
        if (looking.length !== 0) {
          target = looking[0];
          break;
        }
      }
      if (!target) {
        // Construction must be complete.
        deleteTask(creep.memory.task);
        delete creep.memory.task;
        return;
      }
      if (creep.build(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { reusePath: 5 });
      }
    } else {
      const targets = findStorageWithExcess(creep.room, creep.getCarryCapacity() * 5)
        .sort(sortByRange(creep));
      if (targets.length === 0) { console.log('No storage to pull from'); return; }

      creep.withdrawEnergy(Game.getObjectById(targets[0].id));
    }
  }
};

export default CreepDefinition;
