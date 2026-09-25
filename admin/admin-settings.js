import { ADMIN_DASHBOARD_RULES } from "./admin-rules.js";

export const ADMIN_SETTINGS_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  settingsGroups: [
    "platform",
    "content",
    "users",
    "security",
    "payments",
    "storage",
    "notifications"
  ],

  supportedActions: [
    "view",
    "propose",
    "update",
    "rollback"
  ],

  protectedSettings: [
    "platform_age_requirement",
    "admin_roles",
    "admin_permissions",
    "payment_provider",
    "storage_provider",
    "security_policy"
  ],

  authenticationRequired: true,
  permissionRequired: true,
  reauthenticationRequiredForProtectedSettings: true,
  changeApprovalRequired: true,
  auditTrailRequired: true,
  frontendCannotChangeProtectedSettings: true,
  frontendCannotGrantPermissions: true,

  settingsStore: null,
  auditStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getAdminSettingsStatus() {
  return {
    ok: true,
    status: ADMIN_SETTINGS_RULES.status,
    enabled: ADMIN_SETTINGS_RULES.enabled,
    settingsStoreConnected: Boolean(ADMIN_SETTINGS_RULES.settingsStore),
    auditStorageConnected: Boolean(ADMIN_SETTINGS_RULES.auditStorage),
    reason: "Admin settings management is prepared but secure backend settings storage and authorization are not connected."
  };
}

export function validateSettingsGroup(group) {
  const value = clean(group);

  if (!ADMIN_SETTINGS_RULES.settingsGroups.includes(value)) {
    return {
      ok: false,
      status: "invalid_group",
      reason: "Unsupported settings group."
    };
  }

  return {
    ok: true,
    status: "valid",
    group: value
  };
}

export function validateSettingsAction(input = {}) {
  const action = clean(input.action);
  const setting = clean(input.setting);

  if (!action || !setting) {
    return {
      ok: false,
      status: "invalid",
      reason: "setting and action are required."
    };
  }

  if (!ADMIN_SETTINGS_RULES.supportedActions.includes(action)) {
    return {
      ok: false,
      status: "invalid_action",
      reason: "Unsupported settings action."
    };
  }

  const protectedSetting =
    ADMIN_SETTINGS_RULES.protectedSettings.includes(setting);

  if (!ADMIN_SETTINGS_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      allowed: false,
      setting,
      action,
      protectedSetting,
      reason: "Admin settings changes are not active until secure backend authorization is connected."
    };
  }

  return {
    ok: true,
    status: protectedSetting
      ? "reauthentication_required"
      : "permission_required",
    allowed: false,
    setting,
    action,
    protectedSetting,
    reason: "The backend must authorize, execute and audit this settings action."
  };
}

export function isProtectedSetting(setting) {
  return ADMIN_SETTINGS_RULES.protectedSettings.includes(clean(setting));
}
