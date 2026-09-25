/* =========================================================
   XKiss Player Controls

   Responsible for:
   - Play / Pause
   - Center Play Button
   - Progress Bar
   - Current Time
   - Duration
   - Volume
   - Mute
   ========================================================= */

(function () {

  "use strict";

  function initXKissPlayerControls() {

    const video =
      document.getElementById("video");

    const playPauseBtn =
      document.getElementById("playPauseBtn");

    const centerPlayBtn =
      document.getElementById("centerPlayBtn");

    const progress =
      document.getElementById("progress");

    const currentTimeEl =
      document.getElementById("currentTime");

    const durationEl =
      document.getElementById("duration");

    const muteBtn =
      document.getElementById("muteBtn");

    const volume =
      document.getElementById("volume");

    if (!video) {

      console.error(
        "XKiss Controls: Video element not found."
      );

      return;

    }


    /* =====================================================
       TIME FORMAT
       ===================================================== */

    function formatTime(seconds) {

      if (
        !Number.isFinite(seconds)
      ) {

        return "00:00";

      }

      const totalSeconds =
        Math.floor(seconds);

      const minutes =
        Math.floor(
          totalSeconds / 60
        );

      const secs =
        totalSeconds % 60;

      return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
      );

    }


    /* =====================================================
       PLAY / PAUSE
       ===================================================== */

    function togglePlay() {

      if (video.paused) {

        video.play().catch(
          () => {}
        );

      } else {

        video.pause();

      }

    }


    if (playPauseBtn) {

      playPauseBtn.addEventListener(
        "click",
        togglePlay
      );

    }


    if (centerPlayBtn) {

      centerPlayBtn.addEventListener(
        "click",
        togglePlay
      );

    }


    /* =====================================================
       PLAY STATE
       ===================================================== */

    video.addEventListener(
      "play",
      () => {

        if (playPauseBtn) {

          playPauseBtn.textContent =
            "❚❚";

        }

        if (centerPlayBtn) {

          centerPlayBtn.style.display =
            "none";

        }

      }
    );


    /* =====================================================
       PAUSE STATE
       ===================================================== */

    video.addEventListener(
      "pause",
      () => {

        if (playPauseBtn) {

          playPauseBtn.textContent =
            "▶";

        }

        if (centerPlayBtn) {

          centerPlayBtn.style.display =
            "flex";

        }

      }
    );


    /* =====================================================
       ENDED
       ===================================================== */

    video.addEventListener(
      "ended",
      () => {

        if (playPauseBtn) {

          playPauseBtn.textContent =
            "▶";

        }

        if (centerPlayBtn) {

          centerPlayBtn.style.display =
            "flex";

        }

      }
    );


    /* =====================================================
       DURATION
       ===================================================== */

    video.addEventListener(
      "loadedmetadata",
      () => {

        if (durationEl) {

          durationEl.textContent =
            formatTime(
              video.duration
            );

        }

      }
    );


    /* =====================================================
       PROGRESS UPDATE
       ===================================================== */

    video.addEventListener(
      "timeupdate",
      () => {

        if (!video.duration) {

          return;

        }

        const percentage =
          (
            video.currentTime /
            video.duration
          ) * 100;

        if (progress) {

          progress.value =
            percentage;

        }

        if (currentTimeEl) {

          currentTimeEl.textContent =
            formatTime(
              video.currentTime
            );

        }

        if (durationEl) {

          durationEl.textContent =
            formatTime(
              video.duration
            );

        }

      }
    );


    /* =====================================================
       PROGRESS SEEK
       ===================================================== */

    if (progress) {

      progress.addEventListener(
        "input",
        () => {

          if (!video.duration) {

            return;

          }

          video.currentTime =
            (
              Number(
                progress.value
              ) / 100
            ) *
            video.duration;

        }
      );

    }


    /* =====================================================
       MUTE BUTTON STATE
       ===================================================== */

    function updateMuteButton() {

      if (!muteBtn) {

        return;

      }

      if (
        video.muted ||
        video.volume === 0
      ) {

        muteBtn.textContent =
          "🔇";

      } else {

        muteBtn.textContent =
          "🔊";

      }

    }


    /* =====================================================
       VOLUME
       ===================================================== */

    if (volume) {

      volume.addEventListener(
        "input",
        () => {

          video.volume =
            Number(
              volume.value
            );

          video.muted =
            video.volume === 0;

          updateMuteButton();

        }
      );

    }


    /* =====================================================
       MUTE
       ===================================================== */

    if (muteBtn) {

      muteBtn.addEventListener(
        "click",
        () => {

          video.muted =
            !video.muted;

          updateMuteButton();

        }
      );

    }


    /* =====================================================
       INITIAL STATE
       ===================================================== */

    video.volume = 1;

    video.muted = false;

    if (volume) {

      volume.value =
        "1";

    }

    updateMuteButton();


    console.log(
      "XKiss Player Controls loaded."
    );

  }


  /* =======================================================
     START
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initXKissPlayerControls
    );

  } else {

    initXKissPlayerControls();

  }

})();
