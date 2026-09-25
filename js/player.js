const video = document.getElementById("video");
const player = document.getElementById("player");

if (!video || !player) {
  console.error("XKiss Player: video or player element not found.");
} else {

  /* =========================================================
     XKiss Player Configuration
     ========================================================= */

  const QUALITY_SOURCES = {
    "340p": "",
    "460p": "",
    "720p": "https://aligassrm.github.io/XKiss/20260923_234200-3.mp4",
    "1080p": ""
  };

  const SPEEDS = [
    0.5,
    0.75,
    1,
    1.25,
    1.5,
    2
  ];

  let currentQuality = "720p";

  /* =========================================================
     Disable Native Controls
     ========================================================= */

  video.controls = false;

  /* =========================================================
     Player Controls
     ========================================================= */

  const controls = document.createElement("div");
  controls.className = "xkiss-controls";

  controls.innerHTML = `
    <div class="xkiss-progress-area">
      <input
        class="xkiss-progress"
        type="range"
        min="0"
        max="100"
        value="0"
        step="0.1"
        aria-label="Video progress"
      >
    </div>

    <div class="xkiss-control-row">

      <button
        class="xkiss-button xkiss-play"
        type="button"
        aria-label="Play"
      >
        ▶
      </button>

      <button
        class="xkiss-button xkiss-mute"
        type="button"
        aria-label="Mute"
      >
        🔊
      </button>

      <input
        class="xkiss-volume"
        type="range"
        min="0"
        max="1"
        value="1"
        step="0.05"
        aria-label="Volume"
      >

      <span class="xkiss-time">
        <span class="xkiss-current-time">00:00</span>
        /
        <span class="xkiss-duration">00:00</span>
      </span>

      <div class="xkiss-spacer"></div>

      <button
        class="xkiss-button xkiss-speed"
        type="button"
        aria-label="Playback speed"
      >
        1x
      </button>

      <button
        class="xkiss-button xkiss-quality"
        type="button"
        aria-label="Video quality"
      >
        720p
      </button>

      <button
        class="xkiss-button xkiss-settings"
        type="button"
        aria-label="Settings"
      >
        ⚙
      </button>

      <button
        class="xkiss-button xkiss-pip"
        type="button"
        aria-label="Picture in Picture"
      >
        ▣
      </button>

      <button
        class="xkiss-button xkiss-fullscreen"
        type="button"
        aria-label="Fullscreen"
      >
        ⛶
      </button>

    </div>
  `;

  player.appendChild(controls);

  /* =========================================================
     Center Play Button
     ========================================================= */

  const centerPlay = document.createElement("button");

  centerPlay.type = "button";
  centerPlay.className = "xkiss-center-play";
  centerPlay.setAttribute("aria-label", "Play video");
  centerPlay.innerHTML = "▶";

  player.appendChild(centerPlay);

  /* =========================================================
     Quality Menu
     ========================================================= */

  const qualityMenu = document.createElement("div");

  qualityMenu.className = "xkiss-menu xkiss-quality-menu";

  qualityMenu.innerHTML = `
    <div class="xkiss-menu-title">Quality</div>

    <button type="button" data-quality="340p">
      340p
    </button>

    <button type="button" data-quality="460p">
      460p
    </button>

    <button type="button" data-quality="720p">
      720p
    </button>

    <button type="button" data-quality="1080p">
      1080p
    </button>
  `;

  player.appendChild(qualityMenu);

  /* =========================================================
     Speed Menu
     ========================================================= */

  const speedMenu = document.createElement("div");

  speedMenu.className = "xkiss-menu xkiss-speed-menu";

  speedMenu.innerHTML = `
    <div class="xkiss-menu-title">Playback Speed</div>

    <button type="button" data-speed="0.5">0.5x</button>
    <button type="button" data-speed="0.75">0.75x</button>
    <button type="button" data-speed="1">Normal</button>
    <button type="button" data-speed="1.25">1.25x</button>
    <button type="button" data-speed="1.5">1.5x</button>
    <button type="button" data-speed="2">2x</button>
  `;

  player.appendChild(speedMenu);

  /* =========================================================
     Settings Menu
     ========================================================= */

  const settingsMenu = document.createElement("div");

  settingsMenu.className = "xkiss-menu xkiss-settings-menu";

  settingsMenu.innerHTML = `
    <div class="xkiss-menu-title">Settings</div>

    <button type="button" class="xkiss-cc-button">
      CC
    </button>

    <button type="button" class="xkiss-reset-speed">
      Reset Speed
    </button>
  `;

  player.appendChild(settingsMenu);

  /* =========================================================
     Elements
     ========================================================= */

  const playButton =
    controls.querySelector(".xkiss-play");

  const muteButton =
    controls.querySelector(".xkiss-mute");

  const volumeSlider =
    controls.querySelector(".xkiss-volume");

  const progressSlider =
    controls.querySelector(".xkiss-progress");

  const currentTimeElement =
    controls.querySelector(".xkiss-current-time");

  const durationElement =
    controls.querySelector(".xkiss-duration");

  const speedButton =
    controls.querySelector(".xkiss-speed");

  const qualityButton =
    controls.querySelector(".xkiss-quality");

  const settingsButton =
    controls.querySelector(".xkiss-settings");

  const pipButton =
    controls.querySelector(".xkiss-pip");

  const fullscreenButton =
    controls.querySelector(".xkiss-fullscreen");

  /* =========================================================
     Utility Functions
     ========================================================= */

  function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
      return "00:00";
    }

    const minutes = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60);

    return (
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0")
    );
  }

  function updatePlayButton() {

    if (video.paused) {
      playButton.textContent = "▶";
      centerPlay.style.display = "flex";
    } else {
      playButton.textContent = "❚❚";
      centerPlay.style.display = "none";
    }
  }

  function updateMuteButton() {

    if (video.muted || video.volume === 0) {
      muteButton.textContent = "🔇";
    } else {
      muteButton.textContent = "🔊";
    }
  }

  function updateProgress() {

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      progressSlider.value = 0;
      return;
    }

    const percent =
      (video.currentTime / video.duration) * 100;

    progressSlider.value = percent;

    currentTimeElement.textContent =
      formatTime(video.currentTime);

    durationElement.textContent =
      formatTime(video.duration);
  }

  /* =========================================================
     Play / Pause
     ========================================================= */

  function togglePlay() {

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  playButton.addEventListener("click", togglePlay);

  centerPlay.addEventListener("click", togglePlay);

  video.addEventListener("click", togglePlay);

  video.addEventListener("play", updatePlayButton);

  video.addEventListener("pause", updatePlayButton);

  /* =========================================================
     Progress
     ========================================================= */

  progressSlider.addEventListener("input", () => {

    if (
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    ) {
      return;
    }

    const percent =
      Number(progressSlider.value);

    video.currentTime =
      (percent / 100) * video.duration;
  });

  video.addEventListener(
    "timeupdate",
    updateProgress
  );

  video.addEventListener(
    "loadedmetadata",
    updateProgress
  );

  /* =========================================================
     Volume
     ========================================================= */

  volumeSlider.addEventListener("input", () => {

    video.volume =
      Number(volumeSlider.value);

    video.muted = video.volume === 0;

    updateMuteButton();
  });

  muteButton.addEventListener("click", () => {

    video.muted = !video.muted;

    updateMuteButton();
  });

  /* =========================================================
     Speed
     ========================================================= */

  speedButton.addEventListener("click", () => {

    qualityMenu.classList.remove("show");
    settingsMenu.classList.remove("show");

    speedMenu.classList.toggle("show");
  });

  speedMenu
    .querySelectorAll("[data-speed]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const speed =
          Number(button.dataset.speed);

        video.playbackRate = speed;

        speedButton.textContent =
          speed + "x";

        speedMenu.classList.remove("show");
      });

    });

  /* =========================================================
     Quality
     ========================================================= */

  qualityButton.addEventListener("click", () => {

    speedMenu.classList.remove("show");
    settingsMenu.classList.remove("show");

    qualityMenu.classList.toggle("show");
  });

  qualityMenu
    .querySelectorAll("[data-quality]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const quality =
          button.dataset.quality;

        changeQuality(quality);

      });

    });

  function changeQuality(quality) {

    if (!QUALITY_SOURCES.hasOwnProperty(quality)) {
      return;
    }

    currentQuality = quality;

    const source =
      QUALITY_SOURCES[quality];

    qualityMenu.classList.remove("show");

    if (!source) {

      qualityButton.textContent =
        quality;

      if (quality === "340p" ||
          quality === "460p" ||
          quality === "1080p") {

        alert(
          quality +
          " source is not configured yet."
        );
      }

      return;
    }

    const currentTime =
      video.currentTime;

    const wasPlaying =
      !video.paused;

    video.src = source;

    qualityButton.textContent =
      quality;

    const pageQuality =
      document.getElementById(
        "currentQuality"
      );

    if (pageQuality) {
      pageQuality.textContent =
        quality;
    }

    video.addEventListener(
      "loadedmetadata",
      function restorePosition() {

        video.currentTime =
          Math.min(
            currentTime,
            video.duration || currentTime
          );

        if (wasPlaying) {
          video.play().catch(() => {});
        }

        video.removeEventListener(
          "loadedmetadata",
          restorePosition
        );

      }
    );

    video.load();
  }

  /* =========================================================
     Settings
     ========================================================= */

  settingsButton.addEventListener("click", () => {

    qualityMenu.classList.remove("show");
    speedMenu.classList.remove("show");

    settingsMenu.classList.toggle("show");
  });

  settingsMenu
    .querySelector(".xkiss-reset-speed")
    .addEventListener("click", () => {

      video.playbackRate = 1;

      speedButton.textContent = "1x";

      settingsMenu.classList.remove("show");
    });

  settingsMenu
    .querySelector(".xkiss-cc-button")
    .addEventListener("click", () => {

      alert(
        "CC / subtitles are ready for future integration."
      );

    });

  /* =========================================================
     Picture in Picture
     ========================================================= */

  pipButton.addEventListener("click", async () => {

    try {

      if (
        document.pictureInPictureElement
      ) {

        await document.exitPictureInPicture();

      } else if (
        document.pictureInPictureEnabled
      ) {

        await video.requestPictureInPicture();

      }

    } catch (error) {

      console.error(
        "XKiss PiP error:",
        error
      );

    }

  });

  /* =========================================================
     Fullscreen
     ========================================================= */

  fullscreenButton.addEventListener(
    "click",
    async () => {

      try {

        if (!document.fullscreenElement) {

          if (player.requestFullscreen) {

            await player.requestFullscreen();

          } else if (
            video.webkitEnterFullscreen
          ) {

            video.webkitEnterFullscreen();

          }

        } else {

          await document.exitFullscreen();

        }

      } catch (error) {

        console.error(
          "XKiss fullscreen error:",
          error
        );

      }

    }
  );

  /* =========================================================
     Close Menus When Clicking Outside
     ========================================================= */

  document.addEventListener("click", event => {

    if (!player.contains(event.target)) {
      qualityMenu.classList.remove("show");
      speedMenu.classList.remove("show");
      settingsMenu.classList.remove("show");
    }

  });

  /* =========================================================
     Keyboard Controls
     ========================================================= */

  document.addEventListener("keydown", event => {

    if (
      event.target.tagName === "INPUT" ||
      event.target.tagName === "TEXTAREA"
    ) {
      return;
    }

    switch (event.key) {

      case " ":
        event.preventDefault();
        togglePlay();
        break;

      case "ArrowRight":
        video.currentTime =
          Math.min(
            video.duration || 0,
            video.currentTime + 5
          );
        break;

      case "ArrowLeft":
        video.currentTime =
          Math.max(
            0,
            video.currentTime - 5
          );
        break;

      case "m":
      case "M":
        video.muted = !video.muted;
        updateMuteButton();
        break;

      case "f":
      case "F":
        fullscreenButton.click();
        break;

    }

  });

  /* =========================================================
     Initial State
     ========================================================= */

  video.volume = 1;

  video.playbackRate = 1;

  updatePlayButton();

  updateMuteButton();

  updateProgress();

  console.log(
    "XKiss New Player JavaScript loaded."
  );

  console.log(
    "Available qualities:",
    "340p, 460p, 720p, 1080p"
  );

}
