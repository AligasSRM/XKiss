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
  version: "1.1",
  status: "configured",
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
    reason: "Safety and verification rules are fully configured and coordinated. Production enforcement remains blocked until the required backend providers are connected."
  };
}

export function runSafetySelfTest() {
  const checks = [];

  const overview = getSafetyVerificationOverview();
  checks.push({
    name: "overview",
    ok: overview.ok === true && overview.modules && Object.keys(overview.modules).length === 9
  });

  checks.push({
    name: "age_requirement",
    ok: Number(overview.platformAgeRequirement) >= 18
  });

  const blocked = evaluateSafetyAccess({
    ageVerified: false,
    creatorVerified: false,
    accountState: "active"
  });
  checks.push({
    name: "unverified_access_blocked",
    ok: blocked.allowed === false && blocked.status === "age_verification_required"
  });

  const restricted = evaluateSafetyAccess({
    ageVerified: true,
    creatorVerified: false,
    accountState: "suspended"
  });
  checks.push({
    name: "restricted_account_blocked",
    ok: restricted.allowed === false && restricted.status === "account_restricted"
  });

  const verified = evaluateSafetyAccess({
    ageVerified: true,
    creatorVerified: true,
    accountState: "active"
  });
  checks.push({
    name: "verified_access_allowed",
    ok: verified.allowed === true && verified.status === "creator_verified"
  });

  return {
    ok: checks.every(check => check.ok),
    service: "XKiss Safety & Verification",
    version: "1.0",
    status: "tested",
    enforcementEnabled: SAFETY_INTEGRATION.enabled,
    checks
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
