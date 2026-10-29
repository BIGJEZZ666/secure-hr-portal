import type { AuthUser, Role } from "@/types/auth";

/**
 * Server-side user record.
 * The password hash must never be returned to the browser.
 */
export interface StoredUser extends AuthUser {
  passwordHash: string;
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
}

/**
 * Authentication operations exposed to server-side application code.
 */
export interface AuthService {
  authenticate(
    email: string,
    password: string,
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
