import {
  evaluateWorkerEnvironment,
  validateWorkerEnvironmentContract
} from "./xkiss-worker-environment-contract.js";

export function runXKissWorkerEnvironmentContractSelfTest() {
  const empty = evaluateWorkerEnvironment({});
  const complete = evaluateWorkerEnvironment({
    XKISS_VIDEOS: {},
    XKISS_VIEW_EVENTS: {},
    XKISS_WALLET_LEDGER: {}
  });

  return {
    ok:
      empty.status === "BLOCKED" &&
      empty.activationAllowed === false &&
      empty.missingBindings.length === 3 &&
      complete.status === "READY_FOR_PROVIDER_VERIFICATION" &&
      complete.missingBindings.length === 0 &&
      complete.activationAllowed === false &&
      validateWorkerEnvironmentContract({}).ok === true &&
      validateWorkerEnvironmentContract({
        XKISS_VIDEOS: {},
        XKISS_VIEW_EVENTS: {},
        XKISS_WALLET_LEDGER: {}
      }).ok === true
  };
}
