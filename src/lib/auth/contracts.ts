import type { AuthUser, Role } from "@/types/auth";

/**
 * Server-side user record.
 * The password hash must never be returned to the browser.
 */
export interface StoredUser extends AuthUser {
  passwordHash: string;
  totpSecret: string | null;
}

/**
 * A persisted session record.
 * Store only a hash of the opaque session token, never the raw token.
 */
export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  lastSeenAt: Date | null;
}

export interface CreateSessionInput {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Adapter for the team's user database.
 */
export interface UserRepository {
  findById(id: string): Promise<StoredUser | null>;
  findByEmail(email: string): Promise<StoredUser | null>;
  create(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
  }): Promise<StoredUser>;
  listAll(): Promise<StoredUser[]>;
  updateRole(id: string, role: Role): Promise<StoredUser | null>;
  recordActivity(id: string): Promise<void>;
  recordLogin(id: string): Promise<void>;
  setPendingTotpSecret(id: string, secret: string): Promise<void>;
  getPendingTotpSecret(id: string): Promise<string | null>;
  enableTotp(id: string): Promise<void>;
  deactivateInactiveUsers(inactiveDays: number): Promise<number>;
}

/**
 * Adapter for persistent session storage.
 * Implementation must be provided before production use.
 */
export interface SessionStore {
  create(input: CreateSessionInput): Promise<void>;

  findByTokenHash(
    tokenHash: string,
  ): Promise<SessionRecord | null>;

  revokeByTokenHash(tokenHash: string): Promise<void>;

  revokeAllForUser(userId: string): Promise<void>;

  touch(id: string): Promise<void>;
}

/**
 * Authentication operations exposed to server-side application code.
 */
export interface AuthService {
  authenticate(
    email: string,
    password: string,
    otp?: string,
  ): Promise<AuthUser | null>;

  register(input: {
    name: string;
    email: string;
    password: string;
    role?: Role;
  }): Promise<AuthUser | null>;

  getCurrentUser(): Promise<AuthUser | null>;

  logout(): Promise<void>;
}
