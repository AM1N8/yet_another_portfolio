import assert from "node:assert/strict";
import test from "node:test";
import {
  createSignaturePoints,
  cellPath,
  FIELD,
} from "../lib/signature/geometry.ts";
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
