import _ from 'lodash';

import * as Utilities from './utilities';
import { log, debug } from './ScreepsCommander.js';

const updateStatisticOnTick = (stat, value, limit = 10) => {
  const stats = Memory.statistics;
  if (typeof stats[stat] === 'undefined') { stats[stat] = []; }
  stats[stat] = stats[stat].concat(value).slice(0 - limit);
}

export const appendToTickStat = (stat, value) => {
  const statHistory = Memory.statistics[stat];
  statHistory[statHistory.length - 1].push(value);
}

export const getStatAverage = stat => {
  const flattened = Memory.statistics[stat].map(tick => Array.isArray(tick) ? _.sum(tick) : tick);
  return _.sum(flattened) / flattened.length;
}

export const track = () => {
  if (typeof Memory.statistics === 'undefined') { Memory.statistics = {}; }
  const stats = Memory.statistics;
  updateStatisticOnTick('energyTotal', Utilities.getTotalEnergy());
  updateStatisticOnTick('energyCapacity', Utilities.getEnergyCapacity());
  updateStatisticOnTick('energyUsage', [[]], 50);
  updateStatisticOnTick('cpuUsage', Game.cpu.getUsed());
  updateStatisticOnTick('cpuLimit', Game.cpu.limit);
  updateStatisticOnTick('cputickLimit', Game.cpu.tickLimit);
  updateStatisticOnTick('cpubucket', Game.cpu.bucket);
};

export const report = () => {
  log('stats.energy', {
    stored: getStatAverage('energyTotal'),
    capacity: getStatAverage('energyCapacity'),
    usage: getStatAverage('energyUsage'),
  });
  log('stats.cpu', {
    usage: getStatAverage('cpuUsage'),
    limit: getStatAverage('cpuLimit'),
    tickLimit: getStatAverage('cputickLimit'),
    bucket: getStatAverage('cpubucket'),
  })
};
