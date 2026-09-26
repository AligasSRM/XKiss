import { validateXKissModuleOrchestrationRules } from "./xkiss-module-orchestration-rules.js";

export function createXKissModuleOrchestrator(core) {
  if (!core || !core.moduleContracts || !core.moduleLifecycle) {
    throw new Error("XKiss Module Orchestrator requires Core contracts and lifecycle.");
  }

  const rules = validateXKissModuleOrchestrationRules();

  function plan(name) {
    const contracts = core.moduleContracts;
    if (!contracts.has(name)) return { ok: false, error: "module-not-found", order: [] };

    const order = [];
    const visiting = new Set();
    const visited = new Set();

    function visit(current) {
      if (visiting.has(current)) throw new Error("dependency-cycle");
      if (visited.has(current)) return;
      visiting.add(current);
      const contract = contracts.get(current);
      for (const dependency of contract.dependencies) {
        if (!contracts.has(dependency)) throw new Error("dependency-not-registered:" + dependency);
        visit(dependency);
      }
      visiting.delete(current);
      visited.add(current);
      order.push(current);
    }

    try {
      visit(name);
      return { ok: true, order };
    } catch (error) {
      return { ok: false, error: String(error?.message || error), order: [] };
    }
  }

  function initialize(name) {
    const p = plan(name);
    if (!p.ok) return p;
    const results = [];
    for (const moduleName of p.order) {
      const status = core.moduleLifecycle.getStatus(moduleName);
      if (!status) return { ok: false, error: "lifecycle-module-not-registered", module: moduleName, results };
      if (status.state === "registered") {
        const result = core.moduleLifecycle.initialize(moduleName);
        results.push({ module: moduleName, action: "initialize", ok: result.ok });
        if (!result.ok) return { ok: false, error: "initialization-failed", module: moduleName, results };
      }
    }
    return { ok: true, order: p.order, results };
  }

  function activate(name) {
    const initialized = initialize(name);
    if (!initialized.ok) return initialized;
    const results = [];
    for (const moduleName of initialized.order) {
      const status = core.moduleLifecycle.getStatus(moduleName);
      if (status.state === "initialized" || status.state === "inactive") {
        const ready = core.moduleContracts.dependenciesReady(moduleName);
        if (!ready.ready) return { ok: false, error: "dependency-not-ready", module: moduleName, missing: ready.missing, results };
        const result = core.moduleLifecycle.activate(moduleName);
        results.push({ module: moduleName, action: "activate", ok: result.ok });
        if (!result.ok) return { ok: false, error: "activation-failed", module: moduleName, results };
      }
    }
    return { ok: true, order: initialized.order, results };
  }

  return Object.freeze({
    stage: "15.26",
    rules,
    plan,
    initialize,
    activate
  });
}
