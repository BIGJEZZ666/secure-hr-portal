import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const CSRF_COOKIE_NAME = "hr_csrf";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export async function setCsrfCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function validateCsrfRequest(
  request: Request,
): Promise<boolean> {
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const tokenFromHeader = request.headers.get("x-csrf-token");

  if (!tokenFromCookie || !tokenFromHeader) {
    return false;
  }

  return tokenFromCookie === tokenFromHeader;
}
