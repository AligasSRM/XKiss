import { getSuperAdminSecurityCoreStatus, validateSuperAdminSecurityCore, evaluateSuperAdminSecurity } from "./super-admin-security-core.js";

export function runSuperAdminSecurityCoreSelfCheck() {
  const status = getSuperAdminSecurityCoreStatus();
  const validation = validateSuperAdminSecurityCore();

  const unauthenticated = evaluateSuperAdminSecurity({
    authenticated: false,
    action: "view_security_logs"
  });

  const validLookingButBackendDisabled = evaluateSuperAdminSecurity({
    role: "super_admin",
    accountState: "active",
    authenticated: true,
    mfaVerified: true,
    sessionValid: true,
    reauthenticated: true,
    action: "view_security_logs"
  });

  const missingMfa = evaluateSuperAdminSecurity({
    role: "super_admin",
    accountState: "active",
    authenticated: true,
    mfaVerified: false,
    action: "view_security_logs"
  });

  const checks = {
    stage: status.section === "14",
    finalLocked: status.status === "FINAL_LOCKED" && status.locked === true,
    productionRemainsDisabled: status.enabled === false && status.productionEnabled === false,
    coreConnected: validation.coreConnected === true,
    importsReady: validation.importsReady === true,
    exportsReady: validation.exportsReady === true,
    securityRulesReady: validation.securityRulesReady === true,
    sessionReady: validation.sessionReady === true,
    reauthenticationReady: validation.reauthenticationReady === true,
    mfaReady: validation.mfaReady === true,
    activationBlockedUntilBackend: validation.activationAllowed === false,
    unauthenticatedPrivilegedActionDenied:
      unauthenticated.ok === false && unauthenticated.stage === "access",
    validLookingRequestDeniedWhileBackendDisabled:
      validLookingButBackendDisabled.ok === false &&
      validLookingButBackendDisabled.stage === "access" &&
      validLookingButBackendDisabled.access.allowed === false,
    missingMfaDeniedWithFailedTopLevelResult:
      missingMfa.ok === false &&
      missingMfa.stage === "access" &&
      missingMfa.access.allowed === false
  };

  const passed = Object.values(checks).every(Boolean);

  return {
    ok: passed,
    stage: "14",
    test: "Super Admin Security Core self-check",
    checks,
    locked: status.locked,
    productionEnabled: status.productionEnabled,
    activationAllowed: validation.activationAllowed,
    reason: passed
      ? "Section 14 is FINAL_LOCKED for the verified fail-closed implementation. Production remains disabled until real backend providers are independently verified."
      : "One or more Section 14 security or lock-state checks failed."
  };
}
