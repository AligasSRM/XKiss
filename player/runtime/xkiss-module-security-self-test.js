import { createXKissModuleContractRegistry } from "./xkiss-module-contract-core.js";
import { createXKissModuleLifecycle } from "./xkiss-module-lifecycle-core.js";
import { createXKissModuleOrchestrator } from "./xkiss-module-orchestration-core.js";
import { createXKissModuleSecurity } from "./xkiss-module-security-core.js";

export function runXKissModuleSecuritySelfCheck() {
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

  core.moduleContracts = createXKissModuleContractRegistry(core);
  core.moduleLifecycle = createXKissModuleLifecycle(core);
  core.moduleOrchestrator = createXKissModuleOrchestrator(core);

  core.moduleContracts.register("secure-base", {
    version: "1.0.0",
    dependencies: [],
    capabilities: ["read", "execute"]
  });

  core.moduleLifecycle.register("secure-base", {
    init() {},
    start() {}
  });

  const activated = core.moduleOrchestrator.activate("secure-base");
  const security = createXKissModuleSecurity(core);
  security.captureIntegritySnapshot();

  const authorized = security.authorize("execute", "secure-base", "execute");
  const deniedUnknown = security.authorize("execute", "unknown-module");
  const invalidInput = security.validateInput("<script>", { type: "string", maxLength: 100 });
  const invalidControl = security.validateInput("safe\u0000value", { type: "string" });

  const limited = [];
  for (let i = 0; i < 4; i += 1) {
    limited.push(security.allowRate("self-test", 3, 10000));
  }

  const integrityClean = security.checkIntegrity();
  core.moduleContracts.get("secure-base").capabilities.push("tampered");
  const integrityChanged = security.checkIntegrity();

  const locked = security.lockModule("secure-base", "self-test");
  const health = security.getHealth();

  const ok =
    activated.ok === true &&
    authorized.ok === true &&
    deniedUnknown.ok === false &&
    deniedUnknown.error === "unknown-module" &&
    invalidInput.ok === true &&
    invalidControl.ok === false &&
    limited[0].ok === true &&
    limited[2].ok === true &&
    limited[3].ok === false &&
    integrityClean.ok === true &&
    integrityChanged.ok === false &&
    integrityChanged.changed === true &&
    locked.ok === true &&
    locked.locked === true &&
    health.status === "warning";

  return {
    ok,
    stage: "15.27",
    coreControlled: true,
    authorized,
    deniedUnknown,
    invalidInput,
    invalidControl,
    rateLimitResult: limited[3],
    integrityClean,
    integrityChanged,
    locked,
    health
  };
}
