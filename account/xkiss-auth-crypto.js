const PASSWORD_ITERATIONS = 100000;
const MAX_PASSWORD_ITERATIONS = 100000;
const PASSWORD_KEY_LENGTH = 32;
const SESSION_BYTES = 32;

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function validatePasswordPolicy(value) {
  const password = String(value || "");
  return {
    valid:
      password.length >= 10 &&
      password.length <= 128 &&
      /[A-Za-z]/.test(password) &&
      /\d/.test(password),
    minLength: 10,
    maxLength: 128
  };
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(password)),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    material,
    PASSWORD_KEY_LENGTH * 8
  );
  return {
    algorithm: "PBKDF2-SHA-256",
    iterations: PASSWORD_ITERATIONS,
    salt: bytesToBase64(salt),
    hash: bytesToBase64(new Uint8Array(bits))
  };
}

function constantTimeEqual(a, b) {
  const left = base64ToBytes(a);
  const right = base64ToBytes(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

export async function verifyPassword(password, stored) {
  if (!stored || stored.algorithm !== "PBKDF2-SHA-256") return false;
  const iterations = Number(stored.iterations);
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > MAX_PASSWORD_ITERATIONS) return false;
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(password)),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: base64ToBytes(stored.salt),
      iterations,
      hash: "SHA-256"
    },
    material,
    PASSWORD_KEY_LENGTH * 8
  );
  return constantTimeEqual(stored.hash, bytesToBase64(new Uint8Array(bits)));
}

export function createSessionToken() {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(SESSION_BYTES)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function hashSessionToken(token) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(String(token))
  );
  return bytesToBase64(new Uint8Array(digest));
}
