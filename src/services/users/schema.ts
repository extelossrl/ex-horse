import { gql } from "apollo-server-micro"
import { QueriesResolvers, CommandsResolvers } from "../../generated/graphql"

const typeDefs = gql`
  enum UserRole {
    Guest
    Member
    Admin
  }

  type User implements Document {
    id: ID!
    createdAt: Date!
    updatedAt: Date!

    email: String!
    password: String!
    role: UserRole!
  }

  type UserPage implements Page {
    total: Int!
    limit: Int!
    skip: Int!
    data: [User!]!
  }

  extend type Queries {
    UserFind: UserPage!
  }

  extend type Commands {
    UserSignIn(email: String!, password: String!): String!
    UserSignUp(email: String!, password: String!): User!
  }
`
const Commands: CommandsResolvers = {
  UserSignUp(obj, args, context, info) {
    return context.services.users.signUp(args.email, args.password)
  },
  UserSignIn(obj, args, context, info) {
    return context.services.users.signIn(args.email, args.password)
  }
}

const Queries: QueriesResolvers = {
  // UserFind(obj, args, context, info) {
  //   console.log(context)
  // }
}

export default { typeDefs, resolvers: { Commands, Queries } }
