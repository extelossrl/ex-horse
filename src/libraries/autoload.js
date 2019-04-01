const path = require("path")
const glob = require("glob")

class AutoLoad {
  static services(db) {
    const config = {
      typeDefs: [],
      resolvers: [],
      dataSources: {}
    }

    glob
      .sync(path.resolve(__dirname, "../services/*/schema.js"))
      .concat(glob.sync(path.resolve("services/*/schema.js")))
      .forEach((file) => {
        const { typeDefs, resolvers } = require(file)

        config.typeDefs.push(typeDefs)
        config.resolvers.push(resolvers)
      })

    glob
      .sync(path.resolve(__dirname, "../services/*/controller?(.*).js"))
      .concat(glob.sync(path.resolve("services/*/controller?(.*).js")))
      .forEach((file) => {
        const Controller = require(file)
        const folder = path
          .basename(path.resolve(file, "../"))
          .toLocaleLowerCase()
        const service = folder.charAt(0).toUpperCase() + folder.slice(1)
        const model = (
          path
            .basename(file)
            .toLocaleLowerCase()
            .match(/controller\.([a-z]+)\.js/) || []
        )
          .slice(1)
          .pop()
        const key = model ? model.charAt(0).toUpperCase() + model.slice(1) : ""

        config.dataSources[`${service}${key}`] = new Controller(
          db,
          `${service}s`,
          model
        )
      })

    return config
  }

  static plugins() {
    const config = {
      typeDefs: [],
      resolvers: [],
      schemaDirectives: {},
      dataSources: {}
    }

    glob
      .sync(path.resolve(__dirname, "../plugins/*.js"))
      .concat(glob.sync(path.resolve("plugins/*.js")))
      .forEach((file) => {
        const install = require(file)
        install(config)
      })

    return config
  }
}

module.exports = AutoLoad
