import { SAFETY_RULES } from "./safety-rules.js";

export const ACCOUNT_SAFETY_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  accountStates: [
    "active",
    "pending_verification",
    "restricted",
    "suspended",
    "restored",
    "closed"
  ],

  suspensionReasons: [
    "policy_violation",
    "safety_risk",
    "verification_issue",
    "fraud_signal",
    "repeated_reports",
    "moderation_decision",
    "security_event"
  ],

  requiredControls: [
    "verification_status",
    "policy_compliance",
    "report_history",
    "moderation_history",
    "security_signals",
    "audit_trail"
  ],

  temporaryRestrictionSupported: true,
  permanentClosureRequiresReview: true,
  automatedSuspensionIsNotFinal: true,
  humanReviewAvailable: true,
  restorationRequiresReview: true,
  auditTrailRequired: true,

  accountSafetyProvider: null,
  accountStateStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getAccountSafetyStatus() {
  return {
    ok: true,
    status: ACCOUNT_SAFETY_RULES.status,
    enabled: ACCOUNT_SAFETY_RULES.enabled,
    providerConnected: Boolean(ACCOUNT_SAFETY_RULES.accountSafetyProvider),
    storageConnected: Boolean(ACCOUNT_SAFETY_RULES.accountStateStorage),
    reason: "Account safety controls are prepared but real backend enforcement is not connected."
  };
}

export function evaluateAccountSafety(input = {}) {
  const accountState = clean(input.accountState);

  if (!ACCOUNT_SAFETY_RULES.accountStates.includes(accountState)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported account state."
    };
  }

  if (accountState === "suspended" || accountState === "restricted") {
    return {
      ok: true,
      status: accountState,
      allowed: false,
      reason: "Account access is restricted by the configured safety workflow."
    };
  }

  return {
    ok: true,
    status: accountState,
    allowed: accountState === "active",
    reason: accountState === "active"
      ? "Account is active under the safety workflow."
      : "Account requires the appropriate safety or verification workflow."
  };
}

export function createAccountSafetyCase(input = {}) {
  const accountId = clean(input.accountId);
  const reason = clean(input.reason);

  if (!accountId || !reason) {
    return {
      ok: false,
      status: "invalid",
      reason: "accountId and suspension reason are required."
    };
  }

  if (!ACCOUNT_SAFETY_RULES.suspensionReasons.includes(reason)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported account safety reason."
    };
  }

  return {
    ok: true,
    status: "prepared",
    accountId,
    reason,
    recommendedState: "restricted",
    recorded: false,
    reasonText: ACCOUNT_SAFETY_RULES.enabled
      ? "Account safety case is ready for backend review and enforcement."
      : "Account safety case is prepared but enforcement is not active yet."
  };
}

export function evaluateRestoration(input = {}) {
  const accountId = clean(input.accountId);
  const reviewApproved = input.reviewApproved === true;

  if (!accountId) {
    return {
      ok: false,
      status: "invalid",
      reason: "accountId is required."
    };
  }

  if (!reviewApproved) {
    return {
      ok: true,
      status: "review_required",
      restored: false,
      accountId,
      reason: "Account restoration requires an approved review."
    };
  }

  return {
    ok: true,
    status: "restoration_ready",
    restored: false,
    accountId,
    targetState: "restored",
    reason: "Restoration is approved structurally and must be recorded by the backend."
  };
}
