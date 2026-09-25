import {
  SYSTEM_SETTINGS_AUDIT_REVIEW_RULES,
  validateSystemSettingsAuditReviewRequest
} from "./system-settings-audit-review-rules.js";

export const SYSTEM_SETTINGS_AUDIT_REVIEW_CORE = {
  section: "15.13",
  name: "System Settings Audit Review Core",
  status: "ready",
  enabled: false,
  controls: {
    backendOnlyReview: true,
    authorizationGate: true,
    retentionGate: true,
    holdGate: true,
    secretProtection: true,
    readOnlyReview: true,
    failClosed: true
  },
  frontendCannotReviewDirectly: true,
  frontendCannotModifyAudit: true,
  activationRequiresBackend: true
};

export function getSystemSettingsAuditReviewCoreStatus() {
  return {
    ok: true,
    stage: "15.13",
    coreConnected: true,
    rulesConnected: true,
    reviewReady: true,
    authorizationGateReady: true,
    retentionGateReady: true,
    holdGateReady: true,
    secretProtectionReady: true,
    readOnly: true,
    activationAllowed: false,
    failClosed: true
  };
}

export function validateSystemSettingsAuditReviewCore() {
  const s = getSystemSettingsAuditReviewCoreStatus();
  return {
    ok: s.coreConnected && s.rulesConnected && s.reviewReady &&
      s.authorizationGateReady && s.retentionGateReady && s.holdGateReady &&
      s.secretProtectionReady && s.readOnly && s.activationAllowed === false &&
      s.failClosed,
    stage: "15.13",
    rulesVersion: SYSTEM_SETTINGS_AUDIT_REVIEW_RULES.version,
    controls: SYSTEM_SETTINGS_AUDIT_REVIEW_CORE.controls
  };
}

export function evaluateSystemSettingsAuditReviewRequest(input = {}) {
  const result = validateSystemSettingsAuditReviewRequest(input);
  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.status,
    reason: result.reason,
    activationAllowed: false
  };
}
