const setupCanvas = (canvas) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = rect.width || canvas.width;
  const height = rect.height || canvas.height;

  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return { ctx, width, height };
};

export const renderSparkline = (canvas, values, options = {}) => {
  if (!canvas || !values || values.length < 2) {
    return;
  }

  const context = setupCanvas(canvas);
  if (!context) {
    return;
  }

  const { ctx, width, height } = context;
  const stroke = options.stroke || "#6366f1";
  const fill = options.fill || "rgba(99, 102, 241, 0.2)";
  const padding = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((value, index) => {
    const x = index * step;
    const normalized = (value - min) / range;
    const y = height - padding - normalized * (height - padding * 2);
    return { x, y };
  });

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.lineTo(width, height - padding);
  ctx.lineTo(0, height - padding);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
};
