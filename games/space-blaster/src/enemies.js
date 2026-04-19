export function createEnemyWave(canvasWidth) {
  const enemies = [];
  const cols = 8;
  const spacing = 18;
  const enemyWidth = 44;
  const totalWidth = cols * enemyWidth + (cols - 1) * spacing;
  const startX = (canvasWidth - totalWidth) / 2;

  for (let i = 0; i < cols; i += 1) {
    enemies.push({
      x: startX + i * (enemyWidth + spacing),
      y: 60,
      width: enemyWidth,
      height: 24,
      alive: true,
    });
  }

  return {
    dir: 1,
    speed: 60,
    list: enemies,
  };
}

export function updateEnemies(wave, dt, canvasWidth) {
  let touchedEdge = false;

  for (const enemy of wave.list) {
    if (!enemy.alive) {
      continue;
    }

    enemy.x += wave.dir * wave.speed * dt;

    if (enemy.x <= 0 || enemy.x + enemy.width >= canvasWidth) {
      touchedEdge = true;
    }
  }

  if (touchedEdge) {
    wave.dir *= -1;
    for (const enemy of wave.list) {
      if (enemy.alive) {
        enemy.y += 14;
      }
    }
  }
}

export function drawEnemies(ctx, wave) {
  ctx.fillStyle = "#ffb703";
  for (const enemy of wave.list) {
    if (!enemy.alive) {
      continue;
    }

    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  }
}
