import "server-only";

import { redirect } from "next/navigation";
import type { AuthUser, Permission } from "@/types/auth";
import { authorize } from "@/lib/auth/authorization";
import { authService } from "@/lib/auth/auth-service";

export async function requirePermission(
  permission: Permission,
): Promise<AuthUser> {
  const user = await authService.getCurrentUser();
  const result = authorize(user, permission);

  if (!result.allowed) {
    if (result.reason === "unauthenticated") {
      redirect("/login");
    }

    redirect("/index?accessDenied=1");
  }

  return result.user;
}
