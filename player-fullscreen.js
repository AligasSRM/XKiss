(function () {
  "use strict";

  function init() {
    const player = document.getElementById("player");
    const fullscreenBtn = document.getElementById("fullscreenBtn");

    if (!player) {
      console.error("XKiss: Fullscreen player element not found.");
      return;
    }

    function isFullscreen() {
      return Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement
      );
    }

    async function enterFullscreen() {
      try {
        if (player.requestFullscreen) {
          await player.requestFullscreen();
          return true;
        }

        if (player.webkitRequestFullscreen) {
          player.webkitRequestFullscreen();
          return true;
        }

        console.warn(
          "XKiss: Fullscreen API is not supported."
        );

        return false;
      } catch (error) {
        console.error(
          "XKiss fullscreen error:",
          error
        );

        return false;
      }
    }

    async function exitFullscreen() {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          return true;
        }

        if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
          return true;
        }

        return false;
      } catch (error) {
        console.error(
          "XKiss fullscreen exit error:",
          error
        );

        return false;
      }
    }

    async function toggleFullscreen() {
      if (isFullscreen()) {
        await exitFullscreen();
      } else {
        await enterFullscreen();
      }
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener("click", async e => {
        e.preventDefault();
        e.stopPropagation();

        await toggleFullscreen();
      });
    }

    function updateFullscreenState() {
      if (!fullscreenBtn) return;

      fullscreenBtn.classList.toggle(
        "active",
        isFullscreen()
      );

      fullscreenBtn.setAttribute(
        "aria-pressed",
        isFullscreen() ? "true" : "false"
      );

      fullscreenBtn.title =
        isFullscreen()
          ? "Exit Fullscreen"
          : "Fullscreen";
    }

    document.addEventListener(
      "fullscreenchange",
      updateFullscreenState
    );

    document.addEventListener(
      "webkitfullscreenchange",
      updateFullscreenState
    );

    updateFullscreenState();

    window.XKissPlayerFullscreen = {
      isFullscreen,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen
    };

    console.log(
      "XKiss Player Fullscreen loaded."
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
