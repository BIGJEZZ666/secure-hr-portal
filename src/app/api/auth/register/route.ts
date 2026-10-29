import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/auth-service";
import { registerSchema } from "@/lib/security/validation";
import { validateCsrfRequest } from "@/lib/security/csrf";

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

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "คำขอไม่ถูกต้อง" }, { status: 403 });
  }

  if (!(await validateCsrfRequest(request))) {
    return NextResponse.json({ message: "เซสชันความปลอดภัยหมดอายุ กรุณารีเฟรชหน้าแล้วลองใหม่" }, { status: 403 });
  }

  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json")
  ) {
    return NextResponse.json({ message: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 415 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "ข้อมูลสมัครสมาชิกไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  try {
    const user = await authService.register({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: "EMPLOYEE",
    });

    if (!user) {
      return NextResponse.json(
        { message: "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ" },
      { status: 201, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
    );
  } catch {
    return NextResponse.json({ message: "ไม่สามารถสมัครสมาชิกได้ในขณะนี้" }, { status: 500 });
  }
}
