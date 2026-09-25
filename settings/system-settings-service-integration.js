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
  validateSystemSettingsServiceCore,
  evaluateSystemSettingsServiceRequest
} from "./system-settings-service-core.js";

export const SYSTEM_SETTINGS_SERVICE_INTEGRATION = {
  section: "15.7",
  name: "System Settings Service Integration",
  status: "ready",
  enabled: false,
  preservesCoreGate: true,
  preservesProviderGate: true,
  preservesStorageGate: true,
  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true
};

export function getSystemSettingsServiceIntegrationStatus() {
  const core = getSystemSettingsCoreStatus();
  const provider = getSystemSettingsProviderCoreStatus();
  const storage = getSystemSettingsStorageCoreStatus();
  const service = getSystemSettingsServiceCoreStatus();

  return {
    ok: true,
    stage: "15.7",
    integrationConnected: true,
    core15_4Connected: core.ok === true,
    provider15_5Connected: provider.ok === true,
    storage15_6Connected: storage.ok === true,
    service15_7Connected: service.ok === true,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    activationAllowed: false
  };
}

export function validateSystemSettingsServiceIntegration() {
  const core = validateSystemSettingsCore();
  const provider = validateSystemSettingsProviderCore();
  const storage = validateSystemSettingsStorageCore();
  const service = validateSystemSettingsServiceCore();
  const status = getSystemSettingsServiceIntegrationStatus();

  return {
    ok:
      core.ok === true &&
      provider.ok === true &&
      storage.ok === true &&
      service.ok === true &&
      status.integrationConnected === true &&
      status.core15_4Connected === true &&
      status.provider15_5Connected === true &&
      status.storage15_6Connected === true &&
      status.service15_7Connected === true &&
      status.preservesCoreGate === true &&
      status.preservesProviderGate === true &&
      status.preservesStorageGate === true &&
      status.activationAllowed === false,
    stage: "15.7",
    core15_4Validation: core,
    provider15_5Validation: provider,
    storage15_6Validation: storage,
    service15_7Validation: service,
    activationAllowed: false
  };
}

export function evaluateSystemSettingsServiceIntegration(input = {}) {
  const serviceResult = evaluateSystemSettingsServiceRequest(input);

  return {
    ok: true,
    allowed: serviceResult.allowed === true,
    status: serviceResult.status,
    service15_7: serviceResult,
    preservesCoreGate: true,
    preservesProviderGate: true,
    preservesStorageGate: true,
    activationAllowed: false,
    reason:
      "15.7 provides the service boundary without bypassing 15.4 Core, 15.5 Providers, or 15.6 Storage."
  };
}
