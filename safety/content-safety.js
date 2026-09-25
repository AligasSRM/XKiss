import { SAFETY_RULES } from "./safety-rules.js";

export const CONTENT_SAFETY_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  reviewRequiredBeforePublication: true,

  contentStates: SAFETY_RULES.contentStates,

  moderationActions: SAFETY_RULES.moderationActions,

  reviewReasons: [
    "new_upload",
    "user_report",
    "policy_signal",
    "manual_review",
    "verification_issue"
  ],

  automatedDecisionIsNotFinal: true,
  humanReviewAvailable: true,
  creatorCannotBypassModeration: true,

  moderationProvider: null,
  contentReviewStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getContentSafetyStatus() {
  return {
    ok: true,
    status: CONTENT_SAFETY_RULES.status,
    enabled: CONTENT_SAFETY_RULES.enabled,
    reviewRequiredBeforePublication:
      CONTENT_SAFETY_RULES.reviewRequiredBeforePublication,
    moderationProviderConnected:
      Boolean(CONTENT_SAFETY_RULES.moderationProvider),
    reason:
      "Content safety and moderation are prepared but no real moderation service is connected."
  };
}

export function createContentReviewRequest(input = {}) {
  const contentId = clean(input.contentId);
  const creatorId = clean(input.creatorId);

  if (!contentId || !creatorId) {
    return {
      ok: false,
      status: "invalid",
      reason: "contentId and creatorId are required."
    };
  }

  return {
    ok: true,
    status: "prepared",
    contentId,
    creatorId,
    contentState: "pending_review",
    published: false,
    recorded: false,
    reason: CONTENT_SAFETY_RULES.enabled
      ? "Content is awaiting moderation review."
      : "Content review is prepared but moderation is not active yet."
  };
}

export function evaluateContentModeration(input = {}) {
  const contentState = clean(input.contentState);
  const action = clean(input.action);

  if (!CONTENT_SAFETY_RULES.contentStates.includes(contentState)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported content state."
    };
  }

  if (action && !CONTENT_SAFETY_RULES.moderationActions.includes(action)) {
    return {
      ok: false,
      status: "invalid",
      reason: "Unsupported moderation action."
    };
  }

  if (!CONTENT_SAFETY_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      contentState,
      action: action || null,
      published: false,
      reason: "Content moderation is not active yet."
    };
  }

  return {
    ok: true,
    status: "review_required",
    contentState,
    action: action || "review",
    published: contentState === "published",
    reason: "Content must pass the configured moderation workflow before publication."
  };
}
