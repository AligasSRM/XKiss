document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const HOME = window.XKissHome;

  if (!HOME) {
    console.warn("XKiss Home Hero: Home Core not loaded.");
    return;
  }

  function getHero() {
    return (
      document.querySelector(".hero") ||
      document.querySelector(".hero-section") ||
      document.querySelector("#hero")
    );
  }

  function getFeaturedVideoId(hero) {
    if (!hero) return null;

    return (
      hero.dataset.videoId ||
      hero.dataset.featuredId ||
      hero.querySelector("[data-video-id]")?.dataset.videoId ||
      hero.querySelector("[data-featured-id]")?.dataset.featuredId ||
      null
    );
  }

  function getHeroTitle(hero) {
    if (!hero) return "XKiss Featured";

    return (
      hero.querySelector(".hero-title")?.textContent.trim() ||
      hero.querySelector("h1")?.textContent.trim() ||
      "XKiss Featured"
    );
  }

  function openFeaturedVideo(hero) {
    const videoId = getFeaturedVideoId(hero);

    if (!videoId) {
      console.info(
        "XKiss Home Hero: Featured video is not connected yet.",
        getHeroTitle(hero)
      );
      return;
    }

    if (
      window.XKissHomeVideos &&
      typeof window.XKissHomeVideos.openVideo === "function"
    ) {
      window.XKissHomeVideos.openVideo(
        videoId,
        getHeroTitle(hero)
      );
      return;
    }

    window.location.href =
      `player.html?id=${encodeURIComponent(videoId)}`;
  }

  function bindHeroFeatured() {
    const hero = getHero();

    if (!hero) {
      console.info("XKiss Home Hero: Hero section not found.");
      return;
    }

    if (hero.dataset.homeHeroBound === "true") {
      return;
    }

    hero.dataset.homeHeroBound = "true";

    const featuredButtons = hero.querySelectorAll(
      ".featured-btn, .hero-watch-btn, .watch-featured, [data-hero-action='watch']"
    );

    featuredButtons.forEach(button => {
      if (button.dataset.homeHeroButtonBound === "true") {
        return;
      }

      button.dataset.homeHeroButtonBound = "true";

      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        openFeaturedVideo(hero);
      });
    });
  }

  function refreshHero() {
    bindHeroFeatured();
  }

  window.XKissHomeHero = {
    getHero,
    getFeaturedVideoId,
    getHeroTitle,
    openFeaturedVideo,
    bindHeroFeatured,
    refreshHero
  };

  bindHeroFeatured();

  console.log("XKiss Home Hero loaded.");
});
