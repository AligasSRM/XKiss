import { validateSystemSettingsRuntimeActivationRequest } from "./system-settings-runtime-activation-rules.js";

export const SYSTEM_SETTINGS_RUNTIME_ACTIVATION_CORE = {
  section: "15.15",
  name: "System Settings Runtime Activation Core",
  status: "connected",
  backendOnly: true,
  activationAllowed: false
};

export function getSystemSettingsRuntimeActivationStatus() {
  return {
    ok: true,
    stage: "15.15",
    service: SYSTEM_SETTINGS_RUNTIME_ACTIVATION_CORE.name,
    status: SYSTEM_SETTINGS_RUNTIME_ACTIVATION_CORE.status,
    backendOnly: true,
    activationAllowed: false,
    reason: "Runtime activation remains fail-closed until backend providers, authorization and audit verification are connected."
  };
}

export function evaluateSystemSettingsRuntimeActivation(request={}) {
  const validation = validateSystemSettingsRuntimeActivationRequest(request);
  return {
    allowed: validation.allowed === true,
    activationAllowed: false,
    gates: validation.gates
  };
}