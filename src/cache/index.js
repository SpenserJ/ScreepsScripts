import { debug } from '../ScreepsCommander';
import cacheRoom from './room';
import cacheStructures from './structures';
import cacheConstructionSites from './constructionSites';
import cacheSources from './sources';
import cacheSpawns from './spawns';
import cacheController from './controller';
import cacheCreeps from './creeps';

import { cacheLifetime } from '../config';
import { addHook } from '../hooks';

addHook('script.initialize', () => {
  Object.values(Memory.rooms).forEach(roomMem => {
    delete roomMem.cache;
  });
  Memory.lastCacheRebuild = 1;
})

export const updateCache = () => {
  if (typeof Memory.lastCacheRebuild === 'undefined') { Memory.lastCacheRebuild = 1; }
  const resetCache = (Memory.lastCacheRebuild >= cacheLifetime);
  if (resetCache) { debug('Resetting cache after', Memory.lastCacheRebuild, 'ticks'); }
  // Increase the stale cache counter.
  Memory.lastCacheRebuild = resetCache ? 1 : (Memory.lastCacheRebuild + 1);

  if (!Memory.rooms) { Memory.rooms = {}; }
  // TODO: Figure out why there is an undefined room appearing
  delete Memory.rooms[undefined];
  Object.values(Game.rooms).forEach(room => {
    cacheRoom(room, resetCache);

    // Structures needs to come before construction sites, sources, and spawns
    cacheStructures(room);
    cacheConstructionSites(room);
    cacheSources(room);
    cacheSpawns(room);

    cacheController(room);
  });

  cacheCreeps();
};
