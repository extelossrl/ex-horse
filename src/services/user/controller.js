const EventStore = require("../../libraries/eventstore")
const { AuthenticationError, UserInputError } = require("apollo-server")

class ServiceController extends EventStore {
  $CREATE(data, { payload, aggregateId }) {
    if (data.find((user) => user.username === payload.username)) {
      return data
    }

    return [...data, { ...payload, _id: aggregateId }]
  }

  async signUp(username, password) {
    const psw = await this.context.$auth.hashPassword(password)
    const role = "MEMBER"

    const user = await super.create({ username, password: psw, role })

    if (user instanceof UserInputError) {
      throw new UserInputError(`User ${username} already exists.`)
    }

    return this.context.$auth.generateJWT({ id: user.id, username, role })
  }

  async signIn(username, password) {
    const psw = await this.context.$auth.hashPassword(password)
    const user = await this.get(null, { query: { username } }).catch((e) => e)

    await super.commit("LOGIN", user ? user.id : null, {
      username,
      password: psw
    })

    if (
      !user ||
      !(await this.context.$auth.comparePasswords(password, user.password))
    ) {
      throw new AuthenticationError("Invalid credentials.")
    }

    return this.context.$auth.generateJWT({
      id: user.id,
      username,
      role: user.role
    })
  }
}

module.exports = ServiceController
