import { createXKissModuleContractRegistry } from "./xkiss-module-contract-core.js";
import { validateXKissModuleContractRules } from "./xkiss-module-contract-rules.js";

export function runXKissModuleContractSelfCheck() {
  const rules = validateXKissModuleContractRules();
  const core = {
    modules: {},
    registerModule(name, status) {
      this.modules[name] = { status };
      return true;
    },
    getModuleStatus() {
      return { ...this.modules };
    }
  };

  const registry = createXKissModuleContractRegistry(core);
  const base = registry.register("base-core", {
    version: "1.0.0",
    dependencies: [],
    capabilities: ["playback.control", "events"]
  });
  const dependent = registry.register("dependent-module", {
    version: "1.0.0",
    dependencies: ["base-core"],
    capabilities: ["captions"]
  });
  const duplicate = registry.register("dependent-module", {
    version: "1.0.0",
    dependencies: ["base-core"],
    capabilities: []
  });
  const missingDependency = registry.register("missing-module", {
    version: "1.0.0",
    dependencies: ["does-not-exist"],
    capabilities: []
  });
  const selfDependency = registry.register("self-module", {
    version: "1.0.0",
    dependencies: ["self-module"],
    capabilities: []
  });

  core.registerModule("base-core", "active");
  const ready = registry.dependenciesReady("dependent-module");
  core.registerModule("base-core", "inactive");
  const blocked = registry.dependenciesReady("dependent-module");

  const ok =
    rules.ok === true &&
    base.ok === true &&
    dependent.ok === true &&
    duplicate.ok === false &&
    missingDependency.ok === false &&
    selfDependency.ok === false &&
    registry.has("base-core") === true &&
    registry.hasCapability("base-core", "playback.control") === true &&
    ready.ready === true &&
    blocked.ready === false &&
    blocked.missing.includes("base-core") &&
    registry.get("dependent-module")?.dependencies[0] === "base-core";

  return {
    ok,
    stage: "15.25",
    coreControlled: true,
    rules,
    registered: {
      base: base.ok,
      dependent: dependent.ok
    },
    rejected: {
      duplicate: duplicate.ok === false,
      missingDependency: missingDependency.ok === false,
      selfDependency: selfDependency.ok === false
    },
    dependencyChecks: {
      ready: ready.ready,
      blocked: blocked.ready,
      missingWhenBlocked: blocked.missing
    },
    capabilityCheck: registry.hasCapability("base-core", "playback.control"),
    finalContracts: registry.get()
  };
}
