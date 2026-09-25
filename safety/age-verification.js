import { SAFETY_RULES } from "./safety-rules.js";

export const AGE_VERIFICATION_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,
  minimumAge: SAFETY_RULES.platformAgeRequirement,
  verificationMethod: "backend_verification_required",
  clientSelfDeclarationAcceptedAsFinalVerification: false,
  storeIdentityDocumentsInFrontend: false,
  storeIdentityDocumentsInBrowserStorage: false,
  provider: null
};

function clean(value) {
  return String(value || "").trim();
}

export function getAgeVerificationStatus() {
  return {
    ok: true,
    status: AGE_VERIFICATION_RULES.status,
    enabled: AGE_VERIFICATION_RULES.enabled,
    minimumAge: AGE_VERIFICATION_RULES.minimumAge,
    verified: false,
    method: AGE_VERIFICATION_RULES.verificationMethod,
    reason: "Age verification is prepared but no real verification provider is connected."
  };
}

export function createAgeVerificationRequest(input = {}) {
  const userId = clean(input.userId);

  if (!userId) {
    return {
      ok: false,
      status: "invalid",
      reason: "userId is required."
    };
  }

  if (!AGE_VERIFICATION_RULES.enabled) {
    return {
      ok: true,
      status: "prepared",
      verificationState: "not_started",
      verified: false,
      recorded: false,
      userId,
      reason: "Age verification is not active until a backend verification provider is connected."
    };
  }

  return {
    ok: true,
    status: "pending",
    verificationState: "pending",
    verified: false,
    recorded: false,
    userId,
    reason: "Verification request must be completed by the configured backend provider."
  };
}

export function evaluateAgeVerificationResult(input = {}) {
  const state = clean(input.verificationState);

  if (!SAFETY_RULES.verificationStates.includes(state)) {
    return {
      ok: false,
      status: "invalid",
      verified: false,
      reason: "Unsupported verification state."
    };
  }

  if (state === "verified") {
    return {
      ok: true,
      status: "verified",
      verified: true,
      reason: "Age verification is marked verified by the trusted verification layer."
    };
  }

  return {
    ok: true,
    status: state,
    verified: false,
    reason: "Age verification is not confirmed."
  };
}
