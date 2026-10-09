(function () {
  "use strict";
  var modules = {
    users: { title:"Users & accounts", description:"Account lookup and account-state changes require verified server-side authorization.", checks:["Backend authentication provider is not connected.","No user records are fetched by this dashboard.","Account changes remain disabled.","Every future privileged change must be audited."] },
    content: { title:"Content moderation", description:"Moderation decisions require an authenticated service and traceable policy enforcement.", checks:["No content records are loaded.","No moderation action is exposed.","Server-side role and policy checks are required.","Sensitive decisions require a durable audit event."] },
    reports: { title:"Reports & review", description:"Report handling remains unavailable until the secure review workflow is integrated and tested.", checks:["No reports or personal data are fetched.","Reviewer identity must be verified server-side.","Resolution actions require explicit authorization.","Audit storage must be durable and access-controlled."] },
    analytics: { title:"Platform analytics", description:"Live metrics are intentionally omitted until an authoritative, privacy-reviewed data source is connected.", checks:["No live analytics endpoint is called.","No sample numbers are presented as real.","Access must be scoped by role.","Data freshness and provenance must be visible when integrated."] },
    storage: { title:"Storage status", description:"This UI is isolated from storage infrastructure and does not call Cloudflare, R2, Backblaze B2, or storage APIs.", checks:["No storage endpoint is called.","No credentials or secrets are read.","No bucket or object operation is exposed.","Storage diagnostics remain outside this dashboard scope."] },
    settings: { title:"Platform settings", description:"Configuration changes remain unavailable until an authenticated backend enforces permissions, validation, and audit logging.", checks:["No settings endpoint is called.","No configuration is changed.","Sensitive changes require re-authentication.","Changes must be validated and auditable."] },
    access: { title:"Admin access & security", description:"This page cannot create an admin session, grant a role, bypass MFA, or elevate privileges.", checks:["No frontend authentication is claimed.","Super-admin MFA must be enforced server-side.","Session expiry and revocation are backend responsibilities.","Unknown or unavailable authorization must deny access."] }
  };
  function byId(id) { return document.getElementById(id); }
  var toastTimer = null;
  function showToast(message) {
    var toast = byId("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    if (toastTimer !== null) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.hidden = true; }, 3200);
  }
  function closeMenu() {
    var sidebar = byId("sidebar"), toggle = byId("menu-toggle");
    if (sidebar) sidebar.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }
  function closeDetail() { var detail = byId("module-detail"); if (detail) detail.hidden = true; }
  function setView(key) {
    var module = modules[key];
    if (!module) { showToast("This section is not available in the read-only dashboard."); return; }
    document.querySelectorAll("[data-view]").forEach(function (item) {
      var active = item.getAttribute("data-view") === key;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
    });
    var label = document.querySelector('[data-view="' + key + '"]');
    if (byId("breadcrumb")) byId("breadcrumb").textContent = label ? label.textContent.replace(/LOCKED/g, "").trim() : module.title;
    if (byId("page-title")) byId("page-title").textContent = module.title;
    if (byId("page-subtitle")) byId("page-subtitle").textContent = module.description;
    if (byId("detail-title")) byId("detail-title").textContent = module.title;
    if (byId("detail-description")) byId("detail-description").textContent = module.description;
    var detail = byId("module-detail"), list = byId("detail-checks"), settingsGroups = byId("settings-groups");
    if (detail) detail.hidden = false;
    if (settingsGroups) settingsGroups.hidden = key !== "settings";
    if (list) {
      list.replaceChildren();
      module.checks.forEach(function (check) { var li = document.createElement("li"); li.textContent = check; list.appendChild(li); });
    }
    if (window.matchMedia && window.matchMedia("(max-width: 860px)").matches) closeMenu();
    if (detail && typeof detail.scrollIntoView === "function") detail.scrollIntoView({ behavior:"smooth", block:"nearest" });
  }
  function filterModules() {
    var input = byId("module-search"), query = input ? input.value.trim().toLowerCase() : "";
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-module]")), visible = 0;
    cards.forEach(function (card) {
      var text = ((card.getAttribute("data-keywords") || "") + " " + card.textContent).toLowerCase();
      var matches = !query || text.indexOf(query) !== -1;
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    var status = byId("search-status");
    if (status) status.textContent = query ? "Showing " + visible + " of " + cards.length + " modules" : "Showing " + cards.length + " modules";
  }
  function refreshLocalStatus() {
    var updated = byId("updated");
    if (updated) updated.textContent = "Local status refreshed at " + new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    showToast("Local dashboard refreshed. No network or platform services were contacted.");
  }
  function init() {
    document.querySelectorAll("[data-view]").forEach(function (item) {
      item.addEventListener("click", function () {
        var key = item.getAttribute("data-view");
        if (key === "overview") {
          document.querySelectorAll("[data-view]").forEach(function (nav) {
            var active = nav === item;
            nav.classList.toggle("is-active", active);
            if (active) nav.setAttribute("aria-current", "page"); else nav.removeAttribute("aria-current");
          });
          if (byId("breadcrumb")) byId("breadcrumb").textContent = "Overview";
          if (byId("page-title")) byId("page-title").innerHTML = 'Admin dashboard<span class="accent">.</span>';
          if (byId("page-subtitle")) byId("page-subtitle").textContent = "A clear operational overview, with sensitive actions locked until server-side identity and permissions are verified.";
          closeDetail();
        } else setView(key);
      });
    });
    document.querySelectorAll("[data-open-module]").forEach(function (button) { button.addEventListener("click", function () { setView(button.getAttribute("data-open-module")); }); });
    if (byId("module-search")) byId("module-search").addEventListener("input", filterModules);
    if (byId("close-detail")) byId("close-detail").addEventListener("click", closeDetail);
    if (byId("refresh")) byId("refresh").addEventListener("click", refreshLocalStatus);
    if (byId("menu-toggle")) byId("menu-toggle").addEventListener("click", function () {
      var sidebar = byId("sidebar"), toggle = byId("menu-toggle"), open = sidebar && !sidebar.classList.contains("is-open");
      if (sidebar) sidebar.classList.toggle("is-open", Boolean(open));
      if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") { closeMenu(); closeDetail(); } });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  }
  if (typeof window !== "undefined") window.XKissAdminDashboard = {
    version:"1.0.0", mode:"read-only", productionAccessEnabled:false, modules:Object.keys(modules),
    getModuleReadiness:function (name) {
      var key = String(name || "").trim();
      return modules[key] ? {ok:true,status:"backend_required",title:modules[key].title} : {ok:false,status:"unknown_module"};
    }
  };
})();