const schemas = [
  require("./root/schema"),
  require("./todo/schema"),
  require("./user/schema")
];

const controllers = db => ({
  Root: new (require("./root/controller"))(db, "ROOT"),
  Todo: new (require("./todo/controller"))(db, "TODO"),
  User: new (require("./user/controller"))(db, "USER")
});

const typeDefs = schemas.map(schema => schema.typeDefs);
const resolvers = schemas.map(schema => schema.resolvers);

module.exports = { typeDefs, resolvers, controllers };
