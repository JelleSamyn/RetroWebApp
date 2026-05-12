const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreSpan = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const homeBtn = document.getElementById('home-btn');
const pauseScreen = document.getElementById('pause-screen');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const pauseHomeBtn = document.getElementById('pause-home-btn');

// Game state
let gameState = 'START'; // START, PLAYING, GAMEOVER, PAUSED
let score = 0;
let gameSpeed = 5;
let lastTime = 0;
let selectedMenuIndex = 0;
let lastUINavigationTime = 0;

// Player
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 80,
  width: 40,
  height: 60,
  color: '#00ffcc',
  speed: 6,
  dx: 0,
  dy: 0
};

// Road lines
const roadLines = [];
for (let i = 0; i < canvas.height; i += 60) {
  roadLines.push({ y: i });
}

// Enemies
let enemies = [];
const enemyColors = ['#ff007f', '#9900ff', '#ffaa00', '#ff3333'];

// Input state
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  a: false,
  d: false,
  w: false,
  s: false
};

// Event Listeners
window.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
  if (e.key === 'Enter') handleStartAction();
  if (e.key === 'Escape') {
    if (gameState === 'PLAYING' || gameState === 'PAUSED') {
      togglePause();
    } else {
      goToHub();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

restartBtn.addEventListener('click', startGame);
homeBtn.addEventListener('click', goToHub);
resumeBtn.addEventListener('click', togglePause);
pauseRestartBtn.addEventListener('click', startGame);
pauseHomeBtn.addEventListener('click', goToHub);

function goToHub() {
  window.location.href = '../../index.html';
}

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

function handleStartAction() {
  if (gameState === 'START' || gameState === 'GAMEOVER') {
    startGame();
  }
}

// Gamepad polling
let lastActionTime = 0;
function pollGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = pads && pads[0];

  if (!pad) return;

  const now = performance.now();

  // A button (Start/Restart or Menu Select)
  if (pad.buttons[0]?.pressed) {
    if (gameState === 'START') {
      if (now - lastActionTime > 200) {
        handleStartAction();
        lastActionTime = now;
      }
    } else if (gameState === 'PAUSED' || gameState === 'GAMEOVER') {
      if (now - lastUINavigationTime > 200) {
        const buttons = getActiveButtons();
        if (buttons[selectedMenuIndex]) {
          buttons[selectedMenuIndex].click();
        }
        lastUINavigationTime = now;
      }
    }
  }

  // B button (Exit to Hub)
  if (pad.buttons[1]?.pressed && now - lastActionTime > 200) {
    if (gameState === 'GAMEOVER' || gameState === 'START' || gameState === 'PAUSED') {
      goToHub();
    }
    lastActionTime = now;
  }

  // Menu button (Pause)
  if (pad.buttons[9]?.pressed && now - lastActionTime > 200) {
    if (gameState === 'PLAYING' || gameState === 'PAUSED') {
      togglePause();
    }
    lastActionTime = now;
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

  // D-pad / Left Stick
  if (gameState === 'PLAYING') {
    // Reset dx/dy from pad
    let padDx = 0;
    let padDy = 0;

    if (pad.axes[0] < -0.3 || pad.buttons[14]?.pressed) padDx = -1;
    if (pad.axes[0] > 0.3 || pad.buttons[15]?.pressed) padDx = 1;
    if (pad.axes[1] < -0.3 || pad.buttons[12]?.pressed) padDy = -1;
    if (pad.axes[1] > 0.3 || pad.buttons[13]?.pressed) padDy = 1;

    // Apply only if keyboard isn't actively moving it
    if (!keys.ArrowLeft && !keys.a && !keys.ArrowRight && !keys.d) {
      player.dx = padDx * player.speed;
    }
    if (!keys.ArrowUp && !keys.w && !keys.ArrowDown && !keys.s) {
      player.dy = padDy * player.speed;
    }
  }
}

function startGame() {
  gameState = 'PLAYING';
  score = 0;
  gameSpeed = 5;
  enemies = [];

  player.x = canvas.width / 2 - 20;
  player.y = canvas.height - 80;

  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');

  scoreDisplay.textContent = `Score: ${score}`;

  lastTime = performance.now();
}

function gameOver() {
  gameState = 'GAMEOVER';
  finalScoreSpan.textContent = score;
  selectedMenuIndex = 0;
  gameOverScreen.classList.remove('hidden');
  updateMenuSelection();
}

function spawnEnemy() {
  const width = 40;
  const height = 60;
  // 3 lanes
  const laneW = canvas.width / 3;
  const lane = Math.floor(Math.random() * 3);
  const x = lane * laneW + (laneW / 2) - (width / 2);
  const y = -height;
  const color = enemyColors[Math.floor(Math.random() * enemyColors.length)];
  const speed = gameSpeed * (0.8 + Math.random() * 0.4); // slightly slower or faster than road

  enemies.push({ x, y, width, height, color, speed });
}

function update(deltaTime) {
  // Update Player movement from Keyboard
  player.dx = 0;
  player.dy = 0;

  if (keys.ArrowLeft || keys.a) player.dx = -player.speed;
  if (keys.ArrowRight || keys.d) player.dx = player.speed;
  if (keys.ArrowUp || keys.w) player.dy = -player.speed;
  if (keys.ArrowDown || keys.s) player.dy = player.speed;

  pollGamepad(); // this might override dx/dy if pad is used

  player.x += player.dx;
  player.y += player.dy;

  // Clamp player to screen
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y < 0) player.y = 0;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

  // Update Road
  for (let i = 0; i < roadLines.length; i++) {
    roadLines[i].y += gameSpeed;
    if (roadLines[i].y > canvas.height) {
      roadLines[i].y = -60 + (roadLines[i].y - canvas.height); // Wrap around smoothly
    }
  }

  // Score & Difficulty
  score += 1;
  if (score % 500 === 0) gameSpeed += 0.5;
  scoreDisplay.textContent = `Score: ${score}`;

  // Spawn Enemies
  if (Math.random() < 0.02 + (score / 100000)) {
    // Only spawn if last enemy is far enough away to avoid overlap
    let canSpawn = true;
    for (let e of enemies) {
      if (e.y < 100) canSpawn = false;
    }
    if (canSpawn || enemies.length === 0) {
      spawnEnemy();
    }
  }

  // Update Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.y += e.speed;

    // Collision Detection (AABB)
    if (
      player.x < e.x + e.width &&
      player.x + player.width > e.x &&
      player.y < e.y + e.height &&
      player.y + player.height > e.y
    ) {
      gameOver();
    }

    // Remove off-screen enemies
    if (e.y > canvas.height) {
      enemies.splice(i, 1);
    }
  }
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#1a1a24';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Road
  ctx.fillStyle = '#222230';
  ctx.fillRect(canvas.width / 6, 0, (canvas.width / 6) * 4, canvas.height); // Darker road area

  // Road Lines
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (let line of roadLines) {
    ctx.fillRect(canvas.width / 3 - 2, line.y, 4, 30);
    ctx.fillRect(canvas.width / 3 * 2 - 2, line.y, 4, 30);
  }

  // Draw Player
  drawCar(player.x, player.y, player.width, player.height, player.color);

  // Draw Enemies
  for (let e of enemies) {
    drawCar(e.x, e.y, e.width, e.height, e.color);
  }
}

function drawCar(x, y, w, h, color) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x + 5, y + 5, w, h);

  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 10, w, h - 20);
  ctx.fillRect(x + 5, y, w - 10, h);

  // Window
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 8, y + 15, w - 16, 15);
  ctx.fillRect(x + 8, y + h - 25, w - 16, 10);

  // Lights
  ctx.fillStyle = '#ffaa00';
  ctx.fillRect(x + 5, y + 2, 8, 4);
  ctx.fillRect(x + w - 13, y + 2, 8, 4);

  // Taillights
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(x + 5, y + h - 6, 8, 4);
  ctx.fillRect(x + w - 13, y + h - 6, 8, 4);
}

function loop() {
  if (gameState !== 'PLAYING') {
    pollGamepad();
    requestAnimationFrame(loop);
    return;
  }

  const now = performance.now();
  const deltaTime = now - lastTime;
  lastTime = now;

  update(deltaTime);
  draw();

  requestAnimationFrame(loop);
}

// Initial draw to setup screen
draw();
loop();
