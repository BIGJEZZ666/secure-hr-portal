import "server-only";

import { db } from "@/lib/db";
import type { EventInput, PortalEvent } from "@/lib/events/types";

interface EventRow {
  event_id: number;
  title: string;
  description: string;
  location: string;
  audience: PortalEvent["audience"];
  starts_at: string;
  ends_at: string;
  created_by_name: string;
  created_by_role: PortalEvent["createdByRole"];
}

interface MutationResult {
  affectedRows: number;
  insertId?: number | bigint;
}

const eventSelect = `
  SELECT
    ev.event_id,
    ev.title,
    ev.description,
    ev.location,
    ev.audience,
    DATE_FORMAT(ev.starts_at, '%Y-%m-%dT%H:%i:%s.000Z') AS starts_at,
    DATE_FORMAT(ev.ends_at, '%Y-%m-%dT%H:%i:%s.000Z') AS ends_at,
    e.employee_name AS created_by_name,
    r.role_name AS created_by_role
  FROM tb_event AS ev
  INNER JOIN tb_employee AS e
    ON e.employee_id = ev.created_by_employee_id
  INNER JOIN tb_role AS r
    ON r.role_id = e.role_id
`;

function toSqlUtcDateTime(value: string): string {
  return new Date(value).toISOString().slice(0, 19).replace("T", " ");
}

function mapEvent(row: EventRow): PortalEvent {
  return {
    id: String(row.event_id),
    title: row.title,
    description: row.description,
    location: row.location,
    audience: row.audience,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdByName: row.created_by_name,
    createdByRole: row.created_by_role,
  };
}

export const eventRepository = {
  async list(): Promise<PortalEvent[]> {
    const rows = (await db.query(
      `${eventSelect} ORDER BY ev.starts_at ASC, ev.event_id ASC`,
    )) as EventRow[];

    return rows.map(mapEvent);
  },

  async create(input: EventInput, employeeId: string): Promise<string> {
    const result = (await db.query(
      `INSERT INTO tb_event (
        title,
        description,
        location,
        audience,
        starts_at,
        ends_at,
        created_by_employee_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.title,
        input.description,
        input.location,
        input.audience,
        toSqlUtcDateTime(input.startsAt),
        toSqlUtcDateTime(input.endsAt),
        Number(employeeId),
      ],
    )) as MutationResult;

    if (!result.insertId) {
      throw new Error("Event creation did not return an ID");
    }

    return String(result.insertId);
  },

  async update(
    id: number,
    input: EventInput,
  ): Promise<boolean> {
    const result = (await db.query(
      `UPDATE tb_event
       SET title = ?,
           description = ?,
           location = ?,
           audience = ?,
           starts_at = ?,
           ends_at = ?,
           updated_at = UTC_TIMESTAMP()
       WHERE event_id = ?`,
      [
        input.title,
        input.description,
        input.location,
        input.audience,
        toSqlUtcDateTime(input.startsAt),
        toSqlUtcDateTime(input.endsAt),
        id,
      ],
    )) as MutationResult;

    if (result.affectedRows > 0) {
      return true;
    }

    const rows = (await db.query(
      "SELECT event_id FROM tb_event WHERE event_id = ? LIMIT 1",
      [id],
    )) as Array<{ event_id: number }>;

    return rows.length > 0;
  },

  async delete(id: number): Promise<boolean> {
    const result = (await db.query(
      "DELETE FROM tb_event WHERE event_id = ?",
      [id],
    )) as MutationResult;

    return result.affectedRows > 0;
  },

};
