const profilerEnabled = true;

// Set up the screeps profiler.
const profiler = require('screeps-profiler');
if (profilerEnabled) { profiler.enable(); }

import loop from './loop';
import { log, logBatched } from './ScreepsCommander.js';

if (profilerEnabled) {
  profiler.wrap(loop);
  if (Game.time === Memory.profiler.disableTick) {
    log('profiler', { lines: profiler.output() });
  }
} else { loop(); }

logBatched();
