(function(){ "use strict";

function init(){
  const p=document.getElementById("player");
  const b=document.getElementById("fullscreenBtn");

  if(!p||!b){
    console.error("XKiss: Fullscreen elements not found.");
    return;
  }

  const full=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);

  async function enter(){
    try{
      if(p.requestFullscreen){await p.requestFullscreen();return;}
      if(p.webkitRequestFullscreen){p.webkitRequestFullscreen();return;}
      console.warn("XKiss: Fullscreen unavailable.");
    }catch(e){console.error("XKiss fullscreen error:",e);}
  }

  async function exit(){
    try{
      if(document.exitFullscreen){await document.exitFullscreen();return;}
      if(document.webkitExitFullscreen){document.webkitExitFullscreen();}
    }catch(e){console.error("XKiss fullscreen exit error:",e);}
  }

  b.addEventListener("click",async e=>{
    e.preventDefault();
    e.stopPropagation();
    full()?await exit():await enter();
  });

  function update(){
    const active=full();
    b.classList.toggle("active",active);
    b.setAttribute("aria-pressed",active?"true":"false");
    b.title=active?"Exit Fullscreen":"Fullscreen";
  }

  document.addEventListener("fullscreenchange",update);
  document.addEventListener("webkitfullscreenchange",update);
  update();

  window.XKissPlayerFullscreen={isFullscreen:full,enterFullscreen:enter,exitFullscreen:exit};
  console.log("XKiss Player Fullscreen loaded.");
}

document.readyState==="loading"
  ?document.addEventListener("DOMContentLoaded",init)
  :init();

})();
