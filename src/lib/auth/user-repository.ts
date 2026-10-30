import "server-only";

import { db } from "@/lib/db";
import { sessionStore } from "@/lib/auth/session-store";
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
  two_factor_secret?: string | null;
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
    totpSecret: row.two_factor_secret ?? null,
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
    e.two_factor_secret,
    e.last_login_at,
    e.last_activity_at,
    r.role_name
  FROM tb_employee AS e
  LEFT JOIN tb_role AS r
    ON r.role_id = e.role_id
`;

const roleIdByName: Record<Role, number> = {
  CEO: 1,
  HR: 2,
  EMPLOYEE: 3,
};

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

    await sessionStore.revokeAllForUser(id);
    return this.findById(id);
  },

  async recordActivity(id: string): Promise<void> {
    if (!/^\d+$/.test(id)) {
      return;
    }

    await db.query(
      `UPDATE tb_employee
       SET last_activity_at = UTC_TIMESTAMP()
       WHERE employee_id = ?
         AND (last_activity_at IS NULL
           OR last_activity_at < UTC_TIMESTAMP() - INTERVAL 5 MINUTE)`,
      [Number(id)],
    );
  },

  async recordLogin(id: string): Promise<void> {
    if (!/^\d+$/.test(id)) {
      throw new Error("Invalid user ID");
    }

    await db.query(
      `UPDATE tb_employee
       SET last_login_at = UTC_TIMESTAMP(),
           last_activity_at = UTC_TIMESTAMP()
       WHERE employee_id = ? AND is_active = 1`,
      [Number(id)],
    );
  },

  async setPendingTotpSecret(id: string, secret: string): Promise<void> {
    if (!/^\d+$/.test(id) || !secret) {
      throw new Error("Invalid TOTP enrollment request");
    }

    await db.query(
      `UPDATE tb_employee
       SET two_factor_pending_secret = ?
       WHERE employee_id = ? AND is_active = 1`,
      [secret, Number(id)],
    );
  },

  async getPendingTotpSecret(id: string): Promise<string | null> {
    if (!/^\d+$/.test(id)) {
      return null;
    }

    const rows = await db.query(
      `SELECT two_factor_pending_secret
       FROM tb_employee
       WHERE employee_id = ? AND is_active = 1
       LIMIT 1`,
      [Number(id)],
    ) as { two_factor_pending_secret: string | null }[];

    return rows[0]?.two_factor_pending_secret ?? null;
  },

  async enableTotp(id: string): Promise<void> {
    if (!/^\d+$/.test(id)) {
      throw new Error("Invalid user ID");
    }

    await db.query(
      `UPDATE tb_employee
       SET two_factor_secret = two_factor_pending_secret,
           two_factor_pending_secret = NULL,
           two_factor_enabled = 1,
           updated_at = UTC_TIMESTAMP()
       WHERE employee_id = ?
         AND two_factor_pending_secret IS NOT NULL
         AND is_active = 1`,
      [Number(id)],
    );
  },

  async deactivateInactiveUsers(inactiveDays: number): Promise<number> {
    if (!Number.isInteger(inactiveDays) || inactiveDays < 30 || inactiveDays > 60) {
      throw new Error("Inactive account threshold must be between 30 and 60 days");
    }

    const cutoff = `UTC_TIMESTAMP() - INTERVAL ${inactiveDays} DAY`;
    const deactivated = await db.query(
      `UPDATE tb_employee
       SET is_active = 0, updated_at = UTC_TIMESTAMP()
       WHERE is_active = 1
         AND COALESCE(last_activity_at, last_login_at, created_at) < ${cutoff}`,
    ) as { affectedRows?: number };

    await db.query(
      `UPDATE tb_session AS s
       INNER JOIN tb_employee AS e ON e.employee_id = s.employee_id
       SET s.revoked_at = UTC_TIMESTAMP()
       WHERE e.is_active = 0 AND s.revoked_at IS NULL`,
    );

    return deactivated.affectedRows ?? 0;
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
