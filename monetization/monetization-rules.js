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