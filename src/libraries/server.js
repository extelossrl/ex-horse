const { ApolloServer } = require("apollo-server")
const { MongoClient } = require("mongodb")
const { merge, defaultsDeep } = require("lodash")

module.exports = async function(config = {}) {
  const defaults = {
    database: {
      url: "mongodb://localhost",
      name: "ex-horse",
      collections: {
        meta: "meta",
        events: "events",
        snapshot: "snapshot",
        tasks: "tasks"
      },
      snapshotTrigger: 1
    },
    auth: {
      jwtSecret: "acquainbocca"
    },
    acl: {},
    cloudinary: {
      cloud_name: "carmhack",
      api_key: "99186189232618",
      api_secret: "52655b0d175d06660e55"
    },
    plugins: [],
    services: []
  }

  defaultsDeep(config, defaults)

  config.plugins.push(
    require("../plugins/cqrs"),
    require("../plugins/crud"),
    require("../plugins/date"),
    require("../plugins/json"),
    require("../plugins/authentication")
  )

  const client = await MongoClient.connect(config.database.url, {
    useNewUrlParser: true
  })
  const db = client.db(config.database.name)

  const context = {
    db,
    config,
    typeDefs: [],
    resolvers: [],
    schemaDirectives: {},
    dataSources: [],
    context: []
  }

  config.plugins.forEach((plugin) => {
    plugin(context)
  })

  config.services.forEach((service) => {
    context.typeDefs.push(service.schema.typeDefs)
    context.resolvers.push(service.schema.resolvers)
    context.dataSources.push((...args) => {
      const { name, controller: Controller, aggregate, model } = service
      return {
        [name]: new Controller(db, config.database, aggregate, model)
      }
    })
  })

  const server = new ApolloServer({
    typeDefs: context.typeDefs,
    resolvers: context.resolvers,
    schemaDirectives: context.schemaDirectives,
    dataSources(...args) {
      const toRet = {}

      for (const dataSource of context.dataSources) {
        merge(toRet, dataSource(...args))
      }

      return toRet
    },
    async context(...args) {
      const toRet = {}

      for (const ctx of context.context) {
        merge(toRet, await ctx(...args))
      }

      return toRet
    }
  })

  const { url } = await server.listen()

  console.log(`🐴 Server ready at ${url}`)
}
