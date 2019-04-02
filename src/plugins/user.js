const Authentication = require("../libraries/authentication")

module.exports = ({ context, config }) => {
  const authentication = new Authentication(config.authentication)

  context.push(async ({ req, res, connection }) => ({
    user: await authentication.getUser(connection || req)
  }))
}
