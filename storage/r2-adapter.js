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
  let endpoint = cleanEnvValue(env?.XKISS_IDRIVE_ENDPOINT, "https://s3.eu-west-1.idrivee2.com");
  if (endpoint && !/^https?:\/\//i.test(endpoint)) endpoint = "https://" + endpoint;
  endpoint = endpoint.replace(/\/$/, "");
  const bucket = cleanEnvValue(env?.XKISS_IDRIVE_BUCKET, "xkissvideos");
  const region = cleanEnvValue(env?.XKISS_IDRIVE_REGION, "eu-west-1");
  const accessKey = cleanEnvValue(env?.XKISS_IDRIVE_ACCESS_KEY);
  const secretKey = cleanEnvValue(env?.XKISS_IDRIVE_SECRET_KEY);
  return { endpoint, bucket, region, accessKey, secretKey };
}

export function isStorageReady(env) {
  const c = getConfig(env);
  return Boolean(c.endpoint && c.bucket && c.region && c.accessKey && c.secretKey);
}

export function createVideoKey(fileName) {
  return VIDEO_PREFIX + crypto.randomUUID() + "-" + sanitizeFileName(fileName);
}

async function sha256Hex(value) {
  const bytes = value instanceof ArrayBuffer ? value : new TextEncoder().encode(String(value));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(key, data) {
  return crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ),
    new TextEncoder().encode(data)
  );
}

function toBytes(value) {
  return value instanceof ArrayBuffer ? value : new TextEncoder().encode(String(value));
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function signingKey(secret, date, region, service) {
  const kDate = await hmac(toBytes("AWS4" + secret), date);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function amzDateParts(date = new Date()) {
  const iso = date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return { amzDate: iso, date: iso.slice(0, 8) };
}

function encodePath(path) {
  return path.split("/").map(segment => encodeURIComponent(segment).replace(/%3A/gi, ":")).join("/");
}

async function signedRequest(env, method, key = "", body = null, extraHeaders = {}) {
  const c = getConfig(env);
  if (!isStorageReady(env)) throw new Error("IDrive e2 storage credentials are not configured.");

  const { amzDate, date } = amzDateParts();
  const service = "s3";
  const path = "/" + encodePath(c.bucket) + (key ? "/" + encodePath(key) : "");
  const url = c.endpoint + path;

  const payloadHash = await sha256Hex(body == null ? "" : body);
  const headers = {
    host: new URL(c.endpoint).host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...extraHeaders
  };

  const signedHeaderNames = Object.keys(headers)
    .map(k => k.toLowerCase())
    .sort();

  const canonicalHeaders = signedHeaderNames
    .map(k => k + ":" + String(headers[k]).trim().replace(/\s+/g, " ") + "\n")
    .join("");

  const canonicalRequest = [
    method,
    path,
    "",
    canonicalHeaders,
    signedHeaderNames.join(";"),
    payloadHash
  ].join("\n");

  const credentialScope = date + "/" + c.region + "/" + service + "/aws4_request";
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest)
  ].join("\n");

  const keyBytes = await signingKey(c.secretKey, date, c.region, service);
  const signature = hex(await hmac(keyBytes, stringToSign));

  const authorization =
    "AWS4-HMAC-SHA256 Credential=" + c.accessKey + "/" + credentialScope +
    ", SignedHeaders=" + signedHeaderNames.join(";") +
    ", Signature=" + signature;

  const requestHeaders = new Headers();
  Object.entries(headers).forEach(([k, v]) => requestHeaders.set(k, v));
  requestHeaders.set("Authorization", authorization);

  return fetch(url, {
    method,
    headers: requestHeaders,
    body
  });
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
    throw new Error("IDrive e2 JSON object store failed (" + response.status + "): " + detail.slice(0, 500));
  }

  return { ok: true, storageReady: true, status: "stored", key, storage: "IDrive e2" };
}

export async function deleteJsonObject(env, key) {
  if (!isStorageReady(env)) {
    return { ok: false, storageReady: false, status: "storage-not-ready" };
  }

  const response = await signedRequest(env, "DELETE", key);

  if (!response.ok && response.status !== 404) {
    const detail = await response.text().catch(() => "");
    throw new Error("IDrive e2 JSON object delete failed (" + response.status + "): " + detail.slice(0, 500));
  }

  return {
    ok: true,
    storageReady: true,
    status: response.status === 404 ? "not-found" : "deleted",
    key,
    storage: "IDrive e2"
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
    throw new Error("IDrive e2 JSON object read failed (" + response.status + "): " + detail.slice(0, 500));
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
    throw new Error("IDrive e2 upload failed (" + response.status + "): " + detail.slice(0, 500));
  }

  return {
    ok: true,
    storageReady: true,
    status: "stored",
    key,
    storage: "IDrive e2"
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
    throw new Error("IDrive e2 list failed (" + response.status + ").");
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
        storage: "IDrive e2"
      };
    })
    .filter(Boolean);

  return { ok: true, storageReady: true, videos };
}