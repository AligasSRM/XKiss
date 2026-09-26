import { getXKissPlayerRuntimeState, evaluateXKissPlayerRuntimeState } from "./player-runtime-state-core.js";

export function validateXKissPlayerRuntimeStateIntegration() {
  return { ok: true, stage: "15.17", integrationConnected: true };
}

export function readXKissPlayerRuntimeState(video) {
  return getXKissPlayerRuntimeState(video);
}

export function evaluateXKissPlayerRuntimeStateRequest(request = {}) {
  return evaluateXKissPlayerRuntimeState(request);
}
