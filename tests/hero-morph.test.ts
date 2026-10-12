import assert from "node:assert/strict";
import test from "node:test";
import {
  createMorphTargets,
  createFluidSimulation,
  particleCount,
  createMorphRenderer,
  CYCLE_MS,
} from "../lib/hero/morph.ts";

test("persistent force-driven cells stay bounded and settle into all four contours", () => {
  const targets = createMorphTargets(180);
  assert.deepEqual(targets, createMorphTargets(180));
  assert.equal(targets.length, 4);
  for (let letter = 0; letter < 4; letter++) {
    assert.equal(targets[letter].length, 180);
    assert.equal(
      new Set(targets[letter].map(({ x, y }) => `${x}:${y}`)).size,
      180,
    );
  }
  const simulation = createFluidSimulation(180);
  let elapsed = 0;
  for (let cycle = 0; cycle < 8; cycle++) {
    const until = cycle * CYCLE_MS + 1000;
    for (; elapsed < until; elapsed += 1000 / 60) {
      simulation.step(elapsed, 1000 / 60, null);
      for (const point of simulation.particles) {
        assert.ok(Number.isFinite(point.x + point.y + point.vx + point.vy));
        assert.ok(
          point.x >= 24 && point.x <= 456 && point.y >= 24 && point.y <= 430,
        );
      }
    }
    const averageError =
      simulation.particles.reduce((sum, point, index) => {
        const target = targets[cycle % 4][index];
        return sum + Math.hypot(point.x - target.x, point.y - target.y);
      }, 0) / 180;
    assert.ok(averageError < 8, `contour ${cycle % 4}: ${averageError}`);
  }
  assert.equal(particleCount(480, 1440), 245);
  assert.equal(particleCount(400, 768), 180);
  assert.equal(particleCount(320, 390), 140);
});

test("cursor collision displaces nearby cells and attraction restores them after it leaves", () => {
  const baseline = createFluidSimulation(245);
  const interactive = createFluidSimulation(245);
  const pointer = { x: 125, y: 240 };
  for (let time = 0; time < 1500; time += 1000 / 60) {
    baseline.step(time, 1000 / 60, null);
    interactive.step(
      time,
      1000 / 60,
      time >= 400 && time < 1000 ? pointer : null,
    );
    if (time > 950 && time < 975) {
      const nearby = baseline.particles
        .map((cell, index) => ({ cell, index }))
        .filter(
          ({ cell }) => Math.hypot(cell.x - pointer.x, cell.y - pointer.y) < 25,
        );
      assert.ok(nearby.length > 3);
      for (const { index } of nearby) {
        const cell = interactive.particles[index];
        assert.ok(Math.hypot(cell.x - pointer.x, cell.y - pointer.y) > 27);
      }
    }
  }
  const error =
    interactive.particles.reduce(
      (sum, cell, index) =>
        sum +
        Math.hypot(
          cell.x - baseline.particles[index].x,
          cell.y - baseline.particles[index].y,
        ),
      0,
    ) / 245;
  assert.ok(error < 2, `return-to-contour error: ${error}`);
});

