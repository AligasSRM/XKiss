const VIDEO_PREFIX = "videos/";

import { AwsClient } from "aws4fetch";

function cleanEnvValue(value, fallback = "") {
  const raw = String(value ?? fallback).trim();
  return raw.replace(/^["']|["']$/g, "").trim();
}

function getConfig(env) {
  let endpoint = cleanEnvValue(
    env?.XKISS_B2_ENDPOINT,
    "https://s3.eu-central-003.backblazeb2.com"
  );

  if (endpoint && !/^https?:\/\//i.test(endpoint)) {
    endpoint = "https://" + endpoint;
  }

  endpoint = endpoint.replace(/\/$/, "");

  return {
    endpoint,
    bucket: cleanEnvValue(env?.XKISS_B2_BUCKET, "xkiss-videos"),
    region: cleanEnvValue(env?.XKISS_B2_REGION, "eu-central-003"),
    accessKey: cleanEnvValue(env?.XKISS_B2_ACCESS_KEY),
    secretKey: cleanEnvValue(env?.XKISS_B2_SECRET_KEY)
  };
}

export function isStorageReady(env) {
  const c = getConfig(env);
  return Boolean(
    c.endpoint &&
    c.bucket &&
    c.region &&
    c.accessKey &&
    c.secretKey
  );
}

function sanitizeFileName(fileName) {
  return String(fileName || "video")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-180);
}

export function createVideoKey(fileName) {
  return VIDEO_PREFIX + crypto.randomUUID() + "-" + sanitizeFileName(fileName);
}

function encodeObjectKey(key) {
  return String(key || "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function signedRequest(env, method, key = "", body = null, extraHeaders = {}) {
  const c = getConfig(env);

  if (!isStorageReady(env)) {
    throw new Error("Backblaze B2 storage credentials are not configured.");
  }

  const endpointUrl = new URL(c.endpoint);
  const virtualHost = c.bucket + "." + endpointUrl.hostname;
  const path = key ? "/" + encodeObjectKey(key) : "/";
  const url = endpointUrl.protocol + "//" + virtualHost + path;

  const headers = new Headers(extraHeaders);

  if (!headers.has("content-type") && body != null) {
    headers.set("content-type", "application/octet-stream");
  }

  // Backblaze B2 S3-compatible API uses SigV4.
  // Keep signing aligned with Backblaze's Cloudflare Worker example:
  // virtual-hosted endpoint + aws4fetch signing + native fetch.
  const client = new AwsClient({
    accessKeyId: c.accessKey,
    secretAccessKey: c.secretKey,
    service: "s3",
    region: c.region
  });

  const signed = await client.sign(url, {
    method,
    headers,
    body
  });

  return fetch(signed);
}

async function throwStorageError(action, response) {
  if (response.ok) return;

  const detail = await response.text().catch(() => "");
  throw new Error(
    "Backblaze B2 " +
      action +
      " failed (" +
      response.status +
      "): " +
      detail.slice(0, 500)
  );
}

export async function storeJsonObject(env, key, value) {
  if (!isStorageReady(env)) {
    return { ok: false, storageReady: false, status: "storage-not-ready" };
  }

  const response = await signedRequest(
    env,
    "PUT",
    key,
    JSON.stringify(value),
    { "content-type": "application/json; charset=UTF-8" }
  );

  await throwStorageError("JSON object store", response);

  return {
    ok: true,
    storageReady: true,
    status: "stored",
    key,
    storage: "Backblaze B2"
  };
}

export async function getJsonObject(env, key) {
  if (!isStorageReady(env)) {
    return {
      ok: false,
      storageReady: false,
      status: "storage-not-ready",
      value: null
    };
  }

  const response = await signedRequest(env, "GET", key);

  if (response.status === 404) {
    return {
      ok: true,
      storageReady: true,
      status: "not-found",
      value: null
    };
  }

  await throwStorageError("JSON object read", response);

  const value = await response.json();

  return {
    ok: true,
    storageReady: true,
    status: "found",
    value
  };
}

export async function deleteJsonObject(env, key) {
  if (!isStorageReady(env)) {
    return { ok: false, storageReady: false, status: "storage-not-ready" };
  }

  const response = await signedRequest(env, "DELETE", key);

  if (!response.ok && response.status !== 404) {
    await throwStorageError("JSON object delete", response);
  }

  return {
    ok: true,
    storageReady: true,
    status: response.status === 404 ? "not-found" : "deleted",
    key,
    storage: "Backblaze B2"
  };
}

export async function storeVideo(env, key, body, metadata = {}) {
  if (!isStorageReady(env)) {
    return { ok: false, storageReady: false, status: "storage-not-ready" };
  }

  const headers = {
    "content-type": String(metadata.contentType || "application/octet-stream"),
    "x-amz-meta-originalfilename": String(metadata.fileName || "video"),
    "x-amz-meta-title": String(metadata.title || ""),
    "x-amz-meta-description": String(metadata.description || ""),
    "x-amz-meta-category": String(metadata.category || ""),
    "x-amz-meta-downloadpolicy": String(
      metadata.downloadPolicy || "disabled"
    ),
    "x-amz-meta-visibility": String(metadata.visibility || "private"),
    "x-amz-meta-status": "Ready"
  };

  const response = await signedRequest(env, "PUT", key, body, headers);

  await throwStorageError("upload", response);

  return {
    ok: true,
    storageReady: true,
    status: "stored",
    key,
    storage: "Backblaze B2"
  };
}

function xmlTag(xml, tag) {
  const match = xml.match(
    new RegExp("<" + tag + ">([\\s\\S]*?)</" + tag + ">")
  );
  return match ? match[1] : "";
}

export async function listVideos(env) {
  if (!isStorageReady(env)) {
    return { ok: true, storageReady: false, videos: [] };
  }

  const response = await signedRequest(env, "GET");

  await throwStorageError("list", response);

  const xml = await response.text();
  const blocks = xml.match(/<Contents>[\s\S]*?<\/Contents>/g) || [];

  const videos = blocks
    .map((block) => {
      const key = xmlTag(block, "Key");

      if (!key || !key.startsWith(VIDEO_PREFIX)) return null;

      return {
        key,
        size: Number(xmlTag(block, "Size") || 0),
        uploaded: xmlTag(block, "LastModified") || null,
        etag: xmlTag(block, "ETag") || null,
        title: key.split("/").pop() || "Untitled video",
        description: "",
        category: "Uncategorized",
        downloadPolicy: "disabled",
        visibility: "private",
        status: "Ready",
        storage: "Backblaze B2"
      };
    })
    .filter(Boolean);

  return {
    ok: true,
    storageReady: true,
    videos
  };
}
