import { uid } from './utilities';
import { addHook } from './hooks';

addHook('creep.garbageCollect', (creepMem, roomMem) => {
  if (!roomMem) { return; }
  const task = getTask(roomMem, creepMem.task);
  if (!task) { return; }
  task.allocated = Math.max(task.allocated - 1, 0);
});

addHook('cache.before', () => {
  initializeCoordinator();
  Object.values(Game.creeps).forEach(creep => {
    if (!creep.memory.task) { return; }
    const task = getTask(creep.room, creep.memory.task);
    if (!task) { delete creep.memory.task; }
  });
});

export const taskExists = (room, reference = {}) => {
  const referenceKeyCount = Object.keys(reference).length;
  if (referenceKeyCount === 0) {
    console.log('Rejecting task check due to invalid references');
    return true;
  }
  const task = Object.values(room.coordinator || room.memory.coordinator)
    // TODO: Make this filter work like any(pred)
    .filter(task => {
      const taskReference = task.reference || {};
      // If the number of reference keys don't match, it isn't the same.
      if (Object.keys(taskReference).length !== referenceKeyCount) { return false; }

      // Check all of the keys in one, to make sure they're the same in the other.
      return Object.entries(taskReference)
        .filter(([key, value]) => reference[key] != value)
        .length === 0;
    });
  return (task.length === 0) ? false : task[0];
};

export const getTask = (room, taskID) =>
  ((room.coordinator || room.memory.coordinator)[taskID] || false);

export const requestTask = (creep) => {
  const { role, originalRole } = creep.memory;

  const task = Object.values(creep.room.memory.coordinator)
    .filter(filterTask => filterTask.allocated < filterTask.required)
    .sort(a => {
      if (a.task.role === originalRole) { return -1; }
      if (a.task.role === role) { return 0; }
      return 1;
    });
  if (task.length === 0) { return false; }
  task[0].allocated++;
  creep.changeRole(task[0].task.role);
  creep.memory.task = task[0].id;
  return task[0];
}

export const createTask = (room, task) => {
  if (taskExists(room, task.reference)) { return; }
  console.log('Trying to create task', JSON.stringify(task));
  const taskID = uid();
  (room.coordinator || room.memory.coordinator)[taskID] = {
    allocated: 0,
    required: 1,
    ...task,
    id: taskID,
  };
};

export const deleteTask = (room, task) => {
  const taskID = (task && task.id || task);
  if (!task) { return; }
  delete (room.coordinator || room.memory.coordinator)[taskID];
}

export const initializeCoordinator = () => {
  Object.entries(Memory.rooms).forEach(([roomName, roomMem]) => {
    const room = Game.rooms[roomName];
    //delete roomMem.coordinator;
    if (!roomMem.coordinator) { roomMem.coordinator = {}; }
    Object.entries(roomMem.coordinator).forEach(([id, task]) => {
      if (task.task.action === 'build') {
        if (!Game.getObjectById(task.task.id)) {
          // Construction site has been deleted, or task has been completed.
          console.log('Clearing completed build task', id);
          room.lookForAt(LOOK_STRUCTURES, task.task.pos.x, task.task.pos.y)
            .forEach(s => roomMem.cache.structuresNeedingRecheck.push(s.id));
          deleteTask(roomMem, id);
        }
      }
    })
  });
};

export const countRequiredCreepsForTasks = (roomRaw, taskAction) => {
  const room = (roomRaw.name ? Game.rooms[roomRaw.name] : roomRaw).memory;
  return Object.values(room.coordinator || room.memory.coordinator)
    .filter(task => (task.allocated < task.required) && task.task.action === taskAction)
    .reduce((acc, next) => (acc + (next.required - next.allocated)), 0);
}
