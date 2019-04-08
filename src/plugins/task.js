const { DataSource } = require("apollo-datasource")
const { ObjectID } = require("mongodb")
const { UserInputError } = require("apollo-server")

const noID = new ObjectID("000000000000000000000000")

class Task extends DataSource {
  constructor(db, config) {
    super()

    this.db = db
    this.collection = config
  }

  create({ type, payload, runner = "DEFAULT" }) {
    return this.db.collection(this.collection).insertOne({
      type,
      procedureId: new ObjectID(),
      state: "CREATED",
      payload,
      runner,
      progress: [],
      output: "",
      timestamp: new Date()
    })
  }

  async find(params = {}) {
    params.query = params.query || {}
    params.page = params.page || {}
    params.page.cursor = params.page.cursor || noID
    params.page.cursor = new ObjectID(params.page.cursor)
    params.page.limit = params.page.limit || 30
    params.sort = params.sort || {}
    params.project = params.project || {}

    const data = await this.db
      .collection(this.collection)
      .find(
        { _id: { $gt: params.page.cursor }, ...params.query },
        params.project
      )
      .sort(params.sort)
      .limit(params.page.limit)
      .toArray()
    const total = await this.db
      .collection(this.collection)
      .countDocuments(params.query)

    return {
      total,
      limit: params.page.limit,
      cursor: (data.slice(-1).pop() || {})._id || noID,
      data
    }
  }

  async get(id, params) {
    const page = await this.find(
      id ? { query: { _id: new ObjectID(id) } } : params
    )
    const entry = page.data[0]

    if (!entry) {
      throw new UserInputError(`Task with ID ${id} was not found.`)
    }

    return entry
  }
}

module.exports = ({ dataSources, db, config }) => {
  dataSources.push((...args) => ({
    Task: new Task(db, config.database.collections.tasks)
  }))
}
