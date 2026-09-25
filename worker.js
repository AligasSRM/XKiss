const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://aligassrm.github.io",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const storageReady = Boolean(env.XKISS_VIDEOS);

    if (url.pathname === "/api/health") {
      return json({
        service: "XKiss Worker",
        status: "online",
        storageReady
      });
    }

    if (url.pathname === "/api/upload/status" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Upload",
        storageReady,
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
        return json({ ok: false, message: "Invalid upload metadata." }, 400);
      }

      if (!body.fileName || !body.contentType || !body.title) {
        return json({
          ok: false,
          message: "fileName, contentType and title are required."
        }, 400);
      }

      return json({
        ok: true,
        storageReady: true,
        message: "Upload preparation is ready for the connected storage layer.",
        fileName: String(body.fileName),
        contentType: String(body.contentType)
      });
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
