---
sidebar:  auto
---

# Guide


## Introduction
ex-🐴 is a 100% equine serverless NodeJS backend framework featuring CQRS, Event Sourcing, Apollo GraphQL and MongoDB.


## Installation
If you want to install ex-horse you have to add it as a dependency to your project with:
``` bash
npm i ex-horse
```

You can scaffold the project by typing:
``` bash
npx ex-horse scaffold
```

Then put your MongoDB connection string in `src/config.js` and you are ready to go 🤙.


## Directory structure
::: vue
src
├── libraries
│  └── xxx.js
├── plugins
│  └── xxx.js
├── services
│  └── xxx
│     └── schema.js
│     └── controller.js
├── config.js
├── index.js
└── package.json
:::

- `src/libraries`: Files in this directory are mainly used by the framework to setup services, plugins, database communication and authentication.
- `src/plugins`: By creating files in this directory you can extend the functionality of the framework, every plugin must export a function that receives { typeDefs, resolvers, schemaDirectives, dataSources } as parameter. Some plugins are provided by default.
- `src/services`: This is where the core of the our application resides, every sub folder represent a services which must contain a schema.js (for type definitions and commands queries mapping) and a controller.js (for the business logic).
- `src/config.js`: Here you can configure some part of the application, like the database connection string, snapshot internal, etc.
- `src/index.js`: Entry point of the application.


## Services
Services are the core of ex-horse they can be created by adding a folder inside of the services directory. Each service must have `schema.js` and a `controller.js`.

You can generate a new service by typing: `npx ex-horse new service myService`

A schema must export a { typeDefs, resolvers } object which will be used to build a [GraphQL Schema](https://graphql.org/learn/schema/). Resolvers should be only used to map functions to the controller, in this way you can call functions across all services without redefining them everywhere:
```js
const { gql } = require("apollo-server-micro");

const typeDefs = gql`
  extend type Commands {
    Plus10(number: Int!): Int!
  }

  extend type Queries {
    HelloWorld: String
  }
`

const resolvers = {
  Commands: {
    Plus10(obj, args, context, info) {
      return context.dataSources.Example.Plus10(args.number)
    }
  },
  Queries: {
    HelloWorld(obj, args, context, info) {
      return context.dataSources.Example.HelloWorld()
    }
  }
};

module.exports = { typeDefs, resolvers };
```
``` js
const EventStore = require("../../libraries/eventstore");

class ServiceController extends EventStore {
  Plus10(number) {
    return number + 10
  }

  HelloWorld() {
    return "Hello World 🙂"
  }
}

module.exports = ServiceController;
```


## Plugins
In ex-horse you can use plugins to extend or modify the functionalities. Each plugin must export a function which receives { typeDefs, resolvers, schemaDirectives, dataSources } as parameter.

You can generate a new plugin by typing: `npx ex-horse new plugin myPlugin`


### cqrs
The CQRS is used to setup the GraphQL environment by initializing Mutation, Query and Subscription and respectively renaming them to Commands, Queries and Subscriptions.

### crud
This plugin adds the CRUD directives to ex-horse allowing you to directly bind CRUD methods to the commands and queries of the schema:
``` js
input TodoInput {
  title: String
  description: String
  isDone: Boolean
}

extend type Commands {
  TodoCreate: Todo!
    @Create(service: "Todo", input: "TodoInput")
}

extend type Queries {
  TodoFind: [Todo!]!
    @Find(service: "Todo", model: "Todo")
}
```

Here is a list of all available CRUD directives:
- `@Create(service: String!, input: String = "JSON")`
- `@Update(service: String!, input: String = "JSON")`
- `@Patch(service: String!, input: String = "JSON")`
- `@Remove(service: String!)`
- `@Find(service: String!, model: String)`
- `@Get(service: String!, model: String)`

For `@Find` and `@Get` you can specify a model name which will be used for the read model, this is particularly helpful when you are managing lots of data.


### acl
The acl plugin allows you to manage permissions across the application, it implements [CASL](https://stalniy.github.io/casl/) at its core. Abilities can be defined in `plugins/acl.js`:
``` js
const abilities = {
  ADMIN: AbilityBuilder.define(can => {
    can("manage", "all");
  }),
  MEMBER: AbilityBuilder.define(can => {
    can("read", "all");
  }),
  GUEST: AbilityBuilder.define(can => {
    can("read", "all");
  })
};
```

Then you can check permission directly in the `schema.js` of the services using the `Acl` schema directive:
``` js
type Todo {
  _id: ID!
  title: String!
    @Acl(action: "read", subject: "todo-title")
  description: String
  isDone: Boolean!
}

extend type Commands {
  TodoCreate: Todo!
    @Acl(action: "manage", subject: "todos")
}
```


### paginate
This plugin adds the `@Paginate` directive that allows you to integrate the pagination to the services. The `@Paginate` directive works by adding a `pagination` parameter to the Query where you can specify a cursor and a limit to control the pagination:
``` js
  extend type Queries {
    TodoFind: [Todo!]!
      @Find(service: "Todo", model: "Todo")
      @Paginate
  }
```
``` gql
{
  TodoFind(pagination: { cursor: "507f1f77bcf86cd799439011", limit: 5 }) {
    title
  }
}
```

### date
The date plugin allows you to use the Date type inside a GraphQL Schema.

### json
This plugin allows you to use the JSON type inside a GraphQL Schema.


## Libraries
Libraries are used internally to implement specific functionalities of the framework.

### eventstore
The eventstore library represent the implementation of Event Sourcing inside of ex-horse, you can refer to the [API Reference](/api/) for detailed information.


### authentication
This library provides useful functions that are used internally in ex-horse to manage the authentication:
- `getUser(source)`: Verify a JWT token and get user information from it.
- `hashPassword(password)`: Hash a password.
- `comparePasswords(psw1, psw2)`: Compare two passwords to check if they are the same.
- `generateJWT(payload)`: Generate a JWT Token containing the user information.
- `hidePassword(user)`: Hides the password from a User object.


### autoload
The autoload library allows ex-horse to automagically load services and plugins it uses a [glob pattern](https://www.npmjs.com/package/glob) to pick the correct files.

- All folders that are directly children of the services directory and contain a schema.js and a controller.js are considered valid services and will be automagically loaded.
- All javascript files that are directly children of the plugins directory are considered valid plugins and will be automagically loaded.
