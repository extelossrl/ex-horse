const { gql } = require("apollo-server");

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    password: String!
  }

  extend type Commands {
    UserSignUp(username: String!, password: String!): String!
    UserSignIn(username: String!, password: String!): String!
  }
`;

const resolvers = {
  Commands: {
    UserSignUp: async (obj, { username, password }, context, info) => {
      return context.dataSources.User.signUp(username, password);
    },
    UserSignIn: async (obj, { username, password }, context, info) => {
      return context.dataSources.User.signIn(username, password);
    }
  },
  Queries: {}
};

module.exports = { typeDefs, resolvers };
