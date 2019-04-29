const { DataSource } = require("apollo-datasource")
const { UserInputError } = require("apollo-server")
const { ObjectID } = require("mongodb")
const { mergeWith, isArray } = require("lodash")

const noID = new ObjectID("000000000000000000000000")

/**
 * Represent an Event Store for managing Event Sourcing in a MongoDB database
 *
 * @class EventStore
 * @extends {DataSource}
 */
class EventStore extends DataSource {
  /**
   * Creates an instance of EventStore
   *
   * @param {Db} db MongoDB database istance
   * @param {String} collection Name used for the Aggregate Name
   * @param {String} model Name used for the Model Name
   * @memberof EventStore
   */
  constructor(db, config, aggregate, model = "CRUD") {
    super()

    this.db = db
    this.collections = config.collections
    this.snapshotTrigger = config.snapshotTrigger
    this.aggregateName = aggregate.toUpperCase()
    this.modelName = model.toUpperCase()
  }

  /**
   * Get the base collection name used for the snapshot
   *
   * @readonly
   * @memberof EventStore
   */
  get snapshotName() {
    return `${this.collections.snapshot}-${this.aggregateName}-${
      this.modelName
    }`
  }

  /**
   * Initialize the EventStore data source, automatically called by Apollo
   *
   * @param {Object} config Data Source configuration object injected by Apollo
   * @memberof EventStore
   */
  initialize(config) {
    this.context = config.context
  }

  /**
   * Method that resolves the CREATE event
   *
   * @param {Array} data Accumulator array containing the data of the aggregate
   * @param {Event} event Event object containing information needed to resolve the event
   * @returns {Array} An accumulator array with a new entry
   * @memberof EventStore
   */
  $CREATE(data, { aggregateId, payload, timestamp }) {
    return [
      ...data,
      {
        ...payload,
        _id: aggregateId,
        _createdAt: timestamp,
        _updatedAt: timestamp
      }
    ]
  }

  /**
   * Method that resolves the UPDATE event
   *
   * @param {Array} data Accumulator array containing the data of the aggregate
   * @param {Event} event Event object containing information needed to resolve the event
   * @returns {Array} An accumulator array with a replaced entry
   * @memberof EventStore
   */
  $UPDATE(data, { aggregateId, payload, timestamp }) {
    const target = data.findIndex((entry) => entry._id.equals(aggregateId))

    data[target] = payload
    data[target]._updatedAt = timestamp

    return data
  }

  /**
   * Method that resolves the PATCH event
   *
   * @param {Array} data Accumulator array containing the data of the aggregate
   * @param {Event} event Event object containing information needed to resolve the event
   * @returns {Array} An accumulator array with a patched entry
   * @memberof EventStore
   */
  $PATCH(data, { aggregateId, payload, timestamp }) {
    const target = data.findIndex((entry) => entry._id.equals(aggregateId))

    mergeWith(data[target], payload, (objValue, srcValue) => {
      if (isArray(objValue)) {
        return objValue.concat(srcValue)
      }

      if (srcValue === null) {
        return objValue
      }

      return undefined
    })

    data[target]._updatedAt = timestamp

    return data
  }

  /**
   * Method that resolves the REMOVE event
   *
   * @param {Array} data Accumulator array containing the data of the aggregate
   * @param {Event} event Event object containing information needed to resolve the event
   * @returns {Array} An accumulator array with a removed entry
   * @memberof EventStore
   */
  $REMOVE(data, { aggregateId }) {
    return data.filter((entry) => !entry._id.equals(aggregateId))
  }

  /**
   * Method that resolves the non-CRUD events and throw warnings about unresolved events
   *
   * @param {Array} data Accumulator array containing the data of the aggregate
   * @param {Event} event Event object containing information needed to resolve the event
   * @returns {Array} The accumulator array withtout modifications
   * @memberof EventStore
   */
  $DEFAULT(data, event) {
    const { type } = event

    if (this[`$${type}`]) {
      data = this[`$${type}`](data, event)
    } else {
      console.warn(`⚠  Unhandled event ${this.aggregateName}@${type}`)
    }

    return data
  }

  /**
   * Create a new entry by committing a CREATE event with a new Aggregate ID to the EventStore
   *
   * @param {Object} data Data of the Object that will be created
   * @param {*} [params] Not used right now
   * @returns {Promise} A Promise that returns the Object that has been created or an error if resoved
   * @memberof EventStore
   */
  async create(data, params) {
    const id = new ObjectID()

    await this.commit("CREATE", id, data)
    const entry = await this.get(id).catch((e) => e)

    return entry
  }

  /**
   * Replace an existing entry by committing an UPDATE event to the EventStore
   *
   * @param {ObjectID} id ID of the entry that needs to be replaced
   * @param {Object} data Object containing the new data
   * @param {*} [params] Not used right now
   * @returns {Object | Error} The Object that has been replaced or an error
   * @memberof EventStore
   */
  async update(id, data, params) {
    await this.commit("UPDATE", id, data)
    const entry = await this.get(id)

    return entry
  }

  /**
   * Modify an existing entry by committing a PATCH event to the EventStore
   *
   * @param {ObjectID} id ID of the entry that needs to be modified
   * @param {Object} data Object containing the new data
   * @param {*} [params] Not used right now
   * @returns {Object | Error} The Object that has been modified or an error
   * @memberof EventStore
   */
  async patch(id, data, params) {
    await this.commit("PATCH", id, data)
    const entry = await this.get(id)

    return entry
  }

  /**
   * Remove an existing entry by committing a REMOVE event to the EventStore
   *
   * @param {ObjectID} id ID of the entry that needs to be removed
   * @param {*} [params] Not used right now
   * @returns {Object | Error} The Object that has been removed or an error
   * @memberof EventStore
   */
  async remove(id, params) {
    const entry = await this.get(id).catch((e) => e)
    await this.commit("REMOVE", id)

    return entry
  }

