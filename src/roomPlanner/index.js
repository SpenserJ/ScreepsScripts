import sourcePlanner from './sources';
import roadPlanner from './roads';
import towerPlanner from './towers';

export default () => {
  Object.entries(Memory.rooms).forEach(([roomName, room]) => {
    sourcePlanner(roomName, room.cache);
    roadPlanner(roomName, room.cache);
    towerPlanner(roomName, room.cache);
  });
};
