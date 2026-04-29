export function createStarfield(width, height) {
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 50 + 20
    });
  }
  return stars;
}

export function drawUi(ctx, width, height, dt, stars) {
  ctx.save();
  
  // Draw parallax starfield
  ctx.fillStyle = "rgba(224, 251, 252, 0.8)";
  for (const star of stars) {
    star.y += star.speed * dt;
    if (star.y > height) {
      star.y = 0;
      star.x = Math.random() * width;
    }
    
    // Slight glow on stars
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#e0fbfc";
    
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }

  // Draw bottom scanline effect (optional arcade feel)
  ctx.fillStyle = "rgba(0, 240, 255, 0.03)";
  for (let i = 0; i < height; i += 4) {
    ctx.fillRect(0, i, width, 1);
  }

  ctx.restore();
}
