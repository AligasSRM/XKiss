export const WALLET_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,
  currency: "USD",
  walletModel: "ledger_based",
  balances: {
    available: "settled_creator_earnings_ready_for_payout",
    pending: "earnings_not_yet_settled"
  },
  payoutEnabled: false,
  payoutProvider: null,
  negativeBalanceAllowed: false,
  refundsAndChargebacks: "reverse_related_ledger_entries",
  auditTrailRequired: true
};

export const WALLET_ENTRY_TYPES = [
  "earning",
  "refund",
  "chargeback",
  "payout",
  "payout_reversal",
  "adjustment"
];

function clean(value) {
  return String(value || "").trim();
}

function validAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0;
}

export function createWalletEntry(input = {}) {
  const amount = Number(input.amount);

  if (!input.creatorId) {
    return {
      ok: false,
      status: "invalid",
      reason: "creatorId is required."
    };
  }

  if (!WALLET_ENTRY_TYPES.includes(clean(input.type))) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported wallet entry type."
    };
  }

  if (!validAmount(amount) || amount <= 0) {
    return {
      ok: false,
      status: "invalid",
      reason: "Wallet entry amount must be greater than zero."
    };
  }

  return {
    ok: true,
    status: "prepared",
    recorded: false,
    creatorId: clean(input.creatorId),
    type: clean(input.type),
    amount,
    currency: WALLET_RULES.currency,
    referenceId: clean(input.referenceId),
    occurredAt: input.occurredAt || null,
    reason: "Wallet entry is structurally valid but is not recorded until the wallet ledger is connected."
  };
}

export function calculateWalletBalances(entries = []) {
  let available = 0;
  let pending = 0;

  if (!Array.isArray(entries)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Wallet entries must be an array."
    };
  }

  for (const entry of entries) {
    const amount = Number(entry.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      continue;
    }

    const balanceType = clean(entry.balanceType);

    if (balanceType === "available") {
      available += amount;
    }

    if (balanceType === "pending") {
      pending += amount;
    }
  }

  return {
    ok: true,
    status: "calculated",
    available,
    pending,
    currency: WALLET_RULES.currency
  };
}

export function evaluatePayoutEligibility(input = {}) {
  if (!WALLET_RULES.payoutEnabled) {
    return {
      eligible: false,
      status: "not_enabled",
      reason: "Payouts are not enabled yet."
    };
  }

  if (!input.creatorVerified) {
    return {
      eligible: false,
      status: "pending_verification",
      reason: "Creator verification is required."
    };
  }

  if (!input.payoutProfileReady) {
    return {
      eligible: false,
      status: "pending_profile",
      reason: "Payout profile is not ready."
    };
  }

  const availableBalance = Number(input.availableBalance);

  if (!Number.isFinite(availableBalance) || availableBalance <= 0) {
    return {
      eligible: false,
      status: "no_available_balance",
      reason: "No available balance is ready for payout."
    };
  }

  return {
    eligible: true,
    status: "eligible",
    reason: "Creator meets the current payout eligibility checks."
  };
}
