const { UserInputError } = require("apollo-server");
const { ObjectID } = require("mongodb");
const cleanDeep = require("clean-deep");
const EventStore = require("../eventstore");
const Pagination = require("../pagination");

/**
 * Represent of an EventStore controller with CRUD operations
 *
 * @class EventStoreCRUD
 * @extends {EventStore}
 */
class EventStoreCRUD extends EventStore {
  /**
   * Method that gets called when rebuilding the state of the aggregate for resolving each event
   *
   * @typedef {Object} Event
   * @property {ObjectID} id ID of the event
   * @property {String} type Type of the event
   * @property {String} aggregateName Name of the aggregate
   * @property {ObjectID} aggregateId ID of the aggregate
   * @property {Object} payload Payload of the event
   * @property {User} user User who triggered the event
   * @property {String} timestamp Timestamp of the event
   *
   * @param {Array} stateCache Accumulator array containing the state of the aggregate
   * @param {Event} event Current event that needs to be resolved
   * @returns {Object} A Object containing the resolved event
   * @memberof EventStoreCRUD
   */
  hydrate(stateCache, event) {
    let toRet = stateCache;

    switch (event.type) {
      case "CREATE":
        toRet = this.$CREATE(toRet, event);
        break;
      case "UPDATE":
        toRet = this.$UPDATE(toRet, event);
        break;
      case "PATCH":
        toRet = this.$PATCH(toRet, event);
        break;
      case "DELETE":
        toRet = this.$DELETE(toRet, event);
        break;
      default:
        toRet = this.$DEFAULT(toRet, event);
        break;
    }

    return toRet;
  }

  /**
   * Method that resolves the CREATE event
   *
   * @param {Array} stateCache Accumulator array containing the state of the aggregate
   * @param {Event} event Event object containing information needed to resolve the event
   * @returns {Array} An accumulator array with a new entry
   * @memberof EventStoreCRUD
   */
  $CREATE(stateCache, { aggregateId, payload }) {
    return [...stateCache, { ...payload, id: aggregateId }];
  }

  /**
   * Method that resolves the UPDATE event
   *
   * @param {Array} stateCache Accumulator array containing the state of the aggregate
   * @param {Event} event Event object containing information needed to resolve the event
   * @returns {Array} An accumulator array with a replaced entry
   * @memberof EventStoreCRUD
   */
  $UPDATE(stateCache, { aggregateId, payload }) {
    const target = stateCache.findIndex(entry => entry.id.equals(aggregateId));

    stateCache = stateCache.splice(target, 1, payload);

    return stateCache;
  }

  /**
   * Method that resolves the PATCH event
   *
   * @param {Array} stateCache Accumulator array containing the state of the aggregate
   * @param {Event} event Event object containing information needed to resolve the event
   * @returns {Array} An accumulator array with a patched entry
   * @memberof EventStoreCRUD
   */
  $PATCH(stateCache, { aggregateId, payload }) {
    const target = stateCache.findIndex(entry => entry.id.equals(aggregateId));

    stateCache = stateCache.splice(target, 1, {
      ...stateCache[target],
      ...cleanDeep(payload, {
        emptyArrays: false,
        emptyObjects: false,
        emptyStrings: false
      })
    });

    return stateCache;
  }

  /**
   * Method that resolves the DELETE event
   *
   * @param {Array} stateCache Accumulator array containing the state of the aggregate
   * @param {Event} event Event object containing information needed to resolve the event
   * @returns {Array} An accumulator array with a removed entry
   * @memberof EventStoreCRUD
   */
  $DELETE(stateCache, { aggregateId }) {
    return stateCache.filter(entry => !entry.id.equals(aggregateId));
  }

  /**
   * Method that resolves the non-CRUD events and throw warnings about unresolved events
   *
   * @param {Array} stateCache Accumulator array containing the state of the aggregate
   * @param {Event} event Event object containing information needed to resolve the event
   * @returns {Array} The accumulator array withtout modifications
   * @memberof EventStoreCRUD
   */
  $DEFAULT(stateCache, event) {
    const { type } = event;

    if (this[`$${type}`]) {
      stateCache = this[`$${type}`](stateCache, event);
    } else {
      console.warn(`⚠  Unhandled event ${this.aggregateName}@${type}`);
    }

    return stateCache;
  }

