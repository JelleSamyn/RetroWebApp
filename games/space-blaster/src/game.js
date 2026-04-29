import { createPlayer, updatePlayer, drawPlayer } from "./player.js";
import { createEnemyWave, updateEnemies, drawEnemies } from "./enemies.js";
import { createProjectileSystem, updateProjectiles, drawProjectiles, fireProjectile } from "./projectiles.js";
import { resolveHits } from "./collision.js";
import { createStarfield, drawUi } from "./ui.js";
import { createParticleSystem, emitParticles, updateParticles, drawParticles } from "./particles.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const waveEl = document.getElementById("wave");
const pauseMenu = document.getElementById("pauseMenu");
const menuOptions = document.querySelectorAll(".menu-option");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreEl = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");
const waveMessage = document.getElementById("waveMessage");
const waveMessageText = document.getElementById("waveMessageText");

const keys = new Set();

// Load config
let config = {
  player: { speed: 360, lives: 3 },
  projectile: { cooldownSeconds: 0.18, speed: 600, enemySpeed: 300 },
  enemyWave: { columns: 8, speed: 150 },
};

const GAME_STATE = {
  PLAYING: 0,
  PAUSED: 1,
  GAME_OVER: 2,
  WAVE_TRANSITION: 3
};

async function initGame() {
  try {
    const response = await fetch("./data/config.json?t=" + Date.now());
    if (response.ok) {
      const loadedConfig = await response.json();
      config = { ...config, ...loadedConfig };
    }
  } catch (error) {
    console.warn("Could not load config.json, using defaults");
  }

  let state = {
    currentState: GAME_STATE.PLAYING,
    score: 0,
    lives: config.player.lives,
    waveNumber: 1,
    lastTime: performance.now(),
    shotCooldown: 0,
    selectedMenuOption: 0,
    menuPressedLastFrame: false,
    menuNavigateLastFrame: false,
    menuConfirmLastFrame: false,
    confirmPressedLastFrame: false,
    transitionTimer: 0
  };

  let player = createPlayer(canvas.width, canvas.height, config.player);
  let enemies = createEnemyWave(canvas.width, state.waveNumber, config.enemyWave);
  let projectiles = createProjectileSystem(config.projectile);
  let particles = createParticleSystem();
  let stars = createStarfield(canvas.width, canvas.height);

  function resetGame() {
    state.currentState = GAME_STATE.PLAYING;
    state.score = 0;
    state.lives = config.player.lives;
    state.waveNumber = 1;
    player = createPlayer(canvas.width, canvas.height, config.player);
    enemies = createEnemyWave(canvas.width, state.waveNumber, config.enemyWave);
    projectiles = createProjectileSystem(config.projectile);
    particles = createParticleSystem();
    gameOverScreen.classList.add("hidden");
    pauseMenu.classList.add("hidden");
    updateHUD();
  }

  function startNextWave() {
    state.waveNumber++;
    state.currentState = GAME_STATE.WAVE_TRANSITION;
    state.transitionTimer = 2.0; // 2 seconds transition
    waveMessageText.textContent = `WAVE ${state.waveNumber}`;
    waveMessage.classList.remove("hidden");
    
    enemies = createEnemyWave(canvas.width, state.waveNumber, config.enemyWave);
    projectiles.list = []; // Clear projectiles
    updateHUD();
  }

  function handlePlayerHit() {
    if (player.invulnerable) return;

    state.lives--;
    updateHUD();
    emitParticles(particles, player.x + player.width/2, player.y + player.height/2, "#00f0ff", 30, 2);

    if (state.lives <= 0) {
      state.currentState = GAME_STATE.GAME_OVER;
      state.selectedMenuOption = 0;
      finalScoreEl.textContent = `FINAL SCORE: ${state.score}`;
      gameOverScreen.classList.remove("hidden");
      syncMenuSelection();
    } else {
      player.invulnerable = true;
      player.invulnerableTimer = 2.0;
    }
  }

  function updateHUD() {
    scoreEl.textContent = `SCORE: ${state.score}`;
    livesEl.textContent = `LIVES: ${state.lives}`;
    waveEl.textContent = `WAVE: ${state.waveNumber}`;
  }

  function getActiveGamepad() {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    return Array.from(pads).find((pad) => pad && pad.connected) || null;
  }

  function isShootPressed(pad) {
    if (keys.has(" ") || keys.has("spacebar")) return true;
    return Boolean(pad?.buttons?.[0]?.pressed);
  }

  function isConfirmPressed(pad) {
    if (keys.has("enter") || keys.has("return") || keys.has(" ") || keys.has("spacebar")) return true;
    return Boolean(pad?.buttons?.[0]?.pressed);
  }

  function isMenuPressed(pad) {
    return Boolean(pad?.buttons?.[9]?.pressed) || keys.has("escape");
  }

  function isMenuNavigateDownPressed(pad) {
    return Boolean(pad?.buttons?.[13]?.pressed) || keys.has("arrowdown") || keys.has("s");
  }

  function isMenuNavigateUpPressed(pad) {
    return Boolean(pad?.buttons?.[12]?.pressed) || keys.has("arrowup") || keys.has("w");
  }

  function getMenuActionButtons() {
    if (state.currentState === GAME_STATE.GAME_OVER) {
      return [restartBtn];
    }

    return Array.from(menuOptions);
  }

  function syncMenuSelection() {
    const buttons = getMenuActionButtons();
    buttons.forEach((button, index) => {
      button.classList.toggle("selected", index === state.selectedMenuOption);
    });
  }

  function setMenuSelection(nextIndex) {
    const buttons = getMenuActionButtons();
    if (!buttons.length) return;

    state.selectedMenuOption = ((nextIndex % buttons.length) + buttons.length) % buttons.length;
    syncMenuSelection();
  }

  function activateSelectedMenuOption() {
    const buttons = getMenuActionButtons();
    const selectedButton = buttons[state.selectedMenuOption];
    if (selectedButton) {
      selectedButton.click();
    }
  }

  function togglePauseMenu() {
    if (state.currentState === GAME_STATE.PLAYING) {
      state.currentState = GAME_STATE.PAUSED;
      state.selectedMenuOption = 0;
      pauseMenu.classList.remove("hidden");
      syncMenuSelection();
    } else if (state.currentState === GAME_STATE.PAUSED) {
      state.currentState = GAME_STATE.PLAYING;
      pauseMenu.classList.add("hidden");
    }
  }

  restartBtn.addEventListener("click", resetGame);

  function loop(now) {
    const dt = Math.min(0.033, (now - state.lastTime) / 1000);
    const globalTime = now / 1000;
    state.lastTime = now;
    const pad = getActiveGamepad();

    // Menu toggle logic
    const menuPressed = isMenuPressed(pad);
    if (state.currentState !== GAME_STATE.GAME_OVER && menuPressed && !state.menuPressedLastFrame) {
      togglePauseMenu();
    }
    state.menuPressedLastFrame = menuPressed;

    const menuNavigateDownPressed = isMenuNavigateDownPressed(pad);
    const menuNavigateUpPressed = isMenuNavigateUpPressed(pad);
    const menuNavigatePressed = menuNavigateDownPressed || menuNavigateUpPressed;
    if ((state.currentState === GAME_STATE.PAUSED || state.currentState === GAME_STATE.GAME_OVER) && menuNavigatePressed && !state.menuNavigateLastFrame) {
      if (menuNavigateDownPressed) {
        setMenuSelection(state.selectedMenuOption + 1);
      } else if (menuNavigateUpPressed) {
        setMenuSelection(state.selectedMenuOption - 1);
      }
    }
    state.menuNavigateLastFrame = menuNavigatePressed;

    const menuConfirmPressed = isConfirmPressed(pad);
    if ((state.currentState === GAME_STATE.PAUSED || state.currentState === GAME_STATE.GAME_OVER) && menuConfirmPressed && !state.menuConfirmLastFrame) {
      activateSelectedMenuOption();
    }
    state.menuConfirmLastFrame = menuConfirmPressed;

    if (state.currentState === GAME_STATE.PLAYING) {
      updatePlayer(player, keys, pad, dt, canvas.width);
      
      const waveCleared = updateEnemies(enemies, dt, canvas.width, projectiles, fireProjectile);
      if (waveCleared) {
        startNextWave();
      }

      updateProjectiles(projectiles, dt, canvas.height);
      updateParticles(particles, dt);

      if (state.shotCooldown > 0) state.shotCooldown -= dt;

      if (isShootPressed(pad) && state.shotCooldown <= 0) {
        fireProjectile(projectiles, player.x + player.width / 2, player.y, false);
        state.shotCooldown = config.projectile.cooldownSeconds;
      }

      const hitResults = resolveHits(projectiles, enemies, player, particles, emitParticles);
      state.score += hitResults.scoreIncrease;
      if (hitResults.scoreIncrease > 0) updateHUD();
      
      if (hitResults.playerHit) {
        handlePlayerHit();
      }

    } else if (state.currentState === GAME_STATE.WAVE_TRANSITION) {
      state.transitionTimer -= dt;
      updatePlayer(player, keys, pad, dt, canvas.width);
      updateParticles(particles, dt);
      
      if (state.transitionTimer <= 0) {
        state.currentState = GAME_STATE.PLAYING;
        waveMessage.classList.add("hidden");
      }
    } else if (state.currentState === GAME_STATE.GAME_OVER) {
      updateParticles(particles, dt); // Let particles finish
    }

    // Drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawUi(ctx, canvas.width, canvas.height, dt, stars);
    
    if (state.currentState !== GAME_STATE.GAME_OVER || state.lives > 0) {
      drawPlayer(ctx, player, globalTime);
    }
    
    drawEnemies(ctx, enemies, globalTime);
    drawProjectiles(ctx, projectiles);
    drawParticles(ctx, particles);

    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    keys.add(e.key.toLowerCase());
    if (e.key === "Escape" && state.currentState !== GAME_STATE.GAME_OVER) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

  // Setup pause menu interactions
  menuOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      const action = opt.dataset.action;
      if (action === "resume") togglePauseMenu();
      if (action === "reset") resetGame();
      if (action === "mainmenu") window.location.href = "/RetroWebApp/";
    });
  });

  syncMenuSelection();

  updateHUD();
  requestAnimationFrame(loop);
}

initGame();
