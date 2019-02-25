const { gql, SchemaDirectiveVisitor } = require("apollo-server");
const { defaultFieldResolver } = require("graphql");
const sift = require("sift").default;

class Paginate extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const paginationInput = this.schema.getType("PaginationInput");
    const fields = paginationInput.getFields();

    field.args.push({
      name: "pagination",
      type: paginationInput,
      defaultValue: {
        cursor: fields.cursor.defaultValue,
        limit: fields.limit.defaultValue
      }
    });

    field.type = this.schema.getType(this.args.output);

    const { resolve = defaultFieldResolver } = field;

    field.resolve = async function(...args) {
      const result = await resolve.apply(this, args);
      const { cursor, limit } = args[1].pagination;
      const page = result.filter(sift({ id: { $gt: cursor } })).slice(0, limit);
      const next = page.slice(-1).pop();

      return {
        total: result.length,
        limit,
        cursor: next ? next.id : "",
        data: page
      };
    };
  }
}

module.exports = ({ typeDefs, schemaDirectives }) => {
  typeDefs.push(gql`
    directive @Paginate(output: String = "JSON") on FIELD_DEFINITION

    input PaginationInput {
      cursor: ID! = ""
      limit: Int! = 10
    }

    # interface PaginationPage {
    #   cursor: ID!
    #   limit: Int!
    #   data: [JSON!]!
    #   total: Int!
    # }
  `);

  schemaDirectives.Paginate = Paginate;
};
