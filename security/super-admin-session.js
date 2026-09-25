import { SUPER_ADMIN_SECURITY_RULES } from "./super-admin-security-rules.js";

export const SUPER_ADMIN_SESSION_RULES = {
  version: "1.0",
  status: "ready",
  enabled: false,
  idleTimeoutMinutes: 30,
  absoluteTimeoutHours: 12,
  refreshRotationRequired: true,
  revokeOnLogout: true,
  revokeOnMfaFailureThreshold: true,
  binding: "server_session",
  tokenStorage: "http_only_secure_cookie",
  provider: null
};

function clean(value) {
  return String(value || "").trim();
}

export function validateSuperAdminSession(input = {}) {
  const role = clean(input.role);
  if (role !== SUPER_ADMIN_SECURITY_RULES.superAdminRole) {
    return { ok: false, valid: false, status: "invalid_role" };
  }
  if (!input.authenticated) {
    return { ok: false, valid: false, status: "authentication_required" };
  }
  if (input.accountState && input.accountState !== "active") {
    return { ok: false, valid: false, status: "account_inactive" };
  }
  if (!input.mfaVerified) {
    return { ok: false, valid: false, status: "mfa_required" };
  }
  if (input.sessionValid === false) {
    return { ok: false, valid: false, status: "session_invalid" };
  }
  if (input.idleExpired) {
    return { ok: false, valid: false, status: "idle_timeout" };
  }
  if (input.absoluteExpired) {
    return { ok: false, valid: false, status: "absolute_timeout" };
  }
  if (input.revoked) {
    return { ok: false, valid: false, status: "session_revoked" };
  }
  return { ok: true, valid: true, status: "session_valid", role };
}

export function getSuperAdminSessionStatus() {
  return {
    ok: true,
    status: SUPER_ADMIN_SESSION_RULES.status,
    enabled: SUPER_ADMIN_SESSION_RULES.enabled,
    idleTimeoutMinutes: SUPER_ADMIN_SESSION_RULES.idleTimeoutMinutes,
    absoluteTimeoutHours: SUPER_ADMIN_SESSION_RULES.absoluteTimeoutHours,
    refreshRotationRequired: SUPER_ADMIN_SESSION_RULES.refreshRotationRequired,
    revokeOnLogout: SUPER_ADMIN_SESSION_RULES.revokeOnLogout,
    binding: SUPER_ADMIN_SESSION_RULES.binding,
    tokenStorage: SUPER_ADMIN_SESSION_RULES.tokenStorage,
    providerConnected: Boolean(SUPER_ADMIN_SESSION_RULES.provider)
  };
}

export function buildSessionRevokeRequest(reason = "logout") {
  return { ok: true, action: "revoke_session", reason: clean(reason) || "logout" };
}
