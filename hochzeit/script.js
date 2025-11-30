// Datum der Hochzeit anpassen:
const weddingDate = new Date("2026-05-16T14:00:00");

function updateCountdown() {
  const now = new Date();
  const diff = weddingDate - now;

  if (diff <= 0) {
    document.getElementById("countdown").innerHTML =
      "Heute ist unser großer Tag! 💍";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  document.getElementById(
    "countdown"
  ).innerHTML = `${days} Tage · ${hours} Std · ${minutes} Min · ${seconds} Sek`;
}

setInterval(updateCountdown, 1000);
updateCountdown();

// Image Gallery Navigation
const galleryImages = [
  "bilder/bleckmannshof_1.jpg",
  "bilder/bleckmannshof_2.jpg",
  "bilder/bleckmannshof_3.jpg",
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
      entry.target.classList.add("schedule-item-visible");
    }
  });
}, observerOptions);

// Observe all schedule items when page loads
window.addEventListener("DOMContentLoaded", () => {
  const scheduleItems = document.querySelectorAll(".schedule-item");
  scheduleItems.forEach((item) => {
    observer.observe(item);
  });
});
