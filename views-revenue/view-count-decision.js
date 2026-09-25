import { evaluateViewPipeline } from "./view-pipeline.js";
import { createViewDeduplicationKey } from "./views-revenue-rules.js";
import { isViewEventStoreReady } from "./view-event-store.js";

export function evaluateViewCountDecision(env, input = {}) {
  const pipeline = evaluateViewPipeline(input);

  if (pipeline.status !== "qualified_pending_storage") {
    return {
      ok: true,
      status: "not_counted",
      counted: false,
      stage: pipeline.stage,
      pipeline,
      reason: "The view did not reach the qualified-view stage required for counting."
    };
  }

  const duplicateKey = createViewDeduplicationKey(input);

  if (!isViewEventStoreReady(env)) {
    return {
      ok: true,
      status: "storage_pending",
      counted: false,
      stage: "storage",
      duplicateKey,
      pipeline,
      reason: "The view passed the current qualification checks, but durable event storage is not connected. No count was recorded."
    };
  }

  return {
    ok: true,
    status: "count_ready",
    counted: false,
    stage: "count_commit_pending",
    duplicateKey,
    pipeline,
    reason: "The event passed the current checks and storage is available. A final durable count commit is still required before incrementing the view counter."
  };
}
