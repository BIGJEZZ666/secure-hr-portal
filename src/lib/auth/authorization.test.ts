import { describe, expect, it } from "vitest";
import { authorize } from "./authorization";
import type { AuthUser } from "@/types/auth";

const makeUser = (
  overrides: Partial<AuthUser> = {},
): AuthUser => ({
  id: "test-user-1",
  employeeId: "EMP001",
  name: "Test User",
  email: "test@example.com",
  role: "CEO",
  isActive: true,
  twoFactorEnabled: true,
  ...overrides,
});

describe("Authorization security checks", () => {
  it("rejects unauthenticated users", () => {
    expect(authorize(null, "dashboard:view")).toEqual({
      allowed: false,
      reason: "unauthenticated",
    });
  });

  it("rejects inactive accounts", () => {
    expect(
      authorize(
        makeUser({ isActive: false }),
        "dashboard:view",
      ),
    ).toEqual({
      allowed: false,
      reason: "inactive",
    });
  });

  it("rejects employees from the CEO dashboard", () => {
    expect(
      authorize(
        makeUser({ role: "EMPLOYEE" }),
        "dashboard:view",
      ),
    ).toEqual({
      allowed: false,
      reason: "forbidden",
    });
  });

  it("allows an active CEO to access the dashboard", () => {
    const user = makeUser();
    expect(authorize(user, "dashboard:view")).toEqual({
      allowed: true,
      user,
    });
  });
});
