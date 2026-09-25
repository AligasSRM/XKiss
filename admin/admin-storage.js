import { ADMIN_DASHBOARD_RULES } from "./admin-rules.js";

export const ADMIN_STORAGE_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  storageStates: [
    "available",
    "degraded",
    "offline",
    "maintenance"
  ],

  resourceTypes: [
    "video",
    "thumbnail",
    "creator_asset",
    "user_asset",
    "backup",
    "system_asset"
  ],

  metrics: [
    "total_storage",
    "used_storage",
    "available_storage",
    "object_count",
    "upload_count",
    "failed_uploads"
  ],

  supportedActions: [
    "view",
    "inspect",
    "verify",
    "cleanup"
  ],

  protectedOperations: [
    "cleanup",
    "delete",
    "restore"
  ],

  authenticationRequired: true,
  permissionRequired: true,
  backendStorageRequired: true,
  auditTrailRequired: true,
  frontendCannotDeleteStorage: true,
  frontendCannotExposeStorageSecrets: true,

  storageProvider: null,
  storageMetadataStore: null,
  auditStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getAdminStorageStatus() {
  return {
    ok: true,
    status: ADMIN_STORAGE_RULES.status,
    enabled: ADMIN_STORAGE_RULES.enabled,
    storageProviderConnected: Boolean(ADMIN_STORAGE_RULES.storageProvider),
    metadataStoreConnected: Boolean(ADMIN_STORAGE_RULES.storageMetadataStore),
    auditStorageConnected: Boolean(ADMIN_STORAGE_RULES.auditStorage),
    reason: "Admin storage management is prepared but the production storage provider and secure backend metadata services are not connected."
  };
}

export function validateStorageAction(input = {}) {
  const action = clean(input.action);

  if (!action) {
    return {
      ok: false,
      status: "invalid",
      reason: "Storage action is required."
    };
  }

  if (!ADMIN_STORAGE_RULES.supportedActions.includes(action)) {
    return {
      ok: false,
      status: "invalid_action",
      reason: "Unsupported storage management action."
    };
  }

  if (!ADMIN_STORAGE_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      allowed: false,
      action,
      reason: "Storage management is not active until secure backend storage services are connected."
    };
  }

  return {
    ok: true,
    status: "permission_required",
    allowed: false,
    action,
    reason: "The backend must authorize, execute and audit this storage action."
  };
}

export function validateStorageState(state) {
  const value = clean(state);

  if (!ADMIN_STORAGE_RULES.storageStates.includes(value)) {
    return {
      ok: false,
      status: "invalid_state",
      reason: "Unsupported storage state."
    };
  }

  return {
    ok: true,
    status: "valid",
    storageState: value
  };
}

export function validateResourceType(resourceType) {
  const value = clean(resourceType);

  if (!ADMIN_STORAGE_RULES.resourceTypes.includes(value)) {
    return {
      ok: false,
      status: "invalid_resource_type",
      reason: "Unsupported storage resource type."
    };
  }

  return {
    ok: true,
    status: "valid",
    resourceType: value
  };
}

export function validateStorageMetric(metric) {
  const value = clean(metric);

  if (!ADMIN_STORAGE_RULES.metrics.includes(value)) {
    return {
      ok: false,
      status: "invalid_metric",
      reason: "Unsupported storage metric."
    };
  }

  return {
    ok: true,
    status: "valid",
    metric: value
  };
}
