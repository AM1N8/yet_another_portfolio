import { createSignaturePoints } from "../signature/geometry.ts";

export interface MorphPoint {
  x: number;
  y: number;
}
export const HOLD_MS = 1400;
export const MORPH_MS = 1100;
export const CYCLE_MS = HOLD_MS + MORPH_MS;

export function particleCount(width: number, viewportWidth: number) {
  return viewportWidth < 768 ? 140 : width < 420 ? 180 : 245;
}

const noise = (index: number) => {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

// Sample the existing original contours, then match nearby cells across shapes.
// Identity is retained for the entire cycle; no particles enter or leave a morph.
export function createMorphTargets(count: number): MorphPoint[][] {
  const source = createSignaturePoints();
  const targets: MorphPoint[][] = [];
  for (let letter = 0; letter < 4; letter++) {
    const cells = source.filter((point) => point.letter === letter);
    const candidates = Array.from({ length: count }, (_, index) => {
      const cell = cells[Math.floor((index * cells.length) / count)];
      return {
        x:
          240 +
          (cell.x - 59 - letter * 238 - 98) * 1.22 +
          (noise(index * 2) - 0.5) * 5,
        y: 240 + (cell.y - 220) * 1.08 + (noise(index * 2 + 1) - 0.5) * 5,
      };
    });
    if (!letter) {
      targets.push(candidates);
      continue;
    }
    const remaining = new Set(candidates.map((_, index) => index));
    targets.push(
      targets[letter - 1].map((previous) => {
        let nearest = 0;
        let distance = Infinity;
        for (const index of remaining) {
          const point = candidates[index];
          const squared =
            (point.x - previous.x) ** 2 + (point.y - previous.y) ** 2;
          if (squared < distance) {
            distance = squared;
            nearest = index;
          }
        }
        remaining.delete(nearest);
        return candidates[nearest];
      }),
    );
  }
  return targets;
}

interface FluidCell extends MorphPoint {
  vx: number;
  vy: number;
  size: number;
}

const SHOCKWAVE_MS = 650;
const SHOCKWAVE_RADIUS = 140;
const SHOCKWAVE_BAND = 26;
const MAX_SHOCKWAVES = 6;

export function createFluidSimulation(count: number, elapsed = 0) {
  const targets = createMorphTargets(count);
  const particles: FluidCell[] = targets[
    Math.floor(elapsed / CYCLE_MS) % 4
  ].map((point, index) => ({
    ...point,
    vx: 0,
    vy: 0,
    size: 6.8 + noise(index + 20) ** 2 * 4.2,
  }));
  let previousLetter = Math.floor(elapsed / CYCLE_MS) % 4;
  let currentTime = elapsed;
  const shockwaves: (MorphPoint & { startedAt: number })[] = [];
  return {
    particles,
    shockwave(point: MorphPoint) {
      if (!Number.isFinite(point.x + point.y)) return;
      if (shockwaves.length === MAX_SHOCKWAVES) shockwaves.shift();
      shockwaves.push({ ...point, startedAt: currentTime });
    },
    clearShockwaves() {
      shockwaves.length = 0;
    },
    step(time: number, delta: number, pointer: MorphPoint | null) {
      currentTime = time;
      while (
        shockwaves.length &&
        time - shockwaves[0].startedAt >= SHOCKWAVE_MS
      )
        shockwaves.shift();
      const phase = time % CYCLE_MS;
      const transitioning = phase >= HOLD_MS;
      const progress = transitioning ? (phase - HOLD_MS) / MORPH_MS : 1;
      const letter = (Math.floor(time / CYCLE_MS) + Number(transitioning)) % 4;
      const changed = letter !== previousLetter;
      previousLetter = letter;
      const dt = Math.min(delta / (1000 / 60), 2);
      const damping = 0.87 ** dt;
      const attraction = transitioning ? 0.015 + progress * 0.04 : 0.055;
      for (let index = 0; index < particles.length; index++) {
        const cell = particles[index];
        const target = targets[letter][index];
        const angle = index * 2.399963;
        if (changed) {
          // A small tangential impulse loosens the old contour before it reforms.
          cell.vx += Math.cos(angle) * 4.5;
          cell.vy += Math.sin(angle) * 4.5;
        }
        const idle = Math.sin(time * 0.0008 + index) * 0.6;
        cell.vx += (target.x + idle - cell.x) * attraction * dt;
        cell.vy += (target.y - cell.y) * attraction * dt;
        if (pointer) {
          let dx = cell.x - pointer.x;
          let dy = cell.y - pointer.y;
          let distance = Math.hypot(dx, dy);
          if (distance < 0.01) {
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            distance = 1;
          }
          if (distance < 65) {
            const push = (1 - distance / 65) ** 2 * 5;
            cell.vx += (dx / distance) * push * dt;
            cell.vy += (dy / distance) * push * dt;
            const overlap = 28 + cell.size / 2 - distance;
            if (overlap > 0) {
              cell.x += (dx / distance) * overlap * 0.55;
              cell.y += (dy / distance) * overlap * 0.55;
            }
          }
        }
        for (const wave of shockwaves) {
          const progress = (time - wave.startedAt) / SHOCKWAVE_MS;
          let dx = cell.x - wave.x;
          let dy = cell.y - wave.y;
          let distance = Math.hypot(dx, dy);
          if (distance < 0.01) {
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            distance = 1;
          }
          // An expanding annulus pushes outward from the actual activation point.
          // Its bounded lifetime/radius let contour attraction restore the cells.
          const band = Math.max(
            0,
            1 -
              Math.abs(distance - progress * SHOCKWAVE_RADIUS) / SHOCKWAVE_BAND,
          );
          const push = band ** 2 * (1 - progress) * 18 * dt;
          cell.vx += (dx / distance) * push;
          cell.vy += (dy / distance) * push;
        }
        cell.vx = Math.max(-12, Math.min(12, cell.vx * damping));
        cell.vy = Math.max(-12, Math.min(12, cell.vy * damping));
        cell.x += cell.vx * dt;
        cell.y += cell.vy * dt;
      }
      // A local spatial hash keeps collisions bounded instead of testing every pair.
      for (let pass = 0; pass < 2; pass++) {
        const buckets = new Map<number, number[]>();
        for (let index = 0; index < particles.length; index++) {
          const cell = particles[index];
          const column = Math.floor(cell.x / 18);
          const row = Math.floor(cell.y / 18);
          for (let x = column - 1; x <= column + 1; x++) {
            for (let y = row - 1; y <= row + 1; y++) {
              for (const otherIndex of buckets.get(x + y * 64) ?? []) {
                const other = particles[otherIndex];
                const dx = cell.x - other.x;
                const dy = cell.y - other.y;
                const distance = Math.hypot(dx, dy) || 0.01;
                const overlap = (cell.size + other.size) / 2 + 1.2 - distance;
                if (overlap <= 0) continue;
                const pushX = (dx / distance) * overlap * 0.35;
                const pushY = (dy / distance) * overlap * 0.35;
                cell.x += pushX;
                cell.y += pushY;
                other.x -= pushX;
                other.y -= pushY;
                cell.vx += pushX * 0.08;
                cell.vy += pushY * 0.08;
                other.vx -= pushX * 0.08;
                other.vy -= pushY * 0.08;
              }
            }
          }
          const key = column + row * 64;
          const bucket = buckets.get(key);
          if (bucket) bucket.push(index);
          else buckets.set(key, [index]);
          cell.x = Math.max(24, Math.min(456, cell.x));
          cell.y = Math.max(24, Math.min(430, cell.y));
        }
      }
    },
  };
}

export function staticMorphPoints(): MorphPoint[] {
  return createSignaturePoints()
    .filter((_, index) => index % 2 === 0)
    .map(({ x, y }) => ({
      x: 40 + x * 0.4,
      y: 145 + y * 0.4,
    }));
}

export function createMorphRenderer(
  canvas: HTMLCanvasElement,
  motionEnabled: boolean,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  let active = false;
  let disposed = false;
  let moving = motionEnabled;
  let paused = false;
  let frame = 0;
  let elapsed = 0;
  let lastTime: number | null = null;
  let width = 0;
  let simulation: ReturnType<typeof createFluidSimulation> | undefined;
  let pointer: MorphPoint | null = null;
  let palette: string[] = [];
  const staticPoints = staticMorphPoints();
  const colors = () => {
    const style = getComputedStyle(canvas);
    const parse = (name: string) =>
      style
        .getPropertyValue(name)
        .trim()
        .replace("#", "")
        .match(/.{2}/g)!
        .map((part) => parseInt(part, 16));
    const bg = parse("--bg"),
      accent = parse("--accent"),
      text = parse("--text");
    const ink = bg[0] < 100;
    palette = Array.from({ length: 9 }, (_, tone) => {
      const dark = !ink && tone === 0;
      const amount = dark
        ? 0.62
        : (ink ? 0.3 : 0.24) + tone * (ink ? 0.075 : 0.052);
      const color = dark ? text : accent;
      return `rgb(${bg.map((channel, index) => Math.round(channel + (color[index] - channel) * amount)).join(",")})`;
    });
  };
  const draw = () => {
    if (!active || disposed || !width) return;
    context.clearRect(0, 0, width, width);
    const scale = width / 480;
    const count = moving ? simulation!.particles.length : staticPoints.length;
    for (let tone = 0; tone < 9; tone++) {
      context.fillStyle = palette[tone];
      context.beginPath();
      for (let index = tone; index < count; index += 9) {
        const point = moving
          ? simulation!.particles[index]
          : staticPoints[index];
        const size = (moving ? simulation!.particles[index].size : 3.4) * scale;
        context.roundRect(
          point.x * scale - size / 2,
          point.y * scale - size / 2,
          size,
          size,
          size * 0.22,
        );
      }
      context.fill();
    }
  };
  const tick = (time: number) => {
    frame = 0;
    if (!active || !moving || paused || disposed) return;
    const delta = lastTime === null ? 1000 / 60 : Math.min(time - lastTime, 48);
    elapsed += delta;
    lastTime = time;
    const steps = Math.ceil(delta / (1000 / 60));
    for (let step = 0; step < steps; step++)
      simulation!.step(
        elapsed - delta + ((step + 1) * delta) / steps,
        delta / steps,
        pointer,
      );
    draw();
    frame = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = null;
  };
  const schedule = () => {
    if (active && moving && !paused && !frame && !disposed)
      frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    if (!active || disposed) return;
    width = canvas.getBoundingClientRect().width;
    if (!width) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(width * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = particleCount(width, window.innerWidth);
    if (simulation?.particles.length !== count)
      simulation = createFluidSimulation(count, elapsed);
    colors();
    draw();
    schedule();
  };
  return {
    resize,
    setPointer(point: MorphPoint | null) {
      if (!active || !moving || paused || disposed) return;
      pointer = point;
    },
    shockwave(point: MorphPoint) {
      if (!active || !moving || disposed) return;
      paused = false;
      pointer = null;
      simulation?.shockwave(point);
      schedule();
    },
    setPaused(value: boolean) {
      if (disposed || paused === value) return;
      paused = value;
      pointer = null;
      stop();
      schedule();
    },
    refresh() {
      if (active && !disposed) {
        colors();
        draw();
      }
    },
    setActive(value: boolean) {
      if (disposed || active === value) return;
      active = value;
      if (active) resize();
      else {
        pointer = null;
        stop();
      }
    },
    setMotion(value: boolean) {
      if (disposed || moving === value) return;
      moving = value;
      pointer = null;
      simulation?.clearShockwaves();
      stop();
      draw();
      schedule();
    },
    dispose() {
      disposed = true;
      active = false;
      stop();
      simulation = undefined;
      pointer = null;
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
