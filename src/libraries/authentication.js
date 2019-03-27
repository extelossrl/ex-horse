const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const config = require("../config")

/**
 * Helper methods to manage authentication
 *
 * @class Authentication
 */
class Authentication {
  /**
   * Verify a JWT token and get user information from it
   *
   * @static
   * @param {Object} source Source of the JWT Token, can be a Request Header or a WebSocket context
   * @returns {Promise} A Promise that returns an object with id, username and password if resolved
   * @memberof Authentication
   */
  static getUser(source) {
    try {
      source = source.context || source.headers

      return jwt.verify(
        source.authorization.replace("Bearer ", ""),
        config.JWT_SECRET
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
   * @static
   * @param {String} password Password that needs to be hashed
   * @returns {Promise} A Promise that returns the hash of the password if resolved
   * @memberof Authentication
   */
  static hashPassword(password) {
    return bcrypt.hash(password, 10)
  }

  /**
   * Compare two passwords to check if they are the same
   *
   * @static
   * @param {String} psw1 First password
   * @param {String} psw2 Second password
   * @returns {Promise} A Promise that returns a Boolean indicating if the passwords are the same or not
   * @memberof Authentication
   */
  static comparePasswords(psw1, psw2) {
    return bcrypt.compare(psw1, psw2)
  }

  /**
   * Generate a JWT Token containing the user information
   *
   * @static
   * @param {Object} payload
   * @returns {String} A JWT Token containing the user information
   * @memberof Authentication
   */
  static generateJWT(payload) {
    return jwt.sign(payload, config.JWT_SECRET)
  }

  /**
   * Hides the password from a User object
   *
   * @typedef {Object} User
   * @property {String} id ID of the user
   * @property {String} username Username of the user
   * @property {String} role Role of the user
   *
   * @static
   * @param {User} user User object whose password must be hidden
   * @returns {Object} A User object with and hidden password
   * @memberof Authentication
   */
  static hidePassword(user) {
    return { ...user, password: "**************" }
  }
}

module.exports = Authentication
