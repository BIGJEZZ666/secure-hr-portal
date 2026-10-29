import { describe, expect, it } from "vitest";
import { authorizeEmployeeResource } from "./resource-authorization";
import type { AuthUser } from "@/types/auth";

function makeUser(
  overrides: Partial<AuthUser> = {},
): AuthUser {
  return {
    id: "user-1",
    employeeId: "EMP001",
    name: "Test User",
    email: "test@example.com",
    role: "EMPLOYEE",
    isActive: true,
    twoFactorEnabled: true,
    ...overrides,
  };
}

describe("Employee resource authorization", () => {
  it("rejects unauthenticated users", () => {
    expect(
      authorizeEmployeeResource(null, "EMP001"),
    ).toEqual({
      allowed: false,
      reason: "unauthenticated",
    });
  });

  it("rejects inactive accounts", () => {
    expect(
      authorizeEmployeeResource(
        makeUser({ isActive: false }),
        "EMP001",
      ),
    ).toEqual({
      allowed: false,
      reason: "inactive",
    });
  });

  it("allows employees to access their own resource", () => {
    expect(
      authorizeEmployeeResource(
        makeUser(),
        "EMP001",
      ),
    ).toEqual({ allowed: true });
  });

  it("rejects employees accessing another employee's resource", () => {
    expect(
      authorizeEmployeeResource(
        makeUser(),
        "EMP002",
      ),
    ).toEqual({
      allowed: false,
      reason: "forbidden",
    });
  });

  it("allows HR according to the current example policy", () => {
    expect(
      authorizeEmployeeResource(
        makeUser({ role: "HR" }),
        "EMP002",
      ),
    ).toEqual({ allowed: true });
  });

  it("allows CEO according to the current example policy", () => {
    expect(
      authorizeEmployeeResource(
        makeUser({ role: "CEO" }),
        "EMP002",
      ),
    ).toEqual({ allowed: true });
  });
});
