import { SAFETY_RULES } from "./safety-rules.js";

export const PRIVACY_DATA_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  principles: [
    "data_minimization",
    "purpose_limitation",
    "privacy_by_default",
    "secure_processing",
    "limited_retention",
    "access_control",
    "auditability"
  ],

  protectedDataCategories: [
    "identity_information",
    "age_verification_data",
    "creator_verification_data",
    "reporter_information",
    "moderation_records",
    "security_events"
  ],

  frontendStorageProhibited: [
    "identity_documents",
    "verification_documents",
    "raw_identity_images",
    "government_id_numbers",
    "payment_card_data",
    "moderation_sensitive_data"
  ],

  allowedFrontendStorage: [
    "non_sensitive_preferences",
    "temporary_ui_state"
  ],

  sensitiveDataMinimized: true,
  identityDocumentsStoredInFrontend: false,
  identityDocumentsStoredInBrowserStorage: false,
  paymentCardDataStoredByXKiss: false,

  encryptionAtRestRequired: true,
  encryptionInTransitRequired: true,
  accessControlRequired: true,
  auditTrailRequired: true,

  privacyProvider: null,
  secureDataStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getPrivacyDataStatus() {
  return {
    ok: true,
    status: PRIVACY_DATA_RULES.status,
    enabled: PRIVACY_DATA_RULES.enabled,
    secureStorageConnected: Boolean(PRIVACY_DATA_RULES.secureDataStorage),
    encryptionAtRestRequired: PRIVACY_DATA_RULES.encryptionAtRestRequired,
    encryptionInTransitRequired: PRIVACY_DATA_RULES.encryptionInTransitRequired,
    reason: "Privacy and data protection rules are prepared but secure backend storage and enforcement are not connected."
  };
}

export function evaluateDataStorage(input = {}) {
  const dataCategory = clean(input.dataCategory);
  const storageLayer = clean(input.storageLayer);

  if (!dataCategory || !storageLayer) {
    return {
      ok: false,
      status: "invalid",
      reason: "dataCategory and storageLayer are required."
    };
  }

  if (
    storageLayer === "frontend" &&
    PRIVACY_DATA_RULES.frontendStorageProhibited.includes(dataCategory)
  ) {
    return {
      ok: true,
      status: "blocked",
      allowed: false,
      dataCategory,
      storageLayer,
      reason: "Sensitive data must not be stored in the frontend."
    };
  }

  if (
    storageLayer === "browser_storage" &&
    PRIVACY_DATA_RULES.frontendStorageProhibited.includes(dataCategory)
  ) {
    return {
      ok: true,
      status: "blocked",
      allowed: false,
      dataCategory,
      storageLayer,
      reason: "Sensitive data must not be stored in browser storage."
    };
  }

  return {
    ok: true,
    status: "review_required",
    allowed: true,
    dataCategory,
    storageLayer,
    reason: "Storage is structurally allowed but must follow the configured backend privacy policy."
  };
}

export function sanitizePrivacyMetadata(input = {}) {
  const allowedKeys = [
    "requestId",
    "eventType",
    "targetId",
    "occurredAt"
  ];

  const output = {};

  for (const key of allowedKeys) {
    if (input[key] !== undefined && input[key] !== null) {
      output[key] = clean(input[key]);
    }
  }

  return {
    ok: true,
    status: "sanitized",
    metadata: output
  };
}
