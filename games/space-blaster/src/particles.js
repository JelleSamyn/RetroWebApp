export function createParticleSystem() {
  return {
    list: []
  };
}

export function emitParticles(system, x, y, color, count, speedMultiplier = 1) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 150 + 50) * speedMultiplier;
    const life = Math.random() * 0.5 + 0.2; // 0.2 to 0.7 seconds
    system.list.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      color,
      size: Math.random() * 3 + 1
    });
  }
}

export function updateParticles(system, dt) {
  for (const p of system.list) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  system.list = system.list.filter(p => p.life > 0);
}

export function drawParticles(ctx, system) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of system.list) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
