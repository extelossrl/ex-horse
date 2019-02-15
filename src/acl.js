const { AbilityBuilder } = require("@casl/ability");

module.exports = user => {
  const roles = {
    ADMIN: AbilityBuilder.define(can => {
      can("manage", "all");
    }),
    RESOURCE: AbilityBuilder.define(can => {
      can("read", "all");
    }),
    GUEST: AbilityBuilder.define(can => {
      can("read", "all");
    })
  };

  return roles[user.role];
};
