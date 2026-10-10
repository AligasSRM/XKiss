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

export const CREATOR_VIDEO_OWNERSHIP_SECURITY = Object.freeze({
  creatorIdServerDerived: true,
  listAlwaysFilteredByCreatorId: true,
  clientCannotChooseOwner: true,
  removedVideosExcluded: true,
  storageObjectKeyExposedToClient: false,
  failClosed: true
});
