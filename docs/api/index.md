---
sidebar:  auto
---

## EventStore ⇐ <code>DataSource</code>
**Extends**: <code>DataSource</code>

* [EventStore](#eventstore-⇐-datasource) ⇐ <code>DataSource</code>
    * [new EventStore()](#new-eventstore-db-collection)
        * [.initialize(config)](#initialize-config)
        * [.commit(type, aggregateId, payload)](#commit-type-aggregateid-payload-⇒-promise) ⇒ <code>Promise</code>
        * [.state(model)](#state-model-⇒-promise) ⇒ <code>Promise</code>
        * [.loadSnapshot(model)](#loadsnapshot-model-⇒-promise) ⇒ <code>Promise</code>
        * [.saveSnapshot(events, snapshot, state, model)](#savesnapshot-events-snapshot-state-model)

### new EventStore(db, collection)
Creates an instance of EventStore.

| Param | Type | Description |
| --- | --- | --- |
| db | <code>Db</code> | MongoDB database istance |
| collection | <code>String</code> | Name used for the Aggregate Name |


### initialize(config)
Initialize the EventStore data source, automatically called by Apollo.

| Param | Type | Description |
| --- | --- | --- |
| config | <code>Object</code> | Data Source configuration object injected by Apollo |


### commit(type, aggregateId, payload) ⇒ <code>Promise</code>
Adds an event to the events collection.

**Returns**: <code>Promise</code> - A promise that returns a MongoDB Document if resolved.

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | Type of the event |
| aggregateId | <code>ObjectID</code> | Aggregate ID of the event |
| payload | <code>Object</code> | Payload of the Event |


### state(model) ⇒ <code>Promise</code>
Rebuild the state relative to the current Aggregate Name and an optional Aggregate ID.

**Returns**: <code>Promise</code> - A promise that returns an Array containing the state relative to the current Aggregate Name if resolved.

| Param | Type | Description |
| --- | --- | --- |
| model | <code>String</code> | Name of the read model |


### loadSnapshot(model) ⇒ <code>Promise</code>
Loads a snapshot of a previous state.

**Returns**: <code>Promise</code> - A promise that returns a snapshot of a previous state.

| Param | Type | Description |
| --- | --- | --- |
| model | <code>String</code> | Name of the read model |


### saveSnapshot(events, snapshot, state, model)
Saves a snapshot of the current state.

| Param | Type | Description |
| --- | --- | --- |
| events | <code>Array</code> | Array of events processed by the hydrate function |
| snapshot | <code>Object</code> | Previous snapshot, used to check if is we need to create a new snapshot |
| state | <code>Array</code> | Array represting the crrent state |
| model | <code>String</code> | Name of the read model |
