import { describe, expect, it } from "vitest";
import {
  generateSessionToken,
  hashSessionToken,
} from "./session-token";

describe("session token utilities", () => {
  it("generates a non-empty token", () => {
    const token = generateSessionToken();

    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(30);
  });

  it("generates different tokens", () => {
    expect(generateSessionToken()).not.toBe(generateSessionToken());
  });

  it("produces a stable SHA-256 hash", () => {
    const token = generateSessionToken();

    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });

  it("does not return the original token as its hash", () => {
    const token = generateSessionToken();

    expect(hashSessionToken(token)).not.toBe(token);
    expect(hashSessionToken(token)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different hashes for different tokens", () => {
    expect(hashSessionToken("token-a")).not.toBe(
      hashSessionToken("token-b"),
    );
  });
});
