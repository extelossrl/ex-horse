const { DataSource } = require("apollo-datasource")
const { ObjectID } = require("mongodb")

class Task extends DataSource {
  constructor(db) {
    super()

    this.db = db
  }

  create({ type, payload, runner = "default" }) {
    return this.db
      .collection(this.$config.database.collections.tasks)
      .insertOne({
        type,
        procedureId: new ObjectID(),
        state: "CREATED",
        payload,
        runner,
        progress: [],
        timestamp: new Date()
      })
  }
}

module.exports = ({ dataSources, db }) => {
  dataSources.push((...args) => ({
    Task: new Task(db)
  }))
}
