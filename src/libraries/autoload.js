const requireGlob = require("require-glob");

class AutoLoad {
  static async services(db) {
    const config = {
      typeDefs: [],
      resolvers: [],
      dataSources: {}
    };

    const schemas = await requireGlob(["../services/*/schema.js"]);
    const controllers = await requireGlob(["../services/*/controller.js"]);

    Object.entries(schemas).forEach(([key, value]) => {
      config.typeDefs.push(value.schema.typeDefs);
      config.resolvers.push(value.schema.resolvers);
    });

    Object.entries(controllers).forEach(([key, value]) => {
      const service = key.charAt(0).toUpperCase() + key.slice(1);
      // eslint-disable-next-line new-cap
      config.dataSources[service] = new value.controller(db, `${key}s`);
    });

    return config;
  }

  static async plugins() {
    const config = {
      typeDefs: [],
      resolvers: [],
      schemaDirectives: {},
      dataSources: {}
    };

    const plugins = await requireGlob(["../plugins/*.js"]);
    Object.entries(plugins).forEach(([key, value]) => value(config));

    return config;
  }
}

module.exports = AutoLoad;
