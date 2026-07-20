"use strict";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
document.body.classList.add("is-loading");

const galleryImages = {
  photographer: [
    "assets/bilder/photographer-bestofs/DK5A3990_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A5073_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A5295-2_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A4139-2_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A5830_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A6142_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A7596_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A3520-2_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A4360_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A4568_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A4605_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A4806-2_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A5518_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A5686-2_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A6196_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A6477_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A6579_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A6658_websize.jpg",
    "assets/bilder/photographer-bestofs/DK5A6836_websize.jpg",
  ],
  photobox: [
    "assets/bilder/photobox-bestofs/IMG_0342_20260516_235812.jpg",
    "assets/bilder/photobox-bestofs/IMG_0297_20260516_232833.jpg",
    "assets/bilder/photobox-bestofs/IMG_0068_20260516_155810.jpg",
    "assets/bilder/photobox-bestofs/IMG_0259_20260516_224553.jpg",
    "assets/bilder/photobox-bestofs/IMG_0389_20260517_010924.jpg",
    "assets/bilder/photobox-bestofs/IMG_0417_20260517_013417.jpg",
    "assets/bilder/photobox-bestofs/IMG_0422_20260517_013721.jpg",
  ],
};

class CrossfadeGallery {
  constructor(section) {
    this.section = section;
    this.type = section.dataset.gallery;
    this.images = galleryImages[this.type] || [];
    this.layers = [...section.querySelectorAll(".gallery-layer")];
    this.statusCurrent = section.querySelector(".gallery-status span");
    this.pauseButton = section.querySelector('[data-gallery-action="pause"]');
    this.currentIndex = 0;
    this.activeLayerIndex = 0;
    this.timer = null;
    this.isVisible = false;
    this.userPaused = prefersReducedMotion.matches;
    this.requestId = 0;
    this.pointerStartX = null;

    if (this.images.length === 0 || this.layers.length < 2) {
      return;
    }

    this.bindControls();
    this.updatePauseButton();
    this.preload(this.currentIndex + 1);
  }

  bindControls() {
    this.section.querySelectorAll("[data-gallery-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.galleryAction;

        if (action === "previous") {
          this.show(this.currentIndex - 1);
          this.restart();
        } else if (action === "next") {
          this.show(this.currentIndex + 1);
          this.restart();
        } else if (action === "pause") {
          this.userPaused = !this.userPaused;
          this.updatePauseButton();
          this.restart();
        }
      });
    });

    this.section.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse") {
        this.pointerStartX = event.clientX;
      }
    });

    this.section.addEventListener("pointerup", (event) => {
      if (this.pointerStartX === null || event.pointerType === "mouse") {
        return;
      }

      const distance = event.clientX - this.pointerStartX;
      this.pointerStartX = null;

      if (Math.abs(distance) > 55) {
        this.show(this.currentIndex + (distance < 0 ? 1 : -1));
        this.restart();
      }
    });

    this.section.addEventListener("pointercancel", () => {
      this.pointerStartX = null;
    });
  }

  normalize(index) {
    return (index + this.images.length) % this.images.length;
  }

  show(requestedIndex) {
    const nextIndex = this.normalize(requestedIndex);

    if (nextIndex === this.currentIndex) {
      return;
    }

    const requestId = ++this.requestId;
    const nextLayerIndex = this.activeLayerIndex === 0 ? 1 : 0;
    const currentLayer = this.layers[this.activeLayerIndex];
    const nextLayer = this.layers[nextLayerIndex];
    const nextSource = this.images[nextIndex];

    const reveal = () => {
      if (requestId !== this.requestId) {
        return;
      }

      nextLayer.classList.add("is-active");
      currentLayer.classList.remove("is-active");
      this.activeLayerIndex = nextLayerIndex;
      this.currentIndex = nextIndex;
      this.updateStatus();
      this.preload(nextIndex + 1);
    };

    nextLayer.onload = reveal;
    nextLayer.onerror = () => {
      if (requestId === this.requestId) {
        this.show(nextIndex + 1);
      }
    };
    nextLayer.decoding = "async";
    nextLayer.src = nextSource;

    if (nextLayer.complete && nextLayer.naturalWidth > 0) {
      reveal();
    }
  }

  updateStatus() {
    if (this.statusCurrent) {
      this.statusCurrent.textContent = String(this.currentIndex + 1).padStart(
        2,
        "0",
      );
    }
  }

  updatePauseButton() {
    if (!this.pauseButton) {
      return;
    }

    this.pauseButton.classList.toggle("is-paused", this.userPaused);
    this.pauseButton.setAttribute(
      "aria-label",
      this.userPaused ? "Diashow fortsetzen" : "Diashow pausieren",
    );
  }

  preload(index) {
    const image = new Image();
    image.src = this.images[this.normalize(index)];
  }

  setVisible(isVisible) {
    this.isVisible = isVisible;
    this.restart();
  }

  restart() {
    window.clearInterval(this.timer);
    this.timer = null;

    if (
      this.isVisible &&
      !this.userPaused &&
      !prefersReducedMotion.matches &&
      !document.hidden
    ) {
      this.timer = window.setInterval(
        () => this.show(this.currentIndex + 1),
        5600,
      );
    }
  }
}

