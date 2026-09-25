(() => {
  "use strict";

  const state = {
    file: null,
    storageReady: false
  };

  function $(id) {
    return document.getElementById(id);
  }

  function setResult(message, type = "") {
    const result = $("upload-result");
    result.hidden = false;
    result.className = "upload-result" + (type ? " " + type : "");
    result.textContent = message;
  }

  function setProgress(percent, label) {
    const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
    $("progress-bar").style.width = safePercent + "%";
    $("progress-value").textContent = Math.round(safePercent) + "%";
    $("progress-label").textContent = label;
  }

  function setStorageStatus(ready, message) {
    state.storageReady = ready;
    const pill = $("storage-status");
    pill.textContent = message;
    pill.className = "status-pill " + (ready ? "ready" : "error");
  }

  function validate() {
    if (!state.file) return "Select a video file first.";
    if (!state.file.type || !state.file.type.startsWith("video/")) return "The selected file is not a supported video.";
    if (state.file.size <= 0) return "The selected video file is empty.";
    if (!$("video-title").value.trim()) return "Enter a video title.";
    if (!$("video-category").value) return "Select a category.";
    return "";
  }

  async function checkStorage() {
    try {
      const data = await window.XKissUploadAPI.getStorageStatus();

      setStorageStatus(
        Boolean(data.storageReady),
        data.storageReady ? "Storage ready" : "Storage not active"
      );

      $("upload-status").textContent = data.storageReady
        ? "Production storage is connected. Complete the metadata and prepare the upload."
        : "Cloud storage is not active yet. The upload architecture is ready.";

      setProgress(0, data.storageReady ? "Ready to upload" : "Upload waiting for storage");
    } catch (error) {
      setStorageStatus(false, "Worker unavailable");
      $("upload-status").textContent = "Could not reach the XKiss upload service.";
      setProgress(0, "Upload service unavailable");
    }
  }

  function handleFile(event) {
    const file = event.target.files && event.target.files[0];

    state.file = file || null;

    $("file-name").textContent = file
      ? file.name + " — " + formatBytes(file.size)
      : "No file selected";

    $("upload-status").textContent = file
      ? "Video selected. Complete the metadata."
      : "Choose a video file to begin.";

    $("upload-result").hidden = true;
    setProgress(0, file ? "Video selected — upload not started" : "Upload not started");
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );

    return (
      (bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1) +
      " " +
      units[index]
    );
  }

  async function prepare() {
    const validation = validate();

    if (validation) {
      setResult(validation, "error");
      setProgress(0, "Validation failed");
      return;
    }

    if (!state.storageReady) {
      setResult(
        "Video is validated and ready for production storage. R2 is not activated yet, so no file was uploaded or stored.",
        "error"
      );
      setProgress(0, "Waiting for production storage");
      return;
    }

    const button = $("prepare-upload");
    button.disabled = true;
    button.textContent = "Preparing…";
    setProgress(15, "Preparing upload metadata");

    try {
      const data = await window.XKissUploadAPI.prepareUpload({
        fileName: state.file.name,
        fileSize: state.file.size,
        contentType: state.file.type,
        title: $("video-title").value.trim(),
        description: $("video-description").value.trim(),
        category: $("video-category").value,
        downloadPolicy: $("download-policy").value,
        visibility: $("video-visibility").value
      });

      setProgress(100, "Upload preparation complete");
      setResult(
        data.message || "Upload preparation complete.",
        data.uploadReady ? "success" : "error"
      );
    } catch (error) {
      setProgress(0, "Upload preparation failed");
      setResult(
        error.message || "Upload preparation failed.",
        "error"
      );
    } finally {
      button.disabled = false;
      button.textContent = "Prepare Upload";
    }
  }

  function reset() {
    state.file = null;

    $("video-file").value = "";
    $("file-name").textContent = "No file selected";
    $("video-title").value = "";
    $("video-description").value = "";
    $("video-category").value = "";
    $("download-policy").value = "disabled";
    $("video-visibility").value = "private";
    $("upload-status").textContent = "Choose a video file to begin.";
    $("upload-result").hidden = true;
    setProgress(0, "Upload not started");
  }

  function initialize() {
    $("video-file").addEventListener("change", handleFile);
    $("prepare-upload").addEventListener("click", prepare);
    $("reset-upload").addEventListener("click", reset);
    checkStorage();
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();