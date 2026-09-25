export const VIEWS_REVENUE_RULES = {
  version: "1.1-draft",
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
    countDecision: "pending_storage",
    reason: "View event is valid. Durable duplicate checking and counting are not active yet."
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
    countDecision: "pending_storage",
    reason: "The event passed structural rules. A durable event store must confirm uniqueness before the view is counted."
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
