(function () {
  "use strict";

  function init() {
    const video = document.getElementById("video");
    const pipBtn = document.getElementById("pipBtn");

    if (!video) {
      console.error("XKiss: PiP video element not found.");
      return;
    }

    function isSupported() {
      return Boolean(
        document.pictureInPictureEnabled &&
        !video.disablePictureInPicture &&
        typeof video.requestPictureInPicture === "function"
      );
    }

    async function enterPiP() {
      if (!isSupported()) {
        console.log("XKiss: Picture-in-Picture unavailable.");
        return;
      }

      try {
        if (document.pictureInPictureElement === video) {
          return;
        }

        await video.requestPictureInPicture();
      } catch (error) {
        console.error(
          "XKiss PiP error:",
          error
        );
      }
    }

    async function exitPiP() {
      try {
        if (document.pictureInPictureElement === video) {
          await document.exitPictureInPicture();
        }
      } catch (error) {
        console.error(
          "XKiss PiP exit error:",
          error
        );
      }
    }

    async function togglePiP() {
      if (document.pictureInPictureElement === video) {
        await exitPiP();
      } else {
        await enterPiP();
      }
    }

    if (pipBtn) {
      pipBtn.addEventListener("click", async e => {
        e.stopPropagation();
        await togglePiP();
      });
    }

    video.addEventListener(
      "enterpictureinpicture",
      () => {
        pipBtn?.classList.add("active");
      }
    );

    video.addEventListener(
      "leavepictureinpicture",
      () => {
        pipBtn?.classList.remove("active");
      }
    );

    if (pipBtn && !isSupported()) {
      pipBtn.disabled = true;
      pipBtn.title =
        "Picture-in-Picture is not available on this device.";
    }

    window.XKissPlayerPiP = {
      isSupported,
      enterPiP,
      exitPiP,
      togglePiP
    };

    console.log("XKiss Player PiP loaded.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
