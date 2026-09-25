const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://aligassrm.github.io",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-XKiss-Upload-Key",
  "Vary": "Origin"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      ...CORS_HEADERS
    }
  });
}

function storageKey(fileName) {
  const safeName = String(fileName || "video")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-180);

  const id = crypto.randomUUID();

  return "videos/" + id + "-" + safeName;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    const storageReady = Boolean(env.XKISS_VIDEOS);

    if (url.pathname === "/api/health") {
      return json({
        service: "XKiss Worker",
        status: "online",
        storageReady,
        uploadEndpoint: true
      });
    }

    if (url.pathname === "/api/upload/status" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Upload",
        storageReady,
        uploadEndpoint: true,
        message: storageReady
          ? "Production video storage is connected."
          : "Production video storage is not activated yet."
      });
    }

    if (url.pathname === "/api/upload/prepare" && request.method === "POST") {
      if (!storageReady) {
        return json({
          ok: false,
          storageReady: false,
          message: "Production storage is not activated yet. The video was not uploaded."
        }, 503);
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid upload metadata."
        }, 400);
      }

      if (!body.fileName || !body.contentType || !body.title) {
        return json({
          ok: false,
          message: "fileName, contentType and title are required."
        }, 400);
      }

      const key = storageKey(body.fileName);

      return json({
        ok: true,
        storageReady: true,
        uploadReady: Boolean(env.XKISS_UPLOAD_KEY),
        key,
        fileName: String(body.fileName),
        contentType: String(body.contentType),
        message: env.XKISS_UPLOAD_KEY
          ? "Upload preparation is ready for the connected storage layer."
          : "Storage is connected, but upload authorization is not configured yet."
      });
    }

    if (url.pathname === "/api/upload" && request.method === "POST") {
      if (!storageReady) {
        return json({
          ok: false,
          storageReady: false,
          message: "Production storage is not activated yet. The video was not uploaded."
        }, 503);
      }

      if (!env.XKISS_UPLOAD_KEY) {
        return json({
          ok: false,
          storageReady: true,
          message: "Upload authorization is not configured yet."
        }, 503);
      }

      const suppliedKey = request.headers.get("X-XKiss-Upload-Key");

      if (!suppliedKey || suppliedKey !== env.XKISS_UPLOAD_KEY) {
        return json({
          ok: false,
          message: "Upload authorization failed."
        }, 401);
      }

      const fileName = request.headers.get("X-XKiss-File-Name");
      const contentType = request.headers.get("Content-Type") || "application/octet-stream";

      if (!fileName) {
        return json({
          ok: false,
          message: "X-XKiss-File-Name is required."
        }, 400);
      }

      if (!contentType.startsWith("video/")) {
        return json({
          ok: false,
          message: "Only video content is accepted."
        }, 415);
      }

      if (!request.body) {
        return json({
          ok: false,
          message: "Video request body is empty."
        }, 400);
      }

      const key = storageKey(fileName);

      try {
        await env.XKISS_VIDEOS.put(key, request.body, {
          httpMetadata: {
            contentType
          },
          customMetadata: {
            originalFileName: String(fileName)
          }
        });

        return json({
          ok: true,
          storageReady: true,
          status: "stored",
          key,
          message: "Video uploaded successfully."
        }, 201);
      } catch (error) {
        return json({
          ok: false,
          storageReady: true,
          status: "failed",
          message: "Video storage failed."
        }, 500);
      }
    }

    if (url.pathname === "/api/creator/videos" && request.method === "GET") {
      return json({
        ok: true,
        storageReady,
        videos: [],
        message: storageReady
          ? "Creator library is connected and currently empty."
          : "Creator library is ready. Production storage is not activated yet."
      });
    }

    return json({
      service: "XKiss Worker",
      status: "online",
      path: url.pathname
    });
  }
};
