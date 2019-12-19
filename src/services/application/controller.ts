import MongoDbAdapter from "../../libraries/adapters/mongodb"
import { ExHorseContext, Collection, Document } from "../../types"
import EventStoreAdapter from "../../libraries/adapters/event-store"

export default class ServiceController<
  T extends Document
> extends EventStoreAdapter<T> {
  constructor(
    protected context: ExHorseContext,
    db: any,
    collection: Collection
  ) {
    super(db, collection)
  }
}
