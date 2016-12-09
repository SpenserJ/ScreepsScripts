const hooks = {};

export const addHook = (hook, func) => {
  if (typeof hooks[hook] === 'undefined') { hooks[hook] = []; }
  if (hooks[hook].includes(func)) { return; }
  hooks[hook].push(func);
  console.log('Added hook to', hook);
}

export const runHook = (hook, ...args) => {
  if (typeof hooks[hook] === 'undefined' || hooks[hook].length === 0) {
    // console.log('No hooks defined for', hook);
    return;
  }
  // console.log('Running', hooks[hook].length, 'tasks for', hook);
  hooks[hook].forEach(func => func(...args));
}
