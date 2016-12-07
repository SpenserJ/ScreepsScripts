import { updateConstructionStats } from './utilities';
import { constructionStatLifetime } from '../config';

export default room => {
  const roomMem = Memory.rooms[room.name].cache;
  if (!roomMem.constructionSites) {
    const constructionSites = {};
    room.find(FIND_CONSTRUCTION_SITES).forEach(siteRaw => {
      constructionSites[siteRaw.id] = {
        id: siteRaw.id,
        my: siteRaw.my,
        structureType: siteRaw.structureType,
        pos: siteRaw.pos,
        ...updateConstructionStats(siteRaw),
      };
    });
    roomMem.constructionSites = constructionSites;
  } else if (Memory.lastCacheRebuild % constructionStatLifetime === 0) {
    Object.keys(roomMem.constructionSites).forEach(id => {
      const site = Game.getObjectById(id);
      if (site) {
        Object.assign(roomMem.constructionSites[id], updateConstructionStats(site));
      } else {
        delete roomMem.constructionSites[id];
      }
    });
  }
};
