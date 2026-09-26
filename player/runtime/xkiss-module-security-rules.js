const SAFE_ACTIONS = Object.freeze([
  "read",
  "execute",
  "activate",
  "deactivate",
  "diagnostic"
]);

const DEFAULT_RATE_LIMIT = Object.freeze({
  limit: 30,
  windowMs: 10000
});

function validModuleName(name) {
  return typeof name === "string" && /^[A-Za-z0-9._-]{1,80}$/.test(name);
}

function validAction(action) {
  return typeof action === "string" && SAFE_ACTIONS.includes(action);
}

function safeText(value, max = 160) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, max);
}

export function validateXKissModuleSecurityRules() {
  return Object.freeze({
    stage: "15.27",
    safeActions: SAFE_ACTIONS,
    defaultRateLimit: DEFAULT_RATE_LIMIT,
    validModuleName,
    validAction,
    safeText
  });
}
