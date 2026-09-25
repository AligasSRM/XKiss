import { SUPER_ADMIN_SECURITY_RULES, isPrivilegedAction } from "./super-admin-security-rules.js";
import {
  SUPER_ADMIN_ACCESS_RULES,
  getSuperAdminAccessStatus,
  validateSuperAdminAccess,
  evaluateSuperAdminSensitiveAction
} from "./super-admin-access.js";
import { validateMfaVerificationRequest, getSuperAdminMfaStatus } from "./super-admin-mfa.js";
import { validateSuperAdminSession, getSuperAdminSessionStatus } from "./super-admin-session.js";
import {
  validateSuperAdminReauthentication,
  getSuperAdminReauthStatus
} from "./super-admin-reauth.js";

export const SUPER_ADMIN_SECURITY_CORE = {
  section: "15.3",
  name: "Super Admin Security Core",
  status: "ready",
  enabled: false,
  modules: [
    "security-rules",
    "super-admin-access",
    "mfa",
    "session",
    "reauthentication"
  ],
  controls: {
    secureSession: true,
    reauthentication: true,
    superAdminAccess: true,
    securityRules: true,
    externalProviders: true
  },
  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true
};

export function getSuperAdminSecurityCoreStatus() {
  return {
    ok: true,
    ...SUPER_ADMIN_SECURITY_CORE,
    securityRules: SUPER_ADMIN_SECURITY_RULES,
    access: getSuperAdminAccessStatus(),
    mfa: getSuperAdminMfaStatus(),
    session: getSuperAdminSessionStatus(),
    reauthentication: getSuperAdminReauthStatus()
  };
}

export function validateSuperAdminSecurityCore() {
  const status = getSuperAdminSecurityCoreStatus();

  return {
    ok: true,
    stage: "15.3",
    coreConnected: true,
    superAdminAccessConnected: Boolean(SUPER_ADMIN_ACCESS_RULES),
    importsReady: true,
    exportsReady: true,
    securityRulesReady: status.securityRules != null,
    sessionReady: status.session.ok === true,
    reauthenticationReady: status.reauthentication.ok === true,
    mfaReady: status.mfa.ok === true,
    activationAllowed: false,
    reason: "15.3 Core is structurally connected. Backend providers are not connected, so activation remains disabled."
  };
}

export function evaluateSuperAdminSecurity(input = {}) {
  const access = validateSuperAdminAccess(input);
  if (!access.ok || !access.allowed) {
    return { ok: access.ok, stage: "access", access };
  }

  const session = validateSuperAdminSession(input);
  if (!session.valid) {
    return { ok: false, stage: "session", access, session };
  }

  if (isPrivilegedAction(input.action)) {
    const reauth = validateSuperAdminReauthentication(input);
    if (!reauth.valid) {
      return { ok: false, stage: "reauthentication", access, session, reauth };
    }
  }

  return { ok: true, stage: "authorized", access, session };
}

export function evaluateSuperAdminSensitiveActionFromCore(input = {}) {
  return evaluateSuperAdminSensitiveAction(input);
}

export {
  validateMfaVerificationRequest,
  validateSuperAdminSession,
  validateSuperAdminReauthentication
};
