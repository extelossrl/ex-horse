const path = require("path")
const { ApolloServer } = require("apollo-server")
const { MongoClient } = require("mongodb")
const { getUser } = require("./libraries/authentication")
const AutoLoad = require("./libraries/autoload")
const config = require(path.resolve("./config"))

module.exports = async function(opts) {
  opts = opts || {}

  opts.autoload = opts.autoload || false
  opts.services = opts.services || []
  opts.plugins = opts.plugins || []

  opts.apollo = opts.apollo || {}
  opts.apollo.typeDefs = opts.apollo.typeDefs || []
  opts.apollo.resolvers = opts.apollo.resolvers || []
  opts.apollo.schemaDirectives = opts.apollo.schemaDirectives || {}
  opts.apollo.dataSources = opts.apollo.dataSources || {}
  opts.apollo.context = opts.apollo.context || {}

  const client = await MongoClient.connect(config.DATABASE_URL, {
    useNewUrlParser: true
  })

  const plugins = opts.autoload
    ? AutoLoad.plugins()
    : AutoLoad.fallbackPlugins()
  const services = opts.autoload
    ? AutoLoad.services(client.db(config.DATABASE_NAME), opts.services)
    : AutoLoad.fallbackServices(client.db(config.DATABASE_NAME), opts.plugins)

  const server = new ApolloServer({
    typeDefs: [
      ...plugins.typeDefs,
      ...services.typeDefs,
      ...opts.apollo.typeDefs
    ],
    resolvers: [
      ...plugins.resolvers,
      ...services.resolvers,
      ...opts.apollo.resolvers
    ],
    schemaDirectives: {
      ...plugins.schemaDirectives,
      ...opts.apollo.schemaDirectives
    },
    dataSources: () => ({
      ...plugins.dataSources,
      ...services.dataSources,
      ...opts.apollo.dataSources
    }),
    context: async ({ req, res, connection }) => ({
      user: await getUser(connection || req),
      ...opts.apollo.context
    })
  })

  const { url } = await server.listen()

  console.log(`🐴 Server ready at ${url}`)
}
