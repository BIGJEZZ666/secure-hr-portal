import { describe, expect, it } from "vitest";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
} from "./session-cookie-config";

describe("session cookie configuration", () => {
  it("uses HttpOnly cookies", () => {
    expect(SESSION_COOKIE_OPTIONS.httpOnly).toBe(true);
  });

  it("uses SameSite Strict", () => {
    expect(SESSION_COOKIE_OPTIONS.sameSite).toBe("strict");
  });

  it("uses the root path without a Domain attribute", () => {
    expect(SESSION_COOKIE_OPTIONS.path).toBe("/");
    expect(SESSION_COOKIE_OPTIONS).not.toHaveProperty("domain");
  });

  it("sets an eight-hour maximum age", () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(8 * 60 * 60);
  });

  it("uses the production Host cookie prefix only in production", () => {
    if (process.env.NODE_ENV === "production") {
      expect(SESSION_COOKIE_NAME).toBe("__Host-hr_session");
      expect(SESSION_COOKIE_OPTIONS.secure).toBe(true);
    } else {
      expect(SESSION_COOKIE_NAME).toBe("hr_session");
    }
  });
});
