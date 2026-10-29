import { NextResponse } from "next/server";
import { generateCsrfToken, setCsrfCookie } from "@/lib/security/csrf";

export async function GET() {
  const token = generateCsrfToken();
  await setCsrfCookie(token);

  return NextResponse.json({ csrfToken: token }, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
