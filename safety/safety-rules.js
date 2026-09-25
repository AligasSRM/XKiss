export const SAFETY_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  platformAgeRequirement: 18,

  verificationStates: [
    "not_started",
    "pending",
    "verified",
    "rejected",
    "expired",
    "suspended"
  ],

  contentStates: [
    "draft",
    "pending_review",
    "published",
    "restricted",
    "removed"
  ],

  reportStates: [
    "submitted",
    "under_review",
    "resolved",
    "dismissed"
  ],

  moderationActions: [
    "review",
    "restrict",
    "remove",
    "restore",
    "suspend"
  ],

  protectedPrinciples: [
    "age_gate",
    "creator_verification",
    "content_review",
    "user_reporting",
    "moderation",
    "audit_trail",
    "privacy_first"
  ],

  realVerificationProvider: null,
  realIdentityStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getSafetyStatus() {
  return {
    ok: true,
    status: SAFETY_RULES.status,
    enabled: SAFETY_RULES.enabled,
    ageRequirement: SAFETY_RULES.platformAgeRequirement,
    verificationReady: false,
    contentModerationReady: false,
    reportingReady: false,
    reason: "Safety & Verification is prepared but real verification and moderation services are not connected."
  };
}

export function isValidVerificationState(value) {
  return SAFETY_RULES.verificationStates.includes(clean(value));
}

export function isValidContentState(value) {
  return SAFETY_RULES.contentStates.includes(clean(value));
}

export function isValidReportState(value) {
  return SAFETY_RULES.reportStates.includes(clean(value));
}

export function isValidModerationAction(value) {
  return SAFETY_RULES.moderationActions.includes(clean(value));
}

export function evaluateAgeGate(input = {}) {
  if (!SAFETY_RULES.enabled) {
    return {
      allowed: false,
      status: "not_enabled",
      reason: "Age verification is not active yet."
    };
  }

  const age = Number(input.age);

  if (!Number.isFinite(age)) {
    return {
      allowed: false,
      status: "invalid_age",
      reason: "A valid age is required."
    };
  }

  return {
    allowed: age >= SAFETY_RULES.platformAgeRequirement,
    status: age >= SAFETY_RULES.platformAgeRequirement ? "allowed" : "blocked",
    reason: age >= SAFETY_RULES.platformAgeRequirement
      ? "Minimum platform age requirement is met."
      : "Minimum platform age requirement is not met."
  };
}
