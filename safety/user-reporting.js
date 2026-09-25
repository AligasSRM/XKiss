import { SAFETY_RULES } from "./safety-rules.js";

export const REPORTING_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  reportStates: SAFETY_RULES.reportStates,

  allowedTargets: [
    "video",
    "creator",
    "comment",
    "live_room",
    "user"
  ],

  reasons: [
    "illegal_content",
    "underage_content",
    "non_consensual_content",
    "harassment",
    "spam",
    "fraud",
    "copyright",
    "other"
  ],

  reporterIdentityProtected: true,
  anonymousReportsSupported: false,
  duplicateReportsHandled: true,
  reporterCannotDirectlyModerate: true,

  reportStorage: null,
  moderationQueue: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getReportingStatus() {
  return {
    ok: true,
    status: REPORTING_RULES.status,
    enabled: REPORTING_RULES.enabled,
    storageConnected: Boolean(REPORTING_RULES.reportStorage),
    moderationQueueConnected: Boolean(REPORTING_RULES.moderationQueue),
    reason: "User reporting is prepared but the real reporting and moderation backend is not connected."
  };
}

export function createReport(input = {}) {
  const reporterId = clean(input.reporterId);
  const targetId = clean(input.targetId);
  const targetType = clean(input.targetType);
  const reason = clean(input.reason);

  if (!targetId || !targetType || !reason) {
    return {
      ok: false,
      status: "invalid",
      reason: "targetId, targetType and reason are required."
    };
  }

  if (!REPORTING_RULES.allowedTargets.includes(targetType)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported report target."
    };
  }

  if (!REPORTING_RULES.reasons.includes(reason)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported report reason."
    };
  }

  if (!REPORTING_RULES.enabled) {
    return {
      ok: true,
      status: "prepared",
      reportState: "submitted",
      recorded: false,
      reporterId: reporterId || null,
      targetId,
      targetType,
      reason,
      reasonText: "Reporting is prepared but not active until the backend reporting system is connected."
    };
  }

  return {
    ok: true,
    status: "submitted",
    reportState: "submitted",
    recorded: false,
    reporterId: reporterId || null,
    targetId,
    targetType,
    reason,
    reasonText: "Report is ready for the moderation queue."
  };
}

export function updateReportState(input = {}) {
  const reportState = clean(input.reportState);

  if (!REPORTING_RULES.reportStates.includes(reportState)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported report state."
    };
  }

  return {
    ok: true,
    status: reportState,
    reportState,
    recorded: false,
    reason: REPORTING_RULES.enabled
      ? "Report state is valid for the moderation workflow."
      : "Report workflow is prepared but not active."
  };
}
