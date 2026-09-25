import { SUPER_ADMIN_SECURITY_RULES, evaluateSuperAdminAccess, isPrivilegedAction } from "./super-admin-security-rules.js";
import { validateMfaVerificationRequest, getSuperAdminMfaStatus } from "./super-admin-mfa.js";
import { validateSuperAdminSession, getSuperAdminSessionStatus } from "./super-admin-session.js";
import { validateSuperAdminReauthentication, getSuperAdminReauthStatus } from "./super-admin-reauth.js";

export const SUPER_ADMIN_SECURITY_CORE = {
  section: "15.3",
  name: "Super Admin MFA & Session Security",
  status: "ready",
  modules: ["mfa", "session", "reauthentication"],
  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true
};

export function getSuperAdminSecurityCoreStatus() {
  return {
    ok: true,
    ...SUPER_ADMIN_SECURITY_CORE,
    mfa: getSuperAdminMfaStatus(),
    session: getSuperAdminSessionStatus(),
    reauthentication: getSuperAdminReauthStatus()
  };
}

export function evaluateSuperAdminSecurity(input = {}) {
  const access = evaluateSuperAdminAccess(input);
  if (!access.ok) return { ok: false, stage: "access", access };

  const session = validateSuperAdminSession(input);
  if (!session.valid) return { ok: false, stage: "session", access, session };

  if (isPrivilegedAction(input.action)) {
    const reauth = validateSuperAdminReauthentication(input);
    if (!reauth.valid) return { ok: false, stage: "reauthentication", access, session, reauth };
  }

  return { ok: true, stage: "authorized", access, session };
}

export {
  validateMfaVerificationRequest,
  validateSuperAdminSession,
  validateSuperAdminReauthentication
};