  /**
   * Find an entry using MongoDB queries
   *
   * @param {Object} [params={}] { query: {} } Query object, MongoDB like queries can be used to filter data
   * @returns {Promise} A Promise that return all the data of the Aggregate Name
   * @memberof EventStore
   */
  async find(params = {}) {
    params.query = params.query || {}
    params.page = params.page || {}
    params.page.cursor = params.page.cursor || noID
    params.page.cursor = new ObjectID(params.page.cursor)
    params.page.limit = params.page.limit || 30
    params.page.skip = params.page.skip || 0
    params.sort = params.sort || {}
    params.project = params.project || {}

    const snapshot = await this.buildSnapshot(params)

    return {
      total: snapshot.total,
      limit: params.page.limit,
      cursor: (snapshot.data.slice(-1).pop() || {})._id || noID,
      data: snapshot.data.slice(0, params.page.limit)
    }
  }

  /**
   * Get the entry with the specified ID
   *
   * @param {ObjectID} id The ID of the entry
   * @param {*} [params] Not used right now
   * @returns {Promise} A Promise that returns an Object entry if resolved
   * @memberof EventStore
   */
  async get(id, params) {
    const page = await this.find(
      id ? { query: { _id: new ObjectID(id) } } : params
    )
    const entry = page.data[0]

    if (!entry) {
      throw new UserInputError(
        `Entry with ID ${id} was not found in the ${this.aggregateName.toLowerCase()} collection.`
      )
    }

    return entry
  }

  /**
   * Adds an event to the events collection
   *
   * @param {String} type Type of the event
   * @param {ObjectID} aggregateId Aggregate ID of the event
   * @param {Object} payload Payload of the Event
   * @returns {Promise} A promise that returns a MongoDB Document if resolved
   * @memberof EventStore
   */
  commit(type, aggregateId, payload) {
    return this.db.collection(this.collections.events).insertOne({
      type,
      aggregateName: this.aggregateName,
      aggregateId: new ObjectID(aggregateId),
      payload,
      user: this.context.user,
      timestamp: new Date()
    })
  }

  /**
   * Build a snapshot with the latest data
   *
   * @returns {Promise} A promise that returns a snapshot of the latest data
   * @memberof EventStore
   */
  async buildSnapshot(params) {
    const snapshot = await this.loadSnapshot(params)

    const events = await this.db
      .collection(this.collections.events)
      .find({
        _id: { $nin: snapshot.eventIds },
        aggregateName: this.aggregateName,
        $or: [
          { aggregateId: { $in: snapshot.data.map((entry) => entry._id) } },
          { type: "CREATE" }
        ]
      })
      .sort({ timestamp: 1 })
      .toArray()

    let data = snapshot.data

    for (const event of events) {
      switch (event.type) {
        case "CREATE":
          data = await this.$CREATE(data, event)
          break
        case "UPDATE":
          data = await this.$UPDATE(data, event)
          break
        case "PATCH":
          data = await this.$PATCH(data, event)
          break
        case "REMOVE":
          data = await this.$REMOVE(data, event)
          break
        default:
          data = await this.$DEFAULT(data, event)
          break
      }
    }

    const latest = {
      eventIds: [...snapshot.eventIds, ...events.map((event) => event._id)],
      data,
      timestamp: new Date(),
      total:
        snapshot.total +
        data.filter(
          (entry) => !snapshot.data.find((e) => e._id.equals(entry._id))
        ).length
    }

    if (events.length > this.snapshotTrigger) {
      this.saveSnapshot(latest, events)
    }

    return latest
  }

  /**
   * Loads a previous saved snapshot
   *
   * @returns {Promise} A promise that returns a previous saved snapshot
   * @memberof EventStore
   */
  async loadSnapshot(params) {
    let snapshot = {
      eventIds: [],
      data: [],
      timestamp: new Date(0),
      total: 0
    }

    const meta = await this.db
      .collection(this.collections.meta)
      .findOne({ key: this.snapshotName })

    if (meta) {
      const data = await this.db
        .collection(this.snapshotName)
        .find(
          { _id: { $gt: params.page.cursor }, ...params.query },
          params.project
        )
        .sort(params.sort)
        .skip(params.page.skip)
        .limit(params.page.limit)
        .toArray()
      const total = await this.db
        .collection(this.snapshotName)
        .countDocuments(params.query)

      snapshot.eventIds = meta.eventIds
      snapshot.data = data
      snapshot.timestamp = meta.timestamp
      snapshot.total = total
    }

    return snapshot
  }

  /**
   * Saves a snapshot of the current data
   *
   * @param {Array} snapshot Snapshot to be saved
   * @param {Object} events Events parsed in the snapshot
   * @memberof EventStore
   */
  async saveSnapshot(snapshot, events) {
    const operations = []

    for (const event of events) {
      if (event.type === "REMOVE") {
        operations.push({ deleteOne: { filter: { _id: event.aggregateId } } })
      } else {
        const entry = snapshot.data.find((entry) =>
          entry._id.equals(event.aggregateId)
        )
        operations.push({
          replaceOne: {
            filter: { _id: event.aggregateId },
            replacement: entry,
            upsert: true
          }
        })
      }
    }

    await this.db.collection(this.snapshotName).bulkWrite(operations)
    await this.db.collection(this.collections.meta).replaceOne(
      { key: this.snapshotName },
      {
        key: this.snapshotName,
        timestamp: snapshot.timestamp,
        eventIds: snapshot.eventIds
      },
      { upsert: true }
    )
  }
}

module.exports = EventStore
