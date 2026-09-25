export const SYSTEM_SETTINGS_STORAGE_RULES = {
  section: "15.6",
  name: "System Settings Storage Rules",
  version: "1.0",
  status: "prepared",
  enabled: false,

  principles: [
    "backend_only_storage",
    "central_configuration_registry",
    "secure_defaults",
    "schema_validation",
    "least_privilege",
    "versioned_changes",
    "audited_sensitive_changes",
    "fail_closed",
    "no_frontend_secrets"
  ],

  supportedTypes: ["boolean", "string", "number", "enum", "object"],

  protectedCategories: ["security", "payments", "storage"],

  sensitiveSettings: [
    "authentication_provider",
    "authorization_provider",
    "mfa_provider",
    "audit_provider",
    "payment_provider",
    "storage_provider",
    "api_keys",
    "private_keys",
    "session_secrets"
  ],

  frontendCannotStoreSecrets: true,
  frontendCannotWriteDirectly: true,
  sensitiveChangesRequireAudit: true,
  versionChanges: true,
  failClosed: true,
  activationRequiresBackend: true
};

export function validateSystemSettingsStorageChange(input = {}) {
  if (!input.key || typeof input.key !== "string") {
    return { allowed: false, reason: "invalid_setting_key" };
  }

  if (!input.category || typeof input.category !== "string") {
    return { allowed: false, reason: "invalid_setting_category" };
  }

  if (!SYSTEM_SETTINGS_STORAGE_RULES.supportedTypes.includes(input.type)) {
    return { allowed: false, reason: "unsupported_setting_type" };
  }

  if (input.fromFrontend === true) {
    return { allowed: false, reason: "frontend_cannot_write_settings" };
  }

  if (input.sensitive === true && input.auditProviderConnected !== true) {
    return { allowed: false, reason: "sensitive_change_requires_audit_provider" };
  }

  if (input.backendConnected !== true) {
    return { allowed: false, reason: "backend_storage_required" };
  }

  return {
    allowed: true,
    reason: "storage_change_validated"
  };
}
