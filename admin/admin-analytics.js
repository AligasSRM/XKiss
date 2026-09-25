import { ADMIN_DASHBOARD_RULES } from "./admin-rules.js";

export const ADMIN_ANALYTICS_RULES = {
  version: "1.0-draft",
  status: "prepared",
  enabled: false,

  metrics: [
    "users",
    "active_users",
    "creators",
    "videos",
    "published_videos",
    "live_rooms",
    "views",
    "watch_time",
    "reports",
    "revenue"
  ],

  timeRanges: [
    "24h",
    "7d",
    "30d",
    "90d",
    "1y",
    "custom"
  ],

  aggregationTypes: [
    "count",
    "sum",
    "average",
    "rate",
    "trend"
  ],

  sensitiveMetrics: [
    "revenue",
    "user_activity",
    "creator_earnings"
  ],

  authenticationRequired: true,
  permissionRequired: true,
  privacyProtectionRequired: true,
  serverSideAggregationRequired: true,
  auditTrailRequired: true,
  frontendCannotInventMetrics: true,

  analyticsProvider: null,
  analyticsStorage: null,
  activationRequiresBackend: true
};

function clean(value) {
  return String(value || "").trim();
}

export function getAdminAnalyticsStatus() {
  return {
    ok: true,
    status: ADMIN_ANALYTICS_RULES.status,
    enabled: ADMIN_ANALYTICS_RULES.enabled,
    analyticsProviderConnected: Boolean(ADMIN_ANALYTICS_RULES.analyticsProvider),
    analyticsStorageConnected: Boolean(ADMIN_ANALYTICS_RULES.analyticsStorage),
    reason: "Admin analytics is prepared but the secure backend analytics provider and data storage are not connected."
  };
}

export function validateAnalyticsMetric(metric) {
  const value = clean(metric);

  if (!ADMIN_ANALYTICS_RULES.metrics.includes(value)) {
    return {
      ok: false,
      status: "invalid_metric",
      reason: "Unsupported analytics metric."
    };
  }

  return {
    ok: true,
    status: "valid",
    metric: value,
    sensitive: ADMIN_ANALYTICS_RULES.sensitiveMetrics.includes(value)
  };
}

export function validateAnalyticsTimeRange(range) {
  const value = clean(range);

  if (!ADMIN_ANALYTICS_RULES.timeRanges.includes(value)) {
    return {
      ok: false,
      status: "invalid_range",
      reason: "Unsupported analytics time range."
    };
  }

  return {
    ok: true,
    status: "valid",
    timeRange: value
  };
}

export function createAnalyticsQuery(input = {}) {
  const metric = clean(input.metric);
  const timeRange = clean(input.timeRange);

  const metricCheck = validateAnalyticsMetric(metric);
  if (!metricCheck.ok) {
    return metricCheck;
  }

  const rangeCheck = validateAnalyticsTimeRange(timeRange);
  if (!rangeCheck.ok) {
    return rangeCheck;
  }

  if (!ADMIN_ANALYTICS_RULES.enabled) {
    return {
      ok: true,
      status: "not_enabled",
      executable: false,
      metric,
      timeRange,
      sensitive: metricCheck.sensitive,
      reason: "Analytics queries are not active until secure backend analytics access is connected."
    };
  }

  return {
    ok: true,
    status: "permission_required",
    executable: false,
    metric,
    timeRange,
    sensitive: metricCheck.sensitive,
    reason: "The backend must authorize and execute the analytics query."
  };
}
