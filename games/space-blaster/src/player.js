export function createPlayer(canvasWidth, canvasHeight, config = {}) {
  return {
    x: canvasWidth / 2 - 24,
    y: canvasHeight - 70,
    width: 48,
    height: 28,
    speed: config.speed || 360,
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
}

export function drawPlayer(ctx, player) {
  ctx.fillStyle = "#7ce0ff";
  ctx.beginPath();
  ctx.moveTo(player.x + player.width / 2, player.y);
  ctx.lineTo(player.x, player.y + player.height);
  ctx.lineTo(player.x + player.width, player.y + player.height);
  ctx.closePath();
  ctx.fill();
}
