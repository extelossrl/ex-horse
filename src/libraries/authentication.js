const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")

/**
 * Helper methods to manage authentication
 *
 * @class Authentication
 */
class Authentication {
  constructor(config) {
    this.config = config
  }

  /**
   * Verify a JWT token and get user information from it
   *
   * @param {Object} source Source of the JWT Token, can be a Request Header or a WebSocket context
   * @returns {Promise} A Promise that returns an object with id, username and password if resolved
   * @memberof Authentication
   */
  getUser(source) {
    try {
      source = source.context || source.headers

      return jwt.verify(
        source.authorization.replace("Bearer ", ""),
        this.config.jwtSecret
      )
    } catch (error) {
      return {
        id: "c4rmh4ck-b357-y0u7ub3r-3u",
        username: "c4rmh4ck",
        role: "GUEST"
      }
    }
  }

  /**
   * Hash a password
   *
   * @param {String} password Password that needs to be hashed
   * @returns {Promise} A Promise that returns the hash of the password if resolved
   * @memberof Authentication
   */
  hashPassword(password) {
    return bcrypt.hash(password, 10)
  }

  /**
   * Compare two passwords to check if they are the same
   *
   * @param {String} psw1 First password
   * @param {String} psw2 Second password
   * @returns {Promise} A Promise that returns a Boolean indicating if the passwords are the same or not
   * @memberof Authentication
   */
  comparePasswords(psw1, psw2) {
    return bcrypt.compare(psw1, psw2)
  }

  /**
   * Generate a JWT Token containing the user information
   *
   * @param {Object} payload
   * @returns {String} A JWT Token containing the user information
   * @memberof Authentication
   */
  generateJWT(payload) {
    return jwt.sign(payload, this.config.jwtSecret)
  }

  /**
   * Hides the password from a User object
   *
   * @typedef {Object} User
   * @property {String} id ID of the user
   * @property {String} username Username of the user
   * @property {String} role Role of the user
   *
   * @param {User} user User object whose password must be hidden
   * @returns {Object} A User object with and hidden password
   * @memberof Authentication
   */
  hidePassword(user) {
    return { ...user, password: "**************" }
  }
}

module.exports = Authentication
