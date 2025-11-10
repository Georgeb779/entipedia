/**
 * Password hashing utilities powered by bcrypt.
 * These helpers are used by server-side authentication routes.
 */
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt with a cost factor of 12.
 * Wrap usage in try/catch blocks to surface hashing errors (e.g., invalid input).
 */
export const hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS);

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 * Returns `true` when the password matches. Wrap in try/catch to handle malformed hashes.
 */
export const verifyPassword = (password: string, hashedPassword: string) =>
  bcrypt.compare(password, hashedPassword);