test("shockwaves expand from their exact point, stay local and recover without changing the morph cycle", () => {
  const baseline = createFluidSimulation(245);
  const interactive = createFluidSimulation(245);
  const origin = { x: 125, y: 240 };
  const targets = createMorphTargets(245);
  const distance = (point: { x: number; y: number }) =>
    Math.hypot(point.x - origin.x, point.y - origin.y);
  const nearby = targets[0]
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => distance(point) < 25)
    .map(({ index }) => index);
  const distant = targets[0]
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => distance(point) > 220)
    .map(({ index }) => index);
  assert.ok(nearby.length > 3 && distant.length > 3);
  for (let frame = 0; frame < 80; frame++) {
    const time = frame * (1000 / 60);
    if (frame === 12) interactive.shockwave(origin);
    baseline.step(time, 1000 / 60, null);
    interactive.step(time, 1000 / 60, null);
    if (frame === 18) {
      const displacement =
        nearby.reduce(
          (sum, index) =>
            sum +
            distance(interactive.particles[index]) -
            distance(baseline.particles[index]),
          0,
        ) / nearby.length;
      assert.ok(displacement > 15, `outward displacement: ${displacement}`);
      for (const index of distant) {
        assert.deepEqual(
          interactive.particles[index],
          baseline.particles[index],
        );
      }
    }
  }
  const recovery =
    interactive.particles.reduce(
      (sum, point, index) =>
        sum +
        Math.hypot(
          point.x - baseline.particles[index].x,
          point.y - baseline.particles[index].y,
        ),
      0,
    ) / 245;
  assert.ok(recovery < 2, `recovery: ${recovery}`);
  for (let frame = 80; frame < 210; frame++) {
    interactive.step(frame * (1000 / 60), 1000 / 60, null);
  }
  const contourError =
    interactive.particles.reduce(
      (sum, point, index) =>
        sum +
        Math.hypot(
          point.x - targets[1][index].x,
          point.y - targets[1][index].y,
        ),
      0,
    ) / 245;
  assert.ok(contourError < 8, `morph continues to D: ${contourError}`);

  const bounded = createFluidSimulation(140);
  const repeated = createFluidSimulation(140);
  for (let index = 0; index < 6; index++) bounded.shockwave(origin);
  for (let index = 0; index < 100; index++) repeated.shockwave(origin);
  repeated.shockwave({ x: NaN, y: 0 });
  for (let frame = 0; frame < 120; frame++) {
    bounded.step(frame * (1000 / 60), 1000 / 60, null);
    repeated.step(frame * (1000 / 60), 1000 / 60, null);
  }
  assert.deepEqual(repeated.particles, bounded.particles);
});

test("morph renderer owns one RAF, preserves paused time, respects DPR and fully stops in static/disposed states", (t) => {
  const frames = new Map<number, FrameRequestCallback>();
  let next = 1;
  for (const [key, value] of Object.entries({
    devicePixelRatio: 3,
    window: { innerWidth: 1440 },
    getComputedStyle: () => ({
      getPropertyValue: (name: string) =>
        name === "--accent" ? "#49df68" : "#0f100e",
    }),
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      const id = next++;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
  const clear = t.mock.fn();
  const roundRect = t.mock.fn();
  const canvas = {
    width: 0,
    height: 0,
    getBoundingClientRect: () => ({ width: 480 }),
    getContext: () => ({
      setTransform() {},
      clearRect: clear,
      beginPath() {},
      roundRect,
      fill() {},
    }),
  } as unknown as HTMLCanvasElement;
  const renderer = createMorphRenderer(canvas, true)!;
  assert.equal(frames.size, 0);
  renderer.setActive(true);
  assert.equal(canvas.width, 960);
  assert.equal(frames.size, 1);
  renderer.shockwave({ x: 125, y: 240 });
  assert.equal(frames.size, 1);
  for (const time of [0, 16, 32]) {
    const [id, callback] = frames.entries().next().value!;
    frames.delete(id);
    callback(time);
    assert.equal(frames.size, 1);
  }
  renderer.setActive(false);
  const paused = clear.mock.callCount();
  renderer.resize();
  renderer.refresh();
  assert.equal(clear.mock.callCount(), paused);
  assert.equal(frames.size, 0);
  renderer.setActive(true);
  renderer.setPaused(true);
  assert.equal(frames.size, 0);
  const frozen = clear.mock.callCount();
  renderer.setPointer({ x: 120, y: 240 });
  assert.equal(clear.mock.callCount(), frozen);
  renderer.shockwave({ x: 120, y: 240 });
  assert.equal(frames.size, 1);
  renderer.setMotion(false);
  assert.equal(frames.size, 0);
  renderer.shockwave({ x: 120, y: 240 });
  assert.equal(frames.size, 0);
  assert.ok(roundRect.mock.callCount() > 360);
  renderer.setMotion(true);
  assert.equal(frames.size, 1);
  renderer.dispose();
  renderer.resize();
  renderer.setActive(true);
  assert.equal(frames.size, 0);
  assert.equal(canvas.width, 0);
  assert.equal(
    createMorphRenderer(
      { getContext: () => null } as unknown as HTMLCanvasElement,
      true,
    ),
    undefined,
  );
});
