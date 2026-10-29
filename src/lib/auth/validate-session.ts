import "server-only";
import type { AuthUser } from "@/types/auth";
import type { SessionRecord } from "./contracts";

const MAX_INACTIVITY_MS = 30 * 24 * 60 * 60 * 1000;

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

  const lastSeenAt = session.lastSeenAt ?? session.createdAt;

  if (now.getTime() - lastSeenAt.getTime() > MAX_INACTIVITY_MS) {
    return null;
  }

  return user;
}
