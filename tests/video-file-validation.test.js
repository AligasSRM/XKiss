import test from "node:test";
import assert from "node:assert/strict";
import {
  validateVideoFileBytes,
  VIDEO_FILE_VALIDATION_SECURITY
} from "../creator/video-file-validation.js";

function mp4Bytes() {
  return new Uint8Array([
    0x00, 0x00, 0x00, 0x18,
    0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6f, 0x6d
  ]);
}

function quickTimeBytes() {
  return new Uint8Array([
    0x00, 0x00, 0x00, 0x18,
    0x66, 0x74, 0x79, 0x70,
    0x71, 0x74, 0x20, 0x20
  ]);
}

function webmBytes() {
  return new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]);
}

test("accepts an MP4 file when its bytes and declared type agree", () => {
  const bytes = mp4Bytes();
  const result = validateVideoFileBytes({
    bytes,
    declaredContentType: "video/mp4",
    expectedSizeBytes: bytes.byteLength
  });
  assert.equal(result.ok, true);
  assert.equal(result.detectedContentType, "video/mp4");
  assert.equal(result.validationScope, "container-signature-only");
});

test("accepts QuickTime and WebM container signatures", () => {
  for (const [bytes, declaredContentType] of [
    [quickTimeBytes(), "video/quicktime"],
    [webmBytes(), "video/webm"]
  ]) {
    const result = validateVideoFileBytes({
      bytes,
      declaredContentType,
      expectedSizeBytes: bytes.byteLength
    });
    assert.equal(result.ok, true);
    assert.equal(result.detectedContentType, declaredContentType);
  }
});

test("rejects a spoofed MIME type when bytes identify a different container", () => {
  const bytes = mp4Bytes();
  const result = validateVideoFileBytes({
    bytes,
    declaredContentType: "video/webm",
    expectedSizeBytes: bytes.byteLength
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, "content_type_mismatch");
  assert.equal(result.detectedContentType, "video/mp4");
});

test("rejects unknown signatures instead of trusting the declared MIME type", () => {
  const bytes = new TextEncoder().encode("not a video file");
  const result = validateVideoFileBytes({
    bytes,
    declaredContentType: "video/mp4",
    expectedSizeBytes: bytes.byteLength
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, "unrecognized_video_container");
});

test("rejects short, missing, or unsupported byte input", () => {
  assert.equal(validateVideoFileBytes({
    bytes: new Uint8Array([1, 2, 3]),
    declaredContentType: "video/mp4",
    expectedSizeBytes: 3
  }).status, "invalid_file_bytes");

  assert.equal(validateVideoFileBytes({
    bytes: "not-bytes",
    declaredContentType: "video/mp4",
    expectedSizeBytes: 10
  }).status, "invalid_file_bytes");

  const bytes = mp4Bytes();
  assert.equal(validateVideoFileBytes({
    bytes,
    declaredContentType: "application/octet-stream",
    expectedSizeBytes: bytes.byteLength
  }).status, "unsupported_content_type");
});

test("rejects declared sizes that do not exactly match received bytes", () => {
  const bytes = mp4Bytes();
  assert.equal(validateVideoFileBytes({
    bytes,
    declaredContentType: "video/mp4",
    expectedSizeBytes: bytes.byteLength + 1
  }).status, "file_size_mismatch");
});

test("rejects files above the configured maximum size", () => {
  const bytes = mp4Bytes();
  assert.equal(validateVideoFileBytes({
    bytes,
    declaredContentType: "video/mp4",
    expectedSizeBytes: bytes.byteLength,
    maxSizeBytes: 8
  }).status, "file_too_large");
});

test("documents that signature validation does not replace authorization or moderation", () => {
  assert.equal(VIDEO_FILE_VALIDATION_SECURITY.comparesDeclaredTypeToByteSignature, true);
  assert.equal(VIDEO_FILE_VALIDATION_SECURITY.authorizationIncluded, false);
  assert.equal(VIDEO_FILE_VALIDATION_SECURITY.malwareScanningIncluded, false);
  assert.equal(VIDEO_FILE_VALIDATION_SECURITY.moderationIncluded, false);
});
