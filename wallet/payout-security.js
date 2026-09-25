export const PAYOUT_SECURITY_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,
  requiredChecks: [
    "authenticated_creator",
    "creator_owns_payout_request",
    "verified_creator",
    "payout_profile_ready",
    "reauthentication_for_sensitive_action",
    "server_side_authorization",
    "audit_event_required"
  ],
  clientCannotAuthorize: true,
  secretsServerSideOnly: true
};

function clean(value) {
  return String(value || "").trim();
}

export function evaluatePayoutAuthorization(input = {}) {
  if (!input.authenticated) {
    return {
      ok: true,
      authorized: false,
      status: "authentication_required",
      reason: "Authenticated creator access is required."
    };
  }

  if (!input.creatorId || !input.requestCreatorId) {
    return {
      ok: true,
      authorized: false,
      status: "missing_identity",
      reason: "Creator identity is required."
    };
  }

  if (clean(input.creatorId) !== clean(input.requestCreatorId)) {
    return {
      ok: true,
      authorized: false,
      status: "ownership_denied",
      reason: "The creator does not own this payout request."
    };
  }

  if (!input.creatorVerified) {
    return {
      ok: true,
      authorized: false,
      status: "verification_required",
      reason: "Creator verification is required."
    };
  }

  if (!input.payoutProfileReady) {
    return {
      ok: true,
      authorized: false,
      status: "payout_profile_required",
      reason: "Payout profile must be ready."
    };
  }

  if (input.sensitiveAction && !input.reauthenticated) {
    return {
      ok: true,
      authorized: false,
      status: "reauthentication_required",
      reason: "Re-authentication is required for this sensitive payout action."
    };
  }

  if (!PAYOUT_SECURITY_RULES.enabled) {
    return {
      ok: true,
      authorized: false,
      status: "security_not_enabled",
      reason: "Payout security rules are prepared but not enabled yet."
    };
  }

  return {
    ok: true,
    authorized: true,
    status: "authorized",
    reason: "Payout authorization checks passed."
  };
}
