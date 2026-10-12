"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Hashes a password using PBKDF2 with SHA-512 and a secure salt.
 * Formatted as: salt:hash
 */
function hashPassword(password) {
    const salt = crypto_1.default.randomBytes(16).toString("hex");
    const hash = crypto_1.default.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
}
/**
 * Verifies a plaintext password against a stored hash string.
 * Also supports backward compatibility for plaintext seeds or simple passwords.
 */
function verifyPassword(password, storedHash) {
    if (!storedHash) {
        // If no password set yet, accept standard demo password 'password123' or '123456'
        return password === "password123" || password === "123456" || password === "admin123";
    }
    // Check if stored as salt:hash
    if (storedHash.includes(":")) {
        const [salt, key] = storedHash.split(":");
        const calculatedHash = crypto_1.default.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
        return calculatedHash === key;
    }
    // Fallback direct match
    return storedHash === password;
}
