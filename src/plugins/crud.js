const { gql, SchemaDirectiveVisitor } = require("apollo-server")

class Create extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const service = this.args.service
    const input = this.args.input

    field.args.push(
      { name: "data", type: this.schema.getType(input) },
      { name: "params", type: this.schema.getType("FindInput") }
    )

    field.resolve = async (parent, { data, params }, context, info) => {
      return context.dataSources[service].create(data, params)
    }
  }
}

class Update extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const service = this.args.service
    const input = this.args.input

    field.args.push(
      { name: "id", type: this.schema.getType("ID") },
      { name: "data", type: this.schema.getType(input) },
      { name: "params", type: this.schema.getType("FindInput") }
    )

    field.resolve = (parent, { id, data, params }, context, info) => {
      return context.dataSources[service].update(id, data, params)
    }
  }
}

class Patch extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const service = this.args.service
    const input = this.args.input

    field.args.push(
      { name: "id", type: this.schema.getType("ID") },
      { name: "data", type: this.schema.getType(input) },
      { name: "params", type: this.schema.getType("FindInput") }
    )

    field.resolve = (parent, { id, data, params }, context, info) => {
      return context.dataSources[service].patch(id, data, params)
    }
  }
}

class Remove extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const service = this.args.service

    field.args.push(
      { name: "id", type: this.schema.getType("ID") },
      { name: "params", type: this.schema.getType("FindInput") }
    )

    field.resolve = (parent, { id, params }, context, info) => {
      return context.dataSources[service].remove(id, params)
    }
  }
}

class Find extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const service = this.args.service

    field.args.push({ name: "params", type: this.schema.getType("FindInput") })

    field.resolve = (parent, { params }, context, info) => {
      return context.dataSources[service].find(params)
    }
  }
}

class Get extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const service = this.args.service

    field.args.push(
      { name: "id", type: this.schema.getType("ID") },
      { name: "params", type: this.schema.getType("FindInput") }
    )

    field.resolve = (parent, { id, params }, context, info) => {
      return context.dataSources[service].get(id, params)
    }
  }
}

module.exports = ({ typeDefs, schemaDirectives }) => {
  typeDefs.push(gql`
    directive @Create(
      service: String!
      input: String = "JSON"
    ) on FIELD_DEFINITION
    directive @Update(
      service: String!
      input: String = "JSON"
    ) on FIELD_DEFINITION
    directive @Patch(
      service: String!
      input: String = "JSON"
    ) on FIELD_DEFINITION
    directive @Remove(service: String!) on FIELD_DEFINITION
    directive @Find(service: String!) on FIELD_DEFINITION
    directive @Get(service: String!) on FIELD_DEFINITION

    input PageInput {
      cursor: ID = "000000000000000000000000"
      limit: Int = 30
    }

    input FindInput {
      query: JSON
      page: PageInput
      sort: JSON
      project: JSON
    }

    type Page {
      total: Int!
      limit: Int!
      cursor: ID!
      data: JSON!
    }
  `)

  schemaDirectives.Create = Create
  schemaDirectives.Update = Update
  schemaDirectives.Patch = Patch
  schemaDirectives.Remove = Remove
  schemaDirectives.Find = Find
  schemaDirectives.Get = Get
}
