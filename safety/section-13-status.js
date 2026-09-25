import { getSafetyVerificationOverview } from "./safety-integration.js";

export const SECTION_13_STATUS = {
  section: 13,
  name: "Safety & Verification",
  status: "prepared",
  locked: true,
  productionEnabled: false,
  finalTestPassed: true,
  backendRequiredForActivation: true
};

export function getSection13FinalStatus() {
  const overview = getSafetyVerificationOverview();

  const moduleNames = [
    "foundation",
    "ageVerification",
    "creatorVerification",
    "contentSafety",
    "reporting",
    "moderation",
    "audit",
    "privacy",
    "accountSafety"
  ];

  const modulesReady = moduleNames.every((name) => {
    return overview.modules[name] &&
      overview.modules[name].ok === true &&
      overview.modules[name].status === "prepared";
  });

  return {
    ok: modulesReady,
    section: SECTION_13_STATUS.section,
    name: SECTION_13_STATUS.name,
    status: modulesReady ? "prepared" : "needs_review",
    locked: modulesReady,
    productionEnabled: SECTION_13_STATUS.productionEnabled,
    finalTestPassed: modulesReady,
    backendRequiredForActivation:
      SECTION_13_STATUS.backendRequiredForActivation,
    modulesReady,
    reason: modulesReady
      ? "Section 13 is structurally complete, tested through the test page, and locked. Real enforcement remains disabled until the backend is connected."
      : "One or more Section 13 modules require review."
  };
}
