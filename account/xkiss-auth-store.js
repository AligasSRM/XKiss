import {
  normalizeEmail,
  hashPassword,
  verifyPassword,
  createSessionToken,
  hashSessionToken
} from "./xkiss-auth-crypto.js";

const USER_PREFIX = "user:";
const EMAIL_PREFIX = "email:";
const SESSION_PREFIX = "session:";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function userKey(userId) {
  return USER_PREFIX + userId;
}

function emailKey(email) {
  return EMAIL_PREFIX + normalizeEmail(email);
}

function sessionKey(tokenHash) {
  return SESSION_PREFIX + tokenHash;
}

function safeUser(user) {
  if (!user) return null;
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

function isAuthReady(env) {
  return Boolean(env && env.XKISS_AUTH);
}

export function getAuthStorageStatus(env) {
  return {
    ready: isAuthReady(env),
    binding: "XKISS_AUTH",
    provider: "Cloudflare KV",
    message: isAuthReady(env)
      ? "XKiss authentication storage is connected."
      : "XKiss authentication storage is not connected yet."
  };
}

export async function registerAccount(env, input = {}) {
  if (!isAuthReady(env)) return { ok:false, status:"storage_unavailable" };

  const email = normalizeEmail(input.email);
  const existing = await env.XKISS_AUTH.get(emailKey(email));
  if (existing) return { ok:false, status:"email_exists" };

  const passwordHash = await hashPassword(input.password);
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  const user = {
    userId,
    email,
    role: "user",
    accountState: "active",
    emailVerified: false,
    ageVerified: false,
    creatorVerified: false,
    createdAt: now,
    updatedAt: now,
    passwordHash
  };

  await env.XKISS_AUTH.put(userKey(userId), JSON.stringify(user));
  await env.XKISS_AUTH.put(emailKey(email), userId);
  return { ok:true, status:"created", user:safeUser(user) };
}

export async function loginAccount(env, input = {}) {
  if (!isAuthReady(env)) return { ok:false, status:"storage_unavailable" };

  const email = normalizeEmail(input.email);
  const userId = await env.XKISS_AUTH.get(emailKey(email));
  if (!userId) return { ok:false, status:"invalid_credentials" };

  const user = await env.XKISS_AUTH.get(userKey(userId), "json");
  if (!user || user.accountState !== "active") {
    return { ok:false, status:"account_unavailable" };
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) return { ok:false, status:"invalid_credentials" };

  const token = createSessionToken();
  const tokenHash = await hashSessionToken(token);
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  await env.XKISS_AUTH.put(
    sessionKey(tokenHash),
    JSON.stringify({ userId, createdAt: new Date().toISOString(), expiresAt }),
    { expirationTtl: SESSION_TTL_SECONDS }
  );

  return {
    ok:true,
    status:"authenticated",
    user:safeUser(user),
    sessionToken:token,
    expiresAt:new Date(expiresAt).toISOString()
  };
}

export async function getAuthenticatedUser(env, token) {
  if (!isAuthReady(env) || !token) return null;
  const tokenHash = await hashSessionToken(token);
  const session = await env.XKISS_AUTH.get(sessionKey(tokenHash), "json");
  if (!session || Number(session.expiresAt) <= Date.now()) return null;
  const user = await env.XKISS_AUTH.get(userKey(session.userId), "json");
  if (!user || user.accountState !== "active") return null;
  return safeUser(user);
}

export async function revokeSession(env, token) {
  if (!isAuthReady(env) || !token) return false;
  const tokenHash = await hashSessionToken(token);
  await env.XKISS_AUTH.delete(sessionKey(tokenHash));
  return true;
}
