import {
  getSystemSettingsCoreStatus,
  validateSystemSettingsCore,
  evaluateSystemSettingsChange
} from "./system-settings-core.js";

import {
  getSystemSettingsProviderCoreStatus,
  validateSystemSettingsProviderCore,
  evaluateSystemSettingsProvider
} from "./system-settings-provider-core.js";

import {
  getSystemSettingsStorageCoreStatus,
  validateSystemSettingsStorageCore,
  evaluateSystemSettingsStorageChange
} from "./system-settings-storage-core.js";

export const SYSTEM_SETTINGS_STORAGE_INTEGRATION = {
  section: "15.6",
  name: "System Settings Storage Integration",
  status: "ready",
  enabled: false,
  preservesCoreGate: true,
  preservesProviderGate: true,
  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true
};

export function getSystemSettingsStorageIntegrationStatus() {
  const core = getSystemSettingsCoreStatus();
  const provider = getSystemSettingsProviderCoreStatus();
  const storage = getSystemSettingsStorageCoreStatus();

  return {
    ok: true,
    stage: "15.6",
    integrationConnected: true,
    core15_4Connected: core.ok === true,
    provider15_5Connected: provider.ok === true,
    storage15_6Connected: storage.ok === true,
    preservesCoreGate: true,
    preservesProviderGate: true,
    activationAllowed: false
  };
}

export function validateSystemSettingsStorageIntegration() {
  const core = validateSystemSettingsCore();
  const provider = validateSystemSettingsProviderCore();
  const storage = validateSystemSettingsStorageCore();
  const status = getSystemSettingsStorageIntegrationStatus();

  return {
    ok:
      core.ok === true &&
      provider.ok === true &&
      storage.ok === true &&
      status.integrationConnected === true &&
      status.core15_4Connected === true &&
      status.provider15_5Connected === true &&
      status.storage15_6Connected === true &&
      status.preservesCoreGate === true &&
      status.preservesProviderGate === true &&
      status.activationAllowed === false,
    stage: "15.6",
    core15_4Validation: core,
    provider15_5Validation: provider,
    storage15_6Validation: storage,
    activationAllowed: false
  };
}

export function evaluateSystemSettingsStorageIntegration(input = {}) {
  const coreResult = evaluateSystemSettingsChange(input);
  const providerResult = evaluateSystemSettingsProvider(input.provider || {});
  const storageResult = evaluateSystemSettingsStorageChange(input.storage || {});

  return {
    ok: true,
    allowed: false,
    status: "backend_activation_required",
    core15_4: coreResult,
    provider15_5: providerResult,
    storage15_6: storageResult,
    reason:
      "15.6 cannot bypass 15.4 or 15.5. Backend authorization, provider registration, secure storage, and audit remain required."
  };
}
