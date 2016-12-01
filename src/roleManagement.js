const Roles = {
  Harvester: require('../src/classes/units/Harvester').default,
  Builder: require('../src/classes/units/Builder').default,
  Upgrader: require('../src/classes/units/Upgrader').default,
  Hauler: require('../src/classes/units/Hauler').default,
}

let roleUsage;
export const getRoleUsage = (force = false) => {
  if (!roleUsage || force === true) { calculateRoleUsage(); }
  return roleUsage;
}

const calculateRoleUsage = () => {
  let unitsByRole;
  const parseRoleAssignments = () => {
    unitsByRole = {};
    Object.values(Game.creeps).forEach(creep => {
      const role = creep.memory.role;
      if (typeof unitsByRole[role] === 'undefined') { unitsByRole[role] = 1; }
      else { unitsByRole[role]++; }
    });
  }
  parseRoleAssignments();

  const roleMinimums = Object.values(Roles)
    .map(role => ([
      role.name,
      (typeof role.minimumUnits === 'function') ? role.minimumUnits() : role.minimumUnits,
    ]))

  const requiredRoles = roleMinimums
    .filter(([name, minimumUnits]) => {
      const currentUnits = unitsByRole[name] || 0;
      return minimumUnits > currentUnits;
    })
    .sort(([nameA], [nameB]) => {
      const { [nameA]: a, [nameB]: b } = Roles;
      const priorityA = (typeof a.autospawnPriority === 'function') ? a.autospawnPriority() : a.autospawnPriority;
      const priorityB = (typeof b.autospawnPriority === 'function') ? b.autospawnPriority() : b.autospawnPriority;
      return priorityB - priorityA;
    });

  const excessRoles = roleMinimums
    .map(([name, minimum]) => ([
      name,
      unitsByRole[name] - minimum,
    ]))
    .filter(([name, minimum]) => minimum > 0);

  const leastEssential = roleMinimums
    .filter(([name]) => (unitsByRole[name] || 0) > 0)
    .sort(([nameA], [nameB]) => {
      const { [nameA]: a, [nameB]: b } = Roles;
      const priorityA = (typeof a.autospawnPriority === 'function') ? a.autospawnPriority() : a.autospawnPriority;
      const priorityB = (typeof b.autospawnPriority === 'function') ? b.autospawnPriority() : b.autospawnPriority;
      return priorityA - priorityB;
    });

  const idleCreeps = Object.values(Game.creeps).filter(creep => creep.memory.idleTicks > 0);

  roleUsage = { unitsByRole, roleMinimums, requiredRoles, excessRoles, leastEssential, idleCreeps };
};
