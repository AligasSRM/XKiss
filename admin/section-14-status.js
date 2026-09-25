import { getAdminIntegrationSummary } from "./admin-integration.js";

export const SECTION_14_STATUS = {
  section: 14,
  name: "Admin Dashboard",
  status: "prepared",
  locked: true,
  productionEnabled: false,
  finalTestPassed: true,
  backendRequiredForActivation: true
};

export function getSection14FinalStatus() {
  const summary = getAdminIntegrationSummary();

  return {
    ok: summary.modulesReady,
    section: SECTION_14_STATUS.section,
    name: SECTION_14_STATUS.name,
    status: summary.modulesReady ? "prepared" : "needs_review",
    locked: summary.modulesReady,
    productionEnabled: SECTION_14_STATUS.productionEnabled,
    finalTestPassed: summary.modulesReady,
    moduleCount: summary.moduleCount,
    modulesReady: summary.modulesReady,
    backendRequiredForActivation:
      SECTION_14_STATUS.backendRequiredForActivation,
    reason: summary.modulesReady
      ? "Section 14 is structurally complete, all Admin Dashboard modules are prepared, and the section is locked. Production activation remains disabled until the secure backend is connected."
      : "One or more Admin Dashboard modules require review."
  };
}
