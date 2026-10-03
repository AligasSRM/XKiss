const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const PBKDF2_ITERATIONS = 20000;

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function randomBase64(length = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return bytesToBase64(bytes);
}

async function hashPassword(password, saltBase64) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: base64ToBytes(saltBase64),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
}

async function hashToken(token) {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToBase64(new Uint8Array(digest));
}

function validPassword(password) {
  return typeof password === "string" && password.length >= 10 && password.length <= 200;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function userPublic(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at
  };
}

export async function registerMember(env, { email, password }) {
  const normalized = normalizeEmail(email);
  if (!validEmail(normalized) || !validPassword(password)) {
    return { ok: false, status: "invalid_input", message: "Valid email and password are required." };
  }

  const existing = await env.XKISS_AUTH_DB.prepare(
    "SELECT id FROM users WHERE email = ?1 LIMIT 1"
  ).bind(normalized).first();

  if (existing) {
    return { ok: false, status: "already_exists", message: "An account with this email already exists." };
  }

  const id = crypto.randomUUID();
  const salt = await randomBase64(16);
  const passwordHash = await hashPassword(password, salt);
  const now = new Date().toISOString();

  await env.XKISS_AUTH_DB.prepare(
    "INSERT INTO users (id,email,password_hash,password_salt,role,status,created_at,updated_at) VALUES (?1,?2,?3,?4,'member','active',?5,?5)"
  ).bind(id, normalized, passwordHash, salt, now).run();

  return {
    ok: true,
    status: "created",
    user: { id, email: normalized, role: "member", status: "active", createdAt: now }
  };
}

export async function loginMember(env, { email, password }) {
  const normalized = normalizeEmail(email);
  if (!validEmail(normalized) || typeof password !== "string") {
    return { ok: false, status: "invalid_credentials" };
  }

  const row = await env.XKISS_AUTH_DB.prepare(
    "SELECT id,email,password_hash,password_salt,role,status,created_at FROM users WHERE email = ?1 LIMIT 1"
  ).bind(normalized).first();

  if (!row || row.status !== "active") {
    return { ok: false, status: "invalid_credentials" };
  }

  const candidate = await hashPassword(password, row.password_salt);
  if (candidate !== row.password_hash) {
    return { ok: false, status: "invalid_credentials" };
  }

  const rawToken = await randomBase64(32);
  const tokenHash = await hashToken(rawToken);
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString();

  await env.XKISS_AUTH_DB.prepare(
    "INSERT INTO sessions (id,user_id,token_hash,expires_at,created_at) VALUES (?1,?2,?3,?4,?5)"
  ).bind(sessionId, row.id, tokenHash, expires, now.toISOString()).run();

  return {
    ok: true,
    status: "authenticated",
    token: rawToken,
    expiresAt: expires,
    user: userPublic(row)
  };
}

export async function authenticateSession(env, token) {
  if (!token || typeof token !== "string") return { ok: false, status: "unauthenticated" };

  const tokenHash = await hashToken(token);
  const row = await env.XKISS_AUTH_DB.prepare(
    "SELECT s.id AS session_id,s.expires_at,u.id,u.email,u.role,u.status,u.created_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?1 AND s.revoked_at IS NULL LIMIT 1"
  ).bind(tokenHash).first();

  if (!row || row.status !== "active" || Date.parse(row.expires_at) <= Date.now()) {
    return { ok: false, status: "unauthenticated" };
  }

  return {
    ok: true,
    status: "authenticated",
    sessionId: row.session_id,
    user: {
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at
    }
  };
}

export async function logoutMember(env, token) {
  if (!token) return { ok: true, status: "logged_out" };
  const tokenHash = await hashToken(token);
  await env.XKISS_AUTH_DB.prepare(
    "UPDATE sessions SET revoked_at=?1 WHERE token_hash=?2 AND revoked_at IS NULL"
  ).bind(new Date().toISOString(), tokenHash).run();
  return { ok: true, status: "logged_out" };
}

export const AUTH_SECURITY_INVARIANTS = Object.freeze({
  plaintextPasswordsStored: false,
  plaintextPasswordsReturned: false,
  plaintextPasswordsLogged: false,
  sessionTokensStoredAsHashes: true,
  passwordHashAlgorithm: "PBKDF2-SHA-256",
  pbkdf2Iterations: PBKDF2_ITERATIONS,
  failClosed: true
});
