const { DataSource } = require("apollo-datasource");
const { ObjectID } = require("mongodb");
const acl = require("../acl");
const config = require("../config");

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
   * @param {String} aggregateName Name of the aggregate
   * @memberof EventStore
   */
  constructor(db, aggregateName) {
    super();

    this.db = db;
    this.aggregateName = aggregateName;

    this.collections = config.EVENTSTORE_COLLECTIONS;
  }

  /**
   * Initialize the EventStore data source, automatically called by Apollo
   *
   * @param {Object} config Data Source configuration object injected by Apollo
   * @memberof EventStore
   */
  initialize(config) {
    this.context = config.context;
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
    });
  }

  /**
   * Rebuild the state relative to the current Aggregate Name and an optional Aggregate ID
   *
   * @param {ObjectID} [aggregateId] Aggregate ID filter
   * @returns {Promise} A promise that returns an Array containing the state relative to the current Aggregate Name if resolved
   * @memberof EventStore
   */
  async state(aggregateId) {
    const snapshot = (await this.db
      .collection(this.collections.snapshots)
      .findOne(
        { aggregateName: this.aggregateName },
        { sort: [["timestamp", -1]] }
      )) || {
      aggregateName: this.aggregateName,
      eventIds: [],
      state: [],
      timestamp: new Date(0)
    };

    const events = await this.db
      .collection(this.collections.events)
      .find({
        aggregateName: this.aggregateName,
        aggregateId: aggregateId || { $exists: true },
        _id: { $nin: snapshot.eventIds }
      })
      .sort({ timestamp: 1 })
      .toArray();

    const state = events.reduce(
      (...args) => this.hydrate(...args),
      snapshot.state
    );

    const currentTimestamp = new Date();

    if (
      currentTimestamp.getTime() - snapshot.timestamp.getTime() >
      config.SNAPSHOT_INTERVAL
    ) {
      this.db.collection(this.collections.snapshots).insertOne({
        aggregateName: this.aggregateName,
        eventIds: [...snapshot.eventIds, ...events.map(event => event._id)],
        state,
        timestamp: currentTimestamp
      });
    }

    return state;
  }

  /**
   * Converts a plain object to a Model with the current Aggregate Name for usage with CASL permission system
   *
   * @param {Object} data Object containing the data for the Model
   * @returns {Model} A <AggregateName> Model istance with all the properties contained in the data parameter
   * @memberof EventStore
   */
  model(data) {
    const aggregateName = this.aggregateName.toLowerCase();

    class Model {
      constructor(data) {
        Object.assign(this, data);
      }

      static get modelName() {
        return aggregateName;
      }
    }

    return new Model(data);
  }

  /**
   * Get the CASL istance relative to the current user role
   *
   * @readonly
   * @memberof EventStore
   */
  get acl() {
    return acl(this.context.user);
  }
}

module.exports = EventStore;
