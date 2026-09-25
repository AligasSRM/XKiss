(() => {
  "use strict";

  const API_BASE = "https://xkiss.srourr-ali73.workers.dev";

  async function request(path, options = {}) {
    const response = await fetch(API_BASE + path, {
      ...options,
      headers: {
        "Accept": "application/json",
        ...(options.headers || {})
      }
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = { ok: false, message: "Invalid server response." };
    }

    if (!response.ok) {
      const error = new Error(data.message || "XKiss Worker request failed.");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async function getStorageStatus() {
    return request("/api/upload/status");
  }

  async function prepareUpload(metadata) {
    return request("/api/upload/prepare", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(metadata)
    });
  }

  window.XKissUploadAPI = {
    getStorageStatus,
    prepareUpload
  };
})();