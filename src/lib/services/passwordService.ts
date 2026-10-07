import crypto from "node:crypto";

/**
 * OWASP-compliant parameter recommendations for scrypt:
 * - N (CPU/memory cost factor): 16384 (2^14)
 * - r (block size): 8
 * - p (parallelization): 1
 * - maxmem: 32 MB
 * - key length: 64 bytes (512 bits)
 * - salt length: 16 bytes (128 bits)
 */
export const SCRYPT_CONFIG = {
  N: 16384,
  r: 8,
  p: 1,
  keyLen: 64,
  saltBytes: 16,
  maxmem: 32 * 1024 * 1024,
} as const;

export const HASH_PREFIX = "scrypt";

function scryptAsync(
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number,
  options: crypto.ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/**
 * Securely hashes a plain-text password using the scrypt key derivation function
 * with a cryptographically secure random salt and standard parameters.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }

  const salt = crypto.randomBytes(SCRYPT_CONFIG.saltBytes).toString("hex");
  const derivedKey = await scryptAsync(password, salt, SCRYPT_CONFIG.keyLen, {
    N: SCRYPT_CONFIG.N,
    r: SCRYPT_CONFIG.r,
    p: SCRYPT_CONFIG.p,
    maxmem: SCRYPT_CONFIG.maxmem,
  });

  return `${HASH_PREFIX}$N=${SCRYPT_CONFIG.N},r=${SCRYPT_CONFIG.r},p=${SCRYPT_CONFIG.p}$${salt}$${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plain-text password against a stored scrypt hash using constant-time comparison.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash || typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }

  if (!storedHash.startsWith(`${HASH_PREFIX}$`)) {
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 4) {
    return false;
  }

  const [, paramsStr, salt, hashHex] = parts;
  const paramMatches = paramsStr.match(/^N=(\d+),r=(\d+),p=(\d+)$/);
  if (!paramMatches) {
    return false;
  }

  const N = parseInt(paramMatches[1], 10);
  const r = parseInt(paramMatches[2], 10);
  const p = parseInt(paramMatches[3], 10);

  // Validate parameters within reasonable security bounds
  if (N <= 0 || (N & (N - 1)) !== 0 || r <= 0 || p <= 0) {
    return false;
  }

  const expectedKey = Buffer.from(hashHex, "hex");
  if (expectedKey.length === 0) {
    return false;
  }

  try {
    const actualKey = await scryptAsync(password, salt, expectedKey.length, {
      N,
      r,
      p,
      maxmem: 64 * 1024 * 1024,
    });

    if (expectedKey.length !== actualKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedKey, actualKey);
  } catch {
    return false;
  }
}

/**
 * Detects whether a stored hash represents the legacy Base64 format.
 */
export function isLegacyHash(storedHash: string): boolean {
  if (!storedHash || typeof storedHash !== "string") {
    return false;
  }
  return !storedHash.startsWith(`${HASH_PREFIX}$`);
}

/**
 * Verifies a legacy Base64 password using constant-time comparison to prevent timing side channels.
 */
export function verifyLegacyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash || typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }

  const computedLegacyHash = Buffer.from(password).toString("base64");
  const a = Buffer.from(computedLegacyHash);
  const b = Buffer.from(storedHash);

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}
