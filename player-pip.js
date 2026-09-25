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
        console.warn(
          "XKiss: Picture-in-Picture is not available."
        );
        return false;
      }

      try {
        if (document.pictureInPictureElement === video) {
          return true;
        }

        if (video.readyState === 0) {
          console.warn(
            "XKiss: Video is not ready for Picture-in-Picture."
          );
          return false;
        }

        await video.requestPictureInPicture();

        return true;
      } catch (error) {
        console.error(
          "XKiss PiP error:",
          error
        );

        return false;
      }
    }

    async function exitPiP() {
      try {
        if (
          document.pictureInPictureElement &&
          document.exitPictureInPicture
        ) {
          await document.exitPictureInPicture();
          return true;
        }

        return false;
      } catch (error) {
        console.error(
          "XKiss PiP exit error:",
          error
        );

        return false;
      }
    }

    async function togglePiP() {
      if (document.pictureInPictureElement === video) {
        return await exitPiP();
      }

      return await enterPiP();
    }

    if (pipBtn) {
      pipBtn.addEventListener("click", async function (event) {
        event.preventDefault();
        event.stopPropagation();

        await togglePiP();
      });
    }

    video.addEventListener(
      "enterpictureinpicture",
      function () {
        pipBtn?.classList.add("active");

        if (pipBtn) {
          pipBtn.setAttribute(
            "aria-pressed",
            "true"
          );
        }
      }
    );

    video.addEventListener(
      "leavepictureinpicture",
      function () {
        pipBtn?.classList.remove("active");

        if (pipBtn) {
          pipBtn.setAttribute(
            "aria-pressed",
            "false"
          );
        }
      }
    );

    if (pipBtn && !isSupported()) {
      pipBtn.disabled = true;
      pipBtn.title =
        "Picture-in-Picture is not available on this device.";
    } else if (pipBtn) {
      pipBtn.disabled = false;
      pipBtn.title = "Picture-in-Picture";
    }

    window.XKissPlayerPiP = {
      isSupported,
      enterPiP,
      exitPiP,
      togglePiP
    };

    console.log(
      "XKiss Player PiP loaded."
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }
})();
