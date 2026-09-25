document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const HOME = {
    version: "1.0.0",
    ready: true
  };

  const qs = (selector, root = document) =>
    root.querySelector(selector);

  const qsa = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const getSection = id =>
    document.getElementById(id);

  function scrollToSection(id) {
    const section = getSection(id);

    if (!section) return;

    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function closeOpenMenus() {
    qsa(".quality-menu.show").forEach(menu => {
      menu.classList.remove("show");
    });

    qsa(".settings-menu.show").forEach(menu => {
      menu.classList.remove("show");
    });

    qsa(".speed-menu.show").forEach(menu => {
      menu.classList.remove("show");
    });
  }

  function bindSectionLinks() {
    qsa('a[href^="#"]').forEach(link => {
      if (link.dataset.homeCoreBound === "true") return;

      link.dataset.homeCoreBound = "true";

      link.addEventListener("click", event => {
        const id = link.getAttribute("href");

        if (!id || id === "#") return;

        const section = getSection(id.substring(1));

        if (!section) return;

        event.preventDefault();
        scrollToSection(id.substring(1));
      });
    });
  }

  function bindGlobalClick() {
    document.addEventListener("click", event => {
      const target = event.target;

      if (
        target.closest(".quality") ||
        target.closest(".settings") ||
        target.closest(".speed")
      ) {
        return;
      }

      closeOpenMenus();
    });
  }

  function bindKeyboardNavigation() {
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;

      closeOpenMenus();
    });
  }

  function markHomeReady() {
    document.documentElement.dataset.xkissHome = "ready";
    document.body.dataset.xkissHome = "ready";
  }

  window.XKissHome = {
    version: HOME.version,
    qs,
    qsa,
    getSection,
    scrollToSection,
    closeOpenMenus
  };

  bindSectionLinks();
  bindGlobalClick();
  bindKeyboardNavigation();
  markHomeReady();

  console.log("XKiss Home Core loaded.");
});
