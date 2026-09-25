import {
  getSystemSettingsAuditReviewCoreStatus,
  validateSystemSettingsAuditReviewCore,
  evaluateSystemSettingsAuditReviewRequest
} from "./system-settings-audit-review-core.js";

export function runSystemSettingsAuditReviewSelfCheck() {
  const status = getSystemSettingsAuditReviewCoreStatus();
  const validation = validateSystemSettingsAuditReviewCore();
  const base = {
    authorizationVerified: true,
    retentionStateVerified: true,
    holdStateVerified: true,
    backendConnected: true
  };

  const invalid = evaluateSystemSettingsAuditReviewRequest({...base, operation:"delete_audit"});
  const frontend = evaluateSystemSettingsAuditReviewRequest({...base, operation:"review_audit_history", fromFrontend:true});
  const noAuth = evaluateSystemSettingsAuditReviewRequest({...base, operation:"review_audit_event", authorizationVerified:false});
  const noRetention = evaluateSystemSettingsAuditReviewRequest({...base, operation:"review_audit_history", retentionStateVerified:false});
  const noHold = evaluateSystemSettingsAuditReviewRequest({...base, operation:"review_audit_history", holdStateVerified:false});
  const secrets = evaluateSystemSettingsAuditReviewRequest({...base, operation:"review_audit_event", exposesSecrets:true});
  const modify = evaluateSystemSettingsAuditReviewRequest({...base, operation:"review_audit_event", modifiesAudit:true});
  const noBackend = evaluateSystemSettingsAuditReviewRequest({...base, operation:"review_audit_summary", backendConnected:false});
  const validReview = evaluateSystemSettingsAuditReviewRequest({...base, operation:"review_audit_history"});

  const checks = {
    stage: status.stage === "15.13",
    coreConnected: status.coreConnected === true,
    rulesConnected: status.rulesConnected === true,
    reviewReady: status.reviewReady === true,
    authorizationGateReady: status.authorizationGateReady === true,
    retentionGateReady: status.retentionGateReady === true,
    holdGateReady: status.holdGateReady === true,
    secretProtectionReady: status.secretProtectionReady === true,
    readOnly: status.readOnly === true,
    invalidOperationDenied: invalid.allowed === false,
    frontendReviewDenied: frontend.allowed === false,
    authorizationRequired: noAuth.allowed === false,
    retentionVerificationRequired: noRetention.allowed === false,
    holdVerificationRequired: noHold.allowed === false,
    secretExposureDenied: secrets.allowed === false,
    auditModificationDenied: modify.allowed === false,
    backendRequired: noBackend.allowed === false,
    validReviewAccepted: validReview.allowed === true,
    activationBlocked: validReview.activationAllowed === false
  };

  return {
    ok: Object.values(checks).every(Boolean) && validation.ok === true,
    stage: "15.13",
    test: "System Settings Audit Review self-check",
    checks,
    activationAllowed: false
  };
}
