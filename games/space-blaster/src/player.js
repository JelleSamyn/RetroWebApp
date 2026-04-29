export function createPlayer(canvasWidth, canvasHeight, config = {}) {
  return {
    x: canvasWidth / 2 - 24,
    y: canvasHeight - 80,
    width: 48,
    height: 40,
    speed: config.speed || 360,
    invulnerable: false,
    invulnerableTimer: 0
  };
}

export function updatePlayer(player, keys, pad, dt, canvasWidth) {
  const axisX = pad?.axes?.[0] ?? 0;
  const dpadLeftPressed = Boolean(pad?.buttons?.[14]?.pressed);
  const dpadRightPressed = Boolean(pad?.buttons?.[15]?.pressed);
  const stickDeadzone = 0.25;

  const leftPressed = keys.has("a") || keys.has("arrowleft");
  const rightPressed = keys.has("d") || keys.has("arrowright");
  const controllerLeftPressed = dpadLeftPressed || axisX < -stickDeadzone;
  const controllerRightPressed = dpadRightPressed || axisX > stickDeadzone;

  if (leftPressed || controllerLeftPressed) {
    player.x -= player.speed * dt;
  }

  if (rightPressed || controllerRightPressed) {
    player.x += player.speed * dt;
  }

  player.x = Math.max(0, Math.min(canvasWidth - player.width, player.x));

  if (player.invulnerableTimer > 0) {
    player.invulnerableTimer -= dt;
    if (player.invulnerableTimer <= 0) {
      player.invulnerable = false;
      player.invulnerableTimer = 0;
    }
  }
}

export function drawPlayer(ctx, player, time) {
  if (player.invulnerable) {
    // Blink effect
    if (Math.floor(time * 10) % 2 === 0) {
      return; // Skip drawing this frame
    }
  }

  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

  // Engine flame
  const flameLength = 15 + Math.sin(time * 20) * 5;
  ctx.fillStyle = "#ffb703";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#ffb703";
  ctx.beginPath();
  ctx.moveTo(-10, 15);
  ctx.lineTo(0, 15 + flameLength);
  ctx.lineTo(10, 15);
  ctx.closePath();
  ctx.fill();

  // Ship Body
  ctx.fillStyle = "#00f0ff";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#00f0ff";
  ctx.beginPath();
  ctx.moveTo(0, -20); // Nose
  ctx.lineTo(24, 15); // Right wing
  ctx.lineTo(12, 10); // Right inner
  ctx.lineTo(-12, 10); // Left inner
  ctx.lineTo(-24, 15); // Left wing
  ctx.closePath();
  ctx.fill();

  // Cockpit
  ctx.fillStyle = "#04090f";
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(5, 5);
  ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
