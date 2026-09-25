const XKISS_VIDEOS = {

  "video-001": {

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

    description: "XKiss test video for the new video player.",

    language: "en",

    duration: "00:04",

    publishedAt: null,

    updatedAt: null,

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

    sources: {

      "340p": "",

      "460p": "",

      "720p":
        "https://aligassrm.github.io/XKiss/20260923_234200-3.mp4",

      "1080p": ""

    },

    quality: {

      default: "720p",

      available: [
        "340p",
        "460p",
        "720p",
        "1080p"
      ]

    },

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

    captions: {

      available: false,

      tracks: []

    },

    statistics: {

      views: 0,

      likes: 0,

      dislikes: 0,

      comments: 0,

      shares: 0,

      downloads: 0,

      favorites: 0

    },

    userState: {

      liked: false,

      disliked: false,

      saved: false,

      downloaded: false,

      watchProgress: 0,

      lastPosition: 0

    },

    creatorInfo: {

      id: "creator-001",

      name: "XKiss Creator",

      username: "xkisscreator",

      avatar: "",

      verified: false,

      subscribers: 0

    },

    discovery: {

      relatedVideos: [],

      category: "Test",

      tags: [
        "XKiss",
        "Video",
        "Test"
      ]

    },

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

    sharing: {

      enabled: true,

      canonicalUrl:
        "https://aligassrm.github.io/XKiss/player.html?id=video-001",

      shareUrl:
        "https://aligassrm.github.io/XKiss/player.html?id=video-001"

    },

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

    chapters: [],

    comments: []

  }

};


function getXKissVideo(videoId) {

  if (!videoId || typeof XKISS_VIDEOS === "undefined") {

    return null;

  }

  return XKISS_VIDEOS[videoId] || null;

}


function getAllXKissVideos() {

  if (typeof XKISS_VIDEOS === "undefined") {

    return [];

  }

  return Object.values(XKISS_VIDEOS);

}


function getXKissVideoSource(videoId, quality) {

  const video = getXKissVideo(videoId);

  if (!video || !video.sources) {

    return "";

  }

  return video.sources[quality] || "";

}


function isXKissQualityAvailable(videoId, quality) {

  const source = getXKissVideoSource(videoId, quality);

  return Boolean(source);

       }
