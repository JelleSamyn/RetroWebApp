export function createEnemyWave(canvasWidth, waveNumber, config = {}) {
  const enemies = [];
  const cols = (config.columns || 8) + Math.min(waveNumber, 4);
  const rows = Math.min(3 + Math.floor(waveNumber / 2), 6);
  const spacing = 20;
  const enemyWidth = 36;
  const enemyHeight = 24;
  const totalWidth = cols * enemyWidth + (cols - 1) * spacing;
  const startX = (canvasWidth - totalWidth) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({
        x: startX + c * (enemyWidth + spacing),
        y: 60 + r * (enemyHeight + spacing),
        width: enemyWidth,
        height: enemyHeight,
        alive: true,
        type: r % 3 // Different types for visuals
      });
    }
  }

  return {
    dir: 1,
    speed: (config.speed || 150) + (waveNumber * 20),
    list: enemies,
    shootCooldown: Math.max(0.5, 2.0 - (waveNumber * 0.1))
  };
}

export function updateEnemies(wave, dt, canvasWidth, projectilesSystem, fireProjectile) {
  let touchedEdge = false;
  let activeEnemies = 0;

  for (const enemy of wave.list) {
    if (!enemy.alive) continue;
    activeEnemies++;

    enemy.x += wave.dir * wave.speed * dt;

    if (enemy.x <= 0 || enemy.x + enemy.width >= canvasWidth) {
      touchedEdge = true;
    }
  }

  if (touchedEdge) {
    wave.dir *= -1;
    for (const enemy of wave.list) {
      if (enemy.alive) {
        enemy.y += 20; // Move down
      }
    }
  }

  // Random shooting
  if (activeEnemies > 0) {
    wave.shootCooldown -= dt;
    if (wave.shootCooldown <= 0) {
      // Pick a random alive enemy
      const aliveList = wave.list.filter(e => e.alive);
      const shooter = aliveList[Math.floor(Math.random() * aliveList.length)];
      if (fireProjectile && projectilesSystem) {
        fireProjectile(projectilesSystem, shooter.x + shooter.width / 2, shooter.y + shooter.height, true);
      }
      wave.shootCooldown = Math.max(0.5, Math.random() * 2);
    }
  }

  return activeEnemies === 0; // Return true if wave cleared
}

export function drawEnemies(ctx, wave, time) {
  ctx.save();
  for (const enemy of wave.list) {
    if (!enemy.alive) continue;

    const pulse = Math.sin(time * 5 + enemy.x * 0.01) * 0.2 + 0.8;
    
    ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    
    ctx.fillStyle = "#ff0055";
    ctx.shadowBlur = 10 * pulse;
    ctx.shadowColor = "#ff0055";

    // Draw intricate enemy shapes based on type
    ctx.beginPath();
    if (enemy.type === 0) {
      // Diamond shape
      ctx.moveTo(0, -12);
      ctx.lineTo(18, 0);
      ctx.lineTo(0, 12);
      ctx.lineTo(-18, 0);
    } else if (enemy.type === 1) {
      // Hexagon / UFO shape
      ctx.moveTo(-10, -10);
      ctx.lineTo(10, -10);
      ctx.lineTo(18, 0);
      ctx.lineTo(10, 10);
      ctx.lineTo(-10, 10);
      ctx.lineTo(-18, 0);
    } else {
      // Sharp wings
      ctx.moveTo(0, -8);
      ctx.lineTo(18, 12);
      ctx.lineTo(8, 0);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-18, 12);
    }
    ctx.closePath();
    ctx.fill();

    // Eye/Core
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(-(enemy.x + enemy.width / 2), -(enemy.y + enemy.height / 2));
  }
  ctx.restore();
}