function initializeLoader() {
  const loadingScreen = document.getElementById("loadingScreen");

  if (!loadingScreen) {
    document.body.classList.remove("is-loading");
    return;
  }

  let hasHidden = false;
  const hideLoader = () => {
    if (hasHidden) {
      return;
    }

    hasHidden = true;
    loadingScreen.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
    window.setTimeout(() => loadingScreen.remove(), 900);
  };

  window.addEventListener("load", () => window.setTimeout(hideLoader, 380), {
    once: true,
  });
  window.setTimeout(hideLoader, 3500);
}

function initializeHero() {
  const hero = document.getElementById("start");
  const video = document.getElementById("heroVideo");
  const endCard = document.getElementById("heroEndCard");
  const soundToggle = document.getElementById("soundToggle");
  const soundLabel = soundToggle?.querySelector("span");
  const skipButton = document.getElementById("heroSkip");
  const replayButton = document.getElementById("videoReplay");
  const gratitudeSection = document.getElementById("danke");

  if (
    !hero ||
    !video ||
    !endCard ||
    !soundToggle ||
    !soundLabel ||
    !skipButton ||
    !replayButton ||
    !gratitudeSection
  ) {
    return;
  }

  let videoAvailable = false;
  let needsManualStart = false;
  let transitionTimer = null;
  let scrollTimer = null;

  const updateSoundButton = () => {
    soundToggle.classList.toggle("is-unmuted", !video.muted);
    soundLabel.textContent = video.muted
      ? "Ton einschalten"
      : "Ton ausschalten";
    soundToggle.setAttribute("aria-label", soundLabel.textContent);
  };

  const markVideoUnavailable = () => {
    if (!videoAvailable) {
      hero.classList.add("video-unavailable");
      video.removeAttribute("autoplay");
    }
  };

  const showFinalMessage = () => {
    window.clearTimeout(transitionTimer);
    window.clearTimeout(scrollTimer);
    hero.classList.add("show-end-card");
    endCard.setAttribute("aria-hidden", "false");
    soundToggle.setAttribute("aria-hidden", "true");

    if (!prefersReducedMotion.matches) {
      transitionTimer = window.setTimeout(() => {
        hero.classList.add("is-leaving");
        scrollTimer = window.setTimeout(
          () =>
            gratitudeSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          850,
        );
      }, 5200);
    }
  };

  const replayVideo = () => {
    window.clearTimeout(transitionTimer);
    window.clearTimeout(scrollTimer);
    hero.classList.remove("show-end-card", "is-leaving");
    endCard.setAttribute("aria-hidden", "true");
    soundToggle.setAttribute("aria-hidden", "false");
    video.currentTime = 0;

    video
      .play()
      .then(() => {
        needsManualStart = false;
        updateSoundButton();
      })
      .catch(() => {
        needsManualStart = true;
        soundLabel.textContent = "Video starten";
        soundToggle.setAttribute("aria-label", "Video starten");
      });
  };

  video.addEventListener("loadeddata", () => {
    videoAvailable = true;
    hero.classList.remove("video-unavailable");
  });

  video.addEventListener("playing", () => {
    videoAvailable = true;
    needsManualStart = false;
    hero.classList.remove("video-unavailable");
    updateSoundButton();
  });

  video.addEventListener("ended", showFinalMessage);
  video.addEventListener("error", markVideoUnavailable);
  video
    .querySelectorAll("source")
    .forEach((source) =>
      source.addEventListener("error", markVideoUnavailable),
    );

  const playAttempt = video.play();
  if (playAttempt) {
    playAttempt.catch(() => {
      if (video.error) {
        markVideoUnavailable();
      } else {
        needsManualStart = true;
        soundLabel.textContent = "Video starten";
        soundToggle.setAttribute("aria-label", "Video starten");
      }
    });
  }

  soundToggle.addEventListener("click", () => {
    if (needsManualStart || video.paused) {
      video
        .play()
        .then(() => {
          needsManualStart = false;
          updateSoundButton();
        })
        .catch(markVideoUnavailable);
      return;
    }

    video.muted = !video.muted;
    video.volume = 0.78;
    updateSoundButton();
  });

  replayButton.addEventListener("click", replayVideo);

  skipButton.addEventListener("click", () => {
    video.pause();
    window.clearTimeout(transitionTimer);
    window.clearTimeout(scrollTimer);
    gratitudeSection.scrollIntoView({
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
  });

  const mailboxAudio = document.querySelector(".audio-card audio");
  mailboxAudio?.addEventListener("play", () => {
    if (!video.paused) {
      video.pause();
    }
  });

  window.setTimeout(() => {
    if (
      !videoAvailable &&
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      markVideoUnavailable();
    }
  }, 5000);

  updateSoundButton();
}

function initializePageMotion() {
  const revealElements = document.querySelectorAll(".reveal");

  if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -45px 0px",
    },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

function initializeNavigation() {
  const header = document.getElementById("siteHeader");
  const scrollTop = document.getElementById("scrollTop");

  if (!header || !scrollTop) {
    return;
  }

  let frameRequested = false;
  const updateNavigation = () => {
    const isScrolled = window.scrollY > 70;
    header.classList.toggle("is-scrolled", isScrolled);
    scrollTop.classList.toggle(
      "is-visible",
      window.scrollY > window.innerHeight * 0.75,
    );
    frameRequested = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!frameRequested) {
        frameRequested = true;
        window.requestAnimationFrame(updateNavigation);
      }
    },
    { passive: true },
  );

  scrollTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    });
  });

  updateNavigation();
}

function initializeGalleries() {
  const galleries = [...document.querySelectorAll("[data-gallery]")].map(
    (section) => new CrossfadeGallery(section),
  );

  if (!("IntersectionObserver" in window)) {
    galleries.forEach((gallery) => gallery.setVisible(true));
    return galleries;
  }

  const galleryObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const gallery = galleries.find((item) => item.section === entry.target);
        gallery?.setVisible(entry.isIntersecting);
      });
    },
    { threshold: 0.2 },
  );

  galleries.forEach((gallery) => galleryObserver.observe(gallery.section));
  return galleries;
}

initializeLoader();

document.addEventListener("DOMContentLoaded", () => {
  initializeHero();
  initializePageMotion();
  initializeNavigation();
  const galleries = initializeGalleries();

  document.getElementById("currentYear").textContent = String(
    new Date().getFullYear(),
  );

  document.addEventListener("visibilitychange", () => {
    galleries.forEach((gallery) => gallery.restart());
  });

  prefersReducedMotion.addEventListener?.("change", () => {
    galleries.forEach((gallery) => {
      gallery.userPaused = prefersReducedMotion.matches;
      gallery.updatePauseButton();
      gallery.restart();
    });
  });
});
