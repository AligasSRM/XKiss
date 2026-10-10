import assert from "node:assert/strict";
import fs from "node:fs";
import { authorizeAdminAction } from "../admin/xkiss-admin-backend.js";

const root = new URL("../", import.meta.url);
const worker = fs.readFileSync(new URL("worker.js", root), "utf8");
const routeStart = worker.indexOf('if (url.pathname === "/api/admin/authorize"');
assert.notEqual(routeStart, -1, "admin authorization route must exist");
const routeEnd = worker.indexOf('\n    if (url.pathname === ', routeStart + 1);
assert.notEqual(routeEnd, -1, "admin authorization route must have a clear boundary");
const route = worker.slice(routeStart, routeEnd);

assert.match(route, /if \(!env\.XKISS_AUTH_DB\)/, "missing auth DB must fail closed");
assert.match(route, /Authorization/, "route must read authorization header");
assert.match(route, /authenticateSession\(env, token\)/, "route must authenticate a server-side session");
assert.match(route, /session\.user/, "permissions must use the authenticated session user");
assert.doesNotMatch(route, /body\.user/, "client-supplied user/role must never authorize admin actions");
assert.match(route, /status: "unauthorized"/, "unauthenticated requests must be rejected");
assert.match(route, /result\.allowed === true \? 200 : 403/, "denied permissions must return forbidden");

const forgedClientAdmin = authorizeAdminAction({ role: "admin", status: "active" }, "manage_users");
assert.equal(forgedClientAdmin.allowed, true, "authorization policy expects a trusted user; route must only pass authenticated session users");

const inactive = authorizeAdminAction({ role: "admin", status: "suspended" }, "manage_users");
assert.equal(inactive.allowed, false);
assert.equal(inactive.status, "unauthorized");

const ordinaryMember = authorizeAdminAction({ role: "member", status: "active" }, "manage_users");
assert.equal(ordinaryMember.allowed, false);
assert.equal(ordinaryMember.status, "forbidden");

console.log(JSON.stringify({
  stage: "ADMIN-SESSION-AUTHORIZATION-GATE",
  checks: 10,
  status: "PASS",
  failClosed: true,
  clientSuppliedRoleTrusted: false
}, null, 2));
