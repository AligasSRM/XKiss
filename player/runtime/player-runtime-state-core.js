import { validateXKissPlayerRuntimeStateRequest } from "./player-runtime-state-rules.js";

export const XKISS_PLAYER_RUNTIME_STATE_CORE = {
  section: "15.17",
  name: "XKiss Player Runtime State Core",
  version: "1.0.0",
  status: "connected",
  failClosed: true
};

export function getXKissPlayerRuntimeState(video) {
  if (!video) return { ok: false, reason: "video_element_missing" };
  return {
    ok: true,
    paused: video.paused,
    currentTime: Number.isFinite(video.currentTime) ? video.currentTime : 0,
    duration: Number.isFinite(video.duration) ? video.duration : null,
    readyState: video.readyState,
    networkState: video.networkState,
    ended: video.ended,
    muted: video.muted,
    volume: video.volume,
    playbackRate: video.playbackRate,
    currentSrc: video.currentSrc || ""
  };
}

export function evaluateXKissPlayerRuntimeState(request = {}) {
  const validation = validateXKissPlayerRuntimeStateRequest(request);
  return { allowed: validation.allowed === true, gates: validation.gates };
}
