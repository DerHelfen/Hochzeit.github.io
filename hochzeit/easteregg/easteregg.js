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
      window.location.href = "../index.html";
    }, 2000);
  }
}

/* ==========================================================================
   Easter Easter Egg - Wedding Runner Game
   ========================================================================== */

// Secret trigger variables
let clickCount = 0;
let clickTimer = null;
const CLICKS_TO_UNLOCK = 5;
const CLICK_TIMEOUT = 2000; // 2 seconds to complete clicks

// Game variables
let canvas, ctx;
let gameRunning = false;
let gameOver = false;
let score = 0;
let highScore = parseInt(localStorage.getItem("weddingRunnerHighScore")) || 0;
let animationId = null;
let playerName = "";

// Player (Bride/Groom emoji)
const player = {
  x: 50,
  y: 180,
  width: 40,
  height: 40,
  velocityY: 0,
  jumping: false,
  emoji: "👰",
  groundY: 180, // Will be updated dynamically
};

// Game physics
const gravity = 0.6;
const jumpForce = -12;

// Obstacles
let obstacles = [];
const obstacleEmojis = ["🎂", "💐", "🍾", "🥂", "💒", "🎁"];
let obstacleTimer = 0;
let obstacleInterval = 70; // Frames between obstacles
let gameSpeed = 6;

// Ground decoration
let groundOffset = 0;

/**
 * Show the hidden game
 */
function showGame() {
  document.getElementById("easterEggContainer").classList.add("hidden");
  document.getElementById("gameContainer").classList.add("active");
  // Show name entry first
  document.getElementById("gameNameEntry").style.display = "block";
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("playerNameInput").value = "";
  document.getElementById("playerNameInput").focus();
}

/**
 * Set player name and start game
 */
function setPlayerName() {
  const nameInput = document.getElementById("playerNameInput");
  const name = nameInput.value.trim();

  if (!name) {
    nameInput.focus();
    return;
  }

  playerName = name;
  document.getElementById("currentPlayerName").textContent = name;
  document.getElementById("gameNameEntry").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";

  // Fetch latest champion info
  fetchChampion();

  initGame();
}

/**
 * Hide the game and return to easter egg
 */
function hideGame() {
  document.getElementById("gameContainer").classList.remove("active");
  document.getElementById("easterEggContainer").classList.remove("hidden");
  document.getElementById("gameNameEntry").style.display = "block";
  document.getElementById("gameScreen").style.display = "none";
  playerName = "";
  stopGame();
}

/**
 * Submit highscore to Telegram bot
 */
function submitHighscore() {
  const finalScore = Math.floor(score / 10);

  // Debug log
  console.log("Submitting highscore:", { name: playerName, score: finalScore });

  // Send to webhook
  const formData = new FormData();
  formData.append("type", "game_highscore");
  formData.append("name", playerName);
  formData.append("score", finalScore.toString());

  fetch(WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    body: formData,
  })
    .then((response) => {
      console.log("Highscore submitted, response:", response);
    })
    .catch((error) => {
      console.error("Highscore submission failed:", error);
    });

  // Refresh champion data after submission (delay to allow server processing)
  setTimeout(() => {
    console.log("Refreshing champion data after score submission...");
    fetchChampion();
  }, 2000); // 2 second delay to ensure server has processed the new score
}

/**
 * Fetch current champion from server
 */
function fetchChampion() {
  console.log("Fetching champion from:", WEBHOOK_URL + "?action=champion");

  fetch(WEBHOOK_URL + "?action=champion")
    .then((response) => {
      console.log("Champion response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Champion data received:", data);
      document.getElementById("championName").textContent =
        data.name || "Noch kein Champion";
      document.getElementById("championScore").textContent = data.score || "0";
    })
    .catch((error) => {
      console.error("Failed to fetch champion:", error);
      document.getElementById("championName").textContent =
        "Verbindung fehlgeschlagen";
      document.getElementById("championScore").textContent = "0";
    });
}

/**
 * Initialize the game
 */
