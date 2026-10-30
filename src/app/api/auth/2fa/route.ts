import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/auth-service";
import { userRepository } from "@/lib/auth/user-repository";
import { validateCsrfRequest } from "@/lib/security/csrf";
import {
  createTotpUri,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  verifyTotp,
} from "@/lib/security/totp";

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
  if (!process.env.TOTP_ENCRYPTION_KEY) {
    return NextResponse.json(
      { message: "ผู้ดูแลระบบยังไม่ได้ตั้งค่า TOTP_ENCRYPTION_KEY" },
      { status: 503 },
    );
  }

  if (!isSameOrigin(request) || !(await validateCsrfRequest(request))) {
    return NextResponse.json({ message: "คำขอไม่ถูกต้องหรือ CSRF token หมดอายุ" }, { status: 403 });
  }

  const user = await authService.getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ message: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("action" in body) ||
    typeof body.action !== "string"
  ) {
    return NextResponse.json({ message: "ข้อมูลการตั้งค่า 2FA ไม่ถูกต้อง" }, { status: 400 });
  }

  if (body.action === "start") {
    const secret = generateTotpSecret();
    await userRepository.setPendingTotpSecret(
      user.id,
      encryptTotpSecret(secret),
    );

    return NextResponse.json(
      {
        secret,
        otpauthUrl: createTotpUri(secret, user.email),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (body.action === "verify" && "code" in body && typeof body.code === "string") {
    if (!/^\d{6}$/.test(body.code)) {
      return NextResponse.json({ message: "กรุณากรอกรหัส OTP 6 หลัก" }, { status: 400 });
    }

    const pendingSecret = await userRepository.getPendingTotpSecret(user.id);
    if (!pendingSecret || !verifyTotp(decryptTotpSecret(pendingSecret), body.code)) {
      return NextResponse.json({ message: "รหัส OTP ไม่ถูกต้อง" }, { status: 400 });
    }

    await userRepository.enableTotp(user.id);

    return NextResponse.json({ message: "เปิดใช้งาน 2FA สำเร็จ จะต้องยืนยัน OTP ในการเข้าสู่ระบบครั้งถัดไป" });
  }

  return NextResponse.json({ message: "คำสั่ง 2FA ไม่ถูกต้อง" }, { status: 400 });
}
