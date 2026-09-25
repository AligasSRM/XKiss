export const SYSTEM_SETTINGS_AUDIT_RULES = {
  section: "15.9",
  name: "System Settings Audit Rules",
  version: "1.0",
  status: "prepared",
  enabled: false,

  principles: [
    "immutable_audit_records",
    "backend_only_audit",
    "sensitive_change_tracking",
    "actor_attribution",
    "timestamped_events",
    "least_privilege",
    "fail_closed",
    "no_frontend_secrets"
  ],

  eventTypes: [
    "settings_read",
    "settings_validated",
    "settings_written",
    "settings_version_read",
    "settings_write_denied"
  ],

  requiredFields: [
    "eventType",
    "actorId",
    "actorRole",
    "timestamp",
    "operation",
    "result"
  ],

  sensitiveOperations: [
    "write_setting",
    "read_version"
  ],

  frontendCannotWriteAudit: true,
  frontendCannotForgeActor: true,
  frontendCannotForgeTimestamp: true,
  sensitiveChangesRequireAudit: true,
  activationRequiresBackend: true
};

export function isSupportedSystemSettingsAuditEvent(value) {
  return SYSTEM_SETTINGS_AUDIT_RULES.eventTypes.includes(
    String(value || "").trim()
  );
}

export function validateSystemSettingsAuditEvent(input = {}) {
  const eventType = String(input.eventType || "").trim();

  if (!isSupportedSystemSettingsAuditEvent(eventType)) {
    return {
      allowed: false,
      status: "invalid_event_type",
      reason: "Unsupported system settings audit event."
    };
  }

  if (input.fromFrontend === true) {
    return {
      allowed: false,
      status: "frontend_audit_denied",
      reason: "Frontend cannot directly create or alter system settings audit records."
    };
  }

  for (const field of SYSTEM_SETTINGS_AUDIT_RULES.requiredFields) {
    if (input[field] === undefined || input[field] === null || String(input[field]).trim() === "") {
      return {
        allowed: false,
        status: "required_field_missing",
        field,
        reason: "Audit event is missing a required field."
      };
    }
  }

  if (input.actorVerified !== true) {
    return {
      allowed: false,
      status: "actor_verification_required",
      reason: "Audit records require a verified backend actor."
    };
  }

  if (input.timestampVerified !== true) {
    return {
      allowed: false,
      status: "timestamp_verification_required",
      reason: "Audit records require a backend-verified timestamp."
    };
  }

  if (input.backendConnected !== true) {
    return {
      allowed: false,
      status: "backend_required",
      reason: "System settings audit requires the secure backend."
    };
  }

  return {
    allowed: true,
    status: "validated",
    reason: "System settings audit event passed validation."
  };
}
