import { createXKissModuleContractRegistry } from "./xkiss-module-contract-core.js";
import { validateXKissModuleContractRules } from "./xkiss-module-contract-rules.js";

export function installXKissModuleContractRegistry(core) {
  if (!core) return { ok: false, error: "player-core-not-found" };
  if (core.moduleContracts) return { ok: true, reused: true, registry: core.moduleContracts };

  const rules = validateXKissModuleContractRules();
  if (!rules.ok) return { ok: false, error: "contract-rules-invalid" };

  const registry = createXKissModuleContractRegistry(core);
  core.moduleContracts = registry;

  return {
    ok: true,
    reused: false,
    stage: "15.25",
    coreControlled: true,
    registry
  };
}
