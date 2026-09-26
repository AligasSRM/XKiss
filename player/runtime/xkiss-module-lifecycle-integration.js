import { createXKissModuleLifecycle } from "./xkiss-module-lifecycle-core.js";
import { validateXKissModuleLifecycleRules } from "./xkiss-module-lifecycle-rules.js";

export function installXKissModuleLifecycle(core) {
  if (!core) return { ok: false, error: "player-core-not-found" };
  if (core.moduleLifecycle) return { ok: true, reused: true, lifecycle: core.moduleLifecycle };

  const rules = validateXKissModuleLifecycleRules();
  if (!rules.ok) return { ok: false, error: "lifecycle-rules-invalid" };

  const lifecycle = createXKissModuleLifecycle(core);
  core.moduleLifecycle = lifecycle;

  return {
    ok: true,
    reused: false,
    stage: "15.24",
    coreControlled: true,
    lifecycle
  };
}
