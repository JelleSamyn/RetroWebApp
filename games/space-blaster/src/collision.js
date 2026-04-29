export function checkRectCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

export function resolveHits(projectiles, wave, player, particlesSystem, emitParticles) {
  let scoreIncrease = 0;
  let playerHit = false;

  for (const projectile of projectiles.list) {
    if (projectile.y < -50) continue; // Already consumed

    if (!projectile.isEnemy) {
      // Check against enemies
      for (const enemy of wave.list) {
        if (!enemy.alive) continue;

        if (checkRectCollision(projectile, enemy)) {
          enemy.alive = false;
          // Consume projectile
          projectile.y = -100;
          scoreIncrease += 10;
          
          // Emit explosion particles
          if (emitParticles && particlesSystem) {
            emitParticles(particlesSystem, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#ffb703", 15);
          }
          break;
        }
      }
    } else {
      // Check against player
      if (!player.invulnerable && checkRectCollision(projectile, player)) {
        playerHit = true;
        projectile.y = -100; // Consume
      }
    }
  }

  // Check enemy collision with player or bottom
  for (const enemy of wave.list) {
    if (!enemy.alive) continue;
    
    if (!player.invulnerable && checkRectCollision(enemy, player)) {
      playerHit = true;
      enemy.alive = false;
      if (emitParticles && particlesSystem) {
        emitParticles(particlesSystem, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#ffb703", 15);
      }
    }
  }

  return { scoreIncrease, playerHit };
}
