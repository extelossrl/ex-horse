const { gql } = require("apollo-server-micro")

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
    TodoUpdate: Todo! @Update(service: "Todo", input: "TodoInput")
    TodoPatch: Todo! @Patch(service: "Todo", input: "TodoInput")
    TodoRemove: Todo! @Remove(service: "Todo")
  }

  extend type Queries {
    TodoFind: Page @Find(service: "Todo")
  }
`

const resolvers = {
  Commands: {},
  Queries: {}
}

module.exports = { typeDefs, resolvers }
