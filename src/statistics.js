import * as Utilities from './utilities';
import _ from 'lodash';

const updateStatisticOnTick = (stat, value, limit = 10) => {
  const stats = Memory.statistics;
  if (typeof stats[stat] === 'undefined') { stats[stat] = []; }
  stats[stat] = stats[stat].concat(value).slice(0 - limit);
}

export const appendToTickStat = (stat, value) => {
  const statHistory = Memory.statistics[stat];
  statHistory[statHistory.length - 1].push(value);
}

export const getStatAverage = stat =>
  _.mean(Memory.statistics[stat].map(tick => Array.isArray(tick) ? _.sum(tick) : tick));

export const track = () => {
  if (typeof Memory.statistics === 'undefined') { Memory.statistics = {}; }
  const stats = Memory.statistics;
  updateStatisticOnTick('energyTotal', Utilities.getTotalEnergy());
  updateStatisticOnTick('energyCapacity', Utilities.getEnergyCapacity());
  updateStatisticOnTick('energyUsage', [[]], 50);
};

export const report = () => {
  const stats = Memory.statistics;
  console.log(`Average Energy: ${getStatAverage('energyTotal')}/${getStatAverage('energyCapacity')}`);
  const energyChange = getStatAverage('energyUsage');
  console.log(`Average Energy Change: ${energyChange > 0 ? '+' : ''}${Math.round(energyChange * 100) / 100}`);
};
