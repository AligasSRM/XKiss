import { SUPER_ADMIN_SECURITY_RULES } from "./super-admin-security-rules.js";

export const SUPER_ADMIN_MFA_RULES = {
  version: "1.0",
  status: "ready",
  enabled: false,
  requiredForRole: SUPER_ADMIN_SECURITY_RULES.superAdminRole,
  allowedMethods: ["totp", "webauthn", "recovery_code"],
  verificationWindowSeconds: 90,
  maxAttempts: 5,
  lockoutMinutes: 15,
  provider: null,
  secretStorage: "backend_only"
};

function clean(value) {
  return String(value || "").trim();
}

export function requiresSuperAdminMfa(role) {
  return clean(role) === SUPER_ADMIN_MFA_RULES.requiredForRole;
}

export function validateMfaVerificationRequest(input = {}) {
  const role = clean(input.role);
  const method = clean(input.method);
  const code = clean(input.code);

  if (!requiresSuperAdminMfa(role)) {
    return { ok: false, status: "mfa_not_applicable", verified: false, reason: "Super Admin MFA applies only to the configured super_admin role." };
  }
  if (!SUPER_ADMIN_MFA_RULES.allowedMethods.includes(method)) {
    return { ok: false, status: "invalid_method", verified: false, reason: "Unsupported MFA method." };
  }
  if (!code) {
    return { ok: false, status: "code_required", verified: false, reason: "An MFA verification code or assertion is required." };
  }
  if (!SUPER_ADMIN_MFA_RULES.enabled || !SUPER_ADMIN_MFA_RULES.provider) {
    return { ok: true, status: "backend_required", verified: false, reason: "MFA verification must be completed by the secure backend provider. No MFA secret is handled by the frontend." };
  }
  return { ok: true, status: "provider_required", verified: false, reason: "The configured backend MFA provider must verify the submitted factor." };
}

export function getSuperAdminMfaStatus() {
  return {
    ok: true,
    status: SUPER_ADMIN_MFA_RULES.status,
    enabled: SUPER_ADMIN_MFA_RULES.enabled,
    providerConnected: Boolean(SUPER_ADMIN_MFA_RULES.provider),
    requiredForRole: SUPER_ADMIN_MFA_RULES.requiredForRole,
    allowedMethods: [...SUPER_ADMIN_MFA_RULES.allowedMethods],
    secretStorage: SUPER_ADMIN_MFA_RULES.secretStorage
  };
}