function initGame() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // Set canvas size based on container with proper device pixel ratio handling
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const devicePixelRatio = window.devicePixelRatio || 1;

  // Set the canvas display size (CSS pixels)
  canvas.style.width = containerWidth + "px";
  canvas.style.height = containerHeight + "px";

  // Set the canvas internal size (actual pixels for crisp rendering)
  canvas.width = containerWidth * devicePixelRatio;
  canvas.height = containerHeight * devicePixelRatio;

  // Scale the context to match device pixel ratio
  ctx.scale(devicePixelRatio, devicePixelRatio);

  // Update game physics for new canvas size (use display size, not internal size)
  player.y = containerHeight - 100;
  player.groundY = containerHeight - 100;

  // Update highscore display
  document.getElementById("highscore").textContent = highScore;
  document.getElementById("score").textContent = "0";

  // Fetch current champion
  fetchChampion();

  // Reset game state
  resetGame();

  // Draw initial frame
  draw();
}

/**
 * Reset game to initial state
 */
function resetGame() {
  gameRunning = false;
  gameOver = false;
  score = 0;
  obstacles = [];
  obstacleTimer = 0;
  obstacleInterval = 70;
  gameSpeed = 6;

  player.y = player.groundY;
  player.velocityY = 0;
  player.jumping = false;

  document.getElementById("gameOverlay").classList.remove("hidden");
  document.getElementById("gameStartText").style.display = "block";
  document.getElementById("gameOverText").style.display = "none";
  document.getElementById("score").textContent = "0";
}

/**
 * Start the game
 */
function startGame() {
  if (gameRunning) return;

  gameRunning = true;
  gameOver = false;
  document.getElementById("gameOverlay").classList.add("hidden");

  gameLoop();
}

/**
 * Stop the game
 */
function stopGame() {
  gameRunning = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

/**
 * Main game loop
 */
function gameLoop() {
  if (!gameRunning) return;

  update();
  draw();

  animationId = requestAnimationFrame(gameLoop);
}

/**
 * Update game state
 */
function update() {
  // Update score
  score++;
  document.getElementById("score").textContent = Math.floor(score / 10);

  // Increase difficulty over time
  if (score % 300 === 0) {
    gameSpeed += 0.6;
    if (obstacleInterval > 35) {
      obstacleInterval -= 4;
    }
  }

  // Apply gravity
  player.velocityY += gravity;
  player.y += player.velocityY;

  // Ground collision
  if (player.y >= player.groundY) {
    player.y = player.groundY;
    player.velocityY = 0;
    player.jumping = false;
  }

  // Update ground offset for animation
  groundOffset = (groundOffset + gameSpeed) % 20;

  // Spawn obstacles
  obstacleTimer++;
  if (obstacleTimer >= obstacleInterval) {
    spawnObstacle();
    obstacleTimer = 0;
    // Randomize next interval
    obstacleInterval = 50 + Math.random() * 40;
  }

  // Update obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= gameSpeed;

    // Remove off-screen obstacles
    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
      continue;
    }

    // Collision detection
    if (checkCollision(player, obstacles[i])) {
      endGame();
      return;
    }
  }
}

/**
 * Spawn a new obstacle
 */
function spawnObstacle() {
  const container = canvas.parentElement;
  const displayWidth = container.clientWidth;
  const emoji =
    obstacleEmojis[Math.floor(Math.random() * obstacleEmojis.length)];
  obstacles.push({
    x: displayWidth,
    y: player.groundY,
    width: 35,
    height: 35,
    emoji: emoji,
  });
}

/**
 * Check collision between two objects
 */
function checkCollision(a, b) {
  const padding = 10; // Make hitbox slightly smaller for fairness
  return (
    a.x + padding < b.x + b.width - padding &&
    a.x + a.width - padding > b.x + padding &&
    a.y + padding < b.y + b.height &&
    a.y + a.height > b.y + padding
  );
}

/**
 * Draw the game
 */
