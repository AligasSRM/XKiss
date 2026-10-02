const LIVE_BASE = "https://xkiss.srourr-ali73.workers.dev";

const ENDPOINTS = [
  ["/api/health", "GET", 200],
  ["/api/settings/status", "GET", 200],
  ["/api/safety/status", "GET", 200],
  ["/api/safety/self-test", "GET", 200],
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
    return {
      path,
      method,
      httpStatus: response.status,
      expectedStatus,
      reachable: response.status === expectedStatus,
      json: body !== null,
      okField: body?.ok,
      verified: body?.verified,
      status: body?.status,
      service: body?.service
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
  const failed = checks.filter((item) => !item.reachable);

  return {
    ok: failed.length === 0 && health?.reachable === true,
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
