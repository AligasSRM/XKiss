import { validateXKissPlayerRuntimeIntegrationRequest } from "./player-runtime-integration-rules.js";

export const XKISS_PLAYER_RUNTIME_INTEGRATION_CORE = {
  section: "15.16",
  name: "XKiss Player Runtime Integration Core",
  version: "1.0.0",
  status: "connected",
  failClosed: true
};

export const XKISS_APPROVED_QUALITIES = ["340p", "460p", "720p", "1080p"];

export function getXKissPlayerRuntimeIntegrationStatus() {
  return {
    ok: true,
    stage: "15.16",
    service: XKISS_PLAYER_RUNTIME_INTEGRATION_CORE.name,
    status: XKISS_PLAYER_RUNTIME_INTEGRATION_CORE.status,
    approvedQualities: [...XKISS_APPROVED_QUALITIES]
  };
}

export function evaluateXKissPlayerRuntimeIntegration(request = {}) {
  const validation = validateXKissPlayerRuntimeIntegrationRequest(request);
  return { allowed: validation.allowed === true, gates: validation.gates };
}
