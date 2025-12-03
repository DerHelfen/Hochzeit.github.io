/* ==========================================================================
   Easter Egg Page JavaScript
   ========================================================================== */

// Webhook URL for notifications
const WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbwVvnlBunDRQ6kqP5x58ITN0R2rh6px6188MZVKlEheNdx_l6-JTzhXbX5aHaRhJZ4_FQ/exec";

/**
 * Submit the user's name
 */
function submitName() {
  const nameInput = document.getElementById("nameInput");
  const thankYou = document.getElementById("thankYou");
  const name = nameInput.value.trim();

  if (name) {
    // Store name in localStorage as backup
    const names = JSON.parse(localStorage.getItem("easterEggNames") || "[]");
    names.push({
      name: name,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem("easterEggNames", JSON.stringify(names));

    // Send notification via secure webhook (token is server-side)
    const formData = new FormData();
    formData.append("type", "easter_egg");
    formData.append("name", name);

    fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    }).catch(() => console.log("Notification failed"));

    // Show thank you message
    nameInput.value = "";
    nameInput.style.display = "none";
    document.querySelector(".submit-btn").style.display = "none";
    thankYou.style.display = "block";

    // Optional: redirect back after a few seconds
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  }
}

// Initialize event listeners when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Allow Enter key to submit
  document
    .getElementById("nameInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        submitName();
      }
    });
});
