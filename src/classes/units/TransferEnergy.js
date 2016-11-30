import _ from 'lodash';

import BaseUnit from '../base/Unit';
import * as Utilities from '../../utilities';

const getEnergyContainers = () => Utilities.findStructures()
  .filter(structure => (
    structure.structureType === STRUCTURE_CONTAINER &&
    structure.store[RESOURCE_ENERGY] > 50
  ));

export default class TransferEnergy extends BaseUnit {
  static minimumUnits = () => (
    (Utilities.getTotalEnergyForSpawn() / Utilities.getEnergyCapacityForSpawn()) < .8 &&
    getEnergyContainers().length
  ) || 0;
  static autospawnPriority = 10;

  run() {
    if (super.run() === false) { return; }
    const creep = this.creep;
    if (creep.carry[RESOURCE_ENERGY] > 0) {
      var targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
            structure.energy < structure.energyCapacity;
        }
      });
      if(targets.length === 0) { return false; }
      const closest = creep.pos.findClosestByRange(targets);
      if(creep.transfer(closest, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        creep.moveTo(closest);
      }
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
