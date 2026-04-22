export function createProjectileSystem(config = {}) {
  return {
    list: [],
    speed: config.speed || 420,
  };
}

export function fireProjectile(system, x, y) {
  system.list.push({
    x: x - 2,
    y,
    width: 4,
    height: 12,
  });
}

export function updateProjectiles(system, dt, canvasHeight) {
  for (const projectile of system.list) {
    projectile.y -= system.speed * dt;
  }

  system.list = system.list.filter((projectile) => projectile.y + projectile.height >= 0 && projectile.y <= canvasHeight);
}

export function drawProjectiles(ctx, system) {
  ctx.fillStyle = "#e0fbfc";
  for (const projectile of system.list) {
    ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
  }
}
