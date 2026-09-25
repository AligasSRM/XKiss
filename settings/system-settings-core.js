import {
  SYSTEM_SETTINGS_RULES,
  getSystemSettingsStatus,
  validateSystemSettingsChange,
  getProtectedSystemSettingsPolicy
} from "./system-settings-rules.js";

export const SYSTEM_SETTINGS_CORE = {
  section: "15.4",
  name: "Core System Settings",
  status: "ready",
  enabled: false,
  rulesModule: "system-settings-rules",
  controls: {
    centralizedConfiguration: true,
    superAdminOnly: true,
    sensitiveSettingsProtection: true,
    auditSensitiveChanges: true,
    externalProviders: true
  },
  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true
};

export function getSystemSettingsCoreStatus() {
  return {
    ok: true,
    ...SYSTEM_SETTINGS_CORE,
    rules: SYSTEM_SETTINGS_RULES,
    settings: getSystemSettingsStatus(),
    protectedPolicy: getProtectedSystemSettingsPolicy()
  };
}

export function validateSystemSettingsCore() {
  const status = getSystemSettingsCoreStatus();

  return {
    ok: true,
    stage: "15.4",
    coreConnected: true,
    rulesConnected: Boolean(status.rules),
    settingsStatusReady: status.settings.ok === true,
    protectedPolicyReady: status.protectedPolicy.ok === true,
    superAdminOnly: SYSTEM_SETTINGS_CORE.controls.superAdminOnly,
    sensitiveProtectionReady: SYSTEM_SETTINGS_CORE.controls.sensitiveSettingsProtection,
    auditSensitiveChanges: SYSTEM_SETTINGS_CORE.controls.auditSensitiveChanges,
    activationAllowed: false,
    reason: "15.4 Core is structurally connected. Backend settings and audit providers are not connected, so activation remains disabled."
  };
}

export function evaluateSystemSettingsChange(input = {}) {
  return validateSystemSettingsChange(input);
}

export function getSystemSettingsProtectedPolicy() {
  return getProtectedSystemSettingsPolicy();
}
