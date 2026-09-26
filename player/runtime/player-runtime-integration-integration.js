import { getXKissPlayerRuntimeIntegrationStatus, evaluateXKissPlayerRuntimeIntegration } from "./player-runtime-integration-core.js";

export function validateXKissPlayerRuntimeIntegration() {
  const status = getXKissPlayerRuntimeIntegrationStatus();
  return { ok: status.ok === true && status.stage === "15.16" && status.status === "connected", stage: "15.16", integrationConnected: true };
}

export function evaluateXKissPlayerRuntimeIntegrationRequest(request = {}) {
  return evaluateXKissPlayerRuntimeIntegration(request);
}
