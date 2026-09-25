export const SYSTEM_SETTINGS_API_RULES = {
  section: "15.8",
  name: "System Settings API Rules",
  version: "1.0",
  status: "prepared",
  enabled: false,

  principles: [
    "backend_api_boundary",
    "authenticated_requests",
    "super_admin_authorization",
    "operation_allowlist",
    "least_privilege",
    "audit_sensitive_changes",
    "fail_closed",
    "no_frontend_secrets"
  ],

  allowedOperations: [
    "read_setting",
    "read_settings",
    "validate_change",
    "write_setting",
    "read_version"
  ],

  readOperations: [
    "read_setting",
    "read_settings",
    "read_version"
  ],

  writeOperations: [
    "validate_change",
    "write_setting"
  ],

  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  authenticationRequired: true,
  superAdminRequiredForWrites: true,
  sensitiveWritesRequireAudit: true,
  activationRequiresBackend: true
};

export function isSupportedSystemSettingsApiOperation(value) {
  return SYSTEM_SETTINGS_API_RULES.allowedOperations.includes(
    String(value || "").trim()
  );
}

export function isSystemSettingsApiReadOperation(value) {
  return SYSTEM_SETTINGS_API_RULES.readOperations.includes(
    String(value || "").trim()
  );
}

export function isSystemSettingsApiWriteOperation(value) {
  return SYSTEM_SETTINGS_API_RULES.writeOperations.includes(
    String(value || "").trim()
  );
}

export function validateSystemSettingsApiRequest(input = {}) {
  const operation = String(input.operation || "").trim();

  if (!isSupportedSystemSettingsApiOperation(operation)) {
    return {
      allowed: false,
      status: "invalid_operation",
      reason: "Unsupported system settings API operation."
    };
  }

  if (input.authenticated !== true) {
    return {
      allowed: false,
      status: "authentication_required",
      reason: "Authenticated backend access is required."
    };
  }

  if (isSystemSettingsApiWriteOperation(operation) &&
      input.role !== "super_admin") {
    return {
      allowed: false,
      status: "super_admin_required",
      reason: "System settings write operations require Super Admin authorization."
    };
  }

  if (input.fromFrontend === true &&
      SYSTEM_SETTINGS_API_RULES.frontendCannotAuthorize === true &&
      isSystemSettingsApiWriteOperation(operation)) {
    return {
      allowed: false,
      status: "frontend_authorization_denied",
      reason: "Frontend cannot authorize system settings changes."
    };
  }

  if (operation === "write_setting" &&
      input.sensitive === true &&
      input.auditProviderConnected !== true) {
    return {
      allowed: false,
      status: "audit_provider_required",
      reason: "Sensitive system settings writes require backend audit."
    };
  }

  if (input.serviceLayerConnected !== true) {
    return {
      allowed: false,
      status: "service_layer_required",
      reason: "System settings API requires the 15.7 service layer."
    };
  }

  if (input.backendConnected !== true) {
    return {
      allowed: false,
      status: "backend_required",
      reason: "System settings API requires the secure backend."
    };
  }

  return {
    allowed: true,
    status: "validated",
    reason: "System settings API request passed boundary validation."
  };
}
