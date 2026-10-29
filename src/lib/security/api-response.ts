import "server-only";

import { NextResponse } from "next/server";

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "UNAUTHENTICATED" },
    { status: 401 },
    );
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: "FORBIDDEN" },
    { status: 403 },
  );
}

export function notFoundResponse() {
  return NextResponse.json(
    { error: "NOT_FOUND" },
    { status: 404 },
  );
}

export function validationErrorResponse() {
  return NextResponse.json(
    { error: "INVALID_REQUEST" },
    { status: 400 },
  );
}

export function internalErrorResponse() {
  return NextResponse.json(
    { error: "INTERNAL_SERVER_ERROR" },
    { status: 500 },
  );
}
