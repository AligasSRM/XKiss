import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const html = readFileSync("player.html", "utf8");
const quality = readFileSync("js/player/player-quality.js", "utf8");
const data = readFileSync("js/video-data.js", "utf8");

assert.match(html, /hls\.js@1\.7\.3/);
assert.match(quality, /Hls\.isSupported\(\)/);
assert.match(quality, /application\/vnd\.apple\.mpegurl/);
assert.match(quality, /loadProgressive/);
assert.match(quality, /NETWORK_ERROR/);
assert.match(quality, /MEDIA_ERROR/);
assert.match(data, /mode:\s*"adaptive"/);
assert.match(data, /hlsManifest:/);

console.log(JSON.stringify({
  ok: true,
  gate: "ADAPTIVE_VIDEO_DELIVERY_IMPLEMENTATION",
  checks: [
    "pinned-hls-js",
    "hls-js-mse-path",
    "native-hls-fallback",
    "progressive-fallback",
    "fatal-network-recovery",
    "fatal-media-recovery",
    "adaptive-delivery-config-boundary"
  ]
}, null, 2));
