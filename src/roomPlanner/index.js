import sourcePlanner from './sources';

export default () => {
  Object.entries(Memory.rooms).forEach(([roomName, room]) => {
    sourcePlanner(roomName, room.cache);
  });
};
