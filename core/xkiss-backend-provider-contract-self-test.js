import { evaluateBackendProviderContract } from "./xkiss-backend-provider-contract.js";

const complete = Object.fromEntries(
  Object.entries({
    safety: ["identity","age_verification","creator_verification","moderation","reporting","audit","privacy"],
    admin: ["admin_auth","authorization","admin_audit","secure_data_access"],
    superAdmin: ["authentication","mfa","session","reauthentication","privileged_authorization","security_audit"],
    settings: ["settings_read","settings_write","authorization","audit"]
  }).map(([key, capabilities]) => [key, { connected: true, capabilities }])
);

export function runXKissBackendProviderContractSelfTest() {
  const blocked = evaluateBackendProviderContract({});
  const ready = evaluateBackendProviderContract(complete);

  return {
    ok:
      blocked.status === "BLOCKED" &&
      blocked.activationAllowed === false &&
      blocked.missingProviders.length === 4 &&
      ready.status === "READY_FOR_INTEGRATION_TEST" &&
      ready.missingProviders.length === 0 &&
      ready.activationAllowed === false
  };
}
