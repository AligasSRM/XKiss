import {
  normalizeEmail,
  hashPassword,
  verifyPassword,
  createSessionToken,
  hashSessionToken
} from "./xkiss-auth-crypto.js";

const SESSION_PREFIX = "session:";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function sessionKey(tokenHash) {
  return SESSION_PREFIX + tokenHash;
}

function safeUser(user) {
  if (!user) return null;
  const { password_hash, passwordHash, ...publicUser } = user;
  return publicUser;
}

function isAuthReady(env) {
  return Boolean(env && env.XKISS_AUTH_DB && env.XKISS_AUTH_SESSIONS);
}

export function getAuthStorageStatus(env) {
  return {
    ready: isAuthReady(env),
    databaseBinding: "XKISS_AUTH_DB",
    sessionBinding: "XKISS_AUTH_SESSIONS",
    provider: "Cloudflare D1 + KV",
    message: isAuthReady(env)
      ? "XKiss identity and session storage are connected."
      : "XKiss identity/session storage is not connected yet."
  };
}

export async function registerAccount(env, input = {}) {
  if (!isAuthReady(env)) return { ok:false, status:"storage_unavailable" };

  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await env.XKISS_AUTH_DB.prepare(
      `INSERT INTO users
       (user_id, email, password_hash, role, account_state, email_verified, age_verified, creator_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId,
      email,
      JSON.stringify(passwordHash),
      "user",
      "active",
      0,
      0,
      0,
      now,
      now
    ).run();
  } catch (error) {
    const message = String(error?.message || error || "").toLowerCase();
    if (message.includes("unique") || message.includes("constraint") || message.includes("email")) {
      return { ok:false, status:"email_exists" };
    }
    return { ok:false, status:"storage_error" };
  }

  return {
    ok:true,
    status:"created",
    user:safeUser({
      user_id:userId,
      email,
      role:"user",
      account_state:"active",
      email_verified:0,
      age_verified:0,
      creator_verified:0,
      created_at:now,
      updated_at:now
    })
  };
}

export async function loginAccount(env, input = {}) {
  if (!isAuthReady(env)) return { ok:false, status:"storage_unavailable" };

  const email = normalizeEmail(input.email);
  const row = await env.XKISS_AUTH_DB.prepare(
    `SELECT user_id, email, password_hash, role, account_state, email_verified, age_verified, creator_verified, created_at, updated_at
     FROM users WHERE email = ? LIMIT 1`
  ).bind(email).first();

  if (!row || row.account_state !== "active") {
    return { ok:false, status:"invalid_credentials" };
  }

  let storedPassword;
  try { storedPassword = JSON.parse(row.password_hash); } catch { return { ok:false, status:"invalid_credentials" }; }
  if (!(await verifyPassword(input.password, storedPassword))) {
    return { ok:false, status:"invalid_credentials" };
  }

  const token = createSessionToken();
  const tokenHash = await hashSessionToken(token);
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;

  await env.XKISS_AUTH_SESSIONS.put(
    sessionKey(tokenHash),
    JSON.stringify({
      userId: row.user_id,
      createdAt: new Date().toISOString(),
      expiresAt
    }),
    { expirationTtl: SESSION_TTL_SECONDS }
  );

  return {
    ok:true,
    status:"authenticated",
    user:safeUser(row),
    sessionToken:token,
    expiresAt:new Date(expiresAt).toISOString()
  };
}

export async function getAuthenticatedUser(env, token) {
  if (!isAuthReady(env) || !token) return null;

  const tokenHash = await hashSessionToken(token);
  const session = await env.XKISS_AUTH_SESSIONS.get(sessionKey(tokenHash), "json");
  if (!session || Number(session.expiresAt) <= Date.now()) return null;

  const row = await env.XKISS_AUTH_DB.prepare(
    `SELECT user_id, email, role, account_state, email_verified, age_verified, creator_verified, created_at, updated_at
     FROM users WHERE user_id = ? LIMIT 1`
  ).bind(session.userId).first();

  if (!row || row.account_state !== "active") return null;
  return safeUser(row);
}

export async function revokeSession(env, token) {
  if (!isAuthReady(env) || !token) return false;
  const tokenHash = await hashSessionToken(token);
  await env.XKISS_AUTH_SESSIONS.delete(sessionKey(tokenHash));
  return true;
}
