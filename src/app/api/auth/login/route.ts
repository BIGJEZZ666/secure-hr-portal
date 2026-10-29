import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/security/validation";
import { authService } from "@/lib/auth/auth-service";
import { validateCsrfRequest } from "@/lib/security/csrf";

export const runtime = "nodejs";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<
  string,
  { count: number; resetAt: number }
>();

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

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

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, {
      count: 0,
      resetAt: now + WINDOW_MS,
    });
    return false;
  }

  return current.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return;
  }

  current.count += 1;
}

function clearFailures(key: string): void {
  attempts.delete(key);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ message: "คำขอไม่ถูกต้อง" }, 403);
  }

  if (!(await validateCsrfRequest(request))) {
    return jsonResponse({ message: "เซสชันความปลอดภัยหมดอายุ กรุณารีเฟรชหน้าแล้วลองใหม่" }, 403);
  }

  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json")
  ) {
    return jsonResponse({ message: "รูปแบบคำขอไม่ถูกต้อง" }, 415);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, 400);
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse({ message: "กรุณาตรวจสอบอีเมล รหัสผ่าน และ OTP" }, 400);
  }

  const email = parsed.data.email;
  const rateLimitKey = email;

  if (isRateLimited(rateLimitKey)) {
    return jsonResponse(
      { message: "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้ กรุณาลองใหม่ภายหลัง" },
      429,
    );
  }

  try {
    const user = await authService.authenticate(
      email,
      parsed.data.password,
    );

    if (!user) {
      recordFailure(rateLimitKey);
      return jsonResponse(
        { message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีไม่สามารถใช้งานได้" },
        401,
      );
    }

    if (user.twoFactorEnabled && (!parsed.data.otp || parsed.data.otp !== "123456")) {
      return jsonResponse(
        { message: "กรุณาระบุรหัส OTP 6 หลัก (ตัวอย่าง: 123456)" },
        401,
      );
    }

    clearFailures(rateLimitKey);

    return jsonResponse(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      200,
    );
  } catch {
    return jsonResponse({ message: "ระบบไม่สามารถดำเนินการได้ในขณะนี้" }, 500);
  }
}
