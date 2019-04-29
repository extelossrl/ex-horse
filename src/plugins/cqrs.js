const { gql } = require("apollo-server-micro")

module.exports = ({ typeDefs }) => {
  typeDefs.push(gql`
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
  `)
}
