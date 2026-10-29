import "server-only";
import type { AuthUser } from "@/types/auth";
import type { SessionRecord } from "./contracts";

export function validateSession(
  session: SessionRecord | null,
  user: AuthUser | null,
  now: Date = new Date(),
): AuthUser | null {
  if (!session || !user) {
    return null;
  }

  if (session.revokedAt !== null) {
    return null;
  }

  if (session.expiresAt.getTime() <= now.getTime()) {
    return null;
  }

  if (session.userId !== user.id) {
    return null;
  }

  if (!user.isActive) {
    return null;
  }

  return user;
}
