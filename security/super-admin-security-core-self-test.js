import { getSuperAdminSecurityCoreStatus, validateSuperAdminSecurityCore, evaluateSuperAdminSecurity } from "./super-admin-security-core.js";

export function runSuperAdminSecurityCoreSelfCheck() {
  const status = getSuperAdminSecurityCoreStatus();
  const validation = validateSuperAdminSecurityCore();

  const unauthenticated = evaluateSuperAdminSecurity({
    authenticated: false,
    action: "view_security_logs"
  });

  const checks = {
    stage: status.section === "15.3",
    coreConnected: validation.coreConnected === true,
    importsReady: validation.importsReady === true,
    exportsReady: validation.exportsReady === true,
    securityRulesReady: validation.securityRulesReady === true,
    sessionReady: validation.sessionReady === true,
    reauthenticationReady: validation.reauthenticationReady === true,
    mfaReady: validation.mfaReady === true,
    activationBlockedUntilBackend: validation.activationAllowed === false,
    unauthenticatedPrivilegedActionDenied:
      unauthenticated.ok === false && unauthenticated.stage === "access"
  };

  const passed = Object.values(checks).every(Boolean);

  return {
    ok: passed,
    stage: "15.3",
    test: "Super Admin Security Core self-check",
    checks,
    activationAllowed: validation.activationAllowed,
    reason: passed
      ? "15.3 Core structure and safe-denial behavior passed. Backend activation remains blocked until real providers are connected."
      : "One or more 15.3 Core checks failed."
  };
}
