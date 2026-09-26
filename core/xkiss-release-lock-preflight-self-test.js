import { evaluateReleaseLockPreflight } from "./xkiss-release-lock-preflight.js";

export function runXKissReleaseLockPreflightSelfTest() {
  const required = {
    player_regression_15_23_15_31: "GREEN",
    production_readiness_audit: "GREEN",
    storage_production_gate: "GREEN",
    worker_environment_contract: "GREEN",
    backend_provider_contract: "GREEN",
    production_policy_contract: "GREEN"
  };
  const result = evaluateReleaseLockPreflight(required);

  return {
    ok:
      result.status === "READY_FOR_CODE_LOCK" &&
      result.codeLockAllowed === true &&
      result.productionActivationAllowed === false &&
      result.missingGates.length === 0
  };
}
