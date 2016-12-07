import { uid } from './utilities';

export const taskExists = (room, reference = {}) => {
  const referenceKeyCount = Object.keys(reference).length;
  if (referenceKeyCount === 0) {
    console.log('Rejecting task check due to invalid references');
    return true;
  }
  return Object.values(room.coordinator || room.memory.coordinator)
    // TODO: Make this filter work like any(pred)
    .filter(task => {
      const taskReference = task.reference || {};
      // If the number of reference keys don't match, it isn't the same.
      if (Object.keys(taskReference).length !== referenceKeyCount) { return false; }

      // Check all of the keys in one, to make sure they're the same in the other.
      return Object.entries(taskReference)
        .filter(([key, value]) => reference[key] != value)
        .length === 0;
    })
    .length !== 0;
};


export const getTask = (creep) => {
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

export const initializeCoordinator = () => {
  Object.entries(Memory.rooms).forEach(([roomName, room]) => {
    //delete room.coordinator;
    if (!room.coordinator) { room.coordinator = {}; }
  });
};
