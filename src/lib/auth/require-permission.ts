import "server-only";

import { redirect } from "next/navigation";
import type { AuthUser, Permission } from "@/types/auth";
import { authorize } from "@/lib/auth/authorization";

/**
 * Replace this function with the real AuthService integration
 * once persistent session storage is available.
 *
 * It deliberately returns null so protected routes remain
 * inaccessible until authentication is implemented.
 */
async function getCurrentUser(): Promise<AuthUser | null> {
  return null;
}

export async function requirePermission(
  permission: Permission,
): Promise<AuthUser> {
  const user = await getCurrentUser();
  const result = authorize(user, permission);

  if (!result.allowed) {
    if (result.reason === "unauthenticated") {
      redirect("/login");
    }

    redirect("/access-denied");
  }

  return result.user;
}
