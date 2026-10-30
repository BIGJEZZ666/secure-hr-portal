import "server-only";

import { db } from "@/lib/db";

export const ACTIVITY_ACTIONS = {
  LOGIN: "เข้าสู่ระบบ",
  LOGOUT: "ออกจากระบบ",
  ACCOUNT_REGISTER: "สมัครสมาชิก",
  ROLE_CHANGE: "เปลี่ยนบทบาทผู้ใช้",
  EVENT_CREATE: "HR เพิ่มกิจกรรม",
  EVENT_UPDATE: "HR แก้ไขกิจกรรม",
  EVENT_DELETE: "HR ลบกิจกรรม",
  EVENT_REGISTER: "Employee ลงทะเบียนเข้ากิจกรรม",
  EVENT_UNREGISTER: "Employee ยกเลิกลงทะเบียนกิจกรรม",
} as const;

export type ActivityAction =
  (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];

export interface ActivityLogInput {
  employeeId: string;
  action: ActivityAction;
  targetEmployeeId?: string;
  resourceType?: string | null;
  resourceId?: string | null;
  details?: Record<string, string | number | boolean | null> | null;
}

interface ActionRow {
  action_id: number;
}

function parseEmployeeId(value: string, field: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid ${field}`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid ${field}`);
  }

  return parsed;
}

export async function recordActivity({
  employeeId,
  action,
  targetEmployeeId,
  resourceType = null,
  resourceId = null,
  details = null,
}: ActivityLogInput): Promise<void> {
  const actorId = parseEmployeeId(employeeId, "activity actor ID");
  const targetId = targetEmployeeId
    ? parseEmployeeId(targetEmployeeId, "activity target ID")
    : null;

  if (resourceType !== null && resourceType.length > 40) {
    throw new Error("Activity resource type is too long");
  }

  if (resourceId !== null && resourceId.length > 64) {
    throw new Error("Activity resource ID is too long");
  }

  const actions = (await db.query(
    `SELECT action_id
     FROM tb_action
     WHERE action_name = ?
     LIMIT 1`,
    [action],
  )) as ActionRow[];

  if (actions.length !== 1) {
    throw new Error(`Activity action is not configured: ${action}`);
  }

  await db.query<unknown, Array<string | number | null>>(
    `INSERT INTO tb_activity_log (
      employee_id,
      action_id,
      timestamp,
      target_employee_id,
      resource_type,
      resource_id,
      details
    ) VALUES (?, ?, UTC_TIMESTAMP(), ?, ?, ?, ?)`,
    [
      actorId,
      actions[0].action_id,
      targetId,
      resourceType,
      resourceId,
      details === null ? null : JSON.stringify(details),
    ],
  );
}