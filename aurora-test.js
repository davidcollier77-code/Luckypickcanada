function drawWisp(ctx, x, y, angle, w, h, colorRGB, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(w / 100, h / 100);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
  grad.addColorStop(0, `rgba(${colorRGB}, ${opacity})`);
  grad.addColorStop(0.4, `rgba(${colorRGB}, ${opacity * 0.4})`);
  grad.addColorStop(1, `rgba(${colorRGB}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(-100, -100, 200, 200);
  ctx.restore();
}

function drawWispOptimized(ctx, x, y, angle, w, h, colorRGB, opacity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.beginPath();
  // We approximate the ribbon with a bezier curve using the width/height
  const halfW = w / 2;
  const halfH = h / 2;
  ctx.moveTo(-halfW, 0);
  ctx.bezierCurveTo(-halfW, -halfH, halfW, -halfH, halfW, 0);
  ctx.bezierCurveTo(halfW, halfH, -halfW, halfH, -halfW, 0);

  // Simpler linear gradient instead of full-screen radial fill
  const grad = ctx.createLinearGradient(0, -halfH, 0, halfH);
  grad.addColorStop(0, `rgba(${colorRGB}, 0)`);
  grad.addColorStop(0.5, `rgba(${colorRGB}, ${opacity})`);
  grad.addColorStop(1, `rgba(${colorRGB}, 0)`);

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.restore();
}
