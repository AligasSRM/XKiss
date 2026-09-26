import { validateXKissModuleContract } from "./xkiss-module-contract-rules.js";

function validName(name) {
  return typeof name === "string" && /^[A-Za-z0-9._-]{1,80}$/.test(name);
}

function snapshot(contract) {
  return {
    name: contract.name,
    version: contract.version,
    dependencies: [...contract.dependencies],
    capabilities: [...contract.capabilities],
    registeredAt: contract.registeredAt
  };
}

export function createXKissModuleContractRegistry(core) {
  if (!core || typeof core.registerModule !== "function") {
    throw new Error("XKiss Module Contract Registry requires Player Core.");
  }

  const contracts = new Map();

  function register(name, contract = {}) {
    if (!validName(name) || contracts.has(name)) {
      return { ok: false, error: "invalid-or-duplicate-module" };
    }

    const validation = validateXKissModuleContract(contract);
    if (!validation.ok) {
      return { ok: false, error: "invalid-module-contract", validation };
    }

    if (contract.dependencies.includes(name)) {
      return { ok: false, error: "self-dependency" };
    }

    for (const dependency of contract.dependencies) {
      if (!contracts.has(dependency)) {
        return { ok: false, error: "dependency-not-registered", dependency };
      }
    }

    const record = {
      name,
      version: contract.version,
      dependencies: [...contract.dependencies],
      capabilities: [...contract.capabilities],
      registeredAt: Date.now()
    };

    contracts.set(name, record);
    core.registerModule(name, "contract-registered");
    return { ok: true, contract: snapshot(record) };
  }

  function get(name) {
    if (!name) return Object.fromEntries([...contracts].map(([key, value]) => [key, snapshot(value)]));
    const contract = contracts.get(name);
    return contract ? snapshot(contract) : null;
  }

  function has(name) {
    return contracts.has(name);
  }

  function hasCapability(name, capability) {
    const contract = contracts.get(name);
    return !!contract && contract.capabilities.includes(capability);
  }

  function dependenciesReady(name, activeStatuses = ["initialized", "active"]) {
    const contract = contracts.get(name);
    if (!contract) return { ok: false, ready: false, error: "module-not-found", missing: [] };

    const statuses = typeof core.getModuleStatus === "function" ? core.getModuleStatus() : {};
    const missing = contract.dependencies.filter(dependency => {
      const status = statuses?.[dependency]?.status;
      return !activeStatuses.includes(status);
    });

    return { ok: missing.length === 0, ready: missing.length === 0, missing };
  }

  return Object.freeze({ register, get, has, hasCapability, dependenciesReady });
}
