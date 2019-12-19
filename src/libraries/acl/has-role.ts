import { ForbiddenError } from "apollo-server-micro"
import { User } from "../../types"

export default function(user: User, role: string): void {
  if (user.role !== role) {
    throw new ForbiddenError(
      "You don't have permission to access this resource"
    )
  }
}
