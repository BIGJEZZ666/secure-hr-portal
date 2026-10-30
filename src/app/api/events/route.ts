import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorization";
import { authService } from "@/lib/auth/auth-service";
import { ACTIVITY_ACTIONS, recordActivity } from "@/lib/auth/activity-log";
import { eventRepository } from "@/lib/events/event-repository";
import { filterEventsForRole } from "@/lib/events/visibility";
import { createEventSchema } from "@/lib/security/validation";
import { validateCsrfRequest } from "@/lib/security/csrf";

export const runtime = "nodejs";

const eventIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "รหัสกิจกรรมไม่ถูกต้อง")
  .transform(Number)
  .refine(
    (id) => Number.isSafeInteger(id) && id <= 4_294_967_295,
    "รหัสกิจกรรมไม่ถูกต้อง",
  );

const updateEventSchema = createEventSchema.extend({
  id: eventIdSchema,
});

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function authorizeEvents(permission: "events:view" | "events:manage") {
  const user = await authService.getCurrentUser();
  return authorize(user, permission);
}

async function validateMutationRequest(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ message: "คำขอไม่ถูกต้อง" }, 403);
  }

  if (!(await validateCsrfRequest(request))) {
    return jsonResponse(
      { message: "เซสชันความปลอดภัยหมดอายุ กรุณารีเฟรชหน้าแล้วลองใหม่" },
      403,
    );
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return jsonResponse({ message: "รูปแบบคำขอไม่ถูกต้อง" }, 415);
  }

  return null;
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function databaseError(error: unknown) {
  console.error("Events API request failed", error);
  return jsonResponse(
    { message: "ระบบไม่สามารถดำเนินการเกี่ยวกับกิจกรรมได้ในขณะนี้" },
    500,
  );
}

export async function GET() {
  try {
    const access = await authorizeEvents("events:view");

    if (!access.allowed) {
      return jsonResponse({ message: "ไม่มีสิทธิ์เข้าถึงกิจกรรม" }, 403);
    }

    const events = filterEventsForRole(
      await eventRepository.list(),
      access.user.role,
    );
    return jsonResponse({ events });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: NextRequest) {
  const invalidRequest = await validateMutationRequest(request);
  if (invalidRequest) {
    return invalidRequest;
  }

  try {
    const access = await authorizeEvents("events:manage");
    if (!access.allowed) {
      return jsonResponse({ message: "ไม่มีสิทธิ์จัดการกิจกรรม" }, 403);
    }

    const parsed = createEventSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return jsonResponse({ message: "กรุณาตรวจสอบข้อมูลกิจกรรม" }, 400);
    }

    const id = await eventRepository.create(parsed.data, access.user.employeeId);
    await recordActivity({
      employeeId: access.user.employeeId,
      action: ACTIVITY_ACTIONS.EVENT_CREATE,
      resourceType: "event",
      resourceId: id,
    });

    return jsonResponse({ message: "เพิ่มกิจกรรมสำเร็จ", id }, 201);
  } catch (error) {
    return databaseError(error);
  }
}

export async function PUT(request: NextRequest) {
  const invalidRequest = await validateMutationRequest(request);
  if (invalidRequest) {
    return invalidRequest;
  }

  try {
    const access = await authorizeEvents("events:manage");
    if (!access.allowed) {
      return jsonResponse({ message: "ไม่มีสิทธิ์จัดการกิจกรรม" }, 403);
    }

    const parsed = updateEventSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return jsonResponse({ message: "กรุณาตรวจสอบข้อมูลกิจกรรม" }, 400);
    }

    const { id, ...input } = parsed.data;
    const updated = await eventRepository.update(id, input);
    if (!updated) {
      return jsonResponse({ message: "ไม่พบกิจกรรมที่ต้องการแก้ไข" }, 404);
    }

    await recordActivity({
      employeeId: access.user.employeeId,
      action: ACTIVITY_ACTIONS.EVENT_UPDATE,
      resourceType: "event",
      resourceId: String(id),
    });

    return jsonResponse({ message: "แก้ไขกิจกรรมสำเร็จ" });
  } catch (error) {
    return databaseError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const invalidRequest = await validateMutationRequest(request);
  if (invalidRequest) {
    return invalidRequest;
  }

  try {
    const access = await authorizeEvents("events:manage");
    if (!access.allowed) {
      return jsonResponse({ message: "ไม่มีสิทธิ์จัดการกิจกรรม" }, 403);
    }

    const body = await readJson(request);
    const id = eventIdSchema.safeParse(
      typeof body === "object" && body !== null && "id" in body
        ? body.id
        : undefined,
    );
    if (!id.success) {
      return jsonResponse({ message: "รหัสกิจกรรมไม่ถูกต้อง" }, 400);
    }

    const deleted = await eventRepository.delete(id.data);
    if (!deleted) {
      return jsonResponse({ message: "ไม่พบกิจกรรมที่ต้องการลบ" }, 404);
    }

    await recordActivity({
      employeeId: access.user.employeeId,
      action: ACTIVITY_ACTIONS.EVENT_DELETE,
      resourceType: "event",
      resourceId: String(id.data),
    });

    return jsonResponse({ message: "ลบกิจกรรมสำเร็จ" });
  } catch (error) {
    return databaseError(error);
  }
}
