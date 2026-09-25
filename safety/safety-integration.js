import { SAFETY_RULES, getSafetyStatus } from "./safety-rules.js";
import { getAgeVerificationStatus } from "./age-verification.js";
import { getCreatorVerificationStatus } from "./creator-verification.js";
import { getContentSafetyStatus } from "./content-safety.js";
import { getReportingStatus } from "./user-reporting.js";
import { getModerationWorkflowStatus } from "./moderation-workflow.js";
import { getSafetyAuditStatus } from "./safety-audit.js";
import { getPrivacyDataStatus } from "./privacy-data.js";
import { getAccountSafetyStatus } from "./account-safety.js";

export const SAFETY_INTEGRATION = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,
  activationRequiresBackend: true
};

export function getSafetyVerificationOverview() {
  return {
    ok: true,
    status: SAFETY_INTEGRATION.status,
    enabled: SAFETY_INTEGRATION.enabled,
    platformAgeRequirement: SAFETY_RULES.platformAgeRequirement,
    modules: {
      foundation: getSafetyStatus(),
      ageVerification: getAgeVerificationStatus(),
      creatorVerification: getCreatorVerificationStatus(),
      contentSafety: getContentSafetyStatus(),
      reporting: getReportingStatus(),
      moderation: getModerationWorkflowStatus(),
      audit: getSafetyAuditStatus(),
      privacy: getPrivacyDataStatus(),
      accountSafety: getAccountSafetyStatus()
    },
    reason: "Safety and verification modules are prepared and coordinated, but real backend enforcement is not connected."
  };
}

export function evaluateSafetyAccess(input = {}) {
  const ageVerified = input.ageVerified === true;
  const creatorVerified = input.creatorVerified === true;
  const accountState = String(input.accountState || "").trim();

  if (!SAFETY_INTEGRATION.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      allowed: false,
      ageVerified,
      creatorVerified,
      accountState,
      reason: "Safety access enforcement is not active until the backend integration is connected."
    };
  }

  if (!ageVerified) {
    return {
      ok: true,
      status: "age_verification_required",
      allowed: false,
      reason: "Age verification is required."
    };
  }

  if (accountState === "suspended" || accountState === "restricted") {
    return {
      ok: true,
      status: "account_restricted",
      allowed: false,
      reason: "Account access is restricted."
    };
  }

  return {
    ok: true,
    status: creatorVerified ? "creator_verified" : "user_verified",
    allowed: true,
    ageVerified,
    creatorVerified,
    accountState: accountState || "active",
    reason: "Safety access requirements are satisfied by the configured verification layer."
  };
}
