document.addEventListener("DOMContentLoaded",()=>{
  "use strict"; const A=window.XKissAccount;if(!A)return; const state=A.ensure();
  document.querySelectorAll("[data-account-action]").forEach(el=>el.addEventListener("click",()=>{
    const action=el.dataset.accountAction;
    if(action==="clear-history"){state.history=[];A.write(state);el.textContent="History Cleared"}
    if(action==="clear-favorites"){state.favorites=[];A.write(state);el.textContent="Favorites Cleared"}
    if(action==="toggle-autoplay"){state.settings.autoplay=!state.settings.autoplay;A.write(state);el.textContent=state.settings.autoplay?"Autoplay: On":"Autoplay: Off"}
  }));
});
