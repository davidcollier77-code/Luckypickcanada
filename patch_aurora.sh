#!/bin/bash

# We replace the drawWisp implementation in components/Aurora.tsx

awk '
BEGIN { in_wisp = 0; }
/const drawWisp = \(ctx, x, y, angle, w, h, colorRGB, opacity\) => \{/ {
  in_wisp = 1;
  print "    const drawWisp = (ctx, x, y, angle, w, h, colorRGB, opacity) => {";
  print "      ctx.save();";
  print "      ctx.translate(x, y);";
  print "      ctx.rotate(angle);";
  print "";
  print "      ctx.beginPath();";
  print "      // We approximate the ribbon with a bezier curve using the width/height";
  print "      const halfW = w / 2;";
  print "      const halfH = h / 2;";
  print "      ctx.moveTo(-halfW, 0);";
  print "      ctx.bezierCurveTo(-halfW, -halfH, halfW, -halfH, halfW, 0);";
  print "      ctx.bezierCurveTo(halfW, halfH, -halfW, halfH, -halfW, 0);";
  print "";
  print "      // Simpler linear gradient instead of full-screen radial fill";
  print "      const grad = ctx.createLinearGradient(0, -halfH, 0, halfH);";
  print "      grad.addColorStop(0, `rgba(${colorRGB}, 0)`);";
  print "      grad.addColorStop(0.5, `rgba(${colorRGB}, ${opacity})`);";
  print "      grad.addColorStop(1, `rgba(${colorRGB}, 0)`);";
  print "";
  print "      ctx.fillStyle = grad;";
  print "      ctx.fill();";
  print "";
  print "      ctx.restore();";
  print "    };";
  next;
}
in_wisp == 1 && /\};/ {
  in_wisp = 0;
  next;
}
in_wisp == 1 { next; }
{ print $0; }
' components/Aurora.tsx > components/Aurora.tsx.tmp
mv components/Aurora.tsx.tmp components/Aurora.tsx
