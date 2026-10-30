import { describe, expect, it } from "vitest";
import { createEventSchema, loginSchema } from "./validation";

describe("loginSchema", () => {
  it("accepts a valid login input", () => {
    const result = loginSchema.safeParse({
      email: "  USER@EXAMPLE.COM ",
      password: "Example-password-123",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Example-password-123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a login without OTP when two-factor authentication is disabled", () => {
    expect(
      loginSchema.safeParse({
        email: "user@example.com",
        password: "Example-password-123",
        otp: "",
      }).success,
    ).toBe(true);
  });

  it("rejects non-numeric OTP values", () => {
    expect(
      loginSchema.safeParse({
        email: "user@example.com",
        password: "Example-password-123",
        otp: "abc123",
      }).success,
    ).toBe(false);
  });

  it("rejects unexpected fields", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "Example-password-123",
      role: "CEO",
    });

    expect(result.success).toBe(false);
  });
});

describe("createEventSchema", () => {
  const validEvent = {
    title: "ประชุมประจำเดือน",
    description: "ประชุมภายในบริษัท",
    location: "ห้องประชุม A",
    startsAt: "2026-11-01T09:00:00.000Z",
    endsAt: "2026-11-01T10:00:00.000Z",
  };

  it("accepts a valid event", () => {
    expect(createEventSchema.safeParse(validEvent).success).toBe(true);
  });

  it("defaults the audience to all staff", () => {
    const result = createEventSchema.safeParse(validEvent);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.audience).toBe("ALL_STAFF");
    }
  });

  it("rejects an unsupported event audience", () => {
    expect(
      createEventSchema.safeParse({
        ...validEvent,
        audience: "PUBLIC",
      }).success,
    ).toBe(false);
  });

  it("rejects an end time before the start time", () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      endsAt: "2026-11-01T08:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unexpected fields", () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      role: "CEO",
    });

    expect(result.success).toBe(false);
  });
});
