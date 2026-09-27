import worker from "../../worker.js";

function decodeBase64(value) {
  const binary = Buffer.from(value, "base64");
  return new Uint8Array(binary);
}

function buildRequest(event) {
  const headers = new Headers(event.headers || {});
  let body = null;

  if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD" && event.body != null) {
    body = event.isBase64Encoded ? decodeBase64(event.body) : event.body;
  }

  const url = event.rawUrl || `https://netlify.local${event.path || "/"}`;

  return new Request(url, {
    method: event.httpMethod || "GET",
    headers,
    body
  });
}

function responseToNetlify(response) {
  return response.arrayBuffer().then(buffer => ({
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: Buffer.from(buffer).toString("base64"),
    isBase64Encoded: true
  }));
}

export default async function handler(event) {
  try {
    const request = buildRequest(event);
    const response = await worker.fetch(request, process.env);
    return responseToNetlify(response);
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json; charset=UTF-8" },
      body: JSON.stringify({
        ok: false,
        message: "XKiss Netlify backend error."
      })
    };
  }
}
