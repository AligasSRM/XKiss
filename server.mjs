import { createServer } from "node:http";
import { Readable } from "node:stream";
import worker from "./worker.js";

const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";
const env = process.env;

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) headers.append(key, item);
      } else if (value !== undefined) {
        headers.set(key, value);
      }
    }

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const request = new Request(url, {
      method: req.method,
      headers,
      body: hasBody ? Readable.toWeb(req) : undefined,
      duplex: hasBody ? "half" : undefined
    });

    const response = await worker.fetch(request, env);

    res.statusCode = response.status;

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (!response.body) {
      res.end();
      return;
    }

    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error("XKiss server error:", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json; charset=UTF-8");
    }
    res.end(JSON.stringify({
      ok: false,
      service: "XKiss Node Server",
      message: "Internal server error."
    }));
  }
});

server.listen(port, host, () => {
  console.log(`XKiss server running on http://${host}:${port}`);
});