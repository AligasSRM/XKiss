export const XKISS_PLAYER_RUNTIME_STATE_RULES = {
  section: "15.17",
  name: "XKiss Player Runtime State Rules",
  version: "1.0.0",
  status: "prepared",
  operations: ["read_state","validate_state"]
};

export function validateXKissPlayerRuntimeStateRequest(request = {}) {
  const operation = XKISS_PLAYER_RUNTIME_STATE_RULES.operations.includes(request.operation);
  const playerCore = request.playerCoreConnected === true;
  const videoElement = request.videoElementReady === true;
  const stateReadable = request.stateReadable === true;
  return {
    allowed: operation && playerCore && videoElement && stateReadable,
    gates: { operation, playerCoreConnected: playerCore, videoElementReady: videoElement, stateReadable }
  };
}
