import ServiceController from "../application/controller"
import config from "config"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { ExHorseContext } from "../../types"
import { User, UserRole } from "../../generated/graphql"
import { AuthenticationError, UserInputError } from "apollo-server-micro"

export default class UsersServiceController extends ServiceController<User> {
  constructor(context: ExHorseContext, db: any) {
    super(context, db, "users")
  }

  async signUp(email: string, password: string): Promise<User> {
    const duplicatedUser = await this.get("", {
      query: { filter: { email } }
    }).catch(() => null)

    if (duplicatedUser) {
      throw new UserInputError("This email address has already been used")
    }

    const user = await this.create({
      email: email.toLocaleLowerCase(),
      password: await bcrypt.hash(password, config.get("authentication.salt")),
      role: UserRole.Member
    })

    return this.hidePassword(user)
  }

  async signIn(email: string, password: string): Promise<string> {
    const user = await this.get("", {
      query: {
        filter: {
          email
        }
      }
    })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AuthenticationError("Invalid email or password")
    }

    const token = jwt.sign(
      this.hidePassword(user),
      config.get("authentication.secret"),
      {
        expiresIn: config.get("authentication.tokenDuration")
      }
    )

    return token
  }

  private hidePassword(user: User): User {
    return {
      ...user,
      password: "🤫"
    }
  }
}

declare module "../../types" {
  interface Services {
    users: UsersServiceController
  }
}
