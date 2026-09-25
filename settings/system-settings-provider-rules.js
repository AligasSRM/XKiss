export const SYSTEM_SETTINGS_PROVIDER_RULES = {
  section: "15.5",
  name: "System Settings Provider Rules",
  version: "1.0",
  status: "prepared",
  enabled: false,

  providerTypes: [
    "settings",
    "authorization",
    "audit"
  ],

  requiredCapabilities: {
    settings: [
      "read_settings",
      "write_settings"
    ],
    authorization: [
      "authorize_settings_change",
      "authorize_sensitive_change"
    ],
    audit: [
      "record_change",
      "read_audit"
    ]
  },

  securityPrinciples: [
    "backend_only",
    "least_privilege",
    "no_frontend_secrets",
    "explicit_capabilities",
    "fail_closed",
    "audited_sensitive_changes"
  ],

  frontendCannotConnectDirectly: true,
  frontendCannotStoreProviderSecrets: true,
  activationRequiresAllProviders: true
};

function clean(value) {
  return String(value || "").trim();
}

export function isSupportedProviderType(value) {
  return SYSTEM_SETTINGS_PROVIDER_RULES.providerTypes.includes(clean(value));
}

export function getRequiredProviderCapabilities(type) {
  const key = clean(type);

  if (!isSupportedProviderType(key)) {
    return [];
  }

  return [...SYSTEM_SETTINGS_PROVIDER_RULES.requiredCapabilities[key]];
}

export function getSystemSettingsProviderRulesStatus() {
  return {
    ok: true,
    section: SYSTEM_SETTINGS_PROVIDER_RULES.section,
    status: SYSTEM_SETTINGS_PROVIDER_RULES.status,
    enabled: SYSTEM_SETTINGS_PROVIDER_RULES.enabled,
    providerTypes: [...SYSTEM_SETTINGS_PROVIDER_RULES.providerTypes],
    frontendCannotConnectDirectly:
      SYSTEM_SETTINGS_PROVIDER_RULES.frontendCannotConnectDirectly,
    frontendCannotStoreProviderSecrets:
      SYSTEM_SETTINGS_PROVIDER_RULES.frontendCannotStoreProviderSecrets,
    activationRequiresAllProviders:
      SYSTEM_SETTINGS_PROVIDER_RULES.activationRequiresAllProviders
  };
}
