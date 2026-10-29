import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Generate a cryptographically secure opaque session token.
 * Keep the raw token only in the user's secure cookie.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hash the raw token before storing or looking it up in a session store.
 * Never store the raw session token in the database.
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
