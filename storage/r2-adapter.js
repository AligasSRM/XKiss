const VIDEO_PREFIX = "videos/";

function sanitizeFileName(fileName) {
  return String(fileName || "video")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-180);
}

export function isStorageReady(env) {
  return Boolean(env && env.XKISS_VIDEOS);
}

export function createVideoKey(fileName) {
  return VIDEO_PREFIX + crypto.randomUUID() + "-" + sanitizeFileName(fileName);
}

export async function storeVideo(env, key, body, metadata = {}) {
  if (!isStorageReady(env)) {
    return {
      ok: false,
      storageReady: false,
      status: "storage-not-ready"
    };
  }

  await env.XKISS_VIDEOS.put(key, body, {
    httpMetadata: {
      contentType: String(metadata.contentType || "application/octet-stream")
    },
    customMetadata: {
      originalFileName: String(metadata.fileName || "video")
    }
  });

  return {
    ok: true,
    storageReady: true,
    status: "stored",
    key
  };
}

export async function listVideos(env) {
  if (!isStorageReady(env)) {
    return {
      ok: true,
      storageReady: false,
      videos: []
    };
  }

  const listed = await env.XKISS_VIDEOS.list({
    prefix: VIDEO_PREFIX,
    limit: 1000
  });

  const videos = listed.objects.map(object => ({
    key: object.key,
    size: object.size,
    uploaded: object.uploaded ? object.uploaded.toISOString() : null,
    etag: object.etag || null
  }));

  return {
    ok: true,
    storageReady: true,
    videos
  };
}