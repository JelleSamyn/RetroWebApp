const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const homeBtn = document.getElementById('home-btn');
const pauseScreen = document.getElementById('pause-screen');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const pauseHomeBtn = document.getElementById('pause-home-btn');

// Game state
let gameState = 'START'; // START, PLAYING, GAMEOVER, PAUSED
let lastTime = 0;
let coins = 0;
let health = 3;
let selectedMenuIndex = 0;
let lastUINavigationTime = 0;

// Map settings
const tileSize = 40;
const cols = canvas.width / tileSize; // 600 / 40 = 15
const rows = canvas.height / tileSize; // 400 / 40 = 10

// Entities
let player = {
  x: 1 * tileSize,
  y: 1 * tileSize,
  width: tileSize * 0.8,
  height: tileSize * 0.8,
  speed: 150, // pixels per second
  color: '#3498db'
};

let enemies = [];
let collectibles = [];

// Input state
const keys = {
  w: false, a: false, s: false, d: false,
  ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
  Enter: false, Escape: false
};

// Input Handling
window.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
  }
  
  if (e.key === 'Enter') handleAction();
  if (e.key === 'Escape') {
    if (gameState === 'PLAYING' || gameState === 'PAUSED') {
      togglePause();
    } else {
      handleBack();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
  }
});

restartBtn.addEventListener('click', () => {
  if (gameState === 'GAMEOVER') initGame();
});

homeBtn.addEventListener('click', handleBack);
resumeBtn.addEventListener('click', togglePause);
pauseRestartBtn.addEventListener('click', initGame);
pauseHomeBtn.addEventListener('click', handleBack);

function getActiveButtons() {
  if (gameState === 'GAMEOVER') return [restartBtn, homeBtn];
  if (gameState === 'PAUSED') return [resumeBtn, pauseRestartBtn, pauseHomeBtn];
  return [];
}

function updateMenuSelection() {
  const buttons = getActiveButtons();
  buttons.forEach((btn, i) => {
    btn.classList.toggle('selected', i === selectedMenuIndex);
  });
}

function togglePause() {
  if (gameState === 'PLAYING') {
    gameState = 'PAUSED';
    selectedMenuIndex = 0;
    pauseScreen.classList.remove('hidden');
    updateMenuSelection();
  } else if (gameState === 'PAUSED') {
    gameState = 'PLAYING';
    pauseScreen.classList.add('hidden');
    lastTime = performance.now();
  }
}

function handleAction() {
  if (gameState === 'START' || gameState === 'GAMEOVER') {
    initGame();
  }
}

function handleBack() {
  if (gameState === 'GAMEOVER' || gameState === 'START' || gameState === 'PAUSED') {
    window.location.href = '../../index.html';
  }
}

// Gamepad polling
function pollGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = pads[0];
  
  if (!pad) return;

  const now = performance.now();

  // A button (button 0) mapped to Action/Enter
  if (pad.buttons[0]?.pressed) {
    if (gameState === 'START') {
      if (!pad.aWasPressed) {
        handleAction();
        pad.aWasPressed = true;
      }
    } else if (gameState === 'PAUSED' || gameState === 'GAMEOVER') {
      if (!pad.aWasPressed && now - lastUINavigationTime > 200) {
        const buttons = getActiveButtons();
        if (buttons[selectedMenuIndex]) {
          buttons[selectedMenuIndex].click();
        }
        pad.aWasPressed = true;
        lastUINavigationTime = now;
      }
    }
  } else {
    pad.aWasPressed = false;
  }

  // B button (button 1) mapped to Back/Escape
  if (pad.buttons[1]?.pressed) {
    if (gameState !== 'PLAYING') {
      if (!pad.bWasPressed) {
        handleBack();
        pad.bWasPressed = true;
      }
    }
  } else {
    pad.bWasPressed = false;
  }

  // Menu button (Pause)
  if (pad.buttons[9]?.pressed) {
    if (gameState === 'PLAYING' || gameState === 'PAUSED') {
      if (!pad.menuWasPressed) {
        togglePause();
        pad.menuWasPressed = true;
      }
    }
  } else {
    pad.menuWasPressed = false;
  }

  // UI Navigation
  if (gameState === 'PAUSED' || gameState === 'GAMEOVER') {
    if (now - lastUINavigationTime > 180) {
      const upPressed = pad.buttons[12]?.pressed || pad.axes[1] < -0.5;
      const downPressed = pad.buttons[13]?.pressed || pad.axes[1] > 0.5;
      const buttons = getActiveButtons();
      
      if (buttons.length > 0) {
        if (upPressed) {
          selectedMenuIndex = (selectedMenuIndex - 1 + buttons.length) % buttons.length;
          updateMenuSelection();
          lastUINavigationTime = now;
        } else if (downPressed) {
          selectedMenuIndex = (selectedMenuIndex + 1) % buttons.length;
          updateMenuSelection();
          lastUINavigationTime = now;
        }
      }
    }
  }

  if (gameState === 'PLAYING') {
    // D-pad (buttons 12-15) or Left Stick (axes 0,1)
    const deadzone = 0.2;
    keys.w = pad.buttons[12]?.pressed || pad.axes[1] < -deadzone;
    keys.s = pad.buttons[13]?.pressed || pad.axes[1] > deadzone;
    keys.a = pad.buttons[14]?.pressed || pad.axes[0] < -deadzone;
    keys.d = pad.buttons[15]?.pressed || pad.axes[0] > deadzone;
  }
}

