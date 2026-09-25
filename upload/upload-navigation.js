(() => {
  "use strict";

  function initialize() {
    document.querySelectorAll(".upload-nav a").forEach(link => {
      link.addEventListener("click", () => {
        document.body.classList.add("navigating");
      });
    });
  }

  window.addEventListener("DOMContentLoaded", initialize);
})();