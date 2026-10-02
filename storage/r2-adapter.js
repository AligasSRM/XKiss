const VIDEO_PREFIX = "videos/";

function sanitizeFileName(fileName) {
  return String(fileName || "video")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-180);
}

function cleanEnvValue(value, fallback = "") {
  const raw = String(value ?? fallback).trim();
  return raw.replace(/^["']|["']$/g, "").trim();
}

function getConfig(env) {
  let endpoint = cleanEnvValue(env?.XKISS_B2_ENDPOINT, "https://s3.eu-central-003.backblazeb2.com");
  if (endpoint && !/^https?:\/\//i.test(endpoint)) endpoint = "https://" + endpoint;
  endpoint = endpoint.replace(/\/$/, "");
  const bucket = cleanEnvValue(env?.XKISS_B2_BUCKET, "xkiss-videos");
  const region = cleanEnvValue(env?.XKISS_B2_REGION, "eu-central-003");
  const accessKey = cleanEnvValue(env?.XKISS_B2_ACCESS_KEY);
  const secretKey = cleanEnvValue(env?.XKISS_B2_SECRET_KEY);
  return { endpoint, bucket, region, accessKey, secretKey };
}

export function isStorageReady(env) {
  const c = getConfig(env);
  return Boolean(c.endpoint && c.bucket && c.region && c.accessKey && c.secretKey);
}

function encodePath(path) {
  return path.split("/").map(segment => encodeURIComponent(segment)).join("/");
}

export function createVideoKey(fileName) {
  return VIDEO_PREFIX + crypto.randomUUID() + "-" + sanitizeFileName(fileName);
}

import { AwsClient } from "aws4fetch";

async function signedRequest(env, method, key = "", body = null, extraHeaders = {}) {
  const c = getConfig(env);
  if (!isStorageReady(env)) throw new Error("Backblaze B2 storage credentials are not configured.");

  const endpointUrl = new URL(c.endpoint);
  const host = endpointUrl.hostname;
  const virtualHost = c.bucket + "." + host;
  const path = key ? "/" + key.split("/").map(encodeURIComponent).join("/") : "/";
  const url = endpointUrl.protocol + "//" + virtualHost + path;
  const headers = new Headers(extraHeaders);
  if (!headers.has("content-type") && body != null) headers.set("content-type", "application/octet-stream");

  // Backblaze B2 exposes an S3-compatible endpoint and uses SigV4.
  const client = new AwsClient({
    accessKeyId: c.accessKey,
    secretAccessKey: c.secretKey,
    region: c.region,
    service: "s3"
  });

  return client.fetch(url, { method, headers, body, aws: { singleEncode: true } });
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

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Backblaze B2 JSON object store failed (" + response.status + "): " + detail.slice(0, 500));
  }

  return { ok: true, storageReady: true, status: "stored", key, storage: "Backblaze B2" };
}

export async function deleteJsonObject(env, key) {
  if (!isStorageReady(env)) {
    return { ok: false, storageReady: false, status: "storage-not-ready" };
  }

  const response = await signedRequest(env, "DELETE", key);

  if (!response.ok && response.status !== 404) {
    const detail = await response.text().catch(() => "");
    throw new Error("Backblaze B2 JSON object delete failed (" + response.status + "): " + detail.slice(0, 500));
  }

  return {
    ok: true,
    storageReady: true,
    status: response.status === 404 ? "not-found" : "deleted",
    key,
    storage: "Backblaze B2"
  };
}

export async function getJsonObject(env, key) {
  if (!isStorageReady(env)) {
    return { ok: false, storageReady: false, status: "storage-not-ready", value: null };
  }

  const response = await signedRequest(env, "GET", key);

  if (response.status === 404) {
    return { ok: true, storageReady: true, status: "not-found", value: null };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Backblaze B2 JSON object read failed (" + response.status + "): " + detail.slice(0, 500));
  }

  const value = await response.json();
  return { ok: true, storageReady: true, status: "found", value };
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
    "x-amz-meta-downloadpolicy": String(metadata.downloadPolicy || "disabled"),
    "x-amz-meta-visibility": String(metadata.visibility || "private"),
    "x-amz-meta-status": "Ready"
  };

  const response = await signedRequest(env, "PUT", key, body, headers);

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Backblaze B2 upload failed (" + response.status + "): " + detail.slice(0, 500));
  }

  return {
    ok: true,
    storageReady: true,
    status: "stored",
    key,
    storage: "Backblaze B2"
  };
}

function xmlTag(xml, tag) {
  const match = xml.match(new RegExp("<" + tag + ">([\\s\\S]*?)</" + tag + ">"));
  return match ? match[1] : "";
}

export async function listVideos(env) {
  if (!isStorageReady(env)) {
    return { ok: true, storageReady: false, videos: [] };
  }

  const response = await signedRequest(env, "GET");
  if (!response.ok) {
    throw new Error("Backblaze B2 list failed (" + response.status + ").");
  }

  const xml = await response.text();
  const blocks = xml.match(/<Contents>[\\s\\S]*?<\/Contents>/g) || [];
  const videos = blocks
    .map(block => {
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

  return { ok: true, storageReady: true, videos };
}