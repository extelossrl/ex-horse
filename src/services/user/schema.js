const { gql } = require("apollo-server");
const crudSchema = require("../../libraries/crud/schema");

const { typeDefsCRUD, resolversCRUD } = crudSchema("User");

const typeDefs = gql`
  enum UserRole {
    ADMIN
    RESOURCE
    GUEST
  }

  input UserInput {
    username: String
    password: String
    role: UserRole
  }

  type User {
    id: ID!
    username: String!
    password: String!
    role: UserRole!
  }

  extend type Commands {
    UserSignUp(username: String!, password: String!): String!
    UserSignIn(username: String!, password: String!): String!
  }

  ${typeDefsCRUD}
`;

const resolvers = {
  Commands: {
    UserSignUp: async (obj, { username, password }, context, info) => {
      return context.dataSources.User.signUp(username, password);
    },
    UserSignIn: async (obj, { username, password }, context, info) => {
      return context.dataSources.User.signIn(username, password);
    },
    ...resolversCRUD.Commands
  },
  Queries: {
    ...resolversCRUD.Queries
  }
};

module.exports = { typeDefs, resolvers };
