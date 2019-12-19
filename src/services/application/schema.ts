import { gql } from "apollo-server-micro"
import { DateTimeResolver } from "graphql-scalars"

const typeDefs = gql`
  scalar Date

  interface Document {
    id: ID!
    createdAt: Date!
    updatedAt: Date!
  }

  interface Page {
    total: Int!
    limit: Int!
    skip: Int!
    data: [Document!]!
  }

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
`

const resolvers = {
  Date: DateTimeResolver,
  Document: {
    __resolveType(): null {
      return null
    }
  },
  Page: {
    __resolveType(): null {
      return null
    }
  }
}

export default { typeDefs, resolvers }
