import { describe, expect, it } from "vitest";
import { hasPermission } from "./roles";
import type { Permission, Role } from "@/types/auth";

describe("Role permissions", () => {
  const cases: {
    role: Role;
    permission: Permission;
    expected: boolean;
  }[] = [
    { role: "CEO", permission: "dashboard:view", expected: true },
    { role: "CEO", permission: "events:manage", expected: true },
    { role: "HR", permission: "dashboard:view", expected: false },
    { role: "HR", permission: "events:manage", expected: true },
    { role: "EMPLOYEE", permission: "events:view", expected: true },
    { role: "EMPLOYEE", permission: "events:manage", expected: false },
  ];

  it.each(cases)(
    "$role permission $permission should be $expected",
    ({ role, permission, expected }) => {
      expect(hasPermission(role, permission)).toBe(expected);
    },
  );
});
