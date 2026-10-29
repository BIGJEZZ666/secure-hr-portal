import "server-only";

import type { AuthUser, Permission, Role } from "@/types/auth";
import { hasPermission } from "@/lib/permissions/roles";

export type AuthorizationResult =
  | { allowed: true; user: AuthUser }
  | {
      allowed: false;
      reason: "unauthenticated" | "inactive" | "forbidden";
    };

/**
 * Check whether an already-authenticated user is active
 * and has the required permission.
 *
 * This function does NOT authenticate the user or load a session.
 * The caller must obtain the user from a trusted server-side
 * authentication service.
 */
export function authorize(
  user: AuthUser | null,
  permission: Permission,
): AuthorizationResult {
  if (!user) {
    return { allowed: false, reason: "unauthenticated" };
  }

  if (!user.isActive) {
    return { allowed: false, reason: "inactive" };
  }

  if (!hasPermission(user.role, permission)) {
    return { allowed: false, reason: "forbidden" };
  }

  return { allowed: true, user };
}

/**
 * Convenience check for role-specific server-side operations.
 * Use permissions for normal access control wherever possible.
 */
export function hasRole(
  user: AuthUser | null,
  roles: readonly Role[],
): boolean {
  return Boolean(
    user &&
      user.isActive &&
      roles.includes(user.role),
  );
}