// Game Logic
function spawnCollectibles() {
  collectibles = [];
  for (let i = 0; i < 5; i++) {
    collectibles.push({
      x: Math.floor(Math.random() * (cols - 2) + 1) * tileSize + tileSize/2,
      y: Math.floor(Math.random() * (rows - 2) + 1) * tileSize + tileSize/2,
      radius: 8,
      color: '#f1c40f',
      collected: false
    });
  }
}

function spawnEnemies() {
  enemies = [];
  for (let i = 0; i < 4; i++) {
    enemies.push({
      x: Math.floor(Math.random() * (cols - 4) + 3) * tileSize,
      y: Math.floor(Math.random() * (rows - 4) + 3) * tileSize,
      width: tileSize * 0.7,
      height: tileSize * 0.7,
      speed: 50 + Math.random() * 50,
      color: '#e74c3c',
      dirX: Math.random() > 0.5 ? 1 : -1,
      dirY: Math.random() > 0.5 ? 1 : -1
    });
  }
}

function initGame() {
  gameState = 'PLAYING';
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  
  coins = 0;
  health = 3;
  updateScoreDisplay();
  
  player.x = 1 * tileSize;
  player.y = 1 * tileSize;
  
  spawnCollectibles();
  spawnEnemies();
  
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  gameState = 'GAMEOVER';
  finalScoreEl.textContent = coins;
  selectedMenuIndex = 0;
  gameOverScreen.classList.remove('hidden');
  updateMenuSelection();
}

function updateScoreDisplay() {
  scoreDisplay.textContent = `Coins: ${coins} | Health: ${health}`;
}

function checkCollision(r1, r2) {
  return r1.x < r2.x + r2.width &&
         r1.x + r1.width > r2.x &&
         r1.y < r2.y + r2.height &&
         r1.y + r1.height > r2.y;
}

function checkCircleCollision(rect, circle) {
  let cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  let cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  let dx = circle.x - cx;
  let dy = circle.y - cy;
  return (dx * dx + dy * dy) < (circle.radius * circle.radius);
}

function update(dt) {
  // Move Player
  let dx = 0;
  let dy = 0;
  if (keys.w || keys.ArrowUp) dy -= 1;
  if (keys.s || keys.ArrowDown) dy += 1;
  if (keys.a || keys.ArrowLeft) dx -= 1;
  if (keys.d || keys.ArrowRight) dx += 1;

  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    const length = Math.sqrt(dx*dx + dy*dy);
    dx /= length;
    dy /= length;
  }

  player.x += dx * player.speed * dt;
  player.y += dy * player.speed * dt;

  // Keep player in bounds (with some padding for walls)
  const margin = tileSize * 0.1;
  player.x = Math.max(margin, Math.min(canvas.width - player.width - margin, player.x));
  player.y = Math.max(margin, Math.min(canvas.height - player.height - margin, player.y));

  // Collectibles
  let allCollected = true;
  for (let c of collectibles) {
    if (!c.collected) {
      allCollected = false;
      if (checkCircleCollision(player, c)) {
        c.collected = true;
        coins += 10;
        updateScoreDisplay();
      }
    }
  }
  
  if (allCollected) {
    spawnCollectibles();
    // increase difficulty slightly
    for(let e of enemies) e.speed *= 1.1;
  }

  // Enemies
  for (let e of enemies) {
    e.x += e.dirX * e.speed * dt;
    e.y += e.dirY * e.speed * dt;

    // Bounce off walls
    if (e.x <= 0 || e.x + e.width >= canvas.width) e.dirX *= -1;
    if (e.y <= 0 || e.y + e.height >= canvas.height) e.dirY *= -1;

    // Collision with player
    if (checkCollision(player, e)) {
      health -= 1;
      updateScoreDisplay();
      
      // Reposition player briefly (invincibility frame could be added)
      player.x = 1 * tileSize;
      player.y = 1 * tileSize;
      
      // Flash effect (very simple)
      ctx.fillStyle = 'rgba(255,0,0,0.5)';
      ctx.fillRect(0,0,canvas.width,canvas.height);

      if (health <= 0) {
        gameOver();
      }
    }
  }
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#2c3e50'; // Floor color
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw simple walls (border)
  ctx.fillStyle = '#34495e';
  ctx.fillRect(0, 0, canvas.width, 10);
  ctx.fillRect(0, canvas.height-10, canvas.width, 10);
  ctx.fillRect(0, 0, 10, canvas.height);
  ctx.fillRect(canvas.width-10, 0, 10, canvas.height);

  // Draw Collectibles
  for (let c of collectibles) {
    if (!c.collected) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
      ctx.closePath();
    }
  }

  // Draw Enemies
  for (let e of enemies) {
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x, e.y, e.width, e.height);
  }

  // Draw Player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  
  // Player eyes (for some directionality/character)
  ctx.fillStyle = '#fff';
  ctx.fillRect(player.x + player.width*0.6, player.y + player.height*0.2, 6, 6);
  ctx.fillRect(player.x + player.width*0.6, player.y + player.height*0.6, 6, 6);
}

function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  pollGamepad();
  
  if (gameState === 'PLAYING') {
    update(dt);
    draw();
  }

  requestAnimationFrame(gameLoop);
}

// Initial draw for background
draw();

// Start game loop
requestAnimationFrame(gameLoop);
