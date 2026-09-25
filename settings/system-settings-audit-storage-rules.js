export const SYSTEM_SETTINGS_AUDIT_STORAGE_RULES = {
  section: "15.10",
  name: "System Settings Audit Storage Rules",
  version: "1.0",
  status: "prepared",
  enabled: false,
  principles: [
    "backend_only_storage",
    "append_only_records",
    "immutable_audit_history",
    "retention_policy",
    "read_write_separation",
    "least_privilege",
    "fail_closed",
    "no_frontend_secrets"
  ],
  operations: [
    "append_audit_event",
    "read_audit_event",
    "read_audit_history",
    "validate_retention"
  ],
  frontendCannotWriteDirectly: true,
  frontendCannotDeleteAudit: true,
  frontendCannotAlterAudit: true,
  appendOnly: true,
  deletionRequiresBackendPolicy: true,
  retentionRequiresBackendPolicy: true,
  activationRequiresBackend: true
};

export function validateSystemSettingsAuditStorageRequest(input = {}) {
  const operation = String(input.operation || "").trim();

  if (!SYSTEM_SETTINGS_AUDIT_STORAGE_RULES.operations.includes(operation)) {
    return { allowed: false, status: "invalid_operation", reason: "Unsupported audit storage operation." };
  }

  if (input.fromFrontend === true && operation !== "read_audit_event" && operation !== "read_audit_history") {
    return { allowed: false, status: "frontend_write_denied", reason: "Frontend cannot write or alter audit storage." };
  }

  if (operation === "append_audit_event" && input.appendOnly !== true) {
    return { allowed: false, status: "append_only_required", reason: "Audit records must be append-only." };
  }

  if (operation === "validate_retention" && input.retentionPolicyVerified !== true) {
    return { allowed: false, status: "retention_policy_required", reason: "Retention policy must be backend-verified." };
  }

  if (input.backendConnected !== true) {
    return { allowed: false, status: "backend_required", reason: "Audit storage requires the secure backend." };
  }

  return { allowed: true, status: "validated", reason: "Audit storage request passed validation." };
}
