export const SYSTEM_SETTINGS_AUDIT_REVIEW_RULES = {
  section: "15.13",
  name: "System Settings Audit Review Rules",
  version: "1.0",
  status: "prepared",
  enabled: false,
  principles: [
    "backend_only_review",
    "read_only_review",
    "least_privilege",
    "retention_aware_review",
    "hold_aware_review",
    "privacy_preservation",
    "fail_closed",
    "no_frontend_authority"
  ],
  operations: [
    "review_audit_event",
    "review_audit_history",
    "review_audit_summary"
  ],
  frontendCannotReviewDirectly: true,
  frontendCannotModifyAudit: true,
  reviewRequiresAuthorization: true,
  retentionStateRequired: true,
  holdStateRequired: true,
  secretExposureForbidden: true,
  activationRequiresBackend: true
};

export function validateSystemSettingsAuditReviewRequest(input = {}) {
  const operation = String(input.operation || "").trim();
  if (!SYSTEM_SETTINGS_AUDIT_REVIEW_RULES.operations.includes(operation)) {
    return { allowed: false, status: "invalid_operation", reason: "Unsupported audit review operation." };
  }
  if (input.fromFrontend === true) {
    return { allowed: false, status: "frontend_review_denied", reason: "Audit review must pass through the secure backend." };
  }
  if (input.authorizationVerified !== true) {
    return { allowed: false, status: "authorization_required", reason: "Audit review requires verified authorization." };
  }
  if (input.retentionStateVerified !== true) {
    return { allowed: false, status: "retention_state_required", reason: "Retention state must be verified before review." };
  }
  if (input.holdStateVerified !== true) {
    return { allowed: false, status: "hold_state_required", reason: "Hold state must be verified before review." };
  }
  if (input.exposesSecrets === true) {
    return { allowed: false, status: "secret_exposure_denied", reason: "Audit review cannot expose protected secrets." };
  }
  if (input.modifiesAudit === true) {
    return { allowed: false, status: "audit_modification_denied", reason: "Audit review is read-only." };
  }
  if (input.backendConnected !== true) {
    return { allowed: false, status: "backend_required", reason: "Audit review requires the secure backend." };
  }
  return { allowed: true, status: "validated", reason: "Audit review request passed validation." };
}
