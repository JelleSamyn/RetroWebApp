export function createProjectileSystem(config = {}) {
  return {
    list: [],
    speed: config.speed || 420,
    enemySpeed: config.enemySpeed || 250
  };
}

export function fireProjectile(system, x, y, isEnemy = false) {
  system.list.push({
    x: x - (isEnemy ? 3 : 2),
    y,
    width: isEnemy ? 6 : 4,
    height: isEnemy ? 18 : 16,
    isEnemy
  });
}

export function updateProjectiles(system, dt, canvasHeight) {
  for (const projectile of system.list) {
    if (projectile.isEnemy) {
      projectile.y += system.enemySpeed * dt;
    } else {
      projectile.y -= system.speed * dt;
    }
  }

  system.list = system.list.filter(
    (projectile) => projectile.y + projectile.height >= 0 && projectile.y <= canvasHeight + 100
  );
}

export function drawProjectiles(ctx, system) {
  ctx.save();
  for (const projectile of system.list) {
    if (projectile.isEnemy) {
      ctx.fillStyle = "#ff0055"; // Danger red/pink
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ff0055";
    } else {
      ctx.fillStyle = "#00f0ff"; // Cyan
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00f0ff";
    }
    // Draw rounded rect
    ctx.beginPath();
    ctx.roundRect(projectile.x, projectile.y, projectile.width, projectile.height, 2);
    ctx.fill();
  }
  ctx.restore();
}
