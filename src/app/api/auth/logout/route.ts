import { NextResponse } from "next/server";
import { authService } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

export async function POST() {
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
