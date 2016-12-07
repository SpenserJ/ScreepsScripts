import { updateStructureStats } from './utilities';
import { structureStatLifetime } from '../config';

export default room => {
  const roomMem = Memory.rooms[room.name].cache;
  if (!roomMem.structures) {
    const structures = {};
    const structureTypes = {};
    room.find(FIND_STRUCTURES).forEach(structureRaw => {
      const structureType = structureRaw.structureType;
      const structure = {
        id: structureRaw.id,
        structureType: structureType,
        pos: structureRaw.pos,
        ...updateStructureStats(structureRaw),
      };
      structures[structureRaw.id] = structure;
      if (!structureTypes[structureType]) { structureTypes[structureType] = []; }
      structureTypes[structureType].push(structureRaw.id);
    });
    roomMem.structures = structures;
    roomMem.structureTypes = structureTypes;
  } else {
    const rescan = (Memory.lastCacheRebuild % structureStatLifetime === 0)
      ? Object.keys(roomMem.structures)
      : roomMem.structuresNeedingRecheck.filter((id, i) => roomMem.structuresNeedingRecheck.indexOf(id) === i);
    if (rescan.length !== 0) {
      console.log('Rescanning', rescan.length, 'stale structures');
      rescan.forEach(id => {
        Object.assign(
          roomMem.structures[id],
          updateStructureStats(Game.getObjectById(id))
        );
      });
      roomMem.structuresNeedingRecheck = [];
    }
  }
};
