(() => {
  "use strict";

  const state = {
    mediaStream: null,
    mediaRecorder: null,
    chunks: [],
    blob: null,
    timerId: null,
    startedAt: 0
  };

  function getSupportedMimeType() {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || "";
  }

  function setStatus(text, recording) {
    const status = document.getElementById("recorder-status");
    const indicator = document.getElementById("recorder-indicator");
    if (status) status.textContent = text;
    if (indicator) {
      indicator.classList.toggle("recording", Boolean(recording));
      indicator.innerHTML = recording ? "<span></span> Recording" : "<span></span> Ready";
    }
  }

  function updateTimer() {
    const timer = document.getElementById("recorder-timer");
    if (!timer) return;
    const seconds = Math.floor((Date.now() - state.startedAt) / 1000);
    timer.textContent = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
  }

  function stopStream() {
    if (!state.mediaStream) return;
    state.mediaStream.getTracks().forEach(track => track.stop());
    state.mediaStream = null;
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      setStatus("Recording is not supported by this browser.", false);
      return;
    }

    try {
      state.blob = null;
      state.chunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:true});
      state.mediaStream = stream;

      const preview = document.getElementById("recorder-preview");
      const placeholder = document.getElementById("recorder-placeholder");
      preview.srcObject = stream;
      placeholder.classList.add("hidden");

      const mimeType = getSupportedMimeType();
      state.mediaRecorder = mimeType ? new MediaRecorder(stream,{mimeType}) : new MediaRecorder(stream);

      state.mediaRecorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) state.chunks.push(event.data);
      };

      state.mediaRecorder.onstop = () => {
        const type = state.mediaRecorder.mimeType || "video/webm";
        state.blob = new Blob(state.chunks,{type});
        document.getElementById("recorder-download").disabled = false;
        stopStream();
        setStatus("Recording finished. Download it to save the file.", false);
      };

      state.mediaRecorder.onerror = () => {
        setStatus("Recording error. Please try again.", false);
        stopStream();
      };

      state.mediaRecorder.start(1000);
      state.startedAt = Date.now();
      state.timerId = window.setInterval(updateTimer,500);

      document.getElementById("recorder-start").classList.add("recording");
      document.getElementById("recorder-start").querySelector("span:last-child").textContent = "Recording...";
      document.getElementById("recorder-stop").disabled = false;
      document.getElementById("recorder-download").disabled = true;
      setStatus("Recording camera and microphone.", true);
    } catch (error) {
      stopStream();
      setStatus(error && error.name === "NotAllowedError" ? "Camera/microphone permission was denied." : "Could not start recording. Please try again.", false);
    }
  }

  function stopRecording() {
    if (!state.mediaRecorder) return;
    if (state.mediaRecorder.state !== "inactive") state.mediaRecorder.stop();
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    document.getElementById("recorder-stop").disabled = true;
    document.getElementById("recorder-start").classList.remove("recording");
    document.getElementById("recorder-start").querySelector("span:last-child").textContent = "Start Recording";
  }

  function downloadRecording() {
    if (!state.blob) return;
    const url = URL.createObjectURL(state.blob);
    const link = document.createElement("a");
    link.href = url;
    const stamp = new Date().toISOString().replace(/[:.]/g,"-").replace("T","_").slice(0,19);
    link.download = "xkiss-recording-" + stamp + ".webm";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url),1000);
  }

  function initialize() {
    const start = document.getElementById("recorder-start");
    const stop = document.getElementById("recorder-stop");
    const download = document.getElementById("recorder-download");
    if (!start || !stop || !download) return;
    start.addEventListener("click",startRecording);
    stop.addEventListener("click",stopRecording);
    download.addEventListener("click",downloadRecording);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      start.disabled = true;
      setStatus("Recording is not supported by this browser.",false);
    }
  }

  window.addEventListener("DOMContentLoaded",initialize);
  window.XKissRecorder = {startRecording,stopRecording,downloadRecording};
})();
