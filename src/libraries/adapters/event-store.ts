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
  Page,
  DatabaseMethod
} from "../../types"

import { ObjectId, Db } from "mongodb"
import { UserInputError } from "apollo-server-micro"
import { MongoDbDocumentData, MongoDbDocument } from "./mongodb"

export type ReadModel = string

export interface EventData<T> {
  _id: ObjectId
  aggregateName: Collection
  aggregateId: ObjectId
  readModel: ReadModel
  command: DatabaseMethod
  payload: MongoDbDocumentData<T>
  createdAt: Date
}

export interface Snapshot {
  aggregateName: Collection
  readModel: ReadModel
  lastEventId: ObjectId
  createdAt: Date
}

export type DependecyCallback = (event: EventData<any>) => Promise<void>

export default class EventStoreAdapter<T extends Document>
  implements DatabaseAdapter<T> {
  private snapshot: string
  private dependencies: Set<Collection> = new Set()
  private dependecyCallback: DependecyCallback | null = null

  constructor(
    private db: Db,
    private aggregateName: Collection,
    private readModel: ReadModel = "default"
  ) {
    this.snapshot = `snapshot.${aggregateName}.${readModel}`
  }

  async create(
    data: MongoDbDocumentData<T>,
    params?: CreateParams
  ): Promise<T> {
    const id = await this.pushEvent(DatabaseMethod.create, "", data)

    return this.get(id)
  }

  async update(
    id: ID,
    data: MongoDbDocumentData<T>,
    params?: UpdateParams
  ): Promise<T> {
    await this.pushEvent(DatabaseMethod.update, id, data)

    return this.get(id)
  }

  async patch(
    id: ID,
    data: MongoDbDocumentData<T>,
    params?: PatchParams
  ): Promise<T> {
    await this.pushEvent(DatabaseMethod.patch, id, data)

    return this.get(id)
  }

  async remove(id: ID, params?: RemoveParams): Promise<T> {
    const oldDoc = await this.get(id)

    await this.pushEvent(DatabaseMethod.remove, id)

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
      .collection(this.aggregateName)
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
    command: DatabaseMethod,
    id: ID,
    payload?: MongoDbDocumentData<T>
  ): Promise<ID> {
    const aggregateId = new ObjectId(id || undefined)

    await this.db.collection("events").insertOne(
      {
        aggregateName: this.aggregateName,
        aggregateId: new ObjectId(id || undefined),
        readModel: this.readModel,
        command,
        payload: (payload || {}) as any,
        createdAt: new Date()
      },
      {}
    )

    return aggregateId.toHexString()
  }

  private async hydrate(): Promise<void> {
    if (this.dependencies.size > 0) {
      await this.resolveDependecies()
    }

    const snapshot: Snapshot | null = await this.db
      .collection("snapshots")
      .findOne(
        {
          aggregateName: this.aggregateName,
          readModel: this.readModel
        },
        {}
      )

    const lastEventId = snapshot?.lastEventId
    const cursor = lastEventId ? { _id: { $gt: lastEventId } } : {}

    const events: EventData<T>[] = await this.db
      .collection("events")
      .find(
        {
          aggregateName: this.aggregateName,
          readModel: this.readModel,
          ...cursor
        },
        {}
      )
      .sort({ createdAt: 1 })
      .toArray()

    for (const event of events) {
      if (event.command === DatabaseMethod.create) {
        await this.onCreate(event)
      } else if (event.command === DatabaseMethod.update) {
        await this.onUpdate(event)
      } else if (event.command === DatabaseMethod.patch) {
        await this.onPatch(event)
      } else if (event.command === DatabaseMethod.remove) {
        await this.onRemove(event)
      }

      if (this.dependecyCallback) {
        this.dependecyCallback(event)
      }
    }

    if (events.length > 0) {
      await this.db.collection("snapshots").replaceOne(
        { aggregateName: this.aggregateName, readModel: this.readModel },
        {
          aggregateName: this.aggregateName,
          readModel: this.readModel,
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
        ...event.payload,
        _id: event.aggregateId,
        createdAt: event.createdAt,
        updatedAt: event.createdAt
      },
      {}
    )
  }

  private async onUpdate(event: EventData<T>): Promise<void> {
    await this.db.collection(this.snapshot).findOneAndReplace(
      { _id: event.aggregateId },
      {
        ...event.payload,
        updatedAt: event.createdAt
      },
      { returnOriginal: false }
    )
  }

  private async onPatch(event: EventData<T>): Promise<void> {
    await this.db.collection(this.snapshot).findOneAndUpdate(
      { _id: event.aggregateId },
      {
        $set: {
          ...event.payload,
          updatedAt: event.createdAt
        }
      },
      { returnOriginal: false }
    )
  }

  private async onRemove(event: EventData<T>): Promise<void> {
    await this.db
      .collection(this.snapshot)
      .findOneAndDelete({ _id: event.aggregateId }, {})
  }

  private parseOutput(response: MongoDbDocument): T {
    const { _id, createdAt, updatedAt, ...docData } = response

    return { id: _id.toHexString(), createdAt, updatedAt, ...docData } as T
  }

  registerDependency(aggregateName: Collection): void {
    this.dependencies.add(aggregateName)
  }

  async onDependencyEvent(event: EventData<any>): Promise<void> {
    throw new Error("Not implemented")
  }

  private async resolveDependecies(): Promise<void> {
    for (const dependency of this.dependencies) {
      const wrapper = new EventStoreAdapter(this.db, dependency, "default")

      wrapper.dependecyCallback = this.onDependencyEvent

      await wrapper.hydrate()
    }
  }
}
