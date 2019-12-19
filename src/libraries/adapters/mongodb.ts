import {
  Document,
  DatabaseAdapter,
  Collection,
  DocumentData,
  CreateParams,
  ID,
  UpdateParams,
  PatchParams,
  RemoveParams,
  FindParams,
  Page,
  GetParams
} from "../../types"
import { Db, ObjectId } from "mongodb"
import { UserInputError } from "apollo-server-micro"

export type MongoDbDocumentData<T> = Omit<DocumentData<T>, "_id">
export type MongoDbDocument = Document & { _id: ObjectId }

export default class MongoDbAdapter<T extends Document>
  implements DatabaseAdapter<T> {
  constructor(private db: Db, private collection: Collection) {}

  async create(
    data: MongoDbDocumentData<T>,
    params?: CreateParams
  ): Promise<T> {
    const response = await this.db
      .collection(this.collection)
      .insertOne(
        {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {}
      )
      .then((_) => _.ops[0] as any)

    return this.parseOutput(response)
  }

  async update(
    id: ID,
    data: MongoDbDocumentData<T>,
    params?: UpdateParams
  ): Promise<T> {
    const response = await this.db
      .collection(this.collection)
      .findOneAndReplace(
        { _id: new ObjectId(id) },
        {
          ...data,
          updatedAt: new Date()
        },
        { returnOriginal: false }
      )
      .then((_) => _.value)

    return this.parseOutput(response)
  }

  async patch(
    id: ID,
    data: MongoDbDocumentData<T>,
    params?: PatchParams
  ): Promise<T> {
    const response = await this.db
      .collection(this.collection)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...data,
            updatedAt: new Date()
          }
        },
        { returnOriginal: false }
      )
      .then((_) => _.value)

    return this.parseOutput(response)
  }

  async remove(id: ID, params?: RemoveParams): Promise<T> {
    const response = await this.db
      .collection(this.collection)
      .findOneAndDelete({ _id: new ObjectId(id) }, {})
      .then((_) => _.value)

    return this.parseOutput(response)
  }

  async find(params: FindParams): Promise<Page<T>> {
    const filter = params?.filter || {}
    const sort = params?.sort || {}
    const skip = Math.max(params?.skip || 0, 0)
    const limit = Math.max(params?.limit || 30, -1)

    const cursor = this.db.collection(this.collection).find(filter)

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
    const response = await this.db
      .collection(this.collection)
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

  private parseOutput(response: MongoDbDocument): T {
    const { _id, createdAt, updatedAt, ...docData } = response

    return { id: _id.toHexString(), createdAt, updatedAt, ...docData } as T
  }
}
