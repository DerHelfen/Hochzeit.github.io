/* ==========================================================================
   Playlist Page JavaScript
   ========================================================================== */

// Webhook URL for notifications
const WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbwVvnlBunDRQ6kqP5x58ITN0R2rh6px6188MZVKlEheNdx_l6-JTzhXbX5aHaRhJZ4_FQ/exec";

// Song list
let songs = [];

/**
 * Add a song to the list
 */
function addSong() {
  const songInput = document.getElementById("songInput");
  const song = songInput.value.trim();

  if (song) {
    songs.push(song);
    songInput.value = "";
    renderSongs();
  }
}

/**
 * Remove a song from the list
 * @param {number} index - The index of the song to remove
 */
function removeSong(index) {
  songs.splice(index, 1);
  renderSongs();
}

/**
 * Render the song list
 */
function renderSongs() {
  const songItems = document.getElementById("songItems");
  const songCount = document.getElementById("songCount");

  songCount.textContent = `${songs.length} Song${
    songs.length !== 1 ? "s" : ""
  }`;

  if (songs.length === 0) {
    songItems.innerHTML = `
      <div class="empty-state" id="emptyState">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <p>Noch keine Songs hinzugefügt</p>
      </div>
    `;
    return;
  }

  songItems.innerHTML = songs
    .map((song, index) => {
      const isSpotifyLink = song.includes("spotify.com");
      const displayTitle = isSpotifyLink ? "Spotify Link" : song;
      const displayLink = isSpotifyLink ? song.substring(0, 50) + "..." : "";

      return `
      <div class="song-item">
        <span class="song-icon">${isSpotifyLink ? "🔗" : "🎵"}</span>
        <div class="song-info">
          <div class="song-title">${displayTitle}</div>
          ${displayLink ? `<div class="song-link">${displayLink}</div>` : ""}
        </div>
        <button type="button" class="remove-song" onclick="removeSong(${index})">×</button>
      </div>
    `;
    })
    .join("");
}

/**
 * Handle form submission
 * @param {Event} e - The submit event
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name) {
    alert("Bitte gib deinen Namen ein.");
    return;
  }

  if (songs.length === 0) {
    alert("Bitte füge mindestens einen Song hinzu.");
    return;
  }

  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.querySelector(".btn-text");
  const btnLoading = document.querySelector(".btn-loading");

  // Show loading state
  submitBtn.disabled = true;
  btnText.style.display = "none";
  btnLoading.style.display = "inline-flex";

  // Send to webhook
  const formData = new FormData();
  formData.append("type", "playlist");
  formData.append("name", name);
  formData.append("songs", JSON.stringify(songs));
  formData.append("message", message);

  fetch(WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    body: formData,
  }).catch(() => console.log("Notification failed"));

  // Show success after delay
  setTimeout(function () {
    document.getElementById("playlistForm").style.display = "none";
    document.getElementById("playlistSuccess").style.display = "block";

    submitBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
  }, 1500);
}

/**
 * Reset the form to initial state
 */
function resetForm() {
  songs = [];
  document.getElementById("playlistForm").reset();
  renderSongs();
  document.getElementById("playlistForm").style.display = "block";
  document.getElementById("playlistSuccess").style.display = "none";
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Allow Enter key to add song
  document
    .getElementById("songInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addSong();
      }
    });

  // Form submission
  document
    .getElementById("playlistForm")
    .addEventListener("submit", handleFormSubmit);
});
