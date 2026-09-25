(function () {
  "use strict";

  function init() {
    const video = document.getElementById("video");
    const player = document.getElementById("player");
    const fullscreenBtn = document.getElementById("fullscreenBtn");

    if (!video || !player) {
      console.error("XKiss: Fullscreen elements not found.");
      return;
    }

    function isFullscreen() {
      return Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement
      );
    }

    async function lockLandscape() {
      try {
        if (
          screen.orientation &&
          typeof screen.orientation.lock === "function"
        ) {
          await screen.orientation.lock("landscape");
        }
      } catch (error) {
        console.log(
          "XKiss: Landscape lock unavailable."
        );
      }
    }

    function unlockOrientation() {
      try {
        if (
          screen.orientation &&
          typeof screen.orientation.unlock === "function"
        ) {
          screen.orientation.unlock();
        }
      } catch (error) {}
    }

    async function enterFullscreen() {
      try {
        if (player.requestFullscreen) {
          await player.requestFullscreen();
        } else if (player.webkitRequestFullscreen) {
          player.webkitRequestFullscreen();
        } else {
          return;
        }

        await lockLandscape();
      } catch (error) {
        console.error(
          "XKiss fullscreen error:",
          error
        );
      }
    }

    async function exitFullscreen() {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      } catch (error) {
        console.error(
          "XKiss fullscreen exit error:",
          error
        );
      }

      unlockOrientation();
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener(
        "click",
        async e => {
          e.stopPropagation();

          if (isFullscreen()) {
            await exitFullscreen();
          } else {
            await enterFullscreen();
          }
        }
      );
    }

    function fullscreenChanged() {
      if (!isFullscreen()) {
        unlockOrientation();
      }
    }

    document.addEventListener(
      "fullscreenchange",
      fullscreenChanged
    );

    document.addEventListener(
      "webkitfullscreenchange",
      fullscreenChanged
    );

    window.XKissPlayerFullscreen = {
      isFullscreen,
      enterFullscreen,
      exitFullscreen,
      lockLandscape,
      unlockOrientation
    };

    console.log("XKiss Player Fullscreen loaded.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
