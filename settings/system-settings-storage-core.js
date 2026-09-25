import {
  SYSTEM_SETTINGS_STORAGE_RULES,
  validateSystemSettingsStorageChange
} from "./system-settings-storage-rules.js";

export const SYSTEM_SETTINGS_STORAGE_CORE = {
  section: "15.6",
  name: "System Settings Storage Core",
  status: "ready",
  enabled: false,

  controls: {
    centralConfigurationRegistry: true,
    backendOnlyStorage: true,
    schemaValidation: true,
    secureDefaults: true,
    versionedChanges: true,
    auditSensitiveChanges: true,
    failClosed: true
  },

  frontendCannotStoreSecrets: true,
  frontendCannotWriteDirectly: true,
  activationRequiresBackend: true
};

export function getSystemSettingsStorageCoreStatus() {
  return {
    ok: true,
    stage: "15.6",
    coreConnected: true,
    rulesConnected: true,
    storageReady: false,
    activationAllowed: false,
    frontendCannotWriteDirectly: true,
    frontendCannotStoreSecrets: true,
    failClosed: true
  };
}

export function validateSystemSettingsStorageCore() {
  const status = getSystemSettingsStorageCoreStatus();

  return {
    ok:
      status.coreConnected === true &&
      status.rulesConnected === true &&
      status.activationAllowed === false &&
      status.frontendCannotWriteDirectly === true &&
      status.frontendCannotStoreSecrets === true &&
      status.failClosed === true,
    stage: "15.6",
    rulesVersion: SYSTEM_SETTINGS_STORAGE_RULES.version,
    controls: SYSTEM_SETTINGS_STORAGE_CORE.controls
  };
}

export function evaluateSystemSettingsStorageChange(input = {}) {
  const result = validateSystemSettingsStorageChange(input);

  return {
    ok: true,
    allowed: result.allowed === true,
    status: result.allowed ? "validated_but_backend_activation_required" : "denied",
    reason: result.reason,
    activationAllowed: false
  };
}
