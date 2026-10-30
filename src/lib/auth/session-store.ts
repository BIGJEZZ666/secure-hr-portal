import "server-only";

import { db } from "@/lib/db";
import type {
  CreateSessionInput,
  SessionRecord,
  SessionStore,
} from "@/lib/auth/contracts";

interface SessionRow {
  session_id: string;
  employee_id: number;
  token_hash: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  last_seen_at: string | null;
}

function toDatabaseDate(date: Date): string {
  if (!Number.isFinite(date.getTime())) {
    throw new Error("Invalid session date");
  }

  // Store UTC in MariaDB DATETIME columns.
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function fromDatabaseDate(value: string | null): Date | null {
  if (value === null) {
    return null;
  }

  // Queries below format DATETIME as a string without a timezone.
  // Interpret that string consistently as UTC.
  const date = new Date(`${value.replace(" ", "T")}Z`);

  if (!Number.isFinite(date.getTime())) {
    throw new Error("Invalid session date returned by database");
  }

  return date;
}

function mapSession(row: SessionRow): SessionRecord {
  const createdAt = fromDatabaseDate(row.created_at);
  const expiresAt = fromDatabaseDate(row.expires_at);

  if (!createdAt || !expiresAt) {
    throw new Error("Required session dates are missing");
  }

  return {
    id: row.session_id,
    userId: String(row.employee_id),
    tokenHash: row.token_hash,
    createdAt,
    expiresAt,
    revokedAt: fromDatabaseDate(row.revoked_at),
    lastSeenAt: fromDatabaseDate(row.last_seen_at),
  };
}

const sessionSelect = `
  SELECT
    session_id,
    employee_id,
    token_hash,
    DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') AS created_at,
    DATE_FORMAT(expires_at, '%Y-%m-%dT%H:%i:%s') AS expires_at,
    DATE_FORMAT(revoked_at, '%Y-%m-%dT%H:%i:%s') AS revoked_at,
    DATE_FORMAT(last_seen_at, '%Y-%m-%dT%H:%i:%s') AS last_seen_at
  FROM tb_session
`;

export const sessionStore: SessionStore = {
  async create(input: CreateSessionInput): Promise<void> {
    if (
      !input.id ||
      !input.userId ||
      !/^[a-f0-9]{64}$/i.test(input.tokenHash)
    ) {
      throw new Error("Invalid session input");
    }

    if (
      !Number.isSafeInteger(Number(input.userId)) ||
      Number(input.userId) < 1
    ) {
      throw new Error("Invalid session user ID");
    }

    if (
      !Number.isFinite(input.createdAt.getTime()) ||
      !Number.isFinite(input.expiresAt.getTime()) ||
      input.expiresAt <= input.createdAt
    ) {
      throw new Error("Invalid session expiration");
    }

    await db.query(
      `INSERT INTO tb_session (
        session_id,
        employee_id,
        token_hash,
        created_at,
        expires_at,
        last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        Number(input.userId),
        input.tokenHash,
        toDatabaseDate(input.createdAt),
        toDatabaseDate(input.expiresAt),
        toDatabaseDate(input.createdAt),
      ],
    );
  },

  async findByTokenHash(
    tokenHash: string,
  ): Promise<SessionRecord | null> {
    if (!/^[a-f0-9]{64}$/i.test(tokenHash)) {
      return null;
    }

    const rows = await db.query(
      `${sessionSelect}
       WHERE token_hash = ?
       LIMIT 1`,
      [tokenHash],
    ) as SessionRow[];

    return rows.length > 0 ? mapSession(rows[0]) : null;
  },

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    if (!/^[a-f0-9]{64}$/i.test(tokenHash)) {
      return;
    }

    await db.query(
      `UPDATE tb_session
       SET revoked_at = UTC_TIMESTAMP()
       WHERE token_hash = ?
         AND revoked_at IS NULL`,
      [tokenHash],
    );
  },

  async revokeAllForUser(userId: string): Promise<void> {
    if (
      !/^\d+$/.test(userId) ||
      !Number.isSafeInteger(Number(userId)) ||
      Number(userId) < 1
    ) {
      throw new Error("Invalid session user ID");
    }

    await db.query(
      `UPDATE tb_session
       SET revoked_at = UTC_TIMESTAMP()
       WHERE employee_id = ?
         AND revoked_at IS NULL`,
      [Number(userId)],
    );
  },

  async touch(id: string): Promise<void> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      throw new Error("Invalid session ID");
    }

    await db.query(
      `UPDATE tb_session
       SET last_seen_at = UTC_TIMESTAMP()
       WHERE session_id = ?
         AND revoked_at IS NULL
         AND (last_seen_at IS NULL
           OR last_seen_at < UTC_TIMESTAMP() - INTERVAL 5 MINUTE)`,
      [id],
    );
  },
};
