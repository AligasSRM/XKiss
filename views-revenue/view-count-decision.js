import { evaluateViewPipeline } from "./view-pipeline.js";
import { createViewDeduplicationKey } from "./views-revenue-rules.js";
import { commitQualifiedView, isViewEventStoreReady } from "./view-event-store.js";

export async function evaluateViewCountDecision(env, input = {}) {
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
      reason: "The view passed qualification, but durable event storage is not connected. No production count was recorded."
    };
  }

  const commit = await commitQualifiedView(env, input);

  if (commit.status === "duplicate") {
    return {
      ok: true,
      status: "duplicate",
      counted: Boolean(commit.counted),
      stage: "count_commit",
      duplicateKey,
      pipeline,
      commit,
      reason: "This view event was already recorded and cannot increment the count again."
    };
  }

  return {
    ok: true,
    status: "counted",
    counted: true,
    stage: "count_commit",
    duplicateKey,
    pipeline,
    commit,
    reason: "Qualified view passed validation and was durably recorded as counted."
  };
}
