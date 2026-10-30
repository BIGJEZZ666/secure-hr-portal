import "server-only";

import argon2 from "argon2";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

import type {
  AuthService,
  StoredUser,
} from "@/lib/auth/contracts";
import { userRepository } from "@/lib/auth/user-repository";
import { sessionStore } from "@/lib/auth/session-store";
import { hashSessionToken, generateSessionToken } from "@/lib/auth/session-token";
import {
  clearSessionCookie,
  setSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session-cookie";
import { validateSession } from "@/lib/auth/validate-session";
import { decryptTotpSecret, verifyTotp } from "@/lib/security/totp";
import type { AuthUser } from "@/types/auth";

function toPublicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    twoFactorEnabled: user.twoFactorEnabled,
    lastLoginAt: user.lastLoginAt,
    lastActivityAt: user.lastActivityAt,
  };
}

export const authService: AuthService = {
  async authenticate(
    email: string,
    password: string,
    otp?: string,
  ): Promise<AuthUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user || !user.isActive) {
      return null;
    }

    let passwordMatches = false;

    try {
      passwordMatches = await argon2.verify(
        user.passwordHash,
        password,
      );
    } catch {
      return null;
    }

    if (!passwordMatches) {
      return null;
    }

    if (user.twoFactorEnabled) {
      if (!user.totpSecret || !otp) {
        return null;
      }

      const secret = decryptTotpSecret(user.totpSecret);
      if (!verifyTotp(secret, otp)) {
        return null;
      }
    }

    await userRepository.recordLogin(user.id);

    const token = generateSessionToken();
    const now = new Date();

    await sessionStore.create({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashSessionToken(token),
      createdAt: now,
      expiresAt: new Date(
        now.getTime() + SESSION_MAX_AGE_SECONDS * 1000,
      ),
    });
    await setSessionCookie(token);
    await setSessionCookie(token);

    return toPublicUser(user);
  },

  async register(input): Promise<AuthUser | null> {
    const normalizedName = input.name.trim();
    const normalizedEmail = input.email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !input.password) {
      return null;
    }

    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      return null;
    }

    const passwordHash = await argon2.hash(input.password);
    const user = await userRepository.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: input.role ?? "EMPLOYEE",
    });

    return toPublicUser(user);
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const tokenHash = hashSessionToken(token);
    const session = await sessionStore.findByTokenHash(tokenHash);

    if (!session) {
      return null;
    }

    const user = await userRepository.findById(session.userId);

    const validUser = validateSession(session, user, new Date());

    if (!validUser) {
      return null;
    }

    await sessionStore.touch(session.id);
    await userRepository.recordActivity(validUser.id);

    return toPublicUser(validUser as StoredUser);
  },

  async logout(): Promise<void> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await sessionStore.revokeByTokenHash(hashSessionToken(token));
    }

    await clearSessionCookie();
  },
};
