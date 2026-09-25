import {
  createVideoKey,
  isStorageReady,
  listVideos,
  storeVideo
} from "./storage/r2-adapter.js";
import {
  MONETIZATION_RULES,
  CREATOR_ELIGIBILITY_RULES,
  evaluateCreatorEligibility,
  calculateRevenue,
  MONETIZATION_POLICY_RULES,
  evaluateMonetizationPolicy,
  CREATOR_ACTIVATION_RULES,
  evaluateCreatorActivation
} from "./monetization/monetization-rules.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://aligassrm.github.io",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-XKiss-Upload-Key, X-XKiss-File-Name, X-XKiss-Title, X-XKiss-Description, X-XKiss-Category, X-XKiss-Download-Policy, X-XKiss-Visibility",
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
    const storageReady = isStorageReady(env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    if (url.pathname === "/api/health") {
      return json({
        service: "XKiss Worker",
        status: "online",
        storageReady,
        uploadEndpoint: true
      });
    }

    if (url.pathname === "/api/monetization/status" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Monetization",
        enabled: MONETIZATION_RULES.enabled,
        status: MONETIZATION_RULES.status,
        version: MONETIZATION_RULES.version,
        model: MONETIZATION_RULES.model,
        message: MONETIZATION_RULES.enabled
          ? "Monetization is active."
          : "Monetization rules are prepared but not active."
      });
    }

    if (url.pathname === "/api/monetization/rules" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Monetization Rules",
        rules: MONETIZATION_RULES
      });
    }

    if (url.pathname === "/api/monetization/eligibility/rules" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Creator Eligibility",
        rules: CREATOR_ELIGIBILITY_RULES
      });
    }

    if (url.pathname === "/api/monetization/activation/rules" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Creator Monetization Activation",
        rules: CREATOR_ACTIVATION_RULES
      });
    }

    if (url.pathname === "/api/monetization/activation/evaluate" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid activation data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Creator Monetization Activation",
        result: evaluateCreatorActivation(body)
      });
    }

    if (url.pathname === "/api/monetization/policy/rules" && request.method === "GET") {
      return json({
        ok: true,
        service: "XKiss Monetization Policy",
        rules: MONETIZATION_POLICY_RULES
      });
    }

    if (url.pathname === "/api/monetization/policy/evaluate" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid policy evaluation data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Monetization Policy",
        result: evaluateMonetizationPolicy(body)
      });
    }

    if (url.pathname === "/api/monetization/revenue/calculate" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid revenue calculation data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Revenue Calculation",
        result: calculateRevenue(body)
      });
    }

    if (url.pathname === "/api/monetization/eligibility/evaluate" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          message: "Invalid eligibility data."
        }, 400);
      }

      return json({
        ok: true,
        service: "XKiss Creator Eligibility",
        result: evaluateCreatorEligibility(body)
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

      const key = createVideoKey(body.fileName);

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
          message: "Production video storage is not activated yet. The video was not uploaded."
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

      const key = createVideoKey(fileName);

      try {
        const stored = await storeVideo(env, key, request.body, {
          fileName,
          contentType,
          title: request.headers.get("X-XKiss-Title") || "",
          description: request.headers.get("X-XKiss-Description") || "",
          category: request.headers.get("X-XKiss-Category") || "",
          downloadPolicy: request.headers.get("X-XKiss-Download-Policy") || "disabled",
          visibility: request.headers.get("X-XKiss-Visibility") || "private"
        });

        return json({
          ...stored,
          message: "Video uploaded successfully."
        }, 201);
      } catch {
        return json({
          ok: false,
          storageReady: true,
          status: "failed",
          message: "Video storage failed."
        }, 500);
      }
    }

    if (url.pathname === "/api/creator/videos" && request.method === "GET") {
      try {
        const result = await listVideos(env);

        return json({
          ...result,
          message: storageReady
            ? "Creator library is connected."
            : "Creator library is ready. Production storage is not activated yet."
        });
      } catch {
        return json({
          ok: false,
          storageReady,
          videos: [],
          message: "Creator storage could not be read."
        }, 500);
      }
    }

    return json({
      service: "XKiss Worker",
      status: "online",
      path: url.pathname
    });
  }
};