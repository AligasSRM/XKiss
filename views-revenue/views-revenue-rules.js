export const VIEWS_REVENUE_RULES = {
  version: "1.3-draft",
  status: "prepared",
  persistence: "not_connected",
  counting: "server_side",
  revenueEvents: "server_side",
  duplicateProtection: true,
  duplicateKey: "videoId + viewerSessionId + eventId",
  botReview: true,
  invalidTrafficHandling: "exclude_from_count",
  suspiciousTrafficHandling: "hold_for_review",
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
  botSignals: [
    "missing_required_fields",
    "invalid_event_type",
    "invalid_playback_signal",
    "invalid_watch_values",
    "invalid_creator_attribution",
    "invalid_video_attribution"
  ],
  storageLayer: "future_durable_event_store"
};

function clean(value) {
  return String(value || "").trim();
}

function invalidTraffic(reason) {
  return {
    status: "invalid_traffic",
    eligible: false,
    counted: false,
    action: "exclude_from_count",
    reason
  };
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
    return { valid: false, ...invalidTraffic("videoId is required.") };
  }

  if (!input.creatorId) {
    return { valid: false, ...invalidTraffic("creatorId is required for attribution.") };
  }

  if (!input.viewerSessionId) {
    return { valid: false, ...invalidTraffic("viewerSessionId is required.") };
  }

  if (!input.eventId) {
    return { valid: false, ...invalidTraffic("eventId is required.") };
  }

  if (input.eventType && input.eventType !== "view") {
    return { valid: false, ...invalidTraffic("Only view events are accepted by this validator.") };
  }

  if (input.playbackSignal && input.playbackSignal !== "playing") {
    return { valid: false, ...invalidTraffic("A valid view must originate from the playing signal.") };
  }

  return {
    valid: true,
    status: "validated",
    eligible: true,
    counted: false,
    duplicateKey: createViewDeduplicationKey(input),
    countDecision: "pending_qualified_view_rule",
    reason: "View event passed the structural traffic checks."
  };
}

export function evaluateTrafficQuality(input = {}) {
  const validation = validateViewEvent(input);

  if (!validation.valid) {
    return validation;
  }

  const watchSeconds = Number(input.watchSeconds);
  const watchPercent = Number(input.watchPercent);

  if (
    input.watchSeconds !== undefined &&
    (!Number.isFinite(watchSeconds) || watchSeconds < 0)
  ) {
    return invalidTraffic("watchSeconds is invalid.");
  }

  if (
    input.watchPercent !== undefined &&
    (!Number.isFinite(watchPercent) || watchPercent < 0 || watchPercent > 100)
  ) {
    return invalidTraffic("watchPercent is invalid.");
  }

  return {
    status: "traffic_validated",
    eligible: true,
    counted: false,
    review: "passed_structural_checks",
    reason: "No deterministic bot signal was detected by the current rule set. Final counting still requires qualified-view and durable uniqueness checks."
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

  if (!Number.isFinite(watchPercent) || watchPercent < 0 || watchPercent > 100) {
    return invalidTraffic("watchPercent is invalid.");
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
    reason: "The event passed structural traffic rules. Qualified-view and durable uniqueness checks must pass before counting."
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
