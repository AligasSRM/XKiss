const LIVE_BASE = "https://xkiss.srourr-ali73.workers.dev";

const ENDPOINTS = [
  ["/api/health", "GET", 200],
  ["/api/settings/status", "GET", 200],
  ["/api/safety/status", "GET", 200],
  ["/api/safety/self-test", "GET", 200],
  ["/api/safety/backend/status", "GET", 200],
  ["/api/safety/backend/self-test", "GET", 200],
  ["/api/auth/security", "GET", 200],
  ["/api/admin/security", "GET", 200],
  ["/api/settings/backend/security", "GET", 200],
  ["/api/views/storage/status", "GET", 200],
  ["/api/views/status", "GET", 200],
  ["/api/views/storage/self-test", "GET", 200],
  ["/api/wallet/ledger/status", "GET", 200],
  ["/api/wallet/settlement/status", "GET", 200],
  ["/api/wallet/payout/status", "GET", 200],
  ["/api/wallet/payout/security/status", "GET", 200],
  ["/api/wallet/payout/self-test", "GET", 200]
];

async function check(path, method, expectedStatus) {
  try {
    const response = await fetch(LIVE_BASE + path, {
      method,
      headers: { "accept": "application/json" }
    });
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch {}
    const reachable = response.status === expectedStatus;
    const semanticChecks = [];
    if (reachable && body !== null) {
      if (path === "/api/health") semanticChecks.push({ name: "service_online", ok: body.status === "online" });
      if (path === "/api/settings/status") semanticChecks.push({ name: "settings_core_connected", ok: body.ok === true && body.coreConnected === true && body.activationAllowed === false });
      if (path === "/api/safety/self-test") semanticChecks.push({ name: "safety_self_test", ok: body.ok === true && Array.isArray(body.checks) && body.checks.length > 0 && body.checks.every((item) => item.ok === true) && body.enforcementEnabled === false });
      if (path === "/api/safety/backend/status") semanticChecks.push({ name: "safety_fail_closed", ok: body.failClosed === true && body.enforcementEnabled === false && body.activationAllowed === false });
      if (path === "/api/safety/backend/self-test") semanticChecks.push({ name: "safety_backend_gate_test", ok: body.ok === true && Array.isArray(body.checks) && body.checks.length > 0 && body.checks.every((item) => item.ok === true) && body.enforcementEnabled === false && body.activationAllowed === false });
      if (path === "/api/auth/security") semanticChecks.push({ name: "auth_security_invariants", ok: body.ok === true && body.invariants?.plaintextPasswordsStored === false && body.invariants?.sessionTokensStoredAsHashes === true && body.invariants?.failClosed === true });
      if (path === "/api/admin/security") semanticChecks.push({ name: "admin_fail_closed", ok: body.ok === true && body.security?.frontendCannotGrantPermissions === true && body.security?.failClosed === true });
      if (path === "/api/settings/backend/security") semanticChecks.push({ name: "settings_fail_closed", ok: body.ok === true && body.security?.frontendCannotAuthorize === true && body.security?.frontendCannotChangeProtectedSettings === true && body.security?.failClosed === true });
      if (path === "/api/wallet/payout/status") semanticChecks.push({ name: "real_payouts_disabled", ok: body.ok === true && body.payoutEnabled === false });
      if (path === "/api/wallet/payout/security/status") semanticChecks.push({ name: "payout_security_gate", ok: body.ok === true && body.payoutEnabled === false && body.clientCannotAuthorize === true && body.secretsServerSideOnly === true });
      if (path === "/api/wallet/payout/self-test") semanticChecks.push({ name: "payout_lifecycle_test", ok: body.ok === true && body.verified === true && body.payoutEnabled === false && body.request?.ok === true && body.transition?.ok === true && body.authorization?.authorized === true && body.audit?.ok === true && body.audit?.status === "ready" });
      if (path === "/api/views/storage/self-test") semanticChecks.push({ name: "storage_write_read_delete", ok: body.ok === true && body.verified === true && body.write?.ok === true && body.read?.status === "found" && body.cleanup?.ok === true });
    }
    const semanticOk = semanticChecks.every((item) => item.ok);
    return {
      path,
      method,
      httpStatus: response.status,
      expectedStatus,
      reachable,
      json: body !== null,
      okField: body?.ok,
      verified: body?.verified,
      status: body?.status,
      service: body?.service,
      semanticChecks,
      semanticOk: semanticChecks.length === 0 ? body !== null : semanticOk,
      passed: reachable && body !== null && (semanticChecks.length === 0 || semanticOk)
    };
  } catch (error) {
    return {
      path,
      method,
      httpStatus: null,
      expectedStatus,
      reachable: false,
      json: false,
      error: String(error?.message || error).slice(0, 300)
    };
  }
}

export async function runProductionLiveRegression() {
  const checks = [];
  for (const [path, method, expectedStatus] of ENDPOINTS) {
    checks.push(await check(path, method, expectedStatus));
  }

  const health = checks.find((item) => item.path === "/api/health");
  const failed = checks.filter((item) => !item.passed);

  return {
    ok: failed.length === 0 && health?.passed === true,
    test: "XKiss production live endpoint regression",
    base: LIVE_BASE,
    checks,
    failedCount: failed.length,
    failClosed: true,
    productionActivationAllowed: false
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runProductionLiveRegression();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
