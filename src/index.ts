import cors from "micro-cors"
import { ApolloServer } from "apollo-server-micro"
import { MongoClient } from "mongodb"
import config from "config"
import { getUser } from "./libraries/helpers"

import BaseService from "./services/application/schema"

import UserService from "./services/users/schema"
import UsersServiceController from "./services/users/controller"
import { EventBus } from "./libraries/event-bus"
import { getCookie, setCookie } from "./libraries/cookies"

const mongodb = new Promise(async (resolve, reject) => {
  const client = new MongoClient(config.get("db"), {
    useUnifiedTopology: true
  })
  await client.connect()
  resolve(await client.db())
})

const apolloServer = new ApolloServer({
  typeDefs: [BaseService.typeDefs, UserService.typeDefs],
  resolvers: [BaseService.resolvers, UserService.resolvers] as any,
  async context({ req, res }): Promise<any> {
    const db = await mongodb
    const ctx: any = {}

    req.cookie = getCookie(req)
    res.cookie = setCookie(res)

    ctx.req = req
    ctx.res = res
    ctx.events = new EventBus()
    ctx.user = getUser(req.headers.authorization)
    ctx.services = {
      users: new UsersServiceController(ctx, db)
    }

    return ctx
  }
})

export default cors()(apolloServer.createHandler())
