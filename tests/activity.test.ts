import assert from "node:assert/strict";
import test from "node:test";
import { loadPortfolio } from "../lib/content/loadPortfolio.ts";
import { emptySnapshot, normalizeGitHubData } from "../lib/github/normalize.ts";
import {
  createActivityModel,
  filterNodes,
  visibleNodes,
  MODES,
} from "../lib/activity/model.ts";
import { calculateLayout } from "../lib/activity/layout.ts";
import type { GraphNode } from "../lib/github/types.ts";
import { createRenderer } from "../lib/activity/renderer.ts";

const portfolio = loadPortfolio();
const model = createActivityModel(
  normalizeGitHubData(emptySnapshot("fixture"), portfolio, "fallback"),
  portfolio,
);
const nodes: GraphNode[] = Array.from({ length: 900 }, (_, index) => ({
  id: `fixture:${index}`,
  kind: index % 2 ? "event" : "contribution",
  date: new Date(Date.UTC(2026, 0, 1 + (index % 365)))
    .toISOString()
    .slice(0, 10),
  count: index % 7,
  unit: index % 2 ? "events" : "contributions",
  intensity: (index % 7) / 6,
  repository: null,
  projectSlugs:
    index % 3 ? [model.projects[index % model.projects.length].slug] : [],
  language: index % 4 ? "Python" : null,
}));

test("all D3 layouts retain stable IDs and finite bounded targets at responsive widths", () => {
  const before = JSON.stringify(nodes);
  for (const width of [350, 700, 1300]) {
    const visible = visibleNodes(nodes, width, model.config);
    for (const mode of MODES) {
      const layout = calculateLayout(visible, mode, width, model.projects);
      assert.deepEqual(
        layout.nodes.map((target) => target.node.id).sort(),
        visible.map((node) => node.id).sort(),
      );
      assert.ok(
        layout.nodes.every(
          (node) =>
            Number.isFinite(node.x) &&
            Number.isFinite(node.y) &&
            node.x >= 0 &&
            node.x <= width &&
            node.y >= 0 &&
            node.y <= layout.height,
        ),
      );
      assert.ok(
        layout.labels.every(
          (label) => label.x >= 0 && label.x + label.width <= width,
        ),
      );
    }
  }
  assert.equal(JSON.stringify(nodes), before);
});

test("filtering, responsive sampling and empty data never manufacture activity", () => {
  assert.equal(
    visibleNodes(nodes, 350, model.config).length,
    portfolio.activity_graph.performance.mobile_max_nodes,
  );
  assert.deepEqual(filterNodes(nodes, "2025"), []);
  for (const mode of MODES)
    assert.deepEqual(calculateLayout([], mode, 350, model.projects).nodes, []);
  assert.equal(JSON.stringify(model).includes("GITHUB_TOKEN"), false);
});

test("unattributed contributions, unknown projects and languages remain explicitly unassigned", () => {
  assert.ok(
    calculateLayout(nodes, "projects", 1000, model.projects).labels.some(
      (label) => label.text.startsWith("Unattributed contributions"),
    ),
  );
  assert.ok(
    calculateLayout(nodes, "projects", 1000, model.projects).labels.some(
      (label) => label.text.startsWith("Other repositories"),
    ),
  );
  assert.ok(
    calculateLayout(nodes, "languages", 1000, model.projects).labels.some(
      (label) => label.text.startsWith("Language unavailable"),
    ),
  );
  assert.ok(
    calculateLayout(nodes, "projects", 1000, model.projects)
      .labels.filter((label) => label.href)
      .every((label) =>
        model.projects.some(
          (project) => label.href === `/work/${project.slug}`,
        ),
      ),
  );
});

test("imperative animation converges, cancels superseded frames and disposes cleanly", (t) => {
  const frames = new Map<number, FrameRequestCallback>();
  let next = 1;
  const globals: Record<string, unknown> = {
    window: { devicePixelRatio: 2 },
    getComputedStyle: () => ({ getPropertyValue: () => "#141512" }),
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      const id = next++;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  };
  for (const [key, value] of Object.entries(globals)) {
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
    getContext: () => ({
      setTransform() {},
      clearRect: clear,
      beginPath() {},
      rect() {},
      arc() {},
      fill() {},
      stroke() {},
    }),
  } as unknown as HTMLCanvasElement;
  const hover = t.mock.fn();
  const renderer = createRenderer(canvas, {
    reducedMotion: false,
    morph: true,
    shape: "square",
    onHover: hover,
  })!;
  for (const mode of [...MODES, ...MODES]) {
    renderer.update(
      calculateLayout(nodes.slice(0, 30), mode, 700, model.projects),
      700,
    );
    assert.equal(frames.size, 1);
  }
  const final = calculateLayout(
    nodes.slice(0, 30),
    "timeline",
    700,
    model.projects,
  ).nodes[0];
  const [id, callback] = frames.entries().next().value!;
  frames.delete(id);
  callback(performance.now() + 1000);
  assert.equal(frames.size, 0);
  assert.ok(renderer.hitTest(final.x, final.y));
  assert.equal(canvas.width, 1400);
  renderer.hover(final.node);
  renderer.hover(final.node);
  assert.equal(hover.mock.callCount(), 1);
  renderer.update(calculateLayout(nodes, "projects", 700, model.projects), 700);
  renderer.setReducedMotion(true);
  assert.equal(frames.size, 0);
  renderer.setReducedMotion(false);
  renderer.update(calculateLayout(nodes, "activity", 700, model.projects), 700);
  renderer.dispose();
  assert.equal(frames.size, 0);
  const draws = clear.mock.callCount();
  callback(performance.now() + 2000);
  assert.equal(clear.mock.callCount(), draws);
});
