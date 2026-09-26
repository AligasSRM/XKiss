import { getXKissReleaseLockStatus } from "./xkiss-release-lock.js";

export function runXKissReleaseLockSelfTest() {
  const status = getXKissReleaseLockStatus();
  return {
    ok:
      status.locked === true &&
      status.sourceCode === "LOCKED" &&
      status.productionActivation === "BLOCKED_UNTIL_EXTERNAL_VERIFICATION" &&
      status.failClosed === true &&
      status.lockBypass === false
  };
}
