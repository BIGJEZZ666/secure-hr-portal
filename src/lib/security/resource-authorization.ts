import "server-only";

import type { AuthUser } from "@/types/auth";

export type ResourceAccessResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: "unauthenticated" | "inactive" | "forbidden";
    };

/**
 * ตรวจสิทธิ์เข้าถึงข้อมูลพนักงานรายบุคคล
 *
 * CEO: เข้าถึงได้ทุกคนตามนโยบายตัวอย่างนี้
 * HR: เข้าถึงได้ทุกคนตามนโยบายตัวอย่างนี้
 * EMPLOYEE: เข้าถึงข้อมูลของตนเองเท่านั้น
 *
 * ต้องปรับตามนโยบายข้อมูลจริงขององค์กรก่อนใช้งาน
 */
export function authorizeEmployeeResource(
  user: AuthUser | null,
  targetEmployeeId: string,
): ResourceAccessResult {
  if (!user) {
    return { allowed: false, reason: "unauthenticated" };
  }

  if (!user.isActive) {
    return { allowed: false, reason: "inactive" };
  }

  if (user.role === "CEO" || user.role === "HR") {
    return { allowed: true };
  }

  if (
    user.role === "EMPLOYEE" &&
    user.employeeId === targetEmployeeId
  ) {
    return { allowed: true };
  }

  return { allowed: false, reason: "forbidden" };
}
