import { SAFETY_RULES } from "./safety-rules.js";

export const CREATOR_VERIFICATION_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  requiredChecks: [
    "account_identity",
    "minimum_age_18",
    "creator_identity_verification",
    "policy_acceptance",
    "verification_status"
  ],

  acceptedStates: SAFETY_RULES.verificationStates,

  identityDocumentsStoredInFrontend: false,
  identityDocumentsStoredInBrowserStorage: false,
  verificationProvider: null,
  identityStorage: null,
  manualReviewAvailable: true,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getCreatorVerificationStatus() {
  return {
    ok: true,
    status: CREATOR_VERIFICATION_RULES.status,
    enabled: CREATOR_VERIFICATION_RULES.enabled,
    verified: false,
    providerConnected: Boolean(CREATOR_VERIFICATION_RULES.verificationProvider),
    reason: "Creator verification is prepared but no real verification provider is connected."
  };
}

export function createCreatorVerificationRequest(input = {}) {
  const creatorId = clean(input.creatorId);

  if (!creatorId) {
    return {
      ok: false,
      status: "invalid",
      reason: "creatorId is required."
    };
  }

  if (!CREATOR_VERIFICATION_RULES.enabled) {
    return {
      ok: true,
      status: "prepared",
      verificationState: "not_started",
      verified: false,
      recorded: false,
      creatorId,
      reason: "Creator verification is not active until the backend verification layer is connected."
    };
  }

  return {
    ok: true,
    status: "pending",
    verificationState: "pending",
    verified: false,
    recorded: false,
    creatorId,
    reason: "Creator verification must be completed by the configured verification layer."
  };
}

export function evaluateCreatorVerification(input = {}) {
  const state = clean(input.verificationState);

  if (!CREATOR_VERIFICATION_RULES.acceptedStates.includes(state)) {
    return {
      ok: false,
      status: "invalid",
      verified: false,
      reason: "Unsupported creator verification state."
    };
  }

  if (state !== "verified") {
    return {
      ok: true,
      status: state,
      verified: false,
      creatorId: clean(input.creatorId),
      reason: "Creator verification is not confirmed."
    };
  }

  return {
    ok: true,
    status: "verified",
    verified: true,
    creatorId: clean(input.creatorId),
    reason: "Creator verification is marked verified by the trusted verification layer."
  };
}
