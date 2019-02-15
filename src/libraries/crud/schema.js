const { gql } = require("apollo-server");

module.exports = function(namespace) {
  const typeDefsCRUD = gql`
    input ${namespace}PaginationOptions {
      cursor: ID
      limit: Int
    }

    input ${namespace}Pagination {
      query: JSON
      pagination: ${namespace}PaginationOptions
    }

    type ${namespace}Page {
      total: Int!
      cursor: ID!
      limit: Int!
      data: [${namespace}]!
    }

    extend type Commands {
      ${namespace}Create(input: ${namespace}Input!): ${namespace}!
      ${namespace}Update(id: ID!, input: ${namespace}Input!): ${namespace}!
      ${namespace}Patch(id: ID!, input: ${namespace}Input!): ${namespace}!
      ${namespace}Delete(id: ID!): ${namespace}!
    }

    extend type Queries {
      ${namespace}Find(input: ${namespace}Pagination): ${namespace}Page!
      ${namespace}Get(id: ID!): ${namespace}!
    }
  `;

  const resolversCRUD = {
    Commands: {
      [`${namespace}Create`]: async (obj, payload, context, info) => {
        // eslint-disable-next-line standard/computed-property-even-spacing
        [obj, payload, context, info] = context.dataSources[
          namespace
        ].beforeCreate(obj, payload, context, info);

        let created = await context.dataSources[namespace].create(
          payload.input
        );

        // eslint-disable-next-line standard/computed-property-even-spacing
        [obj, payload, context, info, created] = context.dataSources[
          namespace
        ].afterCreate(obj, payload, context, info, created);

        return created;
      },
      [`${namespace}Update`]: async (obj, { id, input }, context, info) => {
        return context.dataSources[namespace].update(id, input);
      },
      [`${namespace}Patch`]: async (obj, { id, input }, context, info) => {
        return context.dataSources[namespace].patch(id, input);
      },
      [`${namespace}Delete`]: async (obj, { id }, context, info) => {
        return context.dataSources[namespace].delete(id);
      }
    },
    Queries: {
      [`${namespace}Find`]: async (obj, { input }, context, info) => {
        return context.dataSources[namespace].find(input);
      },
      [`${namespace}Get`]: async (obj, { id }, context, info) => {
        return context.dataSources[namespace].get(id);
      }
    }
  };

  return { typeDefsCRUD, resolversCRUD };
};
