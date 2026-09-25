import { WALLET_RULES } from "./wallet-rules.js";

export const PAYOUT_ELIGIBILITY_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,
  minimumPayoutAmount: null,
  currency: WALLET_RULES.currency,
  requiredChecks: [
    "payout_enabled",
    "creator_verified",
    "payout_profile_ready",
    "available_balance",
    "minimum_payout_amount_configured"
  ]
};

export function evaluatePayoutEligibility(input = {}) {
  if (!WALLET_RULES.payoutEnabled || !PAYOUT_ELIGIBILITY_RULES.enabled) {
    return {
      ok: true,
      eligible: false,
      status: "not_enabled",
      reason: "Payout eligibility is prepared but payouts are not enabled yet."
    };
  }

  if (!input.creatorVerified) {
    return {
      ok: true,
      eligible: false,
      status: "pending_verification",
      reason: "Creator verification is required."
    };
  }

  if (!input.payoutProfileReady) {
    return {
      ok: true,
      eligible: false,
      status: "pending_profile",
      reason: "Payout profile is not ready."
    };
  }

  const availableBalance = Number(input.availableBalance);

  if (!Number.isFinite(availableBalance) || availableBalance <= 0) {
    return {
      ok: true,
      eligible: false,
      status: "no_available_balance",
      reason: "No available balance is ready for payout."
    };
  }

  const minimum = Number(PAYOUT_ELIGIBILITY_RULES.minimumPayoutAmount);

  if (!Number.isFinite(minimum) || minimum <= 0) {
    return {
      ok: true,
      eligible: false,
      status: "minimum_not_configured",
      reason: "The minimum payout amount has not been configured yet."
    };
  }

  if (availableBalance < minimum) {
    return {
      ok: true,
      eligible: false,
      status: "below_minimum",
      availableBalance,
      minimumPayoutAmount: minimum,
      reason: "Available balance is below the configured minimum payout amount."
    };
  }

  return {
    ok: true,
    eligible: true,
    status: "eligible",
    availableBalance,
    minimumPayoutAmount: minimum,
    currency: PAYOUT_ELIGIBILITY_RULES.currency,
    reason: "Creator meets the current payout eligibility checks."
  };
}
