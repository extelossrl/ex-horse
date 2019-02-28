const { gql } = require("apollo-server");

const typeDefs = gql`
  input TodoInput {
    title: String
    description: String
    isDone: Boolean
  }

  type Todo {
    _id: ID!
    title: String!
    description: String
    isDone: Boolean!
  }

  extend type Commands {
    TodoCreate: Todo! @Create(service: "Todo", input: "TodoInput")
  }

  extend type Queries {
    TodoFind: [Todo!]! @Find(service: "Todo", model: "Todo")
  }
`;

const resolvers = {
  Commands: {},
  Queries: {}
};

module.exports = { typeDefs, resolvers };
