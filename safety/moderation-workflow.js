import { SAFETY_RULES } from "./safety-rules.js";

export const MODERATION_WORKFLOW = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  states: [
    "queued",
    "under_review",
    "approved",
    "restricted",
    "removed",
    "restored",
    "escalated"
  ],

  actions: SAFETY_RULES.moderationActions,

  requiredReviewReasons: [
    "new_upload",
    "user_report",
    "policy_signal",
    "manual_review",
    "verification_issue"
  ],

  automatedDecisionIsNotFinal: true,
  humanReviewAvailable: true,
  auditTrailRequired: true,
  creatorCannotBypassModeration: true,
  irreversibleActionsRequireReview: true,

  moderationProvider: null,
  moderationQueue: null,
  auditStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getModerationWorkflowStatus() {
  return {
    ok: true,
    status: MODERATION_WORKFLOW.status,
    enabled: MODERATION_WORKFLOW.enabled,
    providerConnected: Boolean(MODERATION_WORKFLOW.moderationProvider),
    queueConnected: Boolean(MODERATION_WORKFLOW.moderationQueue),
    auditStorageConnected: Boolean(MODERATION_WORKFLOW.auditStorage),
    reason: "Moderation workflow is prepared but no real moderation backend is connected."
  };
}

export function createModerationCase(input = {}) {
  const contentId = clean(input.contentId);
  const reason = clean(input.reason);

  if (!contentId || !reason) {
    return {
      ok: false,
      status: "invalid",
      reason: "contentId and review reason are required."
    };
  }

  if (!MODERATION_WORKFLOW.requiredReviewReasons.includes(reason)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported moderation review reason."
    };
  }

  return {
    ok: true,
    status: "prepared",
    moderationState: "queued",
    contentId,
    reason,
    recorded: false,
    reasonText: MODERATION_WORKFLOW.enabled
      ? "Moderation case is queued for review."
      : "Moderation case is prepared but the workflow is not active yet."
  };
}

export function evaluateModerationAction(input = {}) {
  const state = clean(input.state);
  const action = clean(input.action);

  if (!MODERATION_WORKFLOW.states.includes(state)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported moderation workflow state."
    };
  }

  if (action && !MODERATION_WORKFLOW.actions.includes(action)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported moderation action."
    };
  }

  if (!MODERATION_WORKFLOW.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      state,
      action: action || null,
      recorded: false,
      reason: "Moderation workflow is not active yet."
    };
  }

  return {
    ok: true,
    status: "evaluated",
    state,
    action: action || "review",
    recorded: false,
    reason: "Moderation action is ready for the configured review and audit layer."
  };
}
