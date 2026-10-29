import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Events API is not configured yet" },
    { status: 501 },
  );
}
