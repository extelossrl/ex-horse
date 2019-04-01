const path = require("path")
const { ApolloServer } = require("apollo-server")
const { MongoClient } = require("mongodb")
const { getUser } = require("./libraries/authentication")
const AutoLoad = require("./libraries/autoload")
const config = require(path.resolve("./config"))

module.exports = async function() {
  const client = await MongoClient.connect(config.DATABASE_URL, {
    useNewUrlParser: true
  })

  const plugins = AutoLoad.plugins()
  const services = AutoLoad.services(client.db(config.DATABASE_NAME))

  const server = new ApolloServer({
    typeDefs: [...plugins.typeDefs, ...services.typeDefs],
    resolvers: [...services.resolvers, ...services.resolvers],
    schemaDirectives: {
      ...plugins.schemaDirectives
    },
    dataSources: () => ({
      ...plugins.dataSources,
      ...services.dataSources
    }),
    context: async ({ req, res, connection }) => ({
      user: await getUser(connection || req)
    })
  })

  const { url } = await server.listen()

  console.log(`🐴 Server ready at ${url}`)
}