function draw() {
  const container = canvas.parentElement;
  const displayWidth = container.clientWidth;
  const displayHeight = container.clientHeight;

  // Clear canvas
  ctx.fillStyle = "#fdf6e3";
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  // Draw decorative background elements
  drawBackground();

  // Draw ground line
  ctx.strokeStyle = "#2d3436";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, player.groundY + 40);
  ctx.lineTo(displayWidth, player.groundY + 40);
  ctx.stroke();

  // Draw obstacles
  ctx.font = "30px Arial";
  ctx.textBaseline = "bottom";
  for (const obstacle of obstacles) {
    ctx.fillText(obstacle.emoji, obstacle.x, obstacle.y + obstacle.height);
  }

  // Draw player
  ctx.font = "35px Arial";
  ctx.fillText(player.emoji, player.x, player.y + player.height);
}

/**
 * Draw background decorations
 */
function drawBackground() {
  const container = canvas.parentElement;
  const displayWidth = container.clientWidth;

  ctx.globalAlpha = 0.1;
  ctx.font = "20px Arial";

  // Floating hearts in background
  const time = Date.now() / 1000;
  for (let i = 0; i < 5; i++) {
    const x = ((i * 120 + time * 20) % (displayWidth + 50)) - 25;
    const y = 30 + Math.sin(time + i) * 15;
    ctx.fillText("💗", x, y);
  }

  ctx.globalAlpha = 1;
}

/**
 * End the game
 */
function endGame() {
  gameRunning = false;
  gameOver = true;

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // Update highscore
  const finalScore = Math.floor(score / 10);
  if (finalScore > highScore) {
    highScore = finalScore;
    localStorage.setItem("weddingRunnerHighScore", highScore);
    document.getElementById("highscore").textContent = highScore;
  }

  // Automatically submit highscore
  if (playerName && finalScore > 0) {
    submitHighscore();
  }

  // Show game over overlay
  document.getElementById("gameOverlay").classList.remove("hidden");
  document.getElementById("gameStartText").style.display = "none";
  document.getElementById("gameOverText").style.display = "block";
  document.getElementById("finalScore").textContent = finalScore;
}

/**
 * Make the player jump
 */
function jump() {
  if (!gameRunning && !gameOver) {
    startGame();
    return;
  }

  if (gameOver) {
    resetGame();
    draw();
    return;
  }

  if (!player.jumping && player.y >= player.groundY) {
    player.velocityY = jumpForce;
    player.jumping = true;
  }
}

// Initialize event listeners when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Allow Enter key to submit name on easter egg page
  document
    .getElementById("nameInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        submitName();
      }
    });

  // Allow Enter key to start game after entering player name
  const playerNameInput = document.getElementById("playerNameInput");
  if (playerNameInput) {
    playerNameInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        setPlayerName();
      }
    });
  }

  // Secret trigger - click emoji to open game
  const secretTrigger = document.getElementById("secretTrigger");
  if (secretTrigger) {
    secretTrigger.addEventListener("click", function (e) {
      e.preventDefault();
      showGame();
    });
  }

  // Keyboard controls for game
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.key === " ") {
      const gameScreen = document.getElementById("gameScreen");
      if (gameScreen && gameScreen.style.display !== "none") {
        e.preventDefault();
        jump();
      }
    }
  });

  // Touch controls for game - anywhere on canvas or overlay
  const gameCanvas = document.getElementById("gameCanvas");
  const gameCanvasWrapper = document.querySelector(".game-canvas-wrapper");

  if (gameCanvas) {
    gameCanvas.addEventListener("click", function () {
      jump();
    });

    gameCanvas.addEventListener("touchstart", function (e) {
      e.preventDefault();
      jump();
    });
  }

  // Also add event listeners to the canvas wrapper for better touch detection
  if (gameCanvasWrapper) {
    gameCanvasWrapper.addEventListener("click", function () {
      jump();
    });

    gameCanvasWrapper.addEventListener("touchstart", function (e) {
      e.preventDefault();
      jump();
    });
  }
});
