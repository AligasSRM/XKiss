(function(){"use strict";
const DEFAULT_VIDEO_ID="video-001";
function getVideoId(){const p=new URLSearchParams(location.search);return p.get("id")||DEFAULT_VIDEO_ID}
function getVideoData(id){if(typeof getXKissVideo==="function")return getXKissVideo(id)||getXKissVideo(DEFAULT_VIDEO_ID);if(typeof XKISS_VIDEOS!=="undefined")return XKISS_VIDEOS[id]||XKISS_VIDEOS[DEFAULT_VIDEO_ID]||null;return null}
function getPlayerElements(){return{video:document.getElementById("video"),player:document.getElementById("player"),source:document.getElementById("videoSource")}}
function getInitialState(d){const p=d?.player||{};return{autoplay:Boolean(p.autoplay),muted:Boolean(p.muted),loop:Boolean(p.loop),preload:p.preload||"metadata",defaultSpeed:Number.isFinite(Number(p.defaultSpeed))?Number(p.defaultSpeed):1,fullscreen:p.fullscreen!==false,pictureInPicture:p.pictureInPicture!==false,captions:p.captions!==false}}
function applyInitialState(v,s){if(!v)return;v.autoplay=s.autoplay;v.muted=s.muted;v.loop=s.loop;v.preload=s.preload;v.playbackRate=s.defaultSpeed;s.autoplay?v.setAttribute("autoplay",""):v.removeAttribute("autoplay");s.muted?v.setAttribute("muted",""):v.removeAttribute("muted");s.loop?v.setAttribute("loop",""):v.removeAttribute("loop")}
function init(){const e=getPlayerElements();if(!e.video){console.error("XKiss: Core video element not found.");return}const videoId=getVideoId(),videoData=getVideoData(videoId);if(!videoData){console.error("XKiss: Core video data not found:",videoId);return}const state=getInitialState(videoData);applyInitialState(e.video,state);window.XKissPlayerCore={videoId,videoData,state,elements:e,getVideoId,getVideoData,getPlayerElements,getInitialState};console.log("XKiss Player Core loaded:",videoId)}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init):init();
})();
