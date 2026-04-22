import { createPlayer, updatePlayer, drawPlayer } from "./player.js";
import { createEnemyWave, updateEnemies, drawEnemies } from "./enemies.js";
import { createProjectileSystem, updateProjectiles, drawProjectiles, fireProjectile } from "./projectiles.js";
import { resolveHits } from "./collision.js";
import { drawUi } from "./ui.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const pauseMenu = document.getElementById("pauseMenu");
const menuOptions = document.querySelectorAll(".menu-option");

const keys = new Set();

// Load config
let config = {
  player: { speed: 360, lives: 3 },
  projectile: { cooldownSeconds: 0.18, speed: 420 },
  enemyWave: { columns: 8, speed: 1500 },
};

async function initGame() {
  try {
    const response = await fetch("./data/config.json?t=" + Date.now());
    if (response.ok) {
      config = await response.json();
      console.log("Config loaded:", config);
    } else {
      console.warn("Failed to load config.json, status:", response.status);
    }
  } catch (error) {
    console.warn("Could not load config.json, using defaults", error);
  }

  const player = createPlayer(canvas.width, canvas.height, config.player);
  const enemies = createEnemyWave(canvas.width, config.enemyWave);
  const projectiles = createProjectileSystem(config.projectile);

  const state = {
    score: 0,
    lives: config.player.lives,
    lastTime: performance.now(),
    shotCooldown: 0,
    isPaused: false,
    selectedMenuOption: 0,
    menuPressedLastFrame: false,
  };

  function getActiveGamepad() {
    if (!navigator.getGamepads) {
      return null;
    }

    const pads = navigator.getGamepads();
    return Array.from(pads).find((pad) => pad && pad.connected) || null;
  }

  function isShootPressed(pad) {
    if (keys.has(" ") || keys.has("spacebar")) {
      return true;
    }

    return Boolean(pad?.buttons?.[0]?.pressed);
  }

  function isMenuPressed(pad) {
    return Boolean(pad?.buttons?.[9]?.pressed); // Button 9 is typically the Menu/Start button
  }

  function togglePauseMenu() {
    state.isPaused = !state.isPaused;
    state.selectedMenuOption = 0;
    updateMenuDisplay();
  }

  function updateMenuDisplay() {
    if (state.isPaused) {
      pauseMenu.classList.remove("hidden");
    } else {
      pauseMenu.classList.add("hidden");
    }

    // Update selected menu option styling
    menuOptions.forEach((option, index) => {
      if (index === state.selectedMenuOption) {
        option.classList.add("selected");
      } else {
        option.classList.remove("selected");
      }
    });
  }

  function navigateMenu(direction) {
    state.selectedMenuOption += direction;
    if (state.selectedMenuOption < 0) {
      state.selectedMenuOption = menuOptions.length - 1;
    } else if (state.selectedMenuOption >= menuOptions.length) {
      state.selectedMenuOption = 0;
    }
    updateMenuDisplay();
  }

  function selectMenuOption() {
    const action = menuOptions[state.selectedMenuOption].dataset.action;

    if (action === "resume") {
      togglePauseMenu();
    } else if (action === "reset") {
      state.score = 0;
      scoreEl.textContent = `Score: ${state.score}`;
    } else if (action === "mainmenu") {
      window.location.href = "/RetroWebApp/";
    }
  }

  function handleMenuInput(pad) {
    if (!state.isPaused) return;

    // Navigate with D-pad up/down or arrow keys
    if (pad?.buttons?.[12]?.pressed || keys.has("arrowup")) {
      // D-pad up
      if (!state.menuNavPressed) {
        navigateMenu(-1);
        state.menuNavPressed = true;
      }
    } else if (pad?.buttons?.[13]?.pressed || keys.has("arrowdown")) {
      // D-pad down
      if (!state.menuNavPressed) {
        navigateMenu(1);
        state.menuNavPressed = true;
      }
    } else {
      state.menuNavPressed = false;
    }

    // Select with A button or Space
    if (isShootPressed(pad) || keys.has(" ") || keys.has("spacebar")) {
      if (!state.menuSelectPressed) {
        selectMenuOption();
        state.menuSelectPressed = true;
      }
    } else {
      state.menuSelectPressed = false;
    }
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - state.lastTime) / 1000);
    state.lastTime = now;
    const pad = getActiveGamepad();

    // Handle menu button press
    if (isMenuPressed(pad) && !state.menuPressedLastFrame) {
      togglePauseMenu();
    }
    state.menuPressedLastFrame = isMenuPressed(pad);

    // Handle menu input
    handleMenuInput(pad);

    // Only update game if not paused
    if (!state.isPaused) {
      updatePlayer(player, keys, pad, dt, canvas.width);
      updateEnemies(enemies, dt, canvas.width);
      updateProjectiles(projectiles, dt, canvas.height);

      if (state.shotCooldown > 0) {
        state.shotCooldown -= dt;
      }

      if (isShootPressed(pad) && state.shotCooldown <= 0) {
        fireProjectile(projectiles, player.x + player.width / 2, player.y);
        state.shotCooldown = config.projectile.cooldownSeconds;
      }

      const hitCount = resolveHits(projectiles, enemies);
      state.score += hitCount * 10;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawUi(ctx, canvas.width, canvas.height);
    drawPlayer(ctx, player);
    drawEnemies(ctx, enemies);
    drawProjectiles(ctx, projectiles);

    scoreEl.textContent = `Score: ${state.score}`;
    livesEl.textContent = `Lives: ${state.lives}`;

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  // Set up keyboard event listeners
  window.addEventListener("keydown", (event) => {
    keys.add(event.key.toLowerCase());

    // Handle ESC key for pause/resume
    if (event.key === "Escape") {
      event.preventDefault();
      togglePauseMenu();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });
}

initGame();
