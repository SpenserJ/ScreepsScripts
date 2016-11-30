import _ from 'lodash';

import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

const getEnergyContainers = () => Utilities.findStructures()
  .filter(structure => (
    structure.structureType === STRUCTURE_CONTAINER &&
    structure.store[RESOURCE_ENERGY] > 50
  ));

export default class TransferEnergy extends BaseUnit {
  static minimumUnits = () => {
    if ((Utilities.getTotalEnergyForSpawn() / Utilities.getEnergyCapacityForSpawn()) < .8) {
      return getEnergyContainers().length;
    }
    return Utilities.findTowers().filter(tower => tower.energy < tower.energyCapacity).length;
  };
  static autospawnPriority = 10;

  run() {
    if (super.run() === false) { return; }
    const creep = this.creep;
    if (creep.carry[RESOURCE_ENERGY] > 0) {
      var spawnStorage = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
            structure.energy < structure.energyCapacity;
        }
      });
      if (spawnStorage.length) {
        const closest = creep.pos.findClosestByRange(spawnStorage);
        if(creep.transfer(closest, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(closest);
        }
        return true;
      }

      const towers = Utilities.findTowers(creep.room.id)
        .filter(tower => tower.energy < tower.energyCapacity);

      if (towers.length) {
        const closest = creep.pos.findClosestByRange(towers);
        if(creep.transfer(closest, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(closest);
        }
        return true;
      }

      return false;
    } else {
      const containers = getEnergyContainers();
      if (containers.length === 0) { return false; }
      const closest = creep.pos.findClosestByRange(containers);
      if(creep.withdraw(closest, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        creep.moveTo(closest);
      }
    }
  }
};
