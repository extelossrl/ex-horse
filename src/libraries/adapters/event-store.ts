import {
  Document,
  ID,
  DatabaseAdapter,
  Collection,
  CreateParams,
  UpdateParams,
  PatchParams,
  RemoveParams,
  FindParams,
  GetParams,
  Page
} from "../../types"

import { ObjectId, Db } from "mongodb"
import { UserInputError } from "apollo-server-micro"
import { MongoDbDocumentData, MongoDbDocument } from "./mongodb"

export type ReadModel = string

export enum EventMethod {
  "create" = "create",
  "update" = "update",
  "patch" = "patch",
  "remove" = "remove"
}

export interface EventData<T> {
  _id: ObjectId
  collection: string
  id: ObjectId
  method: EventMethod
  data: MongoDbDocumentData<T>
  createdAt: Date
}

export interface Snapshot {
  collection: Collection
  model: ReadModel
  lastEventId: ObjectId
  createdAt: Date
}

export default class EventStoreAdapter<T extends Document>
  implements DatabaseAdapter<T> {
  private snapshot: string

  constructor(
    private db: Db,
    private collection: Collection,
    private model: ReadModel = "default"
  ) {
    this.snapshot = `snapshot.${collection}.${model}`
  }

  async create(
    data: MongoDbDocumentData<T>,
    params?: CreateParams
  ): Promise<T> {
    const id = await this.pushEvent(EventMethod.create, "", data)

    return this.get(id)
  }

  async update(
    id: ID,
    data: MongoDbDocumentData<T>,
    params?: UpdateParams
  ): Promise<T> {
    await this.pushEvent(EventMethod.update, id, data)

    return this.get(id)
  }

  async patch(
    id: ID,
    data: MongoDbDocumentData<T>,
    params?: PatchParams
  ): Promise<T> {
    await this.pushEvent(EventMethod.patch, id, data)

    return this.get(id)
  }

  async remove(id: ID, params?: RemoveParams): Promise<T> {
    const oldDoc = await this.get(id)

    await this.pushEvent(EventMethod.remove, id)

    return oldDoc
  }

  async find(params: FindParams): Promise<Page<T>> {
    await this.hydrate()

    const filter = params?.filter || {}
    const sort = params?.sort || {}
    const skip = Math.max(params?.skip || 0, 0)
    const limit = Math.max(params?.limit || 30, -1)

    const cursor = this.db.collection(this.snapshot).find(filter)

    cursor.sort(sort)
    cursor.skip(skip)

    if (limit !== -1) {
      cursor.limit(limit)
    }

    const response = await cursor
      .toArray()
      .then((_) => _.map((_) => this.parseOutput(_)))

    const total = await this.db
      .collection(this.collection)
      .countDocuments(filter)

    return {
      total,
      limit,
      skip,
      data: response
    }
  }

  async get(id: ID, params?: GetParams): Promise<T> {
    await this.hydrate()

    const response = await this.db
      .collection(this.snapshot)
      .findOne(
        id ? { _id: new ObjectId(id) } : { ...params?.query?.filter },
        {}
      )

    if (!response) {
      throw new UserInputError(
        "Cannot find any document with the specified ID or query"
      )
    }

    return this.parseOutput(response)
  }

  private async pushEvent(
    method: EventMethod,
    id: ID,
    data?: MongoDbDocumentData<T>
  ): Promise<ID> {
    const eventId = new ObjectId(id || undefined)

    await this.db.collection("events").insertOne(
      {
        collection: this.collection,
        id: eventId,
        method,
        data: data || {},
        createdAt: new Date()
      },
      {}
    )

    return eventId.toHexString()
  }

  private async hydrate(): Promise<void> {
    const snapshot: Snapshot | null = await this.db
      .collection("snapshots")
      .findOne({ collection: this.collection, model: this.model }, {})

    const lastEventId = snapshot?.lastEventId
    const cursor = lastEventId ? { _id: { $gt: lastEventId } } : {}

    const events: EventData<T>[] = await this.db
      .collection("events")
      .find(
        {
          collection: this.collection,
          ...cursor
        },
        {}
      )
      .sort({ createdAt: 1 })
      .toArray()

    for (const event of events) {
      if (event.method === EventMethod.create) {
        await this.onCreate(event)
      } else if (event.method === EventMethod.update) {
        await this.onUpdate(event)
      } else if (event.method === EventMethod.patch) {
        await this.onPatch(event)
      } else if (event.method === EventMethod.remove) {
        await this.onRemove(event)
      }
    }

    if (events.length > 0) {
      await this.db.collection("snapshots").replaceOne(
        { collection: this.collection, model: this.model },
        {
          collection: this.collection,
          model: this.model,
          lastEventId: events[events.length - 1]._id,
          createdAt: new Date()
        },
        { upsert: true }
      )
    }
  }

  private async onCreate(event: EventData<T>): Promise<void> {
    await this.db.collection(this.snapshot).insertOne(
      {
        ...event.data,
        _id: event.id,
        createdAt: event.createdAt,
        updatedAt: event.createdAt
      },
      {}
    )
  }

  private async onUpdate(event: EventData<T>): Promise<void> {
    await this.db.collection(this.snapshot).findOneAndReplace(
      { _id: event.id },
      {
        ...event.data,
        updatedAt: event.createdAt
      },
      { returnOriginal: false }
    )
  }

  private async onPatch(event: EventData<T>): Promise<void> {
    await this.db.collection(this.snapshot).findOneAndUpdate(
      { _id: event.id },
      {
        $set: {
          ...event.data,
          updatedAt: event.createdAt
        }
      },
      { returnOriginal: false }
    )
  }

  private async onRemove(event: EventData<T>): Promise<void> {
    await this.db
      .collection(this.snapshot)
      .findOneAndDelete({ _id: event.id }, {})
  }

  private parseOutput(response: MongoDbDocument): T {
    const { _id, createdAt, updatedAt, ...docData } = response

    return { id: _id.toHexString(), createdAt, updatedAt, ...docData } as T
  }
}
