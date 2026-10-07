import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { stringify } from "yaml";
import {
  loadPortfolio,
  parsePortfolioYaml,
} from "../lib/content/loadPortfolio.ts";
import { portfolioSchema } from "../lib/content/schema.ts";
import type { Portfolio } from "../lib/content/types.ts";

const source = readFileSync(
  join(process.cwd(), "content/portfolio.yaml"),
  "utf8",
);
const portfolio: Portfolio = parsePortfolioYaml(source);

test("the repository YAML loads without losing content or precision", () => {
  assert.deepEqual(loadPortfolio(), portfolio);
  assert.equal(portfolioSchema.safeParse(portfolio).success, true);
  const serialized = stringify(portfolio);
  assert.deepEqual(parsePortfolioYaml(serialized), portfolio);
});

test("nullable, empty, and missing optional content remains usable", () => {
  const input = structuredClone(portfolio);
  input.site.repository_url = null;
  input.contact.resume.url = "";
  delete input.identity.pronouns;
  delete input.projects.entries[0].media;
  input.projects.entries[0].architecture = null;
  input.experiments.entries = [];
  const result = parsePortfolioYaml(stringify(input));
  assert.equal(result.site.repository_url, null);
  assert.equal(result.contact.resume.url, "");
  assert.equal(result.identity.pronouns, undefined);
  assert.equal(result.projects.entries[0].media, undefined);
  assert.equal(result.projects.entries[0].architecture, null);
  assert.deepEqual(result.experiments.entries, []);
});

test("missing required content reports source and field path", () => {
  const { full_name: omitted, ...identity } = portfolio.identity;
  assert.ok(omitted);
  assert.throws(
    () =>
      parsePortfolioYaml(stringify({ ...portfolio, identity }), "invalid.yaml"),
    /Invalid portfolio content in invalid.yaml:[\s\S]*identity.full_name/,
  );
});

test("nested type errors and unsafe links include actionable paths", () => {
  const input = structuredClone(portfolio);
  input.projects.entries[0].year = "2026" as unknown as number;
  input.contact.links.github = "javascript:alert(1)";
  assert.throws(
    () => parsePortfolioYaml(stringify(input)),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /projects.entries.0.year/);
      assert.match(error.message, /contact.links.github/);
      return true;
    },
  );
});

test("invalid dates and duplicate slugs are rejected", () => {
  const input = structuredClone(portfolio);
  input.education.entries[0].start_date = "2026-02-30";
  assert.throws(
    () => parsePortfolioYaml(stringify(input)),
    /education.entries.0.start_date/,
  );
  input.education.entries[0].start_date =
    portfolio.education.entries[0].start_date;
  input.projects.entries[1].slug = input.projects.entries[0].slug;
  assert.throws(
    () => parsePortfolioYaml(stringify(input)),
    /projects.entries.1.slug: Duplicate slug/,
  );
});

test("malformed YAML and duplicate keys report YAML errors", () => {
  assert.throws(
    () => parsePortfolioYaml("site: ["),
    /Invalid YAML in content\/portfolio.yaml/,
  );
  assert.throws(
    () => parsePortfolioYaml("site: 1\nsite: 2"),
    /Map keys must be unique/,
  );
});

test("unknown keys are rejected rather than silently discarded", () => {
  assert.throws(
    () =>
      parsePortfolioYaml(stringify({ ...portfolio, misspelled_section: true })),
    /Unrecognized key.*misspelled_section/,
  );
});
