import { FIELD, createSignaturePoints } from "./geometry.ts";

export function createSignatureRenderer(
  canvas: HTMLCanvasElement,
  motion: boolean,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const points = createSignaturePoints();
  let active = false;
  let disposed = false;
  let frame = 0;
  let width = 0;
  let height = 0;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let pointer: { x: number; y: number } | null = null;
  let strength = 0;
  let target = 0;
  let pulseUntil = 0;
  let text = "";
  let accent = "";

  const colors = () => {
    const style = getComputedStyle(canvas);
    text = style.getPropertyValue("--text").trim();
    accent = style.getPropertyValue("--accent").trim();
  };
  const draw = () => {
    if (!active || disposed) return;
    context.clearRect(0, 0, width, height);
    for (const point of points) {
      const x = offsetX + point.x * scale;
      const y = offsetY + point.y * scale;
      const dx = pointer ? x - pointer.x : 0;
      const dy = pointer ? y - pointer.y : 0;
      const distance = Math.hypot(dx, dy);
      const influence = pointer
        ? Math.max(0, 1 - distance / Math.max(65, width * 0.12)) * strength
        : 0;
      const displacement = motion ? influence * 3 : 0;
      const isAccent =
        (point.tone === 0 && point.y % 5 === 0) || influence > 0.65;
      context.fillStyle = isAccent ? accent : text;
      context.globalAlpha = isAccent
        ? 1
        : point.tone === 2 || point.tone === 5
          ? 0.38 + influence * 0.3
          : 0.85;
      const size = 9 * scale + influence * Math.min(1, scale);
      context.fillRect(
        x - size / 2 + (dx / (distance || 1)) * displacement,
        y - size / 2 + (dy / (distance || 1)) * displacement,
        size,
        size,
      );
    }
    context.globalAlpha = 1;
  };
  const tick = (time: number) => {
    frame = 0;
    if (!active || disposed) return;
    if (pulseUntil && time >= pulseUntil) {
      pulseUntil = 0;
      target = 0;
    }
    strength += (target - strength) * 0.22;
    if (Math.abs(target - strength) < 0.002) strength = target;
    draw();
    if (strength !== target || pulseUntil) frame = requestAnimationFrame(tick);
  };
  const request = () => {
    if (!active || disposed) return;
    if (!motion) {
      strength = target;
      draw();
      return;
    }
    if (!frame) frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    if (!active || disposed) return;
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(width / FIELD.width, height / FIELD.height);
    offsetX = (width - FIELD.width * scale) / 2;
    offsetY = (height - FIELD.height * scale) / 2;
    colors();
    draw();
  };
  return {
    resize,
    point(x: number | null, y: number | null) {
      if (!active || disposed) return;
      pulseUntil = 0;
      if (x !== null && y !== null) {
        pointer = { x, y };
        target = 1;
      } else target = 0;
      request();
    },
    pulse() {
      if (!active || disposed) return;
      pointer = { x: width / 2, y: height / 2 };
      target = 1;
      // Reduced motion changes emphasis once, without displacement or a timed loop.
      pulseUntil = motion ? performance.now() + 300 : 0;
      request();
    },
    setActive(value: boolean) {
      if (disposed || value === active) return;
      active = value;
      if (!value) {
        cancelAnimationFrame(frame);
        frame = 0;
        pulseUntil = 0;
        target = strength = 0;
      } else resize();
    },
    setMotion(value: boolean) {
      motion = value;
      pulseUntil = 0;
      cancelAnimationFrame(frame);
      frame = 0;
      strength = target;
      draw();
    },
    refresh() {
      if (active && !disposed) {
        colors();
        draw();
      }
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      frame = 0;
      canvas.width = canvas.height = 0;
    },
  };
}
