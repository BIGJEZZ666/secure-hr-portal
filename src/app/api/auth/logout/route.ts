import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/auth-service";
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

  try {
    await authService.logout();

    return NextResponse.json(
      { message: "ออกจากระบบสำเร็จ" },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { message: "ไม่สามารถออกจากระบบได้ กรุณาลองใหม่" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
}
