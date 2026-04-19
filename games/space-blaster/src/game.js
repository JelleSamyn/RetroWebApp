import { createPlayer, updatePlayer, drawPlayer } from "./player.js";
import { createEnemyWave, updateEnemies, drawEnemies } from "./enemies.js";
import { createProjectileSystem, updateProjectiles, drawProjectiles, fireProjectile } from "./projectiles.js";
import { resolveHits } from "./collision.js";
import { drawUi } from "./ui.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");

const keys = new Set();
const player = createPlayer(canvas.width, canvas.height);
const enemies = createEnemyWave(canvas.width);
const projectiles = createProjectileSystem();

const state = {
  score: 0,
  lives: 3,
  lastTime: performance.now(),
  shotCooldown: 0,
};

window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

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

function loop(now) {
  const dt = Math.min(0.033, (now - state.lastTime) / 1000);
  state.lastTime = now;
  const pad = getActiveGamepad();

  updatePlayer(player, keys, pad, dt, canvas.width);
  updateEnemies(enemies, dt, canvas.width);
  updateProjectiles(projectiles, dt, canvas.height);

  if (state.shotCooldown > 0) {
    state.shotCooldown -= dt;
  }

  if (isShootPressed(pad) && state.shotCooldown <= 0) {
    fireProjectile(projectiles, player.x + player.width / 2, player.y);
    state.shotCooldown = 0.18;
  }

  const hitCount = resolveHits(projectiles, enemies);
  state.score += hitCount * 10;

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
