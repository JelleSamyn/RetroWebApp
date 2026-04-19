export function drawUi(ctx, width, height) {
  // Draw a lightweight star field background every frame.
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";

  for (let i = 0; i < 40; i += 1) {
    const x = (i * 97) % width;
    const y = (i * 61) % height;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.restore();
}
