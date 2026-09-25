export const MONETIZATION_RULES = {
  version: "1.1-draft",
  status: "draft",
  enabled: false,
  model: "revenue_share",
  currency: "USD",
  creatorSharePercent: null,
  platformSharePercent: null,
  providerFees: "deducted_before_final_creator_earnings",
  refunds: "reverse_related_earnings",
  chargebacks: "reverse_related_earnings",
  payoutSection: "wallet_and_payouts",
  revenueEventsSection: "views_and_revenue"
};

export const CREATOR_ELIGIBILITY_RULES = {
  version: "1.0-draft",
  monetizationEnabled: false,
  minimumAge: 18,
  accountRequired: true,
  creatorProfileRequired: true,
  verificationRequired: true,
  policyAcceptanceRequired: true,
  payoutProfileRequired: false,
  statusValues: [
    "not_eligible",
    "pending",
    "eligible",
    "suspended"
  ]
};

export function evaluateCreatorEligibility(input = {}) {
  if (!CREATOR_ELIGIBILITY_RULES.monetizationEnabled) {
    return {
      status: "not_eligible",
      eligible: false,
      reason: "Monetization is not active yet."
    };
  }

  if (!input.account) {
    return {
      status: "not_eligible",
      eligible: false,
      reason: "Creator account is required."
    };
  }

  if (Number(input.age) < CREATOR_ELIGIBILITY_RULES.minimumAge) {
    return {
      status: "not_eligible",
      eligible: false,
      reason: "Creator must meet the minimum age requirement."
    };
  }

  if (!input.creatorProfile) {
    return {
      status: "pending",
      eligible: false,
      reason: "Creator profile is required."
    };
  }

  if (!input.verified) {
    return {
      status: "pending",
      eligible: false,
      reason: "Creator verification is required."
    };
  }

  if (!input.policyAccepted) {
    return {
      status: "pending",
      eligible: false,
      reason: "Monetization policy acceptance is required."
    };
  }

  if (input.suspended) {
    return {
      status: "suspended",
      eligible: false,
      reason: "Creator monetization access is suspended."
    };
  }

  return {
    status: "eligible",
    eligible: true,
    reason: "Creator meets the current monetization eligibility rules."
  };
}

export function calculateRevenue(input = {}) {
  const grossAmount = Number(input.grossAmount);
  const providerFeeAmount = Number(input.providerFeeAmount || 0);

  if (!Number.isFinite(grossAmount) || grossAmount < 0) {
    return {
      ok: false,
      status: "invalid",
      reason: "Gross revenue must be a valid non-negative number."
    };
  }

  if (!Number.isFinite(providerFeeAmount) || providerFeeAmount < 0) {
    return {
      ok: false,
      status: "invalid",
      reason: "Provider fees must be a valid non-negative number."
    };
  }

  if (
    MONETIZATION_RULES.creatorSharePercent === null ||
    MONETIZATION_RULES.platformSharePercent === null
  ) {
    return {
      ok: false,
      status: "not_configured",
      reason: "Creator and platform share percentages are not configured yet."
    };
  }

  const totalShare =
    Number(MONETIZATION_RULES.creatorSharePercent) +
    Number(MONETIZATION_RULES.platformSharePercent);

  if (totalShare !== 100) {
    return {
      ok: false,
      status: "invalid_configuration",
      reason: "Creator and platform shares must total 100%."
    };
  }

  const eventType = String(input.eventType || "sale");
  const multiplier =
    eventType === "refund" || eventType === "chargeback" ? -1 : 1;

  const netRevenueBeforeShares =
    Math.max(0, grossAmount - providerFeeAmount);

  const creatorAmount =
    netRevenueBeforeShares *
    (Number(MONETIZATION_RULES.creatorSharePercent) / 100) *
    multiplier;

  const platformAmount =
    netRevenueBeforeShares *
    (Number(MONETIZATION_RULES.platformSharePercent) / 100) *
    multiplier;

  return {
    ok: true,
    status: "calculated",
    eventType,
    grossAmount: grossAmount * multiplier,
    providerFeeAmount: providerFeeAmount * multiplier,
    netRevenueBeforeShares: netRevenueBeforeShares * multiplier,
    creatorAmount,
    platformAmount,
    currency: MONETIZATION_RULES.currency
  };
}
