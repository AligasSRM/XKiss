import {
  getSystemSettingsProviderCoreStatus,
  validateSystemSettingsProviderCore,
  evaluateSystemSettingsProvider
} from "./system-settings-provider-core.js";

export function runSystemSettingsProviderCoreSelfCheck() {
  const status = getSystemSettingsProviderCoreStatus();
  const validation = validateSystemSettingsProviderCore();

  const invalidType = evaluateSystemSettingsProvider({
    type: "unknown",
    capabilities: []
  });

  const missingCapabilities = evaluateSystemSettingsProvider({
    type: "audit",
    capabilities: ["read_audit"]
  });

  const completeSettingsProvider = evaluateSystemSettingsProvider({
    type: "settings",
    capabilities: ["read_settings", "write_settings"]
  });

  const checks = {
    stage: status.section === "15.5",
    coreConnected: validation.coreConnected === true,
    rulesConnected: validation.rulesConnected === true,
    capabilityValidationReady: validation.capabilityValidationReady === true,
    failClosed: validation.failClosed === true,
    frontendCannotAuthorize: validation.frontendCannotAuthorize === true,
    frontendCannotStoreSecrets: validation.frontendCannotStoreSecrets === true,
    activationBlockedUntilBackend: validation.activationAllowed === false,

    invalidProviderTypeDenied:
      invalidType.ok === false &&
      invalidType.allowed === false &&
      invalidType.status === "invalid_provider_type",

    missingCapabilitiesDenied:
      missingCapabilities.ok === true &&
      missingCapabilities.allowed === false &&
      missingCapabilities.status === "missing_capabilities",

    completeProviderStillBackendGated:
      completeSettingsProvider.ok === true &&
      completeSettingsProvider.allowed === false &&
      completeSettingsProvider.status === "backend_registration_required"
  };

  const passed = Object.values(checks).every(Boolean);

  return {
    ok: passed,
    stage: "15.5",
    test: "System Settings Provider Core self-check",
    checks,
    activationAllowed: validation.activationAllowed,
    reason: passed
      ? "15.5 provider contracts, capability validation, frontend isolation, and fail-closed behavior passed. Real backend registration remains required."
      : "One or more 15.5 provider checks failed."
  };
}
