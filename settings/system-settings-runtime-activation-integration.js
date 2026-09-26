import { getSystemSettingsRuntimeActivationStatus, evaluateSystemSettingsRuntimeActivation } from "./system-settings-runtime-activation-core.js";

export function validateSystemSettingsRuntimeActivationIntegration() {
  const status = getSystemSettingsRuntimeActivationStatus();
  return {
    ok: status.ok === true && status.stage === "15.15" && status.backendOnly === true && status.activationAllowed === false,
    stage: "15.15",
    integrationConnected: true,
    activationAllowed: false
  };
}

export function evaluateSystemSettingsRuntimeActivationIntegration(request={}) {
  const result = evaluateSystemSettingsRuntimeActivation(request);
  return {
    allowed: result.allowed === true,
    activationAllowed: false,
    gates: result.gates
  };
}