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

export const SYSTEM_SETTINGS_PROVIDER_INTEGRATION = {
  section: "15.5",
  name: "System Settings Provider Integration",
  status: "ready",
  enabled: false,
  preservesCoreGate: true,
  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true
};

export function getSystemSettingsProviderIntegrationStatus() {
  const core = getSystemSettingsCoreStatus();
  const provider = getSystemSettingsProviderCoreStatus();

  return {
    ok: true,
    stage: "15.5",
    integrationConnected: true,
    core15_4Connected: core.ok === true,
    provider15_5Connected: provider.ok === true,
    preservesCoreGate: true,
    activationAllowed: false,
    reason:
      "15.5 is integrated with 15.4 without bypassing the existing backend activation gate."
  };
}

export function validateSystemSettingsProviderIntegration() {
  const core = validateSystemSettingsCore();
  const provider = validateSystemSettingsProviderCore();
  const status = getSystemSettingsProviderIntegrationStatus();

  return {
    ok:
      core.ok === true &&
      provider.ok === true &&
      status.core15_4Connected === true &&
      status.provider15_5Connected === true &&
      status.preservesCoreGate === true &&
      status.activationAllowed === false,
    stage: "15.5",
    core15_4Validation: core,
    provider15_5Validation: provider,
    integrationConnected: status.integrationConnected,
    preservesCoreGate: status.preservesCoreGate,
    activationAllowed: false
  };
}

export function evaluateSystemSettingsProviderIntegration(input = {}) {
  const coreResult = evaluateSystemSettingsChange(input);
  const providerResult = evaluateSystemSettingsProvider(input.provider || {});

  return {
    ok: true,
    allowed: false,
    status: "backend_activation_required",
    core15_4: coreResult,
    provider15_5: providerResult,
    reason:
      "15.5 cannot activate or bypass 15.4. Secure backend registration, authorization, settings storage, and audit providers remain required."
  };
}
