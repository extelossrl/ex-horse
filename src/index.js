const { gql } = require("apollo-server-micro")
const { AbilityBuilder } = require("@casl/ability")
const Server = require("./libraries/server")
const EventStore = require("./libraries/eventstore")
const dependencies = require("./libraries/dependencies")

module.exports = {
  gql,
  AbilityBuilder,
  Server,
  EventStore,
  dependencies
}
