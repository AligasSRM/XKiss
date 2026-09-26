import { runPlatformSettingsSectionCheck } from "./xkiss-platform-settings-section-core.js";

export function runXKissPlatformSettingsSectionSelfTest() {
  const result = runPlatformSettingsSectionCheck();

  return {
    ok: result.ok === true &&
      result.section === "15" &&
      result.status === "GREEN_CLOSED" &&
      result.failClosed === true &&
      result.productionActivationAllowed === false,
    section: "15",
    test: "XKiss Platform Settings Section 15 complete self-test",
    status: result.status,
    productionActivationAllowed: result.productionActivationAllowed,
    externalActivationRequired: result.externalActivationRequired,
    reason: result.reason
  };
}
