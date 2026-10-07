import assert from "node:assert/strict";
import { test } from "node:test";
import { loadPortfolio } from "../lib/content/loadPortfolio.ts";
import {
  getSelectedProjects,
  getExperiments,
  getTimelineEvents,
  getHomepageSections,
  getPublicLinks,
} from "../lib/homepage.ts";

const portfolio = loadPortfolio();

test("featured projects honor visibility, order and the configured limit without modifying source data", () => {
  const input = structuredClone(portfolio);
  input.projects.entries.reverse();
  const before = structuredClone(input.projects.entries);
  assert.deepEqual(
    getSelectedProjects(input).map((project) => project.slug),
    ["noor-alerts", "proact-cmms", "musiq", "hirfati"],
  );
  assert.deepEqual(input.projects.entries, before);
  input.homepage.selected_project_count = 2;
  input.projects.entries.find(
    (project) => project.slug === "noor-alerts",
  )!.visible = false;
  assert.deepEqual(
    getSelectedProjects(input).map((project) => project.slug),
    ["proact-cmms", "musiq"],
  );
});

test("empty or hidden content removes sections, while Stack stays independent of About", () => {
  const input = structuredClone(portfolio);
  assert.deepEqual(getHomepageSections(input), [
    "hero",
    "activity",
    "work",
    "lab",
    "timeline",
    "about",
    "stack",
    "contact",
  ]);
  input.projects.entries = [];
  input.experiments.entries = [];
  input.timeline.events = [];
  input.about.visible = false;
  input.activity_graph.enabled = false;
  assert.deepEqual(getHomepageSections(input), ["hero", "stack", "contact"]);
  input.skills.groups = [];
  input.contact.email_public = false;
  input.contact.links = {
    ...input.contact.links,
    github: null,
    linkedin: null,
    personal_blog: null,
  };
  assert.deepEqual(getHomepageSections(input), ["hero"]);
});

test("experiment counts and timeline filters preserve only available content", () => {
  const input = structuredClone(portfolio);
  input.experiments.entries.reverse();
  input.homepage.experiment_count = 1;
  assert.equal(getExperiments(input)[0]?.slug, "datatui");
  input.experiments.visible = false;
  assert.deepEqual(getExperiments(input), []);
  input.homepage.show_education_in_timeline = false;
  input.experience.visible = false;
  input.activities.visible = false;
  const events = getTimelineEvents(input);
  assert.ok(events.length > 0);
  assert.ok(events.every((event) => event.type === "award"));
});

test("public link lists omit null fields and respect resume visibility", () => {
  const input = structuredClone(portfolio);
  assert.ok(!getPublicLinks(input).some((link) => link.label === "Résumé"));
  input.contact.resume.url = "/resume.pdf";
  assert.ok(getPublicLinks(input).some((link) => link.url === "/resume.pdf"));
  input.contact.resume.visible = false;
  assert.ok(!getPublicLinks(input).some((link) => link.url === "/resume.pdf"));
});
