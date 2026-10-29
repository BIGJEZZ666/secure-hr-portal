import "server-only";

import { db } from "@/lib/db";
import type {
  StoredUser,
  UserRepository,
} from "@/lib/auth/contracts";
import type { Role } from "@/types/auth";

const roleIdByName: Record<Role, number> = {
  CEO: 1,
  HR: 2,
  EMPLOYEE: 3,
};

function roleFromId(value: number): Role | null {
  switch (value) {
    case 1:
      return "CEO";
    case 2:
      return "HR";
    case 3:
      return "EMPLOYEE";
    default:
      return null;
  }
}

interface EmployeeRow {
  employee_id: number;
  employee_name: string | null;
  employee_email: string;
  password_hash: string;
  role_name: string | null;
  is_active: number | boolean;
  two_factor_enabled?: number | boolean;
  last_activity_at?: string | null;
  last_login_at?: string | null;
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
    twoFactorEnabled: Number(row.two_factor_enabled ?? 0) === 1,
    lastLoginAt: row.last_login_at ?? null,
    lastActivityAt: row.last_activity_at ?? null,
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
    e.two_factor_enabled,
    e.last_login_at,
    e.last_activity_at,
    r.role_name
  FROM tb_employee AS e
  LEFT JOIN tb_role AS r
    ON r.role_id = e.role_id
`;

function getRoleName(role: Role): string {
  return role.toUpperCase();
}

export const userRepository: UserRepository = {
  async create(input): Promise<StoredUser> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const roleId = roleIdByName[input.role ?? "EMPLOYEE"];

    const result = await db.query(
      `INSERT INTO tb_employee (
        employee_name,
        employee_email,
        password,
        role_id,
        is_active,
        two_factor_enabled,
        last_login_at,
        last_activity_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 1, 0, NOW(), NOW(), NOW(), NOW())`,
      [
        input.name.trim(),
        normalizedEmail,
        input.passwordHash,
        roleId,
      ],
    );

    const insertId = Number(
      Array.isArray((result as { insertId?: number }).insertId)
        ? (result as { insertId?: number }).insertId
        : (result as { insertId?: number }).insertId,
    );

    const row = await db.query(
      `${employeeSelect} WHERE e.employee_id = ? LIMIT 1`,
      [insertId],
    ) as EmployeeRow[];

    if (row.length === 0) {
      throw new Error("Failed to fetch created user");
    }

    const mapped = mapEmployee(row[0]);
    if (!mapped) {
      throw new Error("Created user is invalid");
    }

    return mapped;
  },

  async listAll(): Promise<StoredUser[]> {
    const rows = await db.query(
      `${employeeSelect} ORDER BY e.employee_id ASC`,
    ) as EmployeeRow[];

    return rows
      .map((row) => mapEmployee(row))
      .filter((row): row is StoredUser => row !== null);
  },

  async updateRole(id: string, role: Role): Promise<StoredUser | null> {
    if (!/^\d+$/.test(id)) {
      return null;
    }

    const roleId = roleIdByName[role];

    await db.query(
      `UPDATE tb_employee SET role_id = ?, updated_at = NOW() WHERE employee_id = ?`,
      [roleId, Number(id)],
    );

    return this.findById(id);
  },

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
