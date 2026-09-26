export const XKISS_PRODUCTION_POLICY_CONTRACT = {
  stage: "AUDIT-06",
  name: "XKiss Production Policy Contract",
  version: "1.0.0",
  failClosed: true,
  monetization: {
    required: ["creatorSharePercent","platformSharePercent","providerFeePolicy"],
    rule: "shares must be explicitly configured and total 100"
  },
  viewsRevenue: {
    required: ["minimumWatchSeconds","minimumWatchPercent"],
    rule: "qualified-view thresholds must be explicitly configured"
  },
  walletPayout: {
    required: ["minimumPayoutAmount","payoutProvider"],
    rule: "payout policy and provider must be explicitly configured"
  }
};

function finitePercent(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100;
}

export function evaluateProductionPolicyConfiguration(config = {}) {
  const monetization = config.monetization || {};
  const viewsRevenue = config.viewsRevenue || {};
  const walletPayout = config.walletPayout || {};

  const monetizationReady =
    finitePercent(monetization.creatorSharePercent) &&
    finitePercent(monetization.platformSharePercent) &&
    Number(monetization.creatorSharePercent) + Number(monetization.platformSharePercent) === 100 &&
    String(monetization.providerFeePolicy || "").trim().length > 0;

  const viewsReady =
    Number.isFinite(Number(viewsRevenue.minimumWatchSeconds)) &&
    Number(viewsRevenue.minimumWatchSeconds) >= 0 &&
    Number.isFinite(Number(viewsRevenue.minimumWatchPercent)) &&
    Number(viewsRevenue.minimumWatchPercent) >= 0 &&
    Number(viewsRevenue.minimumWatchPercent) <= 100;

  const walletReady =
    Number.isFinite(Number(walletPayout.minimumPayoutAmount)) &&
    Number(walletPayout.minimumPayoutAmount) > 0 &&
    String(walletPayout.payoutProvider || "").trim().length > 0;

  const checks = { monetization: monetizationReady, viewsRevenue: viewsReady, walletPayout: walletReady };
  const missing = Object.keys(checks).filter((key) => !checks[key]);

  return {
    ok: true,
    stage: XKISS_PRODUCTION_POLICY_CONTRACT.stage,
    status: missing.length === 0 ? "READY_FOR_POLICY_INTEGRATION" : "BLOCKED",
    activationAllowed: false,
    failClosed: true,
    checks,
    missingPolicies: missing
  };
}
