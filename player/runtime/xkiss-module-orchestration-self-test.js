import { createXKissModuleContractRegistry } from "./xkiss-module-contract-core.js";
import { createXKissModuleLifecycle } from "./xkiss-module-lifecycle-core.js";
import { createXKissModuleOrchestrator } from "./xkiss-module-orchestration-core.js";

export function runXKissModuleOrchestrationSelfCheck() {
  const core = {
    modules: {},
    registerModule(name, status) { this.modules[name] = { status }; return true; },
    getModuleStatus() { return { ...this.modules }; }
  };
  core.moduleContracts = createXKissModuleContractRegistry(core);
  core.moduleLifecycle = createXKissModuleLifecycle(core);
  const events = [];
  const hooks = name => ({
    init: () => events.push(name + ":init"),
    start: () => events.push(name + ":start")
  });

  core.moduleContracts.register("base", { version:"1.0.0", dependencies:[], capabilities:["base"] });
  core.moduleContracts.register("middle", { version:"1.0.0", dependencies:["base"], capabilities:["middle"] });
  core.moduleContracts.register("top", { version:"1.0.0", dependencies:["middle"], capabilities:["top"] });

  core.moduleLifecycle.register("base", hooks("base"));
  core.moduleLifecycle.register("middle", hooks("middle"));
  core.moduleLifecycle.register("top", hooks("top"));

  const orchestrator = createXKissModuleOrchestrator(core);
  const plan = orchestrator.plan("top");
  const activated = orchestrator.activate("top");
  const final = core.moduleLifecycle.getStatus();

  const ok =
    plan.ok === true &&
    JSON.stringify(plan.order) === JSON.stringify(["base","middle","top"]) &&
    activated.ok === true &&
    events.join(",") === "base:init,base:start,middle:init,middle:start,top:init,top:start" &&
    final.base.state === "active" &&
    final.middle.state === "active" &&
    final.top.state === "active";

  return {
    ok,
    stage: "15.26",
    coreControlled: true,
    plan,
    activated,
    eventSequence: events,
    finalStates: Object.fromEntries(Object.entries(final).map(([k,v]) => [k,v.state]))
  };
}
