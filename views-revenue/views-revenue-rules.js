export const VIEWS_REVENUE_RULES = {
  version: "1.0-draft",
  status: "prepared",
  persistence: "not_connected",
  counting: "server_side",
  revenueEvents: "server_side",
  duplicateProtection: true,
  botReview: true,
  creatorAttributionRequired: true,
  videoAttributionRequired: true,
  realActivityRequired: true,
  storageLayer: "future_durable_event_store"
};

export function validateViewEvent(input = {}) {
  if (!input.videoId) {
    return { valid: false, status: "invalid", reason: "videoId is required." };
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

  return {
    valid: true,
    status: "validated",
    counted: false,
    reason: "View event is structurally valid. Durable counting is not active yet."
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
