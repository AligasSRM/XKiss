/* =========================================================
   XKiss Video Player
   Connected to XKISS_VIDEOS
   Quality System:
   340p / 460p / 720p / 1080p
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     ELEMENTS
     ======================================================= */

  const video = document.getElementById("video");
  const videoSource = document.getElementById("videoSource");

  const player = document.getElementById("player");

  const playPauseBtn = document.getElementById("playPauseBtn");
  const centerPlayBtn = document.getElementById("centerPlayBtn");

  const progress = document.getElementById("progress");

  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");

  const muteBtn = document.getElementById("muteBtn");
  const volume = document.getElementById("volume");

  const qualityBtn = document.getElementById("qualityBtn");
  const qualityMenu = document.getElementById("qualityMenu");

  const speedBtn = document.getElementById("speedBtn");
  const speedMenu = document.getElementById("speedMenu");

  const settingsBtn = document.getElementById("settingsBtn");
  const settingsMenu = document.getElementById("settingsMenu");

  const pipBtn = document.getElementById("pipBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");

  const ccBtn = document.getElementById("ccBtn");
  const resetSpeedBtn = document.getElementById("resetSpeedBtn");

  const videoTitle = document.getElementById("videoTitle");
  const videoDuration = document.getElementById("videoDuration");
  const creatorName = document.getElementById("creatorName");
  const videoTags = document.getElementById("videoTags");
  const currentQuality = document.getElementById("currentQuality");
  const views = document.getElementById("views");


  /* =======================================================
     VIDEO ID
     ======================================================= */

  const params = new URLSearchParams(window.location.search);

  const requestedVideoId =
    params.get("id") || "video-001";


  /* =======================================================
     VIDEO DATA
     ======================================================= */

  let videoData = null;

  if (
    typeof XKISS_VIDEOS !== "undefined" &&
    XKISS_VIDEOS[requestedVideoId]
  ) {

    videoData = XKISS_VIDEOS[requestedVideoId];

  } else if (
    typeof XKISS_VIDEOS !== "undefined" &&
    XKISS_VIDEOS["video-001"]
  ) {

    videoData = XKISS_VIDEOS["video-001"];

  }


  /* =======================================================
     SAFETY CHECK
     ======================================================= */

  if (!videoData) {

    console.error("XKiss: Video data not found.");

    if (videoTitle) {
      videoTitle.textContent = "Video Not Found";
    }

    return;
  }


  /* =======================================================
     VIDEO INFORMATION
     ======================================================= */

  if (videoTitle) {

    videoTitle.textContent =
      videoData.title || "XKiss Video";

  }


  if (videoDuration) {

    videoDuration.textContent =
      videoData.duration || "00:00";

  }


  if (creatorName) {

    creatorName.textContent =
      videoData.creator || "XKiss Creator";

  }


  if (views) {

    views.textContent =
      Number(videoData.views || 0);

  }


  /* =======================================================
     TAGS
     ======================================================= */

  if (videoTags) {

    videoTags.innerHTML = "";

    if (
      Array.isArray(videoData.tags) &&
      videoData.tags.length > 0
    ) {

      videoData.tags.forEach(tag => {

        const tagElement =
          document.createElement("span");

        tagElement.textContent =
          tag.startsWith("#")
            ? tag
            : "#" + tag;

        videoTags.appendChild(tagElement);

      });

    }

  }


  /* =======================================================
     QUALITY SYSTEM
     ======================================================= */

  const QUALITY_OPTIONS = [
    "340p",
    "460p",
    "720p",
    "1080p"
  ];


  let currentQualityValue = "720p";


  const QUALITY_SOURCES = {

    "340p":
      videoData.sources?.["340p"] || "",

    "460p":
      videoData.sources?.["460p"] || "",

    "720p":
      videoData.sources?.["720p"] || "",

    "1080p":
      videoData.sources?.["1080p"] || ""

  };


  /* =======================================================
     LOAD VIDEO SOURCE
     ======================================================= */

  function loadVideoSource(
    quality,
    autoPlay = false
  ) {

    if (!QUALITY_OPTIONS.includes(quality)) {
      return;
    }


    const source =
      QUALITY_SOURCES[quality];


    if (!source) {

      alert(
        quality +
        " is not configured yet."
      );

      return;
    }


    const wasPlaying =
      autoPlay || !video.paused;


    const currentPosition =
      video.currentTime || 0;


    currentQualityValue =
      quality;


    if (currentQuality) {

      currentQuality.textContent =
        quality;

    }


    if (qualityBtn) {

      qualityBtn.textContent =
        quality;

    }


    if (!videoSource) {
      return;
    }


    videoSource.src =
      source;


    video.load();


    video.addEventListener(
      "loadedmetadata",
      function restorePosition() {

        video.removeEventListener(
          "loadedmetadata",
          restorePosition
        );


        if (
          Number.isFinite(currentPosition) &&
          currentPosition < video.duration
        ) {

          video.currentTime =
            currentPosition;

        }


        if (wasPlaying) {

          video.play().catch(() => {});

        }

      }
    );

  }


  /* =======================================================
     INITIAL VIDEO
     ======================================================= */

  loadVideoSource(
    currentQualityValue,
    false
  );


  /* =======================================================
     TIME FORMAT
     ======================================================= */

  function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
      return "00:00";
    }


    const totalSeconds =
      Math.floor(seconds);


    const minutes =
      Math.floor(totalSeconds / 60);


    const secs =
      totalSeconds % 60;


    return (
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0")
    );

  }


  /* =======================================================
     PLAY / PAUSE
     ======================================================= */

  function togglePlay() {

    if (video.paused) {

      video.play().catch(() => {});

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


  /* =======================================================
     VIDEO PLAY EVENT
     ======================================================= */

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


  /* =======================================================
     VIDEO PAUSE EVENT
     ======================================================= */

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


  /* =======================================================
     VIDEO ENDED
     ======================================================= */

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


  /* =======================================================
     DURATION
     ======================================================= */

  video.addEventListener(
    "loadedmetadata",
    () => {

      if (durationEl) {

        durationEl.textContent =
          formatTime(video.duration);

      }

    }
  );


  /* =======================================================
     PROGRESS UPDATE
     ======================================================= */

  video.addEventListener(
    "timeupdate",
    () => {

      if (!video.duration) {
        return;
      }


      const percentage =
        (video.currentTime /
          video.duration) * 100;


      if (progress) {

        progress.value =
          percentage;

      }


      if (currentTimeEl) {

        currentTimeEl.textContent =
          formatTime(video.currentTime);

      }


      if (durationEl) {

        durationEl.textContent =
          formatTime(video.duration);

      }

    }
  );


  /* =======================================================
     PROGRESS SEEK
     ======================================================= */

  if (progress) {

    progress.addEventListener(
      "input",
      () => {

        if (!video.duration) {
          return;
        }


        video.currentTime =
          (Number(progress.value) / 100) *
          video.duration;

      }
    );

  }


  /* =======================================================
     VOLUME
     ======================================================= */

  if (volume) {

    volume.addEventListener(
      "input",
      () => {

        video.volume =
          Number(volume.value);


        video.muted =
          video.volume === 0;


        updateMuteButton();

      }
    );

  }


  /* =======================================================
     MUTE
     ======================================================= */

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


  /* =======================================================
     QUALITY MENU
     ======================================================= */

  if (qualityBtn && qualityMenu) {

    qualityBtn.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        qualityMenu.classList.toggle(
          "show"
        );


        if (speedMenu) {
          speedMenu.classList.remove(
            "show"
          );
        }


        if (settingsMenu) {
          settingsMenu.classList.remove(
            "show"
          );
        }

      }
    );

  }


  if (qualityMenu) {

    const qualityButtons =
      qualityMenu.querySelectorAll(
        "[data-quality]"
      );


    qualityButtons.forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const quality =
            button.dataset.quality;


          loadVideoSource(
            quality,
            !video.paused
          );


          qualityMenu.classList.remove(
            "show"
          );

        }
      );

    });

  }


  /* =======================================================
     SPEED
     ======================================================= */

  let currentSpeed = 1;


  if (speedBtn && speedMenu) {

    speedBtn.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        speedMenu.classList.toggle(
          "show"
        );


        if (qualityMenu) {
          qualityMenu.classList.remove(
            "show"
          );
        }


        if (settingsMenu) {
          settingsMenu.classList.remove(
            "show"
          );
        }

      }
    );

  }


  if (speedMenu) {

    const speedButtons =
      speedMenu.querySelectorAll(
        "[data-speed]"
      );


    speedButtons.forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const speed =
            Number(button.dataset.speed);


          if (!Number.isFinite(speed)) {
            return;
          }


          currentSpeed =
            speed;


          video.playbackRate =
            speed;


          if (speedBtn) {

            speedBtn.textContent =
              speed + "x";

          }


          speedMenu.classList.remove(
            "show"
          );

        }
      );

    });

  }


  /* =======================================================
     SETTINGS
     ======================================================= */

  if (settingsBtn && settingsMenu) {

    settingsBtn.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        settingsMenu.classList.toggle(
          "show"
        );


        if (qualityMenu) {
          qualityMenu.classList.remove(
            "show"
          );
        }


        if (speedMenu) {
          speedMenu.classList.remove(
            "show"
          );
        }

      }
    );

  }


  /* =======================================================
     CC
     ======================================================= */

  if (ccBtn) {

    ccBtn.addEventListener(
      "click",
      () => {

        alert(
          "CC is ready for future subtitle integration."
        );

      }
    );

  }


  /* =======================================================
     RESET SPEED
     ======================================================= */

  if (resetSpeedBtn) {

    resetSpeedBtn.addEventListener(
      "click",
      () => {

        currentSpeed =
          1;


        video.playbackRate =
          1;


        if (speedBtn) {

          speedBtn.textContent =
            "1x";

        }


        if (settingsMenu) {

          settingsMenu.classList.remove(
            "show"
          );

        }

      }
    );

  }


  /* =======================================================
     PICTURE IN PICTURE
     ======================================================= */

  if (pipBtn) {

    pipBtn.addEventListener(
      "click",
      async () => {

        try {

          if (
            document.pictureInPictureElement
          ) {

            await document.exitPictureInPicture();

          } else if (
            document.pictureInPictureEnabled &&
            !video.disablePictureInPicture
          ) {

            await video.requestPictureInPicture();

          }

        } catch (error) {

          console.error(
            "XKiss PiP error:",
            error
          );

        }

      }
    );

  }


  /* =======================================================
     FULLSCREEN + LANDSCAPE
     ======================================================= */

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
        "XKiss: Landscape orientation lock is not available on this device/browser.",
        error
      );

    }

  }


  async function unlockOrientation() {

    try {

      if (
        screen.orientation &&
        typeof screen.orientation.unlock === "function"
      ) {

        screen.orientation.unlock();

      }

    } catch (error) {

      console.log(
        "XKiss: Orientation unlock is not available.",
        error
      );

    }

  }


  async function enterFullscreen() {

    if (!player) {
      return;
    }


    try {

      if (player.requestFullscreen) {

        await player.requestFullscreen();

      } else if (
        player.webkitRequestFullscreen
      ) {

        player.webkitRequestFullscreen();

      } else {

        console.log(
          "XKiss: Fullscreen is not supported by this browser."
        );

        return;

      }


      /*
       * Important:
       * Orientation lock normally works only after
       * fullscreen has been successfully entered.
       */

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

      } else if (
        document.webkitExitFullscreen
      ) {

        document.webkitExitFullscreen();

      }

    } catch (error) {

      console.error(
        "XKiss fullscreen exit error:",
        error
      );

    }


    await unlockOrientation();

  }


  if (fullscreenBtn) {

    fullscreenBtn.addEventListener(
      "click",
      async (event) => {

        event.stopPropagation();


        const isFullscreen =
          document.fullscreenElement ||
          document.webkitFullscreenElement;


        if (isFullscreen) {

          await exitFullscreen();

        } else {

          await enterFullscreen();

        }

      }
    );

  }


  /* =======================================================
     FULLSCREEN STATE CHANGE
     ======================================================= */

  function handleFullscreenChange() {

    const isFullscreen =
      document.fullscreenElement ||
      document.webkitFullscreenElement;


    if (!isFullscreen) {

      unlockOrientation();

    }

  }


  document.addEventListener(
    "fullscreenchange",
    handleFullscreenChange
  );


  document.addEventListener(
    "webkitfullscreenchange",
    handleFullscreenChange
  );


  /* =======================================================
     CLOSE MENUS WHEN CLICKING OUTSIDE
     ======================================================= */

  document.addEventListener(
    "click",
    () => {

      if (qualityMenu) {

        qualityMenu.classList.remove(
          "show"
        );

      }


      if (speedMenu) {

        speedMenu.classList.remove(
          "show"
        );

      }


      if (settingsMenu) {

        settingsMenu.classList.remove(
          "show"
        );

      }

    }
  );


  /* =======================================================
     PREVENT MENU CLICKS FROM CLOSING THEMSELVES
     ======================================================= */

  [
    qualityMenu,
    speedMenu,
    settingsMenu
  ].forEach(menu => {

    if (!menu) {
      return;
    }


    menu.addEventListener(
      "click",
      event => {

        event.stopPropagation();

      }
    );

  });


  /* =======================================================
     INITIAL STATE
     ======================================================= */

  video.volume =
    1;


  video.muted =
    false;


  video.playbackRate =
    1;


  if (volume) {

    volume.value =
      "1";

  }


  if (qualityBtn) {

    qualityBtn.textContent =
      currentQualityValue;

  }


  if (currentQuality) {

    currentQuality.textContent =
      currentQualityValue;

  }


  updateMuteButton();


  console.log(
    "XKiss Player loaded:",
    videoData.id,
    videoData.title
  );

});
