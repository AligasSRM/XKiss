export const XKISS_WORKER_ENVIRONMENT_CONTRACT = {
  stage: "AUDIT-04",
  name: "XKiss Worker Environment Contract",
  version: "1.0.0",
  failClosed: true,
  requiredBindings: [
    { name: "XKISS_AUTH", purpose: "account_identity_and_sessions", requiredFor: "user_account_authentication" },
    { name: "XKISS_VIDEOS", purpose: "video_storage", requiredFor: "upload" },
    { name: "XKISS_VIEW_EVENTS", purpose: "durable_view_events", requiredFor: "views_revenue" },
    { name: "XKISS_WALLET_LEDGER", purpose: "wallet_ledger", requiredFor: "wallet_payouts" }
  ],
  providerBoundary: "Cloudflare Worker environment",
  secretsPolicy: "backend_only"
};

export function evaluateWorkerEnvironment(env = {}) {
  const bindings = Object.fromEntries(
    XKISS_WORKER_ENVIRONMENT_CONTRACT.requiredBindings.map((item) => [
      item.name,
      Boolean(env && env[item.name])
    ])
  );
  const missing = Object.keys(bindings).filter((name) => !bindings[name]);

  return {
    ok: true,
    stage: XKISS_WORKER_ENVIRONMENT_CONTRACT.stage,
    status: missing.length === 0 ? "READY_FOR_PROVIDER_VERIFICATION" : "BLOCKED",
    activationAllowed: false,
    failClosed: true,
    bindings,
    missingBindings: missing,
    providerBoundary: XKISS_WORKER_ENVIRONMENT_CONTRACT.providerBoundary,
    secretsPolicy: XKISS_WORKER_ENVIRONMENT_CONTRACT.secretsPolicy
  };
}

export function validateWorkerEnvironmentContract(env = {}) {
  const result = evaluateWorkerEnvironment(env);
  return {
    ok:
      result.failClosed === true &&
      result.activationAllowed === false &&
      Array.isArray(result.missingBindings),
    stage: result.stage
  };
}
