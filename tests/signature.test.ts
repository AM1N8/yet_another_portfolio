import assert from "node:assert/strict";
import test from "node:test";
import {
  createSignaturePoints,
  cellPath,
  FIELD,
} from "../lib/signature/geometry.ts";
import { createSignatureRenderer } from "../lib/signature/renderer.ts";
import { loadPortfolio } from "../lib/content/loadPortfolio.ts";
import { getHomepageSections } from "../lib/homepage.ts";

test("the signature has four dense deterministic contours with bounded, unique cells", () => {
  const points = createSignaturePoints();
  assert.deepEqual(points, createSignaturePoints());
  assert.ok(points.length > 500 && points.length < 1000);
  assert.equal(
    new Set(points.map(({ x, y }) => `${x}:${y}`)).size,
    points.length,
  );
  for (const letter of [0, 1, 2, 3])
    assert.ok(points.filter((point) => point.letter === letter).length > 100);
  assert.ok(
    points.every(
      ({ x, y }) => x > 0 && x < FIELD.width && y > 0 && y < FIELD.height,
    ),
  );
  const paths = ["solid", "soft", "accent"].map((tone) =>
    cellPath(points, tone as "solid" | "soft" | "accent"),
  );
  assert.equal(paths.join("").split("M").length - 1, points.length);
});

test("the retired activity slot stays out of homepage content regardless of GitHub settings", () => {
  const portfolio = structuredClone(loadPortfolio());
  portfolio.activity_graph.enabled = false;
  portfolio.activity_graph.views = {
    activity: false,
    projects: false,
    languages: false,
    timeline: false,
  };
  assert.ok(
    !getHomepageSections(portfolio).some(
      (section) => String(section) === "activity",
    ),
  );
  portfolio.hero.show_activity_visual = false;
  assert.equal(getHomepageSections(portfolio)[1], "work");
});

test("renderer settles, pauses, resumes, stays static with reduced motion and disposes", (t) => {
  const frames = new Map<number, FrameRequestCallback>();
  let next = 1;
  for (const [key, value] of Object.entries({
    devicePixelRatio: 3,
    getComputedStyle: () => ({ getPropertyValue: () => "#141512" }),
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
  const canvas = {
    width: 0,
    height: 0,
    getBoundingClientRect: () => ({ width: 1000, height: 440 }),
    getContext: () => ({ setTransform() {}, clearRect: clear, fillRect() {} }),
  } as unknown as HTMLCanvasElement;
  const renderer = createSignatureRenderer(canvas, true)!;
  renderer.setActive(true);
  assert.equal(canvas.width, 2000);
  assert.equal(frames.size, 0);
  renderer.point(300, 200);
  assert.equal(frames.size, 1);
  for (let step = 0; frames.size && step < 100; step++) {
    const [id, callback] = frames.entries().next().value!;
    frames.delete(id);
    callback(performance.now() + step * 16);
  }
  assert.equal(frames.size, 0);
  renderer.pulse();
  renderer.setActive(false);
  const paused = clear.mock.callCount();
  renderer.resize();
  renderer.refresh();
  renderer.point(10, 10);
  assert.equal(clear.mock.callCount(), paused);
  assert.equal(frames.size, 0);
  renderer.setActive(true);
  renderer.setMotion(false);
  renderer.pulse();
  assert.equal(frames.size, 0);
  renderer.dispose();
  renderer.resize();
  assert.equal(canvas.width, 0);
  assert.equal(frames.size, 0);
  assert.equal(
    createSignatureRenderer(
      { getContext: () => null } as unknown as HTMLCanvasElement,
      false,
    ),
    undefined,
  );
});
