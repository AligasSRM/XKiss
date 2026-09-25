import {
  getSystemSettingsCoreStatus,
  validateSystemSettingsCore
} from "./system-settings-core.js";

import {
  getSystemSettingsProviderCoreStatus,
  validateSystemSettingsProviderCore
} from "./system-settings-provider-core.js";

import {
  getSystemSettingsStorageCoreStatus,
  validateSystemSettingsStorageCore
} from "./system-settings-storage-core.js";

import {
  getSystemSettingsServiceCoreStatus,
  validateSystemSettingsServiceCore
} from "./system-settings-service-core.js";

import {
  getSystemSettingsApiCoreStatus,
  validateSystemSettingsApiCore,
  evaluateSystemSettingsApiRequest
} from "./system-settings-api-core.js";

export const SYSTEM_SETTINGS_API_INTEGRATION = {
  section: "15.8",
  name: "System Settings API Integration",
  status: "ready",
  enabled: false,
  preservesCoreGate: true,
  preservesProviderGate: true,
  preservesStorageGate: true,
  preservesServiceGate: true,
  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true
};

export function getSystemSettingsApiIntegrationStatus() {
  const core = getSystemSettingsCoreStatus();
  const provider = getSystemSettingsProviderCoreStatus();
  const storage = getSystemSettingsStorageCoreStatus();
  const service = getSystemSettingsServiceCoreStatus();
  const api = getSystemSettingsApiCoreStatus();

  return {
    ok: true,
    stage: "15.8",
    integrationConnected: true,
    core15_4Connected: core.ok === true,
    provider15_5Connected: provider.ok === true,
    storage15_6Connected: storage.ok === true,
    service15_7Connected: service.ok === true,
    api15_8Connected: api.ok === true,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    preservesServiceGate: true,
    activationAllowed: false
  };
}

export function validateSystemSettingsApiIntegration() {
  const core = validateSystemSettingsCore();
  const provider = validateSystemSettingsProviderCore();
  const storage = validateSystemSettingsStorageCore();
  const service = validateSystemSettingsServiceCore();
  const api = validateSystemSettingsApiCore();
  const status = getSystemSettingsApiIntegrationStatus();

  return {
    ok:
      core.ok === true &&
      provider.ok === true &&
      storage.ok === true &&
      service.ok === true &&
      api.ok === true &&
      status.integrationConnected === true &&
      status.core15_4Connected === true &&
      status.provider15_5Connected === true &&
      status.storage15_6Connected === true &&
      status.service15_7Connected === true &&
      status.api15_8Connected === true &&
      status.preservesCoreGate === true &&
      status.preservesProviderGate === true &&
      status.preservesStorageGate === true &&
      status.preservesServiceGate === true &&
      status.activationAllowed === false,
    stage: "15.8",
    core15_4Validation: core,
    provider15_5Validation: provider,
    storage15_6Validation: storage,
    service15_7Validation: service,
    api15_8Validation: api,
    activationAllowed: false
  };
}

export function evaluateSystemSettingsApiIntegration(input = {}) {
  const apiResult = evaluateSystemSettingsApiRequest(input);

  return {
    ok: true,
    allowed: apiResult.allowed === true,
    status: apiResult.status,
    api15_8: apiResult,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    preservesServiceGate: true,
    activationAllowed: false,
    reason:
      "15.8 provides the backend API boundary without bypassing 15.4 Core, 15.5 Providers, 15.6 Storage, or 15.7 Service."
  };
}
