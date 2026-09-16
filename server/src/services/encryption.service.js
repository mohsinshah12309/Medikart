/**
 * Encryption Service — AES-256-GCM Secure Data Storage.
 *
 * Provides authenticated encryption for sensitive business data (such as
 * Pharmacy Bank Account Numbers) using Node.js crypto.
 *
 * Format: `ivHex:authTagHex:cipherTextHex`
 */

const crypto = require("crypto");
const { AppError } = require("../utils/errors");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // Standard 96-bit IV for AES-GCM

/**
 * Derives or retrieves the 32-byte (256-bit) encryption key from environment.
 *
 * @returns {Buffer}
 */
function getEncryptionKey() {
  const rawKey = process.env.PHARMACY_DATA_ENCRYPTION_KEY;

  if (rawKey) {
    // If provided as 64-char hex string
    if (/^[0-9a-fA-F]{64}$/.test(rawKey.trim())) {
      return Buffer.from(rawKey.trim(), "hex");
    }
    // If provided as a 32-byte string
    if (Buffer.byteLength(rawKey.trim(), "utf8") === 32) {
      return Buffer.from(rawKey.trim(), "utf8");
    }
    // Otherwise, deterministically hash to 32 bytes
    return crypto.createHash("sha256").update(rawKey.trim()).digest();
  }

  if (process.env.NODE_ENV === "test") {
    return Buffer.from("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "hex");
  }

  console.warn(
    "[encryption] PHARMACY_DATA_ENCRYPTION_KEY not configured — using derived development key. " +
      "Set a dedicated 32-byte hex key in .env for production."
  );
  return crypto.createHash("sha256").update("medikart_dev_encryption_fallback_key").digest();
}

/**
 * Encrypts plaintext string using AES-256-GCM.
 *
 * @param {string} plainText
 * @returns {string} Combined `ivHex:authTagHex:cipherTextHex`
 */
function encrypt(plainText) {
  if (plainText === null || plainText === undefined || plainText === "") {
    return null;
  }

  const textToEncrypt = String(plainText).trim();
  if (!textToEncrypt) return null;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(textToEncrypt, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");
    const ivHex = iv.toString("hex");

    return `${ivHex}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("[encryption] Encryption failed:", error.message);
    throw new AppError("Failed to securely encrypt sensitive data", 500);
  }
}

/**
 * Decrypts an AES-256-GCM formatted ciphertext string.
 *
 * @param {string} cipherString - Combined `ivHex:authTagHex:cipherTextHex`
 * @returns {string} Decrypted plaintext string
 */
function decrypt(cipherString) {
  if (!cipherString || typeof cipherString !== "string") {
    return null;
  }

  const parts = cipherString.split(":");
  if (parts.length !== 3) {
    throw new AppError("Malformed encrypted data structure", 500);
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[encryption] Decryption failed or data tampered with:", error.message);
    throw new AppError("Failed to decrypt data or authentication tag mismatch", 500);
  }
}

module.exports = {
  encrypt,
  decrypt,
  getEncryptionKey,
};
