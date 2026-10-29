export const ROLES = ["CEO", "HR", "EMPLOYEE"] as const;

export type Role = (typeof ROLES)[number];

export interface AuthUser {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date | string | null;
  lastActivityAt?: Date | string | null;
}

export type Permission =
  | "index:view"
  | "events:view"
  | "events:manage"
  | "dashboard:view";
