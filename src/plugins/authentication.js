const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")

class Auth {
  constructor(config) {
    this.config = config
  }

  getUser(source) {
    try {
      source = source.context || source.headers

      return jwt.verify(
        source.authorization.replace("Bearer ", ""),
        this.config.secret
      )
    } catch (error) {
      return {
        id: "c4rmh4ck-b357-y0u7ub3r-3u",
        username: "c4rmh4ck",
        role: "GUEST"
      }
    }
  }

  hashPassword(password) {
    return bcrypt.hash(password, 10)
  }

  comparePasswords(psw1, psw2) {
    return bcrypt.compare(psw1, psw2)
  }

  generateJWT(payload) {
    return jwt.sign(payload, this.config.secret)
  }

  hidePassword(user) {
    return { ...user, password: "**************" }
  }
}

module.exports = ({ context, config }) => {
  const auth = new Auth(config.auth)

  context.push(async ({ req, res, connection }) => ({
    user: await auth.getUser(connection || req),
    $auth: auth
  }))
}
