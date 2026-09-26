export const SYSTEM_SETTINGS_AUDIT_EXPORT_RULES = {
  section: "15.14",
  name: "System Settings Audit Export Rules",
  version: "1.0",
  status: "prepared",
  enabled: false,
  principles: [
    "backend_only_export",
    "read_only_export",
    "least_privilege",
    "retention_aware_export",
    "hold_aware_export",
    "review_authorized_export",
    "privacy_preservation",
    "fail_closed",
    "no_frontend_authority"
  ],
  operations: [
    "export_audit_event",
    "export_audit_history",
    "export_audit_summary"
  ],
  frontendCannotExportDirectly: true,
  frontendCannotModifyAudit: true,
  exportRequiresAuthorization: true,
  retentionStateRequired: true,
  holdStateRequired: true,
  reviewStateRequired: true,
  secretExposureForbidden: true,
  auditModificationForbidden: true,
  activationRequiresBackend: true
};

export function validateSystemSettingsAuditExportRequest(input = {}) {
  const operation = String(input.operation || "").trim();
  if (!SYSTEM_SETTINGS_AUDIT_EXPORT_RULES.operations.includes(operation)) {
    return { allowed: false, status: "invalid_operation", reason: "Unsupported audit export operation." };
  }
  if (input.fromFrontend === true) {
    return { allowed: false, status: "frontend_export_denied", reason: "Audit export must pass through the secure backend." };
  }
  if (input.authorizationVerified !== true) {
    return { allowed: false, status: "authorization_required", reason: "Audit export requires verified authorization." };
  }
  if (input.retentionStateVerified !== true) {
    return { allowed: false, status: "retention_state_required", reason: "Retention state must be verified before export." };
  }
  if (input.holdStateVerified !== true) {
    return { allowed: false, status: "hold_state_required", reason: "Hold state must be verified before export." };
  }
  if (input.reviewStateVerified !== true) {
    return { allowed: false, status: "review_state_required", reason: "Audit review state must be verified before export." };
  }
  if (input.exposesSecrets === true) {
    return { allowed: false, status: "secret_exposure_denied", reason: "Audit export cannot expose protected secrets." };
  }
  if (input.modifiesAudit === true) {
    return { allowed: false, status: "audit_modification_denied", reason: "Audit export is read-only." };
  }
  if (input.backendConnected !== true) {
    return { allowed: false, status: "backend_required", reason: "Audit export requires the secure backend." };
  }
  return { allowed: true, status: "validated", reason: "Audit export request passed validation." };
}
