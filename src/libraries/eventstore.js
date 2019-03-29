const { DataSource } = require("apollo-datasource")
const { UserInputError } = require("apollo-server")
const { ObjectID } = require("mongodb")
const { mergeWith, isArray } = require("lodash")
const { COLLECTIONS, SNAPSHOT_TRIGGER } = require("../config")

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
  constructor(db, collection, model = "CRUD") {
    super()

    this.db = db
    this.aggregateName = collection.toUpperCase()
    this.modelName = model
  }

  /**
   * Get the base collection name used for the snapshot
   *
   * @readonly
   * @memberof EventStore
   */
  get collectionBase() {
    return `${COLLECTIONS.SNAPSHOT}-${this.aggregateName}-${this.modelName}`
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
  $CREATE(data, { aggregateId, payload }) {
    return [...data, { ...payload, _id: aggregateId }]
  }

  /**
   * Method that resolves the UPDATE event
   *
   * @param {Array} data Accumulator array containing the data of the aggregate
   * @param {Event} event Event object containing information needed to resolve the event
   * @returns {Array} An accumulator array with a replaced entry
   * @memberof EventStore
   */
  $UPDATE(data, { aggregateId, payload }) {
    const target = data.findIndex((entry) => entry._id.equals(aggregateId))

    data[target] = payload

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
  $PATCH(data, { aggregateId, payload }) {
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
    params.pagination = params.pagination || {}
    params.pagination.cursor = params.pagination.cursor || ""
    params.pagination.limit = params.pagination.limit || 30

    const snapshot = await this.buildSnapshot(params)

    return {
      total: snapshot.total,
      limit: params.pagination.limit,
      cursor: (snapshot.data.slice(-1).pop() || {})._id || "",
      data: snapshot.data
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
    return this.db.collection(COLLECTIONS.EVENTS).insertOne({
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
      .collection(COLLECTIONS.EVENTS)
      .find({
        aggregateName: this.aggregateName,
        $or: [
          { aggregateId: { $in: snapshot.data.map((entry) => entry._id) } },
          { type: "CREATE" }
        ],
        _id: snapshot.lastEventId
          ? { $gt: snapshot.lastEventId }
          : { $exists: true }
      })
      .sort({ timestamp: 1 })
      .toArray()

    const data = events.reduce((data, event) => {
      switch (event.type) {
        case "CREATE":
          data = this.$CREATE(data, event)
          break
        case "UPDATE":
          data = this.$UPDATE(data, event)
          break
        case "PATCH":
          data = this.$PATCH(data, event)
          break
        case "REMOVE":
          data = this.$REMOVE(data, event)
          break
        default:
          data = this.$DEFAULT(data, event)
          break
      }

      return data
    }, snapshot.data)

    const latest = {
      lastEventId: (events.slice(-1).pop() || {})._id || snapshot.lastEventId,
      data,
      timestamp: new Date(),
      total: data.length
    }

    if (events.length > SNAPSHOT_TRIGGER) {
      this.saveSnapshot(latest, events, snapshot)
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
      lastEventId: "",
      data: [],
      timestamp: new Date(0),
      total: 0
    }

    try {
      const collections = await this.db
        .listCollections(
          { name: { $regex: new RegExp(`^${this.collectionBase}-.+`) } },
          { nameOnly: true }
        )
        .toArray()
      const collection = collections
        .map((collection) => {
          const [timestamp, lastEventId] = collection.name.split("-").slice(-2)
          return {
            name: collection.name,
            timestamp: new Date(parseInt(timestamp)),
            lastEventId: new ObjectID(lastEventId)
          }
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 1)
        .pop()
      const data = await this.db
        .collection(collection.name)
        .find(params.query)
        .limit(params.pagination.limit)
        .toArray()
      const total = await this.db
        .collection(collection.name)
        .countDocuments(params.query)

      snapshot.lastEventId = collection.lastEventId
      snapshot.data = data
      snapshot.timestamp = collection.timestamp
      snapshot.total = total
    } catch (error) {}

    return snapshot
  }

  /**
   * Saves a snapshot of the current data
   *
   * @param {Array} snapshot Snapshot to be saved
   * @param {Object} lastEventId The ID of the last parsed event
   * @memberof EventStore
   */
  async saveSnapshot(snapshot, events, previous) {
    const timestamp = new Date().getTime()
    const target = `${this.collectionBase}-${timestamp}-${snapshot.lastEventId}`
    const operations = []

    if (previous.timestamp.getTime() > 0) {
      await this.db
        .collection(
          `${this.collectionBase}-${previous.timestamp.getTime()}-${
            previous.lastEventId
          }`
        )
        .aggregate([{ $match: {} }, { $out: target }])
        .toArray()
    }

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

    await this.db.collection(target).bulkWrite(operations)
  }
}

module.exports = EventStore
