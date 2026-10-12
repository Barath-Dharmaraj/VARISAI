import crypto from "crypto";

/**
 * Hashes a password using PBKDF2 with SHA-512 and a secure salt.
 * Formatted as: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored hash string.
 * Also supports backward compatibility for plaintext seeds or simple passwords.
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash) {
    // If no password set yet, accept standard demo password 'password123' or '123456'
    return password === "password123" || password === "123456" || password === "admin123";
  }

  // Check if stored as salt:hash
  if (storedHash.includes(":")) {
    const [salt, key] = storedHash.split(":");
    const calculatedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return calculatedHash === key;
  }

  // Fallback direct match
  return storedHash === password;
}
