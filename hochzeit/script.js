// Datum der Hochzeit anpassen:
const weddingDate = new Date("2026-05-16T14:00:00");

function updateCountdown() {
  const now = new Date();
  const diff = weddingDate - now;

  if (diff <= 0) {
    document.getElementById("countdown").innerHTML =
      "<div style='font-size: 2rem; color: #2d5016;'>Heute ist unser großer Tag! 💍</div>";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  // Update individual countdown elements
  document.getElementById("days").textContent = String(days).padStart(2, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(
    2,
    "0"
  );
  document.getElementById("seconds").textContent = String(seconds).padStart(
    2,
    "0"
  );
}

setInterval(updateCountdown, 1000);
updateCountdown();

// Loading Screen Management
window.addEventListener("load", function () {
  const loadingScreen = document.getElementById("loading-screen");
  const images = document.querySelectorAll(".slideshow img[loading='eager']");
  let loadedImages = 0;

  // Function to check if all images are loaded
  function checkAllImagesLoaded() {
    loadedImages++;
    if (loadedImages >= images.length) {
      // Add a small delay for smoother transition
      setTimeout(() => {
        loadingScreen.classList.add("fade-out");
        // Remove from DOM after animation
        setTimeout(() => {
          loadingScreen.remove();
        }, 500);
      }, 300);
    }
  }

  // Add load event listeners to eager-loaded images
  images.forEach((img) => {
    if (img.complete) {
      checkAllImagesLoaded();
    } else {
      img.addEventListener("load", checkAllImagesLoaded);
      img.addEventListener("error", checkAllImagesLoaded); // Handle errors gracefully
    }
  });

  // Fallback: hide loading screen after 5 seconds regardless
  setTimeout(() => {
    if (!loadingScreen.classList.contains("fade-out")) {
      loadingScreen.classList.add("fade-out");
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }
  }, 5000);
});

// Image Gallery Navigation
const galleryImages = [
  "bilder/bleckmannshof/bleckmannshof_1.jpg",
  "bilder/bleckmannshof/bleckmannshof_2.jpg",
  "bilder/bleckmannshof/bleckmannshof_3.jpg",
  "bilder/bleckmannshof/bleckmannshof_4.jpg",
];
let currentImageIndex = 0;

function changeImage(direction) {
  currentImageIndex += direction;

  if (currentImageIndex < 0) {
    currentImageIndex = galleryImages.length - 1;
  } else if (currentImageIndex >= galleryImages.length) {
    currentImageIndex = 0;
  }

  document.getElementById("galleryImage").src =
    galleryImages[currentImageIndex];
}

// Scroll Animation for Schedule Items
const observerOptions = {
  threshold: 0.2,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("timeline-item-visible");
    }
  });
}, observerOptions);

// Observe all timeline items when page loads
window.addEventListener("DOMContentLoaded", () => {
  const timelineItems = document.querySelectorAll(".timeline-item");
  timelineItems.forEach((item) => {
    observer.observe(item);
  });
});

// Scroll to Top Button
const scrollToTopBtn = document.getElementById("scrollToTop");

// Show button when scrolling down
window.addEventListener("scroll", () => {
  if (window.pageYOffset > 300) {
    scrollToTopBtn.classList.add("show");
  } else {
    scrollToTopBtn.classList.remove("show");
  }
});

// Scroll to top when button is clicked
scrollToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// Easter Egg Trigger
let easterEggClicks = 0;
const easterEggTrigger = document.getElementById("easterEggTrigger");

if (easterEggTrigger) {
  easterEggTrigger.addEventListener("click", () => {
    easterEggClicks++;

    // Add a subtle animation on click
    easterEggTrigger.style.transform = "scale(1.2)";
    setTimeout(() => {
      easterEggTrigger.style.transform = "scale(1)";
    }, 200);

    // After 3 clicks, redirect to Easter egg page
    if (easterEggClicks === 3) {
      window.location.href = "easteregg.html";
    }
  });

  // Add transition for smooth animation
  easterEggTrigger.style.transition = "transform 0.2s ease";
}

// Background Music Control
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
let isPlaying = false;

// Try to autoplay when page loads (after user interaction)
window.addEventListener("load", () => {
  // Attempt to play after a short delay
  setTimeout(() => {
    bgMusic
      .play()
      .then(() => {
        isPlaying = true;
        musicToggle.classList.add("playing");
      })
      .catch(() => {
        // Autoplay was prevented, user needs to click
        isPlaying = false;
        musicToggle.classList.remove("playing");
      });
  }, 500);
});

// Toggle music on button click
musicToggle.addEventListener("click", () => {
  if (isPlaying) {
    bgMusic.pause();
    musicToggle.classList.remove("playing");
  } else {
    bgMusic.play();
    musicToggle.classList.add("playing");
  }
  isPlaying = !isPlaying;
});

// Set initial volume to a pleasant level
bgMusic.volume = 0.3;
