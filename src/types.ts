import { EventBus } from "./libraries/event-bus"
import { Response, Request } from "node-fetch"

export interface ExHorseContext {
  req: Request
  res: Response
  services: Services
  events: EventBus
  user: User
}

export interface User {
  id: ID
  createdAt: Date
  updatedAt: Date
  email: string
  password: string
  role: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Services {}

export type ID = string
export type FilterOptions = { [key: string]: any }
export type SortOptions = { [key: string]: "asc" | "desc" }
export type Collection = string

export type DocumentData<T> = Omit<T, "id" | "createdAt" | "updatedAt">

export interface Document {
  id: ID
  createdAt: Date
  updatedAt: Date
}

export interface Page<T> {
  total: number
  limit: number
  skip: number
  data: T[]
}

export interface CreateParams {
  query?: FindParams
}

export interface UpdateParams {
  query?: FindParams
}

export interface PatchParams {
  query?: FindParams
}

export interface RemoveParams {
  query?: FindParams
}

export interface FindParams {
  filter?: FilterOptions
  sort?: SortOptions
  page?: number
  skip?: number
  limit?: number
}

export interface GetParams {
  query?: FindParams
}

export enum DatabaseMethod {
  "create" = "create",
  "update" = "update",
  "patch" = "patch",
  "remove" = "remove",
  "find" = "find",
  "get" = "ge"
}

export interface DatabaseAdapter<T extends Document> {
  create(data: DocumentData<T>, params?: CreateParams): Promise<T>

  update(id: ID, data: DocumentData<T>, params?: UpdateParams): Promise<T>

  patch(id: ID, data: DocumentData<T>, params?: PatchParams): Promise<T>

  remove(id: ID, params?: RemoveParams): Promise<T>

  find(params: FindParams): Promise<Page<T>>

  get(id: ID, params?: GetParams): Promise<T>
}
