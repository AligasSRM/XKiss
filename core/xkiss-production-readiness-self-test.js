import { getXKissProductionReadiness, validateXKissProductionReadiness } from "./xkiss-production-readiness-core.js";

export function runXKissProductionReadinessSelfTest() {
  const status = getXKissProductionReadiness();
  const validation = validateXKissProductionReadiness();

  return {
    ok:
      status.ok === true &&
      status.status === "BLOCKED" &&
      status.productionActivationAllowed === false &&
      status.blockerCount >= 1 &&
      validation.ok === true &&
      validation.activationAllowed === false
  };
}
