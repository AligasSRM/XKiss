(function(){"use strict";
function init(){const video=document.getElementById("video"),speedBtn=document.getElementById("speedBtn"),speedMenu=document.getElementById("speedMenu"),settingsMenu=document.getElementById("settingsMenu");if(!video){console.error("XKiss: Speed system video element not found.");return}const p=new URLSearchParams(location.search),id=p.get("id")||"video-001";let d=null;if(typeof getXKissVideo==="function")d=getXKissVideo(id)||getXKissVideo("video-001");else if(typeof XKISS_VIDEOS!=="undefined")d=XKISS_VIDEOS[id]||XKISS_VIDEOS["video-001"];const speeds=Array.isArray(d?.player?.availableSpeeds)?d.player.availableSpeeds.map(Number).filter(Number.isFinite):[.5,.75,1,1.25,1.5,2];let current=Number.isFinite(Number(d?.player?.defaultSpeed))?Number(d.player.defaultSpeed):1;if(!speeds.includes(current))current=1;
function update(){if(speedBtn)speedBtn.textContent=current+"x"}
function setSpeed(s){s=Number(s);if(!Number.isFinite(s)||!speeds.includes(s))return;current=s;video.playbackRate=s;update();speedMenu?.classList.remove("show")}
if(speedBtn&&speedMenu)speedBtn.addEventListener("click",e=>{e.stopPropagation();speedMenu.classList.toggle("show");document.getElementById("qualityMenu")?.classList.remove("show");settingsMenu?.classList.remove("show")});
speedMenu?.querySelectorAll("[data-speed]").forEach(b=>{const s=Number(b.dataset.speed);if(!speeds.includes(s)){b.style.display="none";return}b.addEventListener("click",()=>setSpeed(s))});
video.playbackRate=current;update();console.log("XKiss Player Speed loaded:",current)}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init):init();
})();
