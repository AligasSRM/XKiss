import { getAdminIntegrationSummary } from "./admin-integration.js";

export const SECTION_13_STATUS = {
  section: 13,
  name: "Admin Dashboard",
  status: "prepared",
  locked: true,
  productionEnabled: false,
  finalTestPassed: true,
  backendRequiredForActivation: true
};

export function getSection13FinalStatus() {
  const summary = getAdminIntegrationSummary();

  return {
    ok: summary.modulesReady,
    section: SECTION_13_STATUS.section,
    name: SECTION_13_STATUS.name,
    status: summary.modulesReady ? "prepared" : "needs_review",
    locked: summary.modulesReady,
    productionEnabled: SECTION_13_STATUS.productionEnabled,
    finalTestPassed: summary.modulesReady,
    moduleCount: summary.moduleCount,
    modulesReady: summary.modulesReady,
    backendRequiredForActivation:
      SECTION_13_STATUS.backendRequiredForActivation,
    reason: summary.modulesReady
      ? "Section 13 is structurally complete, all Admin Dashboard modules are prepared, and the section is locked. Production activation remains disabled until the secure backend is connected."
      : "One or more Admin Dashboard modules require review."
  };
}
