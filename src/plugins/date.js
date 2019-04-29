const { gql } = require("apollo-server-micro")
const GraphQLToolsTypes = require("graphql-tools-types")

module.exports = ({ typeDefs, resolvers }) => {
  typeDefs.push(gql`
    scalar Date
  `)

  resolvers.push({
    Date: GraphQLToolsTypes.Date({ name: "Date" })
  })
}
