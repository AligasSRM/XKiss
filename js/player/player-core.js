(function(){"use strict";
const XKISS_PLATFORM_CORE_BRIDGE = {
  version: "1.0.0",
  connected: true,
  activationAllowed: false,
  modules: {}
};

const DEFAULT_VIDEO_ID="video-001";
function getVideoId(){const p=new URLSearchParams(location.search);return p.get("id")||DEFAULT_VIDEO_ID}
function getVideoData(id){if(typeof getXKissVideo==="function")return getXKissVideo(id)||getXKissVideo(DEFAULT_VIDEO_ID);if(typeof XKISS_VIDEOS!=="undefined")return XKISS_VIDEOS[id]||XKISS_VIDEOS[DEFAULT_VIDEO_ID]||null;return null}
function getPlayerElements(){return{video:document.getElementById("video"),player:document.getElementById("player"),source:document.getElementById("videoSource")}}
function getInitialState(d){const p=d?.player||{};return{autoplay:Boolean(p.autoplay),muted:Boolean(p.muted),loop:Boolean(p.loop),preload:p.preload||"metadata",defaultSpeed:Number.isFinite(Number(p.defaultSpeed))?Number(p.defaultSpeed):1,fullscreen:p.fullscreen!==false,pictureInPicture:p.pictureInPicture!==false,captions:p.captions!==false}}
function applyInitialState(v,s){if(!v)return;v.autoplay=s.autoplay;v.muted=s.muted;v.loop=s.loop;v.preload=s.preload;v.playbackRate=s.defaultSpeed;s.autoplay?v.setAttribute("autoplay",""):v.removeAttribute("autoplay");s.muted?v.setAttribute("muted",""):v.removeAttribute("muted");s.loop?v.setAttribute("loop",""):v.removeAttribute("loop")}
function init(){const e=getPlayerElements();if(!e.video){console.error("XKiss: Core video element not found.");return}const videoId=getVideoId(),videoData=getVideoData(videoId);if(!videoData){console.error("XKiss: Core video data not found:",videoId);return}const state=getInitialState(videoData);applyInitialState(e.video,state);window.XKissPlayerCore={videoId,videoData,state,elements:e,getVideoId,getVideoData,getPlayerElements,getInitialState,platformCore:XKISS_PLATFORM_CORE_BRIDGE,registerModule(name,status="ready"){if(!name)return false;XKISS_PLATFORM_CORE_BRIDGE.modules[name]={status};return true;},getModuleStatus(){return {...XKISS_PLATFORM_CORE_BRIDGE.modules}},control(action,value){const v=e.video;if(!v)return{ok:false,error:"video-not-found"};switch(action){case"play":return{ok:true,action,request:v.play()};case"pause":v.pause();return{ok:true,action};case"mute":v.muted=Boolean(value);return{ok:true,action,value:v.muted};case"volume":{const n=Number(value);if(!Number.isFinite(n)||n<0||n>1)return{ok:false,error:"invalid-volume"};v.volume=n;return{ok:true,action,value:v.volume};}case"speed":{const n=Number(value);if(!Number.isFinite(n)||n<0.25||n>4)return{ok:false,error:"invalid-speed"};v.playbackRate=n;return{ok:true,action,value:v.playbackRate};}case"seek":{const n=Number(value);if(!Number.isFinite(n)||n<0)return{ok:false,error:"invalid-seek"};v.currentTime=Math.min(n,Number.isFinite(v.duration)?v.duration:n);return{ok:true,action,value:v.currentTime};}case"reload":v.load();return{ok:true,action};case"reset":v.pause();v.currentTime=0;v.playbackRate=state.defaultSpeed;v.muted=state.muted;return{ok:true,action};default:return{ok:false,error:"unsupported-action"};}}};console.log("XKiss Player Core loaded:",videoId)}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init):init();
})();
