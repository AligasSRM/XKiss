export const XKISS_MODULE_LIFECYCLE_RULES = Object.freeze({
  stage: "15.24",
  name: "Module Lifecycle Control",
  coreControlled: true,
  allowedTransitions: Object.freeze({
    registered: ["initialized", "destroyed"],
    initialized: ["active", "destroyed"],
    active: ["inactive"],
    inactive: ["active", "destroyed"],
    destroyed: []
  }),
  failClosed: true
});

export function validateXKissModuleLifecycleRules() {
  const transitions = XKISS_MODULE_LIFECYCLE_RULES.allowedTransitions;
  const ok =
    transitions.registered.includes("initialized") &&
    transitions.initialized.includes("active") &&
    transitions.active.includes("inactive") &&
    transitions.inactive.includes("active") &&
    transitions.destroyed.length === 0 &&
    XKISS_MODULE_LIFECYCLE_RULES.coreControlled === true &&
    XKISS_MODULE_LIFECYCLE_RULES.failClosed === true;

  return {
    ok,
    stage: XKISS_MODULE_LIFECYCLE_RULES.stage,
    coreControlled: XKISS_MODULE_LIFECYCLE_RULES.coreControlled,
    failClosed: XKISS_MODULE_LIFECYCLE_RULES.failClosed
  };
}
