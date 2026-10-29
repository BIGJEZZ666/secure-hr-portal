import type { Permission, Role } from "@/types/auth";

export const ROLE_PERMISSIONS = {
  CEO: [
    "index:view",
    "events:view",
    "events:manage",
    "dashboard:view",
  ],
  HR: [
    "index:view",
    "events:view",
    "events:manage",
  ],
  EMPLOYEE: [
    "index:view",
    "events:view",
  ],
} as const satisfies Record<Role, readonly Permission[]>;

export function hasPermission(
  role: Role,
  permission: Permission,
): boolean {
  const permissions: readonly Permission[] = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}
