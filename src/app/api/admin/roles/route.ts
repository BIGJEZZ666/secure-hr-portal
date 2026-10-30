import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorization";
import { authService } from "@/lib/auth/auth-service";
import { userRepository } from "@/lib/auth/user-repository";
import { validateCsrfRequest } from "@/lib/security/csrf";
import type { Role } from "@/types/auth";

export const runtime = "nodejs";

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

export async function GET() {
  const user = await authService.getCurrentUser();
  const allow = authorize(user, "dashboard:view");

  if (!allow.allowed) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const employees = await userRepository.listAll();

  return NextResponse.json({
    employees: employees.filter((employee) => employee.role !== "CEO").map((employee) => ({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
    })),
  }, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "คำขอไม่ถูกต้อง" }, { status: 403 });
  }

  if (!(await validateCsrfRequest(request))) {
    return NextResponse.json({ message: "เซสชันความปลอดภัยหมดอายุ กรุณารีเฟรชหน้าแล้วลองใหม่" }, { status: 403 });
  }

  const user = await authService.getCurrentUser();
  const allow = authorize(user, "dashboard:view");

  if (!allow.allowed) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์ในการเปลี่ยนบทบาท" }, { status: 403 });
  }

  const formData = await request.formData();
  const employeeId = String(formData.get("employeeId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!employeeId || !["HR", "EMPLOYEE"].includes(role)) {
    return NextResponse.json({ message: "ข้อมูลการเปลี่ยนบทบาทไม่ถูกต้อง" }, { status: 400 });
  }

  const updated = await userRepository.updateRole(employeeId, role as Role);
  if (!updated) {
    return NextResponse.json({ message: "ไม่พบพนักงานที่ต้องการเปลี่ยนบทบาท" }, { status: 404 });
  }

  return NextResponse.json({ message: "เปลี่ยนบทบาทสำเร็จ" }, { status: 200 });
}
