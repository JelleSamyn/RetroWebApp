export function resolveHits(projectiles, wave) {
  let hits = 0;

  for (const projectile of projectiles.list) {
    for (const enemy of wave.list) {
      if (!enemy.alive) {
        continue;
      }

      const intersects =
        projectile.x < enemy.x + enemy.width &&
        projectile.x + projectile.width > enemy.x &&
        projectile.y < enemy.y + enemy.height &&
        projectile.y + projectile.height > enemy.y;

      if (intersects) {
        enemy.alive = false;
        projectile.y = -100;
        hits += 1;
        break;
      }
    }
  }

  return hits;
}
