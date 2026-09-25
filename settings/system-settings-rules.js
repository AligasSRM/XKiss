export const SYSTEM_SETTINGS_RULES = {
  section: "15.4",
  version: "1.0",
  status: "prepared",
  enabled: false,

  principles: [
    "centralized_configuration",
    "least_privilege",
    "secure_defaults",
    "backend_authorization",
    "audit_sensitive_changes",
    "no_frontend_secrets"
  ],

  categories: [
    "platform",
    "video",
    "creator",
    "user",
    "security",
    "payments",
    "storage",
    "moderation",
    "notifications"
  ],

  protectedCategories: [
    "security",
    "payments",
    "storage"
  ],

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

  editableBySuperAdminOnly: [
    "platform",
    "video",
    "creator",
    "user",
    "security",
    "payments",
    "storage",
    "moderation",
    "notifications"
  ],

  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  sensitiveChangesRequireAudit: true,
  activationRequiresBackend: true,

  settingsProvider: null,
  auditProvider: null
};

function clean(value) {
  return String(value || "").trim();
}

export function isSystemSettingsCategory(value) {
  return SYSTEM_SETTINGS_RULES.categories.includes(clean(value));
}

export function isProtectedSettingsCategory(value) {
  return SYSTEM_SETTINGS_RULES.protectedCategories.includes(clean(value));
}

export function isSensitiveSystemSetting(value) {
  return SYSTEM_SETTINGS_RULES.sensitiveSettings.includes(clean(value));
}

export function canSuperAdminEditCategory(value) {
  return SYSTEM_SETTINGS_RULES.editableBySuperAdminOnly.includes(clean(value));
}

export function getSystemSettingsStatus() {
  return {
    ok: true,
    section: SYSTEM_SETTINGS_RULES.section,
    status: SYSTEM_SETTINGS_RULES.status,
    enabled: SYSTEM_SETTINGS_RULES.enabled,
    providerConnected: Boolean(SYSTEM_SETTINGS_RULES.settingsProvider),
    auditConnected: Boolean(SYSTEM_SETTINGS_RULES.auditProvider),
    activationRequiresBackend: SYSTEM_SETTINGS_RULES.activationRequiresBackend,
    frontendCannotAuthorize: SYSTEM_SETTINGS_RULES.frontendCannotAuthorize,
    frontendCannotStoreSecrets: SYSTEM_SETTINGS_RULES.frontendCannotStoreSecrets,
    reason: "System settings foundation is prepared. Secure backend settings storage and authorization are required before activation."
  };
}

export function validateSystemSettingsChange(input = {}) {
  const category = clean(input.category);
  const setting = clean(input.setting);
  const role = clean(input.role);

  if (!isSystemSettingsCategory(category)) {
    return {
      ok: false,
      allowed: false,
      status: "invalid_category",
      reason: "Unsupported system settings category."
    };
  }

  if (!canSuperAdminEditCategory(category) || role !== "super_admin") {
    return {
      ok: true,
      allowed: false,
      status: "super_admin_required",
      category,
      setting,
      reason: "System settings changes require the Super Admin role."
    };
  }

  if (isSensitiveSystemSetting(setting)) {
    return {
      ok: true,
      allowed: false,
      status: "backend_required",
      category,
      setting,
      auditRequired: true,
      reason: "Sensitive system settings require secure backend authorization and audited storage."
    };
  }

  if (!SYSTEM_SETTINGS_RULES.enabled || !SYSTEM_SETTINGS_RULES.settingsProvider) {
    return {
      ok: true,
      allowed: false,
      status: "not_enabled",
      category,
      setting,
      reason: "System settings are not active until the secure backend settings provider is connected."
    };
  }

  return {
    ok: true,
    allowed: false,
    status: "backend_authorization_required",
    category,
    setting,
    reason: "The configured backend must authorize and persist the system settings change."
  };
}

export function getProtectedSystemSettingsPolicy() {
  return {
    ok: true,
    status: "prepared",
    protectedCategories: [...SYSTEM_SETTINGS_RULES.protectedCategories],
    sensitiveSettings: [...SYSTEM_SETTINGS_RULES.sensitiveSettings],
    frontendAccessAllowed: false,
    reason: "Sensitive system settings and secrets remain protected from frontend authorization and client-side storage."
  };
}
