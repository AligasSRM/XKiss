export const SYSTEM_SETTINGS_SERVICE_RULES = {
  section: "15.7",
  name: "System Settings Service Rules",
  version: "1.0",
  status: "prepared",
  enabled: false,

  principles: [
    "backend_only_service",
    "least_privilege",
    "read_write_separation",
    "schema_validation",
    "audit_sensitive_changes",
    "versioned_configuration",
    "fail_closed",
    "no_frontend_secrets"
  ],

  operations: [
    "read_setting",
    "read_settings",
    "validate_change",
    "write_setting",
    "read_version"
  ],

  protectedCategories: ["security", "payments", "storage"],
  sensitiveOperations: ["write_setting", "read_version"],

  frontendCannotCallSensitiveOperationsDirectly: true,
  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  writesRequireAuthorization: true,
  sensitiveWritesRequireAudit: true,
  activationRequiresBackend: true
};

export function isSupportedSystemSettingsOperation(value) {
  return SYSTEM_SETTINGS_SERVICE_RULES.operations.includes(String(value || "").trim());
}

export function validateSystemSettingsServiceRequest(input = {}) {
  const operation = String(input.operation || "").trim();

  if (!isSupportedSystemSettingsOperation(operation)) {
    return {
      allowed: false,
      status: "invalid_operation",
      reason: "Unsupported system settings service operation."
    };
  }

  if (input.fromFrontend === true && operation !== "read_setting" && operation !== "read_settings") {
    return {
      allowed: false,
      status: "frontend_operation_denied",
      reason: "Frontend may request reads but cannot directly authorize or perform protected configuration operations."
    };
  }

  if ((operation === "write_setting" || operation === "validate_change") &&
      input.authorizationProviderConnected !== true) {
    return {
      allowed: false,
      status: "authorization_provider_required",
      reason: "Configuration changes require backend authorization."
    };
  }

  if (operation === "write_setting" &&
      input.sensitive === true &&
      input.auditProviderConnected !== true) {
    return {
      allowed: false,
      status: "audit_provider_required",
      reason: "Sensitive configuration writes require backend audit."
    };
  }

  if (input.backendConnected !== true) {
    return {
      allowed: false,
      status: "backend_required",
      reason: "System settings service requires the secure backend."
    };
  }

  return {
    allowed: true,
    status: "validated",
    reason: "System settings service request passed rule validation."
  };
}
