const profilerEnabled = true;

// Set up the screeps profiler.
const profiler = require('screeps-profiler');
if (profilerEnabled) { profiler.enable(); }

import loop from './loop';
import { logBatched } from './ScreepsCommander.js';

if (profilerEnabled) { profiler.wrap(loop); }
else { loop(); }

logBatched();
