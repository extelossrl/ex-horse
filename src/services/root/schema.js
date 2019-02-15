const GraphQLToolsTypes = require("graphql-tools-types");
const { gql } = require("apollo-server");

const typeDefs = gql`
  scalar Date
  scalar JSON

  type Commands {
    _: Boolean
  }

  type Queries {
    _: Boolean
  }

  type Subscriptions {
    _: Boolean
  }

  schema {
    mutation: Commands
    query: Queries
    subscription: Subscriptions
  }
`;

const resolvers = {
  Date: GraphQLToolsTypes.Date({ name: "Date" }),
  JSON: GraphQLToolsTypes.JSON({ name: "MyJSON" })
};

module.exports = { typeDefs, resolvers };
