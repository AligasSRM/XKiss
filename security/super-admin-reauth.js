import { SUPER_ADMIN_SECURITY_RULES, isPrivilegedAction } from "./super-admin-security-rules.js";

export const SUPER_ADMIN_REAUTH_RULES = {
  version: "1.0",
  status: "ready",
  enabled: false,
  maxAgeMinutes: 10,
  provider: null
};

export function requiresSuperAdminReauthentication(action) {
  return Boolean(isPrivilegedAction(action));
}

export function validateSuperAdminReauthentication(input = {}) {
  if (String(input.role || "").trim() !== SUPER_ADMIN_SECURITY_RULES.superAdminRole) {
    return { ok: false, valid: false, status: "invalid_role" };
  }
  if (!requiresSuperAdminReauthentication(input.action)) {
    return { ok: true, valid: true, status: "reauth_not_required" };
  }
  if (!input.authenticated || input.sessionValid === false) {
    return { ok: false, valid: false, status: "authentication_required" };
  }
  if (!input.reauthenticated) {
    return { ok: false, valid: false, status: "reauthentication_required" };
  }
  if (input.reauthenticationExpired) {
    return { ok: false, valid: false, status: "reauthentication_expired" };
  }
  if (!SUPER_ADMIN_REAUTH_RULES.enabled || !SUPER_ADMIN_REAUTH_RULES.provider) {
    return { ok: true, valid: false, status: "backend_required" };
  }
  return { ok: true, valid: false, status: "provider_required" };
}

export function getSuperAdminReauthStatus() {
  return {
    ok: true,
    status: SUPER_ADMIN_REAUTH_RULES.status,
    enabled: SUPER_ADMIN_REAUTH_RULES.enabled,
    maxAgeMinutes: SUPER_ADMIN_REAUTH_RULES.maxAgeMinutes,
    providerConnected: Boolean(SUPER_ADMIN_REAUTH_RULES.provider)
  };
}
