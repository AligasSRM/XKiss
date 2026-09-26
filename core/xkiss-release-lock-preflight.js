export const XKISS_RELEASE_LOCK_PREFLIGHT = {
  stage: "RELEASE-LOCK",
  name: "XKiss Release Lock Preflight",
  version: "1.0.0",
  failClosed: true,
  requiredGates: [
    "player_regression_15_23_15_31",
    "production_readiness_audit",
    "storage_production_gate",
    "worker_environment_contract",
    "backend_provider_contract",
    "production_policy_contract"
  ],
  externalActivationRequired: true
};

export function evaluateReleaseLockPreflight(gates = {}) {
  const required = XKISS_RELEASE_LOCK_PREFLIGHT.requiredGates;
  const checks = Object.fromEntries(required.map((name) => [name, gates[name] === "GREEN"]));
  const missing = required.filter((name) => !checks[name]);

  return {
    ok: missing.length === 0,
    stage: XKISS_RELEASE_LOCK_PREFLIGHT.stage,
    status: missing.length === 0 ? "READY_FOR_CODE_LOCK" : "BLOCKED",
    codeLockAllowed: missing.length === 0,
    productionActivationAllowed: false,
    externalActivationRequired: true,
    failClosed: true,
    checks,
    missingGates: missing,
    reason: missing.length === 0
      ? "All defined code and regression gates are GREEN. Production activation remains fail-closed until real backend providers, environment bindings and policy configuration are verified."
      : "One or more required release gates are not GREEN."
  };
}
