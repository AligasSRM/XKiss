import { evaluateProductionPolicyConfiguration } from "./xkiss-production-policy-contract.js";

export function runXKissProductionPolicyContractSelfTest() {
  const blocked = evaluateProductionPolicyConfiguration({});
  const ready = evaluateProductionPolicyConfiguration({
    monetization: { creatorSharePercent: 80, platformSharePercent: 20, providerFeePolicy: "deduct_before_share" },
    viewsRevenue: { minimumWatchSeconds: 30, minimumWatchPercent: 20 },
    walletPayout: { minimumPayoutAmount: 50, payoutProvider: "provider-configured" }
  });

  return {
    ok:
      blocked.status === "BLOCKED" &&
      blocked.activationAllowed === false &&
      blocked.missingPolicies.length === 3 &&
      ready.status === "READY_FOR_POLICY_INTEGRATION" &&
      ready.missingPolicies.length === 0 &&
      ready.activationAllowed === false
  };
}
