import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ADMIN_DASHBOARD_RULES, checkAdminPermission } from "./admin-rules.js";
import { ADMIN_AUTH_RULES, evaluateAdminSession, validateAdminLoginRequest } from "./admin-auth.js";
import { getAdminDashboardOverview, getAdminIntegrationSummary } from "./admin-integration.js";
import { XKISS_SECTION_13_LOCK } from "./xkiss-section-13-lock.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const html = read("admin.html");
const css = read("admin/admin-dashboard.css");
const js = read("admin/admin-dashboard.js");
const checks = [];
function check(name, fn) { fn(); checks.push(name); }

check("dashboard assets exist and are linked", () => {
  assert.match(html, /href="admin\/admin-dashboard\.css"/);
  assert.match(html, /src="admin\/admin-dashboard\.js"/);
  assert.ok(css.length > 5000);
  assert.ok(js.length > 1000);
});
check("accessible responsive shell is present", () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /class="skip-link" href="#main"/);
  assert.match(html, /aria-label="Primary navigation"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(css, /@media\(max-width:860px\)/);
  assert.match(css, /@media\(max-width:600px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /:focus-visible/);
});
check("all seven admin modules are represented", () => {
  for (const key of ["users", "content", "reports", "analytics", "storage", "settings", "access"]) {
    assert.match(html, new RegExp('data-module="' + key + '"'));
    assert.match(js, new RegExp(key + ': \\{'));
  }
  assert.equal((html.match(/class="module-card"/g) || []).length, 7);
});
check("dashboard never calls live APIs or external infrastructure", () => {
  assert.doesNotMatch(js, /\bfetch\s*\(/i);
  assert.doesNotMatch(js, /\bXMLHttpRequest\b|\bWebSocket\b/);
  assert.doesNotMatch(html, /https?:\/\//i);
  assert.match(js, /No network or platform services were contacted/);
  assert.match(html, /does not connect to or change Cloudflare, R2, Backblaze B2 or storage APIs/);
});
check("production access remains disabled and fail-closed", () => {
  assert.equal(ADMIN_DASHBOARD_RULES.enabled, false);
  assert.equal(ADMIN_AUTH_RULES.enabled, false);
  const permission = checkAdminPermission({ role: "admin", permission: "view_users" });
  assert.equal(permission.allowed, false);
  const login = validateAdminLoginRequest({ identifier: "admin@example.invalid" });
  assert.equal(login.authenticated, false);
  assert.equal(login.sessionCreated, false);
  const session = evaluateAdminSession({ authenticated: false, sessionValid: false, role: "admin" });
  assert.equal(session.allowed, false);
  assert.equal(session.status, "unauthorized");
});
check("existing administration integration remains backend-gated", () => {
  const overview = getAdminDashboardOverview();
  const summary = getAdminIntegrationSummary();
  assert.equal(overview.enabled, false);
  assert.equal(overview.modules.authentication.enabled, false);
  assert.equal(summary.enabled, false);
  assert.equal(summary.backendRequiredForActivation, true);
});
check("Settings workspace has seven scoped categories and stays view-only", () => {
  assert.match(html, /id="settings-groups" class="settings-groups"/);
  for (const label of ["Platform", "Content", "Users & accounts", "Security", "Payments", "Storage", "Notifications"]) assert.match(html, new RegExp("<h3>" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\check("interactive module readiness is explicit and non-privileged", () => {") + "</h3>"));
  assert.match(html, /Current mode: view-only planning/);
  assert.match(html, /No infrastructure or credentials accessed/);
  assert.match(js, /settingsGroups\.hidden = key !== "settings"/);
  assert.match(css, /\.settings-grid/);
  assert.match(css, /\.settings-card/);
  assert.match(html, /production controls are fail-closed|Production controls are fail-closed/);
});

check("interactive module readiness is explicit and non-privileged", () => {
  assert.match(js, /productionAccessEnabled:false/);
  assert.match(js, /status:"backend_required"/);
  assert.match(html, /PRODUCTION LOCKED/);
  assert.match(html, /SAFE MODE/);
  assert.match(html, /No invented metrics/);
});

check("Section 13 implementation is GREEN and locked without enabling production access", () => {
  assert.equal(XKISS_SECTION_13_LOCK.status, "GREEN");
  assert.equal(XKISS_SECTION_13_LOCK.state, "CLOSED");
  assert.equal(XKISS_SECTION_13_LOCK.locked, true);
  assert.equal(XKISS_SECTION_13_LOCK.productionAccessEnabled, false);
  assert.equal(XKISS_SECTION_13_LOCK.productionActivation, "BLOCKED");
});

console.log(JSON.stringify({stage:"SECTION-13-ADMIN-DASHBOARD",checks:checks.map((name)=>({name,ok:true})),checkCount:checks.length,status:"PASS",sectionState:XKISS_SECTION_13_LOCK.state,productionAccessEnabled:false},null,2));
