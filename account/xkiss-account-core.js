import { isValidEmail, normalizeEmail, validatePasswordPolicy } from "./xkiss-auth-crypto.js";
import { getAuthStorageStatus, registerAccount, loginAccount, getAuthenticatedUser, revokeSession } from "./xkiss-auth-store.js";

export const XKISS_ACCOUNT_CORE = {
  stage: "ACCOUNT-AUTH-01",
  name: "XKiss User Account Core",
  failClosed: true,
  authenticationSeparateFromAgeVerification: true,
  creatorVerificationSeparate: true,
  frontendSecurityDecisionsAllowed: false
};

export function getAccountRuntimeStatus(env) {
  const storage = getAuthStorageStatus(env);
  return {
    ok: true,
    stage: XKISS_ACCOUNT_CORE.stage,
    storage,
    productionReady: false,
    reason: storage.ready
      ? "Authentication storage is connected; external security verification is still required."
      : "Authentication backend is prepared but storage is not connected."
  };
}

export async function registerUser(env, input = {}) {
  const email = normalizeEmail(input.email);
  const passwordPolicy = validatePasswordPolicy(input.password);
  if (!isValidEmail(email) || !passwordPolicy.valid) {
    return { ok:false, status:"invalid_registration" };
  }
  return registerAccount(env, { email, password:input.password });
}

export async function loginUser(env, input = {}) {
  return loginAccount(env, {
    email: normalizeEmail(input.email),
    password: input.password
  });
}

export async function authenticateSession(env, token) {
  return getAuthenticatedUser(env, token);
}

export async function logoutUser(env, token) {
  return revokeSession(env, token);
}
