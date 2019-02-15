const { ApolloServer } = require("apollo-server");
const { MongoClient } = require("mongodb");
const { getUser } = require("./libraries/authentication");
const { typeDefs, resolvers, controllers } = require("./services/index");
const config = require("./config");

(async function() {
  const client = await MongoClient.connect(config.DATABASE_URL, {
    useNewUrlParser: true
  });

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => ({
      ...controllers(client.db(config.DATABASE_NAME))
    }),
    context: async ({ req, res, connection }) => ({
      user: await getUser(connection || req)
    })
  });

  const { url } = await server.listen();

  console.log(`🚀  Server ready at ${url}`);
})();
