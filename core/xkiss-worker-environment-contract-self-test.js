import {
  evaluateWorkerEnvironment,
  validateWorkerEnvironmentContract
} from "./xkiss-worker-environment-contract.js";

export function runXKissWorkerEnvironmentContractSelfTest() {
  const empty = evaluateWorkerEnvironment({});
  const complete = evaluateWorkerEnvironment({
    ELASTICLAKE_ENDPOINT: "https://app.elasticlake.com",
    ELASTICLAKE_BUCKET: "xkiss-storage--xkiss-production--xkiss-midea",
    ELASTICLAKE_REGION: "auto",
    ELASTICLAKE_ACCESS_KEY_ID: "test-access-key",
    ELASTICLAKE_SECRET_ACCESS_KEY: "test-secret-key"
  });

  return {
    ok:
      empty.status === "BLOCKED" &&
      empty.activationAllowed === false &&
      empty.missingBindings.length === 5 &&
      complete.status === "READY_FOR_PROVIDER_VERIFICATION" &&
      complete.missingBindings.length === 0 &&
      complete.activationAllowed === false &&
      validateWorkerEnvironmentContract({}).ok === true &&
      validateWorkerEnvironmentContract({
        ELASTICLAKE_ENDPOINT: "https://app.elasticlake.com",
        ELASTICLAKE_BUCKET: "xkiss-storage--xkiss-production--xkiss-midea",
        ELASTICLAKE_REGION: "auto",
        ELASTICLAKE_ACCESS_KEY_ID: "test-access-key",
        ELASTICLAKE_SECRET_ACCESS_KEY: "test-secret-key"
      }).ok === true
  };
}
