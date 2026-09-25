import {
  SYSTEM_SETTINGS_PROVIDER_RULES,
  isSupportedProviderType,
  getRequiredProviderCapabilities,
  getSystemSettingsProviderRulesStatus
} from "./system-settings-provider-rules.js";

export const SYSTEM_SETTINGS_PROVIDER_CORE = {
  section: "15.5",
  name: "System Settings Provider Core",
  status: "ready",
  enabled: false,
  controls: {
    settingsProvider: true,
    authorizationProvider: true,
    auditProvider: true,
    capabilityValidation: true,
    failClosed: true
  },
  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

function normalizeCapabilities(value) {
  return Array.isArray(value)
    ? value.map(clean).filter(Boolean)
    : [];
}

export function evaluateProviderRegistration(input = {}) {
  const type = clean(input.type);
  const capabilities = normalizeCapabilities(input.capabilities);

  if (!isSupportedProviderType(type)) {
    return {
      ok: false,
      allowed: false,
      status: "invalid_provider_type",
      reason: "Unsupported system settings provider type."
    };
  }

  const required = getRequiredProviderCapabilities(type);
  const missing = required.filter((capability) => !capabilities.includes(capability));

  if (missing.length > 0) {
    return {
      ok: true,
      allowed: false,
      status: "missing_capabilities",
      providerType: type,
      requiredCapabilities: required,
      missingCapabilities: missing,
      reason: "Provider registration is denied until every required capability is declared."
    };
  }

  return {
    ok: true,
    allowed: false,
    status: "backend_registration_required",
    providerType: type,
    requiredCapabilities: required,
    capabilities,
    reason: "Provider registration must be completed by the secure backend. Frontend registration is never authorized."
  };
}

export function getSystemSettingsProviderCoreStatus() {
  return {
    ok: true,
    ...SYSTEM_SETTINGS_PROVIDER_CORE,
    rules: SYSTEM_SETTINGS_PROVIDER_RULES,
    rulesStatus: getSystemSettingsProviderRulesStatus()
  };
}

export function validateSystemSettingsProviderCore() {
  const status = getSystemSettingsProviderCoreStatus();

  return {
    ok: true,
    stage: "15.5",
    coreConnected: true,
    rulesConnected: status.rules != null,
    capabilityValidationReady: status.controls.capabilityValidation === true,
    failClosed: status.controls.failClosed === true,
    frontendCannotAuthorize: status.frontendCannotAuthorize === true,
    frontendCannotStoreSecrets: status.frontendCannotStoreSecrets === true,
    activationAllowed: false,
    reason: "15.5 provider layer is structurally prepared. Real backend providers remain required before activation."
  };
}

export function evaluateSystemSettingsProvider(input = {}) {
  return evaluateProviderRegistration(input);
}
