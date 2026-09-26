import { getXKissSettingsRuntimeStatus, validateXKissSettingsRuntimeCore } from "../settings/xkiss-settings-runtime-core.js";

export const XKISS_PLATFORM_CORE = {
  section: "XKISS-PLATFORM-CORE",
  name: "XKiss Platform Core",
  version: "1.0.0",
  status: "connected",
  backendOnly: true,
  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true
};

export function getXKissPlatformCoreStatus() {
  const settings = getXKissSettingsRuntimeStatus();
  const settingsValidation = validateXKissSettingsRuntimeCore();

  return {
    ok:
      settings.ok === true &&
      settingsValidation.ok === true,
    service: XKISS_PLATFORM_CORE.name,
    version: XKISS_PLATFORM_CORE.version,
    status: XKISS_PLATFORM_CORE.status,
    backendOnly: XKISS_PLATFORM_CORE.backendOnly,
    settingsRuntimeConnected: settingsValidation.runtimeConnected === true,
    settingsBackendOnly: settings.backendOnly === true,
    activationAllowed: false
  };
}

export function validateXKissPlatformCore() {
  const status = getXKissPlatformCoreStatus();

  return {
    ok:
      status.ok === true &&
      status.settingsRuntimeConnected === true &&
      status.settingsBackendOnly === true &&
      status.activationAllowed === false,
    platformCoreConnected: true,
    settingsRuntimeConnected: status.settingsRuntimeConnected,
    activationAllowed: false
  };
}
