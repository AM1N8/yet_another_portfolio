import type { GraphNode } from "../github/types.ts";
import type { ActivityLayout, TargetNode } from "./layout.ts";

interface MovingNode extends TargetNode {
  fromX: number;
  fromY: number;
  targetX: number;
  targetY: number;
}
export interface RendererOptions {
  reducedMotion: boolean;
  morph: boolean;
  shape: "square" | "circle";
  onHover: (node: GraphNode | null) => void;
  active?: boolean;
}
const TRANSITION_MS = 420;

export function createRenderer(
  canvas: HTMLCanvasElement,
  options: RendererOptions,
) {
  const context = canvas.getContext("2d");
  if (!context) return null;
  let nodes: MovingNode[] = [];
  let frame = 0;
  let start = 0;
  let width = 0;
  let height = 0;
  let hovered: string | null = null;
  let disposed = false;
  let active = options.active ?? true;
  let pending: { layout: ActivityLayout; width: number } | null = null;
  let reducedMotion = options.reducedMotion;
  let colors = { text: "", muted: "", accent: "" };

  function readColors() {
    const style = getComputedStyle(canvas);
    colors = {
      text: style.getPropertyValue("--text").trim(),
      muted: style.getPropertyValue("--border-strong").trim(),
      accent: style.getPropertyValue("--accent").trim(),
    };
  }
  function draw() {
    if (!context || !active || disposed) return;
    context.clearRect(0, 0, width, height);
    for (const point of nodes) {
      context.globalAlpha =
        hovered === point.node.id ? 1 : 0.35 + point.node.intensity * 0.65;
      context.fillStyle =
        hovered === point.node.id
          ? colors.accent
          : point.node.count
            ? colors.text
            : colors.muted;
      context.strokeStyle = context.fillStyle;
      const radius = point.radius + (hovered === point.node.id ? 1 : 0);
      context.beginPath();
      if (options.shape === "circle")
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      else
        context.rect(
          point.x - radius,
          point.y - radius,
          radius * 2,
          radius * 2,
        );
      if (point.node.kind === "event") context.stroke();
      else context.fill();
    }
    context.globalAlpha = 1;
  }
  function tick(now: number) {
    if (disposed || !active) return;
    const progress =
      reducedMotion ||
      !options.morph ||
      !nodes.some(
        (node) => node.fromX !== node.targetX || node.fromY !== node.targetY,
      )
        ? 1
        : Math.min(1, (now - start) / TRANSITION_MS);
    const eased = 1 - Math.pow(1 - progress, 3);
    for (const node of nodes) {
      node.x = node.fromX + (node.targetX - node.fromX) * eased;
      node.y = node.fromY + (node.targetY - node.fromY) * eased;
    }
    draw();
    frame = progress < 1 ? requestAnimationFrame(tick) : 0;
  }
  function update(layout: ActivityLayout, nextWidth: number) {
    if (disposed) return;
    if (!active) {
      pending = { layout, width: nextWidth };
      return;
    }
    cancelAnimationFrame(frame);
    width = nextWidth;
    height = layout.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const current = new Map(nodes.map((node) => [node.node.id, node]));
    nodes = layout.nodes.map((target) => {
      const previous = current.get(target.node.id);
      const fromX = previous?.x ?? target.x;
      const fromY = previous?.y ?? target.y;
      return {
        ...target,
        x: fromX,
        y: fromY,
        fromX,
        fromY,
        targetX: target.x,
        targetY: target.y,
      };
    });
    hovered = null;
    readColors();
    start = performance.now();
    tick(start);
  }
  function hitTest(x: number, y: number) {
    if (!active || disposed) return null;
    let nearest: MovingNode | null = null;
    let distance = Infinity;
    for (const point of nodes) {
      const delta = Math.hypot(point.x - x, point.y - y);
      if (delta <= Math.max(8, point.radius + 3) && delta < distance) {
        nearest = point;
        distance = delta;
      }
    }
    return nearest?.node ?? null;
  }
  function hover(node: GraphNode | null) {
    if (hovered === (node?.id ?? null)) return;
    hovered = node?.id ?? null;
    options.onHover(node);
    draw();
  }
  return {
    update,
    hitTest,
    hover,
    setActive(value: boolean) {
      if (disposed || active === value) return;
      active = value;
      cancelAnimationFrame(frame);
      frame = 0;
      if (!active) return;
      if (pending) {
        const next = pending;
        pending = null;
        update(next.layout, next.width);
      } else {
        readColors();
        for (const node of nodes) {
          node.fromX = node.x;
          node.fromY = node.y;
        }
        start = performance.now();
        tick(start);
      }
    },
    refreshTheme() {
      if (!active || disposed) return;
      readColors();
      draw();
    },
    setReducedMotion(value: boolean) {
      reducedMotion = value;
      if (value && frame && active) {
        cancelAnimationFrame(frame);
        tick(start + TRANSITION_MS);
      }
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      nodes = [];
      pending = null;
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
export type ActivityRenderer = NonNullable<ReturnType<typeof createRenderer>>;
