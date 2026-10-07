import assert from "node:assert/strict";
import { test } from "node:test";
import { loadPortfolio } from "../lib/content/loadPortfolio.ts";
import {
  findProject,
  getVisibleProjects,
  getProjectLinks,
  getProjectSections,
} from "../lib/projects.ts";

const portfolio = loadPortfolio();
test("route lookup includes non-featured visible projects and rejects hidden or unknown projects", () => {
  const input = structuredClone(portfolio);
  const project = input.projects.entries[0]!;
  assert.equal(findProject(input, project.slug), project);
  assert.ok(getVisibleProjects(input).some((entry) => !entry.featured));
  project.visible = false;
  assert.equal(findProject(input, project.slug), undefined);
  assert.equal(findProject(input, "missing-project"), undefined);
});

test("case-study sections omit null, missing, blank and empty content", () => {
  const project = structuredClone(portfolio.projects.entries[0]!);
  assert.ok(
    getProjectSections(project).some((section) => section.id === "problem"),
  );
  project.problem = "  ";
  project.why_it_matters = undefined;
  project.approach = null;
  assert.deepEqual(getProjectSections(project), []);
  project.lessons = "A supplied lesson";
  project.challenges = ["A supplied challenge"];
  assert.deepEqual(
    getProjectSections(project).map((section) => section.id),
    ["challenges", "lessons"],
  );
});

test("project links omit unavailable actions and retain supplied custom links", () => {
  const project = structuredClone(portfolio.projects.entries[0]!);
  assert.deepEqual(
    getProjectLinks(project).map((link) => link.label),
    ["Repository"],
  );
  project.links = null;
  assert.deepEqual(getProjectLinks(project), []);
  project.links = { other: [{ label: "Notes", url: "/notes.pdf" }] };
  assert.deepEqual(getProjectLinks(project), project.links.other);
});
