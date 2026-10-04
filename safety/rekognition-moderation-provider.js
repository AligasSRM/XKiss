import { AwsClient } from "aws4fetch";

const REGION = String(process.env.AWS_REGION || "us-east-1").trim();
const ENDPOINT = `https://rekognition.${REGION}.amazonaws.com/`;
const TARGET = "RekognitionService.DetectModerationLabels";

function clean(value) {
  return String(value ?? "").trim();
}

function requireConfig() {
  const accessKeyId = clean(process.env.AWS_ACCESS_KEY_ID);
  const secretAccessKey = clean(process.env.AWS_SECRET_ACCESS_KEY);
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS Rekognition credentials are not configured.");
  }
  return { accessKeyId, secretAccessKey };
}

function toBytes(input) {
  if (input?.bytes instanceof Uint8Array) return input.bytes;
  if (input?.base64) return Uint8Array.from(Buffer.from(input.base64, "base64"));
  throw new Error("image bytes are required as Uint8Array or base64.");
}

export async function detectModerationLabels(input = {}) {
  const bytes = toBytes(input.image);
  if (!bytes.byteLength) throw new Error("image must not be empty.");
  if (bytes.byteLength > 5242880) throw new Error("image exceeds Rekognition byte limit.");

  const { accessKeyId, secretAccessKey } = requireConfig();
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    sessionToken: clean(process.env.AWS_SESSION_TOKEN) || undefined,
    service: "rekognition",
    region: REGION
  });

  const response = await client.fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/x-amz-json-1.1",
      "x-amz-target": TARGET
    },
    body: JSON.stringify({
      Image: { Bytes: Buffer.from(bytes).toString("base64") },
      MinConfidence: Number.isFinite(Number(input.minConfidence))
        ? Number(input.minConfidence)
        : 75
    })
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(payload?.message || `AWS Rekognition request failed: HTTP ${response.status}`);
    error.code = payload?.__type || `HTTP_${response.status}`;
    error.status = response.status;
    throw error;
  }

  return {
    ok: true,
    provider: "amazon-rekognition",
    region: REGION,
    moderationLabels: Array.isArray(payload?.ModerationLabels) ? payload.ModerationLabels : [],
    moderationModelVersion: payload?.ModerationModelVersion || null,
    contentTypes: Array.isArray(payload?.ContentTypes) ? payload.ContentTypes : []
  };
}

export function getRekognitionStatus() {
  const configured = Boolean(
    clean(process.env.AWS_ACCESS_KEY_ID) &&
    clean(process.env.AWS_SECRET_ACCESS_KEY)
  );
  return {
    ok: true,
    provider: "amazon-rekognition",
    configured,
    region: REGION,
    activationAllowed: configured,
    reason: configured
      ? "Amazon Rekognition credentials are configured."
      : "Amazon Rekognition is not configured; moderation must remain fail-closed."
  };
}
