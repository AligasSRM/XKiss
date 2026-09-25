import {
  getSystemSettingsCoreStatus,
  validateSystemSettingsCore,
  evaluateSystemSettingsChange
} from "./system-settings-core.js";

export function runSystemSettingsCoreSelfCheck() {
  const status = getSystemSettingsCoreStatus();
  const validation = validateSystemSettingsCore();

  const invalidCategory = evaluateSystemSettingsChange({
    category: "unknown",
    setting: "site_name",
    role: "super_admin"
  });

  const nonSuperAdmin = evaluateSystemSettingsChange({
    category: "platform",
    setting: "site_name",
    role: "admin"
  });

  const sensitiveSetting = evaluateSystemSettingsChange({
    category: "security",
    setting: "api_keys",
    role: "super_admin"
  });

  const validSuperAdmin = evaluateSystemSettingsChange({
    category: "platform",
    setting: "site_name",
    role: "super_admin"
  });

  const checks = {
    stage: status.section === "15.4",
    coreConnected: validation.coreConnected === true,
    rulesConnected: validation.rulesConnected === true,
    settingsStatusReady: validation.settingsStatusReady === true,
    protectedPolicyReady: validation.protectedPolicyReady === true,
    superAdminOnly: validation.superAdminOnly === true,
    sensitiveProtectionReady: validation.sensitiveProtectionReady === true,
    auditSensitiveChanges: validation.auditSensitiveChanges === true,
    activationBlockedUntilBackend: validation.activationAllowed === false,
    invalidCategoryDenied:
      invalidCategory.ok === false &&
      invalidCategory.allowed === false &&
      invalidCategory.status === "invalid_category",
    nonSuperAdminDenied:
      nonSuperAdmin.ok === true &&
      nonSuperAdmin.allowed === false &&
      nonSuperAdmin.status === "super_admin_required",
    sensitiveSettingBackendProtected:
      sensitiveSetting.ok === true &&
      sensitiveSetting.allowed === false &&
      sensitiveSetting.status === "backend_required" &&
      sensitiveSetting.auditRequired === true,
    validSuperAdminStillBackendGated:
      validSuperAdmin.ok === true &&
      validSuperAdmin.allowed === false &&
      validSuperAdmin.status === "not_enabled"
  };

  const passed = Object.values(checks).every(Boolean);

  return {
    ok: passed,
    stage: "15.4",
    test: "Core System Settings self-check",
    checks,
    activationAllowed: validation.activationAllowed,
    reason: passed
      ? "15.4 Core structure, access controls, sensitive-setting protection, and safe-denial behavior passed. Backend activation remains blocked until real providers are connected."
      : "One or more 15.4 Core checks failed."
  };
}
