import { afterEach, describe, expect, it } from "vitest";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  verifyTotp,
} from "./totp";

const originalEncryptionKey = process.env.TOTP_ENCRYPTION_KEY;

afterEach(() => {
  if (originalEncryptionKey === undefined) {
    delete process.env.TOTP_ENCRYPTION_KEY;
  } else {
    process.env.TOTP_ENCRYPTION_KEY = originalEncryptionKey;
  }
});

describe("TOTP security helpers", () => {
  it("verifies the RFC 6238 SHA-1 test vector", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

    expect(verifyTotp(secret, "287082", new Date(59_000))).toBe(true);
    expect(verifyTotp(secret, "287083", new Date(59_000))).toBe(false);
    expect(verifyTotp(secret, "12345x", new Date(59_000))).toBe(false);
  });

  it("encrypts TOTP secrets and rejects unauthenticated ciphertext", () => {
    process.env.TOTP_ENCRYPTION_KEY = "a".repeat(64);

    const encrypted = encryptTotpSecret("JBSWY3DPEHPK3PXP");
    expect(encrypted).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptTotpSecret(encrypted)).toBe("JBSWY3DPEHPK3PXP");

    const parts = encrypted.split(".");
    parts[2] = `${parts[2][0] === "A" ? "B" : "A"}${parts[2].slice(1)}`;
    const tampered = parts.join(".");
    expect(() => decryptTotpSecret(tampered)).toThrow();
  });
});