  /**
   * Method that gets called before the resolutions of the CREATE event
   *
   * @param {Object} obj Object that contains the result returned from the resolver on the parent field
   * @param {Object} payload object with the arguments passed into the field in the query
   * @param {Object} context Object containing the Apollo context
   * @param {Object} info Object that contains information about the execution state of the query
   * @returns {Array} An array with the same parameters passed in input
   * @memberof EventStoreCRUD
   */
  beforeCreate(obj, payload, context, info) {
    return [obj, payload, context, info];
  }

  /**
   * Create a new entry by committing a CREATE event with a new Aggregate ID to the EventStore
   *
   * @param {Object} data Data of the Object that will be created
   * @param {*} [params] Not used right now
   * @returns {Promise} A Promise that returns the Object that has been created or an error if resoved
   * @memberof EventStoreCRUD
   */
  async create(data, params) {
    const id = new ObjectID();

    await super.commit("CREATE", id, data);
    const entry = await this.get(id).catch(e => e);

    return entry;
  }

  /**
   * Method that gets called after the resolutions of the CREATE event
   *
   * @param {Object} obj Object that contains the result returned from the resolver on the parent field
   * @param {Object} payload object with the arguments passed into the field in the query
   * @param {Object} context Object containing the Apollo context
   * @param {Object} info Object that contains information about the execution state of the query
   * @param {Object | Error} created The Object that has been created or an error
   * @returns {Array} An array with the same parameters passed in input
   * @memberof EventStoreCRUD
   */
  afterCreate(obj, payload, context, info, created) {
    return [obj, payload, context, info, created];
  }

  /**
   * Replace an existing entry by committing an UPDATE event to the EventStore
   *
   * @param {ObjectID} id ID of the entry that needs to be replaced
   * @param {Object} data Object containing the new data
   * @param {*} [params] Not used right now
   * @returns {Object | Error} The Object that has been replaced or an error
   * @memberof EventStoreCRUD
   */
  async update(id, data, params) {
    await super.commit("UPDATE", id, data);
    const entry = await this.get(id);

    return entry;
  }

  /**
   * Modify an existing entry by committing a PATCH event to the EventStore
   *
   * @param {ObjectID} id ID of the entry that needs to be modified
   * @param {Object} data Object containing the new data
   * @param {*} [params] Not used right now
   * @returns {Object | Error} The Object that has been modified or an error
   * @memberof EventStoreCRUD
   */
  async patch(id, data, params) {
    await super.commit("PATCH", id, data);
    const entry = await this.get(id);

    return entry;
  }

  /**
   * Remove an existing entry by committing a REMOVE event to the EventStore
   *
   * @param {ObjectID} id ID of the entry that needs to be removed
   * @param {*} [params] Not used right now
   * @returns {Object | Error} The Object that has been removed or an error
   * @memberof EventStoreCRUD
   */
  async delete(id, params) {
    const entry = await this.get(id).catch(e => e);
    await super.commit("DELETE", id);

    return entry;
  }

  /**
   * Find an entry on the state using MongoDB like queries
   *
   * @param {Object} [params={}] { query: {}, pagination: {} } Query and pagination object, MongoDB like queries can be used to filter data
   * @returns {Promise} A Promise that return a Page Object containing { total: 0, limit: 10, data: [], cursor: 0 } if resolved
   * @memberof EventStoreCRUD
   */
  async find(params = {}) {
    params.query = params.query || {};
    params.pagination = params.pagination || {};

    const state = await super.state();
    const pagination = new Pagination(state, params.pagination.limit);

    return pagination.getPage(params.pagination.cursor);
  }

  /**
   * Get the entry with the specified ID
   *
   * @param {ObjectID} id The ID of the entry
   * @param {*} [params] Not used right now
   * @returns {Promise} A Promise that returns an Object entry if resolved
   * @memberof EventStoreCRUD
   */
  async get(id, params) {
    const entries = await this.find(id ? { query: { id } } : params);
    const entry = entries.data[0];

    if (!entry) {
      throw new UserInputError(
        `${this.aggregateName} with ID ${id} does not exists.`
      );
    }

    return entry;
  }
}

module.exports = EventStoreCRUD;
