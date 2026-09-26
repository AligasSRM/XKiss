import { getSystemSettingsCoreStatus, validateSystemSettingsCore } from "./system-settings-core.js";
import {
  getSystemSettingsRuntimeActivationStatus,
  evaluateSystemSettingsRuntimeActivation
} from "./system-settings-runtime-activation-core.js";

export const XKISS_SETTINGS_RUNTIME_CORE = {
  section: "15.RUNTIME-SETTINGS",
  name: "XKiss Settings Runtime Core",
  status: "connected",
  backendOnly: true,
  frontendCannotAuthorize: true,
  frontendCannotStoreSecrets: true,
  activationRequiresBackend: true,
  activationStage: "15.15"
};

export function getXKissSettingsRuntimeStatus() {
  const core = getSystemSettingsCoreStatus();
  const validation = validateSystemSettingsCore();
  const activation = getSystemSettingsRuntimeActivationStatus();
  const activationGate = evaluateSystemSettingsRuntimeActivation({
    operation: "validate_activation",
    backendConnected: false,
    providersVerified: false,
    authorizationVerified: false,
    auditVerified: false
  });

  return {
    ok: core.ok === true && validation.ok === true && activation.ok === true,
    service: XKISS_SETTINGS_RUNTIME_CORE.name,
    status: XKISS_SETTINGS_RUNTIME_CORE.status,
    backendOnly: XKISS_SETTINGS_RUNTIME_CORE.backendOnly,
    coreStage: core.section,
    coreConnected: validation.coreConnected === true,
    rulesConnected: validation.rulesConnected === true,
    activationStage: activation.stage,
    activationGateConnected: activation.status === "connected",
    activationAllowed: activationGate.allowed === true && activation.activationAllowed === true,
    reason: "Settings Runtime Core is connected to the XKiss backend boundary. Production activation remains fail-closed until backend providers, authorization and audit verification are connected."
  };
}

export function validateXKissSettingsRuntimeCore() {
  const status = getXKissSettingsRuntimeStatus();

  return {
    ok: status.ok === true,
    runtimeConnected: status.coreConnected === true,
    backendOnly: status.backendOnly === true,
    activationGateConnected: status.activationGateConnected === true,
    activationAllowed: false
  };
}
