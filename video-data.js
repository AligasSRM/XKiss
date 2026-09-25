/* =========================================================
   XKiss Video Data
   Professional Video Data Schema V2

   Purpose:
   - Central source of video metadata
   - Compatible with XKiss Player
   - Ready for future Search / Creator / Comments /
     Analytics / Download / Sharing systems

   IMPORTANT:
   - Only real video sources are added.
   - Unsupported or unknown technical data stays null.
   - Device/browser capabilities are NOT stored here.
   - Runtime capabilities belong to player.js.
   ========================================================= */


const XKISS_VIDEOS = {


  /* =======================================================
     VIDEO 001
     ======================================================= */

  "video-001": {

    /* =====================================================
       IDENTITY
       ===================================================== */

    id: "video-001",

    title: "XKiss Test Video",

    creator: "XKiss Creator",

    creatorId: "creator-001",

    category: "Test",

    tags: [
      "XKiss",
      "Video",
      "Test"
    ],


    /* =====================================================
       BASIC INFORMATION
       ===================================================== */

    description:
      "XKiss test video for the new video player.",

    language: "en",

    duration: "00:04",

    publishedAt: null,

    updatedAt: null,


    /* =====================================================
       MEDIA
       ===================================================== */

    media: {

      type: "video",

      poster: "",

      thumbnail: "",

      mimeType: "video/mp4",

      codec: null,

      width: null,

      height: null,

      frameRate: null,

      bitrate: null

    },


    /* =====================================================
       VIDEO SOURCES
       =====================================================

       IMPORTANT:
       Approved quality levels ONLY:

       340p
       460p
       720p
       1080p
       ===================================================== */

    sources: {

      "340p": "",

      "460p": "",

      "720p":
        "https://aligassrm.github.io/XKiss/20260923_234200-3.mp4",

      "1080p": ""

    },


    /* =====================================================
       QUALITY SYSTEM
       ===================================================== */

    quality: {

      default: "720p",

      available: [
        "340p",
        "460p",
        "720p",
        "1080p"
      ]

    },


    /* =====================================================
       PLAYER CONFIGURATION
       ===================================================== */

    player: {

      autoplay: false,

      muted: false,

      loop: false,

      preload: "metadata",

      fullscreen: true,

      landscapeOnFullscreen: true,

      pictureInPicture: true,

      captions: true,

      remotePlayback: true,

      defaultSpeed: 1,

      availableSpeeds: [
        0.5,
        0.75,
        1,
        1.25,
        1.5,
        2
      ]

    },


    /* =====================================================
       CAPTIONS / SUBTITLES
       ===================================================== */

    captions: {

      available: false,

      tracks: []

    },


    /* =====================================================
       STATISTICS
       =====================================================

       These are currently local/default values.

       In the production platform these values will come
       from the XKiss backend/database.
       ===================================================== */

    statistics: {

      views: 0,

      likes: 0,

      dislikes: 0,

      comments: 0,

      shares: 0,

      downloads: 0,

      favorites: 0

    },


    /* =====================================================
       USER STATE
       =====================================================

       This represents the current user's state.

       Later this will come from the user's account/session.
       ===================================================== */

    userState: {

      liked: false,

      disliked: false,

      saved: false,

      downloaded: false,

      watchProgress: 0,

      lastPosition: 0

    },


    /* =====================================================
       CREATOR
       ===================================================== */

    creatorInfo: {

      id: "creator-001",

      name: "XKiss Creator",

      username: "xkisscreator",

      avatar: "",

      verified: false,

      subscribers: 0

    },


    /* =====================================================
       DISCOVERY
       ===================================================== */

    discovery: {

      relatedVideos: [],

      category: "Test",

      tags: [
        "XKiss",
        "Video",
        "Test"
      ]

    },


    /* =====================================================
       DOWNLOAD
       ===================================================== */

    download: {

      enabled: true,

      requiresPermission: false,

      availableQualities: [
        "340p",
        "460p",
        "720p",
        "1080p"
      ]

    },


    /* =====================================================
       SHARING
       ===================================================== */

    sharing: {

      enabled: true,

      canonicalUrl:
        "https://aligassrm.github.io/XKiss/player.html?id=video-001",

      shareUrl:
        "https://aligassrm.github.io/XKiss/player.html?id=video-001"

    },


    /* =====================================================
       MODERATION / SAFETY
       ===================================================== */

    moderation: {

      visibility: "public",

      ageRestricted: true,

      reportEnabled: true,

      reportReasons: [

        "Spam",

        "Misleading",

        "Copyright",

        "Harassment",

        "Violence",

        "Illegal Content",

        "Other"

      ]

    },


    /* =====================================================
       VIDEO INFORMATION
       ===================================================== */

    videoInfo: {

      videoId: "video-001",

      format: "MP4",

      mimeType: "video/mp4",

      codec: null,

      resolution: null,

      bitrate: null,

      frameRate: null,

      fileSize: null

    },


    /* =====================================================
       CHAPTERS
       ===================================================== */

    chapters: [],


    /* =====================================================
       COMMENTS
       ===================================================== */

    comments: []


  }

};


/* =========================================================
   XKiss VIDEO DATA HELPERS
   ========================================================= */


/**
 * Return a video by ID.
 */
function getXKissVideo(videoId) {

  if (
    !videoId ||
    typeof XKISS_VIDEOS === "undefined"
  ) {

    return null;

  }

  return XKISS_VIDEOS[videoId] || null;

}


/**
 * Return all videos.
 */
function getAllXKissVideos() {

  if (
    typeof XKISS_VIDEOS === "undefined"
  ) {

    return [];

  }

  return Object.values(XKISS_VIDEOS);

}


/**
 * Return the configured source for a quality.
 */
function getXKissVideoSource(
  videoId,
  quality
) {

  const video =
    getXKissVideo(videoId);

  if (!video || !video.sources) {

    return "";

  }

  return video.sources[quality] || "";

}


/**
 * Check whether a quality is configured.
 */
function isXKissQualityAvailable(
  videoId,
  quality
) {

  const source =
    getXKissVideoSource(
      videoId,
      quality
    );

  return Boolean(source);

    }
