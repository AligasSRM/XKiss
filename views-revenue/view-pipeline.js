import {
  validateViewEvent,
  evaluateTrafficQuality,
  evaluateQualifiedView,
  createViewDeduplicationKey
} from "./views-revenue-rules.js";

export function evaluateViewPipeline(input = {}) {
  const validation = validateViewEvent(input);

  if (!validation.valid) {
    return {
      ok: true,
      status: "rejected",
      stage: "validation",
      counted: false,
      result: validation
    };
  }

  const traffic = evaluateTrafficQuality(input);

  if (!traffic.eligible) {
    return {
      ok: true,
      status: "rejected",
      stage: "traffic",
      counted: false,
      result: traffic
    };
  }

  const qualified = evaluateQualifiedView(input);

  if (qualified.status !== "threshold_pending" || qualified.qualified) {
    return {
      ok: true,
      status: qualified.qualified ? "qualified_pending_storage" : "rejected",
      stage: "qualified_view",
      counted: false,
      result: qualified
    };
  }

  return {
    ok: true,
    status: "pending_threshold",
    stage: "qualified_view",
    counted: false,
    duplicateKey: createViewDeduplicationKey(input),
    validation,
    traffic,
    qualified,
    reason: "All current structural checks passed, but the qualified-view threshold is not configured. The event cannot be counted or stored as a counted view."
  };
}
