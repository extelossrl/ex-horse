const { gql } = require("apollo-server");
const crudSchema = require("../../libraries/crud/schema");

const { typeDefsCRUD, resolversCRUD } = crudSchema("Todo");

const typeDefs = gql`
  input TodoInput {
    title: String
    description: String
    isDone: Boolean
  }

  type Todo {
    id: ID!
    title: String!
    description: String
    isDone: Boolean!
  }

  ${typeDefsCRUD}
`;

const resolvers = {
  Commands: {
    ...resolversCRUD.Commands
  },
  Queries: {
    ...resolversCRUD.Queries
  }
};

module.exports = { typeDefs, resolvers };
