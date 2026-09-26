export const XKISS_BACKEND_PROVIDER_CONTRACT = {
  stage: "AUDIT-05",
  name: "XKiss Backend Provider Contract",
  version: "1.0.0",
  failClosed: true,
  providers: {
    safety: {
      capabilities: ["identity", "age_verification", "creator_verification", "moderation", "reporting", "audit", "privacy"],
      requiredFor: "section_12"
    },
    admin: {
      capabilities: ["admin_auth", "authorization", "admin_audit", "secure_data_access"],
      requiredFor: "section_13"
    },
    superAdmin: {
      capabilities: ["authentication", "mfa", "session", "reauthentication", "privileged_authorization", "security_audit"],
      requiredFor: "section_14.3"
    },
    settings: {
      capabilities: ["settings_read", "settings_write", "authorization", "audit"],
      requiredFor: "section_15"
    }
  }
};

function providerReady(providers, key) {
  const provider = providers && providers[key];
  if (!provider || provider.connected !== true) return false;
  const required = XKISS_BACKEND_PROVIDER_CONTRACT.providers[key].capabilities;
  return required.every((capability) =>
    Array.isArray(provider.capabilities) && provider.capabilities.includes(capability)
  );
}

export function evaluateBackendProviderContract(providers = {}) {
  const checks = Object.fromEntries(
    Object.keys(XKISS_BACKEND_PROVIDER_CONTRACT.providers).map((key) => [key, providerReady(providers, key)])
  );
  const missing = Object.keys(checks).filter((key) => !checks[key]);

  return {
    ok: true,
    stage: XKISS_BACKEND_PROVIDER_CONTRACT.stage,
    status: missing.length === 0 ? "READY_FOR_INTEGRATION_TEST" : "BLOCKED",
    activationAllowed: false,
    failClosed: true,
    checks,
    missingProviders: missing
  };
}
