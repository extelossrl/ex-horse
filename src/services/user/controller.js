const EventStore = require("../../libraries/eventstore")
const { AuthenticationError, UserInputError } = require("apollo-server")
const Authentication = require("../../libraries/authentication")

class ServiceController extends EventStore {
  constructor(...args) {
    super(...args)
    this.authentication = new Authentication(this.context.config.authentication)
  }

  $CREATE(data, { payload, aggregateId }) {
    if (data.find((user) => user.username === payload.username)) {
      return data
    }

    return [...data, { ...payload, _id: aggregateId }]
  }

  async signUp(username, password) {
    const psw = await this.authentication.hashPassword(password)
    const role = "MEMBER"

    const user = await super.create({ username, password: psw, role })

    if (user instanceof UserInputError) {
      throw new UserInputError(`User ${username} already exists.`)
    }

    return this.authentication.generateJWT({ id: user.id, username, role })
  }

  async signIn(username, password) {
    const psw = await this.authentication.hashPassword(password)
    const user = await this.get(null, { query: { username } }, "User").catch(
      (e) => e
    )

    await super.commit("LOGIN", user ? user.id : null, {
      username,
      password: psw
    })

    if (
      !user ||
      !(await this.authentication.comparePasswords(password, user.password))
    ) {
      throw new AuthenticationError("Invalid credentials.")
    }

    return this.authentication.generateJWT({
      id: user.id,
      username,
      role: user.role
    })
  }
}

module.exports = ServiceController
