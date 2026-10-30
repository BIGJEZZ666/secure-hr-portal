import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/auth/user-repository";

export const runtime = "nodejs";

function isAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!expectedSecret || !authorization?.startsWith("Bearer ")) {
    return false;
  }

  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(expectedSecret);

  return (
    supplied.length === expected.length &&
    timingSafeEqual(supplied, expected)
  );
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const configuredDays = Number(process.env.INACTIVE_ACCOUNT_DAYS ?? "60");
  if (!Number.isInteger(configuredDays) || configuredDays < 30 || configuredDays > 60) {
    return NextResponse.json(
      { message: "INACTIVE_ACCOUNT_DAYS must be between 30 and 60" },
      { status: 500 },
    );
  }

  try {
    const deactivatedCount =
      await userRepository.deactivateInactiveUsers(configuredDays);

    return NextResponse.json(
      { deactivatedCount },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to process inactive accounts" },
      { status: 500 },
    );
  }
}
