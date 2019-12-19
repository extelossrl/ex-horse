import jwt from "jsonwebtoken"
import { User } from "../types"

export function getUser(token: string): User {
  let user: User = {
    id: "000000000000000000000000",
    email: "guest@user.com",
    password: "🤫",
    role: "Guest",
    createdAt: new Date(0),
    updatedAt: new Date(0)
  }

  try {
    token = token.replace("Bearer", "").trim()
    user = jwt.decode(token) as User
  } catch (error) {}

  return user
}
