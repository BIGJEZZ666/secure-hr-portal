import { describe, expect, it } from "vitest";
import type { AuthUser } from "@/types/auth";
import type { SessionRecord } from "./contracts";
import { validateSession } from "./validate-session";

const now = new Date("2026-10-29T00:00:00.000Z");

const user: AuthUser = {
  id: "user-1",
  employeeId: "EMP-001",
  name: "Test User",
  email: "user@example.com",
  role: "EMPLOYEE",
  isActive: true,
  twoFactorEnabled: false,
};

const session: SessionRecord = {
  id: "session-1",
  userId: "user-1",
  tokenHash: "test-hash",
  createdAt: new Date("2026-10-28T23:00:00.000Z"),
  expiresAt: new Date("2026-10-29T08:00:00.000Z"),
  revokedAt: null,
  lastSeenAt: null,
};

describe("validateSession", () => {
  it("accepts a valid session and active user", () => {
    expect(validateSession(session, user, now)).toEqual(user);
  });

  it("rejects a missing session", () => {
    expect(validateSession(null, user, now)).toBeNull();
  });

  it("rejects a missing user", () => {
    expect(validateSession(session, null, now)).toBeNull();
  });

  it("rejects a revoked session", () => {
    expect(
      validateSession(
        { ...session, revokedAt: new Date("2026-10-29T00:00:00.000Z") },
        user,
        now,
      ),
    ).toBeNull();
  });

  it("rejects an expired session", () => {
    expect(
      validateSession(
        { ...session, expiresAt: now },
        user,
        now,
      ),
    ).toBeNull();
  });

  it("rejects a session belonging to another user", () => {
    expect(
      validateSession(
        session,
        { ...user, id: "user-2" },
        now,
      ),
    ).toBeNull();
  });

  it("rejects an inactive user", () => {
    expect(
      validateSession(session, { ...user, isActive: false }, now),
    ).toBeNull();
  });

  it("rejects a session inactive for more than 30 days", () => {
    expect(
      validateSession(
        {
          ...session,
          lastSeenAt: new Date("2026-09-28T23:59:59.999Z"),
        },
        user,
        now,
      ),
    ).toBeNull();
  });
});
