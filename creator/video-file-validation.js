const MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);

function asBytes(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  return null;
}

function ascii(bytes, start, length) {
  let value = "";
  for (let i = start; i < Math.min(bytes.length, start + length); i += 1) {
    value += String.fromCharCode(bytes[i]);
  }
  return value;
}

function detectVideoContainer(bytes) {
  // WebM is an EBML document. This signature is only a container check,
  // not proof that the complete media stream is safe or decodable.
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return "video/webm";
  }

  // ISO BMFF containers use an ftyp box. QuickTime uses the "qt  " brand;
  // common MP4 brands are explicitly allow-listed instead of accepting any
  // arbitrary file containing the string "ftyp".
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (brand === "qt  ") return "video/quicktime";
    if (new Set(["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "M4A "]).has(brand)) {
      return "video/mp4";
    }
  }

  return null;
}

/**
 * Validates upload metadata against the actual leading container signature.
 * This is not a malware scan, codec/decode validation, moderation decision,
 * or authorization check. Call only after the server has authorized the
 * creator and confirmed the video draft belongs to that creator.
 */
export function validateVideoFileBytes({
  bytes: rawBytes,
  declaredContentType,
  expectedSizeBytes,
  maxSizeBytes = MAX_VIDEO_SIZE_BYTES
} = {}) {
  const bytes = asBytes(rawBytes);
  const contentType = String(declaredContentType ?? "").trim().toLowerCase();
  const size = Number(expectedSizeBytes);

  if (!bytes || bytes.byteLength < 4) {
    return { ok: false, status: "invalid_file_bytes", detectedContentType: null };
  }
  if (!Number.isSafeInteger(size) || size < 1 || size !== bytes.byteLength) {
    return { ok: false, status: "file_size_mismatch", detectedContentType: null };
  }
  if (!Number.isSafeInteger(maxSizeBytes) || maxSizeBytes < 1 || size > maxSizeBytes) {
    return { ok: false, status: "file_too_large", detectedContentType: null };
  }
  if (!ALLOWED_TYPES.has(contentType)) {
    return { ok: false, status: "unsupported_content_type", detectedContentType: null };
  }

  const detectedContentType = detectVideoContainer(bytes);
  if (!detectedContentType) {
    return { ok: false, status: "unrecognized_video_container", detectedContentType: null };
  }
  if (detectedContentType !== contentType) {
    return { ok: false, status: "content_type_mismatch", detectedContentType };
  }

  return {
    ok: true,
    status: "container_signature_valid",
    declaredContentType: contentType,
    detectedContentType,
    sizeBytes: size,
    validationScope: "container-signature-only"
  };
}

export const VIDEO_FILE_VALIDATION_SECURITY = Object.freeze({
  comparesDeclaredTypeToByteSignature: true,
  exactByteLengthRequired: true,
  sizeBounded: true,
  containerAllowList: ["video/mp4", "video/webm", "video/quicktime"],
  malwareScanningIncluded: false,
  fullDecodeValidationIncluded: false,
  moderationIncluded: false,
  authorizationIncluded: false
});
