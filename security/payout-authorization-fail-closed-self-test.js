import assert from "node:assert/strict";
import fs from "node:fs";

const worker = fs.readFileSync(new URL("../worker.js", import.meta.url), "utf8");
const start = worker.indexOf('if (url.pathname === "/api/wallet/payout/authorize"');
assert.notEqual(start, -1, "payout authorization route must exist");
const end = worker.indexOf('\n    if (url.pathname === ', start + 1);
assert.notEqual(end, -1, "payout authorization route must have a clear boundary");
const route = worker.slice(start, end);

assert.match(route, /payoutEnabled: false/, "real payouts must remain disabled");
assert.match(route, /authorized: false/, "route must never grant authorization while disabled");
assert.match(route, /status: "payout_disabled"/, "route must explain the fail-closed result");
assert.match(route, /}, 403\)/, "disabled payout authorization must return HTTP 403");
assert.doesNotMatch(route, /await request\.json\(\)/, "client claims must not be parsed as authorization");
assert.doesNotMatch(route, /evaluatePayoutAuthorization\(body\)/, "client-supplied identity must not authorize payouts");

const selfTestStart = worker.indexOf('if (url.pathname === "/api/wallet/payout/self-test"');
const selfTestEnd = worker.indexOf('\n    if (url.pathname === ', selfTestStart + 1);
assert.notEqual(selfTestStart, -1);
const selfTest = worker.slice(selfTestStart, selfTestEnd);
assert.match(selfTest, /payoutEnabled: false/, "self-test must not enable real payouts");
assert.match(selfTest, /verified: Boolean\(/, "internal rule self-test must remain available");
console.log(JSON.stringify({ stage: "PAYOUT-AUTHORIZATION-FAIL-CLOSED", status: "PASS", checks: 8 }, null, 2));
