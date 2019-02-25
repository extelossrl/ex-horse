const EventStore = require("../../libraries/eventstore");
const { AuthenticationError, UserInputError } = require("apollo-server");
const {
  hashPassword,
  comparePasswords,
  generateJWT
} = require("../../libraries/authentication");

class ServiceController extends EventStore {
  $CREATE(stateCache, { payload, aggregateId }) {
    if (stateCache.find(user => user.username === payload.username)) {
      return stateCache;
    }

    return [...stateCache, { ...payload, _id: aggregateId }];
  }

  async signUp(username, password) {
    const psw = await hashPassword(password);
    const role = "RESOURCE";

    const user = await super.create({ username, password: psw, role });

    if (user instanceof UserInputError) {
      throw new UserInputError(`User ${username} already exists.`);
    }

    return generateJWT({ id: user.id, username, role });
  }

  async signIn(username, password) {
    const psw = await hashPassword(password);
    const user = await this.get(null, { query: { username } }).catch(e => e);

    await super.commit("LOGIN", user ? user.id : null, {
      username,
      password: psw
    });

    if (!user || !(await comparePasswords(password, user.password))) {
      throw new AuthenticationError("Invalid credentials.");
    }

    return generateJWT({ id: user.id, username, role: user.role });
  }
}

module.exports = ServiceController;
