import {
  evaluateStorageProductionGate,
  validateStorageProductionGate
} from "./xkiss-storage-production-gate.js";

export function runXKissStorageProductionGateSelfTest() {
  const missing = evaluateStorageProductionGate({});
  const present = evaluateStorageProductionGate({ XKISS_VIDEOS: {} });

  return {
    ok:
      missing.status === "BLOCKED" &&
      missing.activationAllowed === false &&
      present.status === "READY_FOR_STORAGE_TEST" &&
      present.activationAllowed === true &&
      validateStorageProductionGate({}).ok === true &&
      validateStorageProductionGate({ XKISS_VIDEOS: {} }).ok === true
  };
}
