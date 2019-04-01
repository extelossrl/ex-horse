const { gql } = require("apollo-server")
const Server = require("./server")
const EventStore = require("./libraries/eventstore")

module.exports = { gql, Server, EventStore }
