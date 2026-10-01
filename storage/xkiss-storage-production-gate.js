export const XKISS_STORAGE_PRODUCTION_GATE = {
  stage: "AUDIT-03",
  name: "Video Storage Production Gate",
  failClosed: true,
  provider: "Backblaze B2",
  requiredConfiguration: [
    "XKISS_B2_ENDPOINT",
    "XKISS_B2_BUCKET",
    "XKISS_B2_REGION",
    "XKISS_B2_ACCESS_KEY",
    "XKISS_B2_SECRET_KEY"
  ]
};

function storageConfigPresent(env = {}) {
  return XKISS_STORAGE_PRODUCTION_GATE.requiredConfiguration.every(
    (name) => Boolean(env && env[name])
  );
}

export function evaluateStorageProductionGate(env = {}) {
  const configurationPresent = storageConfigPresent(env);

  return {
    ok: true,
    stage: XKISS_STORAGE_PRODUCTION_GATE.stage,
    status: configurationPresent ? "READY_FOR_STORAGE_TEST" : "BLOCKED",
    configurationPresent,
    activationAllowed: false,
    failClosed: true,
    provider: XKISS_STORAGE_PRODUCTION_GATE.provider,
    missingConfiguration: XKISS_STORAGE_PRODUCTION_GATE.requiredConfiguration.filter(
      (name) => !Boolean(env && env[name])
    )
  };
}

export function validateStorageProductionGate(env = {}) {
  const result = evaluateStorageProductionGate(env);
  return {
    ok:
      result.failClosed === true &&
      result.status === (result.configurationPresent ? "READY_FOR_STORAGE_TEST" : "BLOCKED") &&
      result.activationAllowed === false &&
      Array.isArray(result.missingConfiguration)
  };
}
