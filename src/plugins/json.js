const { gql } = require("apollo-server-micro")
const GraphQLToolsTypes = require("graphql-tools-types")

module.exports = ({ typeDefs, resolvers }) => {
  typeDefs.push(gql`
    scalar JSON
  `)

  resolvers.push({
    JSON: GraphQLToolsTypes.JSON({ name: "JSON" })
  })
}
