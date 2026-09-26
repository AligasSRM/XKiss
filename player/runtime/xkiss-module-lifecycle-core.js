const STATES = Object.freeze({
  REGISTERED: "registered",
  INITIALIZED: "initialized",
  ACTIVE: "active",
  INACTIVE: "inactive",
  DESTROYED: "destroyed"
});

function validName(name) {
  return typeof name === "string" && /^[A-Za-z0-9._-]{1,80}$/.test(name);
}

function cloneRecord(record) {
  return record ? { ...record } : null;
}

export function createXKissModuleLifecycle(core) {
  if (!core || typeof core.registerModule !== "function") {
    throw new Error("XKiss Module Lifecycle requires Player Core.");
  }

  const modules = new Map();

  function register(name, hooks = {}) {
    if (!validName(name) || modules.has(name)) return { ok: false, error: "invalid-or-duplicate-module" };
    if (hooks && typeof hooks !== "object") return { ok: false, error: "invalid-hooks" };

    const record = {
      name,
      state: STATES.REGISTERED,
      initialized: false,
      active: false,
      createdAt: Date.now()
    };

    modules.set(name, { record, hooks });
    core.registerModule(name, STATES.REGISTERED);
    return { ok: true, module: cloneRecord(record) };
  }

  function initialize(name) {
    const entry = modules.get(name);
    if (!entry) return { ok: false, error: "module-not-found" };
    if (entry.record.state !== STATES.REGISTERED) return { ok: false, error: "invalid-transition" };

    try {
      if (typeof entry.hooks.init === "function") entry.hooks.init(core);
      entry.record.state = STATES.INITIALIZED;
      entry.record.initialized = true;
      core.registerModule(name, STATES.INITIALIZED);
      return { ok: true, module: cloneRecord(entry.record) };
    } catch (error) {
      return { ok: false, error: "module-init-failed", detail: String(error?.message || error) };
    }
  }

  function activate(name) {
    const entry = modules.get(name);
    if (!entry) return { ok: false, error: "module-not-found" };
    if (entry.record.state !== STATES.INITIALIZED && entry.record.state !== STATES.INACTIVE) {
      return { ok: false, error: "invalid-transition" };
    }

    try {
      if (typeof entry.hooks.start === "function") entry.hooks.start(core);
      entry.record.state = STATES.ACTIVE;
      entry.record.active = true;
      core.registerModule(name, STATES.ACTIVE);
      return { ok: true, module: cloneRecord(entry.record) };
    } catch (error) {
      return { ok: false, error: "module-start-failed", detail: String(error?.message || error) };
    }
  }

  function deactivate(name) {
    const entry = modules.get(name);
    if (!entry) return { ok: false, error: "module-not-found" };
    if (entry.record.state !== STATES.ACTIVE) return { ok: false, error: "invalid-transition" };

    try {
      if (typeof entry.hooks.stop === "function") entry.hooks.stop(core);
      entry.record.state = STATES.INACTIVE;
      entry.record.active = false;
      core.registerModule(name, STATES.INACTIVE);
      return { ok: true, module: cloneRecord(entry.record) };
    } catch (error) {
      return { ok: false, error: "module-stop-failed", detail: String(error?.message || error) };
    }
  }

  function destroy(name) {
    const entry = modules.get(name);
    if (!entry) return { ok: false, error: "module-not-found" };
    if (entry.record.state === STATES.ACTIVE || entry.record.state === STATES.DESTROYED) {
      return { ok: false, error: "invalid-transition" };
    }

    try {
      if (typeof entry.hooks.destroy === "function") entry.hooks.destroy(core);
      entry.record.state = STATES.DESTROYED;
      entry.record.active = false;
      core.registerModule(name, STATES.DESTROYED);
      return { ok: true, module: cloneRecord(entry.record) };
    } catch (error) {
      return { ok: false, error: "module-destroy-failed", detail: String(error?.message || error) };
    }
  }

  function getStatus(name) {
    if (name) {
      const entry = modules.get(name);
      return entry ? cloneRecord(entry.record) : null;
    }
    return Object.fromEntries([...modules].map(([key, entry]) => [key, cloneRecord(entry.record)]));
  }

  return Object.freeze({
    states: STATES,
    register,
    initialize,
    activate,
    deactivate,
    destroy,
    getStatus
  });
}
