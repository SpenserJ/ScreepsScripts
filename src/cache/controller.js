import { countWorkSpots } from './utilities';

export default room => {
  const roomMem = Memory.rooms[room.name].cache;
  if (!roomMem.controller && room.controller) {
    const controllerRaw = room.controller;
    roomMem.controller = {
      pos: controllerRaw.pos,
      workSpots: countWorkSpots(room, controllerRaw.pos),
      safeModeAvailable: controllerRaw.safeModeAvailable,
      safeModeCooldown: controllerRaw.safeModeCooldown || 0,
      upgradeBlocked: controllerRaw.upgradeBlocked || 0,
    };
  }
};
