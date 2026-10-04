import assert from "node:assert/strict";
import { getRekognitionStatus } from "../rekognition-moderation-provider.js";

const status = getRekognitionStatus();

assert.equal(status.ok, true);
assert.equal(status.provider, "amazon-rekognition");
assert.equal(status.region, process.env.AWS_REGION || "us-east-1");

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  assert.equal(status.configured, false);
  assert.equal(status.activationAllowed, false);
  console.log("XKiss Amazon Rekognition Self-Test — PASS (fail-closed: credentials absent)");
} else {
  assert.equal(status.configured, true);
  assert.equal(status.activationAllowed, true);
  console.log("XKiss Amazon Rekognition Self-Test — PASS (credentials configured)");
}
