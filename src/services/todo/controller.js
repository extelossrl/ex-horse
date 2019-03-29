const EventStore = require("../../libraries/eventstore")

class ServiceController extends EventStore {
  // constructor(db, collection, model = "CRUD") {
  //   super(db, collection, "Titles")
  // }

  // $CREATE(data, { aggregateId, payload }) {
  //   return [...data, { title: payload.title, _id: aggregateId }]
  // }
}

module.exports = ServiceController
