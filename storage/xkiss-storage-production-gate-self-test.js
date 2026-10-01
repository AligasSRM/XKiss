import {
  evaluateStorageProductionGate,
  validateStorageProductionGate
} from "./xkiss-storage-production-gate.js";

const complete = {
  XKISS_IDRIVE_ENDPOINT: "https://s3.eu-west-1.idrivee2.com",
  XKISS_IDRIVE_BUCKET: "xkissvideos",
  XKISS_IDRIVE_REGION: "eu-west-1",
  XKISS_IDRIVE_ACCESS_KEY: "test-access-key",
  XKISS_IDRIVE_SECRET_KEY: "test-secret-key"
};

export function runXKissStorageProductionGateSelfTest() {
  const missing = evaluateStorageProductionGate({});
  const partial = evaluateStorageProductionGate({
    XKISS_IDRIVE_ENDPOINT: complete.XKISS_IDRIVE_ENDPOINT
  });
  const present = evaluateStorageProductionGate(complete);

  return {
    ok:
      missing.status === "BLOCKED" &&
      missing.activationAllowed === false &&
      missing.missingConfiguration.length === 5 &&
      partial.status === "BLOCKED" &&
      partial.activationAllowed === false &&
      partial.missingConfiguration.length === 4 &&
      present.status === "READY_FOR_STORAGE_TEST" &&
      present.activationAllowed === true &&
      present.missingConfiguration.length === 0 &&
      validateStorageProductionGate({}).ok === true &&
      validateStorageProductionGate(complete).ok === true
  };
}
