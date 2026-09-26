import { getSystemSettingsCoreStatus, validateSystemSettingsCore } from "./system-settings-core.js";

export const XKISS_SETTINGS_RUNTIME_CORE = {
  section: "15.RUNTIME-SETTINGS",
  name: "XKiss Settings Runtime Core",
  status: "connected",
  backendOnly: true,
  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true
};

export function getXKissSettingsRuntimeStatus() {
  const core = getSystemSettingsCoreStatus();
  const validation = validateSystemSettingsCore();

  return {
    ok: core.ok === true && validation.ok === true,
    service: XKISS_SETTINGS_RUNTIME_CORE.name,
    status: XKISS_SETTINGS_RUNTIME_CORE.status,
    backendOnly: XKISS_SETTINGS_RUNTIME_CORE.backendOnly,
    coreStage: core.section,
    coreConnected: validation.coreConnected === true,
    rulesConnected: validation.rulesConnected === true,
    activationAllowed: false,
    reason: "Settings Runtime Core is connected to the XKiss backend boundary. Production activation remains disabled until backend providers are connected."
  };
}

export function validateXKissSettingsRuntimeCore() {
  const status = getXKissSettingsRuntimeStatus();

  return {
    ok: status.ok === true,
    runtimeConnected: status.coreConnected === true,
    backendOnly: status.backendOnly === true,
    activationAllowed: false
  };
}
