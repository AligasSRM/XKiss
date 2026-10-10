function publicVideo(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    category: row.category,
    contentType: row.content_type,
    sizeBytes: Number(row.size_bytes),
    visibility: row.visibility,
    downloadPolicy: row.download_policy,
    status: row.status,
    storage: "ElasticLake",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listCreatorVideosForCreator(env, creatorId) {
  if (!env?.XKISS_AUTH_DB) {
    return { ok: false, status: "backend_not_configured", videos: [] };
  }

  const trustedCreatorId = String(creatorId ?? "").trim();
  if (!trustedCreatorId) {
    return { ok: false, status: "invalid_creator", videos: [] };
  }

  const result = await env.XKISS_AUTH_DB.prepare(
    "SELECT id,creator_id,object_key,title,description,category,content_type,size_bytes,visibility,download_policy,status,created_at,updated_at FROM creator_videos WHERE creator_id=?1 AND status <> 'removed' ORDER BY created_at DESC"
  ).bind(trustedCreatorId).all();

  const rows = Array.isArray(result?.results) ? result.results : [];
  return {
    ok: true,
    status: "found",
    videos: rows.map(publicVideo)
  };
}

const VIDEO_TITLE_MAX = 120;
const VIDEO_DESCRIPTION_MAX = 2000;
const VIDEO_SIZE_MAX = 2 * 1024 * 1024 * 1024;
const ALLOWED_DECLARED_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);

export async function createCreatorVideoDraft(env, creatorId, input = {}) {
  if (!env?.XKISS_AUTH_DB) {
    return { ok: false, status: "backend_not_configured", video: null };
  }
  const trustedCreatorId = String(creatorId ?? "").trim();
  if (!trustedCreatorId) return { ok: false, status: "invalid_creator", video: null };

  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim();
  const category = String(input.category ?? "").trim().toLowerCase();
  const contentType = String(input.contentType ?? "").trim().toLowerCase();
  const sizeBytes = Number(input.sizeBytes);

  if (!title || title.length > VIDEO_TITLE_MAX || /[\u0000-\u001F\u007F]/.test(title)) {
    return { ok: false, status: "invalid_title", video: null };
  }
  if (description.length > VIDEO_DESCRIPTION_MAX || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(description)) {
    return { ok: false, status: "invalid_description", video: null };
  }
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(category)) {
    return { ok: false, status: "invalid_category", video: null };
  }
  if (!ALLOWED_DECLARED_TYPES.has(contentType)) {
    return { ok: false, status: "unsupported_content_type", video: null };
  }
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > VIDEO_SIZE_MAX) {
    return { ok: false, status: "invalid_size", video: null };
  }

  // Draft creation records intent only. It never stores a media object or enables uploads.
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const row = {
    id,
    creator_id: trustedCreatorId,
    object_key: "pending/" + trustedCreatorId + "/" + id,
    title,
    description,
    category,
    content_type: contentType,
    size_bytes: sizeBytes,
    visibility: "private",
    download_policy: "disabled",
    status: "pending_upload",
    created_at: now,
    updated_at: now
  };

  await env.XKISS_AUTH_DB.prepare(
    "INSERT INTO creator_videos (id,creator_id,object_key,title,description,category,content_type,size_bytes,visibility,download_policy,status,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,'private','disabled','pending_upload',?9,?9)"
  ).bind(
    row.id, row.creator_id, row.object_key, row.title, row.description,
    row.category, row.content_type, row.size_bytes, now
  ).run();

  return {
    ok: true,
    status: "draft_created",
    uploadEnabled: false,
    video: publicVideo(row)
  };
}

export const CREATOR_VIDEO_OWNERSHIP_SECURITY = Object.freeze({
  creatorIdServerDerived: true,
  listAlwaysFilteredByCreatorId: true,
  clientCannotChooseOwner: true,
  removedVideosExcluded: true,
  storageObjectKeyExposedToClient: false,
  failClosed: true
});
