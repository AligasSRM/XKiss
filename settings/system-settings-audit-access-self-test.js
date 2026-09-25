import {
  getSystemSettingsAuditAccessCoreStatus,
  validateSystemSettingsAuditAccessCore,
  evaluateSystemSettingsAuditAccessRequest
} from "./system-settings-audit-access-core.js";

export function runSystemSettingsAuditAccessSelfCheck() {
  const status = getSystemSettingsAuditAccessCoreStatus();
  const validation = validateSystemSettingsAuditAccessCore();

  const invalid = evaluateSystemSettingsAuditAccessRequest({
    operation: "delete_audit", backendConnected: true, authorizationVerified: true
  });
  const frontendNoAuth = evaluateSystemSettingsAuditAccessRequest({
    operation: "read_audit_history", fromFrontend: true,
    authorizationVerified: false, backendConnected: true
  });
  const modifies = evaluateSystemSettingsAuditAccessRequest({
    operation: "review_audit_event", modifiesAudit: true,
    authorizationVerified: true, backendConnected: true
  });
  const sensitiveNoAuth = evaluateSystemSettingsAuditAccessRequest({
    operation: "review_audit_event", sensitiveReview: true,
    authorizationVerified: false, backendConnected: true
  });
  const noBackend = evaluateSystemSettingsAuditAccessRequest({
    operation: "read_audit_history", authorizationVerified: true, backendConnected: false
  });
  const validRead = evaluateSystemSettingsAuditAccessRequest({
    operation: "read_audit_history", authorizationVerified: true, backendConnected: true
  });
  const validReview = evaluateSystemSettingsAuditAccessRequest({
    operation: "review_audit_event", sensitiveReview: true,
    authorizationVerified: true, backendConnected: true
  });

  const checks = {
    stage: status.stage === "15.12",
    coreConnected: status.coreConnected === true,
    rulesConnected: status.rulesConnected === true,
    accessReady: status.accessReady === true,
    authorizationGateReady: status.authorizationGateReady === true,
    readOnly: status.readOnly === true,
    invalidOperationDenied: invalid.allowed === false,
    frontendUnauthorizedDenied: frontendNoAuth.allowed === false,
    auditModificationDenied: modifies.allowed === false,
    sensitiveReviewDenied: sensitiveNoAuth.allowed === false,
    backendRequired: noBackend.allowed === false,
    validReadAccepted: validRead.allowed === true,
    validSensitiveReviewAccepted: validReview.allowed === true,
    activationBlocked: validRead.activationAllowed === false
  };

  return {
    ok: Object.values(checks).every(Boolean) && validation.ok === true,
    stage: "15.12",
    test: "System Settings Audit Access self-check",
    checks,
    activationAllowed: false
  };
}
