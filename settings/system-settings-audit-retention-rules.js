export const SYSTEM_SETTINGS_AUDIT_RETENTION_RULES = {
  section: "15.11",
  name: "System Settings Audit Retention Rules",
  version: "1.0",
  status: "prepared",
  enabled: false,
  principles: [
    "backend_only_retention",
    "policy_driven_retention",
    "immutable_audit_history",
    "legal_and_security_hold",
    "least_privilege",
    "fail_closed",
    "no_frontend_authority"
  ],
  operations: [
    "validate_retention_policy",
    "apply_retention_policy",
    "place_hold",
    "release_hold",
    "read_retention_status"
  ],
  frontendCannotApplyRetention: true,
  frontendCannotDeleteAudit: true,
  holdsOverrideDeletion: true,
  deletionRequiresVerifiedPolicy: true,
  activationRequiresBackend: true
};

export function validateSystemSettingsAuditRetentionRequest(input = {}) {
  const operation = String(input.operation || "").trim();
  if (!SYSTEM_SETTINGS_AUDIT_RETENTION_RULES.operations.includes(operation)) {
    return { allowed: false, status: "invalid_operation", reason: "Unsupported audit retention operation." };
  }
  if (input.fromFrontend === true && operation !== "read_retention_status") {
    return { allowed: false, status: "frontend_retention_denied", reason: "Frontend cannot change audit retention state." };
  }
  if ((operation === "apply_retention_policy" || operation === "validate_retention_policy") &&
      input.retentionPolicyVerified !== true) {
    return { allowed: false, status: "retention_policy_not_verified", reason: "Retention policy must be backend-verified." };
  }
  if ((operation === "apply_retention_policy" || operation === "release_hold") &&
      input.holdStateVerified !== true) {
    return { allowed: false, status: "hold_state_verification_required", reason: "Hold state must be backend-verified." };
  }
  if (input.backendConnected !== true) {
    return { allowed: false, status: "backend_required", reason: "Audit retention requires the secure backend." };
  }
  return { allowed: true, status: "validated", reason: "Audit retention request passed validation." };
}
