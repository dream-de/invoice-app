import type { AuthUser } from "../models/user"
import { hasRole } from "../services/roles"

export function canAccessAccounting(user: AuthUser): boolean {
  return hasRole(user, ["owner", "admin", "accountant"])
}
