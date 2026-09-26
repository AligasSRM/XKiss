import { createXKissModuleHealth } from "./xkiss-module-health-core.js";

export function installXKissModuleHealth(core) {
  if (!core) return { ok: false, error: "player-core-required", stage: "15.28" };
  if (!core.moduleLifecycle || !core.moduleContracts) return { ok: false, error: "health-prerequisites-missing", stage: "15.28" };
  if (core.moduleHealth) return { ok: true, stage: "15.28", coreControlled: true, reused: true, health: core.moduleHealth };

  try {
    const health = createXKissModuleHealth(core);
    core.moduleHealth = health;
    core.registerModule("module-health", "active");
    return { ok: true, stage: "15.28", coreControlled: core.moduleHealth === health, health };
  } catch (error) {
    return { ok: false, error: String(error?.message || error), stage: "15.28" };
  }
}
