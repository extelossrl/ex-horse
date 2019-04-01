const { gql } = require("apollo-server")
const ExHorseServer = require("./server")
const EventStore = require("./libraries/eventstore")

module.exports = { gql, ExHorseServer, EventStore }
