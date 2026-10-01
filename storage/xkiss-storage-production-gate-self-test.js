import {
  evaluateStorageProductionGate,
  validateStorageProductionGate
} from "./xkiss-storage-production-gate.js";

const complete = {
  XKISS_B2_ENDPOINT: "https://s3.eu-central-003.backblazeb2.com",
  XKISS_B2_BUCKET: "xkiss-videos",
  XKISS_B2_REGION: "eu-central-003",
  XKISS_B2_ACCESS_KEY: "test-access-key",
  XKISS_B2_SECRET_KEY: "test-secret-key"
};

export function runXKissStorageProductionGateSelfTest() {
  const missing = evaluateStorageProductionGate({});
  const partial = evaluateStorageProductionGate({
    XKISS_B2_ENDPOINT: complete.XKISS_B2_ENDPOINT
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
      present.activationAllowed === false &&
      present.missingConfiguration.length === 0 &&
      validateStorageProductionGate({}).ok === true &&
      validateStorageProductionGate(complete).ok === true
  };
}
