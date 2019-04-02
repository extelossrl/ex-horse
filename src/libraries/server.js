const { ApolloServer } = require("apollo-server")
const { MongoClient } = require("mongodb")
const { merge, mergeWith, isArray } = require("lodash")

module.exports = async function(config = {}) {
  const defaults = {
    database: {
      url:
        "mongodb://new-user_31:mAjvihUkOLbGAsvX@cluster0-shard-00-00-jndlt.mongodb.net:27017,cluster0-shard-00-01-jndlt.mongodb.net:27017,cluster0-shard-00-02-jndlt.mongodb.net:27017/staes_be?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true",
      name: "ex-horse",
      collections: {
        meta: "meta",
        events: "events",
        snapshot: "snapshot"
      },
      snapshotTrigger: 1
    },
    authentication: {
      jwtSecret: "acquainbocca"
    },
    acl: {},
    cloudinary: {},
    plugins: [
      require("../plugins/cqrs"),
      require("../plugins/crud"),
      require("../plugins/date"),
      require("../plugins/json")
    ],
    services: []
  }

  mergeWith(config, defaults, (objValue, srcValue) => {
    if (isArray(objValue)) {
      return objValue.concat(srcValue)
    }
  })

  const client = await MongoClient.connect(config.database.url, {
    useNewUrlParser: true
  })
  const db = client.db(config.database.name)

  const context = {
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

      toRet.config = config

      return toRet
    }
  })

  const { url } = await server.listen()

  console.log(`🐴 Server ready at ${url}`)
}
