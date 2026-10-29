import "server-only";

import { db } from "@/lib/db";
import type {
  StoredUser,
  UserRepository,
} from "@/lib/auth/contracts";
import type { Role } from "@/types/auth";

interface EmployeeRow {
  employee_id: number;
  employee_name: string | null;
  employee_email: string;
  password_hash: string;
  role_name: string | null;
  is_active: number | boolean;
}

function parseRole(value: string | null): Role | null {
  switch (value?.trim().toUpperCase()) {
    case "CEO":
      return "CEO";
    case "HR":
      return "HR";
    case "EMPLOYEE":
      return "EMPLOYEE";
    default:
      return null;
  }
}

function mapEmployee(row: EmployeeRow): StoredUser | null {
  const name = row.employee_name?.trim();
  const role = parseRole(row.role_name);

  // Do not authenticate incomplete or incorrectly configured accounts.
  if (!name || !role) {
    return null;
  }

  return {
    id: String(row.employee_id),
    employeeId: String(row.employee_id),
    name,
    email: row.employee_email,
    role,
    isActive: Number(row.is_active) === 1,
    twoFactorEnabled: false,
    passwordHash: row.password_hash,
  };
}

const employeeSelect = `
  SELECT
    e.employee_id,
    e.employee_name,
    e.employee_email,
    e.password AS password_hash,
    e.is_active,
    r.role_name
  FROM tb_employee AS e
  LEFT JOIN tb_role AS r
    ON r.role_id = e.role_id
`;

export const userRepository: UserRepository = {
  async findById(id: string): Promise<StoredUser | null> {
    if (!/^\d+$/.test(id)) {
      return null;
    }

    const rows = await db.query(
      `${employeeSelect}
       WHERE e.employee_id = ?
       LIMIT 1`,
      [Number(id)],
    ) as EmployeeRow[];

    return rows.length > 0 ? mapEmployee(rows[0]) : null;
  },

  async findByEmail(email: string): Promise<StoredUser | null> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return null;
    }

    const rows = await db.query(
      `${employeeSelect}
       WHERE e.employee_email = ?
       LIMIT 1`,
      [normalizedEmail],
    ) as EmployeeRow[];

    return rows.length > 0 ? mapEmployee(rows[0]) : null;
  },
};
