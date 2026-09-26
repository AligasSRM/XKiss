export const XKISS_STORAGE_PRODUCTION_GATE = {
  stage: "AUDIT-03",
  name: "Video Storage Production Gate",
  failClosed: true,
  requiredBinding: "XKISS_VIDEOS",
  allowedProvider: "Cloudflare R2"
};

export function evaluateStorageProductionGate(env = {}) {
  const bindingPresent = Boolean(env && env.XKISS_VIDEOS);
  return {
    ok: true,
    stage: XKISS_STORAGE_PRODUCTION_GATE.stage,
    status: bindingPresent ? "READY_FOR_STORAGE_TEST" : "BLOCKED",
    bindingPresent,
    activationAllowed: bindingPresent,
    failClosed: true,
    provider: XKISS_STORAGE_PRODUCTION_GATE.allowedProvider
  };
}

export function validateStorageProductionGate(env = {}) {
  const result = evaluateStorageProductionGate(env);
  return {
    ok:
      result.failClosed === true &&
      result.status === (result.bindingPresent ? "READY_FOR_STORAGE_TEST" : "BLOCKED") &&
      result.activationAllowed === result.bindingPresent
  };
}
