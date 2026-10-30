import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;

function getEncryptionKey(): Buffer {
  const key = process.env.TOTP_ENCRYPTION_KEY;

  if (!key || !/^[a-f0-9]{64}$/i.test(key)) {
    throw new Error("TOTP_ENCRYPTION_KEY must be 64 hexadecimal characters");
  }

  return Buffer.from(key, "hex");
}

function encodeBase32(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let result = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return result;
}

function decodeBase32(secret: string): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of secret.replace(/=+$/g, "").toUpperCase()) {
    const index = BASE32_ALPHABET.indexOf(char);

    if (index < 0) {
      throw new Error("Invalid TOTP secret");
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  return encodeBase32(randomBytes(20));
}

export function encryptTotpSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptTotpSecret(encrypted: string): string {
  const [version, ivValue, tagValue, ciphertextValue] = encrypted.split(".");

  if (
    version !== "v1" ||
    !ivValue ||
    !tagValue ||
    !ciphertextValue
  ) {
    throw new Error("Invalid encrypted TOTP secret");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function generateTotp(secret: string, timestampSeconds: number): string {
  const counter = Math.floor(timestampSeconds / STEP_SECONDS);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", decodeBase32(secret))
    .update(counterBuffer)
    .digest();
  const offset = digest[digest.length - 1] & 15;
  const code =
    (((digest[offset] & 127) << 24) |
      ((digest[offset + 1] & 255) << 16) |
      ((digest[offset + 2] & 255) << 8) |
      (digest[offset + 3] & 255)) %
    1_000_000;

  return String(code).padStart(6, "0");
}

export function verifyTotp(
  secret: string,
  token: string,
  now: Date = new Date(),
): boolean {
  if (!/^\d{6}$/.test(token)) {
    return false;
  }

  const supplied = Buffer.from(token);
  const currentStep = Math.floor(now.getTime() / 1000 / STEP_SECONDS);

  for (const stepOffset of [-1, 0, 1]) {
    const expected = Buffer.from(
      generateTotp(secret, (currentStep + stepOffset) * STEP_SECONDS),
    );

    if (
      supplied.length === expected.length &&
      timingSafeEqual(supplied, expected)
    ) {
      return true;
    }
  }

  return false;
}

export function createTotpUri(
  secret: string,
  email: string,
): string {
  const label = encodeURIComponent(`Secure HR Portal:${email}`);
  const issuer = encodeURIComponent("Secure HR Portal");

  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=${STEP_SECONDS}`;
}
