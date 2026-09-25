export const VIEWS_REVENUE_RULES = {
  version: "1.2-draft",
  status: "prepared",
  persistence: "not_connected",
  counting: "server_side",
  revenueEvents: "server_side",
  duplicateProtection: true,
  duplicateKey: "videoId + viewerSessionId + eventId",
  botReview: true,
  creatorAttributionRequired: true,
  videoAttributionRequired: true,
  realActivityRequired: true,
  minimumPlaybackSignal: "playing",
  qualifiedView: {
    status: "not_configured",
    minimumWatchSeconds: null,
    minimumWatchPercent: null,
    rule: "count only after a configured watch threshold is met"
  },
  storageLayer: "future_durable_event_store"
};

function clean(value) {
  return String(value || "").trim();
}

export function createViewDeduplicationKey(input = {}) {
  return [
    clean(input.videoId),
    clean(input.viewerSessionId),
    clean(input.eventId)
  ].join(":");
}

export function validateViewEvent(input = {}) {
  if (!input.videoId) {
    return { valid: false, status: "invalid", reason: "videoId is required." };
  }

  if (!input.creatorId) {
    return { valid: false, status: "invalid", reason: "creatorId is required for attribution." };
  }

  if (!input.viewerSessionId) {
    return { valid: false, status: "invalid", reason: "viewerSessionId is required." };
  }

  if (!input.eventId) {
    return { valid: false, status: "invalid", reason: "eventId is required." };
  }

  if (input.eventType && input.eventType !== "view") {
    return { valid: false, status: "invalid", reason: "Only view events are accepted by this validator." };
  }

  if (input.playbackSignal && input.playbackSignal !== "playing") {
    return { valid: false, status: "invalid", reason: "A valid view must originate from the playing signal." };
  }

  return {
    valid: true,
    status: "validated",
    counted: false,
    duplicateKey: createViewDeduplicationKey(input),
    countDecision: "pending_qualified_view_rule",
    reason: "View event is structurally valid, but a qualified-view threshold is not configured yet."
  };
}

export function evaluateQualifiedView(input = {}) {
  const validation = validateViewEvent(input);

  if (!validation.valid) {
    return validation;
  }

  const watchSeconds = Number(input.watchSeconds);
  const watchPercent = Number(input.watchPercent);

  if (!Number.isFinite(watchSeconds) || watchSeconds < 0) {
    return {
      valid: true,
      status: "not_qualified",
      qualified: false,
      counted: false,
      reason: "watchSeconds is required to evaluate a qualified view."
    };
  }

  if (!Number.isFinite(watchPercent) || watchPercent < 0) {
    return {
      valid: true,
      status: "not_qualified",
      qualified: false,
      counted: false,
      reason: "watchPercent is required to evaluate a qualified view."
    };
  }

  return {
    valid: true,
    status: "threshold_pending",
    qualified: false,
    counted: false,
    watchSeconds,
    watchPercent,
    reason: "Watch activity was received, but the platform has not configured the final qualified-view threshold."
  };
}

export function evaluateViewCount(input = {}) {
  const validation = validateViewEvent(input);

  if (!validation.valid) {
    return validation;
  }

  return {
    valid: true,
    status: "ready_for_counting",
    counted: false,
    duplicateKey: validation.duplicateKey,
    countDecision: "pending_qualified_view_rule",
    reason: "The event passed structural rules. A qualified-view threshold and durable uniqueness check must pass before counting."
  };
}

export function validateRevenueEvent(input = {}) {
  const allowedTypes = ["sale", "refund", "chargeback"];

  if (!input.eventId) {
    return { valid: false, status: "invalid", reason: "eventId is required." };
  }

  if (!input.videoId) {
    return { valid: false, status: "invalid", reason: "videoId is required." };
  }

  if (!input.creatorId) {
    return { valid: false, status: "invalid", reason: "creatorId is required." };
  }

  if (!allowedTypes.includes(String(input.eventType || ""))) {
    return { valid: false, status: "invalid", reason: "Unsupported revenue event type." };
  }

  return {
    valid: true,
    status: "validated",
    recorded: false,
    reason: "Revenue event is structurally valid. Durable revenue recording is not active yet."
  };
}
